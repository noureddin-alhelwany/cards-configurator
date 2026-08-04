import type { FontDefinition, TemplateDefinition } from './types';

const loadedFontKeys = new Set<string>();

function fontKey(font: FontDefinition) {
  return [font.id ?? font.family, font.family, font.file, font.weight, font.style].join(':');
}

export function templateFontDefinitions(template: TemplateDefinition): FontDefinition[] {
  const fonts: FontDefinition[] = [];
  const seen = new Set<string>();
  for (const design of template.designs ?? []) {
    for (const font of design.fonts ?? []) {
      const key = font.id ?? font.family;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      fonts.push(font);
    }
  }
  return fonts;
}

export function fontDefinitionForId(template: TemplateDefinition, fontFamilyId: string | null | undefined) {
  if (!fontFamilyId) {
    return null;
  }
  return templateFontDefinitions(template).find((font) => (font.id ?? font.family) === fontFamilyId) ?? null;
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
  await ensureFontDefinitionsLoaded(templateFontDefinitions(template));
}

export async function ensureFontDefinitionsLoaded(fonts: FontDefinition[]) {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
    return;
  }

  const faces = fonts.map((font) => {
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
