import type { RegistryBundle, TemplateDesignDefinition } from './types';

type RegistryTemplate = RegistryBundle['templates'][number] & {
  designs?: TemplateDesignDefinition[];
  variants?: TemplateDesignDefinition[];
};

export async function loadRegistries(): Promise<RegistryBundle> {
  const response = await fetch('/api/registries');
  if (!response.ok) {
    throw new Error(`Failed to load registries: ${response.status}`);
  }
  const bundle = (await response.json()) as RegistryBundle & { templates: RegistryTemplate[] };
  return {
    ...bundle,
    templates: bundle.templates.map((template) => ({
      ...template,
      designs: template.designs ?? template.variants ?? [],
    })),
  };
}
