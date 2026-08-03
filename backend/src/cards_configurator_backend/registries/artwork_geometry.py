from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, UnidentifiedImageError


@dataclass(frozen=True)
class ArtworkGeometry:
    width: float
    height: float
    kind: str

    @property
    def orientation(self) -> str:
        if abs(self.width - self.height) <= 0.01:
            return "square"
        return "landscape" if self.width > self.height else "portrait"

    @property
    def aspect_ratio(self) -> float:
        return self.width / self.height if self.height else 0.0


def _parse_dimension(value: str) -> float:
    stripped = value.strip()
    if stripped.endswith("mm"):
        stripped = stripped[:-2]
    elif stripped.endswith("px"):
        stripped = stripped[:-2]
    return float(stripped)


def _parse_svg_geometry(path: Path) -> ArtworkGeometry | None:
    try:
        root = ET.parse(path).getroot()
    except (ET.ParseError, OSError, ValueError):
        return None

    width_attr = root.attrib.get("width")
    height_attr = root.attrib.get("height")
    if width_attr is not None and height_attr is not None:
        try:
            return ArtworkGeometry(width=_parse_dimension(width_attr), height=_parse_dimension(height_attr), kind="vector")
        except ValueError:
            return None

    view_box = root.attrib.get("viewBox")
    if view_box:
        try:
            _, _, width_value, height_value = (float(part) for part in view_box.split())
            return ArtworkGeometry(width=width_value, height=height_value, kind="vector")
        except (ValueError, TypeError):
            return None

    return None


def probe_artwork_geometry(path: Path) -> ArtworkGeometry | None:
    if path.suffix.lower() in {".svg", ".svgz"}:
        return _parse_svg_geometry(path)

    try:
        with Image.open(path) as image:
            width, height = image.size
    except (UnidentifiedImageError, OSError, ValueError):
        return None
    return ArtworkGeometry(width=float(width), height=float(height), kind="raster")


def geometry_compatible(reference: ArtworkGeometry, background: ArtworkGeometry, *, tolerance: float = 0.01) -> bool:
    if reference.kind == background.kind:
        return abs(reference.width - background.width) <= tolerance and abs(reference.height - background.height) <= tolerance
    return reference.orientation == background.orientation and abs(reference.aspect_ratio - background.aspect_ratio) <= tolerance
