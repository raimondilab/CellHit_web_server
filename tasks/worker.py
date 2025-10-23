import os
import random
import numpy as np

os.environ["PYTHONHASHSEED"] = "0"
np.random.seed(0)
random.seed(0)

import json

import pandas as pd

import ast
import mygene

from celery import Celery
from celery.result import AsyncResult
from subprocess import Popen
from io import StringIO

from pathlib import Path
from static import plots as pt

from parametric_umap import ParametricUMAP

from src.pipeline import PreprocessPaths
from src.pipeline.align import batch_correct, impute_missing, celligner_transform_data
from src.pipeline import InferencePaths, run_full_inference
import plotly.express as px

# Get the base directory of the script
BASE_DIR = Path(__file__).resolve().parent

# Get the parent folder of the base directory
PARENT_DIR = BASE_DIR.parent

# Distribution file folder
RESULTS_DIR = PARENT_DIR / 'distrib_files/'

celery = Celery(__name__)
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

# Set time limits to 4 hours
celery.conf.update(
    task_time_limit=14400,
    task_soft_time_limit=13800,
)

celery.conf.update(
    task_serializer='json',
    accept_content=['json'],  # Ensure workers can deserialize messages
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    worker_hijack_root_logger=False,
    broker_connection_retry_on_startup=True,
    logging='DEBUG',
    result_expires=60 * 60 * 24 * 30  # 30 days in seconds
)


def start_flower():
    flower_cmd = [
        "celery",
        "-A",
        __name__,
        "flower",
        "--port=5555"
    ]
    try:
        process = Popen(flower_cmd)
        return process
    except Exception as e:
        print(f"Error Flower: {e}")
        return None


def start_celery(worker_name):
    celery_cmd = [
        "celery",
        "-A",
        __name__,
        "worker",
        "--pool=solo",
        "--loglevel=info",
        "-n", f"{worker_name}@%h"
    ]
    try:
        process = Popen(celery_cmd)
        return process
    except Exception as e:
        print(f"Error Flower: {e}")
        return None


@celery.task
def get_task(task_id):
    res = AsyncResult(task_id)
    return res


# Set up gene lengths
gene_lengths_df = pd.read_csv(PARENT_DIR / 'src/exon_lengths.csv', index_col=0)

# Set the 'Gene' column as the index of the DataFrame
gene_lengths_df = gene_lengths_df.set_index('Gene')

# Create the final Series object from the 'Length' column
gene_lengths_series = gene_lengths_df['Length']

# Setup preprocess_paths
preprocess_paths = PreprocessPaths(
    classifier_path=PARENT_DIR / 'src/tumor_classifier_tcga_final_model_revised.json',
    classifier_mapper_path=PARENT_DIR / 'src/tcga_classifier_code_mapper.json',
    imputer_path=PARENT_DIR / 'src/tumor_regressor_final_model.json',
    celligner_path=PARENT_DIR / 'src/base_alligner_CCLE_TCGA_optimized_revised.pkl',
    tcga_data_path=PARENT_DIR / 'src/tcga_raw.feather',
    tcga_metadata_path=PARENT_DIR / 'src/tcga_oncotree_data.csv',
    tcga_code_map_path=PARENT_DIR / 'src/tcga_code_map.pkl',
    tcga_project_ids_path=PARENT_DIR / 'src/tcga_project_ids.json',
    ccle_data_path=PARENT_DIR / 'src/ccle_raw.feather',
    ccle_metadata_path=PARENT_DIR / 'src/Model.csv',
    ccle_code_map_path=PARENT_DIR / 'src/ccle_code_map.pkl',
    umap_path=PARENT_DIR / 'src/umap.trc'
)

# read tcga_code_map
with open(PARENT_DIR / 'src/tcga_to_code_map.json') as f:
    tcga_code_map = json.load(f)

# read ccle_code_map
with open(PARENT_DIR / 'src/tissue_map.json') as f:
    ccle_code_map = json.load(f)

# read overall umap
umap_df = pd.read_csv(PARENT_DIR / 'src/overall_umap_df.csv', index_col=0)

inference_paths_gdsc = InferencePaths(
    cellhit_data=PARENT_DIR / 'src/data',
    ccle_transcr_neighs=PARENT_DIR / 'src/ccle_transcr_neighs.pkl',
    tcga_transcr_neighs=PARENT_DIR / 'src/tcga_transcr_neighs.pkl',
    ccle_response_neighs=PARENT_DIR / 'src/gdsc_ccle_response_neighs.pkl',
    tcga_response_neighs=PARENT_DIR / 'src/gdsc_tcga_response_neighs.pkl',
    pretrained_models_path=PARENT_DIR / 'src/gdsc',
    drug_stats=PARENT_DIR / 'src/gdsc_drug_stats.csv',
    drug_metadata=PARENT_DIR / 'src/data/',
    quantile_computer=PARENT_DIR / 'src/gdsc_quantile_computer.npy',
    ccle_metadata=PARENT_DIR / 'src/Model.csv',
    tcga_metadata=PARENT_DIR / 'src/tcga_oncotree_data.csv'
)

inference_paths_prism = InferencePaths(
    cellhit_data=PARENT_DIR / 'src/data',
    ccle_transcr_neighs=PARENT_DIR / 'src/ccle_transcr_neighs.pkl',
    tcga_transcr_neighs=PARENT_DIR / 'src/tcga_transcr_neighs.pkl',
    ccle_response_neighs=PARENT_DIR / 'src/prism_ccle_response_neighs.pkl',
    tcga_response_neighs=PARENT_DIR / 'src/prism_tcga_response_neighs.pkl',
    pretrained_models_path=PARENT_DIR / 'src/prism',
    drug_stats=PARENT_DIR / 'src/prism_drug_stats.csv',
    drug_metadata=PARENT_DIR / 'src/data/',
    quantile_computer=PARENT_DIR / 'src/prism_quantile_computer.npy',
    ccle_metadata=PARENT_DIR / 'src/Model.csv',
    tcga_metadata=PARENT_DIR / 'src/tcga_oncotree_data.csv'
)


@celery.task(bind=True)
def analysis(self, file, datasets, datatype):
    try:
        results_pipeline = {}

        task_id = self.request.id  # Get the task ID

        # Step 1: Processing
        self.update_state(state='PROGRESS', meta='Processing')

        df = pd.read_csv(StringIO(file), sep=",", header=0, index_col=0)

        if 'BATCH' in df.columns:
            df['BATCH'] = df['BATCH'].astype(str)

        # Preprocess data
        data, code, tissue, covariate_labels, batch_labels = preprocess_data(df, gene_lengths_series, datatype)

        if 'BATCH' in df.columns:
            batch_labels_int = list(map(lambda x: int(x[0]), batch_labels))
        else:
            batch_labels_int = None

        # Step 2: Batch correction
        self.update_state(state='PROGRESS', meta='Batch correction')
        transform_source = 'target' if datatype == "patient" else 'reference'
        corrected = batch_correct(data, covariate_labels, preprocess_paths, transform_source=transform_source,  batch_labels=batch_labels_int)

        # Step 3: Imputation
        self.update_state(state='PROGRESS', meta='Imputation')
        imputed = impute_missing(corrected, preprocess_paths, covariate_labels)

        # Step 4: Transform
        self.update_state(state='PROGRESS', meta='Transform')

        transformed = celligner_transform_data(data=imputed,
                                               preprocess_paths=preprocess_paths,
                                               device='cuda:0',
                                               transform_source=transform_source)

        umap_path = preprocess_paths.umap_path

        if umap_path:
            umap = ParametricUMAP.load(umap_path, device='cuda:0')
            embedding = umap.transform(transformed.values)

            umap_results = pd.DataFrame(
                embedding,
                columns=['UMAP1', 'UMAP2'],
                index=transformed.index
            )

            umap_results['Source'] = code
            umap_results['oncotree_code'] = code
            umap_results['tissue'] = tissue

            if batch_labels:
                umap_results['batch'] = batch_labels
                umap_df['batch'] = [0] * umap_df.shape[0]

            umap_results = umap_results.reset_index()

            results_pipeline['umap'] = umap_results

        # Mapping new sample into umap space
        umap_concat = pd.concat([umap_df, results_pipeline['umap']])

        # Reset index
        umap_concat = umap_concat.reset_index(drop=True)

        # Convert umap data in json format
        umap_json = draw_scatter_plot(umap_concat, code, 'oncotree_code')

        # Convert umap data in json format
        umap_json_tissue = draw_scatter_plot(umap_concat, code, 'tissue')

        if batch_labels:

            # Convert umap data in json format
            umap_json_batch = draw_scatter_plot(umap_concat, code, 'batch')

        results_pipeline['transformed'] = transformed

        # Step 5: Inference
        self.update_state(state='PROGRESS', meta='Inference')

        combined_results = {}

        for dataset in datasets:
            dataset = dataset.lower()

            result_df = run_full_inference(
                results_pipeline['transformed'],
                dataset=dataset,
                inference_paths=inference_paths_gdsc if dataset == "gdsc" else inference_paths_prism,
                return_heatmap=True
            )

            combined_results[dataset.upper()] = result_df

        # Step 6: Result elaboration
        self.update_state(state='PROGRESS', meta='Results elaboration')

        # Initialize an empty DataFrame to combine results from all datasets
        combined_predictions_df = pd.DataFrame()

        # Initialize an empty dict to combine results from all datasets
        combined_heatmap_df = {}

        for dataset in datasets:
            result_df = combined_results[dataset.upper()]

            heatmap_df = result_df['heatmap_data']
            heatmap_df = heatmap_df.reset_index()

            # Draw heatmap and get heatmap's height
            heatmap_json = draw_heatmap(heatmap_df, dataset.upper())

            # combined heatmap results
            combined_heatmap_df[dataset.upper()] = {'data': heatmap_json[0], "height": heatmap_json[1]}

            # Set up predictions dataframe
            predictions_df = result_df['predictions']

            predictions_df['RecoveredTargets'] = predictions_df['RecoveredTargets'].fillna("No recovered targets")
            predictions_df['PutativeTarget'] = predictions_df['PutativeTarget'].fillna("No putative target")
            predictions_df['PutativeTarget'] = predictions_df['PutativeTarget'].astype(str)
            predictions_df['TopGenes'] = predictions_df['TopGenes'].astype(str)
            predictions_df['tcga_response_neigh_tissue'] = predictions_df['tcga_response_neigh_tissue'].fillna(
                "No tissue")
            predictions_df['tcga_response_neigh_tissue'] = predictions_df['tcga_response_neigh_tissue'].astype(str)

            # Add the dataset identifier
            predictions_df['dataset'] = dataset.upper()

            predictions_df = predictions_df.reset_index(drop=True)

            predictions_df['ShapDictionary'] = predictions_df['ShapDictionary'].astype(str)
            predictions_df['ShapDictionary'] = predictions_df['ShapDictionary'].apply(preprocess_shap_dict)

            # Save drug distributions for later visualization purposes
            save_numpy_dict(task_id, 'distrib_drugs', dataset, result_df['distrib_drugs'])

            # Save cell distributions for later visualization purposes
            save_numpy_dict(task_id, 'distrib_cells', dataset, result_df['distrib_cells'])

            # Append to the combined dataframe
            combined_predictions_df = pd.concat([combined_predictions_df, predictions_df], ignore_index=True)

        # Reset index of the combined dataframe
        combined_predictions_df = combined_predictions_df.reset_index(drop=True)

        # Convert the combined dataframe to JSON
        predictions_json = combined_predictions_df.fillna("").to_dict(orient='records')

        if batch_labels:

            result = {
                "heatmap": combined_heatmap_df,
                "table": predictions_json,
                "umap": {'oncotree': umap_json, "tissue": umap_json_tissue, 'batch': umap_json_batch}
            }

        else:

            result = {
                "heatmap": combined_heatmap_df,
                "table": predictions_json,
                "umap": {'oncotree': umap_json, "tissue": umap_json_tissue}
            }

        return result

    except Exception as e:
        print(f"Error during analysis: {e}")
        raise  # Re-raise the exception for further handling


@celery.task(bind=True)
def alignment(self, file, datatype):
    try:
        results_pipeline = {}

        # Step 1: Processing
        self.update_state(state='PROGRESS', meta='Processing')

        df = pd.read_csv(StringIO(file), sep=",", header=0, index_col=0)

        if 'BATCH' in df.columns:
            df['BATCH'] = df['BATCH'].astype(str)

            # Preprocess data
        data, code, tissue, covariate_labels, batch_labels = preprocess_data(df, gene_lengths_series, datatype)

        if 'BATCH' in df.columns:
            batch_labels_int = list(map(lambda x: int(x[0]), batch_labels))
        else:
            batch_labels_int = None

        # Step 2: Batch correction
        self.update_state(state='PROGRESS', meta='Batch correction')
        transform_source = 'target' if datatype == "patient" else 'reference'
        corrected = batch_correct(data, covariate_labels, preprocess_paths, transform_source=transform_source,
                                  batch_labels=batch_labels_int)

        # Step 3: Imputation
        self.update_state(state='PROGRESS', meta='Imputation')
        imputed = impute_missing(corrected, preprocess_paths, covariate_labels)

        # Step 4: Transform
        self.update_state(state='PROGRESS', meta='Transform')
        transformed = celligner_transform_data(data=imputed,
                                               preprocess_paths=preprocess_paths,
                                               device='cuda:0',
                                               transform_source=transform_source)

        umap_path = preprocess_paths.umap_path

        if umap_path:
            umap = ParametricUMAP.load(umap_path, device='cuda:0')
            embedding = umap.transform(transformed.values)

            umap_results = pd.DataFrame(
                embedding,
                columns=['UMAP1', 'UMAP2'],
                index=transformed.index
            )

            umap_results['Source'] = code
            umap_results['oncotree_code'] = code
            umap_results['tissue'] = tissue

            if batch_labels:
                umap_results['batch'] = batch_labels
                umap_df['batch'] = [0] * umap_df.shape[0]

            umap_results = umap_results.reset_index()

            results_pipeline['umap'] = umap_results

        # Mapping new sample into umap space
        umap_concat = pd.concat([umap_df, results_pipeline['umap']])

        # Reset index
        umap_concat = umap_concat.reset_index(drop=True)

        # Step 5: Result elaboration
        self.update_state(state='PROGRESS', meta='Results elaboration')

        # Convert umap data in json format
        umap_json = draw_scatter_plot(umap_concat, code, 'oncotree_code')

        # Convert umap data in json format
        umap_json_tissue = draw_scatter_plot(umap_concat, code, 'tissue')

        # Convert umap data in json format
        if batch_labels:
            umap_json_batch = draw_scatter_plot(umap_concat, code, 'batch')

            result = {
                "umap": {'oncotree': umap_json, "tissue": umap_json_tissue, 'batch': umap_json_batch}
            }

        else:

            result = {
                "umap": {'oncotree': umap_json, "tissue": umap_json_tissue}
            }

        return result

    except Exception as e:
        print(f"Error during analysis: {e}")
        raise  # Re-raise the exception for further handling


# Preprocess user data
def preprocess_data(data, gene_lengths, datatype):

    # Separate numeric and non-numeric columns
    numeric_cols = data.select_dtypes(include=[np.number]).columns
    non_numeric_cols = data.select_dtypes(exclude=[np.number]).columns

    # Sort numeric columns (genes)
    data_numeric = data[numeric_cols]
    data_numeric = data_numeric[sorted(data_numeric.columns)]

    # Check if gene names are ENSG identifiers and map to HGNC
    if any(str(col).startswith("ENSG") for col in data_numeric.columns):
        data_numeric.columns = map_ensg_to_hgnc(data_numeric.columns)

    # Clean up gene names
    data_numeric.columns = pd.Index([str(col).replace("SAMPLE", "").strip() for col in data_numeric.columns])

    # Remove columns with zero standard deviation
    data_numeric = data_numeric.loc[:, data_numeric.std() != 0]

    # Ensure all column names are simple strings
    if isinstance(data_numeric.columns, pd.MultiIndex):
        data_numeric.columns = ['_'.join(map(str, col)).strip() for col in data_numeric.columns.values]
    data_numeric.columns = data_numeric.columns.astype(str)

    # Group duplicate columns (mean)
    data_numeric = data_numeric.groupby(data_numeric.columns, axis=1).mean()

    # Align gene lengths
    common_genes = data_numeric.columns.intersection(gene_lengths.index)
    data_numeric = data_numeric[common_genes]
    gene_lengths = gene_lengths.loc[common_genes]

    # Convert raw counts to TPM
    tpm = raw_counts_to_log2_tpm(data_numeric, gene_lengths)

    # Log2 transform
    data_numeric = np.log2(tpm + 1)

    # Standardize sample names
    data_numeric = data_numeric.sort_index()
    data_numeric = data_numeric.reset_index()
    data_numeric = data_numeric.set_index('SAMPLE')

    # Reattach non-numeric metadata columns
    if len(non_numeric_cols) > 0:
        meta = data[non_numeric_cols]
        # Align indices just in case
        meta = meta.reindex(data_numeric.index, fill_value=np.nan)
        data = pd.concat([data_numeric, meta], axis=1)
    else:
        data = data_numeric

    # --- Extract metadata after all operations ---
    tissue = None
    batch_labels = None

    if 'TISSUE' in data.columns:
        tissue = data['TISSUE'].to_list()

    if 'BATCH' in data.columns:
        batch_labels = data['BATCH'].to_list()

    if datatype == "patient":
        code = data['TCGA_CODE'].to_list()
    elif datatype == "reference":
        code = data['TISSUE'].to_list()

    covariate_labels = []

    if datatype == "patient" and 'TCGA_CODE' in data.columns:
        for c in data['TCGA_CODE'].to_list():
            covariate_labels.append(tcga_code_map.get(c))

    elif datatype == "reference" and 'TISSUE' in data.columns:
        for t in data['TISSUE'].to_list():
            covariate_labels.append(ccle_code_map.get(t))

    # Drop metadata columns from the final data matrix
    for col in ['TCGA_CODE', 'TISSUE']:
        if col in data.columns:
            data = data.drop(columns=col)

    return data, code, tissue, covariate_labels, batch_labels


# Draw IC50 heatmap
def draw_heatmap(heatmap_df, dataset, top=15):

    # Exclude non-numeric columns
    numeric_data = heatmap_df.select_dtypes(include='number')

    # Step 1: Remove drugs with low variability (based on standard deviation or CV)
    std_devs = numeric_data.std()
    cv = std_devs / numeric_data.mean()
    cv_threshold = 0.1  # Define a threshold for CV
    significant_columns = cv[cv > cv_threshold].index

    # Filter numeric_data to keep significant columns
    filtered_data = numeric_data[significant_columns]

    # Step 2: Remove highly correlated drugs
    correlation_matrix = filtered_data.corr().abs()
    upper_triangle = np.triu(np.ones(correlation_matrix.shape), k=1)
    highly_correlated = (correlation_matrix > 0.9) & (upper_triangle == 1)

    # Identify columns to drop due to high correlation
    columns_to_drop = [
        column for column in highly_correlated.columns if any(highly_correlated[column])
    ]

    # Drop redundant columns
    filtered_data = filtered_data.drop(columns=columns_to_drop)

    # Step 3: Keep the top 15 most variable drugs
    std_devs_filtered = filtered_data.std()
    std_devs_filtered = std_devs_filtered[~std_devs_filtered.index.str.contains("Cluster")]
    top_n = top
    top_columns = std_devs_filtered.nlargest(top_n).index

    # Step 4: Identify columns where all values are negative
    negative_cols = numeric_data.columns[(numeric_data < -1).all()]

    # Combine top variable columns with negative-only columns
    final_columns = list(set(top_columns).union(set(negative_cols)))

    # Keep only the selected columns in the processed data
    processed_data = heatmap_df[final_columns].copy()

    # Reset index
    processed_data = processed_data.reset_index()
    processed_data['index'] = heatmap_df['index']

    # Set heatmap dimensions
    height = max(len(processed_data) * 20, 600)  # Adjust height based on data
    width = 1100

    # Set padding for column names
    max_col_name_length = max(len(col) for col in heatmap_df.columns) + 200
    xpad = max(100, max_col_name_length)

    # Set color bar title
    color_bar_title = "LFC " if dataset == "PRISM" else "ln(IC50)"

    # Generate heatmap using pt.clustergram (assuming pt is a valid library here)
    return pt.clustergram(processed_data, height=height, width=width, xpad=xpad,
                          color_bar_title=color_bar_title), height


# Preprocess 'ShapDictionary' to replace `np.float32(...)` with plain float values
def preprocess_shap_dict(shap_str):
    try:
        # Replace `np.float32(value)` with `value`
        shap_str = shap_str.replace("np.float32(", "").replace(")", "")
        # Convert the string into a dictionary
        return ast.literal_eval(shap_str)
    except Exception as e:
        print(f"Error parsing ShapDictionary: {shap_str}")
        raise e


# Draw scatter plot for UMAP
def draw_scatter_plot(umap, code, color):

    symbol_map = {
        'TCGA': 'cross',
        'CCLE': 'circle',
    }

    if isinstance(code, list):
        for label in list(set(code)):
            symbol_map[label] = 'diamond'
    else:
        symbol_map[code] = 'diamond'

    plotlyPalette = [
        "#E13978", "#F5899E", "#C091E3", "#E08571", "#9F55BB", "#45A132", "#96568E",
        "#5AB172", "#DFBC3A", "#349077", "#D8AB6A", "#75DFBB", "#5DA134", "#1F8FFF",
        "#9C5E2B", "#51D5E0", "#ABD23F", "#DA45BB", "#555555", "#56E79D", "#B644DC",
        "#73E03D", "#3870C9", "#6C55E2", "#5FDB69", "#659FD9", "#D74829", "#bdbdbd",
        "#E491C1", "#348ABD", "#A60628", "#7A68A6", "#467821", "#CF4457", "#188487",
        "#E24A33", "#FBC15E", "#8EBA42", "#988ED5", "#FFB5B8", "#FFC0CB", "#CD5C5C",
        "#1B998B", "#FF9B71", "#6A0572", "#0A2342", "#EC9F05", "#9E0031", "#8D4F8D",
        "#4E4A59", "#BC4B51", "#9AD1D4", "#5C80BC", "#68B684", "#A23B72", "#D5DFE5",
        "#FF7F50", "#3BCEAC", "#60656F", "#1A535C", "#F7FFF7", "#FFE066", "#FFF79B",
        "#FF6F61", "#D4A5A5", "#6B4226", "#F4C095", "#E2A3D3", "#F0B7A3", "#D9BF77",
        "#3F8E7C", "#F2D7D5", "#3B6A7A", "#CF9C73", "#B5A4A3", "#6F6D59", "#88A9A6",
        "#D3C4A1", "#8C5B7B", "#F1C4B1", "#A4C3B2", "#E2B7A4", "#E1D7D4", "#C9A99D"
    ]

    if color == "batch":
        plotlyPalette.insert(0, "#717171")

    fig = px.scatter(
        umap,
        x='UMAP1',
        y='UMAP2',
        color=color,
        symbol='Source',
        symbol_map=symbol_map,
        hover_data=['oncotree_code', 'Source', 'oncotree_code', 'index', 'tissue'],
        color_discrete_sequence=plotlyPalette
    )

    if color == "oncotree_code":
        title = color.replace("_", " ").title()
    elif color == "tissue":
        title = "Tissue"
    elif color == "batch":
        title = "Batch"

    fig.update_layout(
        legend_title_text=f'{title} and Source',
        width=900,
        height=700,
    )

    fig.update_traces(marker=dict(size=6, line=dict(width=0.2, color='DarkSlateGrey')))

    return fig.to_json(remove_uids=False)


def map_ensg_to_hgnc(df_columns):
    """
    Transforms a list or pandas Index of Ensembl Gene IDs (ENSG format) to HGNC symbols.
    Unmapped or duplicated genes are preserved or made unique to avoid conflicts.
    """
    mg = mygene.MyGeneInfo()

    columns = df_columns.tolist() if isinstance(df_columns, pd.Index) else df_columns
    unique_ensg = {col.split('.')[0] for col in columns if col.startswith("ENSG")}

    if not unique_ensg:
        return pd.Index(columns)

    print('Querying MyGeneInfo for all unique ENSG IDs...')
    try:
        results = mg.querymany(list(unique_ensg), scopes='ensembl.gene', fields='symbol', species='human',
                               as_dataframe=False)
        print('MyGeneInfo query completed.')
    except Exception as e:
        print(f"Error during MyGeneInfo query: {e}")
        return pd.Index(columns)

    # Create mapping dictionary
    ensg_to_symbol = {entry['query']: entry.get('symbol', entry['query']) for entry in results if 'query' in entry}

    # Build initial mapped list
    mapped = [ensg_to_symbol.get(col.split('.')[0], col) for col in columns]

    # Handle duplicated gene symbols by appending a suffix
    seen = {}
    final_mapped = []
    for gene in mapped:
        if gene in seen:
            seen[gene] += 1
            final_mapped.append(f"{gene}_{seen[gene]}")
        else:
            seen[gene] = 1
            final_mapped.append(gene)

    return pd.Index(final_mapped)


def save_numpy_dict(task_id, dic_type, dataset, data):
    """
    Save a dictionary with numpy array values to a directory.

    Args:
        :param data: distribution dictionary
        :param task_id: Celery task ID
        :param dic_type: Dictionary type
    """

    os.makedirs(RESULTS_DIR, exist_ok=True)
    file_path = os.path.join(RESULTS_DIR, f"{task_id}_{dataset}_{dic_type}.npz")
    np.savez_compressed(file_path, **{str(key): value for key, value in data.items()})


def load_numpy_key(task_id, dic_type, dataset, key):
    """
    Load a specific key from a saved file.

    Args:
        task_id (str): The ID of the task.
        key (str): The key to load.
        dic_type (str): Dictionary type

    Returns:
         list: The value associated with the key, converted to a list.
   """

    file_path = os.path.join(RESULTS_DIR, f"{task_id}_{dataset}_{dic_type}.npz")

    if not os.path.exists(file_path):
        return ""

    with np.load(file_path, allow_pickle=True) as data:
        if key in data:
            # Convert numpy array to list before returning
            return data[key].tolist()  # Convert the numpy array to a list


def preprocess_heatmap_data(predictions, dataset):
    """
    Processes prediction data into a heatmap format and standardizes it.
    """
    if dataset not in ["GDSC", "PRISM"]:
        raise ValueError("Invalid dataset. Choose 'GDSC' or 'PRISM'.")

    heatmap_data = predictions[['index', 'prediction', 'DrugName']].pivot(
        index='index',
        columns='DrugName',
        values='prediction'
    )

    inference_paths = inference_paths_gdsc if dataset == "GDSC" else inference_paths_prism

    drug_stats = pd.read_csv(inference_paths.drug_stats)

    # Map median values
    median_mapper = dict(zip(drug_stats['Drug'], drug_stats['median']))
    for drug in heatmap_data.columns:
        heatmap_data.loc[:, drug] -= median_mapper.get(drug, 0)  # Default to 0 if drug not found

    # Standardization
    mean_vals = heatmap_data.mean()
    std_vals = heatmap_data.std().replace(0, 1)  # Prevent division by zero
    standardized_heatmap = (heatmap_data - mean_vals) / std_vals

    return {'heatmap_data': heatmap_data, 'standardized_heatmap': standardized_heatmap}


def raw_counts_to_log2_tpm(counts: pd.DataFrame, gene_lengths: pd.Series):
    lengths = gene_lengths.values / 1000  # kb
    counts_np = counts.to_numpy()

    # RPK
    rpk = counts_np / lengths[None, :]

    # Scaling factor por amostra
    scaling_factors = rpk.sum(axis=1) / 1e6

    # TPM
    tpm = rpk / scaling_factors[:, None]

    return pd.DataFrame(tpm, index=counts.index, columns=counts.columns)
