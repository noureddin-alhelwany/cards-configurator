from __future__ import annotations

import base64
import hashlib
import json
import re
import uuid
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException
from PIL import Image, ImageOps

ALLOWED_RASTER_MIME_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
}

ALLOWED_VECTOR_MIME_TYPES = {
    "image/svg+xml": ".svg",
}


def _asset_dir(data_dir: Path, asset_id: str) -> Path:
    return data_dir / "assets" / asset_id


def _data_url(mime_type: str, raw: bytes) -> str:
    encoded = base64.b64encode(raw).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def _sanitize_svg(raw: bytes) -> bytes:
    text = raw.decode("utf-8")
    forbidden_patterns = [
        r"<\s*script\b",
        r"on[a-z]+\s*=",
        r"xlink:href\s*=\s*['\"]\s*https?://",
        r"href\s*=\s*['\"]\s*https?://",
    ]
    if any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in forbidden_patterns):
        raise HTTPException(status_code=400, detail="SVG contains unsupported scripts or external references")
    return raw


def _process_raster(kind: str, image: Image.Image) -> tuple[bytes, bytes, dict[str, object]]:
    normalized = ImageOps.exif_transpose(image)
    metadata: dict[str, object] = {
        "width_px": normalized.width,
        "height_px": normalized.height,
        "color_mode": normalized.mode,
    }

    render_image = normalized.convert("RGBA") if normalized.mode not in {"RGBA", "LA"} else normalized
    render_buffer = BytesIO()
    render_image.save(render_buffer, format="PNG")
    render_bytes = render_buffer.getvalue()

    preview_image = normalized.copy()
    preview_limit = 512 if kind == "logo" else 1024
    preview_image.thumbnail((preview_limit, preview_limit))
    preview_buffer = BytesIO()
    preview_image.save(preview_buffer, format="PNG")
    preview_bytes = preview_buffer.getvalue()

    return render_bytes, preview_bytes, metadata


def store_uploaded_asset(data_dir: Path, *, kind: str, filename: str, mime_type: str, body: bytes) -> dict[str, object]:
    if kind not in {"logo", "image"}:
        raise HTTPException(status_code=400, detail="Unsupported asset kind")

    asset_id = uuid.uuid4().hex
    asset_dir = _asset_dir(data_dir, asset_id)
    asset_dir.mkdir(parents=True, exist_ok=True)

    sha256 = hashlib.sha256(body).hexdigest()
    base_name = Path(filename).stem or "asset"

    metadata: dict[str, object] = {
        "id": asset_id,
        "kind": kind,
        "original_filename": filename,
        "mime_type": mime_type,
        "sha256": sha256,
    }

    if mime_type in ALLOWED_RASTER_MIME_TYPES:
        suffix = ALLOWED_RASTER_MIME_TYPES[mime_type]
        original_path = asset_dir / f"{base_name}-original{suffix}"
        original_path.write_bytes(body)

        with Image.open(BytesIO(body)) as image:
            render_bytes, preview_bytes, image_metadata = _process_raster(kind, image)

        render_path = asset_dir / "render.png"
        preview_path = asset_dir / "preview.png"
        render_path.write_bytes(render_bytes)
        preview_path.write_bytes(preview_bytes)

        metadata.update(image_metadata)
        metadata.update(
            {
                "original_path": str(original_path),
                "preview_path": str(preview_path),
                "render_path": str(render_path),
                "preview_data_url": _data_url("image/png", preview_bytes),
                "render_data_url": _data_url("image/png", render_bytes),
            }
        )
    elif mime_type in ALLOWED_VECTOR_MIME_TYPES:
        sanitized = _sanitize_svg(body)
        original_path = asset_dir / f"{base_name}-original.svg"
        preview_path = asset_dir / "preview.svg"
        render_path = asset_dir / "render.svg"
        original_path.write_bytes(sanitized)
        preview_path.write_bytes(sanitized)
        render_path.write_bytes(sanitized)
        metadata.update(
            {
                "width_px": None,
                "height_px": None,
                "color_mode": "vector",
                "original_path": str(original_path),
                "preview_path": str(preview_path),
                "render_path": str(render_path),
                "preview_data_url": _data_url("image/svg+xml", sanitized),
                "render_data_url": _data_url("image/svg+xml", sanitized),
            }
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported asset mime type")

    (asset_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


def load_asset(data_dir: Path, asset_id: str) -> dict[str, object]:
    metadata_path = _asset_dir(data_dir, asset_id) / "metadata.json"
    if not metadata_path.exists():
        raise HTTPException(status_code=404, detail="Asset not found")
    return json.loads(metadata_path.read_text(encoding="utf-8"))
