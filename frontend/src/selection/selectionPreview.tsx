import { useEffect, useState } from 'react';
import type { ProductDefinition, TemplateDefinition, UseCaseDefinition } from '../registries/types';
import type { ElementAdjustment, ProofFixture, ValidationIssue } from '../design/types';
import DesignRenderer from '../design/DesignRenderer';
import { defaultAdjustmentsForTemplate } from './selectionHelpers';
import { demoTextForRole, fieldLabel, fieldRole, trimSuggestion } from './selectionRules';

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
          <p className="template-live-preview__note">
            Änderungen an Texten, Medien und Varianten erscheinen direkt in derselben Vorschau wie später im Druck.
          </p>
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
