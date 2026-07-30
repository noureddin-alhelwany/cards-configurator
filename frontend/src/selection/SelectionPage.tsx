import { useEffect, useMemo, useState } from 'react';
import type {
  ProductDefinition,
  RegistryBundle,
  TemplateDefinition,
  TemplateVariantDefinition,
  UseCaseDefinition,
} from '../registries/types';
import type { DraftState, TemplateSelectionRequest } from '../drafts/types';
import type { ElementAdjustment, ProofFixture, ValidationIssue } from '../design/types';
import DesignRenderer from '../design/DesignRenderer';
import type { OrderDetail, OrderSummary } from '../orders/types';
import {
  assetElementForField,
  clamp,
  defaultAdjustmentsForTemplate,
  imageQualitySummary,
  type AssetMetadata,
} from './selectionHelpers';
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

function emptyLayoutValues(): DraftLayoutValues {
  return {
    text_values: {},
    asset_values: {},
    element_adjustments: {},
  };
}

type ApprovalChecklist = {
  texts_checked: boolean;
  url_checked: boolean;
  image_crop_checked: boolean;
  preview_released: boolean;
};

type QualityReport = {
  issues: ValidationIssue[];
  blocking: boolean;
};

type WizardStep = {
  id: 'selection' | 'product' | 'design' | 'content' | 'review';
  title: string;
  description: string;
};

const DEFAULT_ELEMENT_ADJUSTMENT: ElementAdjustment = {
  offset_x: 0,
  offset_y: 0,
  scale: 1,
};

const EMPTY_VALIDATION_ISSUES: ValidationIssue[] = [];

type TemplateFieldRole = 'business' | 'headline' | 'body' | 'qrTarget' | 'logo' | 'image' | 'generic';

function templateStyleDescription(template: TemplateDefinition) {
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

function fieldRole(field: TemplateDefinition['fields'][number], index: number): TemplateFieldRole {
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

function fieldLabel(role: TemplateFieldRole) {
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

function fieldGroupLabel(role: TemplateFieldRole) {
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

function fieldHelperText(role: TemplateFieldRole) {
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

function fieldSuggestions(role: TemplateFieldRole) {
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

function trimSuggestion(value: string, maxLength: number | null) {
  if (maxLength === null || value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength).trimEnd();
}

function demoTextForRole(role: TemplateFieldRole, useCase: UseCaseDefinition) {
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

function friendlyValidationMessage(issue: ValidationIssue, fieldName: string) {
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

function validationDisplayPath(issue: ValidationIssue) {
  if (issue.code === 'qr_too_small') {
    return 'qrTarget';
  }
  return issue.path;
}

function emptyPreviewAsset(label: string) {
  return placeholderImageDataUrl(label);
}

function buildTemplatePreviewFixture(
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

function templateRecommendationIndex(template: TemplateDefinition, index: number) {
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

function buildWizardSteps(includeProductStep: boolean): WizardStep[] {
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
          } as WizardStep,
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
  ];
}

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

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function placeholderImageDataUrl(label: string) {
  return svgDataUrl(`
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
  `);
}

function placeholderQrDataUrl() {
  return svgDataUrl(`
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
  `);
}

function layoutValuesFromState(layoutState: DraftState['layout_state']): DraftLayoutValues {
  return {
    text_values: layoutState.text_values,
    asset_values: layoutState.asset_values,
    element_adjustments: layoutState.element_adjustments,
  };
}

function wizardStepIndexFromDraft(draft: DraftState, includeProductStep: boolean): number {
  if (draft.approved_at) {
    return includeProductStep ? 4 : 3;
  }
  if (!draft.use_case_id) {
    return 0;
  }
  if (includeProductStep && !draft.product_id) {
    return 1;
  }
  if (!draft.template_id || !draft.template_version) {
    return includeProductStep ? 2 : 1;
  }
  return includeProductStep ? 3 : 2;
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

async function approveDraft(body: ApprovalChecklist): Promise<DraftState> {
  const response = await fetch('/api/drafts/current/approval', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to approve draft: ${response.status}`);
  }
  return (await response.json()) as DraftState;
}

async function resetDraft(): Promise<DraftState> {
  const response = await fetch('/api/drafts/current/reset', {
    method: 'POST',
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to reset draft: ${response.status}`);
  }
  return (await response.json()) as DraftState;
}

async function loadOrders(): Promise<OrderSummary[]> {
  const response = await fetch('/api/orders');
  if (!response.ok) {
    throw new Error(`Failed to load orders: ${response.status}`);
  }
  return (await response.json()) as OrderSummary[];
}

async function createOrder(): Promise<OrderDetail> {
  const response = await fetch('/api/orders', {
    method: 'POST',
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to create order: ${response.status}`);
  }
  return (await response.json()) as OrderDetail;
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
  const [wizardStepIndex, setWizardStepIndex] = useState<number>(0);
  const [layoutValues, setLayoutValues] = useState<DraftLayoutValues>(emptyLayoutValues());

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
        const includeProductStep = visibleProducts(bundle).length > 1;
        const firstUseCase = bundle.use_cases.find((useCase) => useCase.active);
        const firstProduct = bundle.products.find((product) => product.active);
        setSelectedUseCaseId(draft.use_case_id ?? firstUseCase?.id ?? null);
        setSelectedProductId(draft.product_id ?? firstProduct?.id ?? null);
        setSelectedTemplateKey(
          draft.template_id && draft.template_version ? `${draft.template_id}@${draft.template_version}` : null,
        );
        setSelectedVariantId(draft.layout_state.variant_id || null);
        setLayoutValues(layoutValuesFromState(draft.layout_state));
        setWizardStepIndex(wizardStepIndexFromDraft(draft, includeProductStep));
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
    wizardStepIndex,
    setWizardStepIndex,
    layoutValues,
    setLayoutValues,
    setDraft: (draft: DraftState) => setState((current) => ({ ...current, draft })),
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
  disabled = false,
}: {
  product: ProductDefinition;
  selected: boolean;
  onSelect: (id: string) => void;
  useCaseNames: string[];
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`product-card${selected ? ' product-card--selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
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
  disabled = false,
}: {
  useCase: UseCaseDefinition;
  selected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`use-case-card${selected ? ' use-case-card--selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
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
  useCase,
  selected,
  recommended = false,
  onSelect,
  disabled = false,
}: {
  template: TemplateDefinition;
  product: ProductDefinition | null;
  useCase: UseCaseDefinition | null;
  selected: boolean;
  recommended?: boolean;
  onSelect: (template: TemplateDefinition) => void;
  disabled?: boolean;
}) {
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
          <img className="template-card__image" src={templateAssetPath(template, product)} alt="" />
        )}
        <div className="template-card__badges" aria-hidden="true">
          {recommended ? <span className="template-card__badge">Empfohlen</span> : null}
          {selected ? <span className="template-card__badge template-card__badge--selected">Ausgewählt</span> : null}
        </div>
      </div>
      <div className="template-card__body">
        <p className="template-card__eyebrow">Vorlage</p>
        <h3>
          {template.name ?? 'Vorlage'}
        </h3>
        <p>{templateStyleDescription(template)}</p>
      </div>
    </button>
  );
}

function TemplateVariantButtons({
  template,
  selectedVariantId,
  onSelect,
  disabled = false,
}: {
  template: TemplateDefinition;
  selectedVariantId: string | null;
  onSelect: (variant: TemplateVariantDefinition) => void;
  disabled?: boolean;
}) {
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
            {variant.preview_asset ? <img src={assetPath(variant.preview_asset)} alt="" /> : <span>Variante</span>}
          </span>
          <span className="template-variant-pill__label">{variant.name}</span>
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
  expandedAssetFieldId,
  onToggleAssetEditor,
  onFieldInteract,
  disabled = false,
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
  expandedAssetFieldId: string | null;
  onToggleAssetEditor: (fieldId: string | null) => void;
  onFieldInteract: (fieldId: string) => void;
  disabled?: boolean;
}) {
  const groupedFields = useMemo(() => {
    const groups = new Map<
      string,
      {
        title: string;
        description: string;
        fields: Array<{ field: TemplateDefinition['fields'][number]; index: number; role: TemplateFieldRole }>;
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
      const entry = { field, index, role };
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
                ? layoutValues.element_adjustments[assetElement.id] ?? DEFAULT_ELEMENT_ADJUSTMENT
                : DEFAULT_ELEMENT_ADJUSTMENT;
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
      assets[field.id] = {
        mime_type: previewDataUrl
          ? previewDataUrl.startsWith('data:image/svg+xml')
            ? 'image/svg+xml'
            : 'image/png'
          : 'image/svg+xml',
        data_url: previewDataUrl ?? placeholderImageDataUrl(field.type === 'logo' ? 'Logo' : 'Bild'),
      };
    });

  const qrElement = template.elements.find((element) => element.kind === 'qr');
  if (qrPreview) {
    assets.qr = {
      mime_type: 'image/svg+xml',
      data_url: qrPreview.data_url,
    };
  } else if (qrElement) {
    assets.qr = {
      mime_type: 'image/svg+xml',
      data_url: placeholderQrDataUrl(),
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
  showLivePreview = true,
  showMockup = true,
  expanded = false,
  onToggleExpanded,
}: {
  template: TemplateDefinition;
  product: ProductDefinition;
  useCase: UseCaseDefinition;
  selectedVariantId: string | null;
  layoutValues: DraftLayoutValues;
  assetPreviews: Record<string, string>;
  validationIssues: ValidationIssue[];
  showLivePreview?: boolean;
  showMockup?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}) {
  const [qrPreview, setQrPreview] = useState<{ value: string; data_url: string } | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const qrField = template.fields.find((field) => field.type === 'url') ?? null;
  const qrFieldId = qrField?.id ?? null;
  const qrValue = qrFieldId ? layoutValues.text_values[qrFieldId] ?? '' : '';
  const [qrLoading, setQrLoading] = useState(false);

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
    loadQrPreview(qrValue)
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

  const proofFixture = template.elements.length > 0 ? buildProofFixture(template, product, useCase, selectedVariantId, layoutValues, assetPreviews, qrPreview) : null;

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
    wizardStepIndex,
    setWizardStepIndex,
    layoutValues,
    setLayoutValues,
    setDraft,
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
  const [assetPreviews, setAssetPreviews] = useState<Record<string, string>>({});
  const [assetDetails, setAssetDetails] = useState<Record<string, AssetMetadata>>({});
  const [assetErrors, setAssetErrors] = useState<Record<string, string | null>>({});
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);
  const [approvalChecklist, setApprovalChecklist] = useState<ApprovalChecklist>({
    texts_checked: false,
    url_checked: false,
    image_crop_checked: false,
    preview_released: false,
  });
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [validationRevealAll, setValidationRevealAll] = useState(false);
  const [touchedValidationPaths, setTouchedValidationPaths] = useState<Record<string, true>>({});
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [expandedAssetFieldId, setExpandedAssetFieldId] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const pendingProduct = useMemo(
    () => bundle?.products.find((product) => product.id === pendingProductId) ?? null,
    [bundle, pendingProductId],
  );

  useEffect(() => {
    if (state.draft?.approved_at && state.draft.approval_checklist) {
      setApprovalChecklist({
        texts_checked: state.draft.approval_checklist.texts_checked ?? false,
        url_checked: state.draft.approval_checklist.url_checked ?? false,
        image_crop_checked: state.draft.approval_checklist.image_crop_checked ?? false,
        preview_released: state.draft.approval_checklist.preview_released ?? false,
      });
    }
  }, [state.draft?.approved_at, state.draft?.approval_checklist, state.draft?.id]);

  const isApproved = Boolean(state.draft?.approved_at);
  const approvalReady = Object.values(approvalChecklist).every(Boolean);

  const matchingProducts = useMemo(() => (bundle ? visibleProducts(bundle) : []), [bundle]);
  const showProductStep = matchingProducts.length > 1;
  const wizardSteps = useMemo(() => buildWizardSteps(showProductStep), [showProductStep]);
  const selectionState = useMemo(
    () => ({
      selectedUseCase,
      selectedProduct,
      selectedTemplate,
      selectedVariant,
      fieldValues: layoutValues.text_values,
      uploadedAssets: assetPreviews,
      mediaTransforms: layoutValues.element_adjustments,
      validationState: {
        issues: qualityReport?.issues ?? [],
        blocking: (qualityReport?.issues ?? []).some((issue) => issue.blocking),
      },
      previewState: {
        live: Boolean(selectedTemplate && selectedProduct && selectedUseCase && wizardStepIndex < (showProductStep ? 4 : 3)),
        mockup: Boolean(selectedTemplate && selectedProduct && selectedUseCase && wizardStepIndex >= (showProductStep ? 4 : 3)),
      },
      approvalState: {
        checklist: approvalChecklist,
        approved: isApproved,
        ready: approvalReady,
      },
    }),
    [
      approvalChecklist,
      approvalReady,
      assetPreviews,
      isApproved,
      layoutValues.element_adjustments,
      layoutValues.text_values,
      qualityReport?.issues,
      selectedProduct,
      selectedTemplate,
      selectedUseCase,
      selectedVariant,
      showProductStep,
      wizardStepIndex,
    ],
  );
  const matchingTemplates = useMemo(() => {
    const templates =
      bundle
        ? visibleTemplates(bundle, selectedUseCaseId).filter(
            (template) => !selectedProductId || template.product_id === selectedProductId,
          )
        : [];

    return templates
      .map((template, index) => ({ template, index }))
      .sort((left, right) => templateRecommendationIndex(left.template, left.index) - templateRecommendationIndex(right.template, right.index))
      .map(({ template }) => template);
  }, [bundle, selectedProductId, selectedUseCaseId]);
  const productById = useMemo(
    () => new Map(bundle?.products.map((product) => [product.id, product] as const) ?? []),
    [bundle],
  );
  const designStepIndex = showProductStep ? 2 : 1;
  const contentStepIndex = showProductStep ? 3 : 2;
  const reviewStepIndex = showProductStep ? 4 : 3;
  const validationIssues = qualityReport?.issues ?? EMPTY_VALIDATION_ISSUES;
  const visibleValidationIssues = useMemo(
    () =>
      validationRevealAll
        ? validationIssues
        : validationIssues.filter((issue) => touchedValidationPaths[validationDisplayPath(issue)]),
    [touchedValidationPaths, validationIssues, validationRevealAll],
  );
  const visibleBlockingIssues = visibleValidationIssues.filter((issue) => issue.blocking);
  const showBlockingSummary = validationRevealAll && visibleBlockingIssues.length > 1;
  const recommendedTemplateKey = matchingTemplates[0] ? templateKey(matchingTemplates[0]) : null;

  function syncSelectionFromDraft(draft: DraftState) {
    const firstUseCase = bundle?.use_cases.find((useCase) => useCase.active);
    const firstProduct = bundle?.products.find((product) => product.active);
    setSelectedUseCaseId(draft.use_case_id ?? firstUseCase?.id ?? null);
    setSelectedProductId(draft.product_id ?? firstProduct?.id ?? null);
    setSelectedTemplateKey(draft.template_id && draft.template_version ? `${draft.template_id}@${draft.template_version}` : null);
    setSelectedVariantId(draft.layout_state.variant_id || null);
    setLayoutValues(layoutValuesFromState(draft.layout_state));
  }

  function markValidationPathTouched(path: string) {
    setTouchedValidationPaths((current) => ({ ...current, [path]: true }));
  }

  function resetValidationRevealState() {
    setValidationRevealAll(false);
    setTouchedValidationPaths({});
  }

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

  useEffect(() => {
    let active = true;

    loadOrders()
      .then((response) => {
        if (active) {
          setOrders(response);
          setOrdersError(null);
        }
      })
      .catch((exception: unknown) => {
        if (active) {
          setOrdersError(exception instanceof Error ? exception.message : 'Aufträge konnten nicht geladen werden');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function handleUseCaseSelect(useCaseId: string) {
    setSelectedUseCaseId(useCaseId);
    setPendingProductId(null);
    setExpandedAssetFieldId(null);
    setPreviewExpanded(false);
    resetValidationRevealState();
    setWizardStepIndex(1);
  }

  function applyProductSelection(productId: string) {
    setSelectedProductId(productId);
    setSelectedTemplateKey(null);
    setSelectedVariantId(null);
    setLayoutValues(emptyLayoutValues());
    setAssetPreviews({});
    setAssetDetails({});
    setAssetErrors({});
    setQualityReport(null);
    setQualityError(null);
    setExpandedAssetFieldId(null);
    setPreviewExpanded(false);
    resetValidationRevealState();
    setApprovalChecklist({
      texts_checked: false,
      url_checked: false,
      image_crop_checked: false,
      preview_released: false,
    });
    setApprovalError(null);
    setPendingProductId(null);
    setWizardStepIndex(designStepIndex);
  }

  function handleProductSelect(productId: string) {
    if (isApproved || productId === selectedProductId) {
      setPendingProductId(null);
      return;
    }
    if (selectedTemplate && selectedTemplate.product_id !== productId) {
      setPendingProductId(productId);
      return;
    }
    applyProductSelection(productId);
  }

  function goToPreviousWizardStep() {
    setWizardStepIndex((current) => Math.max(0, current - 1));
  }

  async function handleTemplateSelect(template: TemplateDefinition) {
    if (!selectedUseCaseId || !selectedProductId || isApproved) {
      return;
    }
    const demoUseCase =
      selectedUseCase ?? bundle?.use_cases.find((useCase) => useCase.id === selectedUseCaseId) ?? bundle?.use_cases.find((useCase) => useCase.active) ?? null;
    if (!demoUseCase) {
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
    setDraft(response);
    setWizardStepIndex(contentStepIndex);
    setPendingProductId(null);
    setExpandedAssetFieldId(null);
    setPreviewExpanded(false);
    resetValidationRevealState();
    const seededTextValues = Object.fromEntries(
      template.fields
        .filter((field) => field.type === 'text' || field.type === 'url')
        .map((field, index) => {
          const role = fieldRole(field, index);
          return [field.id, trimSuggestion(demoTextForRole(role, demoUseCase), field.max_length)];
        }),
    );
    if (Object.keys(seededTextValues).length > 0) {
      const seededResponse = await saveLayoutValues({ text_values: seededTextValues });
      setLayoutValues(layoutValuesFromState(seededResponse.layout_state));
      setDraft(seededResponse);
    }
    setApprovalChecklist({
      texts_checked: false,
      url_checked: false,
      image_crop_checked: false,
      preview_released: false,
    });
    setApprovalError(null);
  }

  async function handleVariantSelect(variant: TemplateVariantDefinition) {
    if (!selectedTemplate || isApproved) {
      return;
    }
    const response = await saveLayoutValues({ variant_id: variant.id });
    setSelectedVariantId(response.layout_state.variant_id || variant.id);
    setLayoutValues(layoutValuesFromState(response.layout_state));
    setDraft(response);
  }

  async function handleTextFieldChange(fieldId: string, value: string) {
    if (isApproved) {
      return;
    }
    markValidationPathTouched(fieldId);
    const response = await saveLayoutValues({ text_values: { [fieldId]: value } });
    setLayoutValues(layoutValuesFromState(response.layout_state));
    setDraft(response);
  }

  async function handleAssetFieldChange(fieldId: string, kind: 'logo' | 'image', file: File | null) {
    if (isApproved) {
      return;
    }
    try {
      markValidationPathTouched(fieldId);
      if (!file) {
        const response = await saveLayoutValues({ asset_values: { [fieldId]: '' } });
        setAssetErrors((current) => ({ ...current, [fieldId]: null }));
        setAssetPreviews((current) => {
          const next = { ...current };
          delete next[fieldId];
          return next;
        });
        setAssetDetails((current) => {
          const next = { ...current };
          delete next[fieldId];
          return next;
        });
        setLayoutValues(layoutValuesFromState(response.layout_state));
        setDraft(response);
        return;
      }
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
      setDraft(response);
    } catch (exception: unknown) {
      setAssetErrors((current) => ({
        ...current,
        [fieldId]: exception instanceof Error ? exception.message : 'Upload fehlgeschlagen',
      }));
    }
  }

  async function handleAssetAdjustmentChange(fieldId: string, adjustment: ElementAdjustment) {
    if (!selectedTemplate || isApproved) {
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
    markValidationPathTouched(fieldId);
    setLayoutValues(layoutValuesFromState(response.layout_state));
    setDraft(response);
  }

  async function handleAssetAdjustmentReset(fieldId: string) {
    await handleAssetAdjustmentChange(fieldId, DEFAULT_ELEMENT_ADJUSTMENT);
  }

  async function handleLayoutReset() {
    if (!selectedTemplate || isApproved) {
      return;
    }
    const response = await saveLayoutValues({ element_adjustments: defaultAdjustmentsForTemplate(selectedTemplate) });
    setLayoutValues(layoutValuesFromState(response.layout_state));
    setDraft(response);
  }

  async function handleApprovalSubmit() {
    if (!selectedTemplate || !selectedUseCase || !selectedProduct || isApproved) {
      return;
    }
    setValidationRevealAll(true);
    setApprovalSubmitting(true);
    setApprovalError(null);
    try {
      const response = await approveDraft(approvalChecklist);
      setDraft(response);
      setWizardStepIndex(reviewStepIndex);
      setApprovalChecklist({
        texts_checked: response.approval_checklist?.texts_checked ?? false,
        url_checked: response.approval_checklist?.url_checked ?? false,
        image_crop_checked: response.approval_checklist?.image_crop_checked ?? false,
        preview_released: response.approval_checklist?.preview_released ?? false,
      });
    } catch (exception: unknown) {
      setApprovalError(exception instanceof Error ? exception.message : 'Freigabe fehlgeschlagen');
    } finally {
      setApprovalSubmitting(false);
    }
  }

  async function handleDraftReset() {
    if (resetSubmitting) {
      return;
    }
    setResetSubmitting(true);
    setResetError(null);
    try {
      const response = await resetDraft();
      setDraft(response);
      syncSelectionFromDraft(response);
      setAssetPreviews({});
      setAssetDetails({});
      setAssetErrors({});
      setQualityReport(null);
      setQualityError(null);
      setPendingProductId(null);
      setPreviewExpanded(false);
      setApprovalChecklist({
        texts_checked: false,
        url_checked: false,
        image_crop_checked: false,
        preview_released: false,
      });
      setApprovalError(null);
      setValidationRevealAll(false);
      setTouchedValidationPaths({});
      setWizardStepIndex(0);
    } catch (exception: unknown) {
      setResetError(exception instanceof Error ? exception.message : 'Neuer Entwurf konnte nicht gestartet werden');
    } finally {
      setResetSubmitting(false);
    }
  }

  async function handleOrderCreate() {
    if (!isApproved || orderSubmitting) {
      return;
    }
    setOrderSubmitting(true);
    setOrdersError(null);
    try {
      const order = await createOrder();
      setOrders((current) => [order, ...current.filter((entry) => entry.id !== order.id)]);
      window.history.pushState({}, '', `/render/orders/${order.id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (exception: unknown) {
      setOrdersError(exception instanceof Error ? exception.message : 'Auftrag konnte nicht erstellt werden');
    } finally {
      setOrderSubmitting(false);
    }
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

  const blockingIssues = validationIssues.filter((issue) => issue.blocking);
  const activeStepIndex = Math.min(wizardStepIndex, wizardSteps.length - 1);
  const activeStep = wizardSteps[activeStepIndex] ?? wizardSteps[0];
  const wizardHint =
    activeStep.id === 'selection'
      ? 'Wähle zuerst einen Anwendungsfall, damit die passenden Optionen erscheinen.'
      : activeStep.id === 'product'
        ? 'Jetzt das Produkt auswählen. Danach geht es direkt zum Design.'
        : activeStep.id === 'design'
          ? 'Ein Design auswählen, das zum Produkt und Use Case passt.'
          : activeStep.id === 'content'
            ? 'Texte und Medien prüfen, dann die finale Vorschau kontrollieren.'
            : 'Alles prüfen und den Auftrag freigeben.';
  const previewVisible = selectionState.previewState.live || selectionState.previewState.mockup;
  const previewShowsMockup = selectionState.previewState.mockup;

  return (
    <main className="selection-shell">
      <section className="selection-panel">
        <header className="selection-header">
          <div className="selection-header__copy">
            <p className="selection-kicker">Cards Configurator</p>
            <h1>Geführter Erstellungsprozess</h1>
            <p className="selection-lede">
              Wähle einen Anwendungsfall, ein Design und die Inhalte. Die Oberfläche führt dich Schritt für Schritt zu einer
              druckfähigen Freigabe.
            </p>
            <p className="selection-summary" aria-live="polite">
              Schritt {activeStepIndex + 1} von {wizardSteps.length}: {activeStep.title}
            </p>
            <p className="selection-lede selection-lede--compact" aria-live="polite">
              {wizardHint}
            </p>
          </div>
          <div className="selection-header__actions">
            <button type="button" className="wizard-step-nav__button" disabled={resetSubmitting} onClick={handleDraftReset}>
              {resetSubmitting ? 'Neustart...' : isApproved ? 'Neue Konfiguration starten' : 'Konfiguration zurücksetzen'}
            </button>
            <p className="selection-header__hint">
              {isApproved
                ? 'Dieser Entwurf ist freigegeben und gesperrt. Starte eine neue Konfiguration, um Änderungen vorzunehmen.'
                : 'Zurücksetzen entfernt die aktuelle Auswahl und startet mit einem leeren Entwurf.'}
            </p>
          </div>
        </header>

        <nav className="wizard-nav" aria-label="Konfigurationsschritte">
          <ol className="wizard-nav__list">
            {wizardSteps.map((step, index) => {
              const isCurrent = index === activeStepIndex;
              const isComplete = index < activeStepIndex;
              const isDisabled = index > activeStepIndex;
              return (
                <li key={step.id} className="wizard-nav__item">
                  <button
                    type="button"
                    className={`wizard-nav__button${isCurrent ? ' wizard-nav__button--active' : ''}${isComplete ? ' wizard-nav__button--complete' : ''}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    disabled={isDisabled}
                    onClick={() => setWizardStepIndex(index)}
                  >
                    <span className="wizard-nav__index">{index + 1}</span>
                    <span className="wizard-nav__body">
                      <strong>{step.title}</strong>
                      <span>{step.description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="selection-layout">
          <main className="selection-main">
            {activeStep.id === 'selection' ? (
              <section className="selection-section selection-section--wizard selection-step-panel">
                <div className="selection-section__heading">
                  <h2>1. Auswahl</h2>
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
                        onSelect={handleUseCaseSelect}
                        disabled={isApproved}
                      />
                    ))}
                </div>
                <div className="wizard-step-nav">
                  <button type="button" className="wizard-step-nav__button" disabled>
                    Zurück
                  </button>
                  <button
                    type="button"
                    className="wizard-step-nav__button wizard-step-nav__button--primary"
                    disabled={!selectedUseCaseId}
                    onClick={() => setWizardStepIndex(1)}
                  >
                    Weiter
                  </button>
                </div>
              </section>
            ) : null}

            {activeStep.id === 'product' && showProductStep ? (
              <section className="selection-section selection-section--wizard selection-step-panel">
                <div className="selection-section__heading">
                  <h2>2. Produkt</h2>
                  <p>{matchingProducts.length} Einträge</p>
                </div>
                {pendingProduct ? (
                  <div className="product-change-notice" role="alert">
                    <p className="product-change-notice__title">Produktwechsel setzt die aktuelle Vorlage zurück.</p>
                    <p className="product-change-notice__body">
                      Beim Wechsel auf <strong>{pendingProduct.name}</strong> gehen die gewählte Vorlage, Variante und lokale
                      Eingaben für diesen Entwurf verloren.
                    </p>
                    <div className="product-change-notice__actions">
                      <button type="button" className="wizard-step-nav__button" onClick={() => setPendingProductId(null)}>
                        Abbrechen
                      </button>
                      <button
                        type="button"
                        className="wizard-step-nav__button wizard-step-nav__button--primary"
                        onClick={() => applyProductSelection(pendingProduct.id)}
                      >
                        Produkt wechseln
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="product-grid">
                  {matchingProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      selected={product.id === selectedProductId}
                      onSelect={handleProductSelect}
                      useCaseNames={visibleProductUseCaseNames(bundle, product.id)}
                      disabled={isApproved}
                    />
                  ))}
                </div>
                {selectedProduct ? (
                  <article className="product-detail">
                    <p className="product-detail__eyebrow">Ausgewähltes Produkt</p>
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
                <div className="wizard-step-nav">
                  <button type="button" className="wizard-step-nav__button" onClick={goToPreviousWizardStep}>
                    Zurück
                  </button>
                  <button
                    type="button"
                    className="wizard-step-nav__button wizard-step-nav__button--primary"
                    disabled={!selectedProductId}
                    onClick={() => setWizardStepIndex(designStepIndex)}
                  >
                    Weiter
                  </button>
                </div>
              </section>
            ) : null}

            {activeStep.id === 'design' ? (
              <section className="selection-section selection-section--wizard selection-step-panel">
                <div className="selection-section__heading">
                  <h2>{showProductStep ? '3. Design' : '2. Design'}</h2>
                  <p>{matchingTemplates.length} Einträge</p>
                </div>
                <div className="template-grid">
                  {matchingTemplates.length > 0 ? (
                    matchingTemplates.map((template) => (
                      <TemplateCard
                        key={templateKey(template)}
                        template={template}
                        product={productById.get(template.product_id) ?? null}
                        useCase={selectedUseCase}
                        selected={templateKey(template) === selectedTemplateKey}
                        recommended={templateKey(template) === recommendedTemplateKey}
                        onSelect={handleTemplateSelect}
                        disabled={isApproved}
                      />
                    ))
                  ) : (
                    <p className="template-grid__empty">Für diese Auswahl sind aktuell keine Templates aktiv.</p>
                  )}
                </div>
                <div className="wizard-step-nav">
                  <button type="button" className="wizard-step-nav__button" onClick={goToPreviousWizardStep}>
                    Zurück
                  </button>
                  <button
                    type="button"
                    className="wizard-step-nav__button wizard-step-nav__button--primary"
                    disabled={!selectedTemplateKey}
                    onClick={() => setWizardStepIndex(contentStepIndex)}
                  >
                    Weiter
                  </button>
                </div>
              </section>
            ) : null}

            {activeStep.id === 'content' && selectedTemplate && selectedProduct && selectedUseCase ? (
              <section className="selection-section selection-section--wizard selection-step-panel">
                <div className="selection-section__heading">
                  <h2>{showProductStep ? '4. Inhalte' : '3. Inhalte'}</h2>
                  <p>Texte, Varianten und Medien</p>
                </div>
                <article className="template-detail">
                  <p className="template-detail__eyebrow">Inhalte</p>
                  <h3>
                    {selectedTemplate.name ?? selectedTemplate.id} <span>@{selectedTemplate.version}</span>
                  </h3>
                  <div className="template-detail__actions">
                    <button type="button" className="template-field__reset" disabled={isApproved} onClick={handleLayoutReset}>
                      Layout zurücksetzen
                    </button>
                  </div>
                  <p className="template-detail__meta">
                    Produkt {selectedTemplate.product_id}, {selectedTemplate.use_case_ids.length} Use Cases, {selectedTemplate.fields.length} Felder
                  </p>
                  <p className="template-detail__hint">Passe Varianten und Felder an. Die Vorschau bleibt separat sichtbar.</p>
                  <div className="template-detail__group">
                    <p className="template-detail__group-title">Layoutvarianten</p>
                    <TemplateVariantButtons
                      template={selectedTemplate}
                      selectedVariantId={selectedVariantId}
                      onSelect={handleVariantSelect}
                      disabled={isApproved}
                    />
                  </div>
                  <div className="template-detail__group">
                    <p className="template-detail__group-title">Felder</p>
                    <TemplateFieldsList
                      template={selectedTemplate}
                      product={selectedProduct}
                      layoutValues={layoutValues}
                      assetPreviews={assetPreviews}
                      assetDetails={assetDetails}
                      assetErrors={assetErrors}
                      validationIssues={visibleValidationIssues}
                      onTextChange={handleTextFieldChange}
                      onAssetChange={handleAssetFieldChange}
                      onAssetAdjustmentChange={handleAssetAdjustmentChange}
                      onAssetAdjustmentReset={handleAssetAdjustmentReset}
                      expandedAssetFieldId={expandedAssetFieldId}
                      onToggleAssetEditor={setExpandedAssetFieldId}
                      onFieldInteract={markValidationPathTouched}
                      disabled={isApproved}
                    />
                  </div>
                </article>
                <div className="wizard-step-nav">
                  <button type="button" className="wizard-step-nav__button" onClick={goToPreviousWizardStep}>
                    Zurück
                  </button>
                  <button
                    type="button"
                    className="wizard-step-nav__button wizard-step-nav__button--primary"
                    onClick={() => setWizardStepIndex(reviewStepIndex)}
                  >
                    Zur Prüfung
                  </button>
                </div>
              </section>
            ) : null}

            {activeStep.id === 'review' && selectedTemplate && selectedProduct && selectedUseCase ? (
              <section className="selection-section selection-section--wizard selection-step-panel">
                <div className="selection-section__heading">
                  <h2>{showProductStep ? '5. Prüfen' : '4. Prüfen'}</h2>
                  <p>{orders.length} gespeicherte Aufträge</p>
                </div>
                <article className="template-detail">
                  <p className="template-detail__eyebrow">Freigabe</p>
                  <h3>
                    {selectedTemplate.name ?? selectedTemplate.id} <span>@{selectedTemplate.version}</span>
                  </h3>
                  <div className="template-detail__actions">
                    <button type="button" className="template-field__reset" disabled={isApproved} onClick={goToPreviousWizardStep}>
                      Zur Inhalte
                    </button>
                    <button
                      type="button"
                      className="template-field__reset"
                      disabled={isApproved || blockingIssues.length > 0 || approvalSubmitting || !approvalReady}
                      onClick={handleApprovalSubmit}
                    >
                      {isApproved ? 'Freigegeben' : approvalSubmitting ? 'Freigabe läuft...' : 'Design freigeben'}
                    </button>
                  </div>
                  {isApproved ? (
                    <p className="template-detail__approved">
                      Freigegeben am {new Date(state.draft?.approved_at ?? '').toLocaleString('de-DE')}
                    </p>
                  ) : null}
                  <p className="template-detail__meta">
                    Produkt {selectedTemplate.product_id}, {selectedTemplate.use_case_ids.length} Use Cases, {selectedTemplate.fields.length} Felder
                  </p>
                  <div className="template-approval">
                    <p className="template-detail__group-title">Freigabe-Checkliste</p>
                    <div className="template-approval__list">
                      <label className="template-approval__item">
                        <input
                          type="checkbox"
                          checked={approvalChecklist.texts_checked}
                          disabled={isApproved}
                          onChange={(event) => setApprovalChecklist((current) => ({ ...current, texts_checked: event.target.checked }))}
                        />
                        <span>Texte geprüft</span>
                      </label>
                      <label className="template-approval__item">
                        <input
                          type="checkbox"
                          checked={approvalChecklist.url_checked}
                          disabled={isApproved}
                          onChange={(event) => setApprovalChecklist((current) => ({ ...current, url_checked: event.target.checked }))}
                        />
                        <span>URL geprüft</span>
                      </label>
                      <label className="template-approval__item">
                        <input
                          type="checkbox"
                          checked={approvalChecklist.image_crop_checked}
                          disabled={isApproved}
                          onChange={(event) =>
                            setApprovalChecklist((current) => ({ ...current, image_crop_checked: event.target.checked }))
                          }
                        />
                        <span>Bildausschnitt geprüft</span>
                      </label>
                      <label className="template-approval__item">
                        <input
                          type="checkbox"
                          checked={approvalChecklist.preview_released}
                          disabled={isApproved}
                          onChange={(event) =>
                            setApprovalChecklist((current) => ({ ...current, preview_released: event.target.checked }))
                          }
                        />
                        <span>Vorschau freigegeben</span>
                      </label>
                    </div>
                  </div>
                  <p className="template-detail__hint">Der finale Zustand wird jetzt geprüft und kann anschließend als Auftrag gespeichert werden.</p>
                </article>
                <div className="order-grid">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        className="selection-order-card"
                        onClick={() => {
                          window.history.pushState({}, '', `/render/orders/${order.id}`);
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        <span className="selection-order-card__badge">{order.order_number}</span>
                        <div className="selection-order-card__preview">
                          {order.preview_path ? (
                            <img
                              src={`/api/orders/${encodeURIComponent(order.id)}/preview`}
                              alt={`Vorschau für ${order.order_number}`}
                              loading="lazy"
                            />
                          ) : (
                            <span className="selection-order-card__preview-empty">Keine Vorschau</span>
                          )}
                        </div>
                        <div className="selection-order-card__content">
                          <h3>{order.display_name ?? 'Kein Firmenname hinterlegt'}</h3>
                          <p className="selection-order-card__summary">
                            {order.product_id} · {order.template_id}@{order.template_version}
                          </p>
                          <dl className="selection-order-card__meta">
                            <div>
                              <dt>Datum</dt>
                              <dd>{new Date(order.created_at).toLocaleDateString('de-DE')}</dd>
                            </div>
                            <div>
                              <dt>Template</dt>
                              <dd>
                                {order.template_id}@{order.template_version}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="order-grid__empty">Noch keine Aufträge erstellt.</p>
                  )}
                </div>
                <div className="wizard-step-nav">
                  <button type="button" className="wizard-step-nav__button" onClick={goToPreviousWizardStep}>
                    Zur Inhalte
                  </button>
                  <button
                    type="button"
                    className="wizard-step-nav__button wizard-step-nav__button--primary"
                    disabled={!isApproved}
                    onClick={handleOrderCreate}
                  >
                    {orderSubmitting ? 'Auftrag wird erstellt...' : 'Auftrag erstellen'}
                  </button>
                </div>
              </section>
            ) : null}
          </main>

          <aside className="selection-sidebar">
            <section className="selection-sidecard">
              <div className="selection-section__heading">
                <h2>{previewShowsMockup ? 'Freigabevorschau' : 'Live-Vorschau'}</h2>
                <p>{previewVisible ? 'Vorschau und Mockup getrennt dargestellt' : 'Wird nach Auswahl eingeblendet'}</p>
              </div>
              {previewVisible && selectedTemplate && selectedProduct && selectedUseCase ? (
                <TemplateLivePreview
                  template={selectedTemplate}
                  product={selectedProduct}
                  useCase={selectedUseCase}
                  selectedVariantId={selectedVariantId}
                  layoutValues={layoutValues}
                  assetPreviews={assetPreviews}
                  validationIssues={visibleValidationIssues}
                  showLivePreview={!previewShowsMockup}
                  showMockup={previewShowsMockup}
                  expanded={previewExpanded}
                  onToggleExpanded={() => setPreviewExpanded((current) => !current)}
                />
              ) : (
                <p className="selection-sidecard__empty">Sobald ein Design gewählt ist, erscheint hier die Vorschau.</p>
              )}
            </section>

            <section className="selection-sidecard">
              <div className="selection-section__heading">
                <h2>Rückmeldungen</h2>
                <p>{visibleValidationIssues.length} Hinweise</p>
              </div>
              <div className="selection-feedback">
                {qualityError ? <p className="template-field__error">{qualityError}</p> : null}
                {approvalError ? <p className="template-field__error">{approvalError}</p> : null}
                {resetError ? <p className="template-field__error">{resetError}</p> : null}
                {ordersError ? <p className="template-field__error">{ordersError}</p> : null}
                {showBlockingSummary ? (
                  <p className="selection-feedback__summary">
                    {visibleBlockingIssues.length} Probleme verhindern den Abschluss. Prüfe die markierten Felder.
                  </p>
                ) : null}
                {visibleValidationIssues.length > 0 ? (
                  <div className="template-quality">
                    <p className="template-detail__group-title">Qualitätsprüfung</p>
                    <ul className="template-quality__list">
                      {visibleValidationIssues.map((issue) => (
                        <li key={`${issue.path}-${issue.code}`} className={`template-quality__item template-quality__item--${issue.severity}`}>
                          <strong>{issue.severity === 'warning' ? 'Hinweis' : 'Fehler'}</strong>
                          <span>{issue.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="selection-sidecard__empty">Noch keine kritischen Rückmeldungen.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
