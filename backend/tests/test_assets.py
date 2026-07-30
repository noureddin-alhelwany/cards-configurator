from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

from cards_configurator_backend.app import create_app
from fastapi.testclient import TestClient
from PIL import Image


def _png_bytes(size: tuple[int, int] = (2000, 1000), color: tuple[int, int, int] = (255, 0, 0)) -> bytes:
    image = Image.new("RGB", size, color)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_raster_asset_upload_creates_preview_and_persists_files(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))

    with TestClient(create_app()) as client:
        response = client.post(
            "/api/assets?kind=image&filename=photo.png&mime_type=image/png",
            content=_png_bytes(),
            headers={"Content-Type": "image/png"},
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["kind"] == "image"
        assert payload["preview_data_url"].startswith("data:image/png;base64,")

        preview_bytes = base64.b64decode(payload["preview_data_url"].split(",", 1)[1])
        preview_image = Image.open(BytesIO(preview_bytes))
        assert preview_image.width <= 1024
        assert preview_image.height <= 1024

        asset_response = client.get(f"/api/assets/{payload['id']}")
        assert asset_response.status_code == 200
        asset_payload = asset_response.json()
        assert asset_payload["sha256"] == payload["sha256"]


def test_svg_logo_upload_rejects_scripts(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))

    with TestClient(create_app()) as client:
        response = client.post(
            "/api/assets?kind=logo&filename=logo.svg&mime_type=image/svg+xml",
            content=b"<svg><script>alert(1)</script></svg>",
            headers={"Content-Type": "image/svg+xml"},
        )

        assert response.status_code == 400
