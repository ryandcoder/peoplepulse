import json

import pandas as pd
from fastapi import Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app import state
from app.api.filters import FilterParams, where_sql
from app.database.db import get_engine


def unavailable(exc: Exception | None = None) -> HTTPException:
    msg = state.startup_error or "The employees table is not available yet."
    return HTTPException(503, msg)


def get_filtered_df(filters: FilterParams = Depends()) -> pd.DataFrame:
    clauses, params = filters.clauses()
    try:
        with get_engine().connect() as conn:
            return pd.read_sql(text("SELECT * FROM employees" + where_sql(clauses)), conn, params=params)
    except SQLAlchemyError as exc:
        raise unavailable(exc)


def read_quality() -> dict | None:
    try:
        with get_engine().connect() as conn:
            row = conn.execute(text("SELECT payload FROM data_quality LIMIT 1")).first()
        return json.loads(row[0]) if row else None
    except SQLAlchemyError:
        return None
