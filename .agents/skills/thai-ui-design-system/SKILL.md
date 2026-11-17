---
name: thai-ui-design-system
description: >-
  Comprehensive Thai UI/UX Design System, IBM Plex Sans Thai typography standards,
  centralized semantic color tokens, Light/Dark mode contrast rules, and minimalist
  dashboard patterns. Use whenever designing or building Thai-language web interfaces,
  reusable UI components, or dashboards.
---

# Thai UI/UX Design System & Typography Standards

This skill defines the authoritative design system, Thai typography standards, and visual architecture for the IT Support Record Management Web Application.

## 1. Thai Typography Standards (`IBM Plex Sans Thai`)

- **Primary Font Family**: `'IBM Plex Sans Thai'`, with fallbacks `'Anuphan'`, `'Noto Sans Thai'`, `system-ui`, `sans-serif`.
- **Monospace Font Family**: `'IBM Plex Mono'`, `'JetBrains Mono'`, `monospace` for receipt numbers (`ITS-YYYYMMDD-XXXX`), timestamps, phone numbers, and serial numbers.
- **Line Height & Vowel Clearance**:
  - Thai script uses upper/lower vowels and tone marks (e.g., ิ ี ึ ื ุ ู ่ ้ ๊ ๋).
  - Never use tight leading (`leading-none`) on Thai headings or buttons, as upper tone marks can clip.
  - Use `line-height: 1.6` (`leading-relaxed`) for body copy and `line-height: 1.35` to `1.45` for headings.
  - Apply `letter-spacing: 0` or `0.01em` for Thai text; never apply wide uppercase tracking (`tracking-widest`) to Thai strings.

## 2. Minimalist & Professional Visual Direction

- **No Excessive Gradients**: Avoid flashy multi-stop neon gradients. Use clean solid surfaces (`bg-white`, `dark:bg-slate-900`) with subtle top accent borders or refined 1px borders (`border-slate-200`, `dark:border-slate-800`).
- **Centralized Semantic Color Palette**:
  - **Primary**: Royal/Corporate Blue (`blue-600` in Light Mode, `blue-500` in Dark Mode)
  - **Secondary / Neutral**: Slate (`slate-50` to `slate-950`)
  - **Success**: Emerald (`emerald-600` / `emerald-400`)
  - **Warning**: Amber (`amber-600` / `amber-400`)
  - **Danger / Error**: Rose/Red (`red-600` / `red-400`)
- **Consistent Border Radius**:
  - Cards & Containers: `rounded-2xl` (`16px`)
  - Inputs, Selects, Buttons: `rounded-xl` (`12px`)
  - Badges & Tags: `rounded-lg` (`8px`) or `rounded-full`
- **Icons Only from Lucide React**: Never use emojis as UI icons. Pair every primary action or section header with a clean `16px` (`w-4 h-4`) or `20px` (`w-5 h-5`) Lucide icon.

## 3. Light Mode & Dark Mode Contrast Rules

- **Backgrounds**: Light `#f8fafc` (`bg-slate-50`) / Dark `#090d16` (`bg-slate-950`)
- **Elevated Surface (Card)**: Light `#ffffff` (`bg-white`) / Dark `#0f172a` (`bg-slate-900`)
- **Muted Surface (Input/Subtle Box)**: Light `#f1f5f9` (`bg-slate-100/70`) / Dark `#1e293b` (`bg-slate-800/60`)
- **Primary Text**: Light `text-slate-900` / Dark `text-slate-100`
- **Secondary Text**: Light `text-slate-600` / Dark `text-slate-400`
- **Interactive Focus Ring**: Always include `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-600`.

