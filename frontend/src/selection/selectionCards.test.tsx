import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import type { RegistryBundle } from '../registries/types';
import { ProductCard } from './selectionCards';

const bundle: RegistryBundle = {
  categories: [
    {
      id: 'google_reviews',
      name: 'Google Reviews',
      description: 'Bewertungen sammeln',
      preview_asset: 'use-case.svg',
      active: true,
    },
  ],
  products: [
    {
      id: 'a6_card',
      name: 'A6 Card',
      description: 'Standardformat',
      category_ids: ['google_reviews'],
      preview_asset: 'product.svg',
      active: true,
    },
  ],
  templates: [
    {
      schema_version: 1,
      id: 'proof_a6_card',
      version: '1.6.0',
      name: 'Bold',
      description: null,
      product_id: 'a6_card',
      active: true,
      fields: [],
      page_width_mm: 111,
      page_height_mm: 154,
      bleed_mm: 3,
      safe_areas: [
        {
          id: 'content-safe-area',
          box_mm: { x_mm: 8, y_mm: 8, width_mm: 95, height_mm: 138 },
          label: 'Content safe area',
        },
      ],
      text_rules: [],
      qr_rules: [],
      elements: [],
      designs: [
        {
          id: 'bold',
          name: 'Bold',
          active: true,
          preview_asset: 'template-bold.png',
          source_asset: null,
          background_asset: null,
          accent_color: null,
          fonts: [],
        },
      ],
    },
  ],
  diagnostics: [],
};

describe('ProductCard', () => {
  test('shows the loaded product geometry and rendering info', () => {
    render(
      <ProductCard
        product={bundle.products[0]}
        selected={true}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText('A6 Card')).toBeInTheDocument();
    expect(screen.getByText('Standardformat')).toBeInTheDocument();
  });
});
