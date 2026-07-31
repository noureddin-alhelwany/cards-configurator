import type { LayoutState, TemplateDefinition } from './types';

/**
 * The URL that is actually encoded on the card.
 *
 * Mirrors `resolve_qr_value` in `backend/.../urls.py`. The renderer needs it for the
 * accessible name: the alt text used to be built from the template's static `value`, so it
 * kept claiming `example.com/review` no matter what the customer typed.
 */
export function resolveQrValue(template: TemplateDefinition, layoutState: LayoutState): string {
  const urlField = template.fields.find((field) => field.type === 'url');
  if (urlField) {
    const value = (layoutState.text_values[urlField.id] ?? '').trim();
    if (value) {
      return value;
    }
  }
  const qrElement = template.elements.find((element) => element.kind === 'qr');
  return qrElement && qrElement.kind === 'qr' ? qrElement.value : '';
}
