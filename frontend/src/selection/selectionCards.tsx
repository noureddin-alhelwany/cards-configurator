import type { ProductDefinition, TemplateDefinition, TemplateVariantDefinition, UseCaseDefinition } from '../registries/types';
import DesignRenderer from '../design/DesignRenderer';
import { buildTemplatePreviewFixture } from './selectionPreview';
import { templateStyleDescription } from './selectionRules';
import { uiText } from '../ui/text';
import { previewAssetPath } from './previewAssets';

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
      aria-label={`${template.name ?? uiText.common.templateFallback} auswählen`}
    >
      <div className="template-card__preview">
        {template.preview_asset ? (
          <img className="template-card__image" src={previewAssetPath(template.preview_asset)} alt="" />
        ) : previewFixture ? (
          <div className="template-card__preview-stage">
            <DesignRenderer fixture={previewFixture} />
          </div>
        ) : null}
        <div className="template-card__badges" aria-hidden="true">
          {recommended ? <span className="template-card__badge">Empfohlen</span> : null}
          {selected ? <span className="template-card__badge template-card__badge--selected">Ausgewählt</span> : null}
        </div>
      </div>
      <div className="template-card__body">
        <p className="template-card__eyebrow">{uiText.common.templateFallback}</p>
        <h3>{template.name ?? uiText.common.templateFallback}</h3>
        <p>{template.description ?? templateStyleDescription(template)}</p>
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
            {variant.preview_asset ? <img src={previewAssetPath(variant.preview_asset)} alt="" /> : <span>Variante</span>}
          </span>
          <span className="template-variant-pill__label">{variant.name}</span>
        </button>
      ))}
    </div>
  );
}

type ProductCardProps = {
  product: ProductDefinition;
  selected: boolean;
  onSelect: (id: string) => void;
  recommended?: boolean;
  disabled?: boolean;
};

export function ProductCard({
  product,
  selected,
  onSelect,
  recommended = false,
  disabled = false,
}: ProductCardProps) {
  return (
    <button
      type="button"
      className={`product-card${selected ? ' product-card--selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(product.id)}
    >
      <span className="product-card__status">{selected ? 'Ausgewählt' : recommended ? 'Empfohlen' : 'Produkt'}</span>
      <img className="product-card__image" src={previewAssetPath(product.preview_asset)} alt="" />
      <div className="product-card__body">
        <h3 className="product-card__title">
          <span className="product-card__title-icon" aria-hidden="true" />
          <span>{product.name}</span>
        </h3>
        {product.description ? <p className="product-card__description">{product.description}</p> : null}
        <p className="product-card__format">
          {product.trim_width_mm} × {product.trim_height_mm} mm
        </p>
        <p className="product-card__meta">Direkt auswählbar</p>
      </div>
    </button>
  );
}

type UseCaseCardProps = {
  useCase: UseCaseDefinition;
  selected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export function UseCaseCard({ useCase, selected, onSelect, disabled = false }: UseCaseCardProps) {
  return (
    <button
      type="button"
      className={`use-case-card${selected ? ' use-case-card--selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(useCase.id)}
    >
      <img className="use-case-card__image" src={previewAssetPath(useCase.preview_asset)} alt="" />
      <div className="use-case-card__body">
        <p className="use-case-card__eyebrow">Use case</p>
        <h3>{useCase.name}</h3>
        <p>{useCase.description}</p>
      </div>
    </button>
  );
}
