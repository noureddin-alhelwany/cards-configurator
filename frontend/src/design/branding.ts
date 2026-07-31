import { fieldRole } from './fieldRoles';
import type { LayoutState, TemplateDefinition } from './types';

const CANVAS = 800;
const MARGIN = 40;
const MAX_LINES = 3;

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });
}

/** Greedy word wrap into at most `MAX_LINES` lines, aiming for even line lengths. */
function wrapLines(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return words;
  }
  const lineCount = Math.min(MAX_LINES, Math.ceil(text.length / 16) || 1);
  if (lineCount <= 1) {
    return [words.join(' ')];
  }
  const target = Math.ceil(text.length / lineCount);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > target && lines.length < lineCount - 1) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

/**
 * Typographic branding stand-in used when no logo has been uploaded.
 *
 * Shared by the live preview and the production render so an approved card prints
 * exactly what the customer signed off on. Always returns a loadable data URL —
 * `DesignRenderer` passes it straight to `<img src>` and would otherwise show a
 * broken-image icon and never fire `onLoad`, stalling the render-ready gate.
 */
export function brandingFallbackDataUrl(businessName: string) {
  const name = businessName.trim();
  if (!name) {
    // Nothing to show yet: stay invisible rather than render an empty placeholder.
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}" role="presentation"><rect width="${CANVAS}" height="${CANVAS}" fill="none" /></svg>`,
    )}`;
  }

  const lines = wrapLines(name);
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 1);
  // 0.58em is a workable average glyph width for the sans stack below.
  const fontSize = Math.max(48, Math.min(150, Math.round((CANVAS - 2 * MARGIN) / (longest * 0.58))));
  const lineHeight = Math.round(fontSize * 1.12);
  const firstBaseline = CANVAS / 2 - ((lines.length - 1) * lineHeight) / 2 + Math.round(fontSize * 0.35);

  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${CANVAS / 2}" y="${firstBaseline + index * lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}" role="img" aria-label="${escapeXml(name)}">` +
      `<text fill="#1f1a17" font-family="Proof Sans, Avenir Next, Segoe UI, sans-serif" font-size="${fontSize}" font-weight="700" text-anchor="middle">${tspans}</text>` +
      `</svg>`,
  )}`;
}

/** The field whose value stands in for the brand when no logo is present. */
export function businessNameFromLayout(template: TemplateDefinition, layoutState: Pick<LayoutState, 'text_values'>) {
  const businessField = template.fields.find((field, index) => fieldRole(field, index) === 'business');
  if (!businessField) {
    return '';
  }
  return layoutState.text_values[businessField.id] ?? '';
}

/** Asset keys of image elements that should fall back to the business name. */
export function logoAssetKeys(template: TemplateDefinition) {
  const logoFieldIds = new Set(
    template.fields.filter((field, index) => fieldRole(field, index) === 'logo').map((field) => field.id),
  );
  return template.elements
    .filter((element) => element.kind === 'image' && logoFieldIds.has(element.asset_key))
    .map((element) => (element.kind === 'image' ? element.asset_key : ''));
}
