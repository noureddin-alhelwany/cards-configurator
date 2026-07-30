import type { TemplateDefinition, UseCaseDefinition } from '../registries/types';
import type { ValidationIssue } from '../design/types';

export type TemplateFieldRole = 'business' | 'headline' | 'body' | 'qrTarget' | 'logo' | 'image' | 'generic';

export function buildWizardSteps(includeProductStep: boolean) {
  return [
    {
      id: 'selection',
      title: 'Auswahl',
      description: 'Zuerst den passenden Anwendungsfall wählen.',
    },
    ...(includeProductStep
      ? [
          {
            id: 'product',
            title: 'Produkt',
            description: 'Dann das passende Format auswählen.',
          },
        ]
      : []),
    {
      id: 'design',
      title: 'Design',
      description: 'Eine Vorlage für den gewählten Einsatz auswählen.',
    },
    {
      id: 'content',
      title: 'Inhalte',
      description: 'Texte, Medien und Anpassungen prüfen.',
    },
    {
      id: 'review',
      title: 'Prüfen',
      description: 'Freigeben und den Auftrag erstellen.',
    },
  ] as const;
}

export type WizardStep = ReturnType<typeof buildWizardSteps>[number];

export function templateStyleDescription(template: TemplateDefinition) {
  const name = (template.name ?? '').toLowerCase();
  if (name.includes('clean') || name.includes('classic') || name.includes('minimal')) {
    return 'Klar, ruhig und mit viel Weißraum.';
  }
  if (name.includes('bold') || name.includes('strong')) {
    return 'Große Botschaft und besonders sichtbarer QR-Code.';
  }
  if (name.includes('warm') || name.includes('friendly')) {
    return 'Freundlich und passend für Beauty, Wellness und Gastronomie.';
  }
  if (name.includes('premium') || name.includes('luxury')) {
    return 'Reduziert und hochwertig.';
  }
  return 'Eine kuratierte Vorlage mit vollständiger Vorschau.';
}

export function fieldRole(field: TemplateDefinition['fields'][number], index: number): TemplateFieldRole {
  const id = field.id.toLowerCase();
  if (field.type === 'logo') {
    return 'logo';
  }
  if (field.type === 'image') {
    return 'image';
  }
  if (field.type === 'url' || id.includes('qr') || id.includes('url') || id.includes('target')) {
    return 'qrTarget';
  }
  if (id.includes('business') || id.includes('company') || id.includes('studio') || id.includes('brand')) {
    return 'business';
  }
  if (id.includes('headline') || id.includes('title') || id.includes('claim') || id.includes('hero')) {
    return 'headline';
  }
  if (id.includes('body') || id.includes('description') || id.includes('text') || id.includes('copy')) {
    return 'body';
  }
  if (index === 0) {
    return 'business';
  }
  if (index === 1) {
    return 'headline';
  }
  if (index === 2) {
    return 'body';
  }
  return 'generic';
}

export function fieldLabel(role: TemplateFieldRole) {
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

export function fieldGroupLabel(role: TemplateFieldRole) {
  switch (role) {
    case 'logo':
    case 'image':
      return 'Medien';
    case 'qrTarget':
      return 'Link und QR';
    default:
      return 'Texte';
  }
}

export function fieldHelperText(role: TemplateFieldRole) {
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
      return 'Ein Bild mit passendem Ausschnitt für das Template.';
    case 'generic':
    default:
      return 'Ein passender Inhalt für dieses Feld.';
  }
}

export function fieldSuggestions(role: TemplateFieldRole) {
  switch (role) {
    case 'business':
      return ['Studio Sonnenschein', 'Muster GmbH', 'Café Nord'];
    case 'headline':
      return ['Danke für deinen Besuch', 'Scanne und bewerte uns', 'Jetzt Termin buchen'];
    case 'body':
      return ['Deine Meinung hilft uns weiter.', 'Nur kurz scannen und Feedback teilen.', 'Einmal scannen, direkt loslegen.'];
    case 'qrTarget':
      return ['example.com/review', 'example.com/booking', 'example.com/menu'];
    default:
      return [];
  }
}

export function trimSuggestion(value: string, maxLength: number | null) {
  if (maxLength === null || value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength).trimEnd();
}

export function demoTextForRole(role: TemplateFieldRole, useCase: UseCaseDefinition) {
  switch (role) {
    case 'business':
      return 'Studio Sonnenschein';
    case 'headline':
      return `Danke für deinen Besuch bei ${useCase.name}`;
    case 'body':
      return `Scanne den QR-Code und teile deine Erfahrung mit ${useCase.name.toLowerCase()}.`;
    case 'qrTarget':
      return 'https://example.com/review';
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
      return issue.message || `${fieldName} sollte geprüft werden.`;
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

export function templateRecommendationIndex(template: TemplateDefinition, index: number) {
  const name = (template.name ?? '').toLowerCase();
  if (name.includes('clean') || name.includes('classic')) {
    return 0;
  }
  if (name.includes('bold')) {
    return 1;
  }
  if (name.includes('warm')) {
    return 2;
  }
  if (name.includes('premium')) {
    return 3;
  }
  return index;
}
