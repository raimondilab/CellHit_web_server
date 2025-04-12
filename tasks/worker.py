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

import numpy as np
import os

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
def analysis(self, file, datasets):
    try:
        results_pipeline = {}

        task_id = self.request.id  # Get the task ID

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
def alignment(self, file):
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

        # Step 5: Result elaboration
        self.update_state(state='PROGRESS', meta='Results elaboration')

        # Convert umap data in json format
        umap_json = draw_scatter_plot(umap_concat, code, 'oncotree_code')

        # Convert umap data in json format
        umap_json_tissue = draw_scatter_plot(umap_concat, code, 'tissue')

        result = {
            "umap": {'oncotree': umap_json, "tissue": umap_json_tissue}
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
        data = data.reset_index()

        # Remove "GENE" from column names
        data.columns = data.columns.str.replace("GENE", " ", regex=True)

        # Replace "GENE" in values, if necessary
        data = data.replace("GENE", "", regex=True)

        data = data.set_index('index')

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

    if color == "oncotree_code":
        title = color.replace("_", " ").title()

    else:
        title = "Tissue"

    # Customize the layout
    fig.update_layout(
        legend_title_text=f'{title} and Source',  # Adjusted for multiple legends
        legend=dict(
            # You can customize legend layout here if needed
        ),
        width=900,
        height=700,
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

    # Initialize MyGeneInfo client
    mg = mygene.MyGeneInfo()

    # Convert columns to a list if necessary
    if isinstance(df_columns, pd.Index):
        columns = df_columns.tolist()
    else:
        columns = df_columns

    # Extract unique ENSG IDs to minimize redundant queries and normalize them
    unique_ensg = {col.split('.')[0] for col in columns if col.startswith("ENSG")}

    # Split each value by '.' and take the first part
    unique_ensg = [value.split('.')[0] for value in unique_ensg]

    if not unique_ensg:
        return pd.Index(columns)  # Return original columns if no valid ENSG IDs are present

    # Query MyGeneInfo for all unique ENSG IDs
    print('Querying MyGeneInfo for all unique ENSG IDs...')
    try:
        results = mg.querymany(list(unique_ensg), scopes='ensembl.gene', fields='symbol', species='human',
                               as_dataframe=False)
        print('MyGeneInfo query completed.')
    except Exception as e:
        print(f"Error during MyGeneInfo query: {e}")
        return pd.Index(columns)

    # Use a dictionary comprehension to create the mapping (query -> first symbol or fallback to query)
    ensg_to_symbol = {entry['query']: entry.get('symbol', entry['query']) for entry in results if 'query' in entry}

    # Map the original columns using the dictionary, falling back to the original ID if no match is found
    mapped_columns = [ensg_to_symbol.get(col.split('.')[0], col) for col in columns]

    return pd.Index(mapped_columns)


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
