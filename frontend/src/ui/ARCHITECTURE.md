# UI Component Architecture

The frontend keeps reusable UI building blocks small and neutral so the visual layer can evolve without rewriting page flow.

Current shared pieces:

- `StateMessage` for loading, empty and error states
- `selection/selectionUi.tsx` for template and preview helpers
- `selection/selectionHelpers.ts` for asset and layout utilities
- `orders/viewHelpers.ts` for user-facing order labels and dates

Selection modules:

- `selection/selectionRules.ts` for template labels, style names, validation wording and ordering rules
- `selection/selectionCards.tsx` for template cards and variant buttons
- `selection/selectionFields.tsx` for the content-step form sections and field controls
- `selection/selectionContentStep.tsx` for the content step itself (header, alerts, sections, actions)
- `selection/selectionImageDialog.tsx` for the image adjustment dialog
- `selection/selectionPreview.tsx` for live preview and mockup rendering
- `selection/selectionPanels.tsx` for page-side panels that compose the step flow

Shared design helpers (usable from any page, including the production render):

- `design/fieldRoles.ts` classifies template fields so copy and fallbacks need no field ids
- `design/branding.ts` builds the typographic branding stand-in used when no logo exists
- `design/renderReadiness.ts` counts the assets a fixture must load before it is paintable

Guidelines:

- Use functional class names, not visual ones.
- Keep page flow in the page component.
- Keep preview/render logic isolated from copy and state framing.
- Prefer shared helpers for user-facing label formatting.
- The template owns layout, copy and rules — never hard-code field ids in components.
- Overlays must be portalled to `document.body`: `.selection-panel` uses `backdrop-filter`,
  which makes it a containing block for `position: fixed`.
