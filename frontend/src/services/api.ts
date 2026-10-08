import type {
  AttritionResponse, CompensationResponse, DashboardResponse, EmployeesResponse, FilterOptions, Filters,
  InsightsResponse, RateResponse, SatisfactionResponse, TenureResponse,
} from "../types";

// Empty = same origin (docker compose / nginx proxy). Set VITE_API_URL when the API is hosted elsewhere (e.g. Vercel + Render).
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/+$/, "");

export function toQuery(filters?: Filters, extra: Record<string, string | number | undefined> = {}) {
  const p = new URLSearchParams();
  if (filters) Object.entries(filters).forEach(([k, v]) => v !== "" && p.append(k, v));
  Object.entries(extra).forEach(([k, v]) => v !== undefined && v !== "" && p.append(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function get<T>(path: string, filters?: Filters, extra?: Record<string, string | number | undefined>): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}${toQuery(filters, extra)}`);
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).detail; } catch { /* ignore */ }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  filters: () => get<FilterOptions>("/filters"),
  dashboard: (f: Filters) => get<DashboardResponse>("/dashboard", f),
  attrition: (f: Filters) => get<AttritionResponse>("/attrition", f),
  departments: (f: Filters) => get<RateResponse>("/departments", f),
  jobRoles: (f: Filters) => get<RateResponse>("/job-roles", f),
  satisfaction: (f: Filters) => get<SatisfactionResponse>("/satisfaction", f),
  compensation: (f: Filters) => get<CompensationResponse>("/compensation", f),
  tenure: (f: Filters) => get<TenureResponse>("/tenure", f),
  insights: (f: Filters) => get<InsightsResponse>("/insights", f),
  employees: (f: Filters, extra: Record<string, string | number | undefined>) => get<EmployeesResponse>("/employees", f, extra),
};
