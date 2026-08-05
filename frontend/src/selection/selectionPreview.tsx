import { useEffect, useState } from 'react';
import type { ProductDefinition, TemplateDefinition, CategoryDefinition } from '../registries/types';
import type { ElementAdjustment, ProofFixture, ValidationIssue } from '../design/types';
import DesignPreviewFrame from '../design/DesignPreviewFrame';
import { defaultTemplateDesignId } from '../design/variantResolution';
import { defaultAdjustmentsForTemplate } from './selectionHelpers';
import { emptyPreviewAsset, placeholderQrDataUrl } from './previewAssets';
import { brandingFallbackDataUrl, businessNameFromLayout } from '../design/branding';
import { fieldDefaultValue, fieldLabel, staticTextDefaultsForDesign, trimSuggestion } from './selectionRules';
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

  if (template.elements.some((element) => element.kind === 'qr')) {
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
  const qrField = template.fields.find((field) => field.type === 'url') ?? null;
  const qrFieldId = qrField?.id ?? null;
  const qrValue = qrFieldId ? layoutValues.text_values[qrFieldId] ?? '' : '';
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
          template,
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
