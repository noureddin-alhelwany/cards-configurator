import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { TemplateLivePreview } from './selectionPreview';
import type { ProductDefinition, TemplateDefinition, CategoryDefinition } from '../registries/types';

const template: TemplateDefinition = {
  schema_version: 1,
  id: 'proof_a6_card',
  version: '1.6.0',
  name: 'Google Reviews',
  description: null,
  product_id: 'a6_card',
  active: true,
  page_width_mm: 111,
  page_height_mm: 154,
  bleed_mm: 3,
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
      default_value: 'Scanne den QR-Code',
    },
  ],
  text_rules: [],
  qr_rules: [],
  elements: [
    {
      kind: 'text',
      id: 'headline',
      box_mm: { x_mm: 8, y_mm: 10, width_mm: 40, height_mm: 8 },
      z_index: 1,
      text: 'Scanne den QR-Code',
      font_family_id: 'proof-sans',
      font_size_mm: 4.4,
      font_weight: 400,
      color: '#000000',
      line_height: 1.05,
      letter_spacing_em: 0,
      align: 'left',
      valign: 'top',
      min_font_size_mm: null,
    },
  ],
  designs: [
    {
      id: 'warm',
      name: 'Warm',
      active: true,
      preview_asset: null,
      source_asset: 'source/template_google_reviews_warm.png',
      background_asset: 'backgrounds/template_google_reviews_warm.svg',
      accent_color: null,
      fonts: [
        {
          id: 'proof-sans',
          family: 'Proof Sans',
          file: '/fonts/ProofSans.ttf',
          weight: 400,
          style: 'normal',
        },
      ],
      zones: [
        {
          id: 'headline-zone',
          box_mm: { x_mm: 24, y_mm: 36, width_mm: 56, height_mm: 10 },
          label: 'Headline',
          kind: 'text',
          personalizable: true,
          qr: null,
          variables: [
            {
              id: 'headline-zone-variable',
              kind: 'text',
              field_id: 'headline',
              label: 'Überschrift',
              font_family_id: 'proof-sans',
              font_weight: 700,
              font_size_mm: 7.1,
              min_font_size_mm: 4.5,
              line_height: 1.08,
              letter_spacing_em: 0.04,
              color: '#123456',
              align: 'center',
              max_length: 60,
              max_lines: 3,
              required: true,
              default_value: 'Scanne den QR-Code',
            },
          ],
        },
      ],
    },
  ],
};

const product: ProductDefinition = {
  id: 'a6_card',
  name: 'A6 Card',
  description: null,
  category_ids: ['google_reviews'],
  preview_asset: 'product.png',
  active: true,
};

const category: CategoryDefinition = {
  id: 'google_reviews',
  name: 'Google Reviews',
  description: 'Scan to leave a review.',
  preview_asset: 'category.png',
  active: true,
};

describe('TemplateLivePreview', () => {
  test('uses the selected design source artwork and zone geometry', async () => {
    render(
      <TemplateLivePreview
        template={template}
        product={product}
        category={category}
        selectedVariantId="warm"
        layoutValues={{
          text_values: { headline: 'Hello from zone' },
          asset_values: {},
          element_adjustments: {},
        }}
        assetPreviews={{}}
        validationIssues={[]}
        showMockup={false}
      />,
    );

    const background = await screen.findByTestId('design-background');
    expect(background).toHaveAttribute('src', '/proof-assets/source/template_google_reviews_warm.png');

    const text = document.querySelector<HTMLElement>('.design-element--text');
    expect(text).not.toBeNull();
    expect(text?.style.left).toBe('24mm');
    expect(text?.style.top).toBe('36mm');
    expect(text?.style.width).toBe('56mm');
    expect(text?.style.height).toBe('10mm');
    expect(text?.style.fontWeight).toBe('700');
    expect(text?.style.color).toBe('rgb(18, 52, 86)');
    expect(text?.style.textAlign).toBe('center');
    expect(text).toHaveTextContent('Hello from zone');
  });
});
