from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

BASELINE = Path(__file__).resolve().parent / "fixtures" / "render-proof.png"


def _assert_images_equal(actual_path: Path, expected_path: Path) -> None:
    actual = Image.open(actual_path).convert("RGBA")
    expected = Image.open(expected_path).convert("RGBA")
    assert actual.size == expected.size, f"{actual.size} != {expected.size}"

    diff = ImageChops.difference(actual, expected)
    # Deliberately NOT `diff.getbbox()`: on an RGBA image getbbox() returns the bounding box
    # of non-transparent pixels. Two opaque screenshots differ by alpha 0 everywhere, so the
    # difference image counts as fully transparent and getbbox() reports None no matter how
    # far apart the colours are -- this assertion could never fail.
    worst_per_channel = [band.getextrema()[1] for band in diff.split()]
    # Histogram bucket 0 holds the untouched pixels, so everything else changed.
    changed_pixels = actual.size[0] * actual.size[1] - diff.convert("L").histogram()[0]
    assert max(worst_per_channel) == 0, (
        f"Rendered screenshot differs from baseline: {actual_path}\n"
        f"  changed pixels: {changed_pixels} of {actual.size[0] * actual.size[1]}\n"
        f"  worst per-channel delta (R,G,B,A): {worst_per_channel}"
    )


def test_shared_renderer_proof_renders_deterministic_screenshot(
    live_server: str, chromium_available: None, tmp_path: Path
) -> None:
    # Imported inside the test: importing `rendering.*` at module level trips a
    # pre-existing circular import between the `rendering` and `orders` packages.
    from cards_configurator_backend.rendering.service import _find_browser_binary

    browser_binary = _find_browser_binary()
    actual_path = tmp_path / "render-proof.png"

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=browser_binary)
        page = browser.new_page(viewport={"width": 1800, "height": 2400}, device_scale_factor=1)
        page.goto(f"{live_server}/render/proof", wait_until="networkidle")
        page.wait_for_function("document.documentElement.dataset.renderReady === 'true'")
        page.locator('[data-testid="proof-canvas"]').screenshot(path=str(actual_path))
        browser.close()

    _assert_images_equal(actual_path, BASELINE)
