from __future__ import annotations

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


def _mm_to_pt(mm: float) -> float:
    return mm * PT_PER_MM


def _box(left_mm: float, bottom_mm: float, right_mm: float, top_mm: float) -> pikepdf.Array:
    return pikepdf.Array([_mm_to_pt(left_mm), _mm_to_pt(bottom_mm), _mm_to_pt(right_mm), _mm_to_pt(top_mm)])


def _find_browser_binary() -> str:
    for candidate in ("google-chrome", "chromium", "chromium-browser"):
        binary = shutil.which(candidate)
        if binary:
            return binary
    raise RuntimeError("Could not locate a Chromium browser binary for rendering")


def _validate_pdf_boxes(pdf_path: Path, template: TemplateDefinition) -> None:
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
        media_box_page = cast(list[Any], page.mediabox)
        trim_box_page = cast(list[Any], page.trimbox)
        bleed_box_page = cast(list[Any], page.bleedbox)
        for actual, expected in zip(media_box_page, media_box_values, strict=True):
            assert abs(float(actual) - expected) < 0.001
        for actual, expected in zip(trim_box_page, trim_box_values, strict=True):
            assert abs(float(actual) - expected) < 0.001
        for actual, expected in zip(bleed_box_page, bleed_box_values, strict=True):
            assert abs(float(actual) - expected) < 0.001


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
        await page.wait_for_function("document.documentElement.dataset.renderReady === 'true'")
        await page.emulate_media(media="screen")
        await page.locator('[data-testid="proof-canvas"]').screenshot(path=str(preview_tmp))
        await page.emulate_media(media="print")
        await page.pdf(path=str(pdf_tmp), print_background=True, prefer_css_page_size=True)
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
