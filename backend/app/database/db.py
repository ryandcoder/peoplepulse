import logging
import os
import time

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, Engine

log = logging.getLogger("peoplepulse")
_engine: Engine | None = None


def get_engine() -> Engine:
    global _engine
    if _engine is None and os.getenv("DATABASE_URL"):
        # Managed databases (Render, Railway, Neon, ...) provide a single connection string.
        url = os.environ["DATABASE_URL"].strip()
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        if url.startswith("postgresql://"):
            url = "postgresql+psycopg2://" + url[len("postgresql://"):]
        _engine = create_engine(url, pool_pre_ping=True)
    if _engine is None:
        url = URL.create(
            "postgresql+psycopg2",
            username=os.getenv("POSTGRES_USER", "peoplepulse"),
            password=os.getenv("POSTGRES_PASSWORD", "peoplepulse_dev"),
            host=os.getenv("POSTGRES_HOST", "db"),
            port=int(os.getenv("POSTGRES_PORT", "5432")),
            database=os.getenv("POSTGRES_DB", "peoplepulse"),
        )
        _engine = create_engine(url, pool_pre_ping=True)
    return _engine


def wait_for_db(retries: int = 30, delay: float = 2.0) -> None:
    for attempt in range(1, retries + 1):
        try:
            with get_engine().connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except Exception as exc:  # noqa: BLE001
            log.warning("Database not ready (%s/%s): %s", attempt, retries, exc)
            time.sleep(delay)
    raise RuntimeError("Could not connect to PostgreSQL")
