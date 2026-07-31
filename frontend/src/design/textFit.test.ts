import { describe, expect, test } from 'vitest';
import fixture from '@fixtures/text_fit_cases.json';
import { AVG_GLYPH_WIDTH_EM, DEFAULT_MIN_FIT_SCALE, estimateTextFit, minFitScale } from './textFit';
import type { TextFitInput } from './textFit';

/**
 * Contract tests against the same fixture as `backend/tests/test_text_fit.py`.
 *
 * The heuristic exists in both languages because the quality gate must not depend on
 * browser-reported values. Sharing the expectations is what keeps the preview and the gate
 * from reaching opposite verdicts on the same card.
 */
type Case = {
  name: string;
  input: TextFitInput & { max_lines: number | null };
  text: string;
  expected: { scale: number; raw_scale: number; estimated_lines: number; min_scale: number };
};

const cases = fixture.cases as unknown as Case[];

test('the shared fixture is readable and non-empty', () => {
  expect(cases.length).toBeGreaterThan(0);
});

describe('estimateTextFit matches the shared fixture', () => {
  for (const testCase of cases) {
    test(testCase.name, () => {
      const result = estimateTextFit(testCase.input, testCase.text);

      expect(result.estimatedLines).toBe(testCase.expected.estimated_lines);
      expect(result.scale).toBeCloseTo(testCase.expected.scale, 6);
      expect(result.rawScale).toBeCloseTo(testCase.expected.raw_scale, 6);
      expect(minFitScale(testCase.input)).toBeCloseTo(testCase.expected.min_scale, 6);
    });
  }
});

test('constants match the values mirrored in quality.py', () => {
  expect(AVG_GLYPH_WIDTH_EM).toBe(0.55);
  expect(DEFAULT_MIN_FIT_SCALE).toBe(0.7);
});

test('trailing whitespace cannot change the verdict', () => {
  // The regression this pairing exists for: the gate stripped the value, the renderer did
  // not, so a trailing newline alone could make preview and gate disagree.
  const input: TextFitInput = {
    box_width_mm: 70,
    box_height_mm: 22,
    font_size_mm: 6.8,
    line_height: 1.05,
    max_lines: 3,
  };
  expect(estimateTextFit(input, '  Scanne den QR-Code \n\n ')).toEqual(estimateTextFit(input, 'Scanne den QR-Code'));
});
