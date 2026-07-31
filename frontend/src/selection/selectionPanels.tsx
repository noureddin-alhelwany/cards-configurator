import type {
  ProductDefinition,
  TemplateDefinition,
  TemplateVariantDefinition,
  UseCaseDefinition,
} from '../registries/types';
import type { ElementAdjustment, ValidationIssue } from '../design/types';
import type { AssetMetadata } from './selectionHelpers';
import { uiText } from '../ui/text';
import { TemplateFieldsList, TemplateLivePreview, TemplateVariantButtons } from './selectionUi';
import { friendlyValidationMessage } from './selectionUi';
import type { DraftLayoutValues } from './selectionTypes';

type SelectionPreviewPanelProps = {
  previewMode: 'hidden' | 'live' | 'mockup';
  selectedTemplate: TemplateDefinition | null;
  selectedProduct: ProductDefinition | null;
  selectedUseCase: UseCaseDefinition | null;
  selectedVariantId: string | null;
  layoutValues: {
    text_values: Record<string, string>;
    asset_values: Record<string, string>;
    element_adjustments: Record<string, ElementAdjustment>;
  };
  assetPreviews: Record<string, string>;
  validationIssues: ValidationIssue[];
  previewExpanded: boolean;
  onToggleExpanded: () => void;
};

export function SelectionPreviewPanel({
  previewMode,
  selectedTemplate,
  selectedProduct,
  selectedUseCase,
  selectedVariantId,
  layoutValues,
  assetPreviews,
  validationIssues,
  previewExpanded,
  onToggleExpanded,
}: SelectionPreviewPanelProps) {
  const previewVisible = previewMode !== 'hidden';
  const previewStateText =
    previewMode === 'mockup'
      ? uiText.selection.preview.approvalVisible
      : previewMode === 'live'
        ? uiText.selection.preview.liveVisible
        : uiText.selection.preview.previewHidden;
  return (
    <section className="selection-sidecard">
      <div className="selection-section__heading">
        <h2>{previewMode === 'mockup' ? uiText.selection.preview.approvalTitle : uiText.selection.preview.liveTitle}</h2>
        <p>{previewStateText}</p>
      </div>
      {previewVisible && selectedTemplate && selectedProduct && selectedUseCase ? (
        <TemplateLivePreview
          template={selectedTemplate}
          product={selectedProduct}
          useCase={selectedUseCase}
          selectedVariantId={selectedVariantId}
          layoutValues={layoutValues}
          assetPreviews={assetPreviews}
          validationIssues={validationIssues}
          showLivePreview={previewMode === 'live'}
          showMockup={previewMode === 'mockup'}
          expanded={previewExpanded}
          onToggleExpanded={onToggleExpanded}
        />
      ) : (
        <p className="selection-sidecard__empty">{uiText.selection.preview.empty}</p>
      )}
    </section>
  );
}

type SelectionFeedbackPanelProps = {
  qualityError: string | null;
  approvalError: string | null;
  resetError: string | null;
  visibleValidationIssues: ValidationIssue[];
  visibleBlockingIssues: ValidationIssue[];
  showBlockingSummary: boolean;
  issueLabel: (issue: ValidationIssue) => string;
};

export function SelectionFeedbackPanel({
  qualityError,
  approvalError,
  resetError,
  visibleValidationIssues,
  visibleBlockingIssues,
  showBlockingSummary,
  issueLabel,
}: SelectionFeedbackPanelProps) {
  return (
    <section className="selection-sidecard">
      <div className="selection-section__heading">
        <h2>{uiText.selection.feedback.title}</h2>
        <p>{visibleValidationIssues.length} {uiText.selection.feedback.hint}</p>
      </div>
      <div className="selection-feedback">
        {qualityError ? <p className="template-field__error">{qualityError}</p> : null}
        {approvalError ? <p className="template-field__error">{approvalError}</p> : null}
        {resetError ? <p className="template-field__error">{resetError}</p> : null}
        {showBlockingSummary ? (
          <p className="selection-feedback__summary">
            {visibleBlockingIssues.length} {uiText.selection.feedback.blockingSummary}
          </p>
        ) : null}
        {visibleValidationIssues.length > 0 ? (
          <div className="template-quality">
            <p className="template-detail__group-title">{uiText.selection.feedback.qualityTitle}</p>
            <ul className="template-quality__list">
              {visibleValidationIssues.map((issue) => (
                <li key={`${issue.path}-${issue.code}`} className={`template-quality__item template-quality__item--${issue.severity}`}>
                  <strong>{issue.severity === 'warning' ? 'Hinweis' : 'Fehler'}</strong>
                  <span>{friendlyValidationMessage(issue, issueLabel(issue))}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="selection-sidecard__empty">{uiText.selection.feedback.empty}</p>
        )}
      </div>
    </section>
  );
}

type SelectionContentPanelProps = {
  showProductStep: boolean;
  selectedTemplate: TemplateDefinition;
  selectedProduct: ProductDefinition;
  selectedVariantId: string | null;
  layoutValues: DraftLayoutValues;
  assetPreviews: Record<string, string>;
  assetDetails: Record<string, AssetMetadata>;
  assetErrors: Record<string, string | null>;
  validationIssues: ValidationIssue[];
  expandedAssetFieldId: string | null;
  isApproved: boolean;
  onLayoutReset: () => void;
  onVariantSelect: (variant: TemplateVariantDefinition) => Promise<void> | void;
  onTextFieldChange: (fieldId: string, value: string) => Promise<void> | void;
  onAssetFieldChange: (fieldId: string, kind: 'logo' | 'image', file: File | null) => Promise<void> | void;
  onAssetAdjustmentChange: (fieldId: string, adjustment: ElementAdjustment) => Promise<void> | void;
  onAssetAdjustmentReset: (fieldId: string) => Promise<void> | void;
  onToggleAssetEditor: (fieldId: string | null) => void;
  onFieldInteract: (fieldId: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function SelectionContentPanel({
  showProductStep,
  selectedTemplate,
  selectedProduct,
  selectedVariantId,
  layoutValues,
  assetPreviews,
  assetDetails,
  assetErrors,
  validationIssues,
  expandedAssetFieldId,
  isApproved,
  onLayoutReset,
  onVariantSelect,
  onTextFieldChange,
  onAssetFieldChange,
  onAssetAdjustmentChange,
  onAssetAdjustmentReset,
  onToggleAssetEditor,
  onFieldInteract,
  onBack,
  onNext,
}: SelectionContentPanelProps) {
  return (
    <section className="selection-section selection-section--wizard selection-step-panel">
      <div className="selection-section__heading">
        <h2>{showProductStep ? uiText.selection.content.titleWithProduct : uiText.selection.content.titleWithoutProduct}</h2>
        <p>{uiText.selection.content.summary}</p>
      </div>
      <article className="template-detail">
        <p className="template-detail__eyebrow">{uiText.selection.content.eyebrow}</p>
        <h3>{selectedTemplate.name ?? uiText.common.templateFallback}</h3>
        <div className="template-detail__actions">
          <button type="button" className="template-field__reset" disabled={isApproved} onClick={onLayoutReset}>
            {uiText.selection.content.contentReset}
          </button>
        </div>
        <p className="template-detail__meta">{uiText.selection.content.meta}</p>
        <p className="template-detail__hint">{uiText.selection.content.hint}</p>
        <div className="template-detail__group">
          <p className="template-detail__group-title">{uiText.selection.content.variants}</p>
          <TemplateVariantButtons template={selectedTemplate} selectedVariantId={selectedVariantId} onSelect={onVariantSelect} disabled={isApproved} />
        </div>
        <div className="template-detail__group">
          <p className="template-detail__group-title">{uiText.selection.content.fields}</p>
          <TemplateFieldsList
            template={selectedTemplate}
            product={selectedProduct}
            layoutValues={layoutValues}
            assetPreviews={assetPreviews}
            assetDetails={assetDetails}
            assetErrors={assetErrors}
            validationIssues={validationIssues}
            onTextChange={onTextFieldChange}
            onAssetChange={onAssetFieldChange}
            onAssetAdjustmentChange={onAssetAdjustmentChange}
            onAssetAdjustmentReset={onAssetAdjustmentReset}
            expandedAssetFieldId={expandedAssetFieldId}
            onToggleAssetEditor={onToggleAssetEditor}
            onFieldInteract={onFieldInteract}
            disabled={isApproved}
          />
        </div>
      </article>
      <div className="wizard-step-nav">
        <button type="button" className="wizard-step-nav__button" onClick={onBack}>
          {uiText.common.back}
        </button>
        <button type="button" className="wizard-step-nav__button wizard-step-nav__button--primary" onClick={onNext}>
          {uiText.selection.buttons.toReview}
        </button>
      </div>
    </section>
  );
}

type SelectionReviewPanelProps = {
  showProductStep: boolean;
  selectedTemplate: TemplateDefinition;
  selectedProduct: ProductDefinition;
  isApproved: boolean;
  blockingIssuesCount: number;
  approvalReady: boolean;
  approvalSubmitting: boolean;
  orderSubmitting: boolean;
  approvedAt: string | null | undefined;
  onBack: () => void;
  onSubmit: () => void;
  onApprovalChange: (checked: boolean) => void;
};

export function SelectionReviewPanel({
  showProductStep,
  selectedTemplate,
  selectedProduct,
  isApproved,
  blockingIssuesCount,
  approvalReady,
  approvalSubmitting,
  orderSubmitting,
  approvedAt,
  onBack,
  onSubmit,
  onApprovalChange,
}: SelectionReviewPanelProps) {
  return (
    <section className="selection-section selection-section--wizard selection-step-panel">
      <div className="selection-section__heading">
        <h2>{showProductStep ? uiText.selection.sections.reviewWithProduct : uiText.selection.sections.reviewWithoutProduct}</h2>
        <p>{isApproved ? uiText.selection.review.approvedStatus : uiText.selection.review.pendingStatus}</p>
      </div>
      <article className="template-detail">
        <p className="template-detail__eyebrow">{uiText.selection.review.eyebrow}</p>
        <h3>{selectedTemplate.name ?? uiText.common.templateFallback}</h3>
        <div className="template-detail__actions">
          <button type="button" className="template-field__reset" disabled={isApproved} onClick={onBack}>
            {uiText.selection.buttons.backToContent}
          </button>
          <button
            type="button"
            className="template-field__reset"
            disabled={blockingIssuesCount > 0 || (!isApproved && (!approvalReady || approvalSubmitting)) || (isApproved && orderSubmitting)}
            onClick={onSubmit}
          >
            {isApproved
              ? orderSubmitting
                ? uiText.selection.buttons.createOrderLoading
                : uiText.selection.buttons.createOrder
              : approvalSubmitting
                ? uiText.selection.buttons.releaseLoading
                : uiText.selection.buttons.release}
          </button>
        </div>
        {isApproved ? <p className="template-detail__approved">{uiText.selection.review.approvedAtPrefix} {new Date(approvedAt ?? '').toLocaleString('de-DE')}</p> : null}
        <p className="template-detail__meta">{uiText.selection.content.meta}</p>
        <p className="template-detail__hint">{uiText.selection.productDetail.selected}: {selectedProduct.name}</p>
        <div className="template-approval">
          <p className="template-detail__group-title">{uiText.selection.review.confirmedTitle}</p>
          <div className="template-approval__list">
            <label className="template-approval__item">
              <input
                type="checkbox"
                checked={approvalReady}
                disabled={isApproved}
                onChange={(event) => onApprovalChange(event.target.checked)}
              />
              <span>{uiText.selection.review.proofCheckbox}</span>
            </label>
          </div>
        </div>
        <p className="template-detail__hint">{uiText.selection.review.readyHint}</p>
      </article>
      <div className="wizard-step-nav">
        <button type="button" className="wizard-step-nav__button" onClick={onBack}>
          {uiText.selection.buttons.backToContent}
        </button>
      </div>
    </section>
  );
}
