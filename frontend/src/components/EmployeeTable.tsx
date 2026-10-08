import { useEffect, useState } from "react";
import { api } from "../services/api";
import { fmtMoney } from "../services/format";
import type { EmployeesResponse, Filters } from "../types";
import { Card } from "./ui";

const COLS: { key: string; label: string; align?: "right" }[] = [
  { key: "employee_number", label: "Employee #" }, { key: "age", label: "Age", align: "right" },
  { key: "department", label: "Department" }, { key: "job_role", label: "Job Role" },
  { key: "monthly_income", label: "Monthly Income", align: "right" }, { key: "over_time", label: "Overtime" },
  { key: "years_at_company", label: "Yrs at Co.", align: "right" }, { key: "job_satisfaction", label: "Job Sat.", align: "right" },
  { key: "work_life_balance", label: "Work-Life", align: "right" }, { key: "attrition", label: "Attrition" },
];

export default function EmployeeTable({ filters }: { filters: Filters }) {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [attrition, setAttrition] = useState("");
  const [sortBy, setSortBy] = useState("employee_number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EmployeesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fkey = JSON.stringify(filters);

  useEffect(() => { const t = setTimeout(() => setQ(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [q, attrition, sortBy, sortDir, fkey]);
  useEffect(() => {
    let cancelled = false;
    api.employees(filters, { search: q, attrition, sort_by: sortBy, sort_dir: sortDir, page })
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [q, attrition, sortBy, sortDir, page, fkey]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (k: string) => {
    if (k === sortBy) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(k); setSortDir("asc"); }
  };

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee #, department, role, field…"
          className="w-72 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400" />
        <select value={attrition} onChange={(e) => setAttrition(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800">
          <option value="">All employees</option><option value="Yes">Left</option><option value="No">Stayed</option>
        </select>
        <span className="ml-auto text-xs text-slate-500">{data ? `${data.total.toLocaleString()} employees` : ""}</span>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              {COLS.map((c) => (
                <th key={c.key} onClick={() => toggle(c.key)}
                  className={`cursor-pointer select-none whitespace-nowrap px-2 py-2 font-medium hover:text-slate-800 ${c.align === "right" ? "text-right" : "text-left"}`}>
                  {c.label}{sortBy === c.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((r) => (
              <tr key={r.employee_number} className="border-b border-slate-100 hover:bg-slate-100">
                <td className="px-2 py-1.5">{r.employee_number}</td>
                <td className="px-2 py-1.5 text-right">{r.age}</td>
                <td className="px-2 py-1.5">{r.department}</td>
                <td className="px-2 py-1.5">{r.job_role}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{fmtMoney(r.monthly_income)}</td>
                <td className="px-2 py-1.5">{r.over_time}</td>
                <td className="px-2 py-1.5 text-right">{r.years_at_company}</td>
                <td className="px-2 py-1.5 text-right">{r.job_satisfaction}</td>
                <td className="px-2 py-1.5 text-right">{r.work_life_balance}</td>
                <td className="px-2 py-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.attrition === "Yes" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {r.attrition === "Yes" ? "Left" : "Stayed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.rows.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No employees match.</p>}
      </div>
      {data && (
        <div className="mt-3 flex items-center justify-end gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-slate-300 px-3 py-1 text-slate-700 disabled:opacity-40">Previous</button>
          <span className="text-xs text-slate-500">Page {data.page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="rounded-md border border-slate-300 px-3 py-1 text-slate-700 disabled:opacity-40">Next</button>
        </div>
      )}
    </Card>
  );
}
