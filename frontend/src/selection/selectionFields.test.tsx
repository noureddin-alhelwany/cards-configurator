import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { ContentFieldSections } from './selectionFields';
import type { TemplateDefinition } from '../registries/types';

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
    {
      id: 'body',
      type: 'text',
      required: true,
      max_length: 80,
      max_lines: 2,
      label: 'Beschreibung',
      help_text: null,
      group: 'Texte',
      placeholder: null,
      suggestions: [],
      default_value: 'Dieser Text bleibt fix.',
    },
  ],
  text_rules: [],
  qr_rules: [],
  elements: [],
  designs: [
    {
      id: 'warm',
      name: 'Warm',
      active: true,
      preview_asset: null,
      source_asset: null,
      background_asset: null,
      accent_color: null,
      zones: [
        {
          id: 'headline-zone',
          box_mm: { x_mm: 10, y_mm: 10, width_mm: 80, height_mm: 20 },
          label: 'Headline',
          personalizable: true,
          variables: [
            {
              id: 'headline-zone-variable',
              kind: 'text',
              field_id: 'headline',
              label: 'Headline',
              font_weight: 700,
              font_size_mm: 4,
              min_font_size_mm: null,
              line_height: 1.1,
              letter_spacing_em: 0,
              color: '#000000',
              align: 'left',
              max_length: 60,
              max_lines: 3,
              required: true,
              default_value: 'Scanne den QR-Code',
            },
          ],
          qr: null,
        },
        {
          id: 'body-zone',
          box_mm: { x_mm: 10, y_mm: 30, width_mm: 80, height_mm: 20 },
          label: 'Body',
          personalizable: false,
          variables: [
            {
              id: 'body-zone-variable',
              kind: 'text',
              field_id: 'body',
              label: 'Body',
              font_weight: 400,
              font_size_mm: 3,
              min_font_size_mm: null,
              line_height: 1.1,
              letter_spacing_em: 0,
              color: '#000000',
              align: 'left',
              max_length: 80,
              max_lines: 2,
              required: true,
              default_value: 'Dieser Text bleibt fix.',
            },
          ],
          qr: null,
        },
      ],
      fonts: [],
    },
  ],
};

describe('ContentFieldSections', () => {
  test('hides fields that are marked as fixed by the design zones', () => {
    render(
      <ContentFieldSections
        template={template}
        selectedVariantId="warm"
        layoutValues={{ text_values: { headline: 'Scanne den QR-Code', body: 'Dieser Text bleibt fix.' }, asset_values: {}, element_adjustments: {} }}
        assetPreviews={{}}
        assetDetails={{}}
        assetErrors={{}}
        validationIssues={[]}
        onTextChange={() => {}}
        onAssetChange={() => {}}
        onToggleAssetEditor={() => {}}
        onFieldInteract={() => {}}
      />,
    );

    expect(screen.getByLabelText('Überschrift')).toBeInTheDocument();
    expect(screen.queryByLabelText('Beschreibung')).toBeNull();
  });
});
