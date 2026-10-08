"""Data inspection and cleaning with Pandas.

Principle: do not modify valid data unnecessarily. Suspicious values are *flagged*
in the report, not silently changed. Every transformation is documented in the
returned report so it can be displayed in the dashboard.
"""
import re

import numpy as np
import pandas as pd

from .constants import (
    AGE_GROUPS, DISTANCE_GROUPS, EXPERIENCE_GROUPS, INCOME_BANDS, PROMOTION_GROUPS, TENURE_GROUPS,
)

TEXT_COLUMNS = [
    "attrition", "business_travel", "department", "education_field",
    "gender", "job_role", "marital_status", "over_time",
]
NUMERIC_REQUIRED = [
    "employee_number", "age", "distance_from_home", "education", "environment_satisfaction",
    "job_involvement", "job_level", "job_satisfaction", "monthly_income", "num_companies_worked",
    "performance_rating", "relationship_satisfaction", "stock_option_level", "total_working_years",
    "training_times_last_year", "work_life_balance", "years_at_company", "years_in_current_role",
    "years_since_last_promotion", "years_with_curr_manager",
]
REQUIRED_COLUMNS = TEXT_COLUMNS + NUMERIC_REQUIRED

# Valid ranges documented in the IBM dataset
RANGE_RULES = {
    "age": (16, 100), "distance_from_home": (0, 500), "education": (1, 5),
    "environment_satisfaction": (1, 4), "job_involvement": (1, 4), "job_level": (1, 5),
    "job_satisfaction": (1, 4), "performance_rating": (1, 4), "relationship_satisfaction": (1, 4),
    "stock_option_level": (0, 3), "work_life_balance": (1, 4), "monthly_income": (1, 10_000_000),
    "num_companies_worked": (0, 100), "total_working_years": (0, 80), "training_times_last_year": (0, 52),
    "years_at_company": (0, 80), "years_in_current_role": (0, 80),
    "years_since_last_promotion": (0, 80), "years_with_curr_manager": (0, 80),
}


def to_snake(name: str) -> str:
    name = name.replace("\ufeff", "").replace("ï»¿", "").strip()
    s = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "_", name)
    s = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", "_", s)
    return s.lower()


def _cut(series: pd.Series, bins, labels) -> pd.Series:
    return pd.cut(series, bins=bins, labels=labels).astype(object)


def add_groups(df: pd.DataFrame) -> pd.DataFrame:
    inf = np.inf
    df["age_group"] = _cut(df["age"], [-inf, 24, 34, 44, 54, inf], AGE_GROUPS)
    df["tenure_group"] = _cut(df["years_at_company"], [-inf, 2, 5, 10, 20, inf], TENURE_GROUPS)
    df["distance_group"] = _cut(df["distance_from_home"], [-inf, 5, 10, 20, inf], DISTANCE_GROUPS)
    df["promotion_group"] = _cut(df["years_since_last_promotion"], [-inf, 2, 5, 10, inf], PROMOTION_GROUPS)
    df["experience_group"] = _cut(df["total_working_years"], [-inf, 5, 10, 20, inf], EXPERIENCE_GROUPS)
    df["income_band"] = _cut(df["monthly_income"], [-inf, 2999, 4999, 7999, 11999, inf], INCOME_BANDS)
    return df


def clean_dataframe(raw: pd.DataFrame):
    """Return (clean_df, report). Raises ValueError if required columns are missing."""
    df = raw.copy()
    df.columns = [to_snake(str(c)) for c in df.columns]

    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError("Missing required columns: " + ", ".join(missing_cols))

    transformations = [
        "Column names converted to snake_case (e.g. OverTime → over_time); any byte-order mark removed from the first header.",
    ]
    issues = []

    # ---- 1. Inspect the raw data (before any change) ----
    report = {
        "total_records": int(len(df)),
        "total_columns": int(df.shape[1]),
        "missing_values": int(df.isna().sum().sum()),
        "missing_by_column": {c: int(n) for c, n in df.isna().sum().items() if n > 0},
        "duplicate_records": int(df.duplicated().sum()),
        "duplicate_employee_numbers": int(df["employee_number"].duplicated().sum()),
    }

    # ---- 2. Types / text normalisation ----
    for c in TEXT_COLUMNS:
        s = df[c]
        df[c] = s.where(s.isna(), s.astype(str).str.strip()).astype(object)
    invalid_total = 0
    for c in NUMERIC_REQUIRED:
        coerced = pd.to_numeric(df[c], errors="coerce")
        bad = int((coerced.isna() & df[c].notna()).sum())
        if bad:
            issues.append({"check": f"Non-numeric values in {c}", "count": bad, "action": "set to missing"})
            invalid_total += bad
        df[c] = coerced
    transformations.append("Whitespace trimmed from text columns; required numeric columns validated as numeric.")

    # ---- 3. Range / logic checks (flag only) ----
    for c, (lo, hi) in RANGE_RULES.items():
        n = int(((df[c] < lo) | (df[c] > hi)).sum())
        if n:
            issues.append({"check": f"{c} outside {lo}–{hi}", "count": n, "action": "flagged, not modified"})
            invalid_total += n
    logic = {
        "years_in_current_role > years_at_company": df["years_in_current_role"] > df["years_at_company"],
        "years_with_curr_manager > years_at_company": df["years_with_curr_manager"] > df["years_at_company"],
        "years_at_company > total_working_years": df["years_at_company"] > df["total_working_years"],
    }
    for label, mask in logic.items():
        n = int(mask.sum())
        if n:
            issues.append({"check": label, "count": n, "action": "flagged, not modified"})
            invalid_total += n
    for c in ("attrition", "over_time"):
        n = int((~df[c].isin(["Yes", "No"]) & df[c].notna()).sum())
        if n:
            issues.append({"check": f"Unexpected values in {c} (expected Yes/No)", "count": n, "action": "flagged"})
            invalid_total += n
    report["invalid_values"] = invalid_total
    report["categories"] = {c: sorted(df[c].dropna().unique().tolist()) for c in TEXT_COLUMNS}

    # ---- 4. Rows that cannot be analysed (no Yes/No attrition) ----
    bad_attr = ~df["attrition"].isin(["Yes", "No"])
    if bad_attr.any():
        report["rows_removed"] = int(bad_attr.sum())
        df = df[~bad_attr].copy()
        transformations.append(f"Removed {int(bad_attr.sum())} rows without a valid Yes/No Attrition value.")
    else:
        report["rows_removed"] = 0

    # ---- 5. Constant columns carry no analytical value ----
    constant = [c for c in df.columns if c not in REQUIRED_COLUMNS and df[c].nunique(dropna=False) <= 1]
    if constant:
        df = df.drop(columns=constant)
    report["columns_dropped"] = constant
    if constant:
        transformations.append("Dropped constant columns with no analytical value: " + ", ".join(constant) + ".")

    # ---- 6. Derived columns (documented) ----
    df["attrition_flag"] = (df["attrition"] == "Yes").astype(int)
    df = add_groups(df)
    transformations.append(
        "Added attrition_flag (1 = Left) and grouped columns: age_group, tenure_group, distance_group, "
        "promotion_group, experience_group, income_band. Original values are unchanged."
    )

    report["issues"] = issues
    report["transformations"] = transformations
    report["columns_after_cleaning"] = int(df.shape[1])
    return df.reset_index(drop=True), report
