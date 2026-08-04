import type { RegistryBundle } from './types';

export async function loadRegistries(): Promise<RegistryBundle> {
  const response = await fetch('/api/registries');
  if (!response.ok) {
    throw new Error(`Failed to load registries: ${response.status}`);
  }
  const bundle = (await response.json()) as RegistryBundle;
  return {
    ...bundle,
    templates: bundle.templates.map((template) => ({
      ...template,
      designs: template.designs ?? [],
    })),
  };
}
