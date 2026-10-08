"""Dynamic findings, recommendations and segments, all computed from the (filtered) data."""
from __future__ import annotations

from itertools import combinations

import pandas as pd

from .constants import MIN_GROUP_SIZE, SATISFACTION_LABELS
from .metrics import group_rates, pct

MIN_N = MIN_GROUP_SIZE


def compare(a, b, ratio=1.2, min_diff=2.0):
    """Classify rate a relative to rate b (percentages): higher / lower / similar."""
    if a is None or b is None:
        return None
    diff = a - b
    if diff >= min_diff and (b == 0 or a / b >= ratio):
        return "higher"
    if -diff >= min_diff and (a == 0 or b / a >= ratio):
        return "lower"
    return "similar"


def _contrast(subj_a, subj_b, ra, rb, na, nb, verdict):
    if verdict == "higher":
        return f"{subj_a} show a higher observed attrition rate ({ra}%, n={na}) than {subj_b} ({rb}%, n={nb})."
    if verdict == "lower":
        return f"{subj_a} show a lower observed attrition rate ({ra}%, n={na}) than {subj_b} ({rb}%, n={nb})."
    return f"{subj_a} and {subj_b} show similar observed attrition rates ({ra}% vs {rb}%)."


# id, category, mask of the group of interest, subject A, subject B, caveat
SPLITS = [
    ("overtime", "Work conditions", lambda d: d["over_time"] == "Yes",
     "Employees working overtime", "employees who do not work overtime",
     " This is an association and does not show that overtime causes attrition."),
    ("job_satisfaction", "Work conditions", lambda d: d["job_satisfaction"] <= 2,
     "Employees reporting lower job satisfaction (1–2)", "those reporting higher satisfaction (3–4)", ""),
    ("work_life_balance", "Work conditions", lambda d: d["work_life_balance"] <= 2,
     "Employees reporting lower work-life balance (1–2)", "those reporting higher work-life balance (3–4)", ""),
    ("environment_satisfaction", "Work conditions", lambda d: d["environment_satisfaction"] <= 2,
     "Employees reporting lower environment satisfaction (1–2)", "those reporting higher environment satisfaction (3–4)", ""),
    ("tenure", "Career", lambda d: d["years_at_company"] <= 2,
     "Employees with 0–2 years at the company", "employees with longer tenure", ""),
    ("distance", "Employee characteristics", lambda d: d["distance_from_home"] > 20,
     "Employees living 21+ km from work", "employees living closer",
     " Higher observed attrition is associated with the longer-distance group; this does not show that distance is the cause."),
    ("business_travel", "Employee characteristics", lambda d: d["business_travel"] == "Travel_Frequently",
     "Employees who travel frequently", "other employees", ""),
]

REC = {
    "overtime": "Review workload and overtime patterns, especially in teams and roles with elevated attrition. Check staffing levels, scheduling and how evenly overtime is distributed.",
    "job_satisfaction": "Examine job-satisfaction drivers (role content, recognition, management support) with pulse surveys or stay interviews, starting with the groups showing elevated attrition.",
    "work_life_balance": "Review scheduling flexibility and workload expectations for employees reporting lower work-life balance.",
    "environment_satisfaction": "Look into the work environment (team dynamics, tools, facilities) for employees reporting lower environment satisfaction.",
    "tenure": "Investigate retention challenges among early-tenure employees, for example onboarding quality, early manager check-ins and role expectations.",
    "distance": "Explore whether flexible, hybrid or commute-support options are practical for employees with long commutes.",
    "business_travel": "Review the travel load of frequent travellers and whether travel expectations were clear when roles were defined.",
    "income": "Benchmark pay for roles and levels where lower pay and higher attrition coincide, and confirm with more detailed analysis before changing compensation.",
    "department": "Hold stay interviews and review exit feedback in {group}, which shows elevated observed attrition.",
    "job_role": "Investigate retention challenges in the {group} role (workload, career path, pay band) through stay interviews.",
    "age_group": "Review career-development and engagement offerings for the {group} age group.",
    "promotion_group": "Review career-progression pathways for employees in the {group} since-last-promotion group.",
}


def _highest(rows):
    el = [r for r in rows if r["employees"] >= MIN_N]
    return max(el, key=lambda r: (r["rate"], r["employees"])) if el else None


def _lowest(rows):
    el = [r for r in rows if r["employees"] >= MIN_N]
    return min(el, key=lambda r: (r["rate"], -r["employees"])) if el else None


def build_insights(df: pd.DataFrame) -> dict:
    out = {"min_group_size": MIN_N, "insights": [], "recommendations": [], "overall_rate": None}
    n = len(df)
    if n < MIN_N:
        out["message"] = f"Fewer than {MIN_N} employees match the current filters, so comparisons would be unreliable."
        return out
    left = int(df["attrition_flag"].sum())
    overall = pct(left, n)
    out["overall_rate"] = overall
    items = []

    def add(id_, cat, text, verdict, group=None):
        items.append({"id": id_, "category": cat, "text": text, "verdict": verdict,
                      "level": "elevated" if verdict == "higher" else "neutral", "group": group})

    add("overall", "Overview",
        f"{left:,} of {n:,} employees ({overall}%) left, while {n - left:,} remain.", "info")

    # Highest-group findings (department, role)
    d = _highest(group_rates(df, "department"))
    if d:
        add("department", "Overview",
            f"{d['label']} has the highest observed attrition among departments ({d['rate']}%, n={d['employees']}) compared with {overall}% overall.",
            compare(d["rate"], overall), d["label"])
    role_rows = group_rates(df, "job_role")
    hi, lo = _highest(role_rows), _lowest(role_rows)
    if hi and lo and hi["key"] != lo["key"]:
        add("job_role", "Overview",
            f"{'Job roles differ substantially' if compare(hi['rate'], lo['rate'], 1.5, 5.0) == 'higher' else 'Job roles show modest differences'}: {hi['label']} shows the highest observed attrition ({hi['rate']}%, n={hi['employees']}) "
            f"and {lo['label']} the lowest ({lo['rate']}%, n={lo['employees']}).",
            compare(hi["rate"], overall), hi["label"])

    splits = {}
    for id_, cat, mask_fn, a_name, b_name, caveat in SPLITS:
        m = mask_fn(df).fillna(False)
        a, b = df[m], df[~m]
        if len(a) < MIN_N or len(b) < MIN_N:
            continue
        ra, rb = pct(a["attrition_flag"].sum(), len(a)), pct(b["attrition_flag"].sum(), len(b))
        v = compare(ra, rb)
        splits[id_] = (cat, _contrast(a_name, b_name, ra, rb, len(a), len(b), v) + (caveat if v == "higher" else ""), v)
    order = ["overtime", "job_satisfaction", "work_life_balance", "environment_satisfaction"]
    for id_ in order:
        if id_ in splits:
            add(id_, *splits[id_])

    # Income (continuous): compare medians
    inc = pd.to_numeric(df["monthly_income"], errors="coerce")
    ls, st = inc[df["attrition_flag"] == 1].dropna(), inc[df["attrition_flag"] == 0].dropna()
    if len(ls) >= MIN_N and len(st) >= MIN_N:
        ml, ms = float(ls.median()), float(st.median())
        v = "lower" if ml <= 0.9 * ms else "higher" if ml >= 1.1 * ms else "similar"
        phrase = {"lower": "a lower median monthly income", "higher": "a higher median monthly income",
                  "similar": "a similar median monthly income"}[v]
        text = (f"Employees who left had {phrase} (${ml:,.0f}) compared with those who stayed (${ms:,.0f}); "
                f"mean income was ${ls.mean():,.0f} vs ${st.mean():,.0f}. Income overlaps with job level and tenure, "
                f"so this does not show that pay alone drives attrition.")
        items.append({"id": "income", "category": "Compensation", "text": text, "verdict": v,
                      "level": "elevated" if v == "lower" else "neutral", "group": None})

    if "tenure" in splits:
        add("tenure", *splits["tenure"])
    p = _highest(group_rates(df, "promotion_group"))
    if p:
        add("promotion_group", "Career",
            f"Among time-since-last-promotion groups, {p['label']} shows the highest observed attrition ({p['rate']}%, n={p['employees']}) versus {overall}% overall.",
            compare(p["rate"], overall), p["label"])
    a = _highest(group_rates(df, "age_group"))
    if a:
        add("age_group", "Employee characteristics",
            f"The {a['label']} age group shows the highest observed attrition ({a['rate']}%, n={a['employees']}) versus {overall}% overall.",
            compare(a["rate"], overall), a["label"])
    for id_ in ("distance", "business_travel"):
        if id_ in splits:
            add(id_, *splits[id_])

    out["insights"] = items
    recs = []
    for it in items:
        if it["level"] == "elevated" and it["id"] in REC:
            recs.append({"id": it["id"], "text": REC[it["id"]].format(group=it["group"] or ""), "evidence": it["text"]})
    if recs:
        recs.append({"id": "validate", "evidence": "Findings are observational associations.",
                     "text": "Treat these findings as starting points: validate them with exit-interview data and additional controls before committing to interventions."})
    out["recommendations"] = recs
    return out


SEGMENT_DIMS = {
    "Department": "department", "Job role": "job_role", "Overtime": "over_time",
    "Job satisfaction": "job_sat_label", "Age group": "age_group", "Tenure group": "tenure_group",
}


def _fmt(dim, v):
    if dim == "Overtime":
        return "Overtime" if v == "Yes" else "No overtime"
    if dim == "Job satisfaction":
        return f"{v} job satisfaction"
    if dim == "Age group":
        return f"Age {v}"
    if dim == "Tenure group":
        return f"{v} tenure"
    return str(v)


def segments(df: pd.DataFrame, top: int = 12) -> dict:
    """Two-dimension segments with at least MIN_N employees and attrition above the overall rate."""
    res = {"min_group_size": MIN_N, "rows": []}
    if len(df) < MIN_N:
        return res
    d = df.copy()
    d["job_sat_label"] = d["job_satisfaction"].map(lambda x: SATISFACTION_LABELS.get(int(x), str(x)).split("– ")[-1] if pd.notna(x) else None)
    overall = pct(d["attrition_flag"].sum(), len(d))
    rows = []
    for (t1, c1), (t2, c2) in combinations(SEGMENT_DIMS.items(), 2):
        if {c1, c2} == {"department", "job_role"}:
            continue  # job role is nested in department
        g = d.groupby([c1, c2])["attrition_flag"].agg(["count", "sum"])
        for (v1, v2), row in g[g["count"] >= MIN_N].iterrows():
            rate = pct(row["sum"], row["count"])
            if overall and rate is not None and rate > overall:
                rows.append({"segment": f"{_fmt(t1, v1)} + {_fmt(t2, v2)}", "employees": int(row["count"]),
                             "left": int(row["sum"]), "rate": rate,
                             "lift": round(rate / overall, 2) if overall else None})
    rows.sort(key=lambda r: (-r["rate"], -r["employees"]))
    res["rows"] = rows[:top]
    res["overall_rate"] = overall
    return res
