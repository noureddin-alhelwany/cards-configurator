from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path
from typing import Any, cast

import pikepdf
from playwright.async_api import async_playwright
from pydantic import BaseModel

from ..registries.schemas import AssetDataUrl, LayoutState, TemplateDefinition

PT_PER_MM = 72 / 25.4


class RenderArtifacts(BaseModel):
    preview_path: str
    pdf_path: str
    page_width_mm: float
    page_height_mm: float


class PreviewArtifacts(BaseModel):
    preview_path: str
    page_width_mm: float
    page_height_mm: float


class OrderArtifacts(BaseModel):
    preview_path: str
    pdf_path: str
    page_width_mm: float
    page_height_mm: float


class RenderGeometryError(RuntimeError):
    """Chrome produced a page whose geometry does not match the template.

    Raised instead of `assert` because assertions vanish under `python -O` and this is a
    production correctness check, not a development aid.
    """


class RenderPageError(RuntimeError):
    """The render page reported that it cannot draw the card."""


# Long enough for a cold Chromium to fetch and decode full-bleed artwork, short enough that
# a genuinely stuck page fails within a request instead of hanging the worker.
RENDER_READY_TIMEOUT_MS = 30_000


async def _wait_for_render_ready(page: Any) -> None:
    """Block until the page says it is fully painted, or explain why it never will be.

    The page only sets `renderReady` once every asset it declared has loaded, and sets
    `renderError` instead when one of them fails. Without reading that flag a missing
    background would surface as an opaque timeout -- and before the flag existed it produced
    something worse: a screenshot taken before the artwork decoded, which looks like success.
    """
    try:
        await page.wait_for_function(
            "document.documentElement.dataset.renderReady === 'true'",
            timeout=RENDER_READY_TIMEOUT_MS,
        )
    except Exception as exception:
        reason = await page.evaluate("document.documentElement.dataset.renderError ?? null")
        if reason:
            raise RenderPageError(f"Render page reported '{reason}' and never became ready") from exception
        raise


def _mm_to_pt(mm: float) -> float:
    return mm * PT_PER_MM


def _box(left_mm: float, bottom_mm: float, right_mm: float, top_mm: float) -> pikepdf.Array:
    return pikepdf.Array([_mm_to_pt(left_mm), _mm_to_pt(bottom_mm), _mm_to_pt(right_mm), _mm_to_pt(top_mm)])


CHROME_ENV_VAR = "CARDS_CONFIGURATOR_CHROME"

# Bundle paths that `shutil.which` cannot find because they are not on PATH.
_BROWSER_BUNDLE_PATHS = (
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
)


def _find_browser_binary() -> str:
    """Locate a Chromium build for rendering.

    Checked in order of how reproducible the output is: an explicit override, then a
    browser on PATH, then a platform bundle path. PDF emission (font subsetting, path
    output) varies between Chrome versions, so production should pin one via the env var
    and record it on the order -- see `render_engine_version`.
    """
    override = os.environ.get(CHROME_ENV_VAR)
    if override:
        if not Path(override).exists():
            raise RuntimeError(f"{CHROME_ENV_VAR} points at {override}, which does not exist")
        return override

    for candidate in ("google-chrome", "chromium", "chromium-browser"):
        binary = shutil.which(candidate)
        if binary:
            return binary

    for bundle_path in _BROWSER_BUNDLE_PATHS:
        if Path(bundle_path).exists():
            return bundle_path

    raise RuntimeError(
        "Could not locate a Chromium browser binary for rendering. "
        f"Install one, or point {CHROME_ENV_VAR} at an executable."
    )


def _first_content_matrix(page: pikepdf.Page) -> tuple[float, ...] | None:
    """The first `cm` operator of the page content stream, as six floats.

    Chrome emits `s 0 0 -s 0 h cm` to flip from CSS coordinates (origin top-left) to PDF
    coordinates (origin bottom-left), where `h` is the page height in points. That last
    number is the cheapest available proof of which paper size the content was laid out
    for -- and no box assertion can see it.
    """
    contents = page.obj.get("/Contents")
    if contents is None:
        return None
    try:
        raw = bytes(contents.read_bytes())
    except (AttributeError, TypeError):
        return None

    numbers: list[float] = []
    for token in raw[:4096].split():
        try:
            numbers.append(float(token))
        except ValueError:
            if token == b"cm" and len(numbers) >= 6:
                return tuple(numbers[-6:])
            numbers.clear()
    return None


def _assert_chrome_page_geometry(pdf_path: Path, template: TemplateDefinition) -> None:
    """Verify what Chrome actually produced, before any box is rewritten.

    `_apply_pdf_boxes` sets the boxes and would therefore pass no matter what came out of
    the browser -- which is how the proof route printed Letter-sized pages unnoticed while
    the tests stayed green.
    """
    expected_width_pt = _mm_to_pt(template.page_width_mm)
    expected_height_pt = _mm_to_pt(template.page_height_mm)

    with pikepdf.open(pdf_path) as pdf:
        if len(pdf.pages) != 1:
            raise RenderGeometryError(
                f"expected a single page, got {len(pdf.pages)} -- the card does not fit the configured page size"
            )
        page = pdf.pages[0]
        media_box = [float(value) for value in cast(list[Any], page.mediabox)]
        actual_width_pt = media_box[2] - media_box[0]
        actual_height_pt = media_box[3] - media_box[1]
        if abs(actual_width_pt - expected_width_pt) > 1.0 or abs(actual_height_pt - expected_height_pt) > 1.0:
            raise RenderGeometryError(
                f"Chrome produced a {actual_width_pt:.1f}x{actual_height_pt:.1f}pt page, "
                f"expected {expected_width_pt:.1f}x{expected_height_pt:.1f}pt "
                f"({template.page_width_mm}x{template.page_height_mm}mm)"
            )

        matrix = _first_content_matrix(page)
        if matrix is None:
            raise RenderGeometryError("could not read the page content matrix; the PDF may be empty")
        _, _, _, _, translate_x, translate_y = matrix
        if abs(translate_y - expected_height_pt) > 1.0 or abs(translate_x) > 1.0:
            raise RenderGeometryError(
                f"content is positioned for a {translate_y:.1f}pt-tall page offset by {translate_x:.1f}pt, "
                f"expected {expected_height_pt:.1f}pt at offset 0 -- the layout does not match the paper"
            )


def _apply_pdf_boxes(pdf_path: Path, template: TemplateDefinition) -> None:
    media_box_values = [0.0, 0.0, _mm_to_pt(template.page_width_mm), _mm_to_pt(template.page_height_mm)]
    trim_box_values = [
        _mm_to_pt(template.bleed_mm),
        _mm_to_pt(template.bleed_mm),
        _mm_to_pt(template.page_width_mm - template.bleed_mm),
        _mm_to_pt(template.page_height_mm - template.bleed_mm),
    ]
    bleed_box_values = media_box_values
    media_box = pikepdf.Array(media_box_values)
    trim_box = pikepdf.Array(trim_box_values)
    bleed_box = pikepdf.Array(bleed_box_values)

    with pikepdf.open(pdf_path, allow_overwriting_input=True) as pdf:
        for page in pdf.pages:
            page.mediabox = media_box
            page.trimbox = trim_box
            page.bleedbox = bleed_box
        pdf.save(pdf_path)

    with pikepdf.open(pdf_path) as pdf:
        page = pdf.pages[0]
        for name, actual_box, expected_values in (
            ("MediaBox", cast(list[Any], page.mediabox), media_box_values),
            ("TrimBox", cast(list[Any], page.trimbox), trim_box_values),
            ("BleedBox", cast(list[Any], page.bleedbox), bleed_box_values),
        ):
            for actual, expected in zip(actual_box, expected_values, strict=True):
                if abs(float(actual) - expected) >= 0.001:
                    raise RenderGeometryError(f"{name} was not applied: {float(actual)} != {expected}")


def _validate_pdf_boxes(pdf_path: Path, template: TemplateDefinition) -> None:
    """Check Chrome's output first, then normalise the PDF page boxes."""
    _assert_chrome_page_geometry(pdf_path, template)
    _apply_pdf_boxes(pdf_path, template)


async def _print_pdf(page: Any, pdf_path: Path, template: TemplateDefinition) -> None:
    """Print the card at its exact physical size.

    Both PDF paths go through here so they cannot drift apart. `width`/`height` are passed
    explicitly and `prefer_css_page_size` is off, so the output is correct even if the
    generated `@page` rule never reaches the document; the rule exists so the browser's own
    print preview agrees. `scale=1` is the default but is stated to prevent a silent
    shrink-to-fit, which would break the 1 CSS mm == 1 physical mm guarantee.
    """
    await page.emulate_media(media="print")
    await page.pdf(
        path=str(pdf_path),
        print_background=True,
        prefer_css_page_size=False,
        width=f"{template.page_width_mm}mm",
        height=f"{template.page_height_mm}mm",
        scale=1,
        margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
    )


async def render_proof_artifacts(
    *,
    page_url: str,
    template: TemplateDefinition,
    layout_state: LayoutState,
    assets: dict[str, AssetDataUrl],
    output_dir: Path,
) -> RenderArtifacts:
    output_dir.mkdir(parents=True, exist_ok=True)
    temp_dir = Path(tempfile.mkdtemp(prefix="render-proof-", dir=str(output_dir.parent)))
    preview_tmp = temp_dir / "preview.png"
    pdf_tmp = temp_dir / "proof.pdf"

    browser_binary = _find_browser_binary()

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            executable_path=browser_binary,
            args=["--disable-dev-shm-usage"],
        )
        page = await browser.new_page(viewport={"width": 1800, "height": 2400}, device_scale_factor=1)
        await page.goto(page_url, wait_until="networkidle")
        await _wait_for_render_ready(page)
        await page.emulate_media(media="screen")
        await page.locator('[data-testid="proof-canvas"]').screenshot(path=str(preview_tmp))
        await _print_pdf(page, pdf_tmp, template)
        await browser.close()

    _validate_pdf_boxes(pdf_tmp, template)

    preview_path = output_dir / "proof-preview.png"
    pdf_path = output_dir / "proof.pdf"
    preview_path.write_bytes(preview_tmp.read_bytes())
    pdf_path.write_bytes(pdf_tmp.read_bytes())

    shutil.rmtree(temp_dir, ignore_errors=True)

    return RenderArtifacts(
        preview_path=str(preview_path),
        pdf_path=str(pdf_path),
        page_width_mm=template.page_width_mm,
        page_height_mm=template.page_height_mm,
    )


async def render_order_preview_artifacts(
    *,
    page_url: str,
    template: TemplateDefinition,
    layout_state: LayoutState,
    assets: dict[str, AssetDataUrl],
    output_dir: Path,
) -> PreviewArtifacts:
    output_dir.mkdir(parents=True, exist_ok=True)
    temp_dir = Path(tempfile.mkdtemp(prefix="render-order-", dir=str(output_dir.parent)))
    preview_tmp = temp_dir / "preview.png"

    browser_binary = _find_browser_binary()

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            executable_path=browser_binary,
            args=["--disable-dev-shm-usage"],
        )
        page = await browser.new_page(viewport={"width": 1800, "height": 2400}, device_scale_factor=1)
        await page.goto(page_url, wait_until="networkidle")
        await _wait_for_render_ready(page)
        await page.emulate_media(media="screen")
        await page.locator('[data-testid="proof-canvas"]').screenshot(path=str(preview_tmp))
        await browser.close()

    preview_path = output_dir / "preview.png"
    preview_path.write_bytes(preview_tmp.read_bytes())
    shutil.rmtree(temp_dir, ignore_errors=True)

    return PreviewArtifacts(
        preview_path=str(preview_path),
        page_width_mm=template.page_width_mm,
        page_height_mm=template.page_height_mm,
    )


async def render_order_artifacts(
    *,
    page_url: str,
    template: TemplateDefinition,
    layout_state: LayoutState,
    assets: dict[str, AssetDataUrl],
    output_dir: Path,
) -> OrderArtifacts:
    output_dir.mkdir(parents=True, exist_ok=True)
    temp_dir = Path(tempfile.mkdtemp(prefix="render-order-", dir=str(output_dir.parent)))
    preview_tmp = temp_dir / "preview.png"
    pdf_tmp = temp_dir / "order.pdf"

    browser_binary = _find_browser_binary()

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            executable_path=browser_binary,
            args=["--disable-dev-shm-usage"],
        )
        page = await browser.new_page(viewport={"width": 1800, "height": 2400}, device_scale_factor=1)
        await page.goto(page_url, wait_until="networkidle")
        await _wait_for_render_ready(page)
        await page.emulate_media(media="screen")
        await page.locator('[data-testid="proof-canvas"]').screenshot(path=str(preview_tmp))
        await _print_pdf(page, pdf_tmp, template)
        await browser.close()

    _validate_pdf_boxes(pdf_tmp, template)

    preview_path = output_dir / "preview.png"
    pdf_path = output_dir / "order.pdf"
    preview_path.write_bytes(preview_tmp.read_bytes())
    pdf_path.write_bytes(pdf_tmp.read_bytes())
    shutil.rmtree(temp_dir, ignore_errors=True)

    return OrderArtifacts(
        preview_path=str(preview_path),
        pdf_path=str(pdf_path),
        page_width_mm=template.page_width_mm,
        page_height_mm=template.page_height_mm,
    )
