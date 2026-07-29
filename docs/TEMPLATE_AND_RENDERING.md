# Template, Editor and Rendering

## Template model

A template combines:

- physical canvas dimensions
- dynamic field definitions
- typed elements
- layout variants
- versioned fonts and static assets
- validation constraints

Supported initial dynamic element types:

- text
- image
- logo
- QR
- shape
- static asset

## Geometry

Persist physical boxes in millimeters and user transforms as normalized values.

```text
offsetX / offsetY: -1.0 to 1.0 within allowed movement
scale: dimensionsless zoom factor
```

Never persist viewport pixels.

## Shared renderer

`TemplateDefinition + LayoutState → DesignRenderer`

The same React renderer is used for:

- interactive browser preview
- production render route
- PDF output through Playwright
- preview screenshot
- optional mockup source image

Do not implement a second Python layout renderer.

## Fonts

- Every template references bundled, versioned font files.
- Browser and production render use the same files.
- Production waits for `document.fonts.ready`.
- A render-ready signal is required before screenshot/PDF capture.

## Images

Pipeline:

```text
immutable original
→ detected metadata and EXIF correction
→ small preview derivative
→ high-resolution normalized render derivative
```

The render derivative is generated from the original, not from the preview.

## Logos and SVG

- PNG/JPEG are straightforward.
- Uploaded SVG must reject or remove scripts, event handlers and external
  references.
- Template-owned SVG is trusted source-controlled content.
- Logo proportions remain fixed; no free rotation.

## PDF

- Physical CSS page size includes bleed.
- Playwright prints background graphics and uses CSS page size.
- pikepdf sets and validates MediaBox, BleedBox and TrimBox.
- Output remains RGB in MVP.
- Manual print/scan proof is required before production.

## Mockup

Mockup is an optional derived marketing view. It must never be reused as the
production file or quality source.
