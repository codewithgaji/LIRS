import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The React app runs on http://localhost:5173 and calls FastAPI on port 8000.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
