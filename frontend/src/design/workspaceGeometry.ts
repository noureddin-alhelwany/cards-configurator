import type { CSSProperties } from 'react';

import type { BoxMm } from './types';

export type DocumentBoxDelta = {
  x_mm?: number;
  y_mm?: number;
  width_mm?: number;
  height_mm?: number;
};

export type ZoomGeometry = {
  pixels_per_mm: number;
  zoom: number;
};

export function documentBoxStyle(box: BoxMm): CSSProperties {
  return {
    left: `${box.x_mm}mm`,
    top: `${box.y_mm}mm`,
    width: `${box.width_mm}mm`,
    height: `${box.height_mm}mm`,
  };
}

export function documentViewBox(widthMm: number, heightMm: number): string {
  return `0 0 ${widthMm} ${heightMm}`;
}

export function screenDeltaToDocumentMm(deltaPx: number, geometry: ZoomGeometry): number {
  if (geometry.pixels_per_mm <= 0) {
    throw new Error('pixels_per_mm must be positive');
  }
  if (geometry.zoom <= 0) {
    throw new Error('zoom must be positive');
  }
  return deltaPx / (geometry.pixels_per_mm * geometry.zoom);
}

export function translateDocumentBox(box: BoxMm, delta: Pick<DocumentBoxDelta, 'x_mm' | 'y_mm'>): BoxMm {
  return {
    ...box,
    x_mm: box.x_mm + (delta.x_mm ?? 0),
    y_mm: box.y_mm + (delta.y_mm ?? 0),
  };
}

export function resizeDocumentBox(box: BoxMm, delta: Pick<DocumentBoxDelta, 'width_mm' | 'height_mm'>): BoxMm {
  return {
    ...box,
    width_mm: box.width_mm + (delta.width_mm ?? 0),
    height_mm: box.height_mm + (delta.height_mm ?? 0),
  };
}
