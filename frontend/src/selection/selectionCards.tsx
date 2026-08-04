import type { ProductDefinition, TemplateDefinition, TemplateDesignDefinition, CategoryDefinition } from '../registries/types';
import DesignRenderer from '../design/DesignRenderer';
import { buildTemplatePreviewFixture } from './selectionPreview';
import { activeDesigns, designStyleDescription } from './selectionRules';
import { uiText } from '../ui/text';
import { previewAssetPath } from './previewAssets';

type TemplateCardProps = {
  template: TemplateDefinition;
  product: ProductDefinition | null;
  category: CategoryDefinition | null;
  selected: boolean;
  recommended?: boolean;
  onSelect: (template: TemplateDefinition) => void;
  disabled?: boolean;
};

export function TemplateCard({ template, product, category, selected, recommended = false, onSelect, disabled = false }: TemplateCardProps) {
  const previewFixture = buildTemplatePreviewFixture(template, product, category);
  const previewDesign = activeDesigns(template)[0] ?? null;

  return (
    <button
      type="button"
      className={`template-card${selected ? ' template-card--selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(template)}
      aria-label={`${uiText.selection.sections.design} auswählen: ${template.name ?? uiText.common.designFallback}`}
    >
      <div className="template-card__preview">
        {previewDesign?.preview_asset ? (
          <img className="template-card__image" src={previewAssetPath(previewDesign.preview_asset)} alt="" />
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
        <p className="template-card__eyebrow">{uiText.selection.sections.design}</p>
        <h3>{template.name ?? uiText.common.designFallback}</h3>
        <p>{template.description ?? designStyleDescription(template)}</p>
      </div>
    </button>
  );
}

type DesignCardProps = {
  template: TemplateDefinition;
  product: ProductDefinition | null;
  category: CategoryDefinition | null;
  variant: TemplateDesignDefinition;
  selected: boolean;
  recommended?: boolean;
  onSelect: (template: TemplateDefinition, variant: TemplateDesignDefinition) => void;
  disabled?: boolean;
};

export function DesignCard({
  template,
  product,
  category,
  variant,
  selected,
  recommended = false,
  onSelect,
  disabled = false,
}: DesignCardProps) {
  const previewFixture = buildTemplatePreviewFixture(template, product, category);
  if (previewFixture) {
    previewFixture.layout_state.design_id = variant.id;
  }

  return (
    <button
      type="button"
      className={`template-card${selected ? ' template-card--selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(template, variant)}
      aria-label={`${variant.name} auswählen`}
    >
      <div className="template-card__preview">
        {variant.preview_asset ? (
          <img className="template-card__image" src={previewAssetPath(variant.preview_asset)} alt="" />
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
        <p className="template-card__eyebrow">{uiText.selection.sections.design}</p>
        <h3>{variant.name}</h3>
        <p>{designStyleDescription({ ...template, name: variant.name, description: null })}</p>
      </div>
    </button>
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
      </div>
    </button>
  );
}

type CategoryCardProps = {
  category: CategoryDefinition;
  selected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export function CategoryCard({ category, selected, onSelect, disabled = false }: CategoryCardProps) {
  return (
    <button
      type="button"
      className={`category-card${selected ? ' category-card--selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(category.id)}
    >
      <img className="category-card__image" src={previewAssetPath(category.preview_asset)} alt="" />
      <div className="category-card__body">
        <p className="category-card__eyebrow">Kategorie</p>
        <h3>{category.name}</h3>
        <p>{category.description}</p>
      </div>
    </button>
  );
}
