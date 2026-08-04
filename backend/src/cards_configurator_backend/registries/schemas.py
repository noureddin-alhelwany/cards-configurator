from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


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


class CategoryDefinition(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    id: str
    name: str
    description: str
    preview_asset: str
    active: bool = True


class ProductDefinition(BaseModel):
    id: str
    name: str
    description: str | None = None
    category_ids: list[str] = Field(default_factory=list)
    preview_asset: str
    active: bool = True

    @field_validator("category_ids")
    @classmethod
    def validate_category_ids(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("products must reference at least one category")
        return value


class BoxMm(BaseModel):
    x_mm: float
    y_mm: float
    width_mm: float
    height_mm: float


class FontDefinition(BaseModel):
    id: str | None = None
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
    font_family_id: str | None = None
    font_size_mm: float
    font_weight: int = 700
    color: str = "#1f1a17"
    line_height: float = 1.1
    align: Literal["left", "center", "right"] = "left"
    # Vertical anchor inside the box. Without it auto-fit is visibly wrong: a two-line
    # headline that shrinks to one line stays glued to the top of its box and drifts away
    # from artwork that is optically centred. Default "top" is today's behaviour, so the
    # renderer emits no wrapper for it and existing templates stay pixel-identical.
    valign: Literal["top", "middle", "bottom"] = "top"
    # Absolute shrink floor. `None` keeps the relative DEFAULT_MIN_FIT_SCALE, i.e. today's
    # behaviour. Optional so every existing order snapshot still validates.
    min_font_size_mm: float | None = None


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
    # The quiet zone must be light to work as one. Defaulting to transparent would leave a
    # QR unscannable on any coloured artwork, so a template has to opt into that explicitly.
    background: str = "#ffffff"
    error_correction: Literal["m", "q", "h"] = "m"
    quiet_zone_mm: float = 2.0

    @model_validator(mode="after")
    def validate_square_box(self) -> QrElementDefinition:
        # A non-square box stretches the symbol into unscannability. `object-fit: contain`
        # currently saves us by accident; this makes the requirement explicit.
        if abs(self.box_mm.width_mm - self.box_mm.height_mm) > 0.01:
            raise ValueError("qr elements need a square box_mm; a stretched symbol does not scan")
        return self


RenderableElementDefinition = Annotated[
    TextElementDefinition | ImageElementDefinition | QrElementDefinition,
    Field(discriminator="kind"),
]


class SafeAreaVariableDefinition(BaseModel):
    id: str
    kind: Literal["text", "qr"]
    field_id: str | None = None
    label: str
    font_family_id: str | None = None
    font_weight: int = 400
    font_size_mm: float = 4.0
    min_font_size_mm: float | None = None
    line_height: float = 1.1
    color: str = "#1f1a17"
    align: Literal["left", "center", "right"] = "left"
    max_length: int | None = None
    max_lines: int | None = None
    required: bool = False
    default_value: str | None = None


class SafeAreaDefinition(BaseModel):
    id: str
    box_mm: BoxMm
    label: str | None = None
    kind: Literal["text", "qr"] = "text"
    personalizable: bool = False
    qr: QrZoneDefinition | None = None
    variables: list[SafeAreaVariableDefinition] = Field(default_factory=list)


class QrZoneDefinition(BaseModel):
    error_correction: Literal["m", "q", "h"] = "m"
    color: str = "#1f1a17"
    background: str = "#ffffff"
    quiet_zone_mm: float = 2.0


SafeAreaDefinition.model_rebuild()


class TextRuleDefinition(BaseModel):
    version: int
    field_id: str
    max_lines: int | None = None
    min_font_size_mm: float | None = None


class QrRuleDefinition(BaseModel):
    version: int
    field_id: str
    preset: Literal["standard", "rounded-safe"] = "standard"
    minimum_width_mm: float | None = None
    minimum_quiet_zone_modules: float | None = None


class TemplateDesignDefinition(BaseModel):
    id: str
    name: str
    active: bool = True
    preview_asset: str | None = None
    source_asset: str | None = None
    background_asset: str | None = None
    accent_color: str | None = None

    @model_validator(mode="after")
    def sync_source_asset(self) -> TemplateDesignDefinition:
        if self.source_asset is None and self.background_asset is not None:
            self.source_asset = self.background_asset
        if self.background_asset is None and self.source_asset is not None:
            self.background_asset = self.source_asset
        return self


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
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    schema_version: int
    id: str
    version: str
    name: str | None = None
    product_id: str
    active: bool = True
    description: str | None = None
    page_width_mm: float
    page_height_mm: float
    bleed_mm: float
    reference_asset: str | None = None
    preview_asset: str | None = None
    source_asset: str | None = None
    # Full-bleed artwork under every element. Deliberately not an element: without a box in
    # the JSON its geometry cannot drift from `page_*_mm`, and no `kind` switch grows a case.
    # Optional with a default, because order snapshots are re-validated against this model
    # (`docs/DOMAIN_MODEL.md`) -- a required field would break every existing order.
    background_asset: str | None = None
    # Tripwire, not a lock: a replaced file would retroactively change a year-old order, so
    # the loader digests the artwork at startup and warns when it no longer matches.
    background_asset_sha256: str | None = None
    fields: list[TemplateFieldDefinition] = Field(default_factory=list)
    safe_areas: list[SafeAreaDefinition] = Field(default_factory=list)
    text_rules: list[TextRuleDefinition] = Field(default_factory=list)
    qr_rules: list[QrRuleDefinition] = Field(default_factory=list)
    fonts: list[FontDefinition]
    elements: list[RenderableElementDefinition]
    designs: list[TemplateDesignDefinition] = Field(default_factory=list)

    @model_validator(mode="after")
    def normalize_font_ids(self) -> TemplateDefinition:
        font_ids = {font.id or font.family for font in self.fonts}

        for safe_area in self.safe_areas:
            for variable in safe_area.variables:
                if variable.kind != "text":
                    continue
                if not font_ids:
                    raise ValueError(
                        f"safe area variable '{variable.id}' requires a registered font but template '{self.id}' defines none"
                    )
                if variable.font_family_id is None:
                    raise ValueError(f"safe area variable '{variable.id}' needs a font_family_id")
                if variable.font_family_id not in font_ids:
                    raise ValueError(
                        f"safe area variable '{variable.id}' uses unknown font '{variable.font_family_id}'"
                    )
        for element in self.elements:
            if element.kind != "text":
                continue
            if not font_ids:
                raise ValueError(
                    f"text element '{element.id}' requires a registered font but template '{self.id}' defines none"
                )
            if element.font_family_id is None:
                raise ValueError(f"text element '{element.id}' needs a font_family_id")
            if element.font_family_id not in font_ids:
                raise ValueError(f"text element '{element.id}' uses unknown font '{element.font_family_id}'")
        return self

    @model_validator(mode="after")
    def validate_page_geometry(self) -> TemplateDefinition:
        if self.page_width_mm <= 0 or self.page_height_mm <= 0:
            raise ValueError("page dimensions must be positive")
        if self.bleed_mm < 0:
            raise ValueError("bleed must be non-negative")
        return self

    @model_validator(mode="after")
    def sync_source_asset(self) -> TemplateDefinition:
        if self.source_asset is None and self.background_asset is not None:
            self.source_asset = self.background_asset
        if self.background_asset is None and self.source_asset is not None:
            self.background_asset = self.source_asset
        return self


class ProofFixture(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    template: TemplateDefinition
    product: ProductDefinition
    category: CategoryDefinition
    layout_state: LayoutState
    assets: dict[str, AssetDataUrl]


class RegistryBundle(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    categories: list[CategoryDefinition]
    products: list[ProductDefinition]
    templates: list[TemplateDefinition]
    diagnostics: list[RegistryIssue] = Field(default_factory=list)
