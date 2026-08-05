import { useMemo } from 'react';
import type { TemplateDefinition } from '../registries/types';
import type { ElementAdjustment, ValidationIssue } from '../design/types';
import { assetElementForField, type AssetMetadata } from './selectionHelpers';
import {
  designHasQrZone,
  editableTextFieldIds,
  fieldGroupLabel,
  fieldHelperText,
  fieldLabel,
  fieldPlaceholder,
  fieldSuggestions,
  friendlyValidationMessage,
  trimSuggestion,
  validationDisplayPath,
  zoneTextVariableForField,
} from './selectionRules';
import { uiText } from '../ui/text';

const MAX_SUGGESTIONS = 3;
const MAX_TEXTAREA_ROWS = 2;

type TemplateField = TemplateDefinition['fields'][number];

type LayoutValues = {
  text_values: Record<string, string>;
  asset_values: Record<string, string>;
  element_adjustments: Record<string, ElementAdjustment>;
};

type SharedFieldProps = {
  field: TemplateField;
  index: number;
  /** False for single-field sections, where the section heading already names the field. */
  showLabel: boolean;
  issue: ValidationIssue | null;
  onFieldInteract: (fieldId: string) => void;
  disabled: boolean;
};

type ContentSection = {
  key: string;
  title: string;
  fields: Array<{ field: TemplateField; index: number }>;
  showFieldLabels: boolean;
  optional: boolean;
};

/**
 * Groups template fields into the visible form sections.
 *
 * Grouping comes from the registry (`fieldGroupLabel`) so nothing here knows about
 * concrete field ids. A section holding a single field borrows that field's label as
 * its heading — that is what collapses "Bilder → Logo" and "Link und QR → Link zu
 * deinen Google-Bewertungen" into one line instead of a heading plus a label.
 */
export function useContentSections(template: TemplateDefinition, selectedVariantId: string | null): ContentSection[] {
  return useMemo(() => {
    const groups = new Map<string, ContentSection>();
    const hasQrZone = designHasQrZone(template, selectedVariantId);

    template.fields.forEach((field, index) => {
      if (field.type !== 'text' && field.type !== 'url' && field.type !== 'logo' && field.type !== 'image') {
        return;
      }
      if (field.type === 'url' && !hasQrZone) {
        return;
      }
      const groupTitle = fieldGroupLabel(field, index);
      const existing = groups.get(groupTitle);
      if (existing) {
        existing.fields.push({ field, index });
        return;
      }
      groups.set(groupTitle, {
        key: groupTitle,
        title: groupTitle,
        fields: [{ field, index }],
        showFieldLabels: true,
        optional: false,
      });
    });

    return Array.from(groups.values()).map((section) => {
      if (section.fields.length !== 1) {
        return section;
      }
      const { field, index } = section.fields[0];
      return {
        ...section,
        title: fieldLabel(field, index),
        showFieldLabels: false,
        optional: !field.required,
      };
    });
  }, [selectedVariantId, template.fields]);
}

function textFor(template: string, field: string) {
  return template.replace('{field}', field);
}

type ContentTextFieldProps = SharedFieldProps & {
  value: string;
  onTextChange: (fieldId: string, value: string) => void;
  maxLength: number | null;
  lineLimit: number;
};

export function ContentTextField({
  field,
  index,
  showLabel,
  issue,
  value,
  onTextChange,
  onFieldInteract,
  disabled,
  maxLength,
  lineLimit,
}: ContentTextFieldProps) {
  const fieldName = fieldLabel(field, index);
  const inputId = `${field.id}-input`;
  const hintId = `${field.id}-hint`;
  const errorId = `${field.id}-error`;
  const helpText = field.help_text ?? (showLabel ? null : fieldHelperText(field, index));
  const isSingleLine = field.type === 'url' || lineLimit <= 1;
  const suggestions = fieldSuggestions(field, index)
    .map((suggestion) => trimSuggestion(suggestion, maxLength))
    .slice(0, MAX_SUGGESTIONS);
  const lineLimitReached = lineLimit > 1 && value.split('\n').length >= lineLimit;

  // Only static text goes into aria-describedby. Pointing it at the live character
  // counter would make screen readers re-announce the description on every keystroke.
  const describedBy = [helpText ? hintId : null, issue ? errorId : null].filter(Boolean).join(' ') || undefined;
  const sharedProps = {
    id: inputId,
    'aria-label': showLabel ? undefined : fieldName,
    'aria-describedby': describedBy,
    'aria-invalid': Boolean(issue?.blocking),
    value,
    maxLength: maxLength ?? undefined,
    placeholder: fieldPlaceholder(field, index),
    disabled,
    onFocus: () => onFieldInteract(field.id),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFieldInteract(field.id);
      onTextChange(field.id, event.target.value);
    },
  };

  return (
    <div
      id={field.id}
      className={`content-field${issue ? ` content-field--issue content-field--issue--${issue.severity}` : ''}`}
    >
      {showLabel || maxLength !== null ? (
        <div className="content-field__row">
          {showLabel ? (
            <label className="content-field__label" htmlFor={inputId}>
              {fieldName}
            </label>
          ) : (
            <span />
          )}
          {maxLength !== null ? (
            <span className="content-field__counter" aria-hidden="true">
              {value.length} / {maxLength} {uiText.selection.content.charUnit}
            </span>
          ) : null}
        </div>
      ) : null}

      {isSingleLine ? (
        <input type={field.type === 'url' ? 'url' : 'text'} inputMode={field.type === 'url' ? 'url' : undefined} {...sharedProps} />
      ) : (
        <textarea rows={Math.min(MAX_TEXTAREA_ROWS, lineLimit)} {...sharedProps} />
      )}

      {helpText ? (
        <p className="content-field__hint" id={hintId}>
          {helpText}
        </p>
      ) : null}

      {lineLimitReached ? (
        <p className="content-field__note" aria-hidden="true">
          {uiText.selection.content.lineLimit.replace('{count}', String(lineLimit))}
        </p>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="content-field__chips" aria-label={textFor(uiText.selection.content.suggestionsLabel, fieldName)}>
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
      ) : null}

      {issue ? (
        <p className="content-field__error" id={errorId} aria-live="polite">
          {friendlyValidationMessage(issue, fieldName)}
        </p>
      ) : null}
    </div>
  );
}

type ContentAssetFieldProps = SharedFieldProps & {
  template: TemplateDefinition;
  layoutValues: LayoutValues;
  assetPreviews: Record<string, string>;
  assetDetails: Record<string, AssetMetadata>;
  assetErrors: Record<string, string | null>;
  onAssetChange: (fieldId: string, kind: 'logo' | 'image', file: File | null) => void;
  onToggleAssetEditor: (fieldId: string | null) => void;
};

export function ContentAssetField({
  field,
  index,
  showLabel,
  issue,
  template,
  layoutValues,
  assetPreviews,
  assetDetails,
  assetErrors,
  onAssetChange,
  onToggleAssetEditor,
  onFieldInteract,
  disabled,
}: ContentAssetFieldProps) {
  const fieldName = fieldLabel(field, index);
  const hintId = `${field.id}-hint`;
  const errorId = `${field.id}-error`;
  const kind = field.type === 'logo' ? 'logo' : 'image';
  const assetValue = layoutValues.asset_values[field.id] ?? '';
  const assetPreview = assetPreviews[field.id] ?? (assetValue.startsWith('data:') ? assetValue : '');
  const assetDetail = assetDetails[field.id] ?? null;
  const assetElement = assetElementForField(template, field.id);
  const helpText = field.help_text ?? (showLabel ? null : fieldHelperText(field, index));

  /**
   * Accessible file input: a visually hidden `<input>` inside its `<label>`, so it stays
   * keyboard reachable. `accessibleName` names the action rather than the field — the
   * section heading already says "Logo" — and always contains the visible text (WCAG 2.5.3).
   */
  const fileInput = (label: string, accessibleName: string, quiet: boolean) => (
    <label className={`content-asset__button${quiet ? ' content-asset__button--quiet' : ''}`}>
      <input
        type="file"
        aria-label={accessibleName}
        accept="image/png,image/jpeg,image/svg+xml"
        disabled={disabled}
        onFocus={() => onFieldInteract(field.id)}
        onChange={(event) => {
          onFieldInteract(field.id);
          onAssetChange(field.id, kind, event.target.files?.[0] ?? null);
        }}
      />
      {label}
    </label>
  );

  return (
    <div
      id={field.id}
      className={`content-field content-field--asset${issue ? ` content-field--issue content-field--issue--${issue.severity}` : ''}`}
    >
      {showLabel ? <span className="content-field__label">{fieldName}</span> : null}

      {assetPreview ? (
        <div className="content-asset content-asset--filled">
          <img className="content-asset__thumb" src={assetPreview} alt={`${fieldName} Vorschau`} />
          <div className="content-asset__body">
            <p className="content-asset__status">{assetDetail?.original_filename ?? fieldName}</p>
            <div className="content-asset__actions">
              {assetElement ? (
                <button
                  type="button"
                  className="content-asset__action"
                  disabled={disabled}
                  onClick={() => {
                    onFieldInteract(field.id);
                    onToggleAssetEditor(field.id);
                  }}
                >
                  {textFor(uiText.selection.content.assetAdjust, fieldName)}
                </button>
              ) : null}
              {fileInput(
                uiText.selection.content.assetReplace,
                textFor(uiText.selection.content.assetReplaceLabel, fieldName),
                true,
              )}
              <button
                type="button"
                className="content-asset__action"
                aria-label={textFor(uiText.selection.content.assetRemoveLabel, fieldName)}
                disabled={disabled}
                onClick={() => {
                  onFieldInteract(field.id);
                  onAssetChange(field.id, kind, null);
                }}
              >
                {uiText.selection.content.assetRemove}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="content-asset content-asset--empty">
          {(() => {
            const uploadLabel = textFor(uiText.selection.content.assetUpload, fieldName);
            return fileInput(uploadLabel, uploadLabel, false);
          })()}
          {helpText ? (
            <p className="content-field__hint" id={hintId}>
              {helpText}
            </p>
          ) : null}
        </div>
      )}

      {/* No local DPI estimate: the resolution verdict comes from the quality check below,
          which knows the crop (`cover` hides pixels) and the clamped scale the renderer
          actually applies. A second formula here could only contradict it. */}
      {assetErrors[field.id] ? (
        <p className="content-field__error" id={errorId} aria-live="polite">
          {assetErrors[field.id]}
        </p>
      ) : null}

      {issue ? (
        <p className="content-field__error" aria-live="polite">
          {friendlyValidationMessage(issue, fieldName)}
        </p>
      ) : null}
    </div>
  );
}

type ContentFieldSectionsProps = {
  template: TemplateDefinition;
  selectedVariantId: string | null;
  layoutValues: LayoutValues;
  assetPreviews: Record<string, string>;
  assetDetails: Record<string, AssetMetadata>;
  assetErrors: Record<string, string | null>;
  validationIssues: ValidationIssue[];
  onTextChange: (fieldId: string, value: string) => void;
  onAssetChange: (fieldId: string, kind: 'logo' | 'image', file: File | null) => void;
  onToggleAssetEditor: (fieldId: string | null) => void;
  onFieldInteract: (fieldId: string) => void;
  disabled?: boolean;
};

export function ContentFieldSections({
  template,
  selectedVariantId,
  layoutValues,
  assetPreviews,
  assetDetails,
  assetErrors,
  validationIssues,
  onTextChange,
  onAssetChange,
  onToggleAssetEditor,
  onFieldInteract,
  disabled = false,
}: ContentFieldSectionsProps) {
  const editableFieldIds = useMemo(() => editableTextFieldIds(template, selectedVariantId), [selectedVariantId, template]);
  const baseSections = useContentSections(template, selectedVariantId);
  const sections = useMemo(
    () =>
      baseSections
        .map((section) => {
          const fields = section.fields.filter(({ field }) =>
            field.type === 'logo' || field.type === 'image'
              ? assetElementForField(template, field.id) !== null
              : editableFieldIds.has(field.id),
          );
          if (fields.length === 0) {
            return null;
          }

          const firstField = fields[0];
          return {
            ...section,
            fields,
            title: fields.length === 1 ? fieldLabel(firstField.field, firstField.index) : section.title,
            showFieldLabels: fields.length === 1 ? false : section.showFieldLabels,
          optional: fields.length === 1 ? !firstField.field.required : section.optional,
          };
        })
        .filter((section): section is ContentSection => section !== null),
    [baseSections, editableFieldIds, template],
  );

  function issueFor(fieldId: string) {
    return validationIssues.find((issue) => validationDisplayPath(issue) === fieldId) ?? null;
  }

  return (
    <>
      {sections.map((section) => (
        <section key={section.key} className="content-section" aria-labelledby={`${section.key}-title`}>
          <div className="content-section__head">
            <h3 id={`${section.key}-title`} className="content-section__title">
              {section.title}
            </h3>
            {section.optional ? (
              <span className="content-field__optional">{uiText.selection.content.optional}</span>
            ) : null}
          </div>
          {section.fields.map(({ field, index }) => {
            if (field.type !== 'logo' && field.type !== 'image' && !editableFieldIds.has(field.id)) {
              return null;
            }
            const zoneVariable = field.type === 'logo' || field.type === 'image' ? null : zoneTextVariableForField(template, selectedVariantId, field.id);
            const shared = {
              field,
              index,
              showLabel: section.showFieldLabels,
              issue: issueFor(field.id),
              onFieldInteract,
              disabled,
            };
            return field.type === 'logo' || field.type === 'image' ? (
              <ContentAssetField
                key={field.id}
                {...shared}
                template={template}
                layoutValues={layoutValues}
                assetPreviews={assetPreviews}
                assetDetails={assetDetails}
                assetErrors={assetErrors}
                onAssetChange={onAssetChange}
                onToggleAssetEditor={onToggleAssetEditor}
              />
            ) : (
              <ContentTextField
                key={field.id}
                {...shared}
                value={layoutValues.text_values[field.id] ?? ''}
                onTextChange={onTextChange}
                maxLength={zoneVariable?.max_length ?? field.max_length}
                lineLimit={zoneVariable?.max_lines ?? field.max_lines ?? 1}
              />
            );
          })}
        </section>
      ))}
    </>
  );
}
