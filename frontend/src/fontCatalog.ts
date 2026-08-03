import type { FontDefinition } from './design/types';

export type FontCatalogEntry = {
  id: string;
  family: string;
  type: string | null;
  category: string | null;
  variable: boolean;
  subsets: string[];
};

export async function loadFontCatalog(): Promise<FontCatalogEntry[]> {
  const response = await fetch('/api/font-catalog');
  if (!response.ok) {
    throw new Error(`Failed to load font catalog: ${response.status}`);
  }
  return (await response.json()) as FontCatalogEntry[];
}

export async function loadFontFace(fontId: string): Promise<FontDefinition> {
  const response = await fetch(`/api/font-catalog/${encodeURIComponent(fontId)}`);
  if (!response.ok) {
    throw new Error(`Failed to load font face '${fontId}': ${response.status}`);
  }
  return (await response.json()) as FontDefinition;
}
