from __future__ import annotations
from fastapi import FastAPI
import uvicorn
from graphql_server import graphql_app
from starlette.middleware.cors import CORSMiddleware
import sentry_sdk

sentry_sdk.init(
    dsn="https://863b659d00cb837a8f025676cb0aba36@o4505080802312192.ingest.us.sentry.io/4507022847770624",
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)

# Create API
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add the `/graphql` route and set `graphql_app` as its route handler
app.include_router(graphql_app, prefix='/graphql')


if __name__ == "__main__":
    # For local debugging
    uvicorn.run(app, host="127.0.0.1", port=8003)
