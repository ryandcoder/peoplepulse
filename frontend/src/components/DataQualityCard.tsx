import type { DataQuality } from "../types";
import { fmtInt } from "../services/format";
import { Card } from "./ui";

export default function DataQualityCard({ dq }: { dq: DataQuality | null }) {
  if (!dq) return null;
  const tiles = [
    ["Total Records", dq.total_records], ["Total Columns", dq.total_columns],
    ["Missing Values", dq.missing_values], ["Duplicate Records", dq.duplicate_records],
  ] as const;
  return (
    <Card>
      <div className="print-keep-grid grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(([l, v]) => (
          <div key={l} className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{l}</div>
            <div className="text-xl font-bold tabular-nums">{fmtInt(v)}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Invalid values flagged: {dq.invalid_values} · Duplicate employee numbers: {dq.duplicate_employee_numbers} · Rows removed: {dq.rows_removed}.
        Checks run when the dataset is loaded (dataset-level, not affected by filters).
      </p>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-indigo-600">Cleaning steps and issues</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
          {dq.transformations.map((t) => <li key={t}>{t}</li>)}
          {dq.issues.map((i) => <li key={i.check}>{i.check}: {i.count} ({i.action})</li>)}
          {dq.issues.length === 0 && <li>No invalid values detected.</li>}
        </ul>
      </details>
    </Card>
  );
}
