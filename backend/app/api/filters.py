from fastapi import HTTPException, Query

# query parameter -> database column
FILTER_MAP = {
    "department": "department", "job_role": "job_role", "gender": "gender", "overtime": "over_time",
    "business_travel": "business_travel", "education": "education", "job_satisfaction": "job_satisfaction",
    "work_life_balance": "work_life_balance", "age_group": "age_group", "tenure_group": "tenure_group",
}
NUMERIC = {"education", "job_satisfaction", "work_life_balance"}


class FilterParams:
    """Dashboard filters as repeatable query parameters, e.g. ?department=Sales&overtime=Yes"""

    def __init__(
        self,
        department: list[str] | None = Query(None),
        job_role: list[str] | None = Query(None),
        gender: list[str] | None = Query(None),
        overtime: list[str] | None = Query(None),
        business_travel: list[str] | None = Query(None),
        education: list[str] | None = Query(None),
        job_satisfaction: list[str] | None = Query(None),
        work_life_balance: list[str] | None = Query(None),
        age_group: list[str] | None = Query(None),
        tenure_group: list[str] | None = Query(None),
    ):
        self.values = {
            "department": department, "job_role": job_role, "gender": gender, "overtime": overtime,
            "business_travel": business_travel, "education": education, "job_satisfaction": job_satisfaction,
            "work_life_balance": work_life_balance, "age_group": age_group, "tenure_group": tenure_group,
        }

    def clauses(self):
        """Return (list of SQL conditions, bind params). Columns come from a fixed whitelist."""
        clauses, params = [], {}
        for key, col in FILTER_MAP.items():
            vals = self.values.get(key)
            if not vals:
                continue
            if key in NUMERIC:
                try:
                    vals = [int(v) for v in vals]
                except ValueError:
                    raise HTTPException(422, f"{key} must be numeric")
            params[f"f_{key}"] = vals
            clauses.append(f"{col} = ANY(:f_{key})")
        return clauses, params


def where_sql(clauses):
    return (" WHERE " + " AND ".join(clauses)) if clauses else ""
