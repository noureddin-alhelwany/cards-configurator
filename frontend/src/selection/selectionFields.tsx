import { useMemo } from 'react';
import type { ProductDefinition, TemplateDefinition } from '../registries/types';
import type { ElementAdjustment, ValidationIssue } from '../design/types';
import { assetElementForField, imageQualitySummary, type AssetMetadata } from './selectionHelpers';
import {
  fieldGroupLabel,
  fieldHelperText,
  fieldLabel,
  fieldPlaceholder,
  fieldSuggestions,
  friendlyValidationMessage,
  trimSuggestion,
  validationDisplayPath,
} from './selectionRules';
import { uiText } from '../ui/text';

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
        fields: Array<{ field: TemplateDefinition['fields'][number] }>;
      }
    >();

    template.fields.forEach((field, index) => {
      const title = fieldGroupLabel(field, index);
      const description =
        title === 'Bilder'
          ? 'Logo und Fotos für den Markenauftritt.'
          : title === 'Link und QR'
            ? 'Zieladresse und QR-Code verständlich ablegen.'
            : 'Texte mit klaren Beispielen und Zählern.';
      const current = groups.get(title);
      const entry = { field };
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

  function renderSuggestions(field: TemplateDefinition['fields'][number], index: number) {
    if (field.type !== 'text' && field.type !== 'url') {
      return null;
    }

    const suggestions = fieldSuggestions(field, index).map((suggestion) => trimSuggestion(suggestion, field.max_length));
    if (suggestions.length === 0) {
      return null;
    }

    return (
      <div className="template-suggestions" aria-label={`Vorschläge für ${fieldLabel(field, index)}`}>
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
            {group.fields.map(({ field }) => {
              const fieldIndex = template.fields.indexOf(field);
              const fieldName = fieldLabel(field, fieldIndex);
              const fieldIssue = renderIssue(field.id);
              const isAssetField = field.type === 'logo' || field.type === 'image';
              const isSingleLine = field.type === 'url' || (field.type === 'text' && (field.max_lines ?? 1) <= 1);

              if (field.type === 'text' || field.type === 'url') {
                const value = layoutValues.text_values[field.id] ?? '';
                const remainingCharacters = field.max_length === null ? null : Math.max(0, field.max_length - value.length);
                const hintId = `${field.id}-hint`;
                const errorId = `${field.id}-error`;
                return (
                  <label
                    key={field.id}
                    id={field.id}
                    className={`template-field${fieldIssue ? ` template-field--issue template-field--issue--${fieldIssue.severity}` : ''}`}
                  >
                    <div className="template-field__header">
                      <div>
                        <span className="template-field__label">{fieldName}</span>
                        <p className="template-field__hint">{fieldHelperText(field, fieldIndex)}</p>
                      </div>
                      <div className="template-field__meta">
                        {field.required ? <span className="template-field__required">Pflicht</span> : <span className="template-field__optional">Optional</span>}
                      </div>
                    </div>
                    {isSingleLine ? (
                      <input
                        type={field.type === 'url' ? 'url' : 'text'}
                        inputMode={field.type === 'url' ? 'url' : undefined}
                        aria-label={fieldName}
                        aria-describedby={fieldIssue ? `${hintId} ${errorId}` : hintId}
                        aria-invalid={Boolean(fieldIssue?.blocking)}
                        value={value}
                        maxLength={field.max_length ?? undefined}
                        placeholder={fieldPlaceholder(field, fieldIndex)}
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
                        placeholder={fieldPlaceholder(field, fieldIndex)}
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
                    {field.max_lines !== null && field.max_lines > 1 ? <p className="template-field__hint">Maximal {field.max_lines} Zeilen</p> : null}
                    {renderSuggestions(field, fieldIndex)}
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
                  id={field.id}
                  className={`template-field${fieldIssue ? ` template-field--issue template-field--issue--${fieldIssue.severity}` : ''}`}
                >
                  <div className="template-field__header">
                    <div>
                      <span className="template-field__label">{fieldName}</span>
                      <p className="template-field__hint">{fieldHelperText(field, fieldIndex)}</p>
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
                      <button
                        type="button"
                        className="template-field__reset"
                        disabled={disabled}
                        onClick={() => onToggleAssetEditor(expandedAssetFieldId === field.id ? null : field.id)}
                      >
                        {expandedAssetFieldId === field.id ? 'Bildansicht schließen' : 'Bild anpassen'}
                      </button>
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
