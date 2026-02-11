# Design System Context: Residency & Journey Identity

## 1. Aesthetic Persona: "The Trusted Advisor"

**Core Objective:**  
Turn complex, high-stakes regulatory requirements (EduTrust, CPE, ICA) into a calm, navigable, and premium experience.

**Visual Style:**  
Architectural Minimalism

- High use of structural lines
- Generous padding
- Glassmorphism for secondary status elements

---

## 2. Color & Material Palette

### Primary Action

- `blue-600` (Pantone-style Trust Blue)

### Status Indicators (Soft-Tone)

**Complete**

- Background: `emerald-50`
- Icons: `emerald-600`

**Attention**

- Background: `amber-50`
- Icons: `amber-600`

**Locked / Pending**

- Background: `slate-50`
- Icons: `slate-400`
- `opacity-50`

### Surfaces

- Base Background: `bg-[#FAFBFF]` (Off-White Studio Base)
- Floating Cards: `backdrop-blur-md` (for layered glass effect)

---

## 3. Typography Hierarchy (The "Studio" Scale)

### Hero Headers

- `text-5xl` to `text-7xl`
- `font-black`
- `tracking-tighter`

### Editorial Accent

- `italic`
- `font-light`
- `text-slate-300`
- Used for secondary words in titles (e.g., _Application Required_)

### Prose Body

- `text-[13px]` or `text-sm`
- `text-slate-600`
- `leading-relaxed`

### Labels

- `uppercase`
- `text-[10px]`
- `font-black`
- `tracking-[0.2em]`
- `text-slate-400`

---

## 4. Specific Component Blueprints

### A. Journey Roadmap (Vertical Stepper)

- Steps connected by vertical line: `w-px bg-slate-100`
- Active steps:
  - `shadow-lg`
  - `shadow-blue-200/50`
- Locked steps:
  - `border-dashed`

---

### B. Micro-Card Requirement Grid

**Layout**

- `grid`
- `lg:grid-cols-2`

**Container**

- `rounded-xl`
- `border border-slate-100`
- `p-5`
- `transition-all`

**Hover Effect**

- `hover:shadow-md`
- Border color shifts to `blue-200`

**Icon Treatment**

- Squircle shape: `rounded-xl`
- Light wash background: `bg-blue-50`

---

### C. Status Header Card

**Architecture**

- `rounded-[2.5rem]`
- `overflow-hidden`

**Header Gradient**

- Horizontal gradient flow
  - Example: `from-emerald-50/50 to-blue-50/50`

**Badge Placement**

- Small badge above title
- Defines the "Current State"

---
