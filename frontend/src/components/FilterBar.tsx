import { FILTER_KEYS } from "../types";
import type { FilterKey, FilterOptions, Filters } from "../types";

export const FILTER_LABELS: Record<FilterKey, string> = {
  department: "Department", job_role: "Job role", gender: "Gender", overtime: "Overtime",
  business_travel: "Business travel", education: "Education", job_satisfaction: "Job satisfaction",
  work_life_balance: "Work-life balance", age_group: "Age group", tenure_group: "Tenure group",
};

interface Props { options: FilterOptions | null; filters: Filters; onChange: (k: FilterKey, v: string) => void; onReset: () => void }

export default function FilterBar({ options, filters, onChange, onReset }: Props) {
  const active = FILTER_KEYS.filter((k) => filters[k] !== "").length;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Filters {active > 0 && <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">{active} active</span>}</h3>
        <button onClick={onReset} disabled={active === 0}
          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
          Reset Filters
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {FILTER_KEYS.map((k) => (
          <label key={k} className="text-xs text-slate-500">
            {FILTER_LABELS[k]}
            <select value={filters[k]} onChange={(e) => onChange(k, e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800">
              <option value="">All</option>
              {(options?.[k] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
