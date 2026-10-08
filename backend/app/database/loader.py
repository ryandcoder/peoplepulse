"""Clean the CSV with Pandas and load it into PostgreSQL (table: employees)."""
import json
import logging
import os

import pandas as pd
from sqlalchemy import inspect, text

from app.analytics.cleaning import clean_dataframe
from app.database.db import get_engine, wait_for_db

log = logging.getLogger("peoplepulse")


def csv_path() -> str:
    return os.getenv("DATA_PATH", "/data/employee_attrition.csv")


def load_csv_to_db(path: str | None = None) -> dict:
    path = path or csv_path()
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Dataset not found at {path}. Download the IBM HR Analytics Employee Attrition & Performance "
            "CSV, save it as data/employee_attrition.csv and restart (docker compose up --build)."
        )
    raw = pd.read_csv(path, encoding="utf-8-sig")
    df, report = clean_dataframe(raw)
    engine = get_engine()
    df.to_sql("employees", engine, if_exists="replace", index=False, chunksize=500, method="multi")
    with engine.begin() as conn:
        for col in ("employee_number", "department", "job_role", "attrition"):
            conn.execute(text(f"CREATE INDEX IF NOT EXISTS idx_employees_{col} ON employees ({col})"))
    pd.DataFrame([{"payload": json.dumps(report)}]).to_sql("data_quality", engine, if_exists="replace", index=False)
    log.info("Loaded %s employees into PostgreSQL", len(df))
    return report


def load_if_needed() -> None:
    engine = get_engine()
    force = os.getenv("RELOAD_ON_START", "true").lower() == "true"
    exists = inspect(engine).has_table("employees")
    count = 0
    if exists:
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM employees")).scalar_one()
    if force or not exists or count == 0:
        load_csv_to_db()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    wait_for_db()
    print(json.dumps(load_csv_to_db(), indent=2))
