import type { LayoutState, TemplateDefinition, TemplateDesignDefinition } from './types';

export function defaultTemplateDesignId(template: TemplateDefinition): string | null {
  return (template.designs ?? template.designs ?? []).find((variant) => variant.active)?.id ?? null;
}

export function activeTemplateVariant(
  template: TemplateDefinition,
  variantId: string | null | undefined,
): TemplateDesignDefinition | null {
  return (
    (template.designs ?? template.designs ?? []).find((variant) => variant.active && variant.id === variantId) ??
    (template.designs ?? template.designs ?? []).find((variant) => variant.active) ??
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

export function resolveTemplateSourceAsset(
  template: TemplateDefinition,
  layoutState: LayoutState,
): string | null {
  const variant = activeTemplateVariant(template, layoutState.variant_id);
  return variant?.source_asset ?? variant?.background_asset ?? template.source_asset ?? template.background_asset;
}
