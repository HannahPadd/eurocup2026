import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import manifest from './public/manifest.json';

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest,
    devOptions: {
      enabled: true
    }
  })],
  preview: {
    host: true,
    port: 5174
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: ["0.0.0.0"],
    watch: {
      usePolling: true,
    },
  },
});