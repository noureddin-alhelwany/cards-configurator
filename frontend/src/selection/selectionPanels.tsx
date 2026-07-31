import type {
  ProductDefinition,
  TemplateDefinition,
  TemplateVariantDefinition,
  UseCaseDefinition,
} from '../registries/types';
import type { ElementAdjustment, ValidationIssue } from '../design/types';
import type { AssetMetadata } from './selectionHelpers';
import { assetElementForField, clamp } from './selectionHelpers';
import { uiText } from '../ui/text';
import { TemplateFieldsList, TemplateLivePreview, TemplateVariantButtons } from './selectionUi';
import { friendlyValidationMessage, fieldLabel } from './selectionRules';
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
  onIssueSelect: (issue: ValidationIssue) => void;
};

export function SelectionFeedbackPanel({
  qualityError,
  approvalError,
  resetError,
  visibleValidationIssues,
  visibleBlockingIssues,
  showBlockingSummary,
  issueLabel,
  onIssueSelect,
}: SelectionFeedbackPanelProps) {
  const hasIssues = visibleValidationIssues.length > 0;
  const hasErrors = Boolean(qualityError || approvalError || resetError);
  const issueCountLabel = visibleValidationIssues.length === 1 ? 'Hinweis' : uiText.selection.feedback.hint;

  return (
    <section className="selection-sidecard">
      <div className="selection-section__heading">
        <h2>{uiText.selection.feedback.title}</h2>
        <p>{hasIssues ? `${visibleValidationIssues.length} ${issueCountLabel}` : uiText.selection.feedback.allGood}</p>
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
        {hasIssues ? (
          <div className="template-quality">
            <p className="template-detail__group-title">{uiText.selection.feedback.qualityTitle}</p>
            <ul className="template-quality__list">
              {visibleValidationIssues.map((issue) => (
                <li key={`${issue.path}-${issue.code}`}>
                  <button
                    type="button"
                    className={`template-quality__item template-quality__item--button template-quality__item--${issue.severity}`}
                    onClick={() => onIssueSelect(issue)}
                  >
                    <strong>{issue.severity === 'warning' ? 'Hinweis' : 'Fehler'}</strong>
                    <span>{friendlyValidationMessage(issue, issueLabel(issue))}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : !hasErrors ? (
          <p className="selection-sidecard__empty">{uiText.selection.feedback.empty}</p>
        ) : null}
      </div>
    </section>
  );
}

type TemplateImageAdjustmentDialogProps = {
  template: TemplateDefinition;
  layoutValues: DraftLayoutValues;
  assetPreviews: Record<string, string>;
  assetDetails: Record<string, AssetMetadata>;
  expandedAssetFieldId: string | null;
  isApproved: boolean;
  onAssetAdjustmentChange: (fieldId: string, adjustment: ElementAdjustment) => Promise<void> | void;
  onAssetAdjustmentReset: (fieldId: string) => Promise<void> | void;
  onClose: () => void;
};

function TemplateImageAdjustmentDialog({
  template,
  layoutValues,
  assetPreviews,
  assetDetails,
  expandedAssetFieldId,
  isApproved,
  onAssetAdjustmentChange,
  onAssetAdjustmentReset,
  onClose,
}: TemplateImageAdjustmentDialogProps) {
  if (!expandedAssetFieldId) {
    return null;
  }

  const field = template.fields.find((entry) => entry.id === expandedAssetFieldId) ?? null;
  if (!field) {
    return null;
  }

  const assetElement = assetElementForField(template, field.id);
  if (!assetElement) {
    return null;
  }

  const fieldIndex = template.fields.indexOf(field);
  const title = fieldLabel(field, fieldIndex);
  const assetValue = layoutValues.asset_values[field.id] ?? '';
  const assetPreview = assetPreviews[field.id] ?? (assetValue.startsWith('data:') ? assetValue : '');
  const assetDetail = assetDetails[field.id] ?? null;
  const assetAdjustment = layoutValues.element_adjustments[assetElement.id] ?? { offset_x: 0, offset_y: 0, scale: 1 };

  return (
    <div className="template-image-dialog" role="dialog" aria-modal="true" aria-labelledby="template-image-dialog__title">
      <button type="button" className="template-image-dialog__backdrop" aria-label="Dialog schließen" onClick={onClose} />
      <div className="template-image-dialog__panel">
        <div className="template-image-dialog__header">
          <div>
            <p className="template-detail__eyebrow">Bildbearbeitung</p>
            <h3 id="template-image-dialog__title">{title}</h3>
            <p className="template-image-dialog__hint">Bild verschieben, zoomen und direkt kontrollieren.</p>
          </div>
          <button type="button" className="template-field__reset" onClick={onClose}>
            Schließen
          </button>
        </div>
        <div className="template-image-dialog__body">
          <div className="template-image-dialog__preview">
            {assetPreview ? <img src={assetPreview} alt={`${title} Vorschau`} /> : <div className="template-field__preview--empty">Kein Upload</div>}
          </div>
          <div className="template-image-dialog__controls">
            <label className="template-field__control">
              <span>Verschieben X</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={assetAdjustment.offset_x}
                disabled={isApproved}
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
              <span>Verschieben Y</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={assetAdjustment.offset_y}
                disabled={isApproved}
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
                value={assetAdjustment.scale}
                disabled={isApproved}
                onChange={(event) =>
                  onAssetAdjustmentChange(field.id, {
                    ...assetAdjustment,
                    scale: clamp(Number(event.target.value), assetElement.min_scale, assetElement.max_scale),
                  })
                }
              />
              <output>{assetAdjustment.scale.toFixed(2)}</output>
            </label>
            {assetDetail ? (
              <p className="template-image-dialog__meta">
                {assetDetail.mime_type}
                {assetDetail.width_px && assetDetail.height_px ? ` · ${assetDetail.width_px} × ${assetDetail.height_px} px` : ''}
              </p>
            ) : null}
          </div>
        </div>
        <div className="template-image-dialog__actions">
          <button type="button" className="wizard-step-nav__button" disabled={isApproved} onClick={() => onAssetAdjustmentReset(field.id)}>
            Zurücksetzen
          </button>
          <button type="button" className="wizard-step-nav__button wizard-step-nav__button--primary" onClick={onClose}>
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}

type SelectionContentPanelProps = {
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
        <h2>{uiText.selection.content.title}</h2>
        <p>{uiText.selection.content.summary}</p>
      </div>
      <article className="template-detail">
        <p className="template-detail__eyebrow">{uiText.selection.content.eyebrow}</p>
        <h3>{selectedTemplate.name ?? uiText.common.templateFallback}</h3>
        {selectedTemplate.description ? <p className="template-detail__hint">{selectedTemplate.description}</p> : null}
        <p className="template-detail__meta">{selectedProduct.name}</p>
        <div className="template-detail__actions">
          <button type="button" className="template-field__reset" disabled={isApproved} onClick={onLayoutReset}>
            {uiText.selection.content.contentReset}
          </button>
        </div>
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
      <TemplateImageAdjustmentDialog
        template={selectedTemplate}
        layoutValues={layoutValues}
        assetPreviews={assetPreviews}
        assetDetails={assetDetails}
        expandedAssetFieldId={expandedAssetFieldId}
        isApproved={isApproved}
        onAssetAdjustmentChange={onAssetAdjustmentChange}
        onAssetAdjustmentReset={onAssetAdjustmentReset}
        onClose={() => onToggleAssetEditor(null)}
      />
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
  selectedTemplate: TemplateDefinition;
  selectedProduct: ProductDefinition;
  isApproved: boolean;
  blockingIssuesCount: number;
  validationIssues: ValidationIssue[];
  approvalReady: boolean;
  approvalSubmitting: boolean;
  orderSubmitting: boolean;
  approvedAt: string | null | undefined;
  onBack: () => void;
  onSubmit: () => void;
  onApprovalChange: (checked: boolean) => void;
};

export function SelectionReviewPanel({
  selectedTemplate,
  selectedProduct,
  isApproved,
  blockingIssuesCount,
  validationIssues,
  approvalReady,
  approvalSubmitting,
  orderSubmitting,
  approvedAt,
  onBack,
  onSubmit,
  onApprovalChange,
}: SelectionReviewPanelProps) {
  const requiredIssues = validationIssues.filter((issue) => issue.code === 'required_field_missing');
  const qrIssues = validationIssues.filter((issue) => issue.code === 'qr_too_small');
  const imageIssues = validationIssues.filter((issue) => issue.code === 'image_dpi_warning' || issue.code === 'image_dpi_too_low');
  const layoutIssues = validationIssues.filter((issue) => issue.code === 'text_overflow' || issue.code === 'text_too_long');
  const checks = [
    { title: 'Pflichtfelder', issues: requiredIssues, detail: 'Alle obligatorischen Felder sind gefüllt.' },
    { title: 'QR-Code', issues: qrIssues, detail: 'Der QR-Code ist ausreichend groß und gut lesbar.' },
    { title: 'Bildqualität', issues: imageIssues, detail: 'Bilder sind in ausreichender Qualität vorhanden.' },
    { title: 'Druckbereich', issues: layoutIssues, detail: 'Texte und Elemente bleiben im nutzbaren Bereich.' },
  ];

  return (
    <section className="selection-section selection-section--wizard selection-step-panel">
      <div className="selection-section__heading">
        <h2>{uiText.selection.sections.review}</h2>
        <p>{isApproved ? uiText.selection.review.approvedStatus : uiText.selection.review.pendingStatus}</p>
      </div>
      <article className="template-detail">
        <p className="template-detail__eyebrow">{uiText.selection.review.eyebrow}</p>
        <h3>{selectedTemplate.name ?? uiText.common.templateFallback}</h3>
        {selectedTemplate.description ? <p className="template-detail__hint">{selectedTemplate.description}</p> : null}
        <p className="template-detail__meta">{selectedProduct.name}</p>
        <div className="template-quality template-quality--review">
          <p className="template-detail__group-title">{uiText.selection.review.checkTitle}</p>
          <ul className="template-quality__list">
            {checks.map((check) => (
              <li key={check.title}>
                <div className={`template-quality__item template-quality__item--static template-quality__item--${check.issues.length > 0 ? 'error' : 'success'}`}>
                  <strong>{check.title}</strong>
                  <span>{check.issues.length > 0 ? `${check.issues.length} ${uiText.selection.review.checkPending}` : check.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
        <p className="template-detail__meta">{uiText.selection.review.meta}</p>
        <p className="template-detail__hint">{uiText.selection.review.readyHint}</p>
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
      </article>
    </section>
  );
}
