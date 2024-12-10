import json
import os
import sys
import time
import pandas as pd
import numpy as np

from celery import Celery
from celery.result import AsyncResult
from subprocess import Popen
from io import StringIO

from pathlib import Path

from parametric_umap import ParametricUMAP

from src.pipeline import PreprocessPaths, InferencePaths
from src.pipeline.align import classify_samples, batch_correct, impute_missing, celligner_transform_data
from src.pipeline import InferencePaths, run_full_inference

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
umap_df = pd.read_csv( PARENT_DIR / 'src/overall_umap_df.csv',index_col=0)

# inference_paths_gdsc = InferencePaths(
#     cellhit_data=PARENT_DIR / '/src/data',
#     ccle_transcr_neighs=PARENT_DIR / '/src/ccle_transcr_neighs.pkl',
#     tcga_transcr_neighs=PARENT_DIR / 'src/tcga_transcr_neighs.pkl',
#     ccle_response_neighs=PARENT_DIR /'src/ccle_response_neighs.pkl',
#     tcga_response_neighs=PARENT_DIR /'src/tcga_response_neighs.pkl',
#     pretrained_models_path=PARENT_DIR / f'src/gdsc',
#     drug_stats=PARENT_DIR /'src/gdsc_drug_stats.csv',
#     drug_metadata=PARENT_DIR /'src/data/',
#     quantile_computer=PARENT_DIR /'src/gdcs_quantile_computer.npy',
#     ccle_metadata=PARENT_DIR / 'src/Model.csv',
#     tcga_metadata=PARENT_DIR / 'src/tcga_oncotree_data.csv'
# )


@celery.task(bind=True)
def analysis(self, file, dataset):
    try:
        results_pipeline = {}

        # Step 1: Processing
        self.update_state(state='PROGRESS', meta='Processing')

        # Use StringIO to simulate a file object for pandas
        df = pd.read_csv(StringIO(file), sep=",", header=0, index_col=0)

        # Get TCGA_CODE code
        code = str(df['TCGA_CODE'].unique()[0])

        # Drop TCGA_CODE
        df = df.drop(columns=['TCGA_CODE'])

        # gbm code
        gbm_code = tcga_code_map.get(code)

        # Preprocess data
        data = preprocess_data(df, code)

        # Define covariate labels (TCGA category to which the new sample belong to)
        covariate_labels = [gbm_code] * len(data)

        # Step 2: Classification
        self.update_state(state='PROGRESS', meta='Classification')
        results_pipeline['classification'] = classify_samples(data, preprocess_paths)

        # Step 3: Batch correction
        self.update_state(state='PROGRESS', meta='Batch correction')
        corrected = batch_correct(data, covariate_labels, preprocess_paths)

        # Step 4: Imputation
        self.update_state(state='PROGRESS', meta='Imputation')
        imputed = impute_missing(corrected, preprocess_paths, covariate_labels)

        # Step 5: Transform
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
            #results_pipeline['umap'] = umap_results

        umap = pd.concat([umap_df, umap_results])

        print(umap)

        #umap = umap_results.to_dict(orient='records')

        #results_pipeline['transformed'] = transformed


        # Step 6: Inference
        self.update_state(state='PROGRESS', meta='Inference')

        # if dataset == "gdsc":
        #     result_df, heatmap_df = run_full_inference(transformed,
        #                                                dataset=dataset,
        #                                                inference_paths=inference_paths_gdsc,
        #                                                return_heatmap=True)
        #
        # print(result_df, heatmap_df)

        result = {
            "heatmap": "completed",
            "table": {
                "data_loading": "success"
            },
            "umap": {
                "0": {"UMAP1": -85.51314, "UMAP2": 1135.882, "tissue": "CNS/Brain", "oncotree_code": "GBM",
                      "Source": "TCGA", "index": "TCGA-19-1787-01"},
                "1": {"UMAP1": -196.9247, "UMAP2": 1441.3835, "tissue": "Prostate", "oncotree_code": "ODG",
                      "Source": "CCLE", "index": "ACH-000285"},
                "2": {"UMAP1": 110.69679, "UMAP2": -849.85754, "tissue": "Bowel", "oncotree_code": "COAD",
                      "Source": "FPS",
                      "index": "FPS_GB101-1_S3"},
                "3": {"UMAP1": 115.69679, "UMAP2": -869.85754, "tissue": "Bowel", "oncotree_code": "ODG",
                      "Source": "FPS",
                      "index": "FPS_GB101-2_S4"},
                "4": {"UMAP1": -902.91925, "UMAP2": -430.4279, "tissue": "Liver", "oncotree_code": "HCC",
                      "Source": "FPS",
                      "index": "FPS_GB101-2_S5"}
            },
        }
        return result

    except Exception as e:
        print(f"Error during analysis: {e}")
        raise  # Re-raise the exception for further handling


# Preprocess user data
def preprocess_data(data, code):
    # Transpose data
    data = data.transpose()

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
    data['index'] = data['index'].apply(lambda x: code + x)
    data = data.set_index('index')

    # Add 1 to all values and take the log2
    data = data.apply(lambda x: np.log2(x + 1))

    return data
