import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const apiTarget = process.env.API_PROXY_TARGET || "http://localhost:3000";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      "/api": apiTarget,
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
