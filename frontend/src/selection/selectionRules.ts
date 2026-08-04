import type { TemplateDefinition, CategoryDefinition } from '../registries/types';
import type { ValidationIssue } from '../design/types';
import { fieldRole } from '../design/fieldRoles';
import type { TemplateFieldRole } from '../design/fieldRoles';
import { uiText } from '../ui/text';

// Re-exported so existing `selectionRules` importers stay unchanged.
export { fieldRole };
export type { TemplateFieldRole };

export function buildWizardSteps() {
  return [
    {
      id: 'product',
      title: uiText.selection.wizardSteps.product.title,
      description: uiText.selection.wizardSteps.product.description,
    },
    {
      id: 'design',
      title: uiText.selection.wizardSteps.design.title,
      description: uiText.selection.wizardSteps.design.description,
    },
    {
      id: 'content',
      title: uiText.selection.wizardSteps.content.title,
      description: uiText.selection.wizardSteps.content.description,
    },
    {
      id: 'review',
      title: uiText.selection.wizardSteps.review.title,
      description: uiText.selection.wizardSteps.review.description,
    },
  ] as const;
}

export type WizardStep = ReturnType<typeof buildWizardSteps>[number];

export function designStyleDescription(template: TemplateDefinition) {
  if (template.description) {
    return template.description;
  }
  const name = (template.name ?? '').toLowerCase();
  if (name.includes('classic') || name.includes('minimal')) {
    return 'Klar, ruhig und mit viel Weißraum.';
  }
  if (name.includes('bold') || name.includes('strong')) {
    return 'Große Botschaft und besonders sichtbarer QR-Code.';
  }
  if (name.includes('minimum')) {
    return 'Sehr reduziert und auf das Wesentliche fokussiert.';
  }
  if (name.includes('warm') || name.includes('friendly')) {
    return 'Freundlich und passend für Beauty, Wellness und Gastronomie.';
  }
  if (name.includes('premium') || name.includes('primum') || name.includes('luxury')) {
    return 'Reduziert und hochwertig.';
  }
  return 'Ein kuratiertes Design mit vollständiger Vorschau.';
}

const TEMPLATE_STYLE_KEYWORDS = ['Classic', 'Bold', 'Minimal', 'Minimum', 'Warm', 'Premium'] as const;

/**
 * Short design name for the compact content-step header ("Design: Bold").
 *
 * The host template keeps the product-level identity, while the visible style lives in
 * the template name or the active variant name.
 */
export function designStyleName(template: TemplateDefinition) {
  const name = (template.name ?? '').trim();
  if (!name) {
    return uiText.common.designFallback;
  }
  const matched = TEMPLATE_STYLE_KEYWORDS.find((keyword) => name.toLowerCase().includes(keyword.toLowerCase()));
  return matched ?? name.split(/\s+/).pop() ?? uiText.common.designFallback;
}

export function selectedDesignName(template: TemplateDefinition, variantId: string | null) {
  const selectedVariant = activeVariant(template, variantId);
  if (selectedVariant) {
    return selectedVariant.name;
  }
  return designStyleName(template);
}

export function activeVariants(template: TemplateDefinition) {
  return template.variants.filter((variant) => variant.active);
}

export function fieldLabel(field: TemplateDefinition['fields'][number], index: number) {
  if (field.label) {
    return field.label;
  }
  const role = fieldRole(field, index);
  switch (role) {
    case 'business':
      return 'Unternehmensname';
    case 'headline':
      return 'Überschrift';
    case 'body':
      return 'Beschreibung';
    case 'qrTarget':
      return 'QR-Ziel';
    case 'logo':
      return 'Logo';
    case 'image':
      return 'Foto';
    case 'generic':
    default:
      return 'Inhalt';
  }
}

export function fieldGroupLabel(field: TemplateDefinition['fields'][number], index: number) {
  if (field.group) {
    return field.group;
  }
  const role = fieldRole(field, index);
  switch (role) {
    case 'logo':
      return 'Logo';
    case 'image':
      return 'Bilder';
    case 'qrTarget':
      return 'Link und QR';
    default:
      return 'Texte';
  }
}

export function fieldHelperText(field: TemplateDefinition['fields'][number], index: number) {
  if (field.help_text) {
    return field.help_text;
  }
  const role = fieldRole(field, index);
  switch (role) {
    case 'business':
      return 'So erscheint dein Name auf der Karte.';
    case 'headline':
      return 'Kurz und gut lesbar für den ersten Eindruck.';
    case 'body':
      return 'Hilfstext oder zweite Zeile für mehr Kontext.';
    case 'qrTarget':
      return 'Die Zieladresse wird in den QR-Code übernommen.';
    case 'logo':
      return 'Ein Logo für einen sauberen Markenauftritt.';
    case 'image':
      return 'Ein Bild mit passendem Ausschnitt für das Design.';
    case 'generic':
    default:
      return 'Ein passender Inhalt für dieses Design.';
  }
}

export function fieldSuggestions(field: TemplateDefinition['fields'][number], index: number) {
  const suggestions = field.suggestions ?? [];
  if (suggestions.length > 0) {
    return suggestions;
  }
  const role = fieldRole(field, index);
  switch (role) {
    case 'business':
      return ['Studio Sonnenschein', 'Muster GmbH', 'Café Nord'];
    case 'headline':
      return ['Danke für deinen Besuch', 'Scanne und bewerte uns', 'Jetzt Termin buchen'];
    case 'body':
      return ['Deine Meinung hilft uns weiter.', 'Nur kurz scannen und Feedback teilen.', 'Einmal scannen, direkt loslegen.'];
    default:
      // No suggestions for link fields: a placeholder example is clearer than a chip
      // that writes a fake URL into the customer's card.
      return [];
  }
}

export function fieldPlaceholder(field: TemplateDefinition['fields'][number], index: number) {
  if (field.placeholder) {
    return field.placeholder;
  }
  const role = fieldRole(field, index);
  switch (role) {
    case 'business':
      return 'Studio Sonnenschein';
    case 'headline':
      return 'Scanne und bewerte uns';
    case 'body':
      return 'Deine Meinung hilft uns weiter.';
    case 'qrTarget':
      return 'example.com/review';
    default:
      return '';
  }
}

export function fieldDefaultValue(field: TemplateDefinition['fields'][number], index: number, category: CategoryDefinition) {
  if (field.default_value != null) {
    return field.default_value;
  }
  return demoTextForRole(fieldRole(field, index), category);
}

export function trimSuggestion(value: string, maxLength: number | null) {
  if (maxLength === null || value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength).trimEnd();
}

export function demoTextForRole(role: TemplateFieldRole, category: CategoryDefinition) {
  switch (role) {
    case 'business':
      return 'Studio Sonnenschein';
    case 'headline':
      return `Danke für deinen Besuch bei ${category.name}`;
    case 'body':
      return `Scanne den QR-Code und teile deine Erfahrung mit ${category.name.toLowerCase()}.`;
    case 'qrTarget':
      // Seeded into the draft on template selection, so it must stay empty: a
      // pre-filled example link would silently ship on the printed card.
      return '';
    default:
      return 'Beispieltext';
  }
}

export function friendlyValidationMessage(issue: ValidationIssue, fieldName: string) {
  switch (issue.code) {
    case 'required_field_missing':
      return `${fieldName} fehlt noch.`;
    case 'text_overflow':
      return `${fieldName} ist für das Layout zu lang. Kürze den Text oder wähle eine andere Variante.`;
    case 'text_too_long':
      return `${fieldName} überschreitet die erlaubte Länge.`;
    case 'image_dpi_warning':
      return `${fieldName} ist grenzwertig aufgelöst. Wenn möglich, lade eine größere Datei hoch.`;
    case 'image_dpi_too_low':
      return `${fieldName} ist zu niedrig aufgelöst. Bitte eine höher aufgelöste Datei wählen.`;
    case 'qr_too_small':
      return `${fieldName} ist zu klein für dieses Produkt.`;
    default:
      return `${fieldName} sollte geprüft werden.`;
  }
}

export function validationDisplayPath(issue: ValidationIssue) {
  if (issue.code === 'qr_too_small') {
    return 'qrTarget';
  }
  return issue.path;
}

export function templateKey(template: TemplateDefinition) {
  return `${template.id}@${template.version}`;
}

export function activeVariant(template: TemplateDefinition, variantId: string | null) {
  return (
    template.variants.find((variant) => variant.active && variant.id === variantId) ??
    template.variants.find((variant) => variant.active) ??
    null
  );
}

const GOOGLE_REVIEWS_TEMPLATE_ID = 'proof_a6_card';
const GOOGLE_REVIEWS_HOST_VERSION = '1.6.0';

export function isGoogleReviewsHostTemplate(template: TemplateDefinition) {
  return (
    template.id === GOOGLE_REVIEWS_TEMPLATE_ID &&
    template.product_id === 'a6_card' &&
    template.version === GOOGLE_REVIEWS_HOST_VERSION
  );
}

export function templateRecommendationIndex(template: TemplateDefinition, index: number) {
  const name = (template.name ?? '').toLowerCase();
  if (name.includes('clean') || name.includes('classic') || name.includes('minimal')) {
    return 0;
  }
  if (name.includes('bold')) {
    return 1;
  }
  if (name.includes('minimum')) {
    return 2;
  }
  if (name.includes('warm')) {
    return 3;
  }
  if (name.includes('premium') || name.includes('primum')) {
    return 4;
  }
  return index;
}
