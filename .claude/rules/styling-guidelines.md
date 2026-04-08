# Styling Guidelines

## Color System

- **Always use semantic Tailwind tokens** (`bg-primary`, `text-foreground`, `border-border`, etc.) — never raw hex, rgb, or oklch values.
- Available semantic colors: `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `card`, `popover`, `border`, `input`, `ring`, `chart-1..5`, `sidebar-*`.
- Each color has a `-foreground` variant for text on that background (e.g., `bg-primary text-primary-foreground`).
- Colors are defined in OKLch in `src/index.css` — add new tokens there and wire them through the `@theme inline` block.

## Dark Mode

- Class-based strategy (`.dark` on root), custom variant: `@custom-variant dark (&:is(.dark *))`.
- Use the `dark:` prefix for overrides (e.g., `dark:bg-input/30`, `dark:text-muted-foreground`).
- Never hardcode light-only or dark-only colors — always provide both variants when stepping outside semantic tokens.

## Typography

- **Primary display font:** Geist (applied globally via CSS).
- Tailwind font families: `font-sans` (Inter), `font-serif` (Source Serif 4), `font-mono` (JetBrains Mono).
- Use Tailwind text utilities (`text-sm`, `text-base`, `text-lg`, etc.) — avoid arbitrary `text-[14px]` values.

## Spacing & Layout

- Use the Tailwind spacing scale (`p-4`, `gap-6`, `space-y-2`) — avoid arbitrary pixel values.
- Border radius base: `--radius: 0.375rem` with scales `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`.
- Shadows: use the semantic scale `shadow-sm` through `shadow-2xl`.

## Components

- Use **ShadCN UI** components from `@/components/ui/` — do not rebuild existing primitives (Button, Input, Card, Dialog, etc.).
- Compose classes with `cn()` from `@/lib/utils` (clsx + tailwind-merge).
- For multi-variant components, use **class-variance-authority** (CVA).
- Follow the existing `data-slot` attribute pattern for component identification.

## Responsive Design

- **Mobile-first** — use Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`) to layer up.
- Page layouts: CSS Grid (`grid grid-cols-1 lg:grid-cols-2`).
- Component-level alignment: Flexbox.

## Animations

- Use `tw-animate-css` classes and Tailwind transition utilities (`transition-all`, `transition-colors`).
- Stateful animations via data attributes (`data-[state=open]:animate-in`, `data-[state=closed]:animate-out`).
