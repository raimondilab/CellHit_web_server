import os
import time
import pandas as pd
import numpy as np

from celery import Celery
from celery.result import AsyncResult
from subprocess import Popen

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


@celery.task
def divide_numbers(x, y):
    try:
        if y == 0:
            raise ValueError("Division by zero")
        return x / y
    except Exception as e:
        return str(e)


@celery.task(bind=True)
def analysis(self):

    # d = file.read().decode("utf-8")
    # print(d)

    # Step 1: Processing
    self.update_state(state='PROGRESS', meta='Processing')
    #gbm = read_GBM(data_path)
    #print(gbm)

    # Step 2: Classification
    self.update_state(state='PROGRESS', meta='Classification')
    time.sleep(20)

    # Step 3: Batch correction
    self.update_state(state='PROGRESS', meta='Batch correction')
    time.sleep(50)

    # Step 4: Imputation
    self.update_state(state='PROGRESS', meta='Imputation')
    time.sleep(20)

    # Step 5: Transform
    self.update_state(state='PROGRESS', meta='Transform')
    time.sleep(20)

    # Step 6: Inference
    self.update_state(state='PROGRESS', meta='Inference')
    time.sleep(2)

    result = {
        "heatmap": "completed",
        "table": {
            "data_loading": "success"
        },
        "celligner": {
            "records_processed": 1000
        },
    }
    return result


# Load and preprocess GBM data
def read_GBM(data_path):

    gbm = pd.read_csv(data_path, sep='\t').transpose()
    gbm.columns = [i.split('_')[1] for i in gbm.columns]
    gbm = gbm.loc[:, gbm.std() != 0]

    # take the average of duplicate columns
    gbm = gbm.groupby(gbm.columns, axis=1).mean()

    gbm = gbm.reset_index()
    gbm['index'] = gbm['index'].apply(lambda x: 'FPS_' + x)
    gbm = gbm.set_index('index')

    # add one to all values and than take log2
    gbm = gbm.apply(lambda x: np.log2(x + 1))

    return gbm


def data_frame_completer(df, genes,return_genes=False,fill_value=np.nan):
    missing_genes = list(set(genes) - set(df.columns))
    common_genes = list(set(df.columns).intersection(genes))
    df = df.reindex(columns=genes, fill_value=fill_value)
    if return_genes:
        return df, missing_genes,common_genes
    else:
        return df