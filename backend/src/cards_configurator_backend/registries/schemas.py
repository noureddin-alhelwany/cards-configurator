from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class RegistryIssue(BaseModel):
    code: str
    severity: Literal["info", "warning", "error"]
    path: str
    message: str
    blocking: bool
    details: dict[str, Any] = Field(default_factory=dict)


class AssetDataUrl(BaseModel):
    mime_type: str
    data_url: str


class UseCaseDefinition(BaseModel):
    id: str
    name: str
    description: str
    preview_asset: str
    active: bool = True


class ProductDefinition(BaseModel):
    id: str
    name: str
    description: str | None = None
    trim_width_mm: float
    trim_height_mm: float
    bleed_mm: float
    recommended_dpi: int
    warning_dpi: int
    minimum_dpi: int
    qr_min_width_mm: float
    qr_min_module_mm: float
    preview_asset: str
    active: bool = True

    @model_validator(mode="after")
    def validate_dpi_thresholds(self) -> ProductDefinition:
        if not (self.minimum_dpi <= self.warning_dpi <= self.recommended_dpi):
            raise ValueError("dpi thresholds must be ordered minimum <= warning <= recommended")
        return self


class BoxMm(BaseModel):
    x_mm: float
    y_mm: float
    width_mm: float
    height_mm: float


class FontDefinition(BaseModel):
    family: str
    file: str
    weight: int = 400
    style: Literal["normal", "italic"] = "normal"


class ElementAdjustment(BaseModel):
    offset_x: float = 0.0
    offset_y: float = 0.0
    scale: float = 1.0


class LayoutState(BaseModel):
    variant_id: str
    element_adjustments: dict[str, ElementAdjustment] = Field(default_factory=dict)
    text_values: dict[str, str] = Field(default_factory=dict)
    asset_values: dict[str, str] = Field(default_factory=dict)


class ElementBase(BaseModel):
    id: str
    box_mm: BoxMm
    z_index: int = 0


class TextElementDefinition(ElementBase):
    kind: Literal["text"]
    text: str
    font_family: str
    font_size_mm: float
    font_weight: int = 700
    color: str = "#1f1a17"
    line_height: float = 1.1
    align: Literal["left", "center", "right"] = "left"


class ImageElementDefinition(ElementBase):
    kind: Literal["image"]
    asset_key: str
    alt: str
    fit: Literal["contain", "cover"] = "contain"
    movement_mm: BoxMm | None = None
    enhancement: Literal["none", "contrast", "sharpen"] = "none"
    min_scale: float = 0.7
    max_scale: float = 1.5


class QrElementDefinition(ElementBase):
    kind: Literal["qr"]
    value: str
    color: str = "#1f1a17"
    background: str = "transparent"
    quiet_zone_mm: float = 2.0


RenderableElementDefinition = Annotated[
    TextElementDefinition | ImageElementDefinition | QrElementDefinition,
    Field(discriminator="kind"),
]


class TemplateVariantDefinition(BaseModel):
    id: str
    name: str
    active: bool = True
    preview_asset: str | None = None


class TemplateFieldDefinition(BaseModel):
    id: str
    type: Literal["text", "logo", "url", "image", "qr", "shape", "static_asset"]
    required: bool
    max_length: int | None = None
    max_lines: int | None = None
    label: str | None = None
    help_text: str | None = None
    group: str | None = None
    placeholder: str | None = None
    suggestions: list[str] = Field(default_factory=list)
    default_value: str | None = None


class TemplateDefinition(BaseModel):
    schema_version: int
    id: str
    version: str
    name: str | None = None
    product_id: str
    use_case_ids: list[str]
    active: bool = True
    description: str | None = None
    page_width_mm: float
    page_height_mm: float
    bleed_mm: float
    preview_asset: str | None = None
    font_family: str
    fields: list[TemplateFieldDefinition] = Field(default_factory=list)
    fonts: list[FontDefinition]
    elements: list[RenderableElementDefinition]
    variants: list[TemplateVariantDefinition] = Field(default_factory=list)

    @field_validator("use_case_ids")
    @classmethod
    def validate_use_case_ids(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("templates must reference at least one use case")
        return value

    @model_validator(mode="after")
    def validate_page_geometry(self) -> TemplateDefinition:
        if self.page_width_mm <= 0 or self.page_height_mm <= 0:
            raise ValueError("page dimensions must be positive")
        if self.bleed_mm < 0:
            raise ValueError("bleed must be non-negative")
        return self


class ProofFixture(BaseModel):
    template: TemplateDefinition
    product: ProductDefinition
    use_case: UseCaseDefinition
    layout_state: LayoutState
    assets: dict[str, AssetDataUrl]


class RegistryBundle(BaseModel):
    use_cases: list[UseCaseDefinition]
    products: list[ProductDefinition]
    templates: list[TemplateDefinition]
    diagnostics: list[RegistryIssue] = Field(default_factory=list)
