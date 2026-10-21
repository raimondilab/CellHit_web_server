import os
from pathlib import Path

from dotenv import load_dotenv

# Settings come from the .env file in the project root (never committed, see .gitignore)
ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_FILE)


def _req(key: str) -> str:
    """Return a required setting, or fail at startup with a clear message."""
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"Missing environment variable: {key} (file: {ENV_FILE})")
    return value


# ── MySQL ──────────────────────────────────────────────────────────────────────
MYSQL = {
    "host": _req("DB_HOST"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": _req("DB_USER"),
    "password": _req("DB_PASSWORD"),
    "database": _req("DB_NAME"),
}