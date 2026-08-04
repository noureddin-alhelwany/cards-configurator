import '@testing-library/jest-dom/vitest';
import { expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DesignRenderer from './DesignRenderer';
import { BACKGROUND_ASSET_ID, expectedAssetCount } from './renderReadiness';
import type { ProofFixture } from './types';

/**
 * The production variant must not emit preview-only chrome.
 *
 * This is asserted on the DOM rather than on the produced PDF: counting path operators in
 * a content stream is brittle, while the DOM is exact. The PDF side is covered by
 * `backend/tests/test_pdf_pipeline.py` and `test_rendering_proof.py`.
 */
function buildFixture(): ProofFixture {
  return {
    template: {
      schema_version: 1,
      id: 'proof_a6_card',
      version: '1.6.0',
      name: 'Google Reviews',
      description: null,
      preview_asset: null,
      background_asset: null,
      background_asset_sha256: null,
      product_id: 'a6_card',
      category_ids: ['google_reviews'],
      active: true,
      page_width_mm: 111,
      page_height_mm: 154,
      bleed_mm: 3,
      safe_areas: [
        {
          id: 'content',
          box_mm: { x_mm: 12, y_mm: 12, width_mm: 87, height_mm: 130 },
          label: 'Safe Area',
        },
      ],
      fonts: [],
      variants: [],
      fields: [
        {
          id: 'headline',
          type: 'text',
          required: true,
          max_length: 60,
          max_lines: 3,
          label: 'Überschrift',
          help_text: null,
          group: 'Texte',
          placeholder: null,
          suggestions: [],
          default_value: null,
        },
      ],
      elements: [
        {
          kind: 'text',
          id: 'headline',
          box_mm: { x_mm: 15, y_mm: 14, width_mm: 70, height_mm: 22 },
          z_index: 1,
          text: 'Scanne den QR-Code',
          font_family_id: 'proof-sans',
          font_size_mm: 6.8,
          font_weight: 700,
          color: '#1f1a17',
          line_height: 1.05,
          align: 'left',
          valign: 'top',
          min_font_size_mm: null,
        },
      ],
    },
    product: {
      id: 'a6_card',
      name: 'A6 Card',
      description: null,
      trim_width_mm: 105,
      trim_height_mm: 148,
      bleed_mm: 3,
      recommended_dpi: 450,
      warning_dpi: 300,
      minimum_dpi: 225,
      qr_min_width_mm: 18,
      qr_min_module_mm: 0.42,
      preview_asset: 'a6_preview.png',
      active: true,
    },
    category: {
      id: 'google_reviews',
      name: 'Google Reviews',
      description: 'Scan to leave a review.',
      preview_asset: 'review.png',
      active: true,
    },
    layout_state: {
      variant_id: '',
      element_adjustments: {},
      text_values: { headline: 'Scanne den QR-Code' },
      asset_values: {},
    },
    assets: {},
  };
}

const blockingIssue = [
  {
    code: 'text_overflow',
    severity: 'error' as const,
    path: 'headline',
    message: 'zu lang',
    blocking: true,
    details: {},
  },
];

test('screen variant draws the print guides and the validation outline', () => {
  const { container } = render(<DesignRenderer fixture={buildFixture()} validationIssues={blockingIssue} />);

  expect(container.querySelector('.design-stage__document')).not.toBeNull();
  expect(container.querySelector('.design-stage__bleed')).not.toBeNull();
  expect(container.querySelector('.design-stage__trim')).not.toBeNull();
  expect(container.querySelector('[data-testid="design-stage-safe-area-content"]')).not.toBeNull();
  expect(container.querySelector('.design-element--issue')).not.toBeNull();
  expect(container.querySelector('.design-stage--production')).toBeNull();
  expect(container.querySelector('[data-testid="print-page-size"]')).toBeNull();
});

test('screen variant can hide the print guides', () => {
  const { container } = render(<DesignRenderer fixture={buildFixture()} validationIssues={blockingIssue} showGuides={false} />);

  expect(container.querySelector('.design-stage__document')).toBeNull();
  expect(container.querySelector('.design-stage__bleed')).toBeNull();
  expect(container.querySelector('.design-stage__trim')).toBeNull();
  expect(container.querySelector('[data-testid="design-stage-safe-area-content"]')).toBeNull();
  expect(container.querySelector('.design-element--issue')).not.toBeNull();
});

test('production variant emits none of the preview chrome', () => {
  const { container } = render(
    <DesignRenderer fixture={buildFixture()} validationIssues={blockingIssue} variant="production" />,
  );

  // Trim guides would be printed ink on the cut line; the radius clips artwork at the corners.
  expect(container.querySelector('.design-stage__bleed')).toBeNull();
  expect(container.querySelector('.design-stage__trim')).toBeNull();
  expect(container.querySelector('.design-stage__document')).toBeNull();
  expect(container.querySelector('[data-testid="design-stage-safe-area-content"]')).toBeNull();
  // A validation outline must never reach the customer's card.
  expect(container.querySelector('.design-element--issue')).toBeNull();
  expect(container.querySelector('.design-stage--production')).not.toBeNull();
  // The card itself is still drawn.
  expect(container.querySelector('[data-testid="proof-canvas"]')).not.toBeNull();
  expect(container.querySelector('.design-element--text')?.textContent).toBe('Scanne den QR-Code');
});

test('production variant declares the page size from the template geometry', () => {
  const { container } = render(<DesignRenderer fixture={buildFixture()} variant="production" />);

  // `@page size` cannot read a CSS custom property, so the rule carries literal mm values.
  const pageRule = container.querySelector('[data-testid="print-page-size"]');
  expect(pageRule?.textContent).toBe('@page{size:111mm 154mm;margin:0}');
});

function fixtureWithQr(textValues: Record<string, string> = {}) {
  const fixture = buildFixture();
  fixture.template.fields.push({
    id: 'qrTarget',
    type: 'url',
    required: true,
    max_length: null,
    max_lines: null,
    label: 'Link',
    help_text: null,
    group: 'Link und QR',
    placeholder: null,
    suggestions: [],
    default_value: null,
  });
    fixture.template.elements.push({
      kind: 'qr',
      id: 'proof-qr',
    box_mm: { x_mm: 71, y_mm: 74, width_mm: 22, height_mm: 22 },
    z_index: 2,
    value: 'https://example.com/review',
    color: '#1f1a17',
    background: '#ffffff',
    quiet_zone_mm: 4,
    });
  fixture.layout_state.text_values = { ...fixture.layout_state.text_values, ...textValues };
  fixture.assets = { ...fixture.assets, qr: { mime_type: 'image/svg+xml', data_url: 'data:image/svg+xml,<svg/>' } };
  return fixture;
}

test('the quiet zone is drawn as a plate around the element box', () => {
  const { container } = render(<DesignRenderer fixture={fixtureWithQr()} variant="production" />);

  const plate = container.querySelector<HTMLElement>('.design-element--qr-plate');
  expect(plate).not.toBeNull();
  // Box 22mm at (71,74) with a 4mm zone: the plate starts 4mm earlier and is 8mm wider,
  // so the symbol itself still measures exactly 22mm.
  expect(plate?.style.left).toBe('67mm');
  expect(plate?.style.top).toBe('70mm');
  expect(plate?.style.width).toBe('30mm');
  expect(plate?.style.height).toBe('30mm');
  expect(plate?.style.padding).toBe('4mm');
  expect(plate?.style.boxSizing).toBe('border-box');
  // A transparent quiet zone is not a quiet zone on coloured artwork.
  expect(plate?.style.background).toBe('rgb(255, 255, 255)');
});

test('the QR accessible name reports the URL that is actually encoded', () => {
  const customerUrl = 'https://search.google.com/local/writereview?placeid=abc';
  const { container } = render(<DesignRenderer fixture={fixtureWithQr({ qrTarget: customerUrl })} variant="production" />);

  // It used to be built from the template's static value, so it kept claiming
  // example.com/review no matter what the customer typed.
  const image = container.querySelector<HTMLImageElement>('.design-element--qr');
  expect(image?.alt).toBe(`QR: ${customerUrl}`);
});

test('the QR falls back to the template value when the field is empty', () => {
  const { container } = render(<DesignRenderer fixture={fixtureWithQr()} variant="production" />);
  const image = container.querySelector<HTMLImageElement>('.design-element--qr');
  expect(image?.alt).toBe('QR: https://example.com/review');
});

function fixtureWithBackground(asset = 'template_google_reviews_bold_preview.png') {
  const fixture = fixtureWithQr();
  fixture.template.background_asset = asset;
  return fixture;
}

function fixtureWithVariantBackground() {
  const fixture = fixtureWithQr();
  fixture.template.background_asset = 'template_google_reviews_bold_preview.png';
  fixture.template.variants = [
    {
      id: 'classic',
      name: 'Classic',
      active: true,
      preview_asset: null,
      background_asset: 'template_google_reviews_warm_preview.png',
      accent_color: '#315a86',
    },
  ];
  fixture.layout_state.variant_id = 'classic';
  return fixture;
}

test('background artwork is the bottom layer and is hidden from assistive tech', () => {
  const { container } = render(<DesignRenderer fixture={fixtureWithBackground()} variant="production" />);

  const stage = container.querySelector<HTMLElement>('[data-testid="proof-canvas"]');
  const background = container.querySelector<HTMLImageElement>('[data-testid="design-background"]');
  expect(background).not.toBeNull();
  // Served as a URL, not embedded: `fixture.assets` is keyed by field id and travels
  // through /api/registries, where megabytes of base64 do not belong.
  expect(background?.getAttribute('src')).toBe('/proof-assets/template_google_reviews_bold_preview.png');
  // First child, so every element paints on top of it without relying on z-index.
  expect(stage?.firstElementChild).toBe(background);
  // Presentational: it carries no information, and it must stay out of getByRole('img').
  expect(background?.getAttribute('alt')).toBe('');
  expect(background?.getAttribute('aria-hidden')).toBe('true');
  expect(screen.queryAllByRole('img').some((image) => image === background)).toBe(false);
});

test('the readiness handshake counts the background image', () => {
  const withArtwork = fixtureWithBackground();
  const withoutArtwork = fixtureWithQr();

  // Out of lockstep, Playwright screenshots the card before the artwork has decoded and
  // writes a plausible-looking but wrong print file, with no error anywhere.
  expect(expectedAssetCount(withArtwork)).toBe(expectedAssetCount(withoutArtwork) + 1);
});

test('variant-specific background artwork overrides the template fallback', () => {
  const { container } = render(<DesignRenderer fixture={fixtureWithVariantBackground()} variant="production" />);

  const background = container.querySelector<HTMLImageElement>('[data-testid="design-background"]');
  expect(background?.getAttribute('src')).toBe('/proof-assets/template_google_reviews_warm_preview.png');
  expect(expectedAssetCount(fixtureWithVariantBackground())).toBe(expectedAssetCount(fixtureWithQr()) + 1);
});

test('the background reports itself ready under the id the count expects', () => {
  const ready: string[] = [];
  const { container } = render(
    <DesignRenderer fixture={fixtureWithBackground()} variant="production" onAssetReady={(id) => ready.push(id)} />,
  );

  fireEvent.load(container.querySelector('[data-testid="design-background"]') as HTMLImageElement);
  expect(ready).toContain(BACKGROUND_ASSET_ID);
});

test('a background that cannot load fails the render loudly', () => {
  // The render pages set this to 'false' on mount and only ever flip it to 'true' once
  // every declared asset has loaded.
  document.documentElement.dataset.renderReady = 'false';
  const { container } = render(<DesignRenderer fixture={fixtureWithBackground()} variant="production" />);

  fireEvent.error(container.querySelector('[data-testid="design-background"]') as HTMLImageElement);

  // The render must fail rather than ship a card with a blank background: an error reason
  // the backend can report, and readiness left where it was.
  expect(document.documentElement.dataset.renderError).toBe('background_asset_missing');
  expect(document.documentElement.dataset.renderReady).toBe('false');
  delete document.documentElement.dataset.renderReady;
  delete document.documentElement.dataset.renderError;
});

test('a top-aligned text element is drawn without a wrapper', () => {
  const { container } = render(<DesignRenderer fixture={buildFixture()} variant="production" />);

  // The default must stay byte-identical to what the four shipped templates render today.
  const text = container.querySelector<HTMLElement>('.design-element--text');
  expect(text?.style.display).toBe('');
  expect(text?.style.justifyContent).toBe('');
});

test('middle and bottom anchor the text block inside its box', () => {
  const middle = buildFixture();
  middle.template.elements[0] = { ...middle.template.elements[0], valign: 'middle' } as typeof middle.template.elements[0];
  const bottom = buildFixture();
  bottom.template.elements[0] = { ...bottom.template.elements[0], valign: 'bottom' } as typeof bottom.template.elements[0];

  const middleRender = render(<DesignRenderer fixture={middle} variant="production" />);
  const middleText = middleRender.container.querySelector<HTMLElement>('.design-element--text');
  expect(middleText?.style.display).toBe('flex');
  expect(middleText?.style.justifyContent).toBe('center');

  const bottomRender = render(<DesignRenderer fixture={bottom} variant="production" />);
  const bottomText = bottomRender.container.querySelector<HTMLElement>('.design-element--text');
  expect(bottomText?.style.justifyContent).toBe('flex-end');
  // A shrunk one-liner has to stay in its lane; the box, not the glyph count, decides.
  expect(bottomText?.style.height).toBe('22mm');
});
