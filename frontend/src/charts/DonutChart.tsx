import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fmtPct } from "../services/format";
import { useChartColors } from "../services/theme";

export default function DonutChart({ data, rate }: { data: { label: string; value: number }[]; rate: number | null }) {
  const c = useChartColors();
  const color = (l: string) => (l === "Left" ? c.left : c.stayed);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={270}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={68} outerRadius={100} paddingAngle={2} stroke={c.card}>
            {data.map((d) => <Cell key={d.label} fill={color(d.label)} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: c.card, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 12 }}
            itemStyle={{ color: c.text }}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ color: c.text, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <span className="text-2xl font-bold text-slate-800">{fmtPct(rate)}</span>
        <span className="text-xs text-slate-500">attrition</span>
      </div>
    </div>
  );
}
