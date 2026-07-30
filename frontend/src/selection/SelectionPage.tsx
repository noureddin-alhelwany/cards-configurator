import { useEffect, useMemo, useState } from 'react';
import type {
  ProductDefinition,
  RegistryBundle,
  ImageElementDefinition,
  TemplateDefinition,
  TemplateVariantDefinition,
  UseCaseDefinition,
} from '../registries/types';
import type { DraftState, TemplateSelectionRequest } from '../drafts/types';
import type { ElementAdjustment, ProofFixture, ValidationIssue } from '../design/types';
import DesignRenderer from '../design/DesignRenderer';
import './SelectionPage.css';

type HealthState = 'loading' | 'ok' | 'offline';

type LoadedState = {
  bundle: RegistryBundle | null;
  health: HealthState;
  error: string | null;
  draft: DraftState | null;
};

type DraftLayoutValues = {
  text_values: Record<string, string>;
  asset_values: Record<string, string>;
  element_adjustments: Record<string, ElementAdjustment>;
};

type QualityReport = {
  issues: ValidationIssue[];
  blocking: boolean;
};

const DEFAULT_ELEMENT_ADJUSTMENT: ElementAdjustment = {
  offset_x: 0,
  offset_y: 0,
  scale: 1,
};

function templateKey(template: TemplateDefinition) {
  return `${template.id}@${template.version}`;
}

function activeVariant(template: TemplateDefinition, variantId: string | null) {
  return (
    template.variants.find((variant) => variant.active && variant.id === variantId) ??
    template.variants.find((variant) => variant.active) ??
    null
  );
}

function templatePreviewAsset(template: TemplateDefinition, variantId: string | null) {
  const variant = activeVariant(template, variantId);
  return variant?.preview_asset ?? template.preview_asset ?? 'a6_preview.png';
}

function layoutValuesFromState(layoutState: DraftState['layout_state']): DraftLayoutValues {
  return {
    text_values: layoutState.text_values,
    asset_values: layoutState.asset_values,
    element_adjustments: layoutState.element_adjustments,
  };
}

function assetElementForField(template: TemplateDefinition, fieldId: string): ImageElementDefinition | null {
  return (template.elements.find(
    (element): element is ImageElementDefinition => element.kind === 'image' && element.asset_key === fieldId,
  ) ?? null) as ImageElementDefinition | null;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function defaultAdjustmentsForTemplate(template: TemplateDefinition) {
  return Object.fromEntries(
    template.elements
      .filter((element): element is ImageElementDefinition => element.kind === 'image')
      .map((element) => [
        element.id,
        {
          offset_x: 0,
          offset_y: 0,
          scale: 1,
        } satisfies ElementAdjustment,
      ]),
  ) as Record<string, ElementAdjustment>;
}

async function loadRegistries(): Promise<RegistryBundle> {
  const response = await fetch('/api/registries');
  if (!response.ok) {
    throw new Error(`Failed to load registries: ${response.status}`);
  }
  return (await response.json()) as RegistryBundle;
}

async function loadCurrentDraft(): Promise<DraftState> {
  const response = await fetch('/api/drafts/current');
  if (!response.ok) {
    throw new Error(`Failed to load current draft: ${response.status}`);
  }
  return (await response.json()) as DraftState;
}

async function saveTemplateSelection(selection: TemplateSelectionRequest): Promise<DraftState> {
  const response = await fetch('/api/drafts/current/template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(selection),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to save template selection: ${response.status}`);
  }
  return (await response.json()) as DraftState;
}

async function saveLayoutValues(values: {
  variant_id?: string | null;
  text_values?: Record<string, string>;
  asset_values?: Record<string, string>;
  element_adjustments?: Record<string, ElementAdjustment>;
}): Promise<DraftState> {
  const response = await fetch('/api/drafts/current/layout', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to save layout values: ${response.status}`);
  }
  return (await response.json()) as DraftState;
}

type AssetResponse = {
  id: string;
  preview_data_url: string;
  width_px: number | null;
  height_px: number | null;
  mime_type: string;
};

async function uploadAsset(kind: 'logo' | 'image', file: File): Promise<AssetResponse> {
  const response = await fetch(
    `/api/assets?kind=${encodeURIComponent(kind)}&filename=${encodeURIComponent(file.name)}&mime_type=${encodeURIComponent(file.type)}`,
    {
      method: 'POST',
      body: file,
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to upload asset: ${response.status}`);
  }
  return (await response.json()) as AssetResponse;
}

async function loadQrPreview(value: string): Promise<{ value: string; data_url: string }> {
  const response = await fetch(`/api/qr?value=${encodeURIComponent(value)}`);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to load QR preview: ${response.status}`);
  }
  return (await response.json()) as { value: string; data_url: string };
}

async function loadValidationReport(): Promise<QualityReport> {
  const response = await fetch('/api/drafts/current/validation');
  if (!response.ok) {
    throw new Error(`Failed to load validation report: ${response.status}`);
  }
  return (await response.json()) as QualityReport;
}

function useRegistrySelection() {
  const [state, setState] = useState<LoadedState>({
    bundle: null,
    health: 'loading',
    error: null,
    draft: null,
  });
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [layoutValues, setLayoutValues] = useState<DraftLayoutValues>({
    text_values: {},
    asset_values: {},
    element_adjustments: {},
  });

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch('/api/healthz')
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error('unhealthy'))))
        .then((body: { status?: string }) => (body.status === 'ok' ? 'ok' : 'offline'))
        .catch(() => 'offline' as const),
      loadRegistries(),
      loadCurrentDraft(),
    ])
      .then(([health, bundle, draft]) => {
        if (!active) {
          return;
        }
        setState({ bundle, health, error: null, draft });
        const firstUseCase = bundle.use_cases.find((useCase) => useCase.active);
        const firstProduct = bundle.products.find((product) => product.active);
        setSelectedUseCaseId(draft.use_case_id ?? firstUseCase?.id ?? null);
        setSelectedProductId(draft.product_id ?? firstProduct?.id ?? null);
        setSelectedTemplateKey(
          draft.template_id && draft.template_version ? `${draft.template_id}@${draft.template_version}` : null,
        );
        setSelectedVariantId(draft.layout_state.variant_id || null);
        setLayoutValues(layoutValuesFromState(draft.layout_state));
      })
      .catch((exception: unknown) => {
        if (active) {
          setState({
            bundle: null,
            health: 'offline',
            draft: null,
            error: exception instanceof Error ? exception.message : 'Unknown registry error',
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    state,
    selectedUseCaseId,
    setSelectedUseCaseId,
    selectedProductId,
    setSelectedProductId,
    selectedTemplateKey,
    setSelectedTemplateKey,
    selectedVariantId,
    setSelectedVariantId,
    layoutValues,
    setLayoutValues,
  };
}

function assetPath(asset: string) {
  return `/preview-assets/${asset}`;
}

function visibleProducts(bundle: RegistryBundle): ProductDefinition[] {
  return bundle.products.filter((product) => product.active);
}

function visibleTemplates(bundle: RegistryBundle, selectedUseCaseId: string | null): TemplateDefinition[] {
  if (!selectedUseCaseId) {
    return bundle.templates.filter((template) => template.active);
  }

  return bundle.templates.filter(
    (template) => template.active && template.use_case_ids.includes(selectedUseCaseId),
  );
}

function visibleProductUseCaseNames(bundle: RegistryBundle, productId: string): string[] {
  const useCaseIds = new Set<string>();
  bundle.templates
    .filter((template) => template.active && template.product_id === productId)
    .forEach((template) => template.use_case_ids.forEach((useCaseId) => useCaseIds.add(useCaseId)));

  return bundle.use_cases
    .filter((useCase) => useCaseIds.has(useCase.id) && useCase.active)
    .map((useCase) => useCase.name);
}

function ProductCard({
  product,
  selected,
  onSelect,
  useCaseNames,
}: {
  product: ProductDefinition;
  selected: boolean;
  onSelect: (id: string) => void;
  useCaseNames: string[];
}) {
  return (
    <button
      type="button"
      className={`product-card${selected ? ' product-card--selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(product.id)}
    >
      <span className="product-card__status">{selected ? 'Ausgewählt' : 'Produkt'}</span>
      <img className="product-card__image" src={assetPath(product.preview_asset)} alt="" />
      <div className="product-card__body">
        <h3>{product.name}</h3>
        <p className="product-card__format">
          {product.trim_width_mm} × {product.trim_height_mm} mm, {product.bleed_mm} mm Beschnitt
        </p>
        <p className="product-card__meta">
          DPI {product.minimum_dpi} / {product.warning_dpi} / {product.recommended_dpi}
        </p>
        <p className="product-card__meta">{useCaseNames.length} passende Use Cases</p>
      </div>
    </button>
  );
}

function templateAssetPath(template: TemplateDefinition, product: ProductDefinition | null) {
  if (template.preview_asset) {
    return assetPath(template.preview_asset);
  }
  if (product) {
    return assetPath(product.preview_asset);
  }
  return assetPath('a6_preview.png');
}

function UseCaseCard({
  useCase,
  selected,
  onSelect,
}: {
  useCase: UseCaseDefinition;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`use-case-card${selected ? ' use-case-card--selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(useCase.id)}
    >
      <img className="use-case-card__image" src={assetPath(useCase.preview_asset)} alt="" />
      <div className="use-case-card__body">
        <p className="use-case-card__eyebrow">Use case</p>
        <h3>{useCase.name}</h3>
        <p>{useCase.description}</p>
      </div>
    </button>
  );
}

function TemplateCard({
  template,
  product,
  selected,
  onSelect,
}: {
  template: TemplateDefinition;
  product: ProductDefinition | null;
  selected: boolean;
  onSelect: (template: TemplateDefinition) => void;
}) {
  return (
    <button
      type="button"
      className={`template-card${selected ? ' template-card--selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(template)}
    >
      <img
        className="template-card__image"
        src={templateAssetPath(template, product)}
        alt={template.name ?? template.id}
      />
      <div className="template-card__body">
        <p className="template-card__eyebrow">Template</p>
        <h3>
          {template.name ?? template.id} <span>@{template.version}</span>
        </h3>
        <p>
          Produkt {template.product_id}, {template.use_case_ids.length} Use Cases
        </p>
      </div>
    </button>
  );
}

function TemplateVariantButtons({
  template,
  selectedVariantId,
  onSelect,
}: {
  template: TemplateDefinition;
  selectedVariantId: string | null;
  onSelect: (variant: TemplateVariantDefinition) => void;
}) {
  const activeVariants = template.variants.filter((variant) => variant.active);

  if (activeVariants.length === 0) {
    return null;
  }

  return (
    <div className="template-variant-row" role="tablist" aria-label="Layoutvarianten">
      {activeVariants.map((variant) => (
        <button
          key={variant.id}
          type="button"
          role="tab"
          aria-selected={variant.id === selectedVariantId}
          className={`template-variant-pill${variant.id === selectedVariantId ? ' template-variant-pill--selected' : ''}`}
          onClick={() => onSelect(variant)}
        >
          {variant.name}
        </button>
      ))}
    </div>
  );
}

function TemplateFieldsList({
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
}: {
  template: TemplateDefinition;
  product: ProductDefinition;
  layoutValues: DraftLayoutValues;
  assetPreviews: Record<string, string>;
  assetDetails: Record<string, { width_px: number | null; height_px: number | null; mime_type: string; preview_data_url: string }>;
  assetErrors: Record<string, string | null>;
  validationIssues: ValidationIssue[];
  onTextChange: (fieldId: string, value: string) => void;
  onAssetChange: (fieldId: string, kind: 'logo' | 'image', file: File | null) => void;
  onAssetAdjustmentChange: (fieldId: string, adjustment: ElementAdjustment) => void;
  onAssetAdjustmentReset: (fieldId: string) => void;
}) {
  return (
    <div className="template-fields">
      {template.fields.map((field) => {
        const commonLabel = (
          <div className="template-field__meta">
            <span className="template-field__type">{field.type}</span>
            {field.required ? <span className="template-field__required">Pflicht</span> : <span className="template-field__optional">Optional</span>}
          </div>
        );

        if (field.type === 'text' || field.type === 'url') {
          const value = layoutValues.text_values[field.id] ?? '';
          const remainingCharacters = field.max_length === null ? null : field.max_length - value.length;
          return (
            <label key={field.id} className="template-field">
              <div className="template-field__header">
                <span className="template-field__label">{field.id}</span>
                {commonLabel}
              </div>
              {field.type === 'url' ? (
                <input
                  type="text"
                  inputMode="url"
                  aria-label={field.id}
                  value={value}
                  maxLength={field.max_length ?? undefined}
                  onChange={(event) => onTextChange(field.id, event.target.value)}
                />
              ) : (
                <textarea
                  aria-label={field.id}
                  value={value}
                  rows={field.max_lines ?? 1}
                  maxLength={field.max_length ?? undefined}
                  onChange={(event) => onTextChange(field.id, event.target.value)}
                />
              )}
              {field.max_length !== null ? (
                <p className="template-field__hint">
                  Max. {field.max_length} Zeichen
                  {remainingCharacters !== null ? ` · ${remainingCharacters} Zeichen verbleibend` : ''}
                </p>
              ) : null}
              {field.max_lines !== null ? (
                <p className="template-field__hint">Max. {field.max_lines} Zeilen</p>
              ) : null}
            </label>
          );
        }

        const assetValue = layoutValues.asset_values[field.id] ?? '';
        const assetPreview = assetPreviews[field.id] ?? (assetValue.startsWith('data:') ? assetValue : '');
        const assetDetail = assetDetails[field.id] ?? null;
        const assetElement = assetElementForField(template, field.id);
        const assetAdjustment = assetElement
          ? layoutValues.element_adjustments[assetElement.id] ?? DEFAULT_ELEMENT_ADJUSTMENT
          : DEFAULT_ELEMENT_ADJUSTMENT;
        const fieldIssue = validationIssues.find((issue) => issue.path === field.id) ?? null;
        const effectiveDpi =
          assetElement && assetDetail?.width_px
            ? assetDetail.width_px / ((assetElement.box_mm.width_mm * assetAdjustment.scale) / 25.4)
            : null;
        const dpiLabel =
          effectiveDpi === null
            ? null
            : effectiveDpi < product.minimum_dpi
              ? `Effektive DPI ${effectiveDpi.toFixed(0)} unter Minimum ${product.minimum_dpi}`
              : effectiveDpi < product.warning_dpi
                ? `Effektive DPI ${effectiveDpi.toFixed(0)} unter Warnschwelle ${product.warning_dpi}`
                : `Effektive DPI ${effectiveDpi.toFixed(0)} / empfohlen ${product.recommended_dpi}`;
        return (
          <div key={field.id} className={`template-field${fieldIssue ? ` template-field--issue template-field--issue--${fieldIssue.severity}` : ''}`}>
            <div className="template-field__header">
              <span className="template-field__label">{field.id}</span>
              {commonLabel}
            </div>
            <input
              type="file"
              aria-label={field.id}
              accept={field.type === 'logo' || field.type === 'image' ? 'image/png,image/jpeg,image/svg+xml' : undefined}
              onChange={(event) => onAssetChange(field.id, field.type === 'logo' ? 'logo' : 'image', event.target.files?.[0] ?? null)}
            />
            {assetPreview ? (
              <div className="template-field__preview">
                <img src={assetPreview} alt={`${field.id} Vorschau`} />
              </div>
            ) : assetValue ? (
              <p className="template-field__hint">Asset gespeichert: {assetValue}</p>
            ) : (
              <p className="template-field__hint">Datei noch nicht gewählt</p>
            )}
            {dpiLabel ? <p className="template-field__hint">{dpiLabel}</p> : null}
            {assetErrors[field.id] ? <p className="template-field__error">{assetErrors[field.id]}</p> : null}
            {fieldIssue ? <p className="template-field__error">{fieldIssue.message}</p> : null}
            {assetElement ? (
              <div className="template-field__transform">
                <label className="template-field__control">
                  <span>Verschiebung X</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    aria-label={`${field.id} verschiebung x`}
                    value={assetAdjustment.offset_x}
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
                    aria-label={`${field.id} verschiebung y`}
                    value={assetAdjustment.offset_y}
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
                    aria-label={`${field.id} skalierung`}
                    value={assetAdjustment.scale}
                    onChange={(event) =>
                      onAssetAdjustmentChange(field.id, {
                        ...assetAdjustment,
                        scale: clamp(Number(event.target.value), assetElement.min_scale, assetElement.max_scale),
                      })
                    }
                  />
                  <output>{assetAdjustment.scale.toFixed(2)}</output>
                </label>
                <button type="button" className="template-field__reset" onClick={() => onAssetAdjustmentReset(field.id)}>
                  Zurücksetzen
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function buildProofAssets(
  template: TemplateDefinition,
  assetPreviews: Record<string, string>,
  qrPreview: { value: string; data_url: string } | null,
): ProofFixture['assets'] {
  const assets: ProofFixture['assets'] = {};

  template.fields
    .filter((field) => field.type === 'logo' || field.type === 'image')
    .forEach((field) => {
      const previewDataUrl = assetPreviews[field.id];
      if (!previewDataUrl) {
        return;
      }
      assets[field.id] = {
        mime_type: previewDataUrl.startsWith('data:image/svg+xml') ? 'image/svg+xml' : 'image/png',
        data_url: previewDataUrl,
      };
    });

  if (qrPreview) {
    assets.qr = {
      mime_type: 'image/svg+xml',
      data_url: qrPreview.data_url,
    };
  }

  return assets;
}

function buildProofFixture(
  template: TemplateDefinition,
  product: ProductDefinition,
  useCase: UseCaseDefinition,
  selectedVariantId: string | null,
  layoutValues: DraftLayoutValues,
  assetPreviews: Record<string, string>,
  qrPreview: { value: string; data_url: string } | null,
): ProofFixture {
  return {
    template,
    product,
    use_case: useCase,
    layout_state: {
      variant_id: selectedVariantId ?? template.variants.find((variant) => variant.active)?.id ?? '',
      element_adjustments: layoutValues.element_adjustments,
      text_values: layoutValues.text_values,
      asset_values: layoutValues.asset_values,
    },
    assets: buildProofAssets(template, assetPreviews, qrPreview),
  };
}

function TemplateLivePreview({
  template,
  product,
  useCase,
  selectedVariantId,
  layoutValues,
  assetPreviews,
  validationIssues,
}: {
  template: TemplateDefinition;
  product: ProductDefinition;
  useCase: UseCaseDefinition;
  selectedVariantId: string | null;
  layoutValues: DraftLayoutValues;
  assetPreviews: Record<string, string>;
  validationIssues: ValidationIssue[];
}) {
  const [qrPreview, setQrPreview] = useState<{ value: string; data_url: string } | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const previewFields = template.fields.filter((field) => field.type === 'text' || field.type === 'url');
  const qrField = template.fields.find((field) => field.type === 'url') ?? null;
  const qrFieldId = qrField?.id ?? null;
  const qrValue = qrFieldId ? layoutValues.text_values[qrFieldId] ?? '' : '';

  useEffect(() => {
    let active = true;

    if (!qrFieldId || qrValue.trim() === '') {
      setQrPreview(null);
      setQrError(null);
      return () => {
        active = false;
      };
    }

    loadQrPreview(qrValue)
      .then((preview) => {
        if (active) {
          setQrPreview(preview);
          setQrError(null);
        }
      })
      .catch((exception: unknown) => {
        if (active) {
          setQrPreview(null);
          setQrError(exception instanceof Error ? exception.message : 'QR konnte nicht geladen werden');
        }
      });

    return () => {
      active = false;
    };
  }, [qrFieldId, qrValue]);

  const hasPreviewContent =
    previewFields.length > 0 || qrField !== null || template.fields.some((field) => field.type === 'logo' || field.type === 'image');

  if (!hasPreviewContent) {
    return null;
  }

  const proofFixture = template.elements.length > 0 ? buildProofFixture(template, product, useCase, selectedVariantId, layoutValues, assetPreviews, qrPreview) : null;

  return (
    <div className="template-live-preview">
      <p className="template-detail__group-title">Live-Vorschau</p>
      {proofFixture ? (
        <div className="template-live-preview__stage">
          <DesignRenderer fixture={proofFixture} validationIssues={validationIssues} />
        </div>
      ) : (
        <p className="template-field__hint">Live-Vorschau nutzt gerenderte Template-Elemente, sobald sie verfügbar sind.</p>
      )}
      <dl className="template-live-preview__grid">
        {previewFields.map((field) => (
          <div key={field.id} className="template-live-preview__item">
            <dt>{field.id}</dt>
            <dd className="template-live-preview__value">{layoutValues.text_values[field.id] ?? 'Leer'}</dd>
          </div>
        ))}
      </dl>
      {proofFixture ? (
        <div className="template-mockup">
          <p className="template-detail__group-title">Produkt-Mockup</p>
          <div className="template-mockup__frame">
            <DesignRenderer fixture={proofFixture} validationIssues={validationIssues} />
          </div>
        </div>
      ) : null}
      {qrField && !qrPreview ? <p className="template-field__hint">{qrError ?? 'QR-Vorschau erscheint nach URL-Eingabe'}</p> : null}
    </div>
  );
}

export default function SelectionPage() {
  const {
    state,
    selectedUseCaseId,
    setSelectedUseCaseId,
    selectedProductId,
    setSelectedProductId,
    selectedTemplateKey,
    setSelectedTemplateKey,
    selectedVariantId,
    setSelectedVariantId,
    layoutValues,
    setLayoutValues,
  } = useRegistrySelection();
  const bundle = state.bundle;

  const selectedUseCase = useMemo(
    () => bundle?.use_cases.find((useCase) => useCase.id === selectedUseCaseId) ?? null,
    [bundle, selectedUseCaseId],
  );
  const selectedProduct = useMemo(
    () => bundle?.products.find((product) => product.id === selectedProductId) ?? null,
    [bundle, selectedProductId],
  );
  const selectedTemplate = useMemo(
    () =>
      bundle?.templates.find((template) => templateKey(template) === selectedTemplateKey) ?? null,
    [bundle, selectedTemplateKey],
  );
  const selectedVariant = useMemo(
    () => (selectedTemplate ? activeVariant(selectedTemplate, selectedVariantId) : null),
    [selectedTemplate, selectedVariantId],
  );
  const selectedTemplatePreview = useMemo(
    () => (selectedTemplate ? templatePreviewAsset(selectedTemplate, selectedVariantId) : null),
    [selectedTemplate, selectedVariantId],
  );
  const [assetPreviews, setAssetPreviews] = useState<Record<string, string>>({});
  const [assetDetails, setAssetDetails] = useState<
    Record<string, { width_px: number | null; height_px: number | null; mime_type: string; preview_data_url: string }>
  >({});
  const [assetErrors, setAssetErrors] = useState<Record<string, string | null>>({});
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);

  const matchingProducts = useMemo(() => (bundle ? visibleProducts(bundle) : []), [bundle]);
  const matchingTemplates = useMemo(
    () =>
      bundle
        ? visibleTemplates(bundle, selectedUseCaseId).filter(
            (template) => !selectedProductId || template.product_id === selectedProductId,
          )
        : [],
    [bundle, selectedProductId, selectedUseCaseId],
  );
  const productById = useMemo(
    () => new Map(bundle?.products.map((product) => [product.id, product] as const) ?? []),
    [bundle],
  );

  useEffect(() => {
    if (!bundle || matchingProducts.length === 0) {
      return;
    }
    if (!selectedProductId) {
      setSelectedProductId(matchingProducts[0].id);
    }
  }, [bundle, matchingProducts, selectedProductId, setSelectedProductId]);

  useEffect(() => {
    if (!bundle) {
      return;
    }
    if (!selectedTemplateKey) {
      return;
    }
    if (matchingTemplates.some((template) => templateKey(template) === selectedTemplateKey)) {
      return;
    }
    setSelectedTemplateKey(null);
  }, [bundle, matchingTemplates, selectedTemplateKey, setSelectedTemplateKey]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    if (selectedVariant && selectedVariant.active) {
      return;
    }
    const firstVariant = selectedTemplate.variants.find((variant) => variant.active) ?? null;
    setSelectedVariantId(firstVariant?.id ?? null);
  }, [selectedTemplate, selectedVariant, setSelectedVariantId]);

  useEffect(() => {
    const assetEntries = Object.entries(layoutValues.asset_values).filter(
      ([fieldId, assetId]) => assetId && !assetId.startsWith('data:') && !assetPreviews[fieldId],
    );
    if (assetEntries.length === 0) {
      return;
    }

    let active = true;
    Promise.all(
      assetEntries.map(async ([fieldId, assetId]) => {
        const response = await fetch(`/api/assets/${encodeURIComponent(assetId)}`);
        if (!response.ok) {
          return null;
        }
        const asset = (await response.json()) as AssetResponse;
        return [fieldId, asset] as const;
      }),
    )
      .then((entries) => {
        if (!active) {
          return;
        }
        const hydratedPreviews = Object.fromEntries(
          entries.filter((entry): entry is readonly [string, AssetResponse] => entry !== null).map(([fieldId, asset]) => [fieldId, asset.preview_data_url] as const),
        );
        const hydratedDetails = Object.fromEntries(entries.filter((entry): entry is readonly [string, AssetResponse] => entry !== null));
        if (Object.keys(hydratedPreviews).length > 0) {
          setAssetPreviews((current) => ({ ...current, ...hydratedPreviews }));
          setAssetDetails((current) => ({ ...current, ...hydratedDetails }));
        }
      })
      .catch(() => {
        // Ignore preview hydration errors; the asset metadata still persists.
      });

    return () => {
      active = false;
    };
  }, [assetPreviews, layoutValues.asset_values]);

  useEffect(() => {
    let active = true;

    loadValidationReport()
      .then((report) => {
        if (active) {
          setQualityReport(report);
          setQualityError(null);
        }
      })
      .catch((exception: unknown) => {
        if (active) {
          setQualityReport(null);
          setQualityError(exception instanceof Error ? exception.message : 'Qualitätsprüfung fehlgeschlagen');
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTemplateKey, layoutValues, selectedVariantId]);

  async function handleTemplateSelect(template: TemplateDefinition) {
    if (!selectedUseCaseId || !selectedProductId) {
      return;
    }
    const fallbackVariant =
      template.variants.find((variant) => variant.active && variant.id === selectedVariantId) ??
      template.variants.find((variant) => variant.active) ??
      null;
    const response = await saveTemplateSelection({
      use_case_id: selectedUseCaseId,
      product_id: selectedProductId,
      template_id: template.id,
      template_version: template.version,
      variant_id: fallbackVariant?.id ?? null,
    });
    setSelectedTemplateKey(
      response.template_id && response.template_version ? `${response.template_id}@${response.template_version}` : null,
    );
    setSelectedVariantId(response.variant_id ?? response.layout_state.variant_id ?? fallbackVariant?.id ?? null);
    setLayoutValues(layoutValuesFromState(response.layout_state));
  }

  async function handleVariantSelect(variant: TemplateVariantDefinition) {
    if (!selectedTemplate) {
      return;
    }
    const response = await saveLayoutValues({ variant_id: variant.id });
    setSelectedVariantId(response.layout_state.variant_id || variant.id);
    setLayoutValues(layoutValuesFromState(response.layout_state));
  }

  async function handleTextFieldChange(fieldId: string, value: string) {
    const response = await saveLayoutValues({ text_values: { [fieldId]: value } });
    setLayoutValues(layoutValuesFromState(response.layout_state));
  }

  async function handleAssetFieldChange(fieldId: string, kind: 'logo' | 'image', file: File | null) {
    if (!file) {
      return;
    }
    try {
      const uploadedAsset = await uploadAsset(kind, file);
      const response = await saveLayoutValues({ asset_values: { [fieldId]: uploadedAsset.id } });
      setAssetErrors((current) => ({ ...current, [fieldId]: null }));
      setAssetPreviews((current) => ({
        ...current,
        [fieldId]: uploadedAsset.preview_data_url,
      }));
      setAssetDetails((current) => ({
        ...current,
        [fieldId]: uploadedAsset,
      }));
      setLayoutValues(layoutValuesFromState(response.layout_state));
    } catch (exception: unknown) {
      setAssetErrors((current) => ({
        ...current,
        [fieldId]: exception instanceof Error ? exception.message : 'Upload fehlgeschlagen',
      }));
    }
  }

  async function handleAssetAdjustmentChange(fieldId: string, adjustment: ElementAdjustment) {
    if (!selectedTemplate) {
      return;
    }
    const assetElement = assetElementForField(selectedTemplate, fieldId);
    if (!assetElement) {
      return;
    }
    const response = await saveLayoutValues({
      element_adjustments: {
        [assetElement.id]: {
          offset_x: clamp(adjustment.offset_x, -1, 1),
          offset_y: clamp(adjustment.offset_y, -1, 1),
          scale: clamp(adjustment.scale, assetElement.min_scale, assetElement.max_scale),
        },
      },
    });
    setLayoutValues(layoutValuesFromState(response.layout_state));
  }

  async function handleAssetAdjustmentReset(fieldId: string) {
    await handleAssetAdjustmentChange(fieldId, DEFAULT_ELEMENT_ADJUSTMENT);
  }

  async function handleLayoutReset() {
    if (!selectedTemplate) {
      return;
    }
    const response = await saveLayoutValues({ element_adjustments: defaultAdjustmentsForTemplate(selectedTemplate) });
    setLayoutValues(layoutValuesFromState(response.layout_state));
  }

  if (state.error) {
    return (
      <main className="selection-shell selection-shell--error">
        <section className="selection-panel">
          <p className="selection-kicker">Internal bootstrap</p>
          <h1>Cards Configurator</h1>
          <p className="selection-error">{state.error}</p>
        </section>
      </main>
    );
  }

  if (!bundle) {
    return (
      <main className="selection-shell">
        <section className="selection-panel">
          <p className="selection-kicker">Loading registries</p>
          <h1>Cards Configurator</h1>
        </section>
      </main>
    );
  }

  const validationIssues = qualityReport?.issues ?? [];
  const blockingIssues = validationIssues.filter((issue) => issue.blocking);

  return (
    <main className="selection-shell">
      <section className="selection-panel">
        <div className="selection-hero">
          <div>
            <p className="selection-kicker">Produkt und Anwendungsfall</p>
            <h1>Cards Configurator</h1>
            <p className="selection-lede">
              Wähle einen Anwendungsfall, damit nur passende Produkte und Templates angezeigt werden.
            </p>
            <p className="selection-summary" aria-live="polite">
              Auswahl: {selectedUseCase?.name ?? 'kein Use case'} / {selectedProduct?.name ?? 'kein Produkt'} /
              {selectedTemplate?.name ?? selectedTemplate?.id ?? 'kein Template'}
            </p>
          </div>
          <dl className="status-card">
            <div>
              <dt>Backend</dt>
              <dd>{state.health}</dd>
            </div>
            <div>
              <dt>Use case</dt>
              <dd>{selectedUseCase?.name ?? 'None'}</dd>
            </div>
            <div>
              <dt>Product</dt>
              <dd>{selectedProduct?.name ?? 'None'}</dd>
            </div>
            <div>
              <dt>Template</dt>
              <dd>{selectedTemplate ? `${selectedTemplate.name ?? selectedTemplate.id} @ ${selectedTemplate.version}` : 'None'}</dd>
            </div>
          </dl>
        </div>

        <section className="selection-section">
          <div className="selection-section__heading">
            <h2>Anwendungsfälle</h2>
            <p>{bundle.use_cases.filter((useCase) => useCase.active).length} aktive Auswahlmöglichkeiten</p>
          </div>
          <div className="use-case-grid">
            {bundle.use_cases
              .filter((useCase) => useCase.active)
              .map((useCase) => (
                <UseCaseCard
                  key={useCase.id}
                  useCase={useCase}
                  selected={useCase.id === selectedUseCaseId}
                  onSelect={setSelectedUseCaseId}
                />
              ))}
          </div>
        </section>

        <div className="selection-columns">
          <section className="selection-section">
            <div className="selection-section__heading">
              <h2>Passende Produkte</h2>
              <p>{matchingProducts.length} Einträge</p>
            </div>
            <div className="product-grid">
              {matchingProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={product.id === selectedProductId}
                  onSelect={setSelectedProductId}
                  useCaseNames={visibleProductUseCaseNames(bundle, product.id)}
                />
              ))}
            </div>
            {selectedProduct ? (
              <article className="product-detail">
                <p className="product-detail__eyebrow">Selected product</p>
                <h3>{selectedProduct.name}</h3>
                <dl className="product-detail__grid">
                  <div>
                    <dt>Format</dt>
                    <dd>
                      {selectedProduct.trim_width_mm} × {selectedProduct.trim_height_mm} mm
                    </dd>
                  </div>
                  <div>
                    <dt>Bleed</dt>
                    <dd>{selectedProduct.bleed_mm} mm</dd>
                  </div>
                  <div>
                    <dt>DPI</dt>
                    <dd>
                      {selectedProduct.minimum_dpi} / {selectedProduct.warning_dpi} / {selectedProduct.recommended_dpi}
                    </dd>
                  </div>
                  <div>
                    <dt>QR min</dt>
                    <dd>
                      {selectedProduct.qr_min_width_mm} mm, {selectedProduct.qr_min_module_mm} mm
                    </dd>
                  </div>
                </dl>
              </article>
            ) : null}
          </section>

          <section className="selection-section">
            <div className="selection-section__heading">
              <h2>Passende Templates</h2>
              <p>{matchingTemplates.length} Einträge</p>
            </div>
            <div className="template-grid">
              {matchingTemplates.length > 0 ? (
                matchingTemplates.map((template) => (
                  <TemplateCard
                    key={templateKey(template)}
                    template={template}
                    product={productById.get(template.product_id) ?? null}
                    selected={templateKey(template) === selectedTemplateKey}
                    onSelect={handleTemplateSelect}
                  />
                ))
              ) : (
                <p className="template-grid__empty">Für diese Auswahl sind aktuell keine Templates aktiv.</p>
              )}
            </div>

            {selectedTemplate && selectedProduct && selectedUseCase ? (
              <article className="template-detail">
                <p className="template-detail__eyebrow">Selected template</p>
                <h3>
                  {selectedTemplate.name ?? selectedTemplate.id} <span>@{selectedTemplate.version}</span>
                </h3>
                <div className="template-detail__actions">
                  <button type="button" className="template-field__reset" onClick={handleLayoutReset}>
                    Layout zurücksetzen
                  </button>
                  <button type="button" className="template-field__reset" disabled={blockingIssues.length > 0}>
                    Design freigeben
                  </button>
                </div>
                <p className="template-detail__meta">
                  Produkt {selectedTemplate.product_id}, {selectedTemplate.use_case_ids.length} Use Cases,{' '}
                  {selectedTemplate.fields.length} Felder
                </p>
                {qualityError ? <p className="template-field__error">{qualityError}</p> : null}
                {validationIssues.length > 0 ? (
                  <div className="template-quality">
                    <p className="template-detail__group-title">Qualitätsprüfung</p>
                    <ul className="template-quality__list">
                      {validationIssues.map((issue) => (
                        <li key={`${issue.path}-${issue.code}`} className={`template-quality__item template-quality__item--${issue.severity}`}>
                          <strong>{issue.path}</strong>
                          <span>{issue.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="template-detail__preview">
                  <img
                    src={assetPath(selectedTemplatePreview ?? 'a6_preview.png')}
                    alt={selectedVariant ? `${selectedTemplate.name ?? selectedTemplate.id} - ${selectedVariant.name}` : selectedTemplate.name ?? selectedTemplate.id}
                  />
                </div>
                <TemplateLivePreview
                  template={selectedTemplate}
                  product={selectedProduct}
                  useCase={selectedUseCase}
                  selectedVariantId={selectedVariantId}
                  layoutValues={layoutValues}
                  assetPreviews={assetPreviews}
                  validationIssues={validationIssues}
                />
                <div className="template-detail__group">
                  <p className="template-detail__group-title">Layoutvarianten</p>
                  <TemplateVariantButtons
                    template={selectedTemplate}
                    selectedVariantId={selectedVariantId}
                    onSelect={handleVariantSelect}
                  />
                </div>
                <div className="template-detail__group">
                  <p className="template-detail__group-title">Felder geladen</p>
                  <TemplateFieldsList
                    template={selectedTemplate}
                    product={selectedProduct}
                    layoutValues={layoutValues}
                    assetPreviews={assetPreviews}
                    assetDetails={assetDetails}
                    assetErrors={assetErrors}
                    validationIssues={validationIssues}
                    onTextChange={handleTextFieldChange}
                    onAssetChange={handleAssetFieldChange}
                    onAssetAdjustmentChange={handleAssetAdjustmentChange}
                    onAssetAdjustmentReset={handleAssetAdjustmentReset}
                  />
                </div>
              </article>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
