from __future__ import annotations
from fastapi import FastAPI, Response, HTTPException
import uvicorn
from graphql_server import graphql_app
from starlette.middleware.cors import CORSMiddleware
from tasks import worker
import os

import pandas as pd
from fastapi.responses import StreamingResponse
from io import BytesIO, StringIO
import requests
from fpdf import FPDF
import zipfile

from fastapi.responses import FileResponse
import uuid

EXPORT_DIR = "./exports"
os.makedirs(EXPORT_DIR, exist_ok=True)

import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.fastapi import FastApiIntegration

# Initialize Sentry for monitoring errors and performance
sentry_sdk.init(
    dsn="https://863b659d00cb837a8f025676cb0aba36@o4505080802312192.ingest.us.sentry.io/4507022847770624",
    integrations=[CeleryIntegration(), FastApiIntegration()],
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)

# Start Flower (task monitoring) and Celery worker
flower_process = worker.start_flower()
celery_worker = worker.start_celery("cellhit")

# Create FastAPI app
app = FastAPI()

# Configure CORS (Restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add the `/graphql` route and set `graphql_app` as its handler
app.include_router(graphql_app, prefix='/graphql')


class FileResolver:
    @staticmethod
    def download_example_file() -> Response:
        """
        Serve the example file GBM.csv for download.
        """
        file_path = "./src/GBM.csv"

        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found.")

        # Serve the file
        return FileResponse(
            path=file_path,
            filename="GBM.csv",
            media_type="text/csv"
        )


# Add route for downloading the file
@app.get("/api/download/GBM.csv", response_class=FileResponse)
async def download_gbm_file():
    return FileResolver.download_example_file()


def get_data_by_step(task_id):
    """
    Fetch data from the API using GraphQL.
    """
    query_string = f"""
    query getResults {{
        getResults(taskId: "{task_id}", step: "table") {{
            result
        }}
    }}
    """

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36"
    }

    try:
        response = requests.post(
            "https://api.cellhit.bioinfolab.sns.it/graphql",
            headers=headers,
            json={"query": query_string}
        )
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx and 5xx)
        return response.json().get('data', {})
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None


def generate_zipped_file_to_disk(content: bytes, filename: str, zip_name: str = "export.zip") -> FileResponse:
    """
    Gera um arquivo ZIP com o conteúdo e salva no disco.
    Retorna como FileResponse.
    """
    zip_path = os.path.join(EXPORT_DIR, zip_name)

    with zipfile.ZipFile(zip_path, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(filename, content)

    return FileResponse(
        path=zip_path,
        filename=zip_name,
        media_type="application/zip"
    )


def generate_file(data, file_format: str) -> FileResponse:
    if not data or "getResults" not in data:
        raise HTTPException(status_code=404, detail="No data found for this task.")

    result_data = data["getResults"]["result"]

    try:
        df = pd.DataFrame(result_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting result to table: {e}")

    unique_id = str(uuid.uuid4())  # para nome único

    if file_format == "csv":
        stream = StringIO()
        df.to_csv(stream, index=False)
        content = stream.getvalue().encode("utf-8")
        return generate_zipped_file_to_disk(content, "result.csv", zip_name=f"{unique_id}.zip")

    elif file_format == "excel":
        stream = BytesIO()
        with pd.ExcelWriter(stream, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Results')
        stream.seek(0)
        return generate_zipped_file_to_disk(stream.read(), "result.xlsx", zip_name=f"{unique_id}.zip")

    elif file_format == "pdf":
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=10)
        col_width = pdf.w / (len(df.columns) + 1)
        row_height = pdf.font_size * 1.5

        for col in df.columns:
            pdf.cell(col_width, row_height, txt=str(col), border=1)
        pdf.ln(row_height)

        for _, row in df.iterrows():
            for item in row:
                pdf.cell(col_width, row_height, txt=str(item), border=1)
            pdf.ln(row_height)

        pdf_stream = BytesIO()
        pdf.output(pdf_stream)
        pdf_stream.seek(0)
        return generate_zipped_file_to_disk(pdf_stream.read(), "result.pdf", zip_name=f"{unique_id}.zip")

    else:
        raise HTTPException(status_code=400, detail="Unsupported file format.")


@app.get("/api/export/{task_id}")
async def export_task_data(task_id: str, format: str = "csv"):
    data = get_data_by_step(task_id)
    return generate_file(data, format)


# Main entry point
if __name__ == "__main__":
    # Start FastAPI server
    uvicorn.run(app, host="127.0.0.1", port=8003)
