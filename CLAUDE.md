# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint
- `npm run preview` — Serve production build locally

## Tech Stack

- **React 19** + **Vite 6** + **TypeScript 5.7** (strict mode)
- **Supabase** — Auth, PostgreSQL database, file storage
- **Zustand** v5 — Client state (form drafts persisted to sessionStorage)
- **TanStack React Query** v5 — Server state (`refetchOnMount: false`, `refetchOnWindowFocus: false`)
- **React Hook Form** v7 + **Zod** v3 — Form handling and validation
- **ShadCN UI** (New York style) + **Radix UI** + **Tailwind CSS** v4 (OKLch color variables)
- **React Router** v7 — Client-side routing with lazy-loaded pages

Path alias: `@/*` → `./src/*`

## Architecture

Single-page application (SPA) deployed on **Vercel**. All routes rewrite to `/index.html`.

### Routing & Auth

Routes defined in `src/routes/app-routes.tsx`. Protected routes are wrapped in `<AuthGuard>`, public routes in `<UnauthenticatedGuard>`. Session state is managed via `UserSessionContext` (context) + `useSessionListener` hook, backed by Supabase Auth.

### Enrollment Flows

The app has parallel enrollment flows with separate stores, contexts, layouts, and page directories:

- **HFSE-IS new student** — `src/pages/private/enrol-student/new/`, store: `useEnrolNewStudentStore`
- **HFSE-IS re-enrollment** — `src/pages/private/enrol-student/old/`, store: `useEnrolOldStudentStore`
- **VizSchool** — `src/pages/private/enrol-student/vizschool/`, stores: `useVizSchoolEnrolNewStudentStore`, `useVizSchoolEnrolCurrentLearnerStore`

Each flow is a multi-step form wizard with per-step pages and a shared layout providing navigation.

### Form Pattern

All forms follow this pattern:

1. Define Zod schema in `src/zod-schema.ts`
2. Infer TypeScript type from the schema
3. `useForm({ resolver: zodResolver(schema), defaultValues })` in the page component
4. Submit via `useMutation` calling functions from `src/actions/private.ts`
5. Drafts auto-saved to Zustand store (sessionStorage) via `use-save-application` hook

### State Management

- **Zustand stores** (`src/zustand-store.ts`) — 9 stores for form drafts, academic year selection, UI state. Drafts expire after 30 days.
- **React Context** — Session/auth (`UserSessionContext`), per-flow form context (`src/context/`)
- **TanStack Query** — All Supabase data fetching

### File Uploads

Custom `useSupabaseUpload` hook (`src/hooks/use-supabase-upload.ts`) wraps react-dropzone + Supabase Storage. Supports MIME validation, size limits, and PDF merging via `pdf-merger-js`.

## Key Files

| File | Purpose |
|------|---------|
| `src/routes/app-routes.tsx` | Complete routing tree with guards and lazy imports |
| `src/zustand-store.ts` | All Zustand stores |
| `src/zod-schema.ts` | All Zod validation schemas |
| `src/types.ts` | Core TypeScript interfaces (Student, Mother, Father, etc.) |
| `src/actions/private.ts` | Main business logic — enrollment CRUD, document uploads, queries |
| `src/actions/auth.ts` | Auth actions (login, register, password reset) |
| `src/lib/utils.ts` | Shared helpers, formatting, data transforms |
| `src/lib/client.ts` | Supabase client instance |
| `src/context/user-session-context.tsx` | Auth session provider |
| `src/data.ts` | Application constants and form option data |
