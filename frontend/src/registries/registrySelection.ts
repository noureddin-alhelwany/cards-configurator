import type { RegistryBundle, TemplateDefinition, TemplateDesignDefinition, ProductDefinition, CategoryDefinition } from './types';

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

export function activeRegistryDesigns(template: TemplateDefinition | null) {
  const designs = template?.designs ?? [];
  return designs.filter((design) => design.active);
}

export function activeRegistryDesign(
  template: TemplateDefinition | null,
  variantId: string | null,
): TemplateDesignDefinition | null {
  if (!template) {
    return null;
  }
  const designs = template.designs ?? [];
  return (
    designs.find((design) => design.active && design.id === variantId) ??
    designs.find((design) => design.active) ??
    null
  );
}
