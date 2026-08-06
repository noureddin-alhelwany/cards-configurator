import { useLayoutEffect, useMemo, useState, type CSSProperties, type RefObject } from 'react';
import { estimateTextFit, minFitScale, type TextFitInput, type TextFitResult } from './textFit';

type AppliedTextFit = {
  scale: number;
  letterSpacingEm: number | null;
};

type FitProbeConfig = {
  widthMm: number;
  heightMm: number;
  padding: string;
  whiteSpace: 'pre-wrap' | 'nowrap';
  overflowWrap: 'anywhere' | 'normal';
  wordBreak: 'break-word' | 'normal';
  fontFamily: string;
  fontWeight: number;
  fontSizeMm: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  text: string;
};

type RuntimeTextFitInput = TextFitInput & {
  text: string;
  fontFamily?: string | null;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right';
  ref: RefObject<HTMLElement | null>;
  padding?: string;
  whiteSpace: 'pre-wrap' | 'nowrap';
  overflowWrap: 'anywhere' | 'normal';
  wordBreak: 'break-word' | 'normal';
};

export type TextFitRuntimeResult = {
  appliedFit: AppliedTextFit;
  baseFit: TextFitResult;
};

export type TextFitTypographyStyleInput = {
  color?: string;
  fontFamily?: string | null;
  fontSizeMm: number;
  fontWeight: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  letterSpacingEm?: number | null;
  appliedFit: AppliedTextFit;
};

function createFitProbe(config: FitProbeConfig, scale: number, spacing: number) {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.left = '-99999px';
  probe.style.top = '0';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.width = `${config.widthMm}mm`;
  probe.style.height = `${config.heightMm}mm`;
  probe.style.boxSizing = 'border-box';
  probe.style.padding = config.padding;
  probe.style.whiteSpace = config.whiteSpace;
  probe.style.overflowWrap = config.overflowWrap;
  probe.style.wordBreak = config.wordBreak;
  probe.style.fontFamily = config.fontFamily;
  probe.style.fontSize = `${config.fontSizeMm * scale}mm`;
  probe.style.fontWeight = String(config.fontWeight);
  probe.style.lineHeight = String(config.lineHeight);
  probe.style.letterSpacing = `${spacing}em`;
  probe.style.textAlign = config.textAlign;
  probe.textContent = config.text;
  document.body.appendChild(probe);
  return probe;
}

function probeFits(config: FitProbeConfig, scale: number, spacing: number) {
  const probe = createFitProbe(config, scale, spacing);
  const result = probe.scrollWidth <= probe.clientWidth && probe.scrollHeight <= probe.clientHeight;
  probe.remove();
  return result;
}

function searchBestScale(config: FitProbeConfig, minScale: number) {
  let low = minScale;
  let high = 1;
  let bestScale = minScale;
  for (let iteration = 0; iteration < 20; iteration += 1) {
    const midpoint = (low + high) / 2;
    if (probeFits(config, midpoint, 0)) {
      bestScale = midpoint;
      low = midpoint;
    } else {
      high = midpoint;
    }
  }
  return bestScale;
}

function searchBestSpacing(config: FitProbeConfig, scale: number, maxSpacing: number) {
  let spacingLow = 0;
  let spacingHigh = maxSpacing;
  let bestSpacing = 0;
  for (let iteration = 0; iteration < 20; iteration += 1) {
    const midpoint = (spacingLow + spacingHigh) / 2;
    if (probeFits(config, scale, midpoint)) {
      bestSpacing = midpoint;
      spacingLow = midpoint;
    } else {
      spacingHigh = midpoint;
    }
  }
  return bestSpacing;
}

export function useTextFitRuntime({
  ref,
  text,
  fontFamily,
  fontWeight,
  textAlign,
  padding = '0',
  whiteSpace,
  overflowWrap,
  wordBreak,
  ...input
}: RuntimeTextFitInput): TextFitRuntimeResult {
  const baseFit = useMemo(
    () => estimateTextFit(input, text),
    [
      input.box_height_mm,
      input.box_width_mm,
      input.font_size_mm,
      input.letter_spacing_em,
      input.line_height,
      input.max_lines,
      input.min_font_size_mm,
      text,
    ],
  );
  const [appliedFit, setAppliedFit] = useState<AppliedTextFit>(() => ({
    scale: baseFit.scale,
    letterSpacingEm: baseFit.effectiveLetterSpacingEm,
  }));
  const minScale = useMemo(() => minFitScale(input), [input]);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof document === 'undefined') {
      return;
    }
    if (node.clientWidth === 0 || node.clientHeight === 0) {
      return;
    }

    const maxSpacing = Math.max(0, input.letter_spacing_em ?? 0);
    const fitConfig: FitProbeConfig = {
      widthMm: input.box_width_mm,
      heightMm: input.box_height_mm,
      padding,
      whiteSpace,
      overflowWrap,
      wordBreak,
      fontFamily: fontFamily ?? '',
      fontWeight,
      fontSizeMm: input.font_size_mm,
      lineHeight: input.line_height,
      textAlign,
      text,
    };
    const bestScale = searchBestScale(fitConfig, minScale);
    const bestSpacing = searchBestSpacing(fitConfig, bestScale, maxSpacing);

    setAppliedFit((current) => {
      if (
        Math.abs(current.scale - bestScale) < 0.0001 &&
        Math.abs((current.letterSpacingEm ?? 0) - bestSpacing) < 0.0001
      ) {
        return current;
      }
      return { scale: bestScale, letterSpacingEm: bestSpacing > 0 ? bestSpacing : null };
    });
  }, [
    fontFamily,
    fontWeight,
    input.box_height_mm,
    input.box_width_mm,
    input.letter_spacing_em,
    input.line_height,
    minScale,
    padding,
    ref,
    text,
    textAlign,
    whiteSpace,
    overflowWrap,
    wordBreak,
  ]);

  return { appliedFit, baseFit };
}

export function buildTextFitTypographyStyle({
  color,
  fontFamily,
  fontSizeMm,
  fontWeight,
  lineHeight,
  textAlign,
  letterSpacingEm,
  appliedFit,
}: TextFitTypographyStyleInput): CSSProperties {
  return {
    color,
    fontFamily: fontFamily ?? undefined,
    fontSize: `${fontSizeMm * appliedFit.scale}mm`,
    fontWeight,
    lineHeight,
    letterSpacing:
      appliedFit.letterSpacingEm != null
        ? `${appliedFit.letterSpacingEm}em`
        : letterSpacingEm != null
          ? `${letterSpacingEm}em`
          : undefined,
    textAlign,
  };
}
