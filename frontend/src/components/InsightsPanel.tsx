import type { InsightsResponse } from "../types";
import { Card } from "./ui";

export default function InsightsPanel({ data }: { data: InsightsResponse }) {
  return (
    <div className="space-y-4">
      {data.message && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{data.message}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Key Findings" subtitle="Calculated from the currently filtered data">
          <ul className="space-y-2 text-sm">
            {data.insights.map((i) => (
              <li key={i.id} className="flex gap-2">
                <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${i.level === "elevated" ? "bg-rose-500" : "bg-slate-300"}`} />
                <span><span className="text-xs font-medium uppercase text-slate-400">{i.category} · </span>{i.text}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="HR Recommendations" subtitle="Generated only for findings where attrition is notably elevated">
          {data.recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">No notably elevated patterns were found for this selection.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {data.recommendations.map((r) => (
                <li key={r.id}>
                  <div>{r.text}</div>
                  <div className="mt-0.5 text-xs text-slate-500">Based on: {r.evidence}</div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
      <Card title="Employee Segmentation" subtitle={`Two-factor groups with at least ${data.segments.min_group_size} employees and an attrition rate above the overall rate`}>
        {data.segments.rows.length === 0 ? (
          <p className="text-sm text-slate-500">No segments meet the minimum size for this selection.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="py-2 font-medium">Segment</th>
                <th className="py-2 text-right font-medium">Employees</th>
                <th className="py-2 text-right font-medium">Left</th>
                <th className="py-2 text-right font-medium">Attrition rate</th>
                <th className="py-2 text-right font-medium">vs overall</th>
              </tr>
            </thead>
            <tbody>
              {data.segments.rows.map((s) => (
                <tr key={s.segment} className="border-b border-slate-100">
                  <td className="py-2">{s.segment}</td>
                  <td className="py-2 text-right tabular-nums">{s.employees}</td>
                  <td className="py-2 text-right tabular-nums">{s.left}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-rose-600">{s.rate}%</td>
                  <td className="py-2 text-right tabular-nums">{s.lift}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
