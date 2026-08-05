/**
 * Automatic text fitting.
 *
 * This heuristic exists twice on purpose: here for the renderer, and in
 * `backend/.../quality.py` (`_estimate_text_scale`) for the quality gate, which must not
 * depend on values reported by a browser. The two implementations MUST agree — if the
 * preview shrinks text that the gate then rejects (or the other way round), the user sees
 * a card that cannot be ordered, or orders a card that overflows in print.
 *
 * Both sides share `registries/fixtures/text_fit_cases.json`; `textFit.test.ts` and
 * `backend/tests/test_text_fit.py` assert identical results from it. Keep the constant
 * names below identical in both languages so one grep finds every copy, and keep the
 * arithmetic in the same operation order so the floats match.
 *
 * Honest limitation: a character-count estimate will never equal Chromium's real line
 * breaking. Being identical on both sides prevents contradictory verdicts; being correct
 * is a separate problem, best solved by measuring actual overflow in the render page.
 */

/** Average glyph advance as a fraction of the font size, for the bundled sans stack. */
export const AVG_GLYPH_WIDTH_EM = 0.55;

/** Shrink floor when a template does not specify an absolute one. */
export const DEFAULT_MIN_FIT_SCALE = 0.7;

export type TextFitInput = {
  box_width_mm: number;
  box_height_mm: number;
  font_size_mm: number;
  line_height: number;
  letter_spacing_em?: number | null;
  max_lines: number | null;
  /** Absolute floor in mm; `null` falls back to `DEFAULT_MIN_FIT_SCALE * font_size_mm`. */
  min_font_size_mm?: number | null;
};

export type TextFitResult = {
  /** Scale to render at. This is the smallest scale that fits the text. */
  scale: number;
  /** Unclamped requirement. Below 1 the text does not fit at full size. */
  rawScale: number;
  estimatedLines: number;
  /** The floor that applied, as a scale factor. */
  minScale: number;
  /** The spacing the renderer should actually apply after fit pressure. */
  effectiveLetterSpacingEm: number | null;
};

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function minFitScale(input: TextFitInput) {
  if (input.min_font_size_mm != null && input.font_size_mm > 0) {
    return clampUnit(input.min_font_size_mm / input.font_size_mm);
  }
  return DEFAULT_MIN_FIT_SCALE;
}

/**
 * How much the text must shrink to fit its box.
 *
 * `text` is stripped first: the backend validates the stripped value, so fitting the raw
 * one here would make a trailing newline enough to disagree about whether the card is
 * printable.
 */
export function estimateTextFit(input: TextFitInput, text: string): TextFitResult {
  const originalSpacing = input.letter_spacing_em ?? null;
  const baseSpacing = Math.max(0, originalSpacing ?? 0);
  const paragraphs = text.trim().split('\n');

  function measureAtSpacing(letterSpacingEm: number) {
    const fontSizeMm = Math.max(0.001, input.font_size_mm);
    const glyphWidthEm = Math.max(0.1, AVG_GLYPH_WIDTH_EM + letterSpacingEm);
    const charsPerLine = Math.max(1, Math.floor(input.box_width_mm / (fontSizeMm * glyphWidthEm)));
    const longestLine = Math.max(...paragraphs.map((paragraph) => paragraph.length), 1);
    const estimatedLines = paragraphs.reduce((total, paragraph) => {
      const normalizedLength = Math.max(paragraph.length, 1);
      return total + Math.max(1, Math.ceil(normalizedLength / charsPerLine));
    }, 0);
    const widthScale = Math.min(1, input.box_width_mm / Math.max(longestLine * fontSizeMm * glyphWidthEm, 0.1));
    const heightScale = Math.min(
      1,
      input.box_height_mm / Math.max(estimatedLines * fontSizeMm * input.line_height, 0.1),
    );
    const lineScale = input.max_lines ? Math.min(1, input.max_lines / estimatedLines) : 1;

    return {
      widthScale,
      heightScale,
      lineScale,
      rawScale: Math.min(widthScale, heightScale, lineScale),
      estimatedLines,
    };
  }

  let effectiveLetterSpacingEm = originalSpacing;
  let fit = measureAtSpacing(baseSpacing);

  if (baseSpacing > 0 && fit.rawScale < 1) {
    const zeroSpacingFit = measureAtSpacing(0);
    if (zeroSpacingFit.rawScale >= 1) {
      let lowerBound = 0;
      let upperBound = baseSpacing;
      let bestSpacing = 0;
      for (let iteration = 0; iteration < 24; iteration += 1) {
        const midpoint = (lowerBound + upperBound) / 2;
        const probe = measureAtSpacing(midpoint);
        if (probe.rawScale >= 1) {
          bestSpacing = midpoint;
          lowerBound = midpoint;
        } else {
          upperBound = midpoint;
        }
      }
      effectiveLetterSpacingEm = bestSpacing;
      fit = measureAtSpacing(bestSpacing);
    } else {
      effectiveLetterSpacingEm = 0;
      fit = zeroSpacingFit;
    }
  }

  const minScale = minFitScale(input);
  return {
    scale: Math.max(minScale, fit.rawScale),
    rawScale: fit.rawScale,
    estimatedLines: fit.estimatedLines,
    minScale,
    effectiveLetterSpacingEm,
  };
}
