import type { LayoutState } from '../design/types';

export type DraftState = {
  id: number;
  name: string;
  category_id: string | null;
  product_id: string | null;
  template_id: string | null;
  template_version: string | null;
  design_id: string | null;
  approved_at?: string | null;
  approval_snapshot?: Record<string, unknown> | null;
  approval_checklist?: Record<string, boolean> | null;
  layout_state: LayoutState;
};

export type TemplateSelectionRequest = {
  category_id: string;
  product_id: string;
  template_id: string;
  template_version: string;
  design_id?: string | null;
};
