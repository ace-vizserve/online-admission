/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vitest/config";
import ViteSitemap from "vite-plugin-sitemap";

const routes = ["/", "/login", "/registration", "/welcome", "/open-house-registration"];

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ViteSitemap({
      basePath: "",
      dynamicRoutes: routes,
      generateRobotsTxt: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
  },
  build: {
    sourcemap: false,
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/actions/get-reenrollment-data.ts", "src/hooks/use-hydrate-reenrollment.ts"],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
