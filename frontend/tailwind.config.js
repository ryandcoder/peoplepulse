import colors from "tailwindcss/colors";

// Colours are exposed as CSS variables so the whole UI can switch theme by
// redefining the variables under :root.dark (see src/index.css). Light values are the defaults.
const triplet = (hex) => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");
};
const themed = (name) =>
  Object.fromEntries(
    Object.entries(colors[name]).map(([shade, hex]) => [shade, `rgb(var(--${name}-${shade}, ${triplet(hex)}) / <alpha-value>)`])
  );

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: `rgb(var(--white, 255 255 255) / <alpha-value>)`,
        slate: themed("slate"),
        rose: themed("rose"),
        emerald: themed("emerald"),
        indigo: themed("indigo"),
        amber: themed("amber"),
      },
    },
  },
  plugins: [],
};
