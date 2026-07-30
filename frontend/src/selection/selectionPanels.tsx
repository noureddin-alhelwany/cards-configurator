import type {
  ProductDefinition,
  TemplateDefinition,
  TemplateVariantDefinition,
  UseCaseDefinition,
} from '../registries/types';
import type { ElementAdjustment, ValidationIssue } from '../design/types';
import type { AssetMetadata } from './selectionHelpers';
import { TemplateFieldsList, TemplateLivePreview, TemplateVariantButtons } from './selectionUi';
import { friendlyValidationMessage } from './selectionUi';
import type { DraftLayoutValues } from './selectionTypes';

type SelectionPreviewPanelProps = {
  previewShowsMockup: boolean;
  previewVisible: boolean;
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
  previewShowsMockup,
  previewVisible,
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
  return (
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
          validationIssues={validationIssues}
          showLivePreview={!previewShowsMockup}
          showMockup={previewShowsMockup}
          expanded={previewExpanded}
          onToggleExpanded={onToggleExpanded}
        />
      ) : (
        <p className="selection-sidecard__empty">Sobald ein Design gewählt ist, erscheint hier die Vorschau.</p>
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
        <h2>Rückmeldungen</h2>
        <p>{visibleValidationIssues.length} Hinweise</p>
      </div>
      <div className="selection-feedback">
        {qualityError ? <p className="template-field__error">{qualityError}</p> : null}
        {approvalError ? <p className="template-field__error">{approvalError}</p> : null}
        {resetError ? <p className="template-field__error">{resetError}</p> : null}
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
                  <span>{friendlyValidationMessage(issue, issueLabel(issue))}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="selection-sidecard__empty">Noch keine kritischen Rückmeldungen.</p>
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
        <h2>{showProductStep ? '4. Inhalte' : '3. Inhalte'}</h2>
        <p>Texte, Varianten und Medien</p>
      </div>
      <article className="template-detail">
        <p className="template-detail__eyebrow">Inhalte</p>
        <h3>
          {selectedTemplate.name ?? 'Vorlage'}
        </h3>
        <div className="template-detail__actions">
          <button type="button" className="template-field__reset" disabled={isApproved} onClick={onLayoutReset}>
            Layout zurücksetzen
          </button>
        </div>
        <p className="template-detail__meta">Vorlage für den gewählten Einsatzbereich</p>
        <p className="template-detail__hint">Passe Varianten und Felder an. Die Vorschau bleibt separat sichtbar.</p>
        <div className="template-detail__group">
          <p className="template-detail__group-title">Layoutvarianten</p>
          <TemplateVariantButtons template={selectedTemplate} selectedVariantId={selectedVariantId} onSelect={onVariantSelect} disabled={isApproved} />
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
          Zurück
        </button>
        <button type="button" className="wizard-step-nav__button wizard-step-nav__button--primary" onClick={onNext}>
          Zur Prüfung
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
        <h2>{showProductStep ? '5. Prüfen' : '4. Prüfen'}</h2>
        <p>{isApproved ? 'Freigabe abgeschlossen' : 'Freigabe und Auftragserstellung'}</p>
      </div>
      <article className="template-detail">
        <p className="template-detail__eyebrow">Freigabe</p>
        <h3>
          {selectedTemplate.name ?? 'Vorlage'}
        </h3>
        <div className="template-detail__actions">
          <button type="button" className="template-field__reset" disabled={isApproved} onClick={onBack}>
            Zur Inhalte
          </button>
          <button
            type="button"
            className="template-field__reset"
            disabled={blockingIssuesCount > 0 || (!isApproved && (!approvalReady || approvalSubmitting)) || (isApproved && orderSubmitting)}
            onClick={onSubmit}
          >
            {isApproved ? (orderSubmitting ? 'Auftrag wird erstellt...' : 'Auftrag erstellen') : approvalSubmitting ? 'Freigabe läuft...' : 'Design freigeben'}
          </button>
        </div>
        {isApproved ? <p className="template-detail__approved">Freigegeben am {new Date(approvedAt ?? '').toLocaleString('de-DE')}</p> : null}
        <p className="template-detail__meta">Vorlage für den gewählten Einsatzbereich</p>
        <p className="template-detail__hint">
          Ausgewähltes Produkt: {selectedProduct.name}
        </p>
        <div className="template-approval">
          <p className="template-detail__group-title">Prüfung bestätigt</p>
          <div className="template-approval__list">
            <label className="template-approval__item">
              <input
                type="checkbox"
                checked={approvalReady}
                disabled={isApproved}
                onChange={(event) => onApprovalChange(event.target.checked)}
              />
              <span>Ich habe die Vorschau geprüft</span>
            </label>
          </div>
        </div>
        <p className="template-detail__hint">Der finale Zustand wird jetzt geprüft. Nach der Freigabe kann der Auftrag erstellt werden.</p>
      </article>
      <div className="wizard-step-nav">
        <button type="button" className="wizard-step-nav__button" onClick={onBack}>
          Zur Inhalte
        </button>
      </div>
    </section>
  );
}
