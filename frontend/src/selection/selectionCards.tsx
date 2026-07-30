import type { ProductDefinition, TemplateDefinition, TemplateVariantDefinition, UseCaseDefinition } from '../registries/types';
import DesignRenderer from '../design/DesignRenderer';
import { buildTemplatePreviewFixture } from './selectionPreview';
import { templateStyleDescription } from './selectionRules';

type TemplateCardProps = {
  template: TemplateDefinition;
  product: ProductDefinition | null;
  useCase: UseCaseDefinition | null;
  selected: boolean;
  recommended?: boolean;
  onSelect: (template: TemplateDefinition) => void;
  disabled?: boolean;
};

export function TemplateCard({ template, product, useCase, selected, recommended = false, onSelect, disabled = false }: TemplateCardProps) {
  const previewFixture = buildTemplatePreviewFixture(template, product, useCase);

  return (
    <button
      type="button"
      className={`template-card${selected ? ' template-card--selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(template)}
      aria-label={`${template.name ?? 'Vorlage'} auswählen`}
    >
      <div className="template-card__preview">
        {previewFixture ? (
          <div className="template-card__preview-stage">
            <DesignRenderer fixture={previewFixture} />
          </div>
        ) : (
          <img className="template-card__image" src={template.preview_asset ?? ''} alt="" />
        )}
        <div className="template-card__badges" aria-hidden="true">
          {recommended ? <span className="template-card__badge">Empfohlen</span> : null}
          {selected ? <span className="template-card__badge template-card__badge--selected">Ausgewählt</span> : null}
        </div>
      </div>
      <div className="template-card__body">
        <p className="template-card__eyebrow">Vorlage</p>
        <h3>{template.name ?? 'Vorlage'}</h3>
        <p>{templateStyleDescription(template)}</p>
      </div>
    </button>
  );
}

type TemplateVariantButtonsProps = {
  template: TemplateDefinition;
  selectedVariantId: string | null;
  onSelect: (variant: TemplateVariantDefinition) => void;
  disabled?: boolean;
};

export function TemplateVariantButtons({ template, selectedVariantId, onSelect, disabled = false }: TemplateVariantButtonsProps) {
  const activeVariants = template.variants.filter((variant) => variant.active);

  if (activeVariants.length === 0) {
    return null;
  }

  return (
    <div className="template-variant-grid" role="tablist" aria-label="Layoutvarianten">
      {activeVariants.map((variant) => (
        <button
          key={variant.id}
          type="button"
          role="tab"
          aria-selected={variant.id === selectedVariantId}
          className={`template-variant-pill${variant.id === selectedVariantId ? ' template-variant-pill--selected' : ''}`}
          disabled={disabled}
          onClick={() => onSelect(variant)}
        >
          <span className="template-variant-pill__preview" aria-hidden="true">
            {variant.preview_asset ? <img src={variant.preview_asset} alt="" /> : <span>Variante</span>}
          </span>
          <span className="template-variant-pill__label">{variant.name}</span>
        </button>
      ))}
    </div>
  );
}
