import type { LayoutState, TemplateDefinition, TemplateDesignDefinition } from './types';

export function defaultTemplateDesignId(template: TemplateDefinition): string | null {
  return (template.designs ?? []).find((design) => design.active)?.id ?? null;
}

export function activeTemplateVariant(
  template: TemplateDefinition,
  designId: string | null | undefined,
): TemplateDesignDefinition | null {
  return (template.designs ?? []).find((design) => design.active && design.id === designId) ?? (template.designs ?? []).find((design) => design.active) ?? null;
}

function resolveTemplateArtworkAsset(
  template: TemplateDefinition,
  layoutState: LayoutState,
): string | null {
  const variant = activeTemplateVariant(template, layoutState.design_id);
  return variant?.source_asset ?? null;
}

export function resolveTemplateBackgroundAsset(
  template: TemplateDefinition,
  layoutState: LayoutState,
): string | null {
  return resolveTemplateArtworkAsset(template, layoutState);
}

export function resolveTemplateSourceAsset(
  template: TemplateDefinition,
  layoutState: LayoutState,
): string | null {
  return resolveTemplateArtworkAsset(template, layoutState);
}
