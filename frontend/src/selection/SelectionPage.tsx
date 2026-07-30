import { useEffect, useMemo, useState } from 'react';
import type {
  ProductDefinition,
  RegistryBundle,
  TemplateDefinition,
  TemplateVariantDefinition,
  UseCaseDefinition,
} from '../registries/types';
import type { DraftState, TemplateSelectionRequest } from '../drafts/types';
import type { ElementAdjustment, ValidationIssue } from '../design/types';
import type { OrderDetail } from '../orders/types';
import {
  assetElementForField,
  clamp,
  defaultAdjustmentsForTemplate,
  type AssetMetadata,
} from './selectionHelpers';
import {
  activeVariant,
  demoTextForRole,
  fieldRole,
  fieldLabel,
  templateKey,
  TemplateCard,
  templateRecommendationIndex,
  trimSuggestion,
  validationDisplayPath,
} from './selectionUi';
import { SelectionContentPanel, SelectionFeedbackPanel, SelectionPreviewPanel, SelectionReviewPanel } from './selectionPanels';
import './SelectionPage.css';
import StateMessage from '../ui/StateMessage';

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
const EMPTY_APPROVAL_CHECKLIST: ApprovalChecklist = {
  texts_checked: false,
  url_checked: false,
  image_crop_checked: false,
  preview_released: false,
};

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

function layoutValuesFromState(layoutState: DraftState['layout_state']): DraftLayoutValues {
  return {
    text_values: layoutState.text_values,
    asset_values: layoutState.asset_values,
    element_adjustments: layoutState.element_adjustments,
  };
}

function emptyApprovalChecklist(): ApprovalChecklist {
  return { ...EMPTY_APPROVAL_CHECKLIST };
}

function approvalChecklistFromDraft(draft: DraftState): ApprovalChecklist {
  return {
    texts_checked: draft.approval_checklist?.texts_checked ?? false,
    url_checked: draft.approval_checklist?.url_checked ?? false,
    image_crop_checked: draft.approval_checklist?.image_crop_checked ?? false,
    preview_released: draft.approval_checklist?.preview_released ?? false,
  };
}

function approvalChecklistFromAcknowledgement(checked: boolean): ApprovalChecklist {
  return checked
    ? {
        texts_checked: true,
        url_checked: true,
        image_crop_checked: true,
        preview_released: true,
      }
    : emptyApprovalChecklist();
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

function compatibleProducts(bundle: RegistryBundle, selectedUseCaseId: string | null): ProductDefinition[] {
  const activeProducts = visibleProducts(bundle);
  if (!selectedUseCaseId) {
    return activeProducts;
  }

  const compatibleProductIds = new Set(
    bundle.templates
      .filter((template) => template.active && template.use_case_ids.includes(selectedUseCaseId))
      .map((template) => template.product_id),
  );

  return activeProducts.filter((product) => compatibleProductIds.has(product.id));
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
  recommended = false,
  disabled = false,
}: {
  product: ProductDefinition;
  selected: boolean;
  onSelect: (id: string) => void;
  useCaseNames: string[];
  recommended?: boolean;
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
      <span className="product-card__status">{selected ? 'Ausgewählt' : recommended ? 'Empfohlen' : 'Produkt'}</span>
      <img className="product-card__image" src={assetPath(product.preview_asset)} alt="" />
      <div className="product-card__body">
        <h3>{product.name}</h3>
        <p className="product-card__format">
          {product.trim_width_mm} × {product.trim_height_mm} mm
        </p>
        <p className="product-card__meta">{useCaseNames.length} passende Use Cases</p>
      </div>
    </button>
  );
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
  const [approvalChecklist, setApprovalChecklist] = useState<ApprovalChecklist>(emptyApprovalChecklist());
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [validationRevealAll, setValidationRevealAll] = useState(false);
  const [touchedValidationPaths, setTouchedValidationPaths] = useState<Record<string, true>>({});
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [expandedAssetFieldId, setExpandedAssetFieldId] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const pendingProduct = useMemo(
    () => bundle?.products.find((product) => product.id === pendingProductId) ?? null,
    [bundle, pendingProductId],
  );

  useEffect(() => {
    if (state.draft?.approved_at && state.draft.approval_checklist) {
      setApprovalChecklist(approvalChecklistFromDraft(state.draft));
    }
  }, [state.draft]);

  const isApproved = Boolean(state.draft?.approved_at);
  const approvalReady = Object.values(approvalChecklist).every(Boolean);

  const matchingProducts = useMemo(
    () => (bundle ? compatibleProducts(bundle, selectedUseCaseId) : []),
    [bundle, selectedUseCaseId],
  );
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
  const recommendedProductId = matchingProducts[0]?.id ?? null;

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
    setApprovalChecklist(emptyApprovalChecklist());
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
    setApprovalChecklist(emptyApprovalChecklist());
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
      setApprovalChecklist(approvalChecklistFromDraft(response));
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
      setApprovalChecklist(emptyApprovalChecklist());
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
    try {
      const order = await createOrder();
      window.history.pushState({}, '', `/render/orders/${order.id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (exception: unknown) {
      setApprovalError(exception instanceof Error ? exception.message : 'Auftrag konnte nicht erstellt werden');
    } finally {
      setOrderSubmitting(false);
    }
  }

  function issueLabel(issue: ValidationIssue) {
    if (!selectedTemplate) {
      return 'Prüfung';
    }
    const fieldId = validationDisplayPath(issue);
    const field = selectedTemplate.fields.find((entry) => entry.id === fieldId);
    if (!field) {
      return issue.code === 'qr_too_small' ? 'QR-Ziel' : 'Prüfung';
    }
    return fieldLabel(fieldRole(field, selectedTemplate.fields.indexOf(field)));
  }

  if (state.error) {
    return (
      <main className="selection-shell selection-shell--error">
        <StateMessage
          tone="error"
          kicker="Internal bootstrap"
          title="Cards Configurator"
          description={state.error}
        />
      </main>
    );
  }

  if (!bundle) {
    return (
      <main className="selection-shell">
        <StateMessage
          tone="loading"
          kicker="Loading registries"
          title="Cards Configurator"
          description="Die Konfigurationen werden geladen."
        />
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
                {bundle.use_cases.some((useCase) => useCase.active) ? (
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
                ) : (
                  <StateMessage
                    tone="empty"
                    kicker="Auswahl"
                    title="Keine aktiven Anwendungsfälle"
                    description="Aktiviere mindestens einen Use Case in den Registries, damit der Konfigurator nutzbar ist."
                  />
                )}
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
                      recommended={product.id === recommendedProductId}
                      disabled={isApproved}
                    />
                  ))}
                </div>
                {selectedProduct ? (
                  <article className="product-detail">
                    <p className="product-detail__eyebrow">Ausgewähltes Produkt</p>
                    <h3>{selectedProduct.name}</h3>
                    <p className="product-detail__hint">
                      {selectedProduct.trim_width_mm} × {selectedProduct.trim_height_mm} mm für {visibleProductUseCaseNames(bundle, selectedProduct.id).length} passende Use Cases.
                    </p>
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
                    <StateMessage
                      tone="empty"
                      kicker="Design"
                      title="Keine passenden Templates"
                      description="Wähle einen anderen Use Case oder ein anderes Produkt, damit wieder Vorlagen erscheinen."
                    />
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
              <SelectionContentPanel
                showProductStep={showProductStep}
                selectedTemplate={selectedTemplate}
                selectedProduct={selectedProduct}
                selectedVariantId={selectedVariantId}
                layoutValues={layoutValues}
                assetPreviews={assetPreviews}
                assetDetails={assetDetails}
                assetErrors={assetErrors}
                validationIssues={visibleValidationIssues}
                expandedAssetFieldId={expandedAssetFieldId}
                isApproved={isApproved}
                onLayoutReset={handleLayoutReset}
                onVariantSelect={handleVariantSelect}
                onTextFieldChange={handleTextFieldChange}
                onAssetFieldChange={handleAssetFieldChange}
                onAssetAdjustmentChange={handleAssetAdjustmentChange}
                onAssetAdjustmentReset={handleAssetAdjustmentReset}
                onToggleAssetEditor={setExpandedAssetFieldId}
                onFieldInteract={markValidationPathTouched}
                onBack={goToPreviousWizardStep}
                onNext={() => setWizardStepIndex(reviewStepIndex)}
              />
            ) : null}

            {activeStep.id === 'review' && selectedTemplate && selectedProduct && selectedUseCase ? (
              <SelectionReviewPanel
                showProductStep={showProductStep}
                selectedTemplate={selectedTemplate}
                selectedProduct={selectedProduct}
                isApproved={isApproved}
                blockingIssuesCount={blockingIssues.length}
                approvalReady={approvalReady}
                approvalSubmitting={approvalSubmitting}
                orderSubmitting={orderSubmitting}
                approvedAt={state.draft?.approved_at}
                onBack={goToPreviousWizardStep}
                onSubmit={isApproved ? handleOrderCreate : handleApprovalSubmit}
                onApprovalChange={(checked) => setApprovalChecklist(approvalChecklistFromAcknowledgement(checked))}
              />
            ) : null}
          </main>

          <aside className="selection-sidebar">
            <SelectionPreviewPanel
              previewShowsMockup={previewShowsMockup}
              previewVisible={previewVisible}
              selectedTemplate={selectedTemplate}
              selectedProduct={selectedProduct}
              selectedUseCase={selectedUseCase}
              selectedVariantId={selectedVariantId}
              layoutValues={layoutValues}
              assetPreviews={assetPreviews}
              validationIssues={visibleValidationIssues}
              previewExpanded={previewExpanded}
              onToggleExpanded={() => setPreviewExpanded((current) => !current)}
            />

            <SelectionFeedbackPanel
              qualityError={qualityError}
              approvalError={approvalError}
              resetError={resetError}
              visibleValidationIssues={visibleValidationIssues}
              visibleBlockingIssues={visibleBlockingIssues}
              showBlockingSummary={showBlockingSummary}
              issueLabel={issueLabel}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
