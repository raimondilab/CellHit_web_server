from __future__ import annotations
from fastapi import FastAPI
import uvicorn
from graphql_server import graphql_app
from starlette.middleware.cors import CORSMiddleware

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
    uvicorn.run(app, host="127.0.0.1", port=8001)
