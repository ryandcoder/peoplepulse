import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In local dev (npm run dev) /api is proxied to the FastAPI server.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:8000" } },
});
