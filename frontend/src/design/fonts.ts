import type { FontDefinition, TemplateDefinition } from './types';

const loadedFontKeys = new Set<string>();

function fontKey(font: FontDefinition) {
  return [font.id ?? font.family, font.family, font.file, font.weight, font.style].join(':');
}

export function resolveEffectiveFontFamilyId(
  zoneFontFamilyId: string | null | undefined,
  globalFontFamilyId: string | null | undefined,
) {
  return zoneFontFamilyId ?? globalFontFamilyId ?? null;
}

export function fontDefinitionForId(template: TemplateDefinition, fontFamilyId: string | null | undefined) {
  if (!fontFamilyId) {
    return null;
  }
  return template.fonts.find((font) => (font.id ?? font.family) === fontFamilyId) ?? null;
}

export function resolveFontFamilyName(
  template: TemplateDefinition,
  fontFamilyId: string | null | undefined,
  fallbackFamily: string | null | undefined = null,
) {
  const definition = fontDefinitionForId(template, fontFamilyId);
  if (definition) {
    return definition.family;
  }
  return fallbackFamily ?? null;
}

export async function ensureTemplateFontsLoaded(template: TemplateDefinition) {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
    return;
  }

  const faces = template.fonts.map((font) => {
    const key = fontKey(font);
    if (loadedFontKeys.has(key)) {
      return null;
    }
    loadedFontKeys.add(key);
    return new FontFace(font.family, `url(${font.file})`, {
      weight: font.weight.toString(),
      style: font.style,
    });
  });

  const loads = faces.filter((face): face is FontFace => face !== null).map((face) => face.load());
  if (loads.length > 0) {
    const loadedFaces = await Promise.all(loads);
    for (const face of loadedFaces) {
      document.fonts.add(face);
    }
  }

  await document.fonts.ready;
}
