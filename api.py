from __future__ import annotations
from fastapi import FastAPI
import uvicorn
from graphql_server import graphql_app
from starlette.middleware.cors import CORSMiddleware
from tasks import worker
import os

import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.fastapi import FastApiIntegration

# Initialize Sentry for monitoring errors and performance
# sentry_sdk.init(
#     dsn="https://863b659d00cb837a8f025676cb0aba36@o4505080802312192.ingest.us.sentry.io/4507022847770624",
#     integrations=[CeleryIntegration(), FastApiIntegration()],
#     traces_sample_rate=1.0,
#     profiles_sample_rate=1.0,
# )


# Start Flower (task monitoring) and Celery worker
flower_process = worker.start_flower()
celery_worker = worker.start_celery()

# Create FastAPI app
app = FastAPI()

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


# Main entry point
if __name__ == "__main__":
    # Start FastAPI server
    uvicorn.run(app, host="127.0.0.1", port=8003)
