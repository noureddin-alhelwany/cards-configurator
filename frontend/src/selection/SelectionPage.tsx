import './SelectionPage.css';
import StateMessage from '../ui/StateMessage';
import { SelectionContentPanel, SelectionFeedbackPanel, SelectionPreviewPanel, SelectionReviewPanel } from './selectionPanels';
import { ProductCard, TemplateCard, UseCaseCard } from './selectionUi';
import { useSelectionFlow, visibleProductUseCaseNames } from './selectionFlow';
import { templateKey } from './selectionRules';

export default function SelectionPage() {
  const {
    state,
    bundle,
    selectedUseCase,
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
    matchingProducts,
    showProductStep,
    wizardSteps,
    matchingTemplates,
    productById,
    designStepIndex,
    contentStepIndex,
    reviewStepIndex,
    visibleValidationIssues,
    visibleBlockingIssues,
    showBlockingSummary,
    recommendedTemplateKey,
    recommendedProductId,
    previewVisible,
    previewShowsMockup,
    isApproved,
    approvalReady,
    handleUseCaseSelect,
    handleProductSelect,
    handleTemplateSelect,
    handleVariantSelect,
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
        <StateMessage tone="error" kicker="Internal bootstrap" title="Cards Configurator" description={state.error} />
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
                          selected={useCase.id === selectedUseCase?.id}
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
                    disabled={!selectedUseCase}
                    onClick={() => setWizardStepIndex(designStepIndex)}
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
                        onClick={() => handleProductSelect(pendingProduct.id)}
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
                      selected={product.id === selectedProduct?.id}
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
                      {selectedProduct.trim_width_mm} × {selectedProduct.trim_height_mm} mm für{' '}
                      {visibleProductUseCaseNames(bundle, selectedProduct.id).length} passende Use Cases.
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
                    disabled={!selectedProduct}
                    onClick={() => setWizardStepIndex(contentStepIndex)}
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
                    disabled={!selectedTemplate}
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
                blockingIssuesCount={visibleBlockingIssues.length}
                approvalReady={approvalReady}
                approvalSubmitting={approvalSubmitting}
                orderSubmitting={orderSubmitting}
                approvedAt={state.draft?.approved_at}
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
