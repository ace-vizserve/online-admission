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
      include: [
        "src/actions/get-reenrollment-data.ts",
        "src/hooks/use-hydrate-reenrollment.ts",
        "src/lib/draft-storage.ts",
        "src/actions/drafts.ts",
        "src/actions/discard-draft.ts",
        "src/hooks/use-save-application.tsx",
        "src/components/private/shared/upload-requirements/use-carried-parent-guardian-docs.ts",
        "src/actions/sync-drafts.ts",
        "src/actions/resolve-draft.ts",
        "src/hooks/use-drafts-list.ts",
        "src/hooks/use-draft-rows.ts",
        "src/hooks/use-resolve-resume-draft.ts",
        "src/actions/merge-parent-guardian-documents.ts",
        "src/pages/private/drafts.tsx",
        "src/components/private/navbar/sidebar.tsx",
        "src/lib/step-validity.ts",
        "src/components/private/enrol-student/submit-application-dialog.tsx",
        "src/components/private/enrol-student/vizschool/submit-learner-application-dialog.tsx",
      ],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
