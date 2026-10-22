import asyncio
import json
import os
import re
from pathlib import Path
from typing import Any, Literal

import httpx
from mcp.server.apps import Apps, ResourceCsp
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import CallToolResult, TextContent
from starlette.requests import Request
from starlette.responses import FileResponse
import sentry_sdk

sentry_sdk.init(
    dsn="https://d092fe5ca5e085c31d821df339148ad6@o4505080802312192.ingest.us.sentry.io/4512253891969024",
    # Add data like request headers and IP for users,
    # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
    send_default_pii=True,
    # Enable sending logs to Sentry
    enable_logs=True,
    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for tracing.
    traces_sample_rate=1.0,
    # Set profile_session_sample_rate to 1.0 to profile 100%
    # of profile sessions.
    profile_session_sample_rate=1.0,
)


def slow_function():
    import time
    time.sleep(0.1)
    return "done"


def fast_function():
    import time
    time.sleep(0.05)
    return "done"


# Manually call start_profiler and stop_profiler
# to profile the code in between
sentry_sdk.profiler.start_profiler()

for i in range(0, 10):
    slow_function()
    fast_function()

# Calls to stop_profiler are optional - if you don't stop the profiler, it will keep profiling
# your application until the process exits or stop_profiler is called.
sentry_sdk.profiler.stop_profiler()

ENDPOINT = os.environ.get("CELLHIT_GRAPHQL_URL", "http://127.0.0.1:8003/graphql")
TIMEOUT = float(os.environ.get("CELLHIT_TIMEOUT", "60"))
# Concurrent requests from the MCP to the CellHit API, and how long a request may wait for a slot
MAX_CONCURRENT = int(os.environ.get("CELLHIT_MAX_CONCURRENT", "4"))
QUEUE_TIMEOUT = float(os.environ.get("CELLHIT_QUEUE_TIMEOUT", "30"))
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
# Marker symbols set by the worker's draw_scatter_plot
UMAP_SYMBOLS = (
    "In the plot, the user's samples are diamonds, TCGA reference samples are crosses "
    "and CCLE cell lines are circles; hovering a point shows its ID, OncoTree code and tissue."
)

# Hard caps on rows sent back to the model
MAX_ROWS = 500
MAX_ROWS_PRECOMPUTED = 200

# Per-row SHAP dictionaries are large; TopGenes already summarizes them
DROPPED_COLUMNS = {"ShapDictionary"}

# Matches a task UUID anywhere in a string (full result URL or bare ID)
UUID_RE = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)



# Keeps MCP traffic from saturating the API that also serves the website
api_slots = asyncio.Semaphore(MAX_CONCURRENT)


async def graphql(query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
    """Send a GraphQL request to the CellHit API and return its `data` object.

    Errors are raised as ToolError so their message reaches the client;
    other exceptions are reported without details.
    """
    try:
        await asyncio.wait_for(api_slots.acquire(), timeout=QUEUE_TIMEOUT)
    except asyncio.TimeoutError as error:
        raise ToolError("CellHit is busy. Try again in a minute.") from error
    try:
        return await _send(query, variables)
    finally:
        api_slots.release()


async def _send(query: str, variables: dict[str, Any] | None) -> dict[str, Any]:
    """Post one GraphQL request; called only while holding an API slot."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(
                ENDPOINT, json={"query": query, "variables": variables or {}}
            )
        response.raise_for_status()
    except httpx.HTTPStatusError as error:
        # 503 comes from the API's own request limiter
        if error.response.status_code == 503:
            raise ToolError("CellHit is busy. Try again in a minute.") from error
        raise ToolError(f"CellHit API returned HTTP {error.response.status_code}.") from error
    except httpx.HTTPError as error:
        raise ToolError("CellHit API is unreachable. Try again later.") from error
    payload = response.json()
    if payload.get("errors"):
        raise ToolError(payload["errors"][0].get("message", "GraphQL error"))
    return payload["data"]


def parse_task_id(task: str) -> str:
    """Extract the task ID from a CellHit result URL or a bare ID."""
    match = UUID_RE.search(task)
    if not match:
        raise ToolError("No task ID found. Pass a CellHit result URL or a task ID.")
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


def count_drugs(figure: dict[str, Any]) -> int:
    """Number of drug columns in a clustergram figure (x labels of its heatmap trace)."""
    return sum(len(trace.get("x") or []) for trace in figure.get("data", []) if trace.get("type") == "heatmap")


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
        "Show an interactive drug-sensitivity heatmap for a completed CellHit analysis task. "
        "The user can switch dataset and scaling in the view. "
        "Each view selects its own drugs: drugs with low variability (CV <= 0.1) or highly correlated "
        f"with another drug (|r| > 0.9) are removed, the {HEATMAP_TOP} most variable remaining drugs are kept, "
        "and any drug below -1 in every sample is always added. Drugs are chosen by variability, not efficacy. "
        "Median view: prediction minus the drug's median (negative = more sensitive than typical); the "
        f"always-added drugs can make it show more than {HEATMAP_TOP} drugs. "
        f"Standardized view: values standardized per drug across the task's samples (mean 0), so at most "
        f"{HEATMAP_TOP} drugs. The tool result reports how many drugs each view shows. "
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
    n_median = count_drugs(heatmap["figures"]["heatmap"])
    n_standardized = count_drugs(heatmap["figures"]["standardized"])
    return CallToolResult(
        content=[
            TextContent(
                type="text",
                text=f"{dataset} heatmap for task {task_id} is shown to the user: "
                f"{n_median} drugs in the Median view, {n_standardized} in the Standardized view. "
                f"Full results: {url}",
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
        f"{UMAP_SYMBOLS} "
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
                f"{', '.join(colorings)}. {UMAP_SYMBOLS} Full results: {url}",
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

    Returned fields:
    - DrugID, DrugName, PutativeTarget: drug identifier, name and declared primary protein targets.
    - index: the user's sample ID. dataset: GDSC or PRISM.
    - prediction: predicted sensitivity (GDSC ln(IC50) in uM; PRISM log2 fold change in viability).
      Lower = more sensitive. std: standard deviation across the model ensemble; lower = more confident.
    - DrugMin / DrugMedian / DrugMax: experimentally observed sensitivity for this drug across the screened
      cell lines (same units as prediction): most sensitive, typical and most resistant cases.
    - QuantileScore: 0-1 harmonic mean of efficacy (how the drug ranks against the other drugs for this sample)
      and selectivity (how this sample ranks against the other samples for this drug). Close to 1 = potent and
      selective for this sample. Not a confidence measure (see std).
    - TopGenes: the 15 genes with the largest absolute SHAP contribution to this prediction.
      RecoveredTargets: TopGenes that are also putative targets of the drug ("No recovered targets" if none).
    - ccle_transcriptomic_neigh, ccle_transcriptomic_neigh_name, ccle_transcriptomic_neigh_tissue: DepMap ID,
      common name and tissue (OncoTree lineage) of the CCLE cell line with the closest transcriptome.
      tcga_transcriptomic_neigh, tcga_transcriptomic_neigh_tissue: closest TCGA sample and its tissue.
    - ccle_response_neigh*, tcga_response_neigh*: the same, for the closest predicted drug-response profile.
      "No tissue" means the information is missing.
    """
    if not drug and not sample:
        raise ToolError("Pass at least one filter: drug or sample.")

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


PRECOMPUTED_FIELDS = """
    drugName drugId source sampleIndex
    predictions predictionsStd quantileScore
    experimentalMin experimentalMedian experimentalMax modelCorr modelMse
    transcrCcleNeigh transcrCcleNeighCelllinename transcrCcleNeighOncotree
    transcrTcgaNeigh transcrTcgaNeighDiagnosis transcrTcgaNeighSite
    responseCcleNeigh responseCcleNeighCelllinename responseCcleNeighOncotree
    responseTcgaNeigh responseTcgaNeighDiagnosis responseTcgaNeighSite
    putativeTarget topLocalShapGenes
"""

# OncoTree cancer types found in the CCLE neighbor columns
ONCOTREE_TYPES = "; ".join(
    (
        "Acute Myeloid Leukemia",
        "Adenosquamous Carcinoma of the Pancreas",
        "Adrenocortical Carcinoma",
        "Ampullary Carcinoma",
        "Anaplastic Thyroid Cancer",
        "B-Lymphoblastic Leukemia/Lymphoma",
        "Bladder Squamous Cell Carcinoma",
        "Bladder Urothelial Carcinoma",
        "Breast Ductal Carcinoma In Situ",
        "Breast Neoplasm, NOS",
        "Cervical Adenocarcinoma",
        "Cervical Squamous Cell Carcinoma",
        "Chondrosarcoma",
        "Colorectal Adenocarcinoma",
        "Cutaneous Squamous Cell Carcinoma",
        "Diffuse Glioma",
        "Embryonal Tumor",
        "Endometrial Carcinoma",
        "Epithelioid Sarcoma",
        "Esophageal Squamous Cell Carcinoma",
        "Esophagogastric Adenocarcinoma",
        "Ewing Sarcoma",
        "Fibrosarcoma",
        "Gestational Trophoblastic Disease",
        "Glassy Cell Carcinoma of the Cervix",
        "Head and Neck Squamous Cell Carcinoma",
        "Hepatoblastoma",
        "Hepatocellular Carcinoma",
        "Hepatocellular Carcinoma plus Intrahepatic Cholangiocarcinoma",
        "Hodgkin Lymphoma",
        "Intracholecystic Papillary Neoplasm",
        "Intraductal Papillary Neoplasm of the Bile Duct",
        "Invasive Breast Carcinoma",
        "Leiomyosarcoma",
        "Liposarcoma",
        "Lung Neuroendocrine Tumor",
        "Medullary Thyroid Cancer",
        "Melanoma",
        "Meningothelial Tumor",
        "Merkel Cell Carcinoma",
        "Mixed Cervical Carcinoma",
        "Mucosal Melanoma of the Vulva/Vagina",
        "Myelodysplastic Syndromes",
        "Myeloproliferative Neoplasms",
        "Nerve Sheath Tumor",
        "Neuroblastoma",
        "Non-Cancerous",
        "Non-Hodgkin Lymphoma",
        "Non-Seminomatous Germ Cell Tumor",
        "Non-Small Cell Lung Cancer",
        "Ocular Melanoma",
        "Osteosarcoma",
        "Ovarian Cancer, Other",
        "Ovarian Epithelial Tumor",
        "Ovarian Germ Cell Tumor",
        "Pancreatic Adenocarcinoma",
        "Pancreatic Neuroendocrine Tumor",
        "Pleural Mesothelioma",
        "Poorly Differentiated Thyroid Cancer",
        "Prostate Adenocarcinoma",
        "Prostate Small Cell Carcinoma",
        "Renal Cell Carcinoma",
        "Retinoblastoma",
        "Rhabdoid Cancer",
        "Rhabdomyosarcoma",
        "Sarcoma, NOS",
        "Small Bowel Cancer",
        "Squamous Cell Carcinoma of the Vulva/Vagina",
        "Synovial Sarcoma",
        "T-Lymphoblastic Leukemia/Lymphoma",
        "Undifferentiated Pleomorphic Sarcoma/Malignant Fibrous Histiocytoma/High-Grade Spindle Cell Sarcoma",
        "Urethral Cancer",
        "Uterine Sarcoma/Mesenchymal",
        "Well-Differentiated Thyroid Cancer",
    )
)

# Tissue labels of the sample annotation (OncoTree tissues)
TISSUES = ", ".join(
    (
        "CNS/Brain",
        "Bowel",
        "Myeloid",
        "Esophagus/Stomach",
        "Pleura",
        "Skin",
        "Lung",
        "Testis",
        "Soft Tissue",
        "Kidney",
        "Liver",
        "Prostate",
        "Breast",
        "Head and Neck",
        "Cervix",
        "Ovary/Fallopian Tube",
        "Uterus",
        "Thymus",
        "Thyroid",
        "Bladder/Urinary Tract",
        "Pancreas",
        "Adrenal Gland",
        "Eye",
        "Biliary Tract",
        "Lymphoid",
        "Peripheral Nervous System",
        "Ampulla of Vater",
        "Vulva/Vagina",
        "Bone",
    )
)

# TCGA study codes; only TCGA samples have one (TARGET and Treehouse samples do not)
TCGA_CODES = "; ".join(
    (
        "ACC (Adrenocortical carcinoma)",
        "BLCA (Bladder Urothelial Carcinoma)",
        "BRCA (Breast Invasive Carcinoma)",
        "CESC (Cervical Squamous Cell Carcinoma and Endocervical Adenocarcinoma)",
        "CHOL (Cholangiocarcinoma)",
        "COAD (Colon Adenocarcinoma)",
        "DLBC (Lymphoid Neoplasm Diffuse Large B-cell Lymphoma)",
        "ESCA (Esophageal Carcinoma)",
        "GBM (Glioblastoma Multiforme)",
        "HNSC (Head and Neck Squamous Cell Carcinoma)",
        "KICH (Kidney Chromophobe)",
        "KIRC (Kidney Renal Clear Cell Carcinoma)",
        "KIRP (Kidney Renal Papillary Cell Carcinoma)",
        "LAML (Acute Myeloid Leukemia)",
        "LGG (Brain Lower Grade Glioma)",
        "LIHC (Liver Hepatocellular Carcinoma)",
        "LUAD (Lung Adenocarcinoma)",
        "LUSC (Lung Squamous Cell Carcinoma)",
        "MESO (Mesothelioma)",
        "OV (Ovarian Serous Cystadenocarcinoma)",
        "PAAD (Pancreatic Adenocarcinoma)",
        "PCPG (Pheochromocytoma and Paraganglioma)",
        "PRAD (Prostate Adenocarcinoma)",
        "READ (Rectum Adenocarcinoma)",
        "SARC (Sarcoma)",
        "SKCM (Skin Cutaneous Melanoma)",
        "STAD (Stomach Adenocarcinoma)",
        "TGCT (Testicular Germ Cell Tumors)",
        "THCA (Thyroid Carcinoma)",
        "THYM (Thymoma)",
        "UCEC (Uterine Corpus Endometrial Carcinoma)",
        "UCS (Uterine Carcinosarcoma)",
        "UVM (Uveal Melanoma)",
    )
)

# Meaning of the returned fields, from the CellHit help page
PRECOMPUTED_FIELD_GLOSSARY = """Returned fields:
- drugName, drugId: drug name and its GDSC or PRISM identifier. putativeTarget: declared primary protein targets of the drug.
- sampleIndex: sample ID (TCGA, TARGET or Treehouse barcode, or CCLE DepMap ID such as ACH-001113).
  source: TCGA for patient samples (including TARGET and Treehouse), CCLE for cell lines.
- predictions: predicted sensitivity (GDSC ln(IC50) in uM; PRISM log2 fold change in viability). Lower = more sensitive.
  predictionsStd: standard deviation across the model ensemble; lower = more confident prediction.
- quantileScore: 0-1 harmonic mean of efficacy (how the drug ranks against the other drugs for this sample)
  and selectivity (how this sample ranks against the other samples for this drug). Close to 1 = the drug is both
  potent and selective for this sample. It is not a confidence measure (see predictionsStd).
- modelCorr: median Pearson correlation between predicted and experimental values of this drug's model on held-out
  test sets across 20 random splits. Higher = more reliable predictions for this drug; weigh low values with caution.
  modelMse: median mean squared error over the same splits, on per-drug standardized values (not prediction units).
  Lower = more accurate.
- experimentalMin / experimentalMedian / experimentalMax: experimentally observed sensitivity for this drug across
  the screened cell lines (same units as predictions): most sensitive, typical and most resistant cases.
  Use them to place a prediction in context.
- topLocalShapGenes: the 15 genes that contributed most to this prediction (SHAP feature attribution).
- transcrCcleNeigh, transcrCcleNeighCelllinename, transcrCcleNeighOncotree: DepMap ID, common name and OncoTree cancer type
  of the CCLE cell line whose transcriptome is closest to the sample (Euclidean distance).
- transcrTcgaNeigh, transcrTcgaNeighDiagnosis, transcrTcgaNeighSite: ID, GDC histological diagnosis and GDC anatomic site
  of the transcriptomically closest TCGA sample.
- responseCcleNeigh*, responseTcgaNeigh*: the same, for the CCLE cell line and the TCGA sample whose predicted
  drug-response profile is closest (Euclidean distance across all predicted drug responses).
- A single space or "Not Reported" in a neighbor field means the information is missing."""

PRECOMPUTED_DESCRIPTION = f"""Query CellHit precomputed drug-response predictions for TCGA patients and CCLE cell lines.

Pass at least one of `drug`, `sample`, `tissue`, `disease`, `tcga_code` or `oncotree_code`. `prediction` is ln(IC50) for GDSC and log-fold change
for PRISM; lower values mean higher sensitivity. Compare only within the same dataset.

Filters:
- drug: exact drug name.
- sample: exact sample ID, a TCGA barcode or a CCLE DepMap ID (e.g. ACH-001113).
- tissue: tissue of the sample itself; case-insensitive partial match (e.g. "brain").
  Values: {TISSUES}.
- disease: disease of the sample itself (Treehouse/DepMap labels such as
  "glioblastoma multiforme", "neuroblastoma", "acute lymphoblastic leukemia");
  case-insensitive partial match. Use it for pediatric and Treehouse samples.
- tcga_code: TCGA study code of the sample itself; exact match. Only TCGA samples have one.
  Values: {TCGA_CODES}.
- oncotree_code: OncoTree code of the sample itself (e.g. "GBM", "LUAD", "HGSOC"); exact match.
- neighbor: which nearest neighbor the neigh_* filters use. "transcriptomic" = the
  sample whose expression is most similar; "response" = the sample whose predicted
  drug-response profile is most similar. Required, together with `drug`, for any neigh_* filter.
- neigh_cell_line: exact DepMap ID of the neighboring CCLE cell line.
- neigh_ccle_oncotree: OncoTree cancer type of the CCLE neighbor; case-insensitive partial
  match (e.g. "glioma", "lung"). Known values: {ONCOTREE_TYPES}.
- neigh_tcga_site: anatomic site of the TCGA neighbor (GDC labels such as "Upper lobe, lung",
  "Breast, NOS", "Cerebrum"); case-insensitive partial match (e.g. "lung").
- neigh_tcga_diagnosis: histological diagnosis of the TCGA neighbor (GDC labels such as
  "Adenocarcinoma, NOS", "Glioblastoma", "Infiltrating duct carcinoma, NOS");
  case-insensitive partial match (e.g. "adenocarcinoma").
- limit / offset: page through results (limit max 200). If `returned` equals `limit`,
  more rows may exist.

{PRECOMPUTED_FIELD_GLOSSARY}
"""


@mcp.tool(description=PRECOMPUTED_DESCRIPTION)
async def get_precomputed(
    dataset: Literal["GDSC", "PRISM"],
    drug: str | None = None,
    sample: str | None = None,
    neighbor: Literal["transcriptomic", "response"] | None = None,
    neigh_cell_line: str | None = None,
    neigh_ccle_oncotree: str | None = None,
    neigh_tcga_site: str | None = None,
    neigh_tcga_diagnosis: str | None = None,
    tissue: str | None = None,
    disease: str | None = None,
    tcga_code: str | None = None,
    oncotree_code: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    neighbor_filters = {
        "neighCellLine": neigh_cell_line,
        "neighCcleOncotree": neigh_ccle_oncotree,
        "neighTcgaSite": neigh_tcga_site,
        "neighTcgaDiagnosis": neigh_tcga_diagnosis,
    }
    sample_filters = {
        "tissue": tissue,
        "disease": disease,
        "tcgaCode": tcga_code,
        "oncotreeCode": oncotree_code,
    }
    if not drug and not sample and not any(sample_filters.values()):
        raise ToolError(
            "Pass at least one filter: drug, sample, tissue, disease, tcga_code or oncotree_code."
        )
    if any(neighbor_filters.values()) and (neighbor is None or not drug):
        raise ToolError("neigh_* filters require both `neighbor` and `drug`.")

    limit = max(1, min(limit, MAX_ROWS_PRECOMPUTED))
    pagination = {
        "offset": max(0, offset),
        "limit": limit,
        "drug": drug,
        "sample": sample,
        "neighbor": neighbor,
        **{key: value for key, value in neighbor_filters.items() if value},
        **{key: value for key, value in sample_filters.items() if value},
    }
    field = dataset.lower()
    query = f"query Precomputed($pagination: PaginationInput) {{ {field}(pagination: $pagination) {{ {PRECOMPUTED_FIELDS} }} }}"
    data = await graphql(query, {"pagination": pagination})
    rows = data[field]
    return {"dataset": dataset, "offset": pagination["offset"], "returned": len(rows), "rows": rows}


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