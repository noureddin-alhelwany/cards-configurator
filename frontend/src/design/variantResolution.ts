import type { LayoutState, TemplateDefinition, TemplateVariantDefinition } from './types';

export function activeTemplateVariant(
  template: TemplateDefinition,
  variantId: string | null | undefined,
): TemplateVariantDefinition | null {
  return (
    template.variants.find((variant) => variant.active && variant.id === variantId) ??
    template.variants.find((variant) => variant.active) ??
    null
  );
}

export function resolveTemplateBackgroundAsset(
  template: TemplateDefinition,
  layoutState: LayoutState,
): string | null {
  const variant = activeTemplateVariant(template, layoutState.variant_id);
  return variant?.background_asset ?? template.background_asset;
}

