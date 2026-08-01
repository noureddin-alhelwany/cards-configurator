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

## Build layer

A template carries two things for the same design:

- `preview_asset` — the flat mockup shown in the design gallery.
- `background_asset` — text-free full-bleed artwork drawn under every element, plus the slot
  boxes and fit rules in `elements`. This is what preview *and* PDF are built from.

Rules:

- The background has no box in the JSON. It is drawn `inset: 0` / `object-fit: cover` from the
  stage geometry, so it cannot drift from `page_*_mm` (D-011).
- Prefer SVG. Chrome embeds SVG in an `<img>` as path operators, so it stays vector in the PDF.
  Raster is accepted and then measured as `min(dpi_x, dpi_y)`, because `cover` crops.
- Filenames are versioned: `backgrounds/<template_id>-<version>-<slot>.svg`. Orders re-render
  from their snapshot through the same URL, so replacing a file changes snapshot output.
  `background_asset_sha256` is an optional tripwire that makes that visible.
- Every new schema field is optional with a default, or order snapshots stop validating.

Loader diagnostics (require the assets directory): `template_background_missing`,
`template_background_dpi_too_low` (both errors — the template leaves the selection),
`template_background_dpi_warning`, `template_background_aspect_mismatch` (warning up to 3%,
error beyond), `template_background_changed`.

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

## Screen and production variants

`DesignRenderer` takes `variant: 'screen' | 'production'`. Preview chrome (bleed and trim
guides, validation outlines, the enhancement filter, the reduced-opacity hint) exists only in
`screen`.

This cannot be a `@media print` rule: the preview PNG is an element screenshot captured under
`emulate_media("screen")`, and only the PDF is captured under `print`. A print query would make
the two artifacts disagree. `@media print` is used for the page shell *outside* the card, which
the element screenshot never sees.

## Text fitting

- One heuristic per language with the same constant names and the same order of operations:
  `frontend/src/design/textFit.ts` and `quality.py`.
- `registries/fixtures/text_fit_cases.json` is executed by both test suites; it is what keeps
  the two implementations provably equal.
- The validator iterates **elements** and resolves the field, so element text without a field
  is checked too. Findings the customer cannot act on are non-blocking and addressed to the
  template author.
- `valign` anchors the block in its box; `min_font_size_mm` is the absolute shrink floor
  (`null` keeps the relative default). Text elements clip rather than overflow.

## QR

The element box **is** the symbol: the backend renders with `border=0`, so
`1 module == box_mm / module_count`. The quiet zone is a light plate drawn around the box, in
millimetres. `box_mm` must be square, and the encoded value is the customer's URL, resolved
once in `urls.py` and shared by renderer, validator and preview route.

## PDF

- Physical CSS page size includes bleed.
- `@page size` is emitted from the template geometry, and `page.pdf()` is additionally given
  explicit width/height with `scale=1` and zero margins — two independent mechanisms that
  agree, because trusting only one is what let the proof path fall back to Letter paper.
- Before any box is written, the produced PDF is verified read-only: one page, MediaBox within
  1pt, and the first content matrix positioned for that page height at offset 0. A check that
  writes the boxes first can only confirm its own writes.
- pikepdf then sets and validates MediaBox, BleedBox and TrimBox.
- Output remains RGB in MVP.
- Manual print/scan proof is required before production.

## Mockup

Mockup is an optional derived marketing view. It must never be reused as the
production file or quality source.
