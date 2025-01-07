import json
import os
import time

import pandas as pd
import numpy as np
import ast
import mygene

from celery import Celery
from celery.result import AsyncResult
from subprocess import Popen
from io import StringIO

from pathlib import Path
from static import plots as pt

from parametric_umap import ParametricUMAP

from src.pipeline import PreprocessPaths, InferencePaths
from src.pipeline.align import batch_correct, impute_missing, celligner_transform_data
from src.pipeline import InferencePaths, run_full_inference
import plotly.express as px

# Get the base directory of the script
BASE_DIR = Path(__file__).resolve().parent

# Get the parent folder of the base directory
PARENT_DIR = BASE_DIR.parent

celery = Celery(__name__)
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

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


def start_celery():
    celery_cmd = [
        "celery",
        "-A",
        __name__,
        "worker",
        "--pool=solo",
        "--loglevel=info"
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
    umap_path=PARENT_DIR / 'src/umap.trc'
)

# read tcga_code_map
with open(PARENT_DIR / 'src/tcga_to_code_map.json') as f:
    tcga_code_map = json.load(f)

# read overall umap
umap_df = pd.read_csv(PARENT_DIR / 'src/overall_umap_df.csv', index_col=0)

inference_paths_gdsc = InferencePaths(
    cellhit_data=PARENT_DIR / 'src/data',
    ccle_transcr_neighs=PARENT_DIR / 'src/ccle_transcr_neighs.pkl',
    tcga_transcr_neighs=PARENT_DIR / 'src/tcga_transcr_neighs.pkl',
    ccle_response_neighs=PARENT_DIR / 'src/ccle_response_neighs.pkl',
    tcga_response_neighs=PARENT_DIR / 'src/tcga_response_neighs.pkl',
    pretrained_models_path=PARENT_DIR / 'src/gdsc',
    drug_stats=PARENT_DIR / 'src/gdsc_drug_stats.csv',
    drug_metadata=PARENT_DIR / 'src/data/',
    quantile_computer=PARENT_DIR / 'src/gdsc_quantile_computer.npy',
    ccle_metadata=PARENT_DIR / 'src/Model.csv',
    tcga_metadata=PARENT_DIR / 'src/tcga_oncotree_data.csv'
)


@celery.task(bind=True)
def analysis(self, file, dataset):
    try:
        results_pipeline = {}

        # Step 1: Processing
        self.update_state(state='PROGRESS', meta='Processing')

        df = pd.read_csv(StringIO(file), sep=",", header=0, index_col=0)

        # Get TCGA_CODE code
        code = str(df['TCGA_CODE'].unique()[0])

        # Get Tissue
        tissue = ''.join(df['TISSUE'].unique())

        # Drop TCGA_CODE
        df = df.drop(columns=['TCGA_CODE', 'TISSUE'])

        # gbm code
        gbm_code = tcga_code_map.get(code)

        # Preprocess data
        data = preprocess_data(df, code)

        # Define covariate labels (TCGA category to which the new sample belong to)
        covariate_labels = [gbm_code] * len(data)

        # Step 2: Batch correction
        self.update_state(state='PROGRESS', meta='Batch correction')
        corrected = batch_correct(data, covariate_labels, preprocess_paths)

        # Step 3: Imputation
        self.update_state(state='PROGRESS', meta='Imputation')
        imputed = impute_missing(corrected, preprocess_paths, covariate_labels)

        # Step 4: Transform
        self.update_state(state='PROGRESS', meta='Transform')
        transformed = celligner_transform_data(data=imputed,
                                               preprocess_paths=preprocess_paths,
                                               device='cuda:0',
                                               transform_source='target')

        umap_path = preprocess_paths.umap_path

        if umap_path:
            umap = ParametricUMAP.load(umap_path)
            embedding = umap.transform(transformed.values)

            umap_results = pd.DataFrame(
                embedding,
                columns=['UMAP1', 'UMAP2'],
                index=transformed.index
            )

            umap_results['Source'] = code
            umap_results['oncotree_code'] = code
            umap_results['tissue'] = tissue
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

        results_pipeline['transformed'] = transformed

        # Step 5: Inference
        self.update_state(state='PROGRESS', meta='Inference')

        dataset = dataset.lower()
        if dataset == "gdsc":
            result_df = run_full_inference(results_pipeline['transformed'],
                                           dataset=dataset,
                                           inference_paths=inference_paths_gdsc,
                                           return_heatmap=True)

        # Step 6: Result elaboration
        self.update_state(state='PROGRESS', meta='Results elaboration')

        heatmap_df = result_df['heatmap_data']
        heatmap_df = heatmap_df.reset_index()

        # Draw heatmap and get heatmap's height
        heatmap_json = draw_heatmap(heatmap_df)

        # Set up predictions dataframe
        predictions_df = result_df['predictions']

        predictions_df['RecoveredTargets'] = predictions_df['RecoveredTargets'].fillna("No recovered targets")
        predictions_df['PutativeTarget'] = predictions_df['PutativeTarget'].fillna("No putative target")
        predictions_df['PutativeTarget'] = predictions_df['PutativeTarget'].astype(str)
        predictions_df['TopGenes'] = predictions_df['TopGenes'].astype(str)
        predictions_df['tcga_response_neigh_tissue'] = predictions_df['tcga_response_neigh_tissue'].fillna("No tissue")
        predictions_df['tcga_response_neigh_tissue'] = predictions_df['tcga_response_neigh_tissue'].astype(str)

        predictions_df['dataset'] = "GDSC"

        predictions_df = predictions_df.reset_index(drop=True)

        predictions_df['ShapDictionary'] = predictions_df['ShapDictionary'].astype(str)
        predictions_df['ShapDictionary'] = predictions_df['ShapDictionary'].apply(preprocess_shap_dict)

        predictions_json = predictions_df.to_dict(orient='records')

        result = {
            "heatmap": {'data': heatmap_json[0], "height": heatmap_json[1]},
            "table": predictions_json,
            "umap":  {'oncotree': umap_json, "tissue": umap_json_tissue}
        }

        return result

    except Exception as e:
        print(f"Error during analysis: {e}")
        raise  # Re-raise the exception for further handling


# Preprocess user data
def preprocess_data(data, code):

    # Transpose data
    data = data.transpose()

    # Mapping genes if any value in the first column starts with 'ENSG'
    if data.columns.str.startswith("ENSG").any():
        data.columns = ensg_to_hgnc(data.columns)

    # Remove "GENE" from column names
    data.columns = data.columns.str.replace("GENE", " ", regex=True)

    # Replace "GENE" in values, if necessary
    data = data.replace("GENE", "", regex=True)

    # Remove columns with zero standard deviation
    data = data.loc[:, data.std() != 0]

    # Update column names after filtering
    genes = data.columns

    # Group and calculate the mean for duplicate columns
    data = data.groupby(genes, axis=1).mean()

    # Reset the index and modify it
    data = data.reset_index()
    data['index'] = data['index'].apply(lambda x: code + '_' + x)
    data = data.set_index('index')

    # Add 1 to all values and take the log2
    data = data.apply(lambda x: np.log2(x + 1))

    return data


# Draw IC50 heatmap
def draw_heatmap(heatmap_df):

    # Exclude non-numeric columns
    numeric_data = heatmap_df.select_dtypes(include='number')

    # Identify columns to remove based on conditions
    columns_to_remove = numeric_data.columns[
        numeric_data.ge(-1).all()  # All values ≥  -1
    ]

    # Drop these columns from the original dataframe
    processed_data = heatmap_df.drop(columns=columns_to_remove)

    height = len(heatmap_df) * 20
    width = len(processed_data) * 10

    return pt.clustergram(processed_data, height=height, width=width, xpad=100), height


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
        code: 'diamond',
    }

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

    # Create scatter plot with Plotly, adding symbols based on 'Source'
    fig = px.scatter(
        umap,
        x='UMAP1',
        y='UMAP2',
        color=color,
        symbol='Source',  # Assign different markers based on 'Source'
        symbol_map=symbol_map,
        hover_data=['oncotree_code', 'Source', 'oncotree_code', 'index', 'tissue'],  # Optionally include in hover
        color_discrete_sequence=plotlyPalette
    )

    # Customize the layout
    fig.update_layout(
        legend_title_text='Oncotree Code and Source',  # Adjusted for multiple legends
        legend=dict(
            # You can customize legend layout here if needed
        ),
        width=1000,
        height=800,
    )

    # Optionally, customize the marker symbols and sizes further
    fig.update_traces(marker=dict(size=6, line=dict(width=0.2, color='DarkSlateGrey')))

    # Convert the figure to JSON
    fig_json = fig.to_json(remove_uids=False)
    return fig_json


def ensg_to_hgnc(df_columns):
    """
    Transforms a list or pandas Index of Ensembl Gene IDs (ENSG format) to HGNC symbols.

    Parameters:
    df_columns (pd.Index or list): A pandas Index or list containing Ensembl Gene IDs.

    Returns:
    pd.Index: A pandas Index with corresponding HGNC symbols. Returns the original ENSG ID for unmapped IDs.
    """
    import mygene
    import pandas as pd

    # Initialize MyGeneInfo client
    mg = mygene.MyGeneInfo()

    # Convert columns to a list if necessary
    if isinstance(df_columns, pd.Index):
        columns = df_columns.tolist()
    else:
        columns = df_columns

    # Extract unique ENSG IDs to minimize redundant queries
    unique_ensg = [col for col in columns if col.startswith("ENSG")]

    if not unique_ensg:
        return pd.Index(columns)  # Return original columns if no valid ENSG IDs are present

    # Query MyGeneInfo in batch
    print('Querying MyGeneInfo...')
    try:
        # Query in batches for efficiency
        batch_size = 1000
        results = []
        for i in range(0, len(unique_ensg), batch_size):
            batch = unique_ensg[i:i + batch_size]
            results.extend(
                mg.querymany(batch, scopes='ensembl.gene', fields='symbol', species='human', as_dataframe=False)
            )
        print('MyGeneInfo query completed.')
    except Exception as e:
        print(f"Error during MyGeneInfo query: {e}")
        return pd.Index(columns)

    # Create a mapping dictionary from Ensembl IDs to HGNC symbols
    ensg_to_symbol = {
        entry['query']: entry.get('symbol', entry['query'])  # Fallback to ENSG ID if no symbol is found
        for entry in results if 'query' in entry
    }

    # Map the original columns using the dictionary
    mapped_columns = [ensg_to_symbol.get(col, col) for col in columns]

    return pd.Index(mapped_columns)
