# Print Build Layer — Plan, Progress and Backlog

Status document for the work that turns a chosen template into a print-ready file. It is the
plan of record plus its current state; read it before picking up the next step. Background,
measurements and the rejected alternatives live here so the code can stay short.

## Goal

The customer picks a design, types a few values, uploads a logo, and gets a print file that
looks like the chosen template. Building blocks are **text, logo, QR**. Colours belong to the
template. Sizes fit automatically. Text, QR and logo must be sharp.

## The model

> **Template = (A) mockup image for the design gallery + (B) build layer: text-free background
> artwork + slot boxes + fit rules.** The build layer feeds preview *and* PDF — one renderer,
> as D-004 requires.

One layout in four skins, not four cloned templates: the four mockups have the same sequence
of blocks and differ only in background decor, accent colour and headline typeface.
`proof_a6_card-1.{2,3,4,5}.0.json` are byte-identical in `elements` — that is a symptom of
there being no construct for "same layout, different look", which the skin model supplies.

## Progress

| # | Step | State | Where |
|---|---|---|---|
| 0 | Text-free SVG background artwork per style | **todo** | `proof-assets/backgrounds/` |
| 1 | Print surface: `variant` prop, `@page`, `_print_pdf`, real geometry check | **done** | `DesignRenderer.tsx`, `rendering/service.py` |
| 2 | One auto-fit heuristic, shared contract fixture | **done** | `design/textFit.ts`, `quality.py`, `registries/fixtures/text_fit_cases.json` |
| 3 | QR fidelity: `border=0`, colour, quiet-zone plate, real URL validated | **done** | `urls.py`, `quality.py`, `DesignRenderer.tsx` |
| 4 | Effective DPI for `contain`/`cover`, clamps on read and on write | **done** | `quality.py`, `drafts/service.py` |
| 5 | `background_asset`: field, bottom layer, readiness lockstep, loader diagnostics | **done** | `registries/{schemas,loader}.py`, `design/renderReadiness.ts` |
| 6 | `valign` (+ `min_font_size_mm`, pulled forward into step 2) | **done** | `registries/schemas.py`, `DesignRenderer.tsx` |
| 7 | Skin model on `TemplateVariantDefinition` + `scripts/import_template_svg.py` | **todo** | authoring time only |
| 8 | One real template `proof_a6_card-1.6.0.json` with four skins | **todo** | `registries/templates/` |
| H | Runtime: Dockerfile from `requirements.lock`, pinned Chromium, real engine version | **todo** | `Dockerfile`, `rendering/service.py` |
| 9 | Real bold weight: `@font-face` from `fonts[]`, `fonts.check()` gate | deferred | after the first slice |
| 10 | Template-conditional branding fallback, remaining templates as new versions | deferred | after the first slice |
| 11 | `test_print_fidelity.py`, render tests runnable, `make test-render` | deferred | after the first slice |
| 12 | Fold this document's conclusions into the permanent docs | deferred | after the first slice |

First slice = steps 0–8 plus H. Steps 9–12 are evaluated afterwards.

## What each finished step actually fixed

**Step 1 — the print surface.** Preview chrome was printed onto production PDFs: a dashed trim
line, a bleed frame, a drop shadow, and `border-radius: 6mm` clipping artwork away at four
corners. The split cannot be `@media print`, because the preview PNG is captured under
`emulate_media("screen")` and only the PDF under `print` — so it is a `variant` prop.
The proof path also printed **Letter**: without `@page`, `prefer_css_page_size=True` had
nothing to read, and `_validate_pdf_boxes` then overwrote the MediaBox without moving the
content, so only the bottom ~35% of the card survived while the tests stayed green. That
function *set* the boxes, saved, re-read and asserted its own writes — a tautology. It is now
`_assert_chrome_page_geometry` (read-only, before any write, including a CTM check that catches
paper-size lies no box assertion can see) plus `_apply_pdf_boxes`.

**Step 2 — one auto-fit heuristic.** The estimate existed twice with duplicated constants, and
the *inputs* diverged: the backend checked `value.strip()`, the frontend fitted unstripped; the
backend iterated *fields* and therefore never validated the `body` element (which has no
field); static element text could overflow unnoticed; `max_lines` was resolved from different
places and agreed only because two ids happened to match. The loop is now element-first, and
`registries/fixtures/text_fit_cases.json` is executed by `backend/tests/test_text_fit.py` and
`frontend/src/design/textFit.test.ts` — the mechanism that keeps two implementations provably
equal without sharing code. Honest limit: a character-count heuristic never matches Chromium's
real line breaking. Identical prevents contradictory verdicts; correct is a separate problem,
whose successor is measuring overflow in the browser (`scrollHeight > clientHeight`).

**Step 3 — QR fidelity.** The gate encoded the template's static `value`, so it reported the
same two numbers for every customer URL. Meanwhile the renderer drew the symbol inset behind
segno's default 4-module border, so a 22mm box printed a 16.67mm symbol and silently violated
the product's 18mm minimum. Contract now: **the element box is the symbol** (`border=0`, so
`1 module == box / module_count`), and the quiet zone is a light plate around it.
`quiet_zone_mm` defaults to a light colour, because a transparent quiet zone is not a quiet
zone on coloured artwork.

*Deviation from the plan:* `qr_quiet_zone_too_small` is a **non-blocking** finding addressed to
the template author, not a blocking one. ISO/IEC 18004 requires 4 *modules*, so a **shorter**
URL needs a **wider** zone — blocking would refuse an order over a template value the customer
cannot reach. The shipped templates were raised from 2mm to 4mm.

**Step 4 — effective DPI and clamps.** The formula used the width axis alone. For `contain`
that is merely conservative; for `cover` it **over-reports**, because the overflowing axis is
cropped away: a 1000×300 photo in a 60×40mm cover box really prints at `min(423, 190) = 190`
dpi and must block, while the old formula reported 423 and let it through. There were also
three different effective scales in play — the renderer clamped, the gate and the form used the
raw stored value — so a crafted `PATCH` of `scale: 3.0` against `max_scale: 1.2` made the gate
compute a DPI 2.5× too low. The clamp now lives in the shared helper **and** on the write path,
and the duplicated frontend arithmetic is gone: the form shows the server's finding.

**Step 5 — `background_asset`.** Deliberately *not* a `static_asset` element (see D-011) and
deliberately *not* in `fixture.assets`, which is keyed by field id and travels through
`/api/registries`. The riskiest detail is the readiness handshake: if `expectedAssetCount` does
not count the background, Playwright screenshots the card **before the artwork is decoded** and
writes a plausible-looking but wrong print file — non-deterministically, and the failure looks
like success. So the count, the `onLoad` id and the `onError` path move together, and all three
render paths read `renderError` and raise `RenderPageError` instead of timing out opaquely.

**Step 6 — `valign`.** Without it auto-fit is visibly wrong: a two-line headline that shrinks
to one line stays glued to the top of its box and drifts away from optically centred artwork.
The flex wrapper is emitted only for `middle`/`bottom`, so existing templates stay
pixel-identical. `overflow: hidden` on text elements was added in the same step: past the
shrink floor, text used to print over the artwork.

## Artwork rules

Backgrounds are **SVG**. Chrome embeds SVG in an `<img>` as path operators (the QR code is the
standing proof), so it is resolution independent and sharp by construction. Raster is accepted
as a fallback and then measured: `min(dpi_x, dpi_y)`, because `object-fit: cover` crops.

Pixels needed for 111×154mm: **983×1364** (225, hard minimum), **1312×1820** (300),
**1967×2728** (450).

The existing mockups are unusable as artwork and stay gallery tiles: 1054×1492 px = **241 dpi**,
aspect 0.7064 instead of 0.7208 (**2% off**, trim instead of full bleed), and headline, logo and
footer are baked in.

Naming convention `backgrounds/<template_id>-<version>-<slot>.svg`. Finished orders re-render
from their snapshot through the same `/proof-assets/<file>` URL, so replacing a file would
retroactively change a year-old order. Versioned filenames prevent it; the optional
`background_asset_sha256` makes an accidental swap visible (`template_background_changed`).

## Hard rule for every new schema field

**Optional with a default.** `TemplateDefinition.model_validate(record.template_snapshot)` runs
on every existing order (`orders/service.py`, `rendering/jobs.py`); a required field breaks all
of them. **No Alembic migration** — `orders.template_snapshot` is a schemaless JSON column, and
backfilling it would violate the snapshot rule in `DOMAIN_MODEL.md`. `schema_version` stays 1:
it is read nowhere, and bumping it would imply a migration history that does not exist.

## Open TODOs

### Step 0 + 7 — artwork and the skin model
- [ ] Four text-free SVG backgrounds, 111×154mm, one colour world per mockup, with **named
      slot placeholders** (`id="slot-headline"`, …).
- [ ] Optional style fields on `TemplateVariantDefinition` (today inert: only `id`, `name`,
      `active`, `preview_asset`): `background_asset`, accent colour, headline typeface.
- [ ] Skin resolution in the renderer, so the layout and its slots exist **once**.
- [ ] `scripts/import_template_svg.py` reads slot geometry from the named placeholders at
      **authoring time** and writes the template JSON. No runtime parser, no new runtime
      dependency; geometry can no longer drift from the artwork, and the generator can read
      colour, size and alignment from the slot style.

### Step 8 — the first real template
- [ ] `proof_a6_card-1.6.0.json` with four skins instead of four clones: wordmark slot
      (`businessName` finally drawn), website and Instagram fields plus slots, `body` field,
      tight centred slots, light QR plate, style picker re-enabled.
- [ ] Do **not** touch 1.2.0–1.5.0: that keeps the 18 existing orders and the `"1.2.0"` pin in
      `registries/service.py` (which the pixel baseline renders against) untouched.

### Part H — runtime
- [ ] `Dockerfile` installs from `backend/requirements.lock`; `pyproject.toml` lists neither
      pikepdf, pillow, segno nor playwright.
- [ ] Install a pinned Chromium (`playwright install --with-deps chromium`). PDF emission (font
      subsetting, path output) varies between Chrome versions.
- [ ] Write the real browser version into `OrderRecord.render_engine_version` (today the
      constant `"1"`), which makes the D-005 contract auditable.

### Known open items outside the first slice
- [ ] **Bold is not bold.** `index.css` declares one static `ProofSans.ttf` as
      `font-weight: 400 700` and sets `font-synthesis: none`, so headlines with
      `font_weight: 700` print in Regular — and the preview shares the bug, so approval cannot
      catch it. `TemplateDefinition.fonts[]` exists but generates no `@font-face`.
- [ ] **`businessName` is required, has no element**, and reaches the card only as glyphs
      inside `brandingFallbackDataUrl`, injected as the *logo* asset when no logo was uploaded
      — so uploading a logo removes the company name from the card entirely. Fixing the
      fallback must be **template-conditional**, or the re-render of all 18 historical orders
      changes.
- [ ] **Render tests are not runnable**: `conftest.py` calls `corepack` unconditionally, and
      `_find_browser_binary()` resolves nothing on macOS. `make test-render` runs
      `test_migration.py`, not the render tests.
- [ ] Invariant worth enforcing in the loader as warnings: every text element has a field,
      every text field an element. That would have caught `proof_a6_card-1.1.0.json` —
      required `qrTarget`, **no QR element**, so the URL the user types is never drawn.

## Manual acceptance for the first slice

1. Design step: the four cards look **different** (today they are identical).
2. Content step: name/headline/logo/link land in their slots automatically; a long headline
   shrinks to `min_font_size_mm` and is then reported as blocking instead of printing over the
   artwork.
3. Without a logo the wordmark carries the name (no longer the logo slot).
4. `/render/orders/{id}/production`: artwork full bleed, **no** dashed line, **no** rounded
   corners, no shadow.
5. Open the PDF: 111×154mm, one page, content correctly positioned (not Letter), text
   selectable (= vector), QR sharp when zoomed, on a light plate, and **scannable with a
   phone**.
6. Re-render the 18 historical orders — output unchanged.
7. Drop in a 241 dpi raster artwork → loader warns; 200 dpi → the template leaves the
   selection.
