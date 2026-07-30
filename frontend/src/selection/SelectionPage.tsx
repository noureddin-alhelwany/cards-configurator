import { useEffect, useMemo, useState } from 'react';
import type {
  ProductDefinition,
  RegistryBundle,
  TemplateDefinition,
  TemplateVariantDefinition,
  UseCaseDefinition,
} from '../registries/types';
import type { DraftState, TemplateSelectionRequest } from '../drafts/types';
import type { ProofFixture } from '../design/types';
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

async function uploadAsset(kind: 'logo' | 'image', file: File): Promise<{ id: string; preview_data_url: string }> {
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
  return (await response.json()) as { id: string; preview_data_url: string };
}

async function loadQrPreview(value: string): Promise<{ value: string; data_url: string }> {
  const response = await fetch(`/api/qr?value=${encodeURIComponent(value)}`);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to load QR preview: ${response.status}`);
  }
  return (await response.json()) as { value: string; data_url: string };
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
        setLayoutValues({
          text_values: draft.layout_state.text_values,
          asset_values: draft.layout_state.asset_values,
        });
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
  layoutValues,
  assetPreviews,
  onTextChange,
  onAssetChange,
}: {
  template: TemplateDefinition;
  layoutValues: DraftLayoutValues;
  assetPreviews: Record<string, string>;
  onTextChange: (fieldId: string, value: string) => void;
  onAssetChange: (fieldId: string, kind: 'logo' | 'image', file: File | null) => void;
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
        return (
          <div key={field.id} className="template-field">
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
      element_adjustments: {},
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
}: {
  template: TemplateDefinition;
  product: ProductDefinition;
  useCase: UseCaseDefinition;
  selectedVariantId: string | null;
  layoutValues: DraftLayoutValues;
  assetPreviews: Record<string, string>;
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
          <DesignRenderer fixture={proofFixture} />
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
        const asset = (await response.json()) as { preview_data_url?: string };
        return asset.preview_data_url ? [fieldId, asset.preview_data_url] as const : null;
      }),
    )
      .then((entries) => {
        if (!active) {
          return;
        }
        const hydratedAssets = Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null));
        if (Object.keys(hydratedAssets).length > 0) {
          setAssetPreviews((current) => ({ ...current, ...hydratedAssets }));
        }
      })
      .catch(() => {
        // Ignore preview hydration errors; the asset metadata still persists.
      });

    return () => {
      active = false;
    };
  }, [assetPreviews, layoutValues.asset_values]);

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
    setLayoutValues({
      text_values: response.layout_state.text_values,
      asset_values: response.layout_state.asset_values,
    });
  }

  async function handleVariantSelect(variant: TemplateVariantDefinition) {
    if (!selectedTemplate) {
      return;
    }
    const response = await saveLayoutValues({ variant_id: variant.id });
    setSelectedVariantId(response.layout_state.variant_id || variant.id);
    setLayoutValues({
      text_values: response.layout_state.text_values,
      asset_values: response.layout_state.asset_values,
    });
  }

  async function handleTextFieldChange(fieldId: string, value: string) {
    const response = await saveLayoutValues({ text_values: { [fieldId]: value } });
    setLayoutValues({
      text_values: response.layout_state.text_values,
      asset_values: response.layout_state.asset_values,
    });
  }

  async function handleAssetFieldChange(fieldId: string, kind: 'logo' | 'image', file: File | null) {
    if (!file) {
      return;
    }
    const uploadedAsset = await uploadAsset(kind, file);
    const response = await saveLayoutValues({ asset_values: { [fieldId]: uploadedAsset.id } });
    setAssetPreviews((current) => ({
      ...current,
      [fieldId]: uploadedAsset.preview_data_url,
    }));
    setLayoutValues({
      text_values: response.layout_state.text_values,
      asset_values: response.layout_state.asset_values,
    });
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
                <p className="template-detail__meta">
                  Produkt {selectedTemplate.product_id}, {selectedTemplate.use_case_ids.length} Use Cases,{' '}
                  {selectedTemplate.fields.length} Felder
                </p>
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
                    layoutValues={layoutValues}
                    assetPreviews={assetPreviews}
                    onTextChange={handleTextFieldChange}
                    onAssetChange={handleAssetFieldChange}
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
