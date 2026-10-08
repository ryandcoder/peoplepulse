"""Print the data-quality report for a CSV without needing the database.
Usage: python scripts/data_quality_report.py data/employee_attrition.csv
"""
import json
import pathlib
import sys

import pandas as pd

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "backend"))
from app.analytics.cleaning import clean_dataframe  # noqa: E402

path = sys.argv[1] if len(sys.argv) > 1 else "data/employee_attrition.csv"
_, rep = clean_dataframe(pd.read_csv(path, encoding="utf-8-sig"))
print(f"Rows: {rep['total_records']:,}\nColumns: {rep['total_columns']}\nMissing Values: {rep['missing_values']}\n"
      f"Duplicate Rows: {rep['duplicate_records']}\nInvalid Values: {rep['invalid_values']}")
print("\nTransformations:")
for t in rep["transformations"]:
    print(" -", t)
if rep["issues"]:
    print("\nIssues:\n" + json.dumps(rep["issues"], indent=2))
