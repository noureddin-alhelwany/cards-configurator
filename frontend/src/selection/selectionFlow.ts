import { useEffect, useMemo, useState } from 'react';
import type { RegistryBundle, TemplateDefinition } from '../registries/types';
import type { DraftState, TemplateSelectionRequest } from '../drafts/types';
import type { ElementAdjustment, ValidationIssue } from '../design/types';
import type { OrderDetail } from '../orders/types';
import type { TemplateDesignDefinition } from '../registries/types';
import { assetElementForField, clamp, defaultAdjustmentsForTemplate, type AssetMetadata } from './selectionHelpers';
import { loadRegistries } from '../registries/loadRegistries';
import {
  activeDesign,
  activeDesigns,
  buildWizardSteps,
  fieldDefaultValue,
  fieldLabel,
  templateKey,
  templateRecommendationIndex,
  trimSuggestion,
  validationDisplayPath,
} from './selectionRules';
import { uiText } from '../ui/text';

export type DraftLayoutValues = {
  text_values: Record<string, string>;
  asset_values: Record<string, string>;
  element_adjustments: Record<string, ElementAdjustment>;
};

export type ApprovalChecklist = {
  texts_checked: boolean;
  url_checked: boolean;
  image_crop_checked: boolean;
  preview_released: boolean;
};

export type QualityReport = {
  issues: ValidationIssue[];
  blocking: boolean;
};

type HealthState = 'loading' | 'ok' | 'offline';
type PreviewMode = 'hidden' | 'live' | 'mockup';

type LoadedState = {
  bundle: RegistryBundle | null;
  health: HealthState;
  error: string | null;
  draft: DraftState | null;
};

const EMPTY_VALIDATION_ISSUES: ValidationIssue[] = [];
const EMPTY_APPROVAL_CHECKLIST: ApprovalChecklist = {
  texts_checked: false,
  url_checked: false,
  image_crop_checked: false,
  preview_released: false,
};
const DEFAULT_ELEMENT_ADJUSTMENT: ElementAdjustment = {
  offset_x: 0,
  offset_y: 0,
  scale: 1,
};

export function emptyLayoutValues(): DraftLayoutValues {
  return {
    text_values: {},
    asset_values: {},
    element_adjustments: {},
  };
}

export function layoutValuesFromState(layoutState: DraftState['layout_state']): DraftLayoutValues {
  return {
    text_values: layoutState.text_values,
    asset_values: layoutState.asset_values,
    element_adjustments: layoutState.element_adjustments,
  };
}

export function emptyApprovalChecklist(): ApprovalChecklist {
  return { ...EMPTY_APPROVAL_CHECKLIST };
}

export function approvalChecklistFromDraft(draft: DraftState): ApprovalChecklist {
  return {
    texts_checked: draft.approval_checklist?.texts_checked ?? false,
    url_checked: draft.approval_checklist?.url_checked ?? false,
    image_crop_checked: draft.approval_checklist?.image_crop_checked ?? false,
    preview_released: draft.approval_checklist?.preview_released ?? false,
  };
}

export function approvalChecklistFromAcknowledgement(checked: boolean): ApprovalChecklist {
  return checked
    ? {
        texts_checked: true,
        url_checked: true,
        image_crop_checked: true,
        preview_released: true,
      }
    : emptyApprovalChecklist();
}

export function wizardStepIndexFromDraft(draft: DraftState): number {
  if (draft.approved_at) {
    return 3;
  }
  if (!draft.product_id) {
    return 0;
  }
  if (!draft.template_id || !draft.template_version) {
    return 1;
  }
  return 2;
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
  design_id?: string | null;
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

export function visibleProducts(bundle: RegistryBundle): RegistryBundle['products'] {
  return bundle.products.filter((product) => product.active);
}

export function compatibleProducts(bundle: RegistryBundle, selectedCategoryId: string | null) {
  const activeProducts = visibleProducts(bundle);
  if (!selectedCategoryId) {
    return activeProducts;
  }
  return activeProducts.filter((product) => product.category_ids?.includes(selectedCategoryId) ?? false);
}

export function primaryCategoryIdForProduct(bundle: RegistryBundle, productId: string) {
  const product = bundle.products.find((entry) => entry.active && entry.id === productId);
  if (!product) {
    return null;
  }
  return bundle.categories.find((category) => category.active && (product.category_ids?.includes(category.id) ?? false))?.id ?? null;
}

export function visibleTemplates(bundle: RegistryBundle) {
  return bundle.templates.filter((template) => template.active);
}

export function visibleProductCategoryNames(bundle: RegistryBundle, productId: string): string[] {
  const product = bundle.products.find((entry) => entry.active && entry.id === productId);
  if (!product) {
    return [];
  }

  return bundle.categories
    .filter((category) => (product.category_ids?.includes(category.id) ?? false) && category.active)
    .map((category) => category.name);
}

export function useSelectionFlow() {
  const [state, setState] = useState<LoadedState>({
    bundle: null,
    health: 'loading',
    error: null,
    draft: null,
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [wizardStepIndex, setWizardStepIndex] = useState<number>(0);
  const [layoutValues, setLayoutValues] = useState<DraftLayoutValues>(emptyLayoutValues());
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
        const firstCategory = bundle.categories.find((category) => category.active);
        const firstProduct = bundle.products.find((product) => product.active);
        setSelectedCategoryId(draft.category_id ?? firstCategory?.id ?? null);
        setSelectedProductId(draft.product_id ?? firstProduct?.id ?? null);
        setSelectedTemplateKey(
          draft.template_id && draft.template_version ? `${draft.template_id}@${draft.template_version}` : null,
        );
        setSelectedVariantId(draft.layout_state.design_id || null);
        setLayoutValues(layoutValuesFromState(draft.layout_state));
        setWizardStepIndex(wizardStepIndexFromDraft(draft));
      })
      .catch(() => {
        if (active) {
          setState({
            bundle: null,
            health: 'offline',
            draft: null,
            error: uiText.selection.errors.bootstrapUnavailable,
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (state.draft?.approved_at && state.draft.approval_checklist) {
      setApprovalChecklist(approvalChecklistFromDraft(state.draft));
    }
  }, [state.draft]);

  function setDraft(draft: DraftState) {
    setState((current) => ({ ...current, draft }));
  }

  const bundle = state.bundle;
  const selectedCategory = useMemo(
    () => bundle?.categories.find((category) => category.id === selectedCategoryId) ?? null,
    [bundle, selectedCategoryId],
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
    () => (selectedTemplate ? activeDesign(selectedTemplate, selectedVariantId) : null),
    [selectedTemplate, selectedVariantId],
  );

  const pendingProduct = useMemo(
    () => bundle?.products.find((product) => product.id === pendingProductId) ?? null,
    [bundle, pendingProductId],
  );

  const isApproved = Boolean(state.draft?.approved_at);
  const approvalReady = Object.values(approvalChecklist).every(Boolean);
  const availableProducts = useMemo(() => (bundle ? visibleProducts(bundle) : []), [bundle]);
  const recommendedProducts = useMemo(
    () => (bundle ? compatibleProducts(bundle, selectedCategoryId) : []),
    [bundle, selectedCategoryId],
  );
  const wizardSteps = useMemo(() => buildWizardSteps(), []);
  const selectionState = useMemo(
    () => ({
      selectedCategory,
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
        live: Boolean(selectedTemplate && selectedProduct && selectedCategory && wizardStepIndex < 3),
        mockup: Boolean(selectedTemplate && selectedProduct && selectedCategory && wizardStepIndex >= 3),
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
      selectedCategory,
      selectedVariant,
      wizardStepIndex,
    ],
  );
  const matchingTemplates = useMemo(() => {
    const templates = bundle ? visibleTemplates(bundle).filter((template) => !selectedProductId || template.product_id === selectedProductId) : [];

    return templates
      .map((template, index) => ({ template, index }))
      .sort((left, right) => templateRecommendationIndex(left.template, left.index) - templateRecommendationIndex(right.template, right.index))
      .map(({ template }) => template);
  }, [bundle, selectedProductId]);
  const productById = useMemo(
    () => new Map(bundle?.products.map((product) => [product.id, product] as const) ?? []),
    [bundle],
  );
  const designStepIndex = 1;
  const contentStepIndex = 2;
  const reviewStepIndex = 3;
  const validationIssues = qualityReport?.issues ?? EMPTY_VALIDATION_ISSUES;
  const visibleValidationIssues = useMemo(
    () =>
      validationRevealAll
        ? validationIssues
        : validationIssues.filter((issue) => touchedValidationPaths[validationDisplayPath(issue)]),
    [touchedValidationPaths, validationIssues, validationRevealAll],
  );
  const visibleBlockingIssues = visibleValidationIssues.filter((issue) => issue.blocking);
  const recommendedTemplateKey = matchingTemplates[0] ? templateKey(matchingTemplates[0]) : null;
  const recommendedVariantId = matchingTemplates[0] ? activeDesigns(matchingTemplates[0])[0]?.id ?? null : null;
  const recommendedProductId = recommendedProducts[0]?.id ?? null;
  const previewMode: PreviewMode = selectionState.previewState.live ? 'live' : selectionState.previewState.mockup ? 'mockup' : 'hidden';

  function syncSelectionFromDraft(draft: DraftState) {
    const firstCategory = bundle?.categories.find((category) => category.active);
    const firstProduct = bundle?.products.find((product) => product.active);
    setSelectedCategoryId(draft.category_id ?? firstCategory?.id ?? null);
    setSelectedProductId(draft.product_id ?? firstProduct?.id ?? null);
    setSelectedTemplateKey(draft.template_id && draft.template_version ? `${draft.template_id}@${draft.template_version}` : null);
    setSelectedVariantId(draft.layout_state.design_id || null);
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
    if (!bundle || availableProducts.length === 0) {
      return;
    }
    if (!selectedProductId) {
      setSelectedProductId(availableProducts[0].id);
    }
  }, [availableProducts, bundle, selectedProductId]);

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
  }, [bundle, matchingTemplates, selectedTemplateKey]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    const resolvedVariant = activeDesign(selectedTemplate, selectedVariantId);
    if (resolvedVariant?.id === selectedVariantId) {
      return;
    }
    setSelectedVariantId(resolvedVariant?.id ?? null);
  }, [selectedTemplate, selectedVariantId]);

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
      .catch(() => {
        if (active) {
          setQualityReport(null);
          setQualityError(uiText.selection.errors.validationUnavailable);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTemplateKey, layoutValues, selectedVariantId]);

  function applyProductSelection(productId: string) {
    const nextCategoryId = bundle ? primaryCategoryIdForProduct(bundle, productId) : null;
    setSelectedProductId(productId);
    setSelectedCategoryId(nextCategoryId ?? bundle?.categories.find((category) => category.active)?.id ?? selectedCategoryId);
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
    if (isApproved) {
      return;
    }
    if (productId === selectedProductId) {
      setPendingProductId(null);
      setWizardStepIndex(designStepIndex);
      return;
    }
    if (selectedTemplate && selectedTemplate.product_id !== productId) {
      setPendingProductId(productId);
      return;
    }
    applyProductSelection(productId);
    setWizardStepIndex(designStepIndex);
  }

  function goToPreviousWizardStep() {
    setWizardStepIndex((current) => Math.max(0, current - 1));
  }

  async function handleTemplateSelect(template: TemplateDefinition, variant?: TemplateDesignDefinition) {
    if (!selectedCategoryId || !selectedProductId || isApproved) {
      return;
    }
    const demoCategory =
      selectedCategory ?? bundle?.categories.find((category) => category.id === selectedCategoryId) ?? bundle?.categories.find((category) => category.active) ?? null;
    if (!demoCategory) {
      return;
    }
    const fallbackVariant = variant ?? activeDesign(template, selectedVariantId);
    const response = await saveTemplateSelection({
      category_id: selectedCategoryId,
      product_id: selectedProductId,
      template_id: template.id,
      template_version: template.version,
      design_id: fallbackVariant?.id ?? null,
    });
    setSelectedTemplateKey(
      response.template_id && response.template_version ? `${response.template_id}@${response.template_version}` : null,
    );
    setSelectedVariantId(response.design_id ?? response.layout_state.design_id ?? fallbackVariant?.id ?? null);
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
          return [field.id, trimSuggestion(fieldDefaultValue(field, index, demoCategory), field.max_length)];
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
    } catch {
      setAssetErrors((current) => ({
        ...current,
        [fieldId]: uiText.selection.errors.fileUnavailable,
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
    if (!selectedTemplate || !selectedCategory || !selectedProduct || isApproved) {
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
    } catch {
      setApprovalError(uiText.selection.errors.approvalUnavailable);
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
    } catch {
      setResetError(uiText.selection.errors.resetUnavailable);
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
    } catch {
      setApprovalError(uiText.selection.errors.orderUnavailable);
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
    return fieldLabel(field, selectedTemplate.fields.indexOf(field));
  }

  return {
    state,
    bundle,
    selectedCategory,
    selectedProduct,
    selectedTemplate,
    selectedVariant,
    selectedCategoryId,
    selectedProductId,
    selectedTemplateKey,
    selectedVariantId,
    setWizardStepIndex,
    layoutValues,
    assetPreviews,
    assetDetails,
    assetErrors,
    qualityReport,
    qualityError,
    approvalChecklist,
    approvalError,
    approvalSubmitting,
    wizardStepIndex,
    resetError,
    resetSubmitting,
    pendingProduct,
    expandedAssetFieldId,
    previewExpanded,
    orderSubmitting,
    availableProducts,
    wizardSteps,
    selectionState,
    matchingTemplates,
    productById,
    designStepIndex,
    contentStepIndex,
    reviewStepIndex,
    validationIssues,
    visibleValidationIssues,
    visibleBlockingIssues,
    recommendedTemplateKey,
    recommendedVariantId,
    recommendedProductId,
    previewMode,
    isApproved,
    approvalReady,
    handleProductSelect,
    handleTemplateSelect,
    handleTextFieldChange,
    handleAssetFieldChange,
    handleAssetAdjustmentChange,
    handleAssetAdjustmentReset,
    handleLayoutReset,
    handleApprovalSubmit,
    handleDraftReset,
    handleOrderCreate,
    goToPreviousWizardStep,
    markValidationPathTouched,
    issueLabel,
    setPendingProductId,
    setExpandedAssetFieldId,
    setPreviewExpanded,
    setApprovalChecklist,
    setDraft,
    syncSelectionFromDraft,
    stateError: state.error,
  };
}
