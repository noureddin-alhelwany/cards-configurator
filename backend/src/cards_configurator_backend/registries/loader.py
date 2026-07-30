from __future__ import annotations

import json
from pathlib import Path
from typing import Any, cast

from pydantic import ValidationError

from .schemas import (
    ProductDefinition,
    RegistryBundle,
    RegistryIssue,
    TemplateDefinition,
    UseCaseDefinition,
)


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


def load_registry_bundle(registries_dir: Path) -> RegistryBundle:
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

        seen_templates.add(key)
        active_templates.append(record)

    return RegistryBundle(
        use_cases=active_use_cases,
        products=active_products,
        templates=active_templates,
        diagnostics=diagnostics,
    )
