import type {
  ProductDefinition,
  TemplateDefinition,
  UseCaseDefinition,
} from '../registries/types';
import type { ElementAdjustment, ValidationIssue } from '../design/types';
import { TemplateLivePreview } from './selectionUi';
import { friendlyValidationMessage } from './selectionUi';

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
