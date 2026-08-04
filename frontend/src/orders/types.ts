export type OrderAssetState = {
  order_id: string;
  asset_id: string;
  semantic_role: string;
};

export type OrderSummary = {
  id: string;
  order_number: string;
  display_name: string | null;
  category_id: string;
  product_id: string;
  template_id: string;
  template_version: string;
  design_id: string | null;
  approved_at: string;
  created_at: string;
  preview_path: string | null;
};

export type OrderDetail = OrderSummary & {
  category_snapshot: Record<string, unknown>;
  product_snapshot: Record<string, unknown>;
  template_snapshot: Record<string, unknown>;
  layout_snapshot: Record<string, unknown>;
  validation_snapshot: Record<string, unknown>;
  mockup_path: string | null;
  pdf_path: string | null;
  render_engine_version: string;
  assets: OrderAssetState[];
};
