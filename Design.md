# Design System

Adapted from the Airbnb design language. Same structural principles — white canvas, single accent, soft corners, one shadow tier, modest type weights — applied to HFSE colors and Geist instead of Cereal.

---

## Colors

All values are OKLch, defined in `src/index.css` and surfaced via `@theme inline`. Use the semantic Tailwind tokens everywhere — never raw hex or oklch literals in components.

| Token | Tailwind class | Role |
|---|---|---|
| `--primary` | `bg-primary` / `text-primary` | The single brand color. Used for primary CTAs, links, active states, and icon accents. Used scarcely — most surfaces are white + foreground with one primary moment. |
| `--primary-foreground` | `text-primary-foreground` | White text on primary fill. |
| `--background` | `bg-background` | Pure white canvas. The default floor for every page. |
| `--foreground` | `text-foreground` | Near-black ink for headlines and body. Never pure black. |
| `--muted` | `bg-muted` | Lightest fill — disabled fields, checklist panels, sub-nav hover. |
| `--muted-foreground` | `text-muted-foreground` | Secondary text, labels, captions, inactive states. |
| `--border` | `border-border` | 1px hairline — input outlines, card borders, table separators. |
| `--card` | `bg-card` | White card surface (same as background). |
| `--destructive` | `bg-destructive` / `text-destructive` | Error state — form validation, delete actions. |
| `--accent` | `bg-accent` | Subtle tinted highlight — hover backgrounds on nav items. |
| `--secondary` | `bg-secondary` | Warm amber secondary accent (use in sub-brand / badge contexts only). |
| `--success` | `bg-success` / `text-success` | Positive / renewal / completed state — never raw `emerald-`/`green-`. |
| `--transfer` | `bg-transfer` / `text-transfer` | Third-party / transfer-type state — never raw `purple-`. |
| `--alert` | `bg-alert` / `text-alert` | Soft warning distinct from `destructive` (health/compliance notices) — never raw `rose-`. |

### Usage rules
- Primary carries **every** CTA, active link, and accent moment. Used scarcely — 90% of the page is background + foreground.
- `text-muted-foreground` for labels, captions, sub-titles. Never use raw gray values.
- `bg-muted` for list panels, disabled fields, sub-section fills. Not for card backgrounds.
- No raw slate/gray/zinc values in components. If a color isn't one of the tokens above, add it to `src/index.css` first.

---

## Typography

**Geist** is our Cereal — the single variable font for everything. Applied globally in `index.css`. No separate display family.

### Scale (Tailwind utilities)

| Role | Size | Weight | Class |
|---|---|---|---|
| Page heading | 28–30px | 700 | `text-3xl font-black` |
| Section heading | 22px | 700 | `text-2xl font-bold` |
| Sub-section title | 18–20px | 600 | `text-xl font-semibold` |
| Card title | 16px | 600 | `text-base font-semibold` |
| Body running text | 16px | 400 | `text-base` |
| Card meta / dates | 14px | 400 | `text-sm` |
| Label / caption | 10–12px | 700, uppercase, tracked | `text-[10px] font-bold uppercase tracking-[0.2em]` |
| Button | 14–16px | 500–600 | `text-sm font-semibold` or `text-base font-medium` |
| Badge / tag | 11px | 600 | `text-[11px] font-semibold` |

### Principles
- Display weights stay moderate. `font-black` (900) is reserved for the most important single element on a page — a hero number, a student name in a staging preview, a count. Overusing it flattens the hierarchy.
- The system trusts layout and spacing for visual weight, not typographic muscle. Keep headings at 700; let the white space do the lifting.
- Labels use `uppercase tracking-[0.2em]` — a tight, small-caps feel without an actual small-caps font. Consistent across every form label, section tag, and metadata row.

---

## Spacing

8px base. Use Tailwind's spacing scale — no arbitrary pixel values.

| Step | px | Token |
|---|---|---|
| xxs | 2 | `p-0.5` |
| xs | 4 | `p-1` |
| sm | 8 | `p-2` |
| md | 12 | `p-3` |
| base | 16 | `p-4` |
| lg | 24 | `p-6` |
| xl | 32 | `p-8` |
| xxl | 48 | `p-12` |
| section | 64 | `py-16` |

**Section vertical padding:** `py-12` to `py-16` (48–64px). Dense enough for a form tool, spacious enough to breathe.  
**Card internal padding:** `p-5` or `p-6` for content cards; `p-4` for compact list rows.  
**Between cards/items:** `gap-4` (16px) in grids, `gap-6` (24px) in vertical stacks.

---

## Border Radius

Base token: `--radius: 0.625rem` (10px). The calc scale:

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--radius-sm` | 6px | `rounded-sm` | Tight: tags, small badges |
| `--radius-md` | 8px | `rounded-md` | **Buttons** (matches Airbnb exactly) |
| `--radius-lg` | 10px | `rounded-lg` | Form inputs, small cards |
| `--radius-xl` | 14px | `rounded-xl` | **Cards**, modals, panels |
| `--radius-2xl` | — | `rounded-2xl` | Large sheet overlays |
| `rounded-full` | 9999px | `rounded-full` | Pills, avatars, search bar, circular icon buttons |

**Rule:** Every interactive element is rounded. The only hard corners allowed are the body grid itself and full-bleed page bands.

---

## Elevation

One shadow tier plus flat. 95% of surfaces are flat (no shadow).

| Use | Class | Value |
|---|---|---|
| Flat | — | No shadow. Body, hero, footers, editorial bands. |
| Resting surface | `shadow-sm` | 1px ring + 3px blur — search bars, focused inputs |
| **Card float** | `shadow-md` | The single elevation moment: card hover, dropdowns, popovers, the admin preview block. |
| Sheet / modal | `shadow-lg` | Dialog overlays |

`shadow-md` is the signature:  
`rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.10) 0 4px 8px`

The 1px ring (first layer) creates a crisp card edge without a visible border. The 4px / 8px layers lift it gently off the canvas.

**Rule:** Do not stack shadow tiers. A card either has the float shadow or it doesn't. No gradient shadow-to-shadow transitions.

---

## Components (conventions)

### Buttons
- Primary: `bg-primary text-primary-foreground rounded-md` — at 48px height (`h-12`).
- Gradient CTA (elevated action): `bg-gradient-to-br from-primary ... border-b-4` — reserve for the highest-weight action on a page (one per view).
- Ghost: `variant="ghost"` — nav actions, sign-out, secondary inline.
- All buttons: `font-semibold` (600). Never `font-bold` (700) or `font-black` (900) on buttons — too heavy against the Geist letter forms.

### Cards / Panels
- Default surface: `bg-card rounded-xl border border-border` (no shadow at rest).
- On hover or as a staging panel: add `shadow-md`.
- Internal structure: use `<Separator />` to divide logical zones within a card, not nested border-boxes.

### Form labels
- Always: `text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground`
- Never sentence-case labels; never full-size labels that compete with input text.

### Inputs
- ShadCN defaults + `rounded-lg` (10px) — one step rounder than the button.
- Focus ring: the `--ring` token via `outline-ring/50` applied globally.
- No box-shadow on inputs — the border color change on focus is enough.

### Empty states
- Centered, `text-muted-foreground`, a short action-oriented message. Not apologies, not brand voice.

---

## Responsive

Mobile-first. Tailwind breakpoints:

| | Width | Layout change |
|---|---|---|
| default | < 640px | Single column. Full-width inputs and cards. |
| `sm:` | 640px | 2-column grid for card sets. |
| `lg:` | 1024px | Side-by-side layouts, sticky rails, split panels. |
| `xl:` | 1280px | Content caps at 1280px max-width. Gutters absorb the rest. |

---

## What this system is not

- **Not dark-by-default.** Light canvas is the primary surface. Dark mode tokens exist but dark-mode design is secondary.
- **Not card-heavy.** Cards are used when content genuinely needs grouping. A list of form fields does not need a card.
- **Not color-rich.** Primary + foreground + muted is 80% of any screen. If a screen has 4+ colors it's too busy.
