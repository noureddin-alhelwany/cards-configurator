import type { RegistryBundle } from './types';

export async function loadRegistries(): Promise<RegistryBundle> {
  const response = await fetch('/api/registries');
  if (!response.ok) {
    throw new Error(`Failed to load registries: ${response.status}`);
  }
  return (await response.json()) as RegistryBundle;
}
