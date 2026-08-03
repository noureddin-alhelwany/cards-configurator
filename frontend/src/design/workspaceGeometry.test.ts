import { describe, expect, test } from 'vitest';

import {
  documentBoxStyle,
  documentViewBox,
  resizeDocumentBox,
  screenDeltaToDocumentMm,
  translateDocumentBox,
} from './workspaceGeometry';

describe('workspaceGeometry', () => {
  test('document boxes stay in millimetres', () => {
    expect(
      documentBoxStyle({
        x_mm: 12.5,
        y_mm: 8,
        width_mm: 48,
        height_mm: 10,
      }),
    ).toEqual({
      left: '12.5mm',
      top: '8mm',
      width: '48mm',
      height: '10mm',
    });
  });

  test('the SVG workspace uses the document size as its shared coordinate system', () => {
    expect(documentViewBox(111, 154)).toBe('0 0 111 154');
  });

  test('zoom changes the screen delta, not the stored document delta', () => {
    const oneX = screenDeltaToDocumentMm(24, { pixels_per_mm: 4, zoom: 1 });
    const twoX = screenDeltaToDocumentMm(48, { pixels_per_mm: 4, zoom: 2 });

    expect(oneX).toBeCloseTo(6, 6);
    expect(twoX).toBeCloseTo(6, 6);
  });

  test('drag and resize work on document millimetres', () => {
    const box = {
      x_mm: 10,
      y_mm: 20,
      width_mm: 30,
      height_mm: 40,
    };

    expect(translateDocumentBox(box, { x_mm: 3.5, y_mm: -2 })).toEqual({
      x_mm: 13.5,
      y_mm: 18,
      width_mm: 30,
      height_mm: 40,
    });
    expect(resizeDocumentBox(box, { width_mm: 5, height_mm: -4 })).toEqual({
      x_mm: 10,
      y_mm: 20,
      width_mm: 35,
      height_mm: 36,
    });
  });
});
