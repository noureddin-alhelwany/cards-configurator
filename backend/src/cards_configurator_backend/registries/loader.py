from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, cast

from pydantic import ValidationError

from .artwork_geometry import geometry_compatible, probe_artwork_geometry
from .schemas import (
    ProductDefinition,
    RegistryBundle,
    RegistryIssue,
    TemplateDefinition,
    UseCaseDefinition,
)

# Aspect deviation the loader tolerates before it says anything, and before it refuses the
# template. 2% is the gap between the existing mockups and full-bleed geometry -- visible as
# a shifted crop, not as an obviously broken card, which is exactly why it needs a check.
_ASPECT_WARNING_RATIO = 0.01
_ASPECT_ERROR_RATIO = 0.03


def _issue(
    code: str,
    path: str,
    message: str,
    *,
    blocking: bool = True,
    details: dict[str, Any] | None = None,
) -> RegistryIssue:
    return RegistryIssue(
        code=code,
        severity="error" if blocking else "warning",
        path=path,
        message=message,
        blocking=blocking,
        details=details or {},
    )


def _load_documents(directory: Path) -> tuple[list[tuple[Path, dict[str, Any]]], list[RegistryIssue]]:
    records: list[tuple[Path, dict[str, Any]]] = []
    issues: list[RegistryIssue] = []

    if not directory.exists():
        issues.append(_issue("registry_directory_missing", str(directory), f"Registry directory does not exist: {directory}"))
        return records, issues

    for path in sorted(directory.rglob("*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(payload, dict):
                raise TypeError("registry files must contain a JSON object")
            records.append((path, payload))
        except (ValueError, json.JSONDecodeError, TypeError) as exc:
            issues.append(_issue("registry_schema_invalid", str(path), f"Registry file failed JSON parsing: {exc}"))
        except OSError as exc:
            issues.append(_issue("registry_read_failed", str(path), f"Could not read registry file: {exc}"))

    return records, issues


def _load_use_cases(directory: Path) -> tuple[list[UseCaseDefinition], list[RegistryIssue]]:
    documents, issues = _load_documents(directory)
    records: list[UseCaseDefinition] = []

    for path, payload in documents:
        try:
            records.append(UseCaseDefinition.model_validate(payload))
        except ValidationError as exc:
            issues.append(
                _issue(
                    "registry_schema_invalid",
                    str(path),
                    "Registry file failed schema validation",
                    details={"errors": exc.errors()},
                )
            )

    return records, issues


def _load_products(directory: Path) -> tuple[list[ProductDefinition], list[RegistryIssue]]:
    documents, issues = _load_documents(directory)
    records: list[ProductDefinition] = []

    for path, payload in documents:
        try:
            records.append(ProductDefinition.model_validate(payload))
        except ValidationError as exc:
            issues.append(
                _issue(
                    "registry_schema_invalid",
                    str(path),
                    "Registry file failed schema validation",
                    details={"errors": exc.errors()},
                )
            )

    return records, issues


def _load_templates(directory: Path) -> tuple[list[TemplateDefinition], list[RegistryIssue]]:
    documents, issues = _load_documents(directory)
    records: list[TemplateDefinition] = []

    for path, payload in documents:
        try:
            records.append(TemplateDefinition.model_validate(payload))
        except ValidationError as exc:
            issues.append(
                _issue(
                    "registry_schema_invalid",
                    str(path),
                    "Registry file failed schema validation",
                    details={"errors": exc.errors()},
                )
            )

    return records, issues


def _probe_artwork_geometry(path: Path):
    return probe_artwork_geometry(path)


def _background_diagnostics(
    record: TemplateDefinition,
    product: ProductDefinition,
    assets_dir: Path,
) -> list[RegistryIssue]:
    """Check the declared background artwork against the page it has to fill.

    A card without artwork must not be orderable, and soft artwork prints soft, so a missing
    file and an under-resolution raster are both errors that drop the template out of the
    selection. Aspect drift is a warning first: 1% is invisible, 3% moves the crop enough to
    cut into content.
    """
    if record.background_asset is None:
        return []

    path = assets_dir / record.background_asset
    if not path.is_file():
        return [
            _issue(
                "template_background_missing",
                record.id,
                f"Template '{record.id}' declares background artwork that is missing: {record.background_asset}",
                details={"template_id": record.id, "background_asset": record.background_asset, "path": str(path)},
            )
        ]

    issues: list[RegistryIssue] = []

    if record.background_asset_sha256 is not None:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != record.background_asset_sha256:
            issues.append(
                _issue(
                    "template_background_changed",
                    record.id,
                    f"Background artwork of '{record.id}' no longer matches its declared digest",
                    blocking=False,
                    details={
                        "template_id": record.id,
                        "background_asset": record.background_asset,
                        "expected_sha256": record.background_asset_sha256,
                        "actual_sha256": digest,
                    },
                )
            )

    geometry = _probe_artwork_geometry(path)
    if geometry is None:
        issues.append(
            _issue(
                "template_background_missing",
                record.id,
                f"Background artwork of '{record.id}' could not be read as an image",
                details={"template_id": record.id, "background_asset": record.background_asset, "path": str(path)},
            )
        )
        return issues
    width_value = geometry.width
    height_value = geometry.height
    aspect = width_value / height_value if height_value else 0.0
    # The artwork is drawn with `object-fit: cover`, so the overflowing axis is cropped and
    # the sparser axis decides the printed resolution -- the same rule as `quality.py`.
    if geometry.kind == "raster":
        dpi_x = width_value / (record.page_width_mm / 25.4)
        dpi_y = height_value / (record.page_height_mm / 25.4)
        effective_dpi = min(dpi_x, dpi_y)
        dpi_details: dict[str, Any] = {
            "template_id": record.id,
            "background_asset": record.background_asset,
            "width_px": int(width_value),
            "height_px": int(height_value),
            "effective_dpi": round(effective_dpi, 2),
            "minimum_dpi": product.minimum_dpi,
            "warning_dpi": product.warning_dpi,
        }
        if effective_dpi < product.minimum_dpi:
            issues.append(
                _issue(
                    "template_background_dpi_too_low",
                    record.id,
                    f"Background artwork of '{record.id}' is below the product minimum of {product.minimum_dpi} dpi",
                    details=dpi_details,
                )
            )
        elif effective_dpi < product.warning_dpi:
            issues.append(
                _issue(
                    "template_background_dpi_warning",
                    record.id,
                    f"Background artwork of '{record.id}' is below the recommended {product.warning_dpi} dpi",
                    blocking=False,
                    details=dpi_details,
                )
            )

    expected_aspect = record.page_width_mm / record.page_height_mm
    deviation = abs(aspect / expected_aspect - 1) if expected_aspect else 0.0
    if deviation > _ASPECT_WARNING_RATIO:
        issues.append(
            _issue(
                "template_background_aspect_mismatch",
                record.id,
                f"Background artwork of '{record.id}' does not match the page aspect ratio",
                blocking=deviation > _ASPECT_ERROR_RATIO,
                details={
                    "template_id": record.id,
                    "background_asset": record.background_asset,
                    "expected_aspect": round(expected_aspect, 4),
                    "actual_aspect": round(aspect, 4),
                    "deviation": round(deviation, 4),
                },
            )
        )

    return issues


def _reference_diagnostics(record: TemplateDefinition, assets_dir: Path) -> list[RegistryIssue]:
    if record.reference_asset is None or record.background_asset is None:
        return []

    reference_path = assets_dir / record.reference_asset
    background_path = assets_dir / record.background_asset
    if not reference_path.is_file() or not background_path.is_file():
        return []

    reference_geometry = _probe_artwork_geometry(reference_path)
    background_geometry = _probe_artwork_geometry(background_path)
    if reference_geometry is None or background_geometry is None:
        return []
    if geometry_compatible(reference_geometry, background_geometry):
        return []
    return [
        _issue(
            "template_reference_background_mismatch",
            record.id,
            f"Reference artwork of '{record.id}' must match its production background dimensions and orientation",
            details={
                "template_id": record.id,
                "reference_asset": record.reference_asset,
                "background_asset": record.background_asset,
                "reference_width": round(reference_geometry.width, 2),
                "reference_height": round(reference_geometry.height, 2),
                "reference_orientation": reference_geometry.orientation,
                "background_width": round(background_geometry.width, 2),
                "background_height": round(background_geometry.height, 2),
                "background_orientation": background_geometry.orientation,
            },
        )
    ]


def load_registry_bundle(registries_dir: Path, assets_dir: Path | None = None) -> RegistryBundle:
    """Load and cross-check the registry files.

    `assets_dir` is optional so the loader stays usable without artwork on disk (most tests
    build registries in a tmp dir). Pass it to have declared background artwork verified;
    without it, artwork checks are skipped rather than guessed.
    """
    use_cases, diagnostics = _load_use_cases(registries_dir / "use_cases")
    products, product_issues = _load_products(registries_dir / "products")
    templates, template_issues = _load_templates(registries_dir / "templates")
    diagnostics.extend(product_issues)
    diagnostics.extend(template_issues)

    active_use_cases: list[UseCaseDefinition] = []
    seen_use_cases: set[str] = set()
    for record in use_cases:
        if not record.active:
            continue
        if record.id in seen_use_cases:
            diagnostics.append(_issue("duplicate_use_case_id", record.id, f"Duplicate use case id '{record.id}'"))
            continue
        seen_use_cases.add(record.id)
        active_use_cases.append(record)

    active_products: list[ProductDefinition] = []
    seen_products: set[str] = set()
    for record in cast(list[Any], products):
        if not record.active:
            continue
        if record.id in seen_products:
            diagnostics.append(_issue("duplicate_product_id", record.id, f"Duplicate product id '{record.id}'"))
            continue
        seen_products.add(record.id)
        active_products.append(record)

    product_by_id = {record.id: record for record in active_products}
    use_case_by_id = {record.id: record for record in active_use_cases}

    active_templates: list[TemplateDefinition] = []
    seen_templates: set[tuple[str, str]] = set()
    for record in cast(list[Any], templates):
        if not record.active:
            continue
        key = (record.id, record.version)
        if key in seen_templates:
            diagnostics.append(
                _issue(
                    "duplicate_template_version",
                    record.id,
                    f"Duplicate template id/version '{record.id}' '{record.version}'",
                    details={"template_id": record.id, "version": record.version},
                )
            )
            continue
        if record.product_id not in product_by_id:
            diagnostics.append(
                _issue(
                    "template_unknown_product",
                    record.id,
                    f"Template '{record.id}' references unknown product '{record.product_id}'",
                    details={"template_id": record.id, "product_id": record.product_id},
                )
            )
            continue
        missing_use_cases = [use_case_id for use_case_id in record.use_case_ids if use_case_id not in use_case_by_id]
        if missing_use_cases:
            diagnostics.append(
                _issue(
                    "template_unknown_use_case",
                    record.id,
                    f"Template '{record.id}' references unknown use case ids {missing_use_cases}",
                    details={"template_id": record.id, "missing_use_case_ids": missing_use_cases},
                )
            )
            continue

        product = product_by_id[record.product_id]
        expected_width = product.trim_width_mm + 2 * product.bleed_mm
        expected_height = product.trim_height_mm + 2 * product.bleed_mm
        if abs(record.page_width_mm - expected_width) > 0.05 or abs(record.page_height_mm - expected_height) > 0.05:
            diagnostics.append(
                _issue(
                    "template_page_mismatch",
                    record.id,
                    f"Template '{record.id}' page size must match product trim plus bleed",
                    details={
                        "template_id": record.id,
                        "expected_width_mm": expected_width,
                        "expected_height_mm": expected_height,
                        "actual_width_mm": record.page_width_mm,
                        "actual_height_mm": record.page_height_mm,
                    },
                )
            )
            continue

        if assets_dir is not None:
            background_issues = _background_diagnostics(record, product, assets_dir)
            diagnostics.extend(background_issues)
            if any(issue.blocking for issue in background_issues):
                # A card whose artwork is missing or too soft must not be orderable.
                continue
            reference_issues = _reference_diagnostics(record, assets_dir)
            diagnostics.extend(reference_issues)
            if any(issue.blocking for issue in reference_issues):
                continue

        seen_templates.add(key)
        active_templates.append(record)

    return RegistryBundle(
        use_cases=active_use_cases,
        products=active_products,
        templates=active_templates,
        diagnostics=diagnostics,
    )
