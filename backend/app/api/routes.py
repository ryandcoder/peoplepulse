import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.analytics import insights as ins
from app.analytics import metrics as m
from app.analytics.constants import (
    AGE_GROUPS, DISTANCE_GROUPS, EDUCATION_LABELS, EXPERIENCE_GROUPS, OVERTIME_LABELS, PROMOTION_GROUPS,
    SATISFACTION_LABELS, TENURE_GROUPS, TRAVEL_LABELS, TRAVEL_ORDER, WLB_LABELS,
)
from app.analytics.utils import py
from app.api.data import get_filtered_df, read_quality, unavailable
from app.api.filters import FilterParams, where_sql
from app.database.db import get_engine

router = APIRouter()
DF = Depends(get_filtered_df)


@router.get("/filters")
def filter_options():
    try:
        with get_engine().connect() as conn:
            df = pd.read_sql(text("SELECT * FROM employees"), conn)
    except SQLAlchemyError as exc:
        raise unavailable(exc)

    def opts(col, order=None, labels=None):
        vals = sorted(df[col].dropna().unique().tolist())
        if order:
            vals = [v for v in order if v in vals]
        return [{"value": str(v), "label": (labels or {}).get(v, str(v))} for v in vals]

    return py({
        "department": opts("department"), "job_role": opts("job_role"), "gender": opts("gender"),
        "overtime": opts("over_time", ["Yes", "No"], OVERTIME_LABELS),
        "business_travel": opts("business_travel", TRAVEL_ORDER, TRAVEL_LABELS),
        "education": opts("education", labels=EDUCATION_LABELS),
        "job_satisfaction": opts("job_satisfaction", labels=SATISFACTION_LABELS),
        "work_life_balance": opts("work_life_balance", labels=WLB_LABELS),
        "age_group": opts("age_group", AGE_GROUPS), "tenure_group": opts("tenure_group", TENURE_GROUPS),
    })


@router.get("/dashboard")
def dashboard(df: pd.DataFrame = DF):
    return py({"kpis": m.kpis(df), "distribution": m.distribution(df), "data_quality": read_quality()})


@router.get("/attrition")
def attrition(df: pd.DataFrame = DF):
    return py({
        "overall_rate": m.overall_rate(df),
        "overtime": m.with_overall(df, m.group_rates(df, "over_time", ["Yes", "No"], OVERTIME_LABELS)),
        "business_travel": m.with_overall(df, m.group_rates(df, "business_travel", TRAVEL_ORDER, TRAVEL_LABELS)),
        "age_group": m.with_overall(df, m.group_rates(df, "age_group", AGE_GROUPS)),
        "distance_group": m.with_overall(df, m.group_rates(df, "distance_group", DISTANCE_GROUPS)),
        "gender": m.with_overall(df, m.group_rates(df, "gender")),
        "education": m.with_overall(df, m.group_rates(df, "education", labels=EDUCATION_LABELS)),
        "correlations": m.correlations(df),
    })


@router.get("/departments")
def departments(df: pd.DataFrame = DF):
    return py(m.with_overall(df, m.group_rates(df, "department", sort_by_rate=True)))


@router.get("/job-roles")
def job_roles(df: pd.DataFrame = DF):
    return py(m.with_overall(df, m.group_rates(df, "job_role", sort_by_rate=True)))


@router.get("/satisfaction")
def satisfaction(df: pd.DataFrame = DF):
    return py({
        "job_satisfaction": m.with_overall(df, m.group_rates(df, "job_satisfaction", labels=SATISFACTION_LABELS)),
        "work_life_balance": m.with_overall(df, m.group_rates(df, "work_life_balance", labels=WLB_LABELS)),
        "environment_satisfaction": m.with_overall(df, m.group_rates(df, "environment_satisfaction", labels=SATISFACTION_LABELS)),
    })


@router.get("/compensation")
def compensation(df: pd.DataFrame = DF):
    return py({"overall_rate": m.overall_rate(df), **m.compensation(df)})


@router.get("/tenure")
def tenure(df: pd.DataFrame = DF):
    return py({
        "tenure_group": m.with_overall(df, m.group_rates(df, "tenure_group", TENURE_GROUPS)),
        "promotion_group": m.with_overall(df, m.group_rates(df, "promotion_group", PROMOTION_GROUPS)),
        "experience_group": m.with_overall(df, m.group_rates(df, "experience_group", EXPERIENCE_GROUPS)),
        "career_comparison": m.compare_numeric(df, m.CAREER_VARS),
    })


@router.get("/insights")
def insights(df: pd.DataFrame = DF):
    return py({**ins.build_insights(df), "segments": ins.segments(df)})


SORTABLE = {"employee_number", "age", "department", "job_role", "monthly_income", "over_time",
            "years_at_company", "job_satisfaction", "work_life_balance", "attrition"}
COLUMNS = ("employee_number, age, department, job_role, monthly_income, over_time, "
           "years_at_company, job_satisfaction, work_life_balance, attrition")


@router.get("/employees")
def employees(
    filters: FilterParams = Depends(),
    search: str | None = None,
    attrition: str | None = Query(None, pattern="^(Yes|No)$"),
    sort_by: str = "employee_number",
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
):
    if sort_by not in SORTABLE:
        raise HTTPException(422, "Invalid sort_by")
    clauses, params = filters.clauses()
    if search:
        clauses.append("(CAST(employee_number AS TEXT) ILIKE :search OR department ILIKE :search "
                       "OR job_role ILIKE :search OR education_field ILIKE :search)")
        params["search"] = f"%{search.strip()}%"
    if attrition:
        clauses.append("attrition = :attrition")
        params["attrition"] = attrition
    where = where_sql(clauses)
    try:
        with get_engine().connect() as conn:
            total = conn.execute(text("SELECT COUNT(*) FROM employees" + where), params).scalar_one()
            rows = conn.execute(
                text(f"SELECT {COLUMNS} FROM employees{where} ORDER BY {sort_by} {sort_dir} NULLS LAST, employee_number "
                     "LIMIT :limit OFFSET :offset"),
                {**params, "limit": page_size, "offset": (page - 1) * page_size},
            ).mappings().all()
    except SQLAlchemyError as exc:
        raise unavailable(exc)
    return py({"total": total, "page": page, "page_size": page_size,
               "pages": max(1, -(-total // page_size)), "rows": [dict(r) for r in rows]})
