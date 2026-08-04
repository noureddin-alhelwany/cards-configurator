import './SelectionPage.css';
import StateMessage from '../ui/StateMessage';
import { SelectionPreviewPanel, SelectionReviewPanel } from './selectionPanels';
import { SelectionContentPanel } from './selectionContentStep';
import { ProductCard, TemplateCard, DesignCard } from './selectionCards';
import { useSelectionFlow } from './selectionFlow';
import { activeVariants, templateKey, validationDisplayPath } from './selectionRules';
import type { ValidationIssue } from '../design/types';
import { uiText } from '../ui/text';

export default function SelectionPage() {
  const {
    state,
    bundle,
    selectedCategory,
    selectedProduct,
    selectedTemplate,
    selectedTemplateKey,
    selectedVariantId,
    wizardStepIndex,
    setWizardStepIndex,
    layoutValues,
    assetPreviews,
    assetDetails,
    assetErrors,
    qualityError,
    approvalError,
    resetError,
    approvalSubmitting,
    resetSubmitting,
    pendingProduct,
    expandedAssetFieldId,
    previewExpanded,
    orderSubmitting,
    availableProducts,
    wizardSteps,
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
  } = useSelectionFlow();

  if (state.error) {
    return (
      <main className="selection-shell selection-shell--error">
        <StateMessage tone="error" kicker={uiText.appName} title={uiText.appName} description={state.error} />
      </main>
    );
  }

  if (!bundle) {
    return (
      <main className="selection-shell">
        <StateMessage
          tone="loading"
          kicker={uiText.selection.loading.kicker}
          title={uiText.selection.loading.title}
          description={uiText.selection.loading.description}
        />
      </main>
    );
  }

  /** Reveals an issue and jumps to the field it belongs to. */
  function focusValidationIssue(issue: ValidationIssue) {
    const path = validationDisplayPath(issue);
    markValidationPathTouched(path);
    const field = document.getElementById(path);
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = field?.querySelector<HTMLElement>('input, textarea, button');
    focusable?.focus();
  }

  const activeStepIndex = Math.min(wizardStepIndex, wizardSteps.length - 1);
  const activeStep = wizardSteps[activeStepIndex] ?? wizardSteps[0];
  const showSupplementaryPanels = activeStep.id === 'content' || activeStep.id === 'review';
  const wizardHint =
    activeStep.id === 'product'
      ? uiText.selection.wizardSteps.product.hint
      : activeStep.id === 'design'
        ? uiText.selection.wizardSteps.design.hint
        : activeStep.id === 'content'
          ? uiText.selection.wizardSteps.content.hint
          : uiText.selection.wizardSteps.review.hint;

  return (
    <main className="selection-shell">
      <section className="selection-panel">
        <header className="selection-header">
          <div className="selection-header__copy">
            <p className="selection-kicker">{uiText.appName}</p>
            <h1>{uiText.selection.header.title}</h1>
            <p className="selection-lede">{uiText.selection.header.lead}</p>
            <p className="selection-lede selection-lede--compact" aria-live="polite">
              Schritt {activeStepIndex + 1} von {wizardSteps.length}: {activeStep.title}. {wizardHint}
            </p>
          </div>
          <div className="selection-header__actions">
            <p className="selection-header__autosave" aria-live="polite">
              {uiText.selection.autosave.saved}
            </p>
            <details className="selection-header__menu">
              <summary className="wizard-step-nav__button">{uiText.selection.buttons.more}</summary>
              <div className="selection-header__menu-panel">
                <button
                  type="button"
                  className="wizard-step-nav__button"
                  disabled={resetSubmitting}
                  onClick={() => {
                    if (window.confirm(uiText.selection.buttons.resetConfirm)) {
                      void handleDraftReset();
                    }
                  }}
                >
                  {resetSubmitting ? uiText.selection.buttons.resetPending : isApproved ? uiText.selection.buttons.resetNew : uiText.selection.buttons.reset}
                </button>
                {activeStep.id === 'content' ? (
                  <button type="button" className="wizard-step-nav__button" disabled={isApproved} onClick={handleLayoutReset}>
                    {uiText.selection.content.adjustmentReset}
                  </button>
                ) : null}
                <p className="selection-header__hint">
                  {isApproved ? uiText.selection.buttons.resetLockedHint : uiText.selection.buttons.resetHint}
                </p>
              </div>
            </details>
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

        <div className={`selection-layout${showSupplementaryPanels ? '' : ' selection-layout--single'}`}>
          <main className="selection-main">
            {activeStep.id === 'product' ? (
              <section className="selection-section selection-section--wizard selection-step-panel">
                <div className="selection-section__heading">
                  <h2>{uiText.selection.sections.product}</h2>
                  <p>{availableProducts.length} Einträge</p>
                </div>
                {pendingProduct ? (
                  <div className="product-change-notice" role="alert">
                    <p className="product-change-notice__title">{uiText.selection.productChange.title}</p>
                    <p className="product-change-notice__body">
                      {uiText.selection.productChange.bodyPrefix} <strong>{pendingProduct.name}</strong>{' '}
                      {uiText.selection.productChange.bodySuffix}
                    </p>
                    <div className="product-change-notice__actions">
                      <button type="button" className="wizard-step-nav__button" onClick={() => setPendingProductId(null)}>
                        {uiText.selection.buttons.productCancel}
                      </button>
                      <button
                        type="button"
                        className="wizard-step-nav__button wizard-step-nav__button--primary"
                        onClick={() => handleProductSelect(pendingProduct.id)}
                      >
                        {uiText.selection.buttons.productSwitch}
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="product-grid">
                  {availableProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      bundle={bundle}
                      selectedCategoryId={selectedCategory?.id ?? null}
                      selected={product.id === selectedProduct?.id}
                      onSelect={handleProductSelect}
                      recommended={product.id === recommendedProductId}
                      disabled={isApproved}
                    />
                  ))}
                </div>
                <div className="wizard-step-nav">
                  <button type="button" className="wizard-step-nav__button" disabled={activeStepIndex === 0} onClick={goToPreviousWizardStep}>
                    {uiText.common.back}
                  </button>
                  <button
                    type="button"
                    className="wizard-step-nav__button wizard-step-nav__button--primary"
                    disabled={!selectedProduct}
                    onClick={() => setWizardStepIndex(designStepIndex)}
                  >
                    {uiText.common.next}
                  </button>
                </div>
              </section>
            ) : null}

            {activeStep.id === 'design' ? (
              <section className="selection-section selection-section--wizard selection-step-panel">
                <div className="selection-section__heading">
                  <h2>{uiText.selection.sections.design}</h2>
                  <p>
                    {matchingTemplates.length === 1 && activeVariants(matchingTemplates[0]).length > 1
                      ? activeVariants(matchingTemplates[0]).length
                      : matchingTemplates.length}{' '}
                    Einträge
                  </p>
                </div>
                <div className="template-grid">
                  {matchingTemplates.length === 1 && activeVariants(matchingTemplates[0]).length > 1 ? (
                    activeVariants(matchingTemplates[0]).map((variant) => (
                      <DesignCard
                        key={variant.id}
                        template={matchingTemplates[0]}
                        product={selectedProduct}
                        category={selectedCategory}
                        variant={variant}
                        selected={templateKey(matchingTemplates[0]) === selectedTemplateKey && variant.id === selectedVariantId}
                        recommended={variant.id === recommendedVariantId}
                        onSelect={handleTemplateSelect}
                        disabled={isApproved}
                      />
                    ))
                  ) : matchingTemplates.length > 0 ? (
                    matchingTemplates.map((template) => (
                      <TemplateCard
                        key={templateKey(template)}
                        template={template}
                        product={productById.get(template.product_id) ?? null}
                        category={selectedCategory}
                        selected={templateKey(template) === selectedTemplateKey}
                        recommended={templateKey(template) === recommendedTemplateKey}
                        onSelect={handleTemplateSelect}
                        disabled={isApproved}
                      />
                    ))
                  ) : (
                    <StateMessage
                      tone="empty"
                      kicker={uiText.selection.emptyDesigns.kicker}
                      title={uiText.selection.emptyDesigns.title}
                      description={uiText.selection.emptyDesigns.description}
                    />
                  )}
                </div>
                <div className="wizard-step-nav">
                  <button type="button" className="wizard-step-nav__button" onClick={goToPreviousWizardStep}>
                    {uiText.common.back}
                  </button>
                  <button
                    type="button"
                    className="wizard-step-nav__button wizard-step-nav__button--primary"
                    disabled={!selectedTemplate}
                    onClick={() => setWizardStepIndex(contentStepIndex)}
                  >
                    {uiText.common.next}
                  </button>
                </div>
              </section>
            ) : null}

            {activeStep.id === 'content' && selectedTemplate && selectedProduct && selectedCategory ? (
              <SelectionContentPanel
                selectedTemplate={selectedTemplate}
                selectedVariantId={selectedVariantId}
                layoutValues={layoutValues}
                assetPreviews={assetPreviews}
                assetDetails={assetDetails}
                assetErrors={assetErrors}
                validationIssues={visibleValidationIssues}
                visibleBlockingIssues={visibleBlockingIssues}
                qualityError={qualityError}
                approvalError={approvalError}
                resetError={resetError}
                expandedAssetFieldId={expandedAssetFieldId}
                isApproved={isApproved}
                issueLabel={issueLabel}
                onIssueSelect={focusValidationIssue}
                onChangeDesign={() => setWizardStepIndex(designStepIndex)}
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

            {activeStep.id === 'review' && selectedTemplate && selectedProduct && selectedCategory ? (
              <SelectionReviewPanel
                selectedTemplate={selectedTemplate}
                selectedProduct={selectedProduct}
                isApproved={isApproved}
                blockingIssuesCount={validationIssues.filter((issue) => issue.blocking).length}
                validationIssues={validationIssues}
                approvalReady={approvalReady}
                approvalSubmitting={approvalSubmitting}
                orderSubmitting={orderSubmitting}
                approvedAt={state.draft?.approved_at}
                qualityError={qualityError}
                approvalError={approvalError}
                resetError={resetError}
                onBack={goToPreviousWizardStep}
                onSubmit={isApproved ? handleOrderCreate : handleApprovalSubmit}
                onApprovalChange={(checked) =>
                  setApprovalChecklist(
                    checked
                      ? {
                          texts_checked: true,
                          url_checked: true,
                          image_crop_checked: true,
                          preview_released: true,
                        }
                      : {
                          texts_checked: false,
                          url_checked: false,
                          image_crop_checked: false,
                          preview_released: false,
                        },
                  )
                }
              />
            ) : null}
          </main>

          {showSupplementaryPanels ? (
            <aside className="selection-sidebar" aria-label={uiText.selection.preview.liveTitle}>
              <SelectionPreviewPanel
                previewMode={previewMode}
                selectedTemplate={selectedTemplate}
                selectedProduct={selectedProduct}
                selectedCategory={selectedCategory}
                selectedVariantId={selectedVariantId}
                layoutValues={layoutValues}
                assetPreviews={assetPreviews}
                validationIssues={visibleValidationIssues}
                previewExpanded={previewExpanded}
                onToggleExpanded={() => setPreviewExpanded((current) => !current)}
              />
            </aside>
          ) : null}
        </div>
      </section>
    </main>
  );
}
