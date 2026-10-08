import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "../services/theme";
import type { Correlation } from "../types";

const Tip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const c: Correlation = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold">{c.label}</div>
      <div>Pearson r: {c.pearson_r} ({c.strength}, {c.direction})</div>
      <div>Spearman ρ: {c.spearman_rho}</div>
    </div>
  );
};

export default function CorrelationChart({ rows }: { rows: Correlation[] }) {
  const c = useChartColors();
  if (!rows.length) return <p className="py-10 text-center text-sm text-slate-400">Not enough data.</p>;
  const m = Math.max(0.2, ...rows.map((r) => Math.abs(r.pearson_r))) * 1.15;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
        <XAxis type="number" domain={[-m, m]} stroke={c.axis} fontSize={12} tickFormatter={(v) => Number(v).toFixed(2)} />
        <YAxis type="category" dataKey="label" width={170} tick={{ fontSize: 12, fill: c.text }} />
        <Tooltip content={<Tip />} cursor={{ fill: c.cursor }} />
        <ReferenceLine x={0} stroke={c.axis} />
        <Bar dataKey="pearson_r" radius={3} maxBarSize={22}>
          {rows.map((r) => <Cell key={r.key} fill={r.pearson_r < 0 ? c.neg : c.left} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
