---
name: accessible-forms-and-print
description: >-
  Guidelines for accessible multi-section Thai forms, custom multi-select checkboxes,
  digital signature pads, A4 paper attendance sheet printing, and structure-matched
  Skeleton Shimmer loading states.
---

# Accessible Forms, Digital Signatures & Print Layouts

## 1. Form Section Organization

- Divide complex forms into numbered, clearly titled sections with a subtle header bar, icon, and brief Thai description.
- Mark all required fields with an accessible required indicator (`*` with `aria-hidden="true"`) and bind `aria-invalid` and `aria-describedby` when validation errors occur.
- Prevent accidental duplicate submissions by disabling the submit button while `isSubmitting` is true and requiring confirmation via a modal dialog before writing to Google Sheets.

## 2. Custom Multi-Select Checkboxes

- Use keyboard-accessible `<label>` cards containing an `<input type="checkbox" class="sr-only" />` paired with a custom visual checkmark box (`w-5 h-5 rounded-md`) so users can toggle options via both Space/Enter keyboard navigation and mouse/touch clicks.

## 3. Digital Signature Pad & Upload

- Support both smooth HTML5 Canvas drawing (mouse, stylus, and touch events with `touch-action: none`) and image upload (auto-scaled to compact PNG Data URLs).
- Preserve all team member signatures (`2 columns` for Group 1, `3 columns` for Group 2, `3 columns` for Group 3) in both the interactive table and the A4 print layout.

## 4. Structure-Matched Skeleton & Shimmer UI

- Respect `prefers-reduced-motion: reduce` by disabling shimmer movement for users who prefer reduced motion.
- Match the skeleton structure to the target view (metric cards + table rows with realistic column widths).

