# UI Component Architecture

The frontend keeps reusable UI building blocks small and neutral so the visual layer can evolve without rewriting page flow.

Current shared pieces:

- `StateMessage` for loading, empty and error states
- `selection/selectionUi.tsx` for template and preview helpers
- `selection/selectionHelpers.ts` for asset and layout utilities
- `orders/viewHelpers.ts` for user-facing order labels and dates

Guidelines:

- Use functional class names, not visual ones.
- Keep page flow in the page component.
- Keep preview/render logic isolated from copy and state framing.
- Prefer shared helpers for user-facing label formatting.
