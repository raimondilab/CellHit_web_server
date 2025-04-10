import json
import os
from fastapi import HTTPException
from io import StringIO

from . import schemas
from typing import List, Optional

# other imports
from model import models
from model.database import DBSession
from sqlalchemy.exc import OperationalError
from tasks import worker
from strawberry.file_uploads import Upload
import pandas as pd
import mimetypes


class QueryResolver:

    @staticmethod
    def get_gdsc(pagination: (schemas.PaginationInput | None) = None) -> List[schemas.Gdsc]:

        db = DBSession()
        try:

            query = db.query(models.Gdsc)

            if pagination is not None and pagination.drug is not None:
                query = query.filter(models.Gdsc.drug_name == pagination.drug).offset(pagination.offset).limit(
                    pagination.limit)

            if pagination is not None and pagination.drug is None:
                query = query.offset(pagination.offset).limit(pagination.limit)

            data = query.all()

        except OperationalError:
            db.rollback()
            db.close()

            # Attempt reconnection and retry the operation
            db = DBSession()
            query = db.query(models.Gdsc)

            if pagination is not None and pagination.drug is not None:
                query = query.filter(models.Gdsc.drug_name == pagination.drug).offset(pagination.offset).limit(
                    pagination.limit)

            if pagination is not None and pagination.drug is None:
                query = query.offset(pagination.offset).limit(pagination.limit)

            data = query.all()

        finally:
            db.close()
        return data

    @staticmethod
    def get_gdsc_drug(drug: str) -> List[schemas.Gdsc]:

        db = DBSession()
        try:
            drug_data = db.query(models.Gdsc).filter(models.Gdsc.drug_name.like(f"%{drug}%")).all()

        except OperationalError:
            db.rollback()
            db.close()

            # Attempt reconnection and retry the operation
            db = DBSession()
            drug_data = db.query(models.Gdsc).filter(models.Gdsc.drug_name.like(f"%{drug}%")).all()

        finally:
            db.close()
        return drug_data

    @staticmethod
    def get_prism(pagination: (schemas.PaginationInput | None) = None) -> List[schemas.Prism]:

        db = DBSession()
        try:
            query = db.query(models.Prism)

            if pagination is not None and pagination.drug is not None:
                query = query.filter(models.Prism.drug_name == pagination.drug).offset(pagination.offset).limit(
                    pagination.limit)

            if pagination is not None and pagination.drug is None:
                query = query.offset(pagination.offset).limit(pagination.limit)

            data = query.all()

        except OperationalError:
            db.rollback()
            db.close()

            # Attempt reconnection and retry the operation
            db = DBSession()
            query = db.query(models.Prism)

            if pagination is not None and pagination.drug is not None:
                query = query.filter(models.Prism.drug_name == pagination.drug).offset(pagination.offset).limit(
                    pagination.limit)

            if pagination is not None and pagination.drug is None:
                query = query.offset(pagination.offset).limit(pagination.limit)

            data = query.all()

        finally:
            db.close()
        return data

    @staticmethod
    def get_prism_drug(drug: str) -> List[schemas.Prism]:

        db = DBSession()
        try:
            drug_data = db.query(models.Prism).filter(models.Prism.drug_name.like(f"%{drug}%")).all()

        except OperationalError:
            db.rollback()
            db.close()

            # Attempt reconnection and retry the operation
            db = DBSession()
            drug_data = db.query(models.Prism).filter(models.Prism.drug_name.like(f"%{drug}%")).all()

        finally:
            db.close()
        return drug_data

    @staticmethod
    def get_databases() -> List[schemas.DatabaseUnion]:
        db = DBSession()
        final_data = []
        try:
            query_gdsc = db.query(models.Gdsc).limit(10)
            query_prism = db.query(models.Prism).limit(10)

            data_gdsc = query_gdsc.all()
            data_prism = query_prism.all()

            for item in data_gdsc:
                gdsc_item = schemas.Gdsc(
                    gdsc_id=item.gdsc_id,
                    drug_name=item.drug_name,
                    drug_id=item.drug_id,
                    source=item.source,
                    sample_index=item.sample_index,
                    predictions=item.predictions,
                    predictions_std=item.predictions_std,
                    quantile_score=item.quantile_score,
                    experimental_min=item.experimental_min,
                    experimental_median=item.experimental_median,
                    experimental_max=item.experimental_max,
                    model_mse=item.model_mse,
                    model_corr=item.model_corr,
                    transcr_ccle_neigh=item.transcr_ccle_neigh,
                    transcr_ccle_neigh_celllinename=item.transcr_ccle_neigh_celllinename,
                    transcr_ccle_neigh_oncotree=item.transcr_ccle_neigh_oncotree,
                    response_ccle_neigh=item.response_ccle_neigh,
                    response_ccle_neigh_celllinename=item.response_ccle_neigh_celllinename,
                    response_ccle_neigh_oncotree=item.response_ccle_neigh_oncotree,
                    transcr_tcga_neigh=item.transcr_tcga_neigh,
                    transcr_tcga_neigh_diagnosis=item.transcr_tcga_neigh_diagnosis,
                    transcr_tcga_neigh_site=item.transcr_tcga_neigh_site,
                    response_tcga_neigh=item.response_tcga_neigh,
                    response_tcga_neigh_diagnosis=item.response_tcga_neigh_diagnosis,
                    response_tcga_neigh_site=item.response_tcga_neigh_site,
                    putative_target=item.putative_target,
                    top_local_shap_genes=item.top_local_shap_genes,
                    recovered_target=item.recovered_target
                )
                final_data.append(gdsc_item)

            for item in data_prism:
                prism_item = schemas.Prism(
                    prism_id=item.prism_id,
                    drug_name=item.drug_name,
                    drug_id=item.drug_id,
                    source=item.source,
                    sample_index=item.sample_index,
                    predictions=item.predictions,
                    predictions_std=item.predictions_std,
                    quantile_score=item.quantile_score,
                    experimental_min=item.experimental_min,
                    experimental_median=item.experimental_median,
                    experimental_max=item.experimental_max,
                    model_mse=item.model_mse,
                    model_corr=item.model_corr,
                    transcr_ccle_neigh=item.transcr_ccle_neigh,
                    transcr_ccle_neigh_celllinename=item.transcr_ccle_neigh_celllinename,
                    transcr_ccle_neigh_oncotree=item.transcr_ccle_neigh_oncotree,
                    response_ccle_neigh=item.response_ccle_neigh,
                    response_ccle_neigh_celllinename=item.response_ccle_neigh_celllinename,
                    response_ccle_neigh_oncotree=item.response_ccle_neigh_oncotree,
                    transcr_tcga_neigh=item.transcr_tcga_neigh,
                    transcr_tcga_neigh_diagnosis=item.transcr_tcga_neigh_diagnosis,
                    transcr_tcga_neigh_site=item.transcr_tcga_neigh_site,
                    response_tcga_neigh=item.response_tcga_neigh,
                    response_tcga_neigh_diagnosis=item.response_tcga_neigh_diagnosis,
                    response_tcga_neigh_site=item.response_tcga_neigh_site,
                    putative_target=item.putative_target,
                    top_local_shap_genes=item.top_local_shap_genes,
                    recovered_target=item.recovered_target
                )
                final_data.append(prism_item)

        except OperationalError:
            db.rollback()
            db.close()

            # Attempt reconnection and retry the operation
            db = DBSession()
            query_gdsc = db.query(models.Gdsc).limit(10)
            query_prism = db.query(models.Prism).limit(10)

            data_gdsc = query_gdsc.all()
            data_prism = query_prism.all()

            for item in data_gdsc:
                gdsc_item = schemas.Gdsc(
                    gdsc_id=item.gdsc_id,
                    drug_name=item.drug_name,
                    drug_id=item.drug_id,
                    source=item.source,
                    sample_index=item.sample_index,
                    predictions=item.predictions,
                    predictions_std=item.predictions_std,
                    quantile_score=item.quantile_score,
                    experimental_min=item.experimental_min,
                    experimental_median=item.experimental_median,
                    experimental_max=item.experimental_max,
                    model_mse=item.model_mse,
                    model_corr=item.model_corr,
                    transcr_ccle_neigh=item.transcr_ccle_neigh,
                    transcr_ccle_neigh_celllinename=item.transcr_ccle_neigh_celllinename,
                    transcr_ccle_neigh_oncotree=item.transcr_ccle_neigh_oncotree,
                    response_ccle_neigh=item.response_ccle_neigh,
                    response_ccle_neigh_celllinename=item.response_ccle_neigh_celllinename,
                    response_ccle_neigh_oncotree=item.response_ccle_neigh_oncotree,
                    transcr_tcga_neigh=item.transcr_tcga_neigh,
                    transcr_tcga_neigh_diagnosis=item.transcr_tcga_neigh_diagnosis,
                    transcr_tcga_neigh_site=item.transcr_tcga_neigh_site,
                    response_tcga_neigh=item.response_tcga_neigh,
                    response_tcga_neigh_diagnosis=item.response_tcga_neigh_diagnosis,
                    response_tcga_neigh_site=item.response_tcga_neigh_site,
                    putative_target=item.putative_target,
                    top_local_shap_genes=item.top_local_shap_genes,
                    recovered_target=item.recovered_target
                )
                final_data.append(gdsc_item)

            for item in data_prism:
                prism_item = schemas.Prism(
                    prism_id=item.prism_id,
                    drug_name=item.drug_name,
                    drug_id=item.drug_id,
                    source=item.source,
                    sample_index=item.sample_index,
                    predictions=item.predictions,
                    predictions_std=item.predictions_std,
                    quantile_score=item.quantile_score,
                    experimental_min=item.experimental_min,
                    experimental_median=item.experimental_median,
                    experimental_max=item.experimental_max,
                    model_mse=item.model_mse,
                    model_corr=item.model_corr,
                    transcr_ccle_neigh=item.transcr_ccle_neigh,
                    transcr_ccle_neigh_celllinename=item.transcr_ccle_neigh_celllinename,
                    transcr_ccle_neigh_oncotree=item.transcr_ccle_neigh_oncotree,
                    response_ccle_neigh=item.response_ccle_neigh,
                    response_ccle_neigh_celllinename=item.response_ccle_neigh_celllinename,
                    response_ccle_neigh_oncotree=item.response_ccle_neigh_oncotree,
                    transcr_tcga_neigh=item.transcr_tcga_neigh,
                    transcr_tcga_neigh_diagnosis=item.transcr_tcga_neigh_diagnosis,
                    transcr_tcga_neigh_site=item.transcr_tcga_neigh_site,
                    response_tcga_neigh=item.response_tcga_neigh,
                    response_tcga_neigh_diagnosis=item.response_tcga_neigh_diagnosis,
                    response_tcga_neigh_site=item.response_tcga_neigh_site,
                    putative_target=item.putative_target,
                    top_local_shap_genes=item.top_local_shap_genes,
                    recovered_target=item.recovered_target
                )
                final_data.append(prism_item)

        finally:
            db.close()

        return final_data

    @staticmethod
    def get_distribution(task_id: str, dic_type: str, dataset: str, key: str) -> schemas.Task:
        task = worker.load_numpy_key(task_id, dic_type, dataset, key)
        return schemas.Task(task_id=task_id, status="SUCCESS", result=task, type="analysis")

    @staticmethod
    def get_heatmap(task_id: str, top: int, dataset: str) -> schemas.Task:

        task = worker.get_task(task_id)

        if not task.result:
            return schemas.Task(task_id=task_id, status="SUCCESS", result="", type="analysis")

        dataset_upper = dataset.upper()

        result = task.result.get("table")

        heatmap_df = pd.DataFrame(result)
        heatmap_df = heatmap_df[heatmap_df['dataset'] == dataset]

        processed_data = worker.preprocess_heatmap_data(heatmap_df, dataset)

        heatmap_df = processed_data['heatmap_data'].reset_index()
        heatmap_standardized_df = processed_data['standardized_heatmap'].reset_index()

        heatmap_json, heatmap_height = worker.draw_heatmap(heatmap_df, dataset_upper, top)
        heatmap_standardized_json, heatmap_standardized_height = worker.draw_heatmap(
            heatmap_standardized_df, dataset_upper, top
        )

        result = {
            "heatmap": {dataset_upper: {"data": heatmap_json, "height": heatmap_height}},
            "standardized_heatmap": {
                dataset_upper: {"data": heatmap_standardized_json, "height": heatmap_standardized_height}},
        }

        return schemas.Task(task_id=task_id, status="SUCCESS", result=result, type="analysis")

    @staticmethod
    def get_task(task_id: str) -> schemas.Task:

        task = worker.get_task(task_id)

        while not task.ready():
            return schemas.Task(task_id=task.state, status=task.info, result="", type="")

        task_type = "analysis" if "table" in task.result else "align"

        return schemas.Task(task_id=task.id, status=task.status, result=task.result, type=task_type)

    @staticmethod
    def get_results(task_id: str, step: str) -> schemas.Task:

        task = worker.get_task(task_id)

        while not task.ready():
            return schemas.Task(task_id=task.state, status=task.info, result="", type="")

        if isinstance(task.result, dict) and task.state != "FAILURE":

            task_type = "analysis" if "table" in task.result else "align"

            if task_type == "analysis":

                result = task.result.get(step)

            elif task_type == "align":

                result = task.result.get(step) if step == "umap" else ""

        else:
            task_type = ""
            result = ""

        return schemas.Task(task_id=task.id, status=task.status, result=result, type=task_type)


class MutationResolver:
    @staticmethod
    async def run_analysis(file: Upload, datasets: List[str]) -> schemas.Task:

        try:

            # Access the file data as a string (UTF-8 encoded)
            contents = await file.read()

            # Decoding the bytes to string and converting to a StringIO object
            csv_data = contents.decode("utf-8")  # Decode bytes to string

            # Validate the datasets input
            valid_datasets = {"gdsc", "prism"}
            selected_datasets = set(datasets)
            if not selected_datasets.issubset(valid_datasets):
                raise ValueError(f"Invalid dataset selection: {selected_datasets - valid_datasets}")

            # Log the selected datasets
            print(f"Selected datasets for analysis: {selected_datasets}")

            # Delay execution of the analysis task using Celery
            task = worker.analysis.s(csv_data, list(selected_datasets)).delay()

            # Return task metadata with initial status
            return schemas.Task(task_id=task.id, status='Data sending', result="", type="analysis")
        except Exception as e:
            # Handle potential errors during file saving or Celery invocation
            print(f"Error during analysis initiation: {e}")
            raise  # Re-raise the exception for further handling

    @staticmethod
    async def run_alignment(file: Upload) -> schemas.Task:
        try:

            # Access the file data as a string (UTF-8 encoded)
            contents = await file.read()

            # Decoding the bytes to string and converting to a StringIO object
            csv_data = contents.decode("utf-8")  # Decode bytes to string

            # Delay execution of the analysis task using Celery
            task = worker.alignment.s(csv_data).delay()

            # Return task metadata with initial status
            return schemas.Task(task_id=task.id, status='Data sending', result="", type="align")
        except Exception as e:
            # Handle potential errors during file saving or Celery invocation
            print(f"Error during analysis initiation: {e}")
            raise  # Re-raise the exception for further handling
