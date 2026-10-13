import json
import os
import re
from pathlib import Path
from typing import Any, Literal

import httpx
from mcp.server.apps import Apps, ResourceCsp
from mcp.server.mcpserver import MCPServer
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import CallToolResult, TextContent
from starlette.requests import Request
from starlette.responses import FileResponse

ENDPOINT = os.environ.get("CELLHIT_GRAPHQL_URL", "http://127.0.0.1:8003/graphql")
TIMEOUT = float(os.environ.get("CELLHIT_TIMEOUT", "60"))
WEB_URL = os.environ.get("CELLHIT_WEB_URL", "https://cellhit.bioinfolab.sns.it")

PUBLIC_HOST = os.environ.get("CELLHIT_MCP_HOST", "mcp.cellhit.bioinfolab.sns.it")
PORT = int(os.environ.get("CELLHIT_MCP_PORT", "8012"))

# plotly.js matching the plotly.py version (5.24.1) that generates the figures
PLOTLY_JS_PATH = os.environ.get(
    "CELLHIT_PLOTLY_JS",
    "/data/SW/Anaconda3-2025.06-1/envs/cellhit/lib/python3.10/site-packages/plotly/package_data/plotly.min.js",
)
PLOTLY_JS_ROUTE = "/libs/plotly-2.35.2.min.js"
PLOTLY_JS_URL = f"https://{PUBLIC_HOST}{PLOTLY_JS_ROUTE}"

UI_DIR = Path(__file__).resolve().parent / "ui"
HEATMAP_URI = "ui://cellhit/heatmap.html"
HEATMAP_TOP = 15
UMAP_URI = "ui://cellhit/umap.html"
UMAP_COLORINGS = ("oncotree", "tissue", "batch")

# Hard cap on rows sent back to the model
MAX_ROWS = 500

# Per-row SHAP dictionaries are large; TopGenes already summarizes them
DROPPED_COLUMNS = {"ShapDictionary"}

# Matches a task UUID anywhere in a string (full result URL or bare ID)
UUID_RE = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)



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

TASK_RESULT_QUERY = """
query TaskResult($taskId: String!, $step: String!) {
  getResults(taskId: $taskId, step: $step) {
    result
  }
}
"""

HEATMAP_QUERY = """
query TaskHeatmap($taskId: String!, $top: Int!, $dataset: String!) {
  getHeatmap(taskId: $taskId, top: $top, dataset: $dataset) {
    result
  }
}
"""


def load_ui(filename: str) -> str:
    """Read an MCP App HTML file and inject the plotly.js URL."""
    html = (UI_DIR / filename).read_text(encoding="utf-8")
    return html.replace("{{PLOTLY_JS_URL}}", PLOTLY_JS_URL)


def decode_json(value: Any) -> Any:
    """Decode a value that the API may return as a JSON-encoded string."""
    return json.loads(value) if isinstance(value, str) else value


# MCP App tools must be registered before MCPServer is created
apps = Apps()
apps.add_html_resource(
    HEATMAP_URI,
    load_ui("heatmap.html"),
    title="CellHit heatmap",
    csp=ResourceCsp(resource_domains=[f"https://{PUBLIC_HOST}"]),
)


async def available_heatmap_datasets(task_id: str) -> list[str]:
    """List the datasets (GDSC, PRISM) that were run for an analysis task."""
    data = await graphql(TASK_RESULT_QUERY, {"taskId": task_id, "step": "heatmap"})
    precomputed = decode_json(data["getResults"]["result"]) or {}
    return [name for name in ("GDSC", "PRISM") if name in precomputed]


async def fetch_heatmap(task_id: str, dataset: str) -> dict[str, Any] | None:
    """Fetch the median-scaled and standardized heatmap figures of one dataset."""
    data = await graphql(HEATMAP_QUERY, {"taskId": task_id, "top": HEATMAP_TOP, "dataset": dataset})
    result = decode_json(data["getHeatmap"]["result"])
    if not result:
        return None
    heatmap = result["heatmap"][dataset]
    standardized = result["standardized_heatmap"][dataset]
    return {
        "dataset": dataset,
        "figures": {
            "heatmap": decode_json(heatmap["data"]),
            "standardized": decode_json(standardized["data"]),
        },
        "height": heatmap["height"],
    }


@apps.tool(
    resource_uri=HEATMAP_URI,
    description=(
        f"Show an interactive heatmap of the top {HEATMAP_TOP} drugs for a completed "
        "CellHit analysis task. The user can switch dataset and scaling in the view. "
        "Always share `result_page` with the user."
    ),
)
async def show_heatmap(task: str, dataset: Literal["GDSC", "PRISM"]) -> CallToolResult:
    """Args:
        task: CellHit result URL or bare task ID.
        dataset: "GDSC" or "PRISM", the dataset shown first.
    """
    status = await get_task_status(task)
    if status["state"] != "completed":
        return CallToolResult(content=[TextContent(type="text", text=json.dumps(status))])

    task_id = status["task_id"]
    url = result_page_url(task_id, status["task_type"])
    if status["task_type"] != "analysis":
        text = f"Alignment-only task: there is no heatmap. Full results: {url}"
        return CallToolResult(content=[TextContent(type="text", text=text)])

    datasets = await available_heatmap_datasets(task_id)
    if dataset not in datasets:
        text = (
            f"{dataset} was not run for this task. Available: {', '.join(datasets) or 'none'}. "
            f"Full results: {url}"
        )
        return CallToolResult(content=[TextContent(type="text", text=text)])

    heatmap = await fetch_heatmap(task_id, dataset)
    if heatmap is None:
        text = f"No heatmap available for this task. Full results: {url}"
        return CallToolResult(content=[TextContent(type="text", text=text)])

    # The figures go only to the App; the model gets a short summary
    return CallToolResult(
        content=[
            TextContent(
                type="text",
                text=f"Heatmap of the top {HEATMAP_TOP} {dataset} drugs for task {task_id} "
                f"is shown to the user. Full results: {url}",
            )
        ],
        structured_content={"task_id": task_id, "result_page": url, "datasets": datasets, **heatmap},
    )


@apps.tool(
    resource_uri=HEATMAP_URI,
    visibility=["app"],
    description="Return the heatmap figures of one dataset for the CellHit App.",
)
async def get_heatmap_figures(task_id: str, dataset: Literal["GDSC", "PRISM"]) -> CallToolResult:
    """Args:
        task_id: Bare task ID.
        dataset: "GDSC" or "PRISM".
    """
    heatmap = await fetch_heatmap(parse_task_id(task_id), dataset)
    if heatmap is None:
        return CallToolResult(
            content=[TextContent(type="text", text=f"No {dataset} heatmap available.")],
            is_error=True,
        )
    return CallToolResult(
        content=[TextContent(type="text", text=f"{dataset} heatmap figures.")],
        structured_content=heatmap,
    )


async def fetch_umap(task_id: str) -> dict[str, Any]:
    """Fetch the UMAP figures of a task, keyed by coloring."""
    data = await graphql(TASK_RESULT_QUERY, {"taskId": task_id, "step": "umap"})
    return decode_json(data["getResults"]["result"]) or {}


apps.add_html_resource(
    UMAP_URI,
    load_ui("umap.html"),
    title="CellHit alignment",
    csp=ResourceCsp(resource_domains=[f"https://{PUBLIC_HOST}"]),
)


@apps.tool(
    resource_uri=UMAP_URI,
    description=(
        "Show an interactive UMAP of a CellHit task: the user's samples aligned with "
        "the CCLE and TCGA reference samples, colored by oncotree code, tissue or batch. "
        "Works for analysis and alignment-only tasks. Always share `result_page` with the user."
    ),
)
async def show_umap(task: str) -> CallToolResult:
    """Args:
        task: CellHit result URL or bare task ID.
    """
    status = await get_task_status(task)
    if status["state"] != "completed":
        return CallToolResult(content=[TextContent(type="text", text=json.dumps(status))])

    task_id = status["task_id"]
    url = result_page_url(task_id, status["task_type"])
    umap = await fetch_umap(task_id)
    colorings = [name for name in UMAP_COLORINGS if name in umap]
    if not colorings:
        text = f"No UMAP available for this task. Full results: {url}"
        return CallToolResult(content=[TextContent(type="text", text=text)])

    # Only the available colorings are sent here; the App loads each figure on demand
    return CallToolResult(
        content=[
            TextContent(
                type="text",
                text=f"UMAP of task {task_id} is shown to the user, colored by "
                f"{', '.join(colorings)}. Full results: {url}",
            )
        ],
        structured_content={"task_id": task_id, "result_page": url, "colorings": colorings},
    )


@apps.tool(
    resource_uri=UMAP_URI,
    visibility=["app"],
    description="Return one UMAP figure of a task for the CellHit App.",
)
async def get_umap_figure(
    task_id: str, coloring: Literal["oncotree", "tissue", "batch"]
) -> CallToolResult:
    """Args:
        task_id: Bare task ID.
        coloring: "oncotree", "tissue" or "batch".
    """
    umap = await fetch_umap(parse_task_id(task_id))
    if coloring not in umap:
        return CallToolResult(
            content=[TextContent(type="text", text=f"Coloring '{coloring}' not available.")],
            is_error=True,
        )
    return CallToolResult(
        content=[TextContent(type="text", text=f"UMAP figure colored by {coloring}.")],
        structured_content={"coloring": coloring, "figure": decode_json(umap[coloring])},
    )


mcp = MCPServer("cellhit", extensions=[apps])


@mcp.custom_route(PLOTLY_JS_ROUTE, methods=["GET"])
async def plotly_js(request: Request) -> FileResponse:
    """Serve plotly.js for the MCP App iframes."""
    return FileResponse(
        PLOTLY_JS_PATH,
        media_type="application/javascript",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


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

    data = await graphql(TASK_RESULT_QUERY, {"taskId": task_id, "step": "table"})
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
    # In mcp v2, transport settings are passed to run() instead of the constructor
    mcp.run(
        transport="streamable-http",
        host="127.0.0.1",
        port=PORT,
        transport_security=TransportSecuritySettings(
            allowed_hosts=[PUBLIC_HOST, f"127.0.0.1:{PORT}", f"localhost:{PORT}"],
            allowed_origins=[f"https://{PUBLIC_HOST}"],
        ),
    )