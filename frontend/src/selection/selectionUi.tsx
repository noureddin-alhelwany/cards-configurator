import { useEffect, useMemo, useState } from 'react';
import type {
  ProductDefinition,
  TemplateDefinition,
  TemplateVariantDefinition,
  UseCaseDefinition,
} from '../registries/types';
import type { ElementAdjustment, ProofFixture, ValidationIssue } from '../design/types';
import DesignRenderer from '../design/DesignRenderer';
import {
  assetElementForField,
  clamp,
  defaultAdjustmentsForTemplate,
  imageQualitySummary,
  type AssetMetadata,
} from './selectionHelpers';

export type TemplateFieldRole = 'business' | 'headline' | 'body' | 'qrTarget' | 'logo' | 'image' | 'generic';

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

function emptyPreviewAsset(label: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8efe4" />
          <stop offset="100%" stop-color="#e7d6c2" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" rx="56" fill="url(#bg)" />
      <rect x="78" y="78" width="644" height="644" rx="40" fill="none" stroke="#8f5a2a" stroke-width="10" stroke-dasharray="18 14" />
      <text x="400" y="402" fill="#5c3a1b" font-family="Avenir Next, Segoe UI, sans-serif" font-size="54" font-weight="700" text-anchor="middle">${label}</text>
      <text x="400" y="466" fill="#7a6856" font-family="Avenir Next, Segoe UI, sans-serif" font-size="26" text-anchor="middle">Platzhalter</text>
    </svg>
  `)}`;
}

function placeholderQrDataUrl() {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="QR Platzhalter">
      <rect width="800" height="800" rx="56" fill="#ffffff" />
      <rect x="72" y="72" width="656" height="656" rx="36" fill="none" stroke="#1f1a15" stroke-width="16" />
      <rect x="128" y="128" width="152" height="152" rx="18" fill="#1f1a15" />
      <rect x="520" y="128" width="152" height="152" rx="18" fill="#1f1a15" />
      <rect x="128" y="520" width="152" height="152" rx="18" fill="#1f1a15" />
      <rect x="184" y="184" width="40" height="40" fill="#ffffff" />
      <rect x="536" y="184" width="40" height="40" fill="#ffffff" />
      <rect x="184" y="576" width="40" height="40" fill="#ffffff" />
      <rect x="336" y="160" width="48" height="48" fill="#1f1a15" />
      <rect x="424" y="160" width="48" height="48" fill="#1f1a15" />
      <rect x="336" y="248" width="48" height="48" fill="#1f1a15" />
      <rect x="424" y="248" width="48" height="48" fill="#1f1a15" />
      <rect x="336" y="336" width="48" height="48" fill="#1f1a15" />
      <rect x="472" y="336" width="48" height="48" fill="#1f1a15" />
      <rect x="560" y="336" width="48" height="48" fill="#1f1a15" />
      <rect x="336" y="424" width="48" height="48" fill="#1f1a15" />
      <rect x="424" y="424" width="48" height="48" fill="#1f1a15" />
      <rect x="512" y="424" width="48" height="48" fill="#1f1a15" />
      <rect x="336" y="512" width="48" height="48" fill="#1f1a15" />
      <rect x="424" y="512" width="48" height="48" fill="#1f1a15" />
      <text x="400" y="726" fill="#1f1a15" font-family="Avenir Next, Segoe UI, sans-serif" font-size="34" font-weight="700" text-anchor="middle">QR Platzhalter</text>
    </svg>
  `)}`;
}

export function buildTemplatePreviewFixture(
  template: TemplateDefinition,
  product: ProductDefinition | null,
  useCase: UseCaseDefinition | null,
): ProofFixture | null {
  if (!product || !useCase) {
    return null;
  }

  const text_values = Object.fromEntries(
    template.fields
      .filter((field) => field.type === 'text' || field.type === 'url')
      .map((field, index) => {
        const role = fieldRole(field, index);
        return [field.id, trimSuggestion(demoTextForRole(role, useCase), field.max_length)];
      }),
  );

  const assets: ProofFixture['assets'] = {};
  template.fields.forEach((field, index) => {
    if (field.type === 'logo' || field.type === 'image') {
      assets[field.id] = {
        mime_type: 'image/svg+xml',
        data_url: emptyPreviewAsset(fieldLabel(fieldRole(field, index))),
      };
    }
  });

  if (template.elements.some((element) => element.kind === 'qr')) {
    assets.qr = {
      mime_type: 'image/svg+xml',
      data_url: placeholderQrDataUrl(),
    };
  }

  return {
    template,
    product,
    use_case: useCase,
    layout_state: {
      variant_id: template.variants.find((variant) => variant.active)?.id ?? '',
      element_adjustments: defaultAdjustmentsForTemplate(template),
      text_values,
      asset_values: {},
    },
    assets,
  };
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

type TemplateCardProps = {
  template: TemplateDefinition;
  product: ProductDefinition | null;
  useCase: UseCaseDefinition | null;
  selected: boolean;
  recommended?: boolean;
  onSelect: (template: TemplateDefinition) => void;
  disabled?: boolean;
};

export function TemplateCard({ template, product, useCase, selected, recommended = false, onSelect, disabled = false }: TemplateCardProps) {
  const previewFixture = buildTemplatePreviewFixture(template, product, useCase);

  return (
    <button
      type="button"
      className={`template-card${selected ? ' template-card--selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(template)}
      aria-label={`${template.name ?? 'Vorlage'} auswählen`}
    >
      <div className="template-card__preview">
        {previewFixture ? (
          <div className="template-card__preview-stage">
            <DesignRenderer fixture={previewFixture} />
          </div>
        ) : (
          <img className="template-card__image" src={template.preview_asset ?? ''} alt="" />
        )}
        <div className="template-card__badges" aria-hidden="true">
          {recommended ? <span className="template-card__badge">Empfohlen</span> : null}
          {selected ? <span className="template-card__badge template-card__badge--selected">Ausgewählt</span> : null}
        </div>
      </div>
      <div className="template-card__body">
        <p className="template-card__eyebrow">Vorlage</p>
        <h3>{template.name ?? 'Vorlage'}</h3>
        <p>{templateStyleDescription(template)}</p>
      </div>
    </button>
  );
}

type TemplateVariantButtonsProps = {
  template: TemplateDefinition;
  selectedVariantId: string | null;
  onSelect: (variant: TemplateVariantDefinition) => void;
  disabled?: boolean;
};

export function TemplateVariantButtons({ template, selectedVariantId, onSelect, disabled = false }: TemplateVariantButtonsProps) {
  const activeVariants = template.variants.filter((variant) => variant.active);

  if (activeVariants.length === 0) {
    return null;
  }

  return (
    <div className="template-variant-grid" role="tablist" aria-label="Layoutvarianten">
      {activeVariants.map((variant) => (
        <button
          key={variant.id}
          type="button"
          role="tab"
          aria-selected={variant.id === selectedVariantId}
          className={`template-variant-pill${variant.id === selectedVariantId ? ' template-variant-pill--selected' : ''}`}
          disabled={disabled}
          onClick={() => onSelect(variant)}
        >
          <span className="template-variant-pill__preview" aria-hidden="true">
            {variant.preview_asset ? <img src={variant.preview_asset} alt="" /> : <span>Variante</span>}
          </span>
          <span className="template-variant-pill__label">{variant.name}</span>
        </button>
      ))}
    </div>
  );
}

type TemplateFieldsListProps = {
  template: TemplateDefinition;
  product: ProductDefinition;
  layoutValues: {
    text_values: Record<string, string>;
    asset_values: Record<string, string>;
    element_adjustments: Record<string, ElementAdjustment>;
  };
  assetPreviews: Record<string, string>;
  assetDetails: Record<string, AssetMetadata>;
  assetErrors: Record<string, string | null>;
  validationIssues: ValidationIssue[];
  onTextChange: (fieldId: string, value: string) => void;
  onAssetChange: (fieldId: string, kind: 'logo' | 'image', file: File | null) => void;
  onAssetAdjustmentChange: (fieldId: string, adjustment: ElementAdjustment) => void;
  onAssetAdjustmentReset: (fieldId: string) => void;
  expandedAssetFieldId: string | null;
  onToggleAssetEditor: (fieldId: string | null) => void;
  onFieldInteract: (fieldId: string) => void;
  disabled?: boolean;
};

export function TemplateFieldsList({
  template,
  product,
  layoutValues,
  assetPreviews,
  assetDetails,
  assetErrors,
  validationIssues,
  onTextChange,
  onAssetChange,
  onAssetAdjustmentChange,
  onAssetAdjustmentReset,
  expandedAssetFieldId,
  onToggleAssetEditor,
  onFieldInteract,
  disabled = false,
}: TemplateFieldsListProps) {
  const groupedFields = useMemo(() => {
    const groups = new Map<
      string,
      {
        title: string;
        description: string;
        fields: Array<{ field: TemplateDefinition['fields'][number]; role: TemplateFieldRole }>;
      }
    >();

    template.fields.forEach((field, index) => {
      const role = fieldRole(field, index);
      const title = fieldGroupLabel(role);
      const description =
        title === 'Medien'
          ? 'Logo und Fotos für den Markenauftritt.'
          : title === 'Link und QR'
            ? 'Zieladresse und QR-Code verständlich ablegen.'
            : 'Texte mit klaren Beispielen und Zählern.';
      const current = groups.get(title);
      const entry = { field, role };
      if (current) {
        current.fields.push(entry);
        return;
      }
      groups.set(title, {
        title,
        description,
        fields: [entry],
      });
    });

    return Array.from(groups.values());
  }, [template.fields]);

  function renderIssue(fieldId: string) {
    return validationIssues.find((issue) => validationDisplayPath(issue) === fieldId) ?? null;
  }

  function renderSuggestions(field: TemplateDefinition['fields'][number], role: TemplateFieldRole) {
    if (field.type !== 'text' && field.type !== 'url') {
      return null;
    }

    const suggestions = fieldSuggestions(role).map((suggestion) => trimSuggestion(suggestion, field.max_length));
    if (suggestions.length === 0) {
      return null;
    }

    return (
      <div className="template-suggestions" aria-label={`Vorschläge für ${fieldLabel(role)}`}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="template-suggestion"
            disabled={disabled}
            onClick={() => {
              onFieldInteract(field.id);
              onTextChange(field.id, suggestion);
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="template-fields">
      {groupedFields.map((group) => (
        <section key={group.title} className="template-field-group" aria-label={group.title}>
          <div className="template-field-group__header">
            <div>
              <h4>{group.title}</h4>
              <p>{group.description}</p>
            </div>
          </div>
          <div className="template-field-group__fields">
            {group.fields.map(({ field, role }) => {
              const fieldName = fieldLabel(role);
              const fieldIssue = renderIssue(field.id);
              const isAssetField = field.type === 'logo' || field.type === 'image';

              if (field.type === 'text' || field.type === 'url') {
                const value = layoutValues.text_values[field.id] ?? '';
                const remainingCharacters = field.max_length === null ? null : Math.max(0, field.max_length - value.length);
                const hintId = `${field.id}-hint`;
                const errorId = `${field.id}-error`;
                return (
                  <label
                    key={field.id}
                    className={`template-field${fieldIssue ? ` template-field--issue template-field--issue--${fieldIssue.severity}` : ''}`}
                  >
                    <div className="template-field__header">
                      <div>
                        <span className="template-field__label">{fieldName}</span>
                        <p className="template-field__hint">{fieldHelperText(role)}</p>
                      </div>
                      <div className="template-field__meta">
                        {field.required ? <span className="template-field__required">Pflicht</span> : <span className="template-field__optional">Optional</span>}
                      </div>
                    </div>
                    {field.type === 'url' ? (
                      <input
                        type="url"
                        inputMode="url"
                        aria-label={fieldName}
                        aria-describedby={fieldIssue ? `${hintId} ${errorId}` : hintId}
                        aria-invalid={Boolean(fieldIssue?.blocking)}
                        value={value}
                        maxLength={field.max_length ?? undefined}
                        disabled={disabled}
                        onFocus={() => onFieldInteract(field.id)}
                        onChange={(event) => {
                          onFieldInteract(field.id);
                          onTextChange(field.id, event.target.value);
                        }}
                      />
                    ) : (
                      <textarea
                        aria-label={fieldName}
                        aria-describedby={fieldIssue ? `${hintId} ${errorId}` : hintId}
                        aria-invalid={Boolean(fieldIssue?.blocking)}
                        value={value}
                        rows={field.max_lines ?? 1}
                        maxLength={field.max_length ?? undefined}
                        disabled={disabled}
                        onFocus={() => onFieldInteract(field.id)}
                        onChange={(event) => {
                          onFieldInteract(field.id);
                          onTextChange(field.id, event.target.value);
                        }}
                      />
                    )}
                    <p className="template-field__hint" id={hintId}>
                      {field.max_length !== null
                        ? `Maximal ${field.max_length} Zeichen${remainingCharacters !== null ? ` · ${remainingCharacters} verbleibend` : ''}`
                        : 'Kein Zeichenlimit gesetzt'}
                    </p>
                    {field.max_lines !== null ? <p className="template-field__hint">Maximal {field.max_lines} Zeilen</p> : null}
                    {renderSuggestions(field, role)}
                    {fieldIssue ? (
                      <p className="template-field__error" id={errorId} aria-live="polite">
                        {friendlyValidationMessage(fieldIssue, fieldName)}
                      </p>
                    ) : null}
                  </label>
                );
              }

              if (!isAssetField) {
                return null;
              }

              const assetValue = layoutValues.asset_values[field.id] ?? '';
              const assetPreview = assetPreviews[field.id] ?? (assetValue.startsWith('data:') ? assetValue : '');
              const assetDetail = assetDetails[field.id] ?? null;
              const assetElement = assetElementForField(template, field.id);
              const assetAdjustment = assetElement
                ? layoutValues.element_adjustments[assetElement.id] ?? { offset_x: 0, offset_y: 0, scale: 1 }
                : { offset_x: 0, offset_y: 0, scale: 1 };
              const effectiveDpi =
                assetElement && assetDetail?.width_px
                  ? assetDetail.width_px / ((assetElement.box_mm.width_mm * assetAdjustment.scale) / 25.4)
                  : null;
              const dpiSummary = effectiveDpi === null ? null : imageQualitySummary(effectiveDpi, product);
              const hintId = `${field.id}-hint`;
              const errorId = `${field.id}-error`;
              return (
                <div
                  key={field.id}
                  className={`template-field${fieldIssue ? ` template-field--issue template-field--issue--${fieldIssue.severity}` : ''}`}
                >
                  <div className="template-field__header">
                    <div>
                      <span className="template-field__label">{fieldName}</span>
                      <p className="template-field__hint">{fieldHelperText(role)}</p>
                    </div>
                    <div className="template-field__meta">
                      {field.required ? <span className="template-field__required">Pflicht</span> : <span className="template-field__optional">Optional</span>}
                    </div>
                  </div>
                  <div className="template-upload">
                    <div className="template-upload__actions">
                      <label className="template-upload__button">
                        <input
                          type="file"
                          aria-label={fieldName}
                          accept="image/png,image/jpeg,image/svg+xml"
                          disabled={disabled}
                          onFocus={() => onFieldInteract(field.id)}
                          onChange={(event) => {
                            onFieldInteract(field.id);
                            onAssetChange(field.id, field.type === 'logo' ? 'logo' : 'image', event.target.files?.[0] ?? null);
                          }}
                        />
                        {assetValue ? 'Ersetzen' : 'Datei auswählen'}
                      </label>
                      <button
                        type="button"
                        className="template-field__reset"
                        disabled={disabled || !assetValue}
                        onClick={() => {
                          onFieldInteract(field.id);
                          onAssetChange(field.id, field.type === 'logo' ? 'logo' : 'image', null);
                        }}
                      >
                        Entfernen
                      </button>
                      {assetElement ? (
                        <button
                          type="button"
                          className="template-field__reset"
                          disabled={disabled}
                          onClick={() => onToggleAssetEditor(expandedAssetFieldId === field.id ? null : field.id)}
                        >
                          {expandedAssetFieldId === field.id ? 'Anpassung schließen' : 'Bild anpassen'}
                        </button>
                      ) : null}
                    </div>
                    <p className="template-upload__hint" id={hintId}>
                      Unterstützt werden PNG, JPG und SVG. Maus, Touch und Tastatur funktionieren gleichermaßen.
                    </p>
                    {assetPreview ? (
                      <div className="template-field__preview">
                        <img src={assetPreview} alt={`${fieldName} Vorschau`} />
                      </div>
                    ) : (
                      <div className="template-field__preview template-field__preview--empty" aria-hidden="true">
                        <span>{fieldName}</span>
                        <strong>Kein Upload</strong>
                      </div>
                    )}
                    {assetValue ? (
                      <details className="template-upload__details">
                        <summary>Technische Details</summary>
                        <dl>
                          <div>
                            <dt>Dateityp</dt>
                            <dd>{assetDetail?.mime_type ?? 'unbekannt'}</dd>
                          </div>
                          <div>
                            <dt>Größe</dt>
                            <dd>
                              {assetDetail?.width_px && assetDetail?.height_px
                                ? `${assetDetail.width_px} × ${assetDetail.height_px} px`
                                : 'unbekannt'}
                            </dd>
                          </div>
                        </dl>
                      </details>
                    ) : null}
                    {dpiSummary ? <p className={`template-field__hint template-field__hint--${dpiSummary.className}`}>{dpiSummary.text}</p> : null}
                    {assetErrors[field.id] ? (
                      <p className="template-field__error" id={errorId} aria-live="polite">
                        {assetErrors[field.id]}
                      </p>
                    ) : null}
                    {fieldIssue ? (
                      <p className="template-field__error" aria-live="polite">
                        {friendlyValidationMessage(fieldIssue, fieldName)}
                      </p>
                    ) : null}
                    {assetElement ? (
                      <div
                        className={`template-field__transform${expandedAssetFieldId === field.id ? ' template-field__transform--open' : ''}`}
                        hidden={expandedAssetFieldId !== field.id}
                      >
                        <label className="template-field__control">
                          <span>Verschiebung X</span>
                          <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.01"
                            aria-label={`${fieldName} verschiebung x`}
                            value={assetAdjustment.offset_x}
                            disabled={disabled}
                            onChange={(event) =>
                              onAssetAdjustmentChange(field.id, {
                                ...assetAdjustment,
                                offset_x: clamp(Number(event.target.value), -1, 1),
                              })
                            }
                          />
                          <output>{assetAdjustment.offset_x.toFixed(2)}</output>
                        </label>
                        <label className="template-field__control">
                          <span>Verschiebung Y</span>
                          <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.01"
                            aria-label={`${fieldName} verschiebung y`}
                            value={assetAdjustment.offset_y}
                            disabled={disabled}
                            onChange={(event) =>
                              onAssetAdjustmentChange(field.id, {
                                ...assetAdjustment,
                                offset_y: clamp(Number(event.target.value), -1, 1),
                              })
                            }
                          />
                          <output>{assetAdjustment.offset_y.toFixed(2)}</output>
                        </label>
                        <label className="template-field__control">
                          <span>Skalierung</span>
                          <input
                            type="range"
                            min={assetElement.min_scale}
                            max={assetElement.max_scale}
                            step="0.01"
                            aria-label={`${fieldName} skalierung`}
                            value={assetAdjustment.scale}
                            disabled={disabled}
                            onChange={(event) =>
                              onAssetAdjustmentChange(field.id, {
                                ...assetAdjustment,
                                scale: clamp(Number(event.target.value), assetElement.min_scale, assetElement.max_scale),
                              })
                            }
                          />
                          <output>{assetAdjustment.scale.toFixed(2)}</output>
                        </label>
                        <button type="button" className="template-field__reset" disabled={disabled} onClick={() => onAssetAdjustmentReset(field.id)}>
                          Zurücksetzen
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

type TemplateLivePreviewProps = {
  template: TemplateDefinition;
  product: ProductDefinition;
  useCase: UseCaseDefinition;
  selectedVariantId: string | null;
  layoutValues: {
    text_values: Record<string, string>;
    asset_values: Record<string, string>;
    element_adjustments: Record<string, ElementAdjustment>;
  };
  assetPreviews: Record<string, string>;
  validationIssues: ValidationIssue[];
  showLivePreview?: boolean;
  showMockup?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
};

export function TemplateLivePreview({
  template,
  product,
  useCase,
  selectedVariantId,
  layoutValues,
  assetPreviews,
  validationIssues,
  showLivePreview = true,
  showMockup = true,
  expanded = false,
  onToggleExpanded,
}: TemplateLivePreviewProps) {
  const [qrPreview, setQrPreview] = useState<{ value: string; data_url: string } | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const qrField = template.fields.find((field) => field.type === 'url') ?? null;
  const qrFieldId = qrField?.id ?? null;
  const qrValue = qrFieldId ? layoutValues.text_values[qrFieldId] ?? '' : '';

  useEffect(() => {
    let active = true;

    if (!qrFieldId || qrValue.trim() === '') {
      setQrPreview(null);
      setQrError(null);
      setQrLoading(false);
      return () => {
        active = false;
      };
    }

    setQrLoading(true);
    const url = `/api/qr?value=${encodeURIComponent(qrValue)}`;
    fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load QR preview: ${response.status}`);
        }
        return (await response.json()) as { value: string; data_url: string };
      })
      .then((preview) => {
        if (active) {
          setQrPreview(preview);
          setQrError(null);
          setQrLoading(false);
        }
      })
      .catch((exception: unknown) => {
        if (active) {
          setQrPreview(null);
          setQrError(exception instanceof Error ? exception.message : 'QR konnte nicht geladen werden');
          setQrLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [qrFieldId, qrValue]);

  const hasPreviewContent =
    template.fields.some((field) => field.type === 'text' || field.type === 'url' || field.type === 'logo' || field.type === 'image') ||
    qrField !== null;

  if (!hasPreviewContent) {
    return null;
  }

  const proofFixture = template.elements.length > 0
    ? {
        template,
        product,
        use_case: useCase,
        layout_state: {
          variant_id: selectedVariantId ?? template.variants.find((variant) => variant.active)?.id ?? '',
          element_adjustments: layoutValues.element_adjustments,
          text_values: layoutValues.text_values,
          asset_values: layoutValues.asset_values,
        },
        assets: {
          ...Object.fromEntries(
            template.fields
              .filter((field) => field.type === 'logo' || field.type === 'image')
              .map((field) => [
                field.id,
                {
                  mime_type: assetPreviews[field.id]?.startsWith('data:image/svg+xml') ? 'image/svg+xml' : 'image/png',
                  data_url: assetPreviews[field.id] ?? emptyPreviewAsset(field.type === 'logo' ? 'Logo' : 'Bild'),
                },
              ]),
          ),
          ...(qrPreview
            ? {
                qr: { mime_type: 'image/svg+xml', data_url: qrPreview.data_url },
              }
            : {
                qr: { mime_type: 'image/svg+xml', data_url: placeholderQrDataUrl() },
              }),
        },
      }
    : null;

  return (
    <div className={`template-live-preview${expanded ? ' template-live-preview--expanded' : ''}`}>
      {showLivePreview ? (
        <>
          <div className="template-live-preview__header">
            <p className="template-detail__group-title">Live-Vorschau</p>
            {onToggleExpanded ? (
              <button type="button" className="template-field__reset" onClick={onToggleExpanded}>
                {expanded ? 'Verkleinern' : 'Vorschau vergrößern'}
              </button>
            ) : null}
          </div>
          {proofFixture ? (
            <div className={`template-live-preview__stage${expanded ? ' template-live-preview__stage--expanded' : ''}`}>
              {qrLoading ? <p className="template-live-preview__loading">Vorschau wird geladen…</p> : null}
              <DesignRenderer fixture={proofFixture} validationIssues={validationIssues} />
            </div>
          ) : (
            <p className="template-field__hint">Live-Vorschau nutzt gerenderte Template-Elemente, sobald sie verfügbar sind.</p>
          )}
          <p className="template-live-preview__note">Änderungen an Texten, Medien und Varianten erscheinen direkt in derselben Vorschau wie später im Druck.</p>
        </>
      ) : null}
      {showMockup && proofFixture ? (
        <div className="template-mockup">
          <p className="template-detail__group-title">Produkt-Mockup</p>
          <div className="template-mockup__frame">
            <DesignRenderer fixture={proofFixture} validationIssues={validationIssues} />
          </div>
        </div>
      ) : null}
      {qrField && !qrPreview ? <p className="template-field__hint">{qrError ?? 'QR-Platzhalter wird angezeigt, bis eine URL eingegeben wurde'}</p> : null}
    </div>
  );
}
