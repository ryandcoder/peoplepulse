"""Analytical calculations (Pandas). Every function takes an already-filtered DataFrame."""
from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats

from .constants import MIN_GROUP_SIZE

CORR_VARS = {
    "age": "Age",
    "monthly_income": "Monthly income",
    "distance_from_home": "Distance from home",
    "total_working_years": "Total working years",
    "years_at_company": "Years at company",
    "years_in_current_role": "Years in current role",
    "years_since_last_promotion": "Years since last promotion",
    "years_with_curr_manager": "Years with current manager",
}
CAREER_VARS = {
    "years_at_company": "Years at company",
    "years_in_current_role": "Years in current role",
    "years_with_curr_manager": "Years with current manager",
    "years_since_last_promotion": "Years since last promotion",
    "total_working_years": "Total working years",
}
HIST_BIN = 2500


def pct(left, n):
    return round(100.0 * float(left) / n, 1) if n else None


def _mean(s, nd=1):
    s = pd.to_numeric(s, errors="coerce").dropna()
    return round(float(s.mean()), nd) if len(s) else None


def kpis(df: pd.DataFrame) -> dict:
    n = len(df)
    left = int(df["attrition_flag"].sum()) if n else 0
    return {
        "total_employees": n,
        "employees_left": left,
        "employees_remaining": n - left,
        "attrition_rate": pct(left, n),
        "avg_monthly_income": _mean(df["monthly_income"], 0),
        "avg_years_at_company": _mean(df["years_at_company"], 1),
        "avg_job_satisfaction": _mean(df["job_satisfaction"], 2),
        "avg_age": _mean(df["age"], 1),
    }


def distribution(df: pd.DataFrame) -> list:
    n = len(df)
    left = int(df["attrition_flag"].sum()) if n else 0
    return [{"label": "Stayed", "value": n - left}, {"label": "Left", "value": left}]


def overall_rate(df: pd.DataFrame):
    return pct(df["attrition_flag"].sum(), len(df)) if len(df) else None


def group_rates(df, col, order=None, labels=None, sort_by_rate=False) -> list:
    """Employees / left / attrition rate per category. Small groups are flagged."""
    if df.empty or col not in df.columns:
        return []
    rows = []
    for key, grp in df.groupby(col, dropna=True):
        n = len(grp)
        left = int(grp["attrition_flag"].sum())
        k = key.item() if hasattr(key, "item") else key
        rows.append({
            "key": k, "label": (labels or {}).get(k, str(k)), "employees": n, "left": left,
            "stayed": n - left, "rate": pct(left, n), "low_sample": n < MIN_GROUP_SIZE,
        })
    if order:
        idx = {v: i for i, v in enumerate(order)}
        rows.sort(key=lambda r: idx.get(r["key"], 999))
    if sort_by_rate:
        rows.sort(key=lambda r: (-(r["rate"] or 0), -r["employees"]))
    return rows


def with_overall(df, rows) -> dict:
    return {"overall_rate": overall_rate(df), "min_group_size": MIN_GROUP_SIZE, "rows": rows}


def describe(s: pd.Series):
    s = pd.to_numeric(s, errors="coerce").dropna()
    if s.empty:
        return None
    return {
        "n": int(len(s)), "mean": round(float(s.mean()), 1), "median": round(float(s.median()), 1),
        "q1": round(float(s.quantile(0.25)), 1), "q3": round(float(s.quantile(0.75)), 1),
        "min": round(float(s.min()), 1), "max": round(float(s.max()), 1),
    }


def compensation(df: pd.DataFrame) -> dict:
    out = {"stayed": None, "left": None, "mean_difference_pct": None, "histogram": [],
           "by_job_level": [], "by_income_band": []}
    if df.empty:
        return out
    inc = pd.to_numeric(df["monthly_income"], errors="coerce")
    stayed, left = inc[df["attrition_flag"] == 0].dropna(), inc[df["attrition_flag"] == 1].dropna()
    out["stayed"], out["left"] = describe(stayed), describe(left)
    if out["stayed"] and out["left"] and out["stayed"]["mean"]:
        out["mean_difference_pct"] = round(100 * (out["left"]["mean"] - out["stayed"]["mean"]) / out["stayed"]["mean"], 1)
    top = (int(inc.max() // HIST_BIN) + 1) * HIST_BIN
    edges = np.arange(0, top + 1, HIST_BIN)
    s_cnt, _ = np.histogram(stayed, bins=edges)
    l_cnt, _ = np.histogram(left, bins=edges)
    for i in range(len(edges) - 1):
        out["histogram"].append({
            "label": f"${edges[i] / 1000:g}K–{edges[i + 1] / 1000:g}K",
            "stayed": int(s_cnt[i]), "left": int(l_cnt[i]),
            "stayed_pct": round(100 * s_cnt[i] / max(len(stayed), 1), 1),
            "left_pct": round(100 * l_cnt[i] / max(len(left), 1), 1),
        })
    from .constants import INCOME_BANDS
    out["by_job_level"] = group_rates(df, "job_level")
    out["by_income_band"] = group_rates(df, "income_band", order=INCOME_BANDS)
    return out


def compare_numeric(df: pd.DataFrame, variables: dict) -> list:
    rows = []
    for col, label in variables.items():
        st = pd.to_numeric(df.loc[df["attrition_flag"] == 0, col], errors="coerce").dropna()
        lt = pd.to_numeric(df.loc[df["attrition_flag"] == 1, col], errors="coerce").dropna()
        rows.append({
            "key": col, "label": label,
            "stayed_mean": round(float(st.mean()), 2) if len(st) else None,
            "left_mean": round(float(lt.mean()), 2) if len(lt) else None,
            "stayed_median": round(float(st.median()), 1) if len(st) else None,
            "left_median": round(float(lt.median()), 1) if len(lt) else None,
        })
    return rows


def _strength(r: float) -> str:
    a = abs(r)
    return "negligible" if a < 0.1 else "weak" if a < 0.3 else "moderate" if a < 0.5 else "strong"


def correlations(df: pd.DataFrame) -> list:
    """Pearson (point-biserial) and Spearman correlation of each numeric variable with attrition."""
    if len(df) < 10 or df["attrition_flag"].nunique() < 2:
        return []
    y = df["attrition_flag"].astype(float)
    rows = []
    for col, label in CORR_VARS.items():
        x = pd.to_numeric(df[col], errors="coerce")
        ok = x.notna()
        if ok.sum() < 10 or x[ok].nunique() < 2:
            continue
        r, p = stats.pearsonr(x[ok], y[ok])
        rho, p_s = stats.spearmanr(x[ok], y[ok])
        rows.append({
            "key": col, "label": label, "pearson_r": round(float(r), 3), "p_value": float(p),
            "spearman_rho": round(float(rho), 3), "spearman_p": float(p_s),
            "strength": _strength(r), "direction": "negative" if r < 0 else "positive",
            "mean_left": round(float(x[ok & (y == 1)].mean()), 1),
            "mean_stayed": round(float(x[ok & (y == 0)].mean()), 1),
        })
    rows.sort(key=lambda r: -abs(r["pearson_r"]))
    return rows
