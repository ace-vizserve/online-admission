import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";
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
    // Reads the `browserslist` field in package.json. Emits a second, Babel + core-js polyfilled
    // build alongside the modern one, with a `nomodule` fallback script — without this, a browser
    // that can't load native ES modules gets a silent blank page (no error, nothing in `#root`).
    legacy(),
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
    // Vitest defaults to 5s. Many component tests here type a keystroke at a time into real
    // Radix forms and await debounced validation; under a full parallel run — more so with
    // coverage instrumentation — that is marginal, and several files were flaking at the
    // default. Individual files may still raise this further (see file-declaration.test.tsx).
    testTimeout: 20000,
    css: false,
    coverage: {
      provider: "v8",
      include: [
        "src/actions/get-reenrollment-data.ts",
        "src/hooks/use-hydrate-reenrollment.ts",
        "src/lib/dates.ts",
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
        "src/lib/safe-storage.ts",
        "src/lib/generate-id.ts",
        "src/hooks/use-mobile.ts",
        // Absence & travel declarations (Services)
        "src/lib/sis.ts",
        "src/lib/declaration-dates.ts",
        "src/actions/declarations.ts",
        "src/hooks/use-declarations.ts",
        "src/hooks/use-enrolled-students.ts",
        "src/pages/private/services/declarations.tsx",
        "src/components/private/navbar/nav-main.tsx",
        "src/lib/declaration-rules.ts",
        "src/lib/declaration-steps.ts",
        "src/actions/declaration-payload.ts",
      ],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
