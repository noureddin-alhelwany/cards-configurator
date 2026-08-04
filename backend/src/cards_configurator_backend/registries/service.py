from __future__ import annotations

import base64
from pathlib import Path

from ..urls import QR_DARK_DEFAULT, build_qr_svg, resolve_qr_value
from .loader import RegistryBundle
from .schemas import AssetDataUrl, ElementAdjustment, LayoutState, ProofFixture


def _data_url(mime_type: str, raw: bytes) -> AssetDataUrl:
    encoded = base64.b64encode(raw).decode("ascii")
    return AssetDataUrl(mime_type=mime_type, data_url=f"data:{mime_type};base64,{encoded}")


def build_proof_fixture(bundle: RegistryBundle, proof_assets_dir: Path) -> ProofFixture:
    template = next(template for template in bundle.templates if template.id == "proof_a6_card" and template.version == "1.6.0")
    product = next(product for product in bundle.products if product.id == template.product_id)
    category = next(
        category
        for category in bundle.categories
        if category.active and category.id in product.category_ids
    )

    logo_path = proof_assets_dir / "logo.png"
    logo_bytes = logo_path.read_bytes()

    layout_state = LayoutState(
        design_id="",
        element_adjustments={
            "proof-logo": ElementAdjustment(offset_x=0.12, offset_y=-0.08, scale=1.02),
        },
    )

    # Goes through the shared resolver so the proof renders the same QR the production path
    # would. It used to encode `category.description` -- a sentence, not a URL, which also
    # bypassed URL normalisation.
    qr_element = next((element for element in template.elements if element.kind == "qr"), None)
    qr_bytes = build_qr_svg(
        resolve_qr_value(template, layout_state),
        dark=qr_element.color if qr_element is not None else QR_DARK_DEFAULT,
        error_correction=qr_element.error_correction if qr_element is not None else "m",
    )

    return ProofFixture(
        template=template,
        product=product,
        category=category,
        layout_state=layout_state,
        assets={
            "logo": _data_url("image/png", logo_bytes),
            "qr": _data_url("image/svg+xml", qr_bytes),
        },
    )
