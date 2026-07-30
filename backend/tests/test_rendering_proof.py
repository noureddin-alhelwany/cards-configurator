from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

BASELINE = Path(__file__).resolve().parent / "fixtures" / "render-proof.png"


def _browser_binary() -> str:
    for candidate in ("google-chrome", "chromium", "chromium-browser"):
        resolved = shutil.which(candidate)
        if resolved:
            return resolved
    raise RuntimeError("No Chromium browser found for render testing")


def _assert_images_equal(actual_path: Path, expected_path: Path) -> None:
    actual = Image.open(actual_path).convert("RGBA")
    expected = Image.open(expected_path).convert("RGBA")
    assert actual.size == expected.size
    diff = ImageChops.difference(actual, expected)
    assert diff.getbbox() is None, f"Rendered screenshot differs from baseline: {actual_path}"


def test_shared_renderer_proof_renders_deterministic_screenshot(live_server: str, tmp_path: Path) -> None:
    browser_binary = _browser_binary()
    actual_path = tmp_path / "render-proof.png"

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=browser_binary)
        page = browser.new_page(viewport={"width": 1800, "height": 2400}, device_scale_factor=1)
        page.goto(f"{live_server}/render/proof", wait_until="networkidle")
        page.wait_for_function("document.documentElement.dataset.renderReady === 'true'")
        page.locator('[data-testid="proof-canvas"]').screenshot(path=str(actual_path))
        browser.close()

    _assert_images_equal(actual_path, BASELINE)
