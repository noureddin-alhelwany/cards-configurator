import type { TemplateDefinition, TemplateVariantDefinition } from '../registries/types';
import type { ElementAdjustment, ValidationIssue } from '../design/types';
import type { AssetMetadata } from './selectionHelpers';
import { uiText } from '../ui/text';
import { ContentFieldSections } from './selectionFields';
import { TemplateImageAdjustmentDialog } from './selectionImageDialog';
import { TemplateVariantButtons } from './selectionCards';
import { SelectionStepAlerts } from './selectionPanels';
import { friendlyValidationMessage, hasVariantChoice, templateStyleName } from './selectionRules';
import type { DraftLayoutValues } from './selectionTypes';

type SelectionContentPanelProps = {
  selectedTemplate: TemplateDefinition;
  selectedVariantId: string | null;
  layoutValues: DraftLayoutValues;
  assetPreviews: Record<string, string>;
  assetDetails: Record<string, AssetMetadata>;
  assetErrors: Record<string, string | null>;
  validationIssues: ValidationIssue[];
  visibleBlockingIssues: ValidationIssue[];
  qualityError: string | null;
  approvalError: string | null;
  resetError: string | null;
  expandedAssetFieldId: string | null;
  isApproved: boolean;
  issueLabel: (issue: ValidationIssue) => string;
  onIssueSelect: (issue: ValidationIssue) => void;
  onChangeDesign: () => void;
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

/**
 * The "Inhalte" step: a short guided form.
 *
 * Deliberately flat — one surface (the surrounding `.selection-panel`), then plain
 * sections separated by spacing and a hairline rule. The template owns layout, copy
 * and rules; this step only collects the few values it asks for.
 */
export function SelectionContentPanel({
  selectedTemplate,
  selectedVariantId,
  layoutValues,
  assetPreviews,
  assetDetails,
  assetErrors,
  validationIssues,
  visibleBlockingIssues,
  qualityError,
  approvalError,
  resetError,
  expandedAssetFieldId,
  isApproved,
  issueLabel,
  onIssueSelect,
  onChangeDesign,
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
  // A single blocking issue is already shown at its own field; a summary only helps
  // once there is more than one thing to jump between.
  const showIssueSummary = visibleBlockingIssues.length > 1;

  return (
    <section className="selection-step-panel content-step">
      <header className="content-step__header">
        <h2>{uiText.selection.content.title}</h2>
        <p className="content-step__design">
          <span>
            {uiText.selection.content.designPrefix}
            {templateStyleName(selectedTemplate)}
          </span>
          <button type="button" className="content-step__link" onClick={onChangeDesign}>
            {uiText.selection.content.designChange}
          </button>
        </p>
      </header>

      <SelectionStepAlerts qualityError={qualityError} approvalError={approvalError} resetError={resetError} />

      {showIssueSummary ? (
        <div className="content-step__warning" role="status">
          <p>
            {visibleBlockingIssues.length} {uiText.selection.feedback.blockingSummary}
          </p>
          <ul>
            {visibleBlockingIssues.map((issue) => (
              <li key={`${issue.path}-${issue.code}`}>
                <button type="button" className="content-step__link" onClick={() => onIssueSelect(issue)}>
                  {friendlyValidationMessage(issue, issueLabel(issue))}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form className="content-form" onSubmit={(event) => event.preventDefault()}>
        {hasVariantChoice(selectedTemplate) ? (
          <section className="content-section" aria-labelledby="content-variants-title">
            <div className="content-section__head">
              <h3 id="content-variants-title" className="content-section__title">
                {uiText.selection.content.variants}
              </h3>
            </div>
            <TemplateVariantButtons
              template={selectedTemplate}
              selectedVariantId={selectedVariantId}
              onSelect={onVariantSelect}
              disabled={isApproved}
            />
          </section>
        ) : null}

        <ContentFieldSections
          template={selectedTemplate}
          layoutValues={layoutValues}
          assetPreviews={assetPreviews}
          assetDetails={assetDetails}
          assetErrors={assetErrors}
          validationIssues={validationIssues}
          onTextChange={onTextFieldChange}
          onAssetChange={onAssetFieldChange}
          onToggleAssetEditor={onToggleAssetEditor}
          onFieldInteract={onFieldInteract}
          disabled={isApproved}
        />
      </form>

      <div className="wizard-step-nav content-step__actions">
        <button type="button" className="wizard-step-nav__button" onClick={onBack}>
          {uiText.common.back}
        </button>
        <button type="button" className="wizard-step-nav__button wizard-step-nav__button--primary" onClick={onNext}>
          {uiText.selection.buttons.toReview}
        </button>
      </div>

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
    </section>
  );
}
