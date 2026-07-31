import { useEffect, useState } from 'react';
import type { ProductDefinition, TemplateDefinition, UseCaseDefinition } from '../registries/types';
import type { ElementAdjustment, ProofFixture, ValidationIssue } from '../design/types';
import DesignRenderer from '../design/DesignRenderer';
import { defaultAdjustmentsForTemplate } from './selectionHelpers';
import { emptyPreviewAsset, placeholderQrDataUrl } from './previewAssets';
import { fieldDefaultValue, fieldLabel, trimSuggestion } from './selectionRules';
import { uiText } from '../ui/text';

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
        return [field.id, trimSuggestion(fieldDefaultValue(field, index, useCase), field.max_length)];
      }),
  );

  const assets: ProofFixture['assets'] = {};
  template.fields.forEach((field, index) => {
    if (field.type === 'logo' || field.type === 'image') {
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
  }, [qrFieldId, qrValue]);

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
            <p className="template-detail__group-title">{uiText.selection.preview.liveTitle}</p>
            {onToggleExpanded ? (
              <button type="button" className="template-field__reset" onClick={onToggleExpanded}>
                {expanded ? uiText.selection.preview.collapse : uiText.selection.preview.expand}
              </button>
            ) : null}
          </div>
          {proofFixture ? (
            <div className={`template-live-preview__stage${expanded ? ' template-live-preview__stage--expanded' : ''}`}>
              {qrLoading ? <p className="template-live-preview__loading">{uiText.selection.preview.loading}</p> : null}
              <DesignRenderer fixture={proofFixture} validationIssues={validationIssues} />
            </div>
          ) : (
            <p className="template-field__hint">{uiText.selection.preview.liveHint}</p>
          )}
          <p className="template-live-preview__note">
            {uiText.selection.preview.note}
          </p>
        </>
      ) : null}
      {showMockup && proofFixture ? (
        <div className="template-mockup">
          <p className="template-detail__group-title">{uiText.selection.preview.mockupTitle}</p>
          <div className="template-mockup__frame">
            <DesignRenderer fixture={proofFixture} validationIssues={validationIssues} />
          </div>
        </div>
      ) : null}
      {qrField && !qrPreview ? <p className="template-field__hint">{qrError ?? uiText.selection.preview.qrPlaceholder}</p> : null}
    </div>
  );
}
