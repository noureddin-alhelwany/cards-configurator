export type BoxMm = {
  x_mm: number;
  y_mm: number;
  width_mm: number;
  height_mm: number;
};

export type ElementAdjustment = {
  offset_x: number;
  offset_y: number;
  scale: number;
};

export type LayoutState = {
  variant_id: string;
  element_adjustments: Record<string, ElementAdjustment>;
  text_values: Record<string, string>;
  asset_values: Record<string, string>;
};

export type FontDefinition = {
  family: string;
  file: string;
  weight: number;
  style: 'normal' | 'italic';
};

export type TextElementDefinition = {
  kind: 'text';
  id: string;
  box_mm: BoxMm;
  z_index: number;
  text: string;
  font_family: string;
  font_size_mm: number;
  font_weight: number;
  color: string;
  line_height: number;
  align: 'left' | 'center' | 'right';
  /** Vertical anchor in the box; `top` is drawn without a wrapper. */
  valign: 'top' | 'middle' | 'bottom';
  /** Absolute shrink floor in mm; `null` keeps the relative DEFAULT_MIN_FIT_SCALE. */
  min_font_size_mm: number | null;
};

export type ImageElementDefinition = {
  kind: 'image';
  id: string;
  box_mm: BoxMm;
  z_index: number;
  asset_key: string;
  alt: string;
  fit: 'contain' | 'cover';
  movement_mm: BoxMm | null;
  enhancement: 'none' | 'contrast' | 'sharpen';
  min_scale: number;
  max_scale: number;
};

export type ValidationIssue = {
  code: string;
  severity: 'info' | 'warning' | 'error';
  path: string;
  message: string;
  blocking: boolean;
  details: Record<string, unknown>;
};

export type QrElementDefinition = {
  kind: 'qr';
  id: string;
  box_mm: BoxMm;
  z_index: number;
  value: string;
  color: string;
  background: string;
  quiet_zone_mm: number;
};

export type TemplateElementDefinition =
  | TextElementDefinition
  | ImageElementDefinition
  | QrElementDefinition;

export type TemplateVariantDefinition = {
  id: string;
  name: string;
  active: boolean;
  preview_asset: string | null;
};

export type TemplateDefinition = {
  schema_version: number;
  id: string;
  version: string;
  name: string | null;
  description: string | null;
  product_id: string;
  use_case_ids: string[];
  active: boolean;
  fields: TemplateFieldDefinition[];
  page_width_mm: number;
  page_height_mm: number;
  bleed_mm: number;
  preview_asset: string | null;
  /** Full-bleed artwork drawn under every element, served from `/proof-assets/`. */
  background_asset: string | null;
  background_asset_sha256: string | null;
  font_family: string;
  fonts: FontDefinition[];
  elements: TemplateElementDefinition[];
  variants: TemplateVariantDefinition[];
};

export type TemplateFieldDefinition = {
  id: string;
  type: 'text' | 'logo' | 'url' | 'image' | 'qr' | 'shape' | 'static_asset';
  required: boolean;
  max_length: number | null;
  max_lines: number | null;
  label: string | null;
  help_text: string | null;
  group: string | null;
  placeholder: string | null;
  suggestions: string[];
  default_value: string | null;
};

export type AssetDataUrl = {
  mime_type: string;
  data_url: string;
};

export type UseCaseDefinition = {
  id: string;
  name: string;
  description: string;
  preview_asset: string;
  active: boolean;
};

export type ProductDefinition = {
  id: string;
  name: string;
  description: string | null;
  trim_width_mm: number;
  trim_height_mm: number;
  bleed_mm: number;
  recommended_dpi: number;
  warning_dpi: number;
  minimum_dpi: number;
  qr_min_width_mm: number;
  qr_min_module_mm: number;
  preview_asset: string;
  active: boolean;
};

export type ProofFixture = {
  template: TemplateDefinition;
  product: ProductDefinition;
  use_case: UseCaseDefinition;
  layout_state: LayoutState;
  assets: Record<string, AssetDataUrl>;
};
