import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";
const KEY = "peoplepulse-theme";

interface ThemeCtx {
  theme: Theme;
  dark: boolean;        // false while exporting, so the PDF is always light
  printing: boolean;
  toggle: () => void;
  exportPdf: () => void;
}
const Ctx = createContext<ThemeCtx>({ theme: "light", dark: false, printing: false, toggle: () => {}, exportPdf: () => {} });

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* ignore */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [printing, setPrinting] = useState(false);
  const dark = theme === "dark" && !printing;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.classList.toggle("printing", printing);
  }, [dark, printing]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Export = switch to light + A4-width layout, give charts time to re-render, then open the browser's print dialog
  // ("Save as PDF"). The same print styles also apply if the user presses Ctrl/Cmd+P.
  const exportPdf = useCallback(() => {
    const originalTitle = document.title;
    setPrinting(true);
    const done = () => {
      window.removeEventListener("afterprint", done);
      document.title = originalTitle;
      setPrinting(false);
    };
    window.addEventListener("afterprint", done);
    setTimeout(() => {
      document.title = `PeoplePulse-Attrition-Report-${new Date().toISOString().slice(0, 10)}`;
      window.print();
    }, 900);
  }, []);

  const value = useMemo(() => ({ theme, dark, printing, toggle, exportPdf }), [theme, dark, printing, toggle, exportPdf]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

/** Hex colours for Recharts (SVG attributes can't use Tailwind classes). */
export function useChartColors() {
  const { dark } = useTheme();
  return dark
    ? { grid: "#3a4a63", axis: "#8b9bb4", text: "#cbd5e3", muted: "#8b9bb4", cursor: "#2c3a50", ref: "#e2e8f0",
        card: "#243044", above: "#fb7185", below: "#7d8da6", stayed: "#34d399", left: "#fb7185", neg: "#818cf8" }
    : { grid: "#e2e8f0", axis: "#94a3b8", text: "#334155", muted: "#94a3b8", cursor: "#f1f5f9", ref: "#0f172a",
        card: "#ffffff", above: "#e11d48", below: "#64748b", stayed: "#10b981", left: "#e11d48", neg: "#6366f1" };
}
