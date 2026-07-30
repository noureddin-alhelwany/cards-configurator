import type { CSSProperties } from 'react';
import type {
  ImageElementDefinition,
  LayoutState,
  ProofFixture,
  QrElementDefinition,
  TemplateElementDefinition,
  TextElementDefinition,
} from './types';
import './DesignRenderer.css';

type Props = {
  fixture: ProofFixture;
  onAssetReady?: (assetId: string) => void;
};

function mmBoxStyle(box: { x_mm: number; y_mm: number; width_mm: number; height_mm: number }): CSSProperties {
  return {
    left: `${box.x_mm}mm`,
    top: `${box.y_mm}mm`,
    width: `${box.width_mm}mm`,
    height: `${box.height_mm}mm`,
  };
}

function adjustmentFor(layoutState: LayoutState, elementId: string) {
  return layoutState.element_adjustments[elementId] ?? { offset_x: 0, offset_y: 0, scale: 1 };
}

function renderTextElement(element: TextElementDefinition, layoutState: LayoutState) {
  const adjustment = adjustmentFor(layoutState, element.id);
  return (
    <div
      key={element.id}
      className="design-element design-element--text"
      style={{
        ...mmBoxStyle(element.box_mm),
        zIndex: element.z_index,
        color: element.color,
        fontFamily: element.font_family,
        fontSize: `${element.font_size_mm}mm`,
        fontWeight: element.font_weight,
        lineHeight: element.line_height,
        textAlign: element.align,
        transform: `translate(${adjustment.offset_x * 4}mm, ${adjustment.offset_y * 4}mm) scale(${adjustment.scale})`,
      }}
    >
      {layoutState.text_values[element.id] ?? element.text}
    </div>
  );
}

function renderImageElement(
  element: ImageElementDefinition,
  layoutState: LayoutState,
  assetDataUrl: string | undefined,
  onAssetReady?: (assetId: string) => void,
) {
  const adjustment = adjustmentFor(layoutState, element.id);
  const movement = element.movement_mm ?? { x_mm: 0, y_mm: 0, width_mm: 0, height_mm: 0 };
  const filter =
    element.enhancement === 'contrast'
      ? 'contrast(1.06) saturate(1.01)'
      : element.enhancement === 'sharpen'
        ? 'contrast(1.03) saturate(1.02)'
        : undefined;
  return (
    <img
      key={element.id}
      className="design-element design-element--image"
      style={{
        ...mmBoxStyle(element.box_mm),
        zIndex: element.z_index,
        objectFit: element.fit,
        filter,
        transform: `translate(${adjustment.offset_x * movement.width_mm}mm, ${adjustment.offset_y * movement.height_mm}mm) scale(${adjustment.scale})`,
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

export default function DesignRenderer({ fixture, onAssetReady }: Props) {
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
            return renderTextElement(element, fixture.layout_state);
          }
          if (element.kind === 'image') {
            return renderImageElement(element, fixture.layout_state, fixture.assets[element.asset_key]?.data_url, onAssetReady);
          }
          return renderQrElement(element, fixture.assets.qr?.data_url, onAssetReady);
        })}
      </div>
    </div>
  );
}
