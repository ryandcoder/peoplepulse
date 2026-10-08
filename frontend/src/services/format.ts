export const fmtInt = (n: number | null | undefined) => (n == null ? "–" : n.toLocaleString("en-US"));
export const fmtPct = (n: number | null | undefined) => (n == null ? "–" : `${n.toFixed(1)}%`);
export const fmtNum = (n: number | null | undefined, d = 1) => (n == null ? "–" : n.toFixed(d));
export const fmtMoney = (n: number | null | undefined) => (n == null ? "–" : `$${Math.round(n).toLocaleString("en-US")}`);
