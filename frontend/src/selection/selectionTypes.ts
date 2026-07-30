import type { ElementAdjustment } from '../design/types';

export type DraftLayoutValues = {
  text_values: Record<string, string>;
  asset_values: Record<string, string>;
  element_adjustments: Record<string, ElementAdjustment>;
};
