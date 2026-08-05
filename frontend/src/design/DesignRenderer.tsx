import { useEffect, useRef, type CSSProperties } from 'react';
import type {
  ImageElementDefinition,
  LayoutState,
  ProofFixture,
  QrElementDefinition,
  TemplateElementDefinition,
  TemplateFieldDefinition,
  TemplateDefinition,
  TemplateDesignDefinition,
  TextElementDefinition,
  ValidationIssue,
} from './types';
import { resolveQrValue } from './qr';
import { useTextFitRuntime } from './useTextFitRuntime';
import { BACKGROUND_ASSET_ID, markRenderError } from './renderReadiness';
import { activeTemplateVariant, resolveTemplateBackgroundAsset } from './variantResolution';
import { ensureTemplateFontsLoaded, resolveFontFamilyName } from './fonts';
import { documentBoxStyle } from './workspaceGeometry';
import './DesignRenderer.css';

/**
 * `screen` draws the interactive preview including print guides and validation outlines.
 * `production` draws only what belongs on the printed card.
 *
 * This has to be a prop rather than a `@media print` rule: the preview PNG is captured
 * under `emulate_media("screen")` while only the PDF is captured under `print`
 * (`rendering/service.py`), so a print query would make the two artifacts disagree.
 */
type RenderVariant = 'screen' | 'production';

type Props = {
  fixture: ProofFixture;
  onAssetReady?: (assetId: string) => void;
  validationIssues?: ValidationIssue[];
  variant?: RenderVariant;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function adjustmentFor(layoutState: LayoutState, elementId: string) {
  return layoutState.element_adjustments[elementId] ?? { offset_x: 0, offset_y: 0, scale: 1 };
}

function issueForElement(validationIssues: ValidationIssue[] | undefined, elementId: string) {
  return validationIssues?.find((issue) => issue.path === elementId) ?? null;
}

function fieldForElement(fields: TemplateFieldDefinition[], elementId: string) {
  return fields.find((field) => field.id === elementId) ?? null;
}

function TextElementNode({
  element,
  layoutState,
  validationIssues,
  fields,
  template,
  variant,
}: {
  element: TextElementDefinition;
  layoutState: LayoutState;
  validationIssues: ValidationIssue[] | undefined;
  fields: TemplateFieldDefinition[];
  template: TemplateDefinition;
  variant: RenderVariant;
}) {
  const adjustment = adjustmentFor(layoutState, element.id);
  const field = fieldForElement(fields, element.id);
  const textValue = layoutState.text_values[element.id] ?? element.text;
  const fontFamily = resolveFontFamilyName(template, element.font_family_id);
  const issue = variant === 'production' ? null : issueForElement(validationIssues, element.id);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const { appliedFit, baseFit } = useTextFitRuntime({
    ref: nodeRef,
    text: textValue,
    fontFamily,
    fontWeight: element.font_weight,
    textAlign: element.align,
    box_width_mm: element.box_mm.width_mm,
    box_height_mm: element.box_mm.height_mm,
    font_size_mm: element.font_size_mm,
    line_height: element.line_height,
    letter_spacing_em: element.letter_spacing_em,
    max_lines: field?.max_lines ?? null,
    min_font_size_mm: element.min_font_size_mm,
    padding: '0',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  });
  const reduced = baseFit.rawScale < 1 && variant !== 'production';

  // Validation outlines are a preview affordance; they must never be printed.
  const verticalStyle: CSSProperties =
    element.valign === 'top'
      ? {}
      : {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: element.valign === 'middle' ? 'center' : 'flex-end',
        };

  return (
    <div
      ref={nodeRef}
      key={element.id}
      className={`design-element design-element--text${reduced ? ' design-element--text--reduced' : ''}${issue ? ` design-element--issue design-element--issue--${issue.severity}` : ''}`}
      style={{
        ...documentBoxStyle(element.box_mm),
        ...verticalStyle,
        zIndex: element.z_index,
        color: element.color,
        fontFamily: fontFamily ?? undefined,
        fontSize: `${element.font_size_mm * appliedFit.scale}mm`,
        fontWeight: element.font_weight,
        lineHeight: element.line_height,
        letterSpacing:
          appliedFit.letterSpacingEm != null
            ? `${appliedFit.letterSpacingEm}em`
            : element.letter_spacing_em != null
              ? `${element.letter_spacing_em}em`
              : undefined,
        textAlign: element.align,
        transform: `translate(${adjustment.offset_x * 4}mm, ${adjustment.offset_y * 4}mm) scale(${adjustment.scale})`,
      }}
    >
      {textValue}
    </div>
  );
}

function renderTextElement(
  element: TextElementDefinition,
  layoutState: LayoutState,
  validationIssues: ValidationIssue[] | undefined,
  fields: TemplateFieldDefinition[],
  template: TemplateDefinition,
  variant: RenderVariant,
) {
  return (
    <TextElementNode
      key={element.id}
      element={element}
      layoutState={layoutState}
      validationIssues={validationIssues}
      fields={fields}
      template={template}
      variant={variant}
    />
  );
}

function renderImageElement(
  element: ImageElementDefinition,
  layoutState: LayoutState,
  assetDataUrl: string,
  variant: RenderVariant,
  onAssetReady?: (assetId: string) => void,
  validationIssues?: ValidationIssue[],
) {
  const adjustment = adjustmentFor(layoutState, element.id);
  const movement = element.movement_mm ?? { x_mm: 0, y_mm: 0, width_mm: 0, height_mm: 0 };
  const issue = variant === 'production' ? null : issueForElement(validationIssues, element.id);
  const scale = clamp(adjustment.scale, element.min_scale, element.max_scale);
  // A CSS filter forces a compositing layer, which Chrome's print path may rasterize.
  // Skipping it in production keeps the embedded image at its source resolution.
  const filter =
    variant === 'production'
      ? undefined
      : element.enhancement === 'contrast'
        ? 'contrast(1.06) saturate(1.01)'
        : element.enhancement === 'sharpen'
          ? 'contrast(1.03) saturate(1.02)'
          : undefined;
  return (
    <img
      key={element.id}
      className={`design-element design-element--image${issue ? ` design-element--issue design-element--issue--${issue.severity}` : ''}`}
      style={{
        ...documentBoxStyle(element.box_mm),
        zIndex: element.z_index,
        objectFit: element.fit,
        filter,
        transform: `translate(${adjustment.offset_x * movement.width_mm}mm, ${adjustment.offset_y * movement.height_mm}mm) scale(${scale})`,
        transformOrigin: 'center center',
      }}
      alt={element.alt}
      src={assetDataUrl}
      onLoad={() => onAssetReady?.(element.id)}
    />
  );
}

function renderQrElement(
  element: QrElementDefinition,
  assetDataUrl: string | undefined,
  encodedValue: string,
  onAssetReady?: (assetId: string) => void,
) {
  // The element box is the symbol itself (the backend renders with `border=0`), and the quiet
  // zone is a light plate drawn around it. Expressing the zone in millimetres keeps it in the
  // unit the schema and the validator speak, independent of the module count. On coloured
  // artwork the plate is not cosmetic: dark modules on mid-dark art do not scan, and a quiet
  // zone only works if it is light.
  const quiet = element.quiet_zone_mm;
  return (
    <div
      key={element.id}
      className="design-element design-element--qr-plate"
      style={{
        left: `${element.box_mm.x_mm - quiet}mm`,
        top: `${element.box_mm.y_mm - quiet}mm`,
        width: `${element.box_mm.width_mm + 2 * quiet}mm`,
        height: `${element.box_mm.height_mm + 2 * quiet}mm`,
        padding: `${quiet}mm`,
        boxSizing: 'border-box',
        background: element.background,
        zIndex: element.z_index,
      }}
    >
      <img
        className="design-element--qr"
        style={{ width: '100%', height: '100%' }}
        alt={`QR: ${encodedValue}`}
        src={assetDataUrl}
        onLoad={() => onAssetReady?.(element.id)}
      />
    </div>
  );
}

/**
 * Full-bleed artwork under everything else.
 *
 * The geometry is not in the template: no box means no chance of it drifting away from
 * `page_*_mm`. It is served as a URL from `/proof-assets/` rather than embedded in
 * `fixture.assets`, which is keyed by field id and would otherwise (a) collide with a field
 * named `background` and (b) push megabytes of base64 through `/api/registries`.
 *
 * `alt=""` plus `aria-hidden` marks it presentational: it carries no information a screen
 * reader needs, and it stays out of `getByRole('img')` in the existing tests.
 */
function renderBackground(asset: string, onAssetReady?: (assetId: string) => void) {
  return (
    <img
      className="design-stage__background"
      data-testid="design-background"
      alt=""
      aria-hidden="true"
      src={`/proof-assets/${asset}`}
      onLoad={() => onAssetReady?.(BACKGROUND_ASSET_ID)}
      onError={() => markRenderError('background_asset_missing')}
    />
  );
}

function renderTemplateElement(
  element: TemplateElementDefinition,
  fixture: ProofFixture,
  variant: RenderVariant,
  validationIssues: ValidationIssue[] | undefined,
  onAssetReady?: (assetId: string) => void,
  encodedQrValue?: string,
) {
  if (element.kind === 'text') {
    return renderTextElement(
      element,
      fixture.layout_state,
      validationIssues,
      fixture.template.fields,
      fixture.template,
      variant,
    );
  }

  if (element.kind === 'image') {
    const assetDataUrl = fixture.assets[element.asset_key]?.data_url;
    // Draw nothing rather than an <img> without a src: the browser would paint a
    // broken-image glyph plus the alt text onto the card, and that lands in the PDF.
    // Historical order snapshots can still declare elements whose asset is gone.
    if (!assetDataUrl) {
      return null;
    }
    return renderImageElement(element, fixture.layout_state, assetDataUrl, variant, onAssetReady, validationIssues);
  }

  return renderQrElement(element, fixture.assets.qr?.data_url, encodedQrValue ?? '', onAssetReady);
}

function renderElementLayer(
  fixture: ProofFixture,
  variant: RenderVariant,
  validationIssues: ValidationIssue[] | undefined,
  onAssetReady?: (assetId: string) => void,
  encodedQrValue?: string,
) {
  return fixture.template.elements.map((element: TemplateElementDefinition) =>
    renderTemplateElement(element, fixture, variant, validationIssues, onAssetReady, encodedQrValue),
  );
}

function canvasStyle(
  pageWidth: number,
  pageHeight: number,
  bleed: number,
  selectedVariant: TemplateDesignDefinition | null | undefined,
) {
  return {
    '--page-width': `${pageWidth}mm`,
    '--page-height': `${pageHeight}mm`,
    '--bleed': `${bleed}mm`,
    '--variant-accent-color': selectedVariant?.accent_color ?? undefined,
  } as CSSProperties;
}

export default function DesignRenderer({
  fixture,
  onAssetReady,
  validationIssues,
  variant = 'screen',
}: Props) {
  const production = variant === 'production';
  const { page_width_mm: pageWidth, page_height_mm: pageHeight } = fixture.template;
  const encodedQrValue = resolveQrValue(fixture.template, fixture.layout_state);
  const selectedVariant = activeTemplateVariant(fixture.template, fixture.layout_state.design_id);
  const backgroundAsset = resolveTemplateBackgroundAsset(fixture.template, fixture.layout_state);

  useEffect(() => {
    void ensureTemplateFontsLoaded(fixture.template);
  }, [fixture.template]);

  return (
    <div className={`design-stage-shell${production ? ' design-stage-shell--production' : ''}`}>
      {/* `@page size` cannot read a CSS custom property, so the rule is emitted from the
          template's own geometry. `page.pdf()` also receives width/height explicitly —
          two independent mechanisms that agree, because trusting only one is what let the
          proof path silently fall back to Letter paper. */}
      {production ? (
        <style data-testid="print-page-size">{`@page{size:${pageWidth}mm ${pageHeight}mm;margin:0}`}</style>
      ) : null}
      <div
        data-testid="proof-canvas"
        className={`design-stage${production ? ' design-stage--production' : ''}`}
        style={canvasStyle(pageWidth, pageHeight, fixture.template.bleed_mm, selectedVariant)}
      >
        {backgroundAsset ? renderBackground(backgroundAsset, onAssetReady) : null}
        {renderElementLayer(fixture, variant, validationIssues, onAssetReady, encodedQrValue)}
      </div>
    </div>
  );
}
