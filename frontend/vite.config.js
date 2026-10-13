import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, /api calls go to the backend started with `npm run dev` in the project root.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
