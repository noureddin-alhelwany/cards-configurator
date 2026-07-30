import type { CSSProperties } from 'react';
import type {
  ImageElementDefinition,
  LayoutState,
  ProofFixture,
  QrElementDefinition,
  TemplateElementDefinition,
  TemplateFieldDefinition,
  TextElementDefinition,
  ValidationIssue,
} from './types';
import './DesignRenderer.css';

type Props = {
  fixture: ProofFixture;
  onAssetReady?: (assetId: string) => void;
  validationIssues?: ValidationIssue[];
};

function mmBoxStyle(box: { x_mm: number; y_mm: number; width_mm: number; height_mm: number }): CSSProperties {
  return {
    left: `${box.x_mm}mm`,
    top: `${box.y_mm}mm`,
    width: `${box.width_mm}mm`,
    height: `${box.height_mm}mm`,
  };
}

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

function estimateTextScale(element: TextElementDefinition, text: string, maxLines: number | null) {
  const paragraphs = text.split('\n');
  const charsPerLine = Math.max(1, Math.floor(element.box_mm.width_mm / (element.font_size_mm * 0.55)));
  const longestLine = Math.max(...paragraphs.map((paragraph) => paragraph.length), 1);
  const estimatedLines = paragraphs.reduce((total, paragraph) => {
    const normalizedLength = Math.max(paragraph.length, 1);
    return total + Math.max(1, Math.ceil(normalizedLength / charsPerLine));
  }, 0);
  const widthScale = clamp(element.box_mm.width_mm / (Math.max(longestLine, 1) * element.font_size_mm * 0.55), 0, 1);
  const heightScale = clamp(
    element.box_mm.height_mm / (estimatedLines * element.font_size_mm * element.line_height),
    0,
    1,
  );
  const lineScale = maxLines ? clamp(maxLines / estimatedLines, 0, 1) : 1;
  return clamp(Math.min(widthScale, heightScale, lineScale), 0.7, 1);
}

function renderTextElement(
  element: TextElementDefinition,
  layoutState: LayoutState,
  validationIssues: ValidationIssue[] | undefined,
  fields: TemplateFieldDefinition[],
) {
  const adjustment = adjustmentFor(layoutState, element.id);
  const field = fieldForElement(fields, element.id);
  const textValue = layoutState.text_values[element.id] ?? element.text;
  const fitScale = estimateTextScale(element, textValue, field?.max_lines ?? null);
  const issue = issueForElement(validationIssues, element.id);
  return (
    <div
      key={element.id}
      className={`design-element design-element--text${fitScale < 1 ? ' design-element--text--reduced' : ''}${issue ? ` design-element--issue design-element--issue--${issue.severity}` : ''}`}
      style={{
        ...mmBoxStyle(element.box_mm),
        zIndex: element.z_index,
        color: element.color,
        fontFamily: element.font_family,
        fontSize: `${element.font_size_mm * fitScale}mm`,
        fontWeight: element.font_weight,
        lineHeight: element.line_height,
        textAlign: element.align,
        transform: `translate(${adjustment.offset_x * 4}mm, ${adjustment.offset_y * 4}mm) scale(${adjustment.scale})`,
      }}
    >
      {textValue}
    </div>
  );
}

function renderImageElement(
  element: ImageElementDefinition,
  layoutState: LayoutState,
  assetDataUrl: string | undefined,
  onAssetReady?: (assetId: string) => void,
  validationIssues?: ValidationIssue[],
) {
  const adjustment = adjustmentFor(layoutState, element.id);
  const movement = element.movement_mm ?? { x_mm: 0, y_mm: 0, width_mm: 0, height_mm: 0 };
  const issue = issueForElement(validationIssues, element.id);
  const scale = clamp(adjustment.scale, element.min_scale, element.max_scale);
  const filter =
    element.enhancement === 'contrast'
      ? 'contrast(1.06) saturate(1.01)'
      : element.enhancement === 'sharpen'
        ? 'contrast(1.03) saturate(1.02)'
        : undefined;
  return (
    <img
      key={element.id}
      className={`design-element design-element--image${issue ? ` design-element--issue design-element--issue--${issue.severity}` : ''}`}
      style={{
        ...mmBoxStyle(element.box_mm),
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

function renderQrElement(element: QrElementDefinition, assetDataUrl: string | undefined, onAssetReady?: (assetId: string) => void) {
  return (
    <img
      key={element.id}
      className="design-element design-element--qr"
      style={{
        ...mmBoxStyle(element.box_mm),
        zIndex: element.z_index,
      }}
      alt={`QR: ${element.value}`}
      src={assetDataUrl}
      onLoad={() => onAssetReady?.(element.id)}
    />
  );
}

export default function DesignRenderer({ fixture, onAssetReady, validationIssues }: Props) {
  return (
    <div className="design-stage-shell">
      <div
        data-testid="proof-canvas"
        className="design-stage"
        style={
          {
            '--page-width': `${fixture.template.page_width_mm}mm`,
            '--page-height': `${fixture.template.page_height_mm}mm`,
            '--bleed': `${fixture.template.bleed_mm}mm`,
          } as CSSProperties
        }
      >
        <div className="design-stage__bleed" aria-hidden="true" />
        <div className="design-stage__trim" aria-hidden="true" />
        {fixture.template.elements.map((element: TemplateElementDefinition) => {
          if (element.kind === 'text') {
            return renderTextElement(element, fixture.layout_state, validationIssues, fixture.template.fields);
          }
          if (element.kind === 'image') {
            return renderImageElement(
              element,
              fixture.layout_state,
              fixture.assets[element.asset_key]?.data_url,
              onAssetReady,
              validationIssues,
            );
          }
          return renderQrElement(element, fixture.assets.qr?.data_url, onAssetReady);
        })}
      </div>
    </div>
  );
}
