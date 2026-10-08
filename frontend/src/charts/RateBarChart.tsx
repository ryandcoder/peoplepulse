import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "../services/theme";
import type { RateRow } from "../types";

interface Props {
  rows: RateRow[];
  overall: number | null;
  horizontal?: boolean; // bars extend left→right (good for long labels)
  height?: number;
  yWidth?: number;
  table?: boolean;
}

const XTick = ({ x, y, payload, text, muted }: any) => {
  const [a, b] = String(payload.value).split("|");
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={14} textAnchor="middle" fill={text} fontSize={12}>{a}</text>
      <text dy={28} textAnchor="middle" fill={muted} fontSize={11}>{b}</text>
    </g>
  );
};
const YTick = ({ x, y, payload, text, muted }: any) => {
  const [a, b] = String(payload.value).split("|");
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12}>
      <tspan fill={text}>{a}</tspan>
      <tspan fill={muted} dx={6} fontSize={11}>{b}</tspan>
    </text>
  );
};
const RateTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-slate-800">{r.label}</div>
      <div>Attrition rate: <b>{r.rate}%</b></div>
      <div>Left: {r.left} of {r.employees} employees</div>
      {r.low_sample && <div className="mt-1 text-amber-600">Small group – interpret with caution</div>}
    </div>
  );
};

export function RateTable({ rows }: { rows: RateRow[] }) {
  return (
    <table className="mt-3 w-full text-xs">
      <thead>
        <tr className="border-b border-slate-200 text-left text-slate-500">
          <th className="py-1 font-medium">Group</th>
          <th className="py-1 text-right font-medium">Employees</th>
          <th className="py-1 text-right font-medium">Left</th>
          <th className="py-1 text-right font-medium">Rate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={String(r.key)} className="border-b border-slate-100">
            <td className="py-1">{r.label}{r.low_sample && <span className="ml-1 text-amber-600" title="Small group">*</span>}</td>
            <td className="py-1 text-right tabular-nums">{r.employees}</td>
            <td className="py-1 text-right tabular-nums">{r.left}</td>
            <td className="py-1 text-right font-medium tabular-nums">{r.rate}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function RateBarChart({ rows, overall, horizontal = false, height = 280, yWidth = 150, table = false }: Props) {
  const c = useChartColors();
  if (!rows.length) return <p className="py-10 text-center text-sm text-slate-400">No data for the current filters.</p>;
  const data = rows.map((r) => ({ ...r, rate: r.rate ?? 0, name: `${r.label}|n=${r.employees}` }));
  const ref = overall ?? 0;

  const xAxis = horizontal
    ? <XAxis type="number" tickFormatter={(v) => `${v}%`} stroke={c.axis} fontSize={12} domain={[0, "auto"]} />
    : <XAxis dataKey="name" tick={<XTick text={c.text} muted={c.muted} />} interval={0} height={48} />;
  const yAxis = horizontal
    ? <YAxis type="category" dataKey="name" width={yWidth} tick={<YTick text={c.text} muted={c.muted} />} interval={0} />
    : <YAxis tickFormatter={(v) => `${v}%`} stroke={c.axis} fontSize={12} domain={[0, "auto"]} />;
  const refLine = horizontal
    ? <ReferenceLine x={ref} stroke={c.ref} strokeDasharray="4 4" />
    : <ReferenceLine y={ref} stroke={c.ref} strokeDasharray="4 4" />;

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 20, right: horizontal ? 44 : 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={!horizontal} vertical={horizontal} />
          {xAxis}
          {yAxis}
          <Tooltip content={<RateTooltip />} cursor={{ fill: c.cursor }} />
          {refLine}
          <Bar dataKey="rate" radius={4} maxBarSize={40}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.rate > ref ? c.above : c.below} fillOpacity={d.low_sample ? 0.4 : 1} />
            ))}
            <LabelList dataKey="rate" position={horizontal ? "right" : "top"} formatter={(v: any) => `${v}%`} fontSize={12} fill={c.text} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-[11px] text-slate-500">
        Dashed line = overall rate ({ref}%). Red = above overall; faded = fewer than 20 employees.
      </p>
      {table && <RateTable rows={rows} />}
    </div>
  );
}
