import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// the react app runs on port 5173 and calls FastAPI on port 8000
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
