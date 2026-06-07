import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import "dotenv/config";

const serverPort = process.env.PORT ?? 5173;

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  preview: {
    host: true,
    port: 5174
  },
  server: {
    port: serverPort,
    host: "0.0.0.0",
    watch: {
      usePolling: true,
    },
  },
});
