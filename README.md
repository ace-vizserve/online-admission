# HFSE Online Admission Web App

The **HFSE Online Admission Web App** is a modern, user-friendly platform designed for the parents of HFSE International School students to manage student enrollment and re-enrollment. The app simplifies the admission process by allowing parents to submit required documents, update student information, and track application status — all in one place.

## Features

- **Parent Portal** – Secure login and signup for parents to manage one or more children.
- **Student Enrollment** – Submit new student applications with necessary personal and academic details.
- **Re-enrollment System** – Reuse and update previously submitted student data for a new school year.
- **VizSchool Enrollment** – Parallel enrollment flow for VizSchool students with dedicated stores and layouts.
- **Open House Registration** – Streamlined registration flow for open house events.
- **Document Uploads** – Upload and preview required enrollment documents (e.g. passport, birth certificate, ID photos) with PDF merging support.
- **Document Re-upload** – Parents can update expired or rejected documents after initial submission.
- **Account Settings** – Profile name updates and security settings.
- **Progress Validation** – Multi-step form wizards with real-time validation and per-step navigation.
- **Row-Level Security** – Supabase RLS policies ensure users can only access their own records.

## Tech Stack

- **Framework**: React 19 + Vite 6 + TypeScript 5.7 (strict mode)
- **UI**: ShadCN UI (New York style) + Radix UI + Tailwind CSS 4
- **State Management**: Zustand 5 (client state) + TanStack React Query 5 (server state)
- **Form Handling**: React Hook Form 7 + Zod 3
- **Routing**: React Router 7 with lazy-loaded pages
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Deployment**: Vercel (SPA with all routes rewriting to `/index.html`)

## Development

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Serve production build locally
```

## Project Structure

```
src/
├── actions/          # Business logic — enrollment CRUD, document uploads, auth
├── assets/
├── components/
│   ├── auth/
│   ├── layout/
│   ├── private/
│   ├── public/
│   └── ui/           # ShadCN UI primitives
├── context/          # Auth session + per-flow form contexts
├── data/             # Application constants and form option data
├── hooks/            # Custom hooks (uploads, debounce, session listener, etc.)
├── lib/              # Supabase client, utilities, helpers
├── pages/
│   ├── auth/
│   ├── private/
│   │   ├── enrol-student/
│   │   │   ├── new/        # HFSE-IS new student flow
│   │   │   ├── old/        # HFSE-IS re-enrollment flow
│   │   │   └── vizschool/  # VizSchool enrollment flow
│   │   └── open-house/
│   └── public/
├── routes/           # Route definitions with auth guards
└── zustand-store.ts  # All Zustand stores
supabase/
└── functions/        # Supabase Edge Functions
```
