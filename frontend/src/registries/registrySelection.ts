import type { RegistryBundle, TemplateDefinition, TemplateVariantDefinition, ProductDefinition, UseCaseDefinition } from './types';

export function activeRegistryTemplates(bundle: RegistryBundle | null) {
  return bundle?.templates.filter((template) => template.active) ?? [];
}

export function activeRegistryProduct(bundle: RegistryBundle | null, productId: string | null): ProductDefinition | null {
  if (!bundle || !productId) {
    return null;
  }
  return bundle.products.find((product) => product.active && product.id === productId) ?? null;
}

export function activeRegistryUseCase(
  bundle: RegistryBundle | null,
  template: TemplateDefinition | null,
): UseCaseDefinition | null {
  if (!bundle || !template) {
    return null;
  }
  return (
    bundle.use_cases.find((useCase) => useCase.active && template.use_case_ids.includes(useCase.id)) ?? null
  );
}

export function activeRegistryVariants(template: TemplateDefinition | null) {
  return template?.variants.filter((variant) => variant.active) ?? [];
}

export function activeRegistryVariant(
  template: TemplateDefinition | null,
  variantId: string | null,
): TemplateVariantDefinition | null {
  if (!template) {
    return null;
  }
  return (
    template.variants.find((variant) => variant.active && variant.id === variantId) ??
    template.variants.find((variant) => variant.active) ??
    null
  );
}
