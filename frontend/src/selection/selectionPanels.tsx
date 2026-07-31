import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ProductDefinition, TemplateDefinition, UseCaseDefinition } from '../registries/types';
import type { ElementAdjustment, ValidationIssue } from '../design/types';
import { uiText } from '../ui/text';
import { TemplateLivePreview } from './selectionPreview';

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
  const title = previewMode === 'mockup' ? uiText.selection.preview.approvalTitle : uiText.selection.preview.liveTitle;
  const canRender = previewVisible && selectedTemplate && selectedProduct && selectedUseCase;

  // Escape leaves the enlarged view.
  useEffect(() => {
    if (!previewExpanded) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onToggleExpanded();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [previewExpanded, onToggleExpanded]);

  const preview = canRender ? (
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
    />
  ) : null;

  const toggle =
    previewVisible && selectedTemplate ? (
      <button type="button" className="content-step__link" aria-expanded={previewExpanded} onClick={onToggleExpanded}>
        {previewExpanded ? uiText.selection.preview.collapse : uiText.selection.preview.expand}
      </button>
    ) : null;

  return (
    <section className="selection-sidecard selection-sidecard--preview">
      <div className="selection-preview__heading">
        <h2>{title}</h2>
        {toggle}
      </div>
      {/* The enlarged view is portalled to <body>: `.selection-panel` sets
          `backdrop-filter`, which would otherwise clip a fixed overlay to the panel.
          Rendered in exactly one place so there is never a second live canvas. */}
      {preview && previewExpanded
        ? createPortal(
            <div className="preview-overlay" role="dialog" aria-modal="true" aria-label={title}>
              <div className="preview-overlay__bar">
                <h2>{title}</h2>
                <button type="button" className="wizard-step-nav__button" onClick={onToggleExpanded}>
                  {uiText.selection.preview.collapse}
                </button>
              </div>
              <div className="preview-overlay__body">{preview}</div>
            </div>,
            document.body,
          )
        : preview}
      {canRender ? null : <p className="selection-sidecard__empty">{uiText.selection.preview.empty}</p>}
    </section>
  );
}

type SelectionStepAlertsProps = {
  qualityError: string | null;
  approvalError: string | null;
  resetError: string | null;
};

/**
 * Non-field errors (quality check, approval, reset).
 *
 * These used to live in the always-on feedback sidecard. That panel is gone, so this
 * has to be rendered by every step that can trigger those failures — otherwise a
 * failed approval or reset would leave no visible trace at all.
 */
export function SelectionStepAlerts({ qualityError, approvalError, resetError }: SelectionStepAlertsProps) {
  const messages = [qualityError, approvalError, resetError].filter((message): message is string => Boolean(message));
  if (messages.length === 0) {
    return null;
  }
  return (
    <div className="content-step__alert" role="alert">
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
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
  qualityError: string | null;
  approvalError: string | null;
  resetError: string | null;
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
  qualityError,
  approvalError,
  resetError,
  onBack,
  onSubmit,
  onApprovalChange,
}: SelectionReviewPanelProps) {
  // Findings about static template copy carry `editable: false`. They are addressed to the
  // template author — showing them in the customer's checklist would ask them to fix
  // something they cannot reach.
  const actionable = validationIssues.filter((issue) => issue.details?.editable !== false);
  const requiredIssues = actionable.filter((issue) => issue.code === 'required_field_missing');
  const qrIssues = actionable.filter((issue) => issue.code === 'qr_too_small');
  const imageIssues = actionable.filter((issue) => issue.code === 'image_dpi_warning' || issue.code === 'image_dpi_too_low');
  const layoutIssues = actionable.filter((issue) => issue.code === 'text_overflow' || issue.code === 'text_too_long');
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
      <SelectionStepAlerts qualityError={qualityError} approvalError={approvalError} resetError={resetError} />
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
