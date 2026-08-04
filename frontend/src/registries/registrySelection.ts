import type { RegistryBundle, TemplateDefinition, TemplateVariantDefinition, ProductDefinition, CategoryDefinition } from './types';

export function activeRegistryTemplates(bundle: RegistryBundle | null) {
  return bundle?.templates.filter((template) => template.active) ?? [];
}

export function activeRegistryProduct(bundle: RegistryBundle | null, productId: string | null): ProductDefinition | null {
  if (!bundle || !productId) {
    return null;
  }
  return bundle.products.find((product) => product.active && product.id === productId) ?? null;
}

export function activeRegistryCategory(
  bundle: RegistryBundle | null,
  product: ProductDefinition | null,
): CategoryDefinition | null {
  if (!bundle || !product) {
    return null;
  }
  return (
    bundle.categories.find((category) => category.active && (product.category_ids?.includes(category.id) ?? false)) ?? null
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
