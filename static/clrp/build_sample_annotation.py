"""Build the `sample_annotation` table: one row per precomputed sample.

Run from the project root (/var/www/html/CLRP) in the `cellhit` environment:

    python build_sample_annotation.py            # dry run: print the summary only
    python build_sample_annotation.py --write    # replace the table in MySQL

Sources:
    - CCLE (ACH-...): DepMap Model.csv (cell line name, OncoTree code, disease, lineage).
    - TCGA: tcga_oncotree_data.csv (TCGA code, OncoTree code, tissue).
    - TCGA, TARGET, Treehouse: Treehouse clinical file (disease).
    - Tissue for samples without one: learned from TCGA disease -> tissue pairs,
      then disease_tissue_manual.csv for diseases absent from TCGA.
"""

import argparse

import pandas as pd
from sqlalchemy import (
    Column, Index, MetaData, String, Table, create_engine, select, text, union,
)

TABLE_NAME = "sample_annotation"
CHUNK_SIZE = 1000

metadata = MetaData()
sample_annotation = Table(
    TABLE_NAME,
    metadata,
    Column("sample_index", String(100), primary_key=True),
    Column("source", String(40), nullable=False),
    Column("cell_line_name", String(200)),
    Column("tcga_code", String(20)),
    Column("oncotree_code", String(20)),
    Column("disease", String(400)),
    Column("tissue", String(100)),
    # Where the tissue comes from: oncotree, depmap, learned, manual, manual_uncertain
    Column("tissue_source", String(20)),
    Index("ix_sample_annotation_tissue", "tissue"),
    Index("ix_sample_annotation_tcga_code", "tcga_code"),
    Index("ix_sample_annotation_oncotree_code", "oncotree_code"),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model", default="src/Model.csv")
    parser.add_argument("--tcga-oncotree", default="src/tcga_oncotree_data.csv")
    parser.add_argument("--clinical", default="src/clinical_TumorCompendium_v11_PolyA_2020-04-09.tsv.gz")
    parser.add_argument("--manual", default="src/disease_tissue_manual.csv")
    parser.add_argument("--db-url", default=None, help="SQLAlchemy URL; defaults to the API database")
    parser.add_argument("--write", action="store_true", help="Replace the table in the database")
    return parser.parse_args()


def get_engine(db_url: str | None):
    if db_url:
        return create_engine(db_url)
    from model.database import engine
    return engine


def load_samples(engine) -> pd.DataFrame:
    """All distinct samples of the precomputed GDSC and PRISM tables."""
    gdsc = Table("gdsc", MetaData(), autoload_with=engine)
    prism = Table("prism", MetaData(), autoload_with=engine)
    query = union(
        select(gdsc.c.sample_index, gdsc.c.source).distinct(),
        select(prism.c.sample_index, prism.c.source).distinct(),
    )
    with engine.connect() as conn:
        rows = conn.execute(query).fetchall()
    samples = pd.DataFrame(rows, columns=["sample_index", "source"]).drop_duplicates("sample_index")
    return samples.reset_index(drop=True)


def build(samples: pd.DataFrame, args: argparse.Namespace) -> pd.DataFrame:
    model = pd.read_csv(args.model, usecols=[
        "ModelID", "CellLineName", "OncotreeCode", "OncotreePrimaryDisease", "OncotreeLineage",
    ]).rename(columns={
        "ModelID": "sample_index",
        "CellLineName": "cell_line_name",
        "OncotreeCode": "ccle_oncotree_code",
        "OncotreePrimaryDisease": "ccle_disease",
        "OncotreeLineage": "ccle_tissue",
    })
    tcga = pd.read_csv(args.tcga_oncotree, usecols=[
        "sample_id", "oncotree_code", "tcga_cancer_acronym", "tissue_type",
    ]).rename(columns={
        "sample_id": "sample_index",
        "oncotree_code": "tcga_oncotree_code",
        "tcga_cancer_acronym": "tcga_code",
        "tissue_type": "tcga_tissue",
    }).drop_duplicates("sample_index")
    clinical = pd.read_csv(args.clinical, sep="\t", usecols=["th_sampleid", "disease"]).rename(
        columns={"th_sampleid": "sample_index", "disease": "clinical_disease"}
    ).drop_duplicates("sample_index")
    manual = pd.read_csv(args.manual)

    df = (samples
          .merge(model, on="sample_index", how="left")
          .merge(tcga, on="sample_index", how="left")
          .merge(clinical, on="sample_index", how="left"))

    df["oncotree_code"] = df["tcga_oncotree_code"].fillna(df["ccle_oncotree_code"])
    df["disease"] = df["clinical_disease"].fillna(df["ccle_disease"])

    # Tissue from the annotated sources
    df["tissue"] = df["tcga_tissue"]
    df.loc[df["tissue"].notna(), "tissue_source"] = "oncotree"
    from_depmap = df["tissue"].isna() & df["ccle_tissue"].notna()
    df.loc[from_depmap, "tissue"] = df.loc[from_depmap, "ccle_tissue"]
    df.loc[from_depmap, "tissue_source"] = "depmap"

    # Disease -> tissue learned from samples that have both (the most frequent tissue)
    known = df.dropna(subset=["clinical_disease", "tcga_tissue"])
    learned = known.groupby("clinical_disease")["tcga_tissue"].agg(lambda s: s.value_counts().index[0])
    from_learned = df["tissue"].isna() & df["clinical_disease"].isin(learned.index)
    df.loc[from_learned, "tissue"] = df.loc[from_learned, "clinical_disease"].map(learned)
    df.loc[from_learned, "tissue_source"] = "learned"

    # Manual mapping for diseases absent from TCGA
    manual = manual.dropna(subset=["tissue"])
    manual_tissue = dict(zip(manual["disease"], manual["tissue"]))
    manual_confident = dict(zip(manual["disease"], manual["confident"].str.lower() == "yes"))
    from_manual = df["tissue"].isna() & df["clinical_disease"].isin(manual_tissue)
    df.loc[from_manual, "tissue"] = df.loc[from_manual, "clinical_disease"].map(manual_tissue)
    df.loc[from_manual, "tissue_source"] = df.loc[from_manual, "clinical_disease"].map(
        lambda disease: "manual" if manual_confident[disease] else "manual_uncertain"
    )

    columns = [column.name for column in sample_annotation.columns]
    return df[columns]


def print_summary(df: pd.DataFrame) -> None:
    family = df["sample_index"].str.extract(r"^([A-Za-z]+)")[0].rename("family")
    summary = pd.DataFrame({
        "samples": df.groupby(family).size(),
        "disease": df["disease"].notna().groupby(family).sum(),
        "tissue": df["tissue"].notna().groupby(family).sum(),
        "tcga_code": df["tcga_code"].notna().groupby(family).sum(),
        "oncotree_code": df["oncotree_code"].notna().groupby(family).sum(),
    })
    print(summary.to_string())
    print("\ntissue_source:\n" + df["tissue_source"].value_counts(dropna=False).to_string())
    print("\nsamples without tissue, by disease:")
    print(df.loc[df["tissue"].isna(), "disease"].value_counts(dropna=False).head(20).to_string())


def write(engine, df: pd.DataFrame) -> None:
    records = df.astype(object).where(df.notna(), None).to_dict("records")
    with engine.begin() as conn:
        sample_annotation.drop(conn, checkfirst=True)
        sample_annotation.create(conn)
        for start in range(0, len(records), CHUNK_SIZE):
            conn.execute(sample_annotation.insert(), records[start:start + CHUNK_SIZE])
        count = conn.execute(text(f"SELECT COUNT(*) FROM {TABLE_NAME}")).scalar()
    print(f"\n{TABLE_NAME}: {count} rows written")


def main() -> None:
    args = parse_args()
    engine = get_engine(args.db_url)
    samples = load_samples(engine)
    print(f"{len(samples)} distinct samples in gdsc + prism\n")
    df = build(samples, args)
    print_summary(df)
    if args.write:
        write(engine, df)
    else:
        print("\nDry run: nothing written. Use --write to replace the table.")


if __name__ == "__main__":
    main()
