import json

import strawberry
from typing import Optional


@strawberry.type
class Gdsc:
    gdsc_id: int
    drug_name: str
    drug_id: int
    source: str
    sample_index: str
    predictions: float
    predictions_std: float
    quantile_score: float
    experimental_min: float
    experimental_median: float
    experimental_max: float
    model_mse: float
    model_corr: float
    transcr_ccle_neigh: str
    transcr_ccle_neigh_celllinename: str
    transcr_ccle_neigh_oncotree: str
    response_ccle_neigh: str
    response_ccle_neigh_celllinename: str
    response_ccle_neigh_oncotree: str
    transcr_tcga_neigh: str
    transcr_tcga_neigh_diagnosis: str
    transcr_tcga_neigh_site: str
    response_tcga_neigh: str
    response_tcga_neigh_diagnosis: str
    response_tcga_neigh_site: str
    putative_target: str
    top_local_shap_genes: str
    recovered_target: str


@strawberry.type
class Prism:
    prism_id: int
    drug_name: str
    drug_id: int
    source: str
    sample_index: str
    predictions: float
    predictions_std: float
    quantile_score: float
    experimental_min: float
    experimental_median: float
    experimental_max: float
    model_mse: float
    model_corr: float
    transcr_ccle_neigh: str
    transcr_ccle_neigh_celllinename: str
    transcr_ccle_neigh_oncotree: str
    response_ccle_neigh: str
    response_ccle_neigh_celllinename: str
    response_ccle_neigh_oncotree: str
    transcr_tcga_neigh: str
    transcr_tcga_neigh_diagnosis: str
    transcr_tcga_neigh_site: str
    response_tcga_neigh: str
    response_tcga_neigh_diagnosis: str
    response_tcga_neigh_site: str
    putative_target: str
    top_local_shap_genes: str
    recovered_target: str


DatabaseUnion = strawberry.union("DatabaseUnion", types=(Gdsc, Prism))


@strawberry.input
class PaginationInput:
    offset: int
    limit: int
    drug: Optional[str]


@strawberry.scalar
class JSON:
    @staticmethod
    def serialize(value: dict) -> str:
        return json.dumps(value)


@strawberry.type
class Task:
    task_id: str
    status: str
    result: JSON
