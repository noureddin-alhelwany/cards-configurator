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
      trim_width_mm: 105,
      trim_height_mm: 148,
      bleed_mm: 3,
      recommended_dpi: 450,
      warning_dpi: 300,
      minimum_dpi: 225,
      qr_min_width_mm: 18,
      qr_min_module_mm: 0.42,
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
      preview_asset: null,
      background_asset: null,
      background_asset_sha256: null,
      safe_areas: [
        {
          id: 'content-safe-area',
          box_mm: { x_mm: 8, y_mm: 8, width_mm: 95, height_mm: 138 },
          label: 'Content safe area',
        },
      ],
      text_rules: [],
      qr_rules: [],
      fonts: [],
      elements: [],
      variants: [],
    },
  ],
  diagnostics: [],
};

describe('ProductCard', () => {
  test('shows the loaded product geometry and rendering info', () => {
    render(
      <ProductCard
        bundle={bundle}
        product={bundle.products[0]}
        selected={true}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText('105 × 148 mm')).toBeInTheDocument();
    expect(screen.getByText('Beschnitt 3 mm')).toBeInTheDocument();
    expect(screen.getByText('Auflösung 450 dpi, Minimum 225 dpi')).toBeInTheDocument();
    expect(screen.getByText('1 Safe Area geladen')).toBeInTheDocument();
  });
});
