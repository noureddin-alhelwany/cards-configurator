from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

import segno

from .loader import RegistryBundle
from .schemas import AssetDataUrl, ElementAdjustment, LayoutState, ProofFixture


def _data_url(mime_type: str, raw: bytes) -> AssetDataUrl:
    encoded = base64.b64encode(raw).decode("ascii")
    return AssetDataUrl(mime_type=mime_type, data_url=f"data:{mime_type};base64,{encoded}")


def build_proof_fixture(bundle: RegistryBundle, proof_assets_dir: Path) -> ProofFixture:
    template = next(template for template in bundle.templates if template.id == "proof_a6_card" and template.version == "1.0.0")
    product = next(product for product in bundle.products if product.id == template.product_id)
    use_case = next(use_case for use_case in bundle.use_cases if use_case.id in template.use_case_ids)

    logo_path = proof_assets_dir / "logo.png"
    logo_bytes = logo_path.read_bytes()
    hero_image_asset = {
        "google_reviews": "review.png",
        "appointment_booking": "booking.png",
    }.get(use_case.id, "review.png")
    hero_image_path = proof_assets_dir / hero_image_asset
    hero_image_bytes = hero_image_path.read_bytes()
    qr = segno.make(use_case.description, error="m")
    qr_buffer = BytesIO()
    qr.save(qr_buffer, kind="svg")
    qr_bytes = qr_buffer.getvalue()

    return ProofFixture(
        template=template,
        product=product,
        use_case=use_case,
        layout_state=LayoutState(
            variant_id="logo-focused",
            element_adjustments={
                "proof-logo": ElementAdjustment(offset_x=0.12, offset_y=-0.08, scale=1.02),
            },
        ),
        assets={
            "logo": _data_url("image/png", logo_bytes),
            "heroImage": _data_url("image/png", hero_image_bytes),
            "qr": _data_url("image/svg+xml", qr_bytes),
        },
    )
