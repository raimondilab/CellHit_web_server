import json
import os
import re
from typing import Any, Literal

import httpx
from mcp.server.mcpserver import MCPServer
from mcp.server.transport_security import TransportSecuritySettings

ENDPOINT = os.environ.get("CELLHIT_GRAPHQL_URL", "http://127.0.0.1:8003/graphql")
TIMEOUT = float(os.environ.get("CELLHIT_TIMEOUT", "60"))
WEB_URL = os.environ.get("CELLHIT_WEB_URL", "https://cellhit.bioinfolab.sns.it")

PUBLIC_HOST = os.environ.get("CELLHIT_MCP_HOST", "mcp.cellhit.bioinfolab.sns.it")
PORT = int(os.environ.get("CELLHIT_MCP_PORT", "8011"))

# Hard cap on rows sent back to the model
MAX_ROWS = 500

# Per-row SHAP dictionaries are large; TopGenes already summarizes them
DROPPED_COLUMNS = {"ShapDictionary"}

# Matches a task UUID anywhere in a string (full result URL or bare ID)
UUID_RE = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)

mcp = MCPServer("cellhit")


async def graphql(query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
    """Send a GraphQL request to the CellHit API and return its `data` object."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(
            ENDPOINT, json={"query": query, "variables": variables or {}}
        )
    response.raise_for_status()
    payload = response.json()
    if payload.get("errors"):
        raise RuntimeError(payload["errors"][0].get("message", "GraphQL error"))
    return payload["data"]


def parse_task_id(task: str) -> str:
    """Extract the task ID from a CellHit result URL or a bare ID."""
    match = UUID_RE.search(task)
    if not match:
        raise ValueError("No task ID found. Pass a CellHit result URL or a task ID.")
    return match.group(0).lower()


def result_page_url(task_id: str, task_type: str) -> str:
    """Build the link to the full result page on the CellHit website."""
    page = "resultAlign" if task_type == "align" else "result"
    return f"{WEB_URL}/{page}/?taskId={task_id}"


# `result` is not requested on purpose: it keeps the status check lightweight
TASK_STATUS_QUERY = """
query TaskStatus($taskId: String!, $step: String!) {
  getResults(taskId: $taskId, step: $step) {
    taskId
    status
    type
  }
}
"""

TASK_TABLE_QUERY = """
query TaskTable($taskId: String!, $step: String!) {
  getResults(taskId: $taskId, step: $step) {
    result
  }
}
"""


@mcp.tool()
async def get_task_status(task: str) -> dict[str, Any]:
    """Check the state of a CellHit user task.

    Args:
        task: CellHit result URL (e.g. https://cellhit.bioinfolab.sns.it/result/?taskId=...)
            or the bare task ID.

    Returns state "completed", "running", "failed" or "not_found".
    "not_found" means the results were deleted or have expired.
    """
    task_id = parse_task_id(task)
    data = await graphql(TASK_STATUS_QUERY, {"taskId": task_id, "step": "umap"})
    info = data["getResults"]

    # While a task is not ready, the API returns the Celery state in `taskId`
    if info["taskId"] != task_id:
        celery_state = info["taskId"]
        if celery_state == "PENDING":
            return {
                "task_id": task_id,
                "state": "not_found",
                "message": "No results found for this task: they were deleted or have expired.",
            }
        return {"task_id": task_id, "state": "running", "progress": info["status"]}

    if info["status"] == "SUCCESS":
        return {"task_id": task_id, "state": "completed", "task_type": info["type"]}

    return {"task_id": task_id, "state": "failed", "celery_status": info["status"]}


@mcp.tool()
async def get_task_results(
    task: str,
    dataset: Literal["GDSC", "PRISM"],
    drug: str | None = None,
    sample: str | None = None,
    limit: int = 50,
) -> dict[str, Any]:
    """Get predictions from a completed CellHit analysis task, filtered by drug and/or sample.

    At least one of `drug` or `sample` is required, since full tables can be very large.
    Always share `result_page` with the user so they can open the complete results.

    `prediction` is ln(IC50) for GDSC and log-fold change for PRISM. In both, lower
    values mean higher sensitivity. The two scales are not comparable: rank and
    compare predictions only within the same dataset.

    Args:
        task: CellHit result URL or bare task ID.
        dataset: "GDSC" or "PRISM".
        drug: Drug name, case-insensitive partial match.
        sample: Sample (patient) index, exact match.
        limit: Maximum rows to return (max 500).
    """
    if not drug and not sample:
        raise ValueError("Pass at least one filter: drug or sample.")

    status = await get_task_status(task)
    if status["state"] != "completed":
        return status

    task_id = status["task_id"]
    url = result_page_url(task_id, status["task_type"])

    if status["task_type"] != "analysis":
        return {
            "task_id": task_id,
            "message": "Alignment-only task: there is no prediction table.",
            "result_page": url,
        }

    data = await graphql(TASK_TABLE_QUERY, {"taskId": task_id, "step": "table"})
    table = data["getResults"]["result"]
    # The custom JSON scalar is serialized as a string
    if isinstance(table, str):
        table = json.loads(table)

    drug_query = drug.lower() if drug else None
    rows = [
        row
        for row in table
        if (drug_query is None or drug_query in str(row.get("DrugName", "")).lower())
        and (sample is None or str(row.get("index")) == sample)
        and row.get("dataset") == dataset
    ]

    limit = max(1, min(limit, MAX_ROWS))
    return {
        "task_id": task_id,
        "total_matches": len(rows),
        "returned": min(len(rows), limit),
        "rows": [
            {key: value for key, value in row.items() if key not in DROPPED_COLUMNS}
            for row in rows[:limit]
        ],
        "result_page": url,
    }


if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        host="127.0.0.1",
        port=PORT,
        transport_security=TransportSecuritySettings(
            allowed_hosts=[PUBLIC_HOST, f"127.0.0.1:{PORT}", f"localhost:{PORT}"],
            allowed_origins=[f"https://{PUBLIC_HOST}"],
        ),
    )