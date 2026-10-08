import type { ReactNode } from "react";
import type { Insight } from "../types";

export function Section({ id, title, subtitle, children, printHidden = false }: { id: string; title: string; subtitle?: string; children: ReactNode; printHidden?: boolean }) {
  return (
    <section id={id} className={`scroll-mt-20 pt-10 ${printHidden ? "print:hidden" : ""}`}>
      <h2 className="break-after-avoid text-xl font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Card({ title, subtitle, children, className = "" }: { title?: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`break-inside-avoid rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
      {subtitle && <p className="mb-2 text-xs text-slate-500">{subtitle}</p>}
      {children}
    </div>
  );
}

const TONES: Record<string, string> = {
  slate: "text-slate-900", rose: "text-rose-600", emerald: "text-emerald-600", indigo: "text-indigo-600",
};
export function KpiCard({ label, value, tone = "slate" }: { label: string; value: string; tone?: keyof typeof TONES }) {
  return (
    <div className="break-inside-avoid rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${TONES[tone]}`}>{value}</div>
    </div>
  );
}

export function Callout({ insight }: { insight?: Insight }) {
  if (!insight) return null;
  const elevated = insight.level === "elevated";
  return (
    <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${elevated ? "border-rose-200 bg-rose-50 text-rose-900" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
      <span className="mr-1 font-semibold">Insight:</span>{insight.text}
    </div>
  );
}
