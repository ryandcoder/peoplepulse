import { useEffect, useState } from "react";
import CorrelationChart from "../charts/CorrelationChart";
import DonutChart from "../charts/DonutChart";
import GroupedBarChart from "../charts/GroupedBarChart";
import RateBarChart from "../charts/RateBarChart";
import DataQualityCard from "../components/DataQualityCard";
import EmployeeTable from "../components/EmployeeTable";
import FilterBar, { FILTER_LABELS } from "../components/FilterBar";
import InsightsPanel from "../components/InsightsPanel";
import { Callout, Card, KpiCard, Section } from "../components/ui";
import { api } from "../services/api";
import { useTheme } from "../services/theme";
import { fmtInt, fmtMoney, fmtNum, fmtPct } from "../services/format";
import { FILTER_KEYS } from "../types";
import type {
  AttritionResponse, CompensationResponse, DashboardResponse, FilterKey, FilterOptions, Filters,
  InsightsResponse, RateResponse, SatisfactionResponse, TenureResponse,
} from "../types";

const EMPTY = Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])) as Filters;

interface Data {
  dashboard: DashboardResponse; attrition: AttritionResponse; departments: RateResponse; jobRoles: RateResponse;
  satisfaction: SatisfactionResponse; compensation: CompensationResponse; tenure: TenureResponse; insights: InsightsResponse;
}

const NAV = [
  ["overview", "Overview"], ["work", "Work conditions"], ["compensation", "Compensation"], ["career", "Career"],
  ["people", "Employees"], ["relationships", "Relationships"], ["insights", "Insights"], ["table", "Data"], ["quality", "Data quality"],
];

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(filters);
  const { dark, printing, toggle, exportPdf } = useTheme();

  useEffect(() => { api.filters().then(setOptions).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.dashboard(filters), api.attrition(filters), api.departments(filters), api.jobRoles(filters),
      api.satisfaction(filters), api.compensation(filters), api.tenure(filters), api.insights(filters),
    ])
      .then(([dashboard, attrition, departments, jobRoles, satisfaction, compensation, tenure, insights]) => {
        if (cancelled) return;
        setData({ dashboard, attrition, departments, jobRoles, satisfaction, compensation, tenure, insights });
        setError(null);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (k: FilterKey, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const insight = (id: string) => data?.insights.insights.find((i) => i.id === id);
  const k = data?.dashboard.kpis;
  const activeFilters = FILTER_KEYS.filter((f) => filters[f] !== "").map((f) => {
    const label = options?.[f]?.find((o) => o.value === filters[f])?.label ?? filters[f];
    return `${FILTER_LABELS[f]}: ${label}`;
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900"><span className="text-indigo-600">People</span>Pulse</h1>
            <p className="text-[11px] text-slate-500">Employee attrition analytics · IBM HR Analytics sample dataset (fictional)</p>
          </div>
          <nav className="flex flex-wrap gap-x-4 text-xs font-medium text-slate-600">
            {NAV.map(([id, label]) => <a key={id} href={`#${id}`} className="hover:text-indigo-600">{label}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Light theme" : "Dark theme"}
              className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100">
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
            <button onClick={exportPdf} disabled={!data || printing}
              className="rounded-md px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-40"
              style={{ background: "#4f46e5", color: "#fff" }}>
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-7xl px-4 pb-16 pt-6 transition-opacity ${loading && data ? "opacity-60" : ""}`}>
        {printing && (
          <div className="fixed inset-x-0 top-0 z-50 py-2 text-center text-sm font-medium print:hidden" style={{ background: "#4f46e5", color: "#fff" }}>
            Preparing PDF… choose “Save as PDF” in the print dialog.
          </div>
        )}
        <div className="mb-4 hidden border-b border-slate-200 pb-3 print:block">
          <h1 className="text-2xl font-bold text-slate-900"><span className="text-indigo-600">People</span>Pulse – Employee Attrition Report</h1>
          <p className="text-xs text-slate-500">
            Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Source: IBM HR Analytics sample dataset (fictional)
          </p>
          <p className="mt-1 text-xs text-slate-700"><b>Filters:</b> {activeFilters.length ? activeFilters.join(" · ") : "none (all employees)"}</p>
        </div>

        <FilterBar options={options} filters={filters} onChange={setFilter} onReset={() => setFilters(EMPTY)} />

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <b>Could not load data.</b> {error}
          </div>
        )}
        {!data && loading && !error && <p className="mt-10 text-center text-slate-500">Loading dashboard…</p>}

        {data && k && (
          <>
            <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
              <b>Correlation ≠ causation.</b> Attrition rates describe what is observed in this dataset. A group with a higher rate is not
              proof that the characteristic causes people to leave. Groups with fewer than {data.insights.min_group_size} employees are marked as small.
            </p>

            {k.total_employees === 0 ? (
              <p className="mt-10 text-center text-slate-500">No employees match the selected filters.</p>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <KpiCard label="Total Employees" value={fmtInt(k.total_employees)} />
                  <KpiCard label="Employees Who Left" value={fmtInt(k.employees_left)} tone="rose" />
                  <KpiCard label="Employees Remaining" value={fmtInt(k.employees_remaining)} tone="emerald" />
                  <KpiCard label="Overall Attrition Rate" value={fmtPct(k.attrition_rate)} tone="rose" />
                  <KpiCard label="Avg Monthly Income" value={fmtMoney(k.avg_monthly_income)} />
                  <KpiCard label="Avg Years at Company" value={fmtNum(k.avg_years_at_company)} />
                  <KpiCard label="Avg Job Satisfaction" value={`${fmtNum(k.avg_job_satisfaction, 2)} / 4`} />
                  <KpiCard label="Avg Age" value={fmtNum(k.avg_age)} />
                </div>

                <Section id="overview" title="Attrition overview" subtitle="How many employees leave, and where attrition is concentrated. Rates are shown alongside counts because departments and roles differ in size.">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Card title="Attrition distribution"><DonutChart data={data.dashboard.distribution} rate={k.attrition_rate} /></Card>
                    <Card title="Attrition by department" className="lg:col-span-2">
                      <RateBarChart rows={data.departments.rows} overall={data.departments.overall_rate} height={220} table />
                      <Callout insight={insight("department")} />
                    </Card>
                  </div>
                  <Card title="Attrition rate by job role" subtitle="Sorted from highest to lowest; n = employees in the role" className="mt-4">
                    <RateBarChart rows={data.jobRoles.rows} overall={data.jobRoles.overall_rate} horizontal yWidth={220}
                      height={Math.max(260, data.jobRoles.rows.length * 38)} />
                    <Callout insight={insight("job_role")} />
                  </Card>
                </Section>

                <Section id="work" title="Work conditions" subtitle="Overtime, satisfaction, work-life balance and travel.">
                  <OvertimePanel data={data.attrition.overtime} />
                  <Callout insight={insight("overtime")} />
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <Card title="Job satisfaction → attrition rate" subtitle="1 = Low, 4 = Very High">
                      <RateBarChart rows={data.satisfaction.job_satisfaction.rows} overall={data.satisfaction.job_satisfaction.overall_rate} table />
                      <Callout insight={insight("job_satisfaction")} />
                    </Card>
                    <Card title="Work-life balance → attrition rate" subtitle="1 = Bad, 4 = Best">
                      <RateBarChart rows={data.satisfaction.work_life_balance.rows} overall={data.satisfaction.work_life_balance.overall_rate} table />
                      <Callout insight={insight("work_life_balance")} />
                    </Card>
                    <Card title="Environment satisfaction → attrition rate">
                      <RateBarChart rows={data.satisfaction.environment_satisfaction.rows} overall={data.satisfaction.environment_satisfaction.overall_rate} />
                      <Callout insight={insight("environment_satisfaction")} />
                    </Card>
                    <Card title="Business travel" subtitle="Small groups are faded and marked with *">
                      <RateBarChart rows={data.attrition.business_travel.rows} overall={data.attrition.business_travel.overall_rate} table />
                      <Callout insight={insight("business_travel")} />
                    </Card>
                  </div>
                </Section>

                <Section id="compensation" title="Compensation" subtitle="Income distribution of employees who stayed vs left. Income is not analysed in isolation – it overlaps with job level and tenure.">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Card title="Monthly income summary">
                      <IncomeStats comp={data.compensation} />
                    </Card>
                    <Card title="Income distribution (% of each group)" className="lg:col-span-2">
                      <GroupedBarChart unit="%" data={data.compensation.histogram.map((h) => ({ name: h.label, stayed: h.stayed_pct, left: h.left_pct }))} />
                    </Card>
                    <Card title="Attrition by job level">
                      <RateBarChart rows={data.compensation.by_job_level} overall={data.compensation.overall_rate} height={240} />
                    </Card>
                    <Card title="Attrition by income band" className="lg:col-span-2">
                      <RateBarChart rows={data.compensation.by_income_band} overall={data.compensation.overall_rate} height={240} />
                    </Card>
                  </div>
                  <Callout insight={insight("income")} />
                </Section>

                <Section id="career" title="Career development" subtitle="Tenure, time since promotion, time in role and work history.">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="Attrition by tenure (years at company)">
                      <RateBarChart rows={data.tenure.tenure_group.rows} overall={data.tenure.tenure_group.overall_rate} table />
                      <Callout insight={insight("tenure")} />
                    </Card>
                    <Card title="Attrition by years since last promotion">
                      <RateBarChart rows={data.tenure.promotion_group.rows} overall={data.tenure.promotion_group.overall_rate} table />
                      <Callout insight={insight("promotion_group")} />
                    </Card>
                    <Card title="Attrition by total working years (work history)">
                      <RateBarChart rows={data.tenure.experience_group.rows} overall={data.tenure.experience_group.overall_rate} />
                    </Card>
                    <Card title="Average years: stayed vs left" subtitle="Role, manager, promotion and tenure">
                      <GroupedBarChart unit=" y" data={data.tenure.career_comparison.map((c) => ({ name: c.label.replace("Years ", "").replace("current ", ""), stayed: c.stayed_mean, left: c.left_mean }))} />
                    </Card>
                  </div>
                </Section>

                <Section id="people" title="Employee characteristics">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="Attrition by age group">
                      <RateBarChart rows={data.attrition.age_group.rows} overall={data.attrition.age_group.overall_rate} table />
                      <Callout insight={insight("age_group")} />
                    </Card>
                    <Card title="Attrition by distance from home">
                      <RateBarChart rows={data.attrition.distance_group.rows} overall={data.attrition.distance_group.overall_rate} table />
                      <Callout insight={insight("distance")} />
                    </Card>
                    <Card title="Attrition by gender">
                      <RateBarChart rows={data.attrition.gender.rows} overall={data.attrition.gender.overall_rate} height={220} />
                    </Card>
                    <Card title="Attrition by education level">
                      <RateBarChart rows={data.attrition.education.rows} overall={data.attrition.education.overall_rate} height={220} />
                    </Card>
                  </div>
                </Section>

                <Section id="relationships" title="Relationship analysis" subtitle="Correlation of each numeric variable with leaving (Pearson r on a 0/1 outcome = point-biserial; Spearman ρ shown for robustness). Correlation does not imply causation, and the variables overlap with each other.">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="Pearson r with attrition"><CorrelationChart rows={data.attrition.correlations} /></Card>
                    <Card title="Details">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-left text-slate-500">
                            <th className="py-1 font-medium">Variable</th>
                            <th className="py-1 text-right font-medium">r</th>
                            <th className="py-1 text-right font-medium">ρ</th>
                            <th className="py-1 text-right font-medium">p</th>
                            <th className="py-1 text-right font-medium">Mean (left / stayed)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.attrition.correlations.map((c) => (
                            <tr key={c.key} className="border-b border-slate-100">
                              <td className="py-1">{c.label} <span className="text-slate-400">({c.strength})</span></td>
                              <td className="py-1 text-right tabular-nums">{c.pearson_r}</td>
                              <td className="py-1 text-right tabular-nums">{c.spearman_rho}</td>
                              <td className="py-1 text-right tabular-nums">{c.p_value < 0.001 ? "<0.001" : c.p_value.toFixed(3)}</td>
                              <td className="py-1 text-right tabular-nums">{c.mean_left} / {c.mean_stayed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </div>
                </Section>

                <Section id="insights" title="Key findings, recommendations and segments">
                  <InsightsPanel data={data.insights} />
                </Section>
              </>
            )}
          </>
        )}

        {data && (
          <>
            <Section id="table" printHidden title="Employee data" subtitle="Search, sort and page through employees matching the filters above.">
              <EmployeeTable filters={filters} />
            </Section>
            <Section id="quality" title="Data quality" subtitle="Checks performed when the dataset was loaded. The IBM HR Analytics dataset is fictional and created for analytics practice.">
              <DataQualityCard dq={data.dashboard.data_quality} />
            </Section>
          </>
        )}
      </main>
    </div>
  );
}

function OvertimePanel({ data }: { data: RateResponse }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {data.rows.map((r) => (
        <div key={String(r.key)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{r.label}</div>
          <div className={`mt-1 text-3xl font-bold ${r.key === "Yes" ? "text-rose-600" : "text-slate-800"}`}>{fmtPct(r.rate)}</div>
          <div className="mt-1 text-xs text-slate-500">{fmtInt(r.left)} left of {fmtInt(r.employees)} employees</div>
        </div>
      ))}
      <Card title="Attrition rate by overtime">
        <RateBarChart rows={data.rows} overall={data.overall_rate} height={170} />
      </Card>
    </div>
  );
}

function IncomeStats({ comp }: { comp: CompensationResponse }) {
  const row = (label: string, a?: number, b?: number) => (
    <tr className="border-b border-slate-100">
      <td className="py-1.5 text-slate-500">{label}</td>
      <td className="py-1.5 text-right tabular-nums">{a == null ? "–" : fmtMoney(a)}</td>
      <td className="py-1.5 text-right tabular-nums">{b == null ? "–" : fmtMoney(b)}</td>
    </tr>
  );
  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500">
            <th /><th className="py-1 text-right font-medium text-emerald-600">Stayed</th><th className="py-1 text-right font-medium text-rose-600">Left</th>
          </tr>
        </thead>
        <tbody>
          {row("Average", comp.stayed?.mean, comp.left?.mean)}
          {row("Median", comp.stayed?.median, comp.left?.median)}
          {row("25th percentile", comp.stayed?.q1, comp.left?.q1)}
          {row("75th percentile", comp.stayed?.q3, comp.left?.q3)}
        </tbody>
      </table>
      {comp.mean_difference_pct != null && (
        <p className="mt-2 text-xs text-slate-500">Average income of employees who left is {Math.abs(comp.mean_difference_pct)}% {comp.mean_difference_pct < 0 ? "lower" : "higher"} than those who stayed.</p>
      )}
    </>
  );
}
