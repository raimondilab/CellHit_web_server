from __future__ import annotations
import asyncio
from fastapi import FastAPI, Request, Response, HTTPException
import uvicorn
from graphql_server import graphql_app
from starlette.middleware.cors import CORSMiddleware
from tasks import worker
import os

from fastapi.responses import FileResponse, JSONResponse

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

# Concurrent GraphQL requests (website and MCP), and how long a request may wait for a slot
GRAPHQL_MAX_CONCURRENT = int(os.environ.get("CELLHIT_API_MAX_CONCURRENT", "8"))
GRAPHQL_QUEUE_TIMEOUT = float(os.environ.get("CELLHIT_API_QUEUE_TIMEOUT", "20"))
graphql_slots = asyncio.Semaphore(GRAPHQL_MAX_CONCURRENT)


# Declared before CORSMiddleware so CORS stays the outer layer and 503 responses keep CORS headers
@app.middleware("http")
async def limit_graphql(request: Request, call_next):
    """Limit concurrent GraphQL requests so a burst of queries cannot stall the server."""
    if not request.url.path.startswith("/graphql"):
        return await call_next(request)
    try:
        await asyncio.wait_for(graphql_slots.acquire(), timeout=GRAPHQL_QUEUE_TIMEOUT)
    except asyncio.TimeoutError:
        return JSONResponse(
            {"errors": [{"message": "CellHit is busy. Try again in a minute."}]},
            status_code=503,
            headers={"Retry-After": "30"},
        )
    try:
        return await call_next(request)
    finally:
        graphql_slots.release()


# Configure CORS (Restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with trusted domains
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
        file_path = "./src/example.csv"

        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found.")

        # Serve the file
        return FileResponse(
            path=file_path,
            filename="example.csv",
            media_type="text/csv"
        )

    @staticmethod
    def download_gdsc_predictions() -> Response:
        """
        Serve the example file gdsc.csv for download.
        """
        file_path = "./src/full_results_gdsc.csv"

        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found.")

        # Serve the file
        return FileResponse(
            path=file_path,
            filename="full_results_gdsc.csv",
            media_type="text/csv"
        )

    @staticmethod
    def download_prism_predictions() -> Response:
        """
        Serve the example file prism.csv for download.
        """
        file_path = "./src/full_results_prism.csv"

        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found.")

        # Serve the file
        return FileResponse(
            path=file_path,
            filename="full_results_prism.csv",
            media_type="text/csv"
        )


# Add route for downloading the file
@app.get("/api/download/example.csv", response_class=FileResponse)
async def download_example():
    return FileResolver.download_example_file()


# Add route for downloading the file
@app.get("/api/download/full_results_gdsc.csv", response_class=FileResponse)
async def download_gdsc_file():
    return FileResolver.download_gdsc_predictions()


# Add route for downloading the file
@app.get("/api/download/full_results_prism.csv", response_class=FileResponse)
async def download_prism_file():
    return FileResolver.download_prism_predictions()

# Main entry point
if __name__ == "__main__":
    # Start FastAPI server
    uvicorn.run(app, host="127.0.0.1", port=8003)