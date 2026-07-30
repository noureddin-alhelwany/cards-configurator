import type { LayoutState } from '../design/types';

export type DraftState = {
  id: number;
  name: string;
  use_case_id: string | null;
  product_id: string | null;
  template_id: string | null;
  template_version: string | null;
  variant_id: string | null;
  layout_state: LayoutState;
};

export type TemplateSelectionRequest = {
  use_case_id: string;
  product_id: string;
  template_id: string;
  template_version: string;
  variant_id?: string | null;
};
