import type { ImageElementDefinition, TemplateDefinition } from '../registries/types';
import type { ElementAdjustment } from '../design/types';

export type AssetMetadata = {
  width_px: number | null;
  height_px: number | null;
  mime_type: string;
  preview_data_url: string;
  original_filename?: string | null;
};

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function assetElementForField(template: TemplateDefinition, fieldId: string): ImageElementDefinition | null {
  return (
    template.elements.find(
      (element): element is ImageElementDefinition => element.kind === 'image' && element.asset_key === fieldId,
    ) ?? null
  );
}

export function defaultAdjustmentsForTemplate(template: TemplateDefinition) {
  return Object.fromEntries(
    template.elements
      .filter((element): element is ImageElementDefinition => element.kind === 'image')
      .map((element) => [
        element.id,
        {
          offset_x: 0,
          offset_y: 0,
          scale: 1,
        } satisfies ElementAdjustment,
      ]),
  ) as Record<string, ElementAdjustment>;
}
