import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "../services/theme";

interface Props {
  data: { name: string; stayed: number | null; left: number | null }[];
  unit?: string;
  height?: number;
}

export default function GroupedBarChart({ data, unit = "", height = 280 }: Props) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="name" stroke={c.axis} fontSize={11} interval={0} />
        <YAxis stroke={c.axis} fontSize={12} tickFormatter={(v) => `${v}${unit}`} />
        <Tooltip
          formatter={(v: any) => `${v}${unit}`}
          cursor={{ fill: c.cursor }}
          contentStyle={{ background: c.card, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: c.text }}
        />
        <Legend wrapperStyle={{ color: c.text, fontSize: 12 }} />
        <Bar dataKey="stayed" name="Stayed" fill={c.stayed} radius={[3, 3, 0, 0]} />
        <Bar dataKey="left" name="Left" fill={c.left} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
