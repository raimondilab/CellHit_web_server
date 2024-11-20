import os
import time

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
    # Step 1: Processing
    self.update_state(state='PROGRESS', meta='Processing')
    time.sleep(1)

    # Step 2: Classification
    self.update_state(state='PROGRESS', meta='Classification')
    time.sleep(2)

    # Step 3: Batch correction
    self.update_state(state='PROGRESS', meta='Batch correction')
    time.sleep(5)

    # Step 4: Imputation
    self.update_state(state='PROGRESS', meta='Imputation')
    time.sleep(10)

    # Step 5: Transform
    self.update_state(state='PROGRESS', meta='Transform')
    time.sleep(15)

    # Step 6: Inference
    self.update_state(state='PROGRESS', meta='Inference')
    time.sleep(20)

    result = {
        "heatmap": "completed",
        "table": {
            "data_loading": "success"
        },
        "celligner": {
            "records_processed": 1000
        },
    }

    return str(result)
