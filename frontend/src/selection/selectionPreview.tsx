import { useEffect, useState } from 'react';
import type { ProductDefinition, TemplateDefinition, CategoryDefinition } from '../registries/types';
import type {
  ElementAdjustment,
  ProofFixture,
  TemplateElementDefinition,
  ValidationIssue,
  ZoneDefinition,
} from '../design/types';
import DesignPreviewFrame from '../design/DesignPreviewFrame';
import { defaultTemplateDesignId } from '../design/variantResolution';
import { defaultAdjustmentsForTemplate } from './selectionHelpers';
import { emptyPreviewAsset, placeholderQrDataUrl } from './previewAssets';
import { brandingFallbackDataUrl, businessNameFromLayout } from '../design/branding';
import { zoneVariableFieldId } from '../design/zoneVariables';
import {
  activeDesign,
  designHasQrZone,
  fieldDefaultValue,
  fieldLabel,
  staticTextDefaultsForDesign,
  trimSuggestion,
} from './selectionRules';
import { uiText } from '../ui/text';

export function buildTemplatePreviewFixture(
  template: TemplateDefinition,
  product: ProductDefinition | null,
  category: CategoryDefinition | null,
  options?: {
    textMode?: 'demo' | 'blank';
  },
): ProofFixture | null {
  if (!product || !category) {
    return null;
  }

  const textMode = options?.textMode ?? 'demo';

  const text_values = Object.fromEntries(
    template.fields
      .filter((field) => field.type === 'text' || field.type === 'url')
      .map((field, index) => {
        const value =
          textMode === 'blank' ? '' : trimSuggestion(fieldDefaultValue(field, index, category), field.max_length);
        return [field.id, value];
      }),
  );
  Object.assign(text_values, staticTextDefaultsForDesign(template, defaultTemplateDesignId(template)));

  const assets: ProofFixture['assets'] = {};
  const demoBusinessName = businessNameFromLayout(template, { text_values });
  template.fields.forEach((field, index) => {
    if (field.type === 'logo') {
      // No upload in a browse preview: stand in with the brand name, same as the live card.
      assets[field.id] = {
        mime_type: 'image/svg+xml',
        data_url: brandingFallbackDataUrl(demoBusinessName),
      };
      return;
    }
    if (field.type === 'image') {
      assets[field.id] = {
        mime_type: 'image/svg+xml',
        data_url: emptyPreviewAsset(fieldLabel(field, index)),
      };
    }
  });

  const activeVariant = activeDesign(template, defaultTemplateDesignId(template));
  if (designHasQrZone(template, activeVariant?.id ?? null) && template.elements.some((element) => element.kind === 'qr')) {
    assets.qr = {
      mime_type: 'image/svg+xml',
      data_url: placeholderQrDataUrl(),
    };
  }

  return {
    template,
    product,
    category: category,
    layout_state: {
      design_id: defaultTemplateDesignId(template) ?? '',
      element_adjustments: defaultAdjustmentsForTemplate(template),
      text_values,
      asset_values: {},
    },
    assets,
  };
}

function zoneTextVariable(zone: ZoneDefinition, fieldId: string) {
  return (zone.variables ?? []).find((variable) => variable.kind === 'text' && zoneVariableFieldId(variable) === fieldId) ?? null;
}

function applyZoneGeometry(
  elements: TemplateElementDefinition[],
  selectedZoneDesign: ReturnType<typeof activeDesign>,
): TemplateElementDefinition[] {
  if (!selectedZoneDesign?.zones?.length) {
    return elements;
  }

  const textZonesByFieldId = new Map<string, ZoneDefinition>();
  let qrZone: ZoneDefinition | null = null;

  for (const zone of selectedZoneDesign.zones) {
    if (zone.kind === 'qr') {
      qrZone = qrZone ?? zone;
      continue;
    }
    for (const variable of zone.variables ?? []) {
    if (variable.kind !== 'text') {
      continue;
    }
      const fieldId = zoneVariableFieldId(variable);
      if (!fieldId) {
        continue;
      }
      textZonesByFieldId.set(fieldId, zone);
    }
  }

  return elements.flatMap((element): TemplateElementDefinition[] => {
    if (element.kind === 'text') {
      const zone = textZonesByFieldId.get(element.id);
      if (!zone) {
        return [];
      }
      const variable = zoneTextVariable(zone, element.id);
      return [
        {
          ...element,
          box_mm: zone.box_mm,
          font_family_id: variable?.font_family_id ?? element.font_family_id,
          font_size_mm: variable?.font_size_mm ?? element.font_size_mm,
          font_weight: variable?.font_weight ?? element.font_weight,
          color: variable?.color ?? element.color,
          line_height: variable?.line_height ?? element.line_height,
          letter_spacing_em: variable?.letter_spacing_em ?? element.letter_spacing_em,
          align: variable?.align ?? element.align,
          min_font_size_mm: variable?.min_font_size_mm ?? element.min_font_size_mm,
        },
      ];
    }

    if (element.kind === 'image') {
      return [];
    }

    if (element.kind === 'qr' && qrZone) {
      const qr = qrZone.qr ?? null;
      return [
        {
          ...element,
          box_mm: qrZone.box_mm,
          color: qr?.color ?? element.color,
          background: qr?.background ?? element.background,
          quiet_zone_mm: qr?.quiet_zone_mm ?? element.quiet_zone_mm,
          error_correction: qr?.error_correction ?? element.error_correction,
        },
      ];
    }

    if (element.kind === 'qr') {
      return [];
    }

    return [element];
  });
}

type TemplateLivePreviewProps = {
  template: TemplateDefinition;
  product: ProductDefinition;
  category: CategoryDefinition;
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
};

export function TemplateLivePreview({
  template,
  product,
  category,
  selectedVariantId,
  layoutValues,
  assetPreviews,
  validationIssues,
  showLivePreview = true,
  showMockup = true,
  expanded = false,
}: TemplateLivePreviewProps) {
  const [qrPreview, setQrPreview] = useState<{ value: string; data_url: string } | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const qrField = designHasQrZone(template, selectedVariantId) ? template.fields.find((field) => field.type === 'url') ?? null : null;
  const qrFieldId = qrField?.id ?? null;
  const qrValue = qrFieldId ? layoutValues.text_values[qrFieldId] ?? '' : '';
  const selectedVariant = activeDesign(template, selectedVariantId);
  const qrElement = template.elements.find((element) => element.kind === 'qr');
  const qrColor = qrElement && qrElement.kind === 'qr' ? qrElement.color : null;
  const qrErrorCorrection = qrElement && qrElement.kind === 'qr' ? qrElement.error_correction ?? 'm' : 'm';

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
    // Ask for the template's own QR colour so the preview matches the printed card.
    const url = `/api/qr?value=${encodeURIComponent(qrValue)}${
      qrColor ? `&dark=${encodeURIComponent(qrColor)}` : ''
    }&error_correction=${encodeURIComponent(qrErrorCorrection)}`;
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
      .catch(() => {
        if (active) {
          setQrPreview(null);
          setQrError(uiText.errors.qrPreview);
          setQrLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [qrColor, qrErrorCorrection, qrFieldId, qrValue]);

  const hasPreviewContent =
    template.fields.some((field) => field.type === 'text' || field.type === 'url' || field.type === 'logo' || field.type === 'image') ||
    qrField !== null;

  if (!hasPreviewContent) {
    return null;
  }

  const proofFixture =
    template.elements.length > 0
      ? {
          template: {
            ...template,
            elements: applyZoneGeometry(template.elements, selectedVariant),
          },
          product,
          category: category,
          layout_state: {
            design_id: selectedVariantId ?? defaultTemplateDesignId(template) ?? '',
            element_adjustments: layoutValues.element_adjustments,
            text_values: layoutValues.text_values,
            asset_values: layoutValues.asset_values,
          },
          assets: {
            ...Object.fromEntries(
              template.fields
                .filter((field) => field.type === 'logo' || field.type === 'image')
                .map((field) => {
                  const uploaded = assetPreviews[field.id];
                  if (uploaded) {
                    return [
                      field.id,
                      {
                        mime_type: uploaded.startsWith('data:image/svg+xml') ? 'image/svg+xml' : 'image/png',
                        data_url: uploaded,
                      },
                    ];
                  }
                  // Without a logo the brand name carries the card. The production render
                  // applies the same fallback, so the approved proof is what gets printed.
                  return [
                    field.id,
                    {
                      mime_type: 'image/svg+xml',
                      data_url:
                        field.type === 'logo'
                          ? brandingFallbackDataUrl(businessNameFromLayout(template, layoutValues))
                          : emptyPreviewAsset('Bild'),
                    },
                  ];
              }),
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
          {proofFixture ? (
            <div className={`template-live-preview__stage${expanded ? ' template-live-preview__stage--expanded' : ''}`}>
              {qrLoading ? <p className="template-live-preview__loading">{uiText.selection.preview.loading}</p> : null}
              <DesignPreviewFrame fixture={proofFixture} validationIssues={validationIssues} />
            </div>
          ) : (
            <p className="template-field__hint">{uiText.selection.preview.liveHint}</p>
          )}
        </>
      ) : null}
      {showMockup && proofFixture ? (
        <div className="template-mockup">
          <p className="template-detail__group-title">{uiText.selection.preview.mockupTitle}</p>
          <DesignPreviewFrame className="template-mockup__frame" fixture={proofFixture} validationIssues={validationIssues} />
        </div>
      ) : null}
      {qrField && qrError ? <p className="content-field__error">{qrError}</p> : null}
    </div>
  );
}
