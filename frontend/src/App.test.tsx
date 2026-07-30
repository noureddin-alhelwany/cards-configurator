import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('renders the registry selection flow and filters matching products', async () => {
  let persistedTextValues: Record<string, string> = {};
  let persistedElementAdjustments: Record<string, { offset_x: number; offset_y: number; scale: number }> = {};
  let persistedAssetValues: Record<string, string> = {};
  const uploadedAssets: Record<
    string,
    {
      id: string;
      preview_data_url: string;
      width_px: number;
      height_px: number;
      mime_type: string;
      kind: 'logo' | 'image';
      sha256: string;
    }
  > = {};

  function normalizeUrl(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return trimmed;
    }
    return trimmed.includes('://') ? trimmed : `https://${trimmed}`;
  }

  const sharedTemplateModel = {
    page_width_mm: 111,
    page_height_mm: 154,
    bleed_mm: 3,
    font_family: 'Proof Sans',
    fonts: [
      {
        family: 'Proof Sans',
        file: '/fonts/ProofSans.ttf',
        weight: 400,
        style: 'normal',
      },
    ],
    elements: [
      {
        kind: 'text',
        id: 'headline',
        box_mm: {
          x_mm: 15,
          y_mm: 14,
          width_mm: 70,
          height_mm: 22,
        },
        z_index: 1,
        text: 'Leave a Google review',
        font_family: 'Proof Sans',
        font_size_mm: 6.8,
        font_weight: 700,
        color: '#1f1a17',
        line_height: 1.05,
        align: 'left',
      },
      {
        kind: 'text',
        id: 'body',
        box_mm: {
          x_mm: 15,
          y_mm: 36,
          width_mm: 60,
          height_mm: 25,
        },
        z_index: 1,
        text: 'Scan the QR code to open the review page and share your experience.',
        font_family: 'Proof Sans',
        font_size_mm: 3.1,
        font_weight: 400,
        color: '#4a3d31',
        line_height: 1.25,
        align: 'left',
      },
      {
        kind: 'image',
        id: 'proof-hero-image',
        box_mm: {
          x_mm: 54,
          y_mm: 14,
          width_mm: 42,
          height_mm: 44,
        },
        z_index: 1,
        asset_key: 'heroImage',
        alt: 'Review hero image',
        fit: 'cover',
        enhancement: 'contrast',
        movement_mm: {
          x_mm: 0,
          y_mm: 0,
          width_mm: 4,
          height_mm: 4,
        },
        min_scale: 0.8,
        max_scale: 1.3,
      },
      {
        kind: 'image',
        id: 'proof-logo',
        box_mm: {
          x_mm: 15,
          y_mm: 75,
          width_mm: 28,
          height_mm: 28,
        },
        z_index: 2,
        asset_key: 'logo',
        alt: 'Studio logo',
        fit: 'contain',
        enhancement: 'contrast',
        movement_mm: {
          x_mm: 0,
          y_mm: 0,
          width_mm: 6,
          height_mm: 4,
        },
        min_scale: 0.7,
        max_scale: 1.2,
      },
      {
        kind: 'qr',
        id: 'proof-qr',
        box_mm: {
          x_mm: 71,
          y_mm: 74,
          width_mm: 22,
          height_mm: 22,
        },
        z_index: 2,
        value: 'https://example.com/review',
        color: '#1f1a17',
        background: 'transparent',
        quiet_zone_mm: 2,
      },
    ],
  };

  const bundle = {
    use_cases: [
      {
        id: 'google_reviews',
        name: 'Google Reviews',
        description: 'Scan to leave a Google review after service.',
        preview_asset: 'google_reviews_preview.png',
        active: true,
      },
      {
        id: 'wedding_reviews',
        name: 'Wedding Reviews',
        description: 'Collect a wedding guest review after the event.',
        preview_asset: 'google_reviews_preview.png',
        active: true,
      },
    ],
    products: [
      {
        id: 'a6_card',
        name: 'A6 Card',
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
      {
        id: 'dl_card',
        name: 'DL Card',
        trim_width_mm: 99,
        trim_height_mm: 210,
        bleed_mm: 3,
        recommended_dpi: 450,
        warning_dpi: 300,
        minimum_dpi: 225,
        qr_min_width_mm: 18,
        qr_min_module_mm: 0.42,
        preview_asset: 'a6_preview.png',
        active: true,
      },
      {
        id: 'hidden_card',
        name: 'Hidden Card',
        trim_width_mm: 90,
        trim_height_mm: 50,
        bleed_mm: 3,
        recommended_dpi: 450,
        warning_dpi: 300,
        minimum_dpi: 225,
        qr_min_width_mm: 18,
        qr_min_module_mm: 0.42,
        preview_asset: 'a6_preview.png',
        active: false,
      },
    ],
    templates: [
      {
        ...sharedTemplateModel,
        schema_version: 1,
        id: 'proof_a6_card',
        version: '1.0.0',
        name: 'Google Reviews Classic',
        preview_asset: 'template_google_reviews_classic.png',
        product_id: 'a6_card',
        use_case_ids: ['google_reviews'],
        active: true,
        fields: [
          {
            id: 'businessName',
            type: 'text',
            required: true,
            max_length: 40,
            max_lines: 2,
          },
          {
            id: 'headline',
            type: 'text',
            required: true,
            max_length: 60,
            max_lines: 3,
          },
        {
          id: 'logo',
          type: 'logo',
          required: false,
          max_length: null,
          max_lines: null,
        },
        {
          id: 'heroImage',
          type: 'image',
          required: false,
          max_length: null,
          max_lines: null,
        },
        {
          id: 'qrTarget',
          type: 'url',
            required: true,
            max_length: null,
            max_lines: null,
          },
        ],
        variants: [
          {
            id: 'logo-focused',
            name: 'Logo im Fokus',
            active: true,
            preview_asset: 'template_google_reviews_classic.png',
          },
          {
            id: 'text-focused',
            name: 'Text im Fokus',
            active: true,
            preview_asset: 'template_google_reviews_bold.png',
          },
        ],
      },
      {
        ...sharedTemplateModel,
        schema_version: 1,
        id: 'proof_a6_card',
        version: '1.1.0',
        name: 'Google Reviews Bold',
        preview_asset: 'template_google_reviews_bold.png',
        product_id: 'a6_card',
        use_case_ids: ['google_reviews'],
        active: true,
        fields: [
          {
            id: 'businessName',
            type: 'text',
            required: true,
            max_length: 40,
            max_lines: 2,
          },
          {
            id: 'headline',
            type: 'text',
            required: true,
            max_length: 60,
            max_lines: 3,
          },
        {
          id: 'logo',
          type: 'logo',
          required: false,
          max_length: null,
          max_lines: null,
        },
        {
          id: 'heroImage',
          type: 'image',
          required: false,
          max_length: null,
          max_lines: null,
        },
        {
          id: 'qrTarget',
          type: 'url',
            required: true,
            max_length: null,
            max_lines: null,
          },
        ],
        variants: [
          {
            id: 'logo-focused',
            name: 'Logo im Fokus',
            active: true,
            preview_asset: 'template_google_reviews_bold.png',
          },
          {
            id: 'text-focused',
            name: 'Text im Fokus',
            active: true,
            preview_asset: 'template_google_reviews_minimal.png',
          },
        ],
      },
      {
        ...sharedTemplateModel,
        schema_version: 1,
        id: 'proof_a6_card',
        version: '1.2.0',
        name: 'Google Reviews Minimal',
        preview_asset: 'template_google_reviews_minimal.png',
        product_id: 'a6_card',
        use_case_ids: ['google_reviews'],
        active: true,
        fields: [
          {
            id: 'businessName',
            type: 'text',
            required: true,
            max_length: 40,
            max_lines: 2,
          },
          {
            id: 'headline',
            type: 'text',
            required: true,
            max_length: 60,
            max_lines: 3,
          },
        {
          id: 'logo',
          type: 'logo',
          required: false,
          max_length: null,
          max_lines: null,
        },
        {
          id: 'heroImage',
          type: 'image',
          required: false,
          max_length: null,
          max_lines: null,
        },
        {
          id: 'qrTarget',
          type: 'url',
            required: true,
            max_length: null,
            max_lines: null,
          },
        ],
        variants: [
          {
            id: 'logo-focused',
            name: 'Logo im Fokus',
            active: true,
            preview_asset: 'template_google_reviews_minimal.png',
          },
          {
            id: 'text-focused',
            name: 'Text im Fokus',
            active: true,
            preview_asset: 'template_google_reviews_classic.png',
          },
        ],
      },
      {
        schema_version: 1,
        id: 'proof_a6_wedding',
        version: '1.0.0',
        name: 'Wedding Reviews',
        preview_asset: 'template_google_reviews_classic.png',
        product_id: 'a6_card',
        use_case_ids: ['wedding_reviews'],
        active: false,
        fields: [],
        variants: [],
      },
    ],
  };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/healthz')) {
        return {
          ok: true,
          json: async () => ({ status: 'ok' }),
        };
      }
      if (url.endsWith('/api/registries')) {
        return {
          ok: true,
          json: async () => bundle,
        };
      }
      if (url.endsWith('/api/drafts/current')) {
        return {
          ok: true,
          json: async () => ({
            id: 1,
            name: 'Current draft',
            use_case_id: null,
            product_id: null,
            template_id: null,
            template_version: null,
            variant_id: null,
            layout_state: {
              variant_id: '',
              element_adjustments: {},
              text_values: {},
              asset_values: persistedAssetValues,
            },
          }),
        };
      }
      if (url.endsWith('/api/drafts/current/validation')) {
        return {
          ok: true,
          json: async () => ({
            issues: [
              {
                code: 'qr_too_small',
                severity: 'error',
                path: 'proof-qr',
                message: "QR code 'proof-qr' is below the minimum size",
                blocking: true,
                details: {
                  effective_width_mm: 10,
                  effective_module_mm: 0.24,
                  minimum_width_mm: 18,
                  minimum_module_mm: 0.42,
                  quiet_zone_mm: 2,
                  module_count: 25,
                },
              },
            ],
            blocking: true,
          }),
        };
      }
      if (url.endsWith('/api/orders')) {
        return {
          ok: true,
          json: async () => [],
        };
      }
      if (url.endsWith('/api/drafts/current/template')) {
        const selection = JSON.parse(String(init?.body ?? '{}'));
        persistedTextValues = {};
        persistedAssetValues = {};
        return {
          ok: true,
          json: async () => ({
            id: 1,
            name: 'Current draft',
            use_case_id: selection.use_case_id,
            product_id: selection.product_id,
            template_id: selection.template_id,
            template_version: selection.template_version,
            variant_id: selection.variant_id ?? 'logo-focused',
            layout_state: {
              variant_id: selection.variant_id ?? 'logo-focused',
              element_adjustments: persistedElementAdjustments,
              text_values: {},
              asset_values: {},
            },
          }),
        };
      }
      if (url.endsWith('/api/drafts/current/layout')) {
        const body = JSON.parse(String(init?.body ?? '{}'));
        const nextVariantId = body.variant_id ?? 'logo-focused';
        const nextTextValues = {
          ...persistedTextValues,
          ...(body.text_values ?? {}),
        };
        const nextElementAdjustments = {
          ...persistedElementAdjustments,
          ...(body.element_adjustments ?? {}),
        };
        Object.entries(nextTextValues).forEach(([fieldId, value]) => {
          if (fieldId === 'qrTarget') {
            nextTextValues[fieldId] = normalizeUrl(value as string);
          }
        });
        persistedAssetValues = {
          ...persistedAssetValues,
          ...(body.asset_values ?? {}),
        };
        persistedTextValues = nextTextValues;
        persistedElementAdjustments = nextElementAdjustments;
        return {
          ok: true,
          json: async () => ({
            id: 1,
            name: 'Current draft',
            use_case_id: 'google_reviews',
            product_id: 'a6_card',
            template_id: 'proof_a6_card',
            template_version: '1.0.0',
            variant_id: nextVariantId,
            layout_state: {
              variant_id: nextVariantId,
              element_adjustments: nextElementAdjustments,
              text_values: nextTextValues,
              asset_values: persistedAssetValues,
            },
          }),
        };
      }
      if (url.startsWith('/api/qr')) {
        const parsed = new URL(url, 'http://localhost');
        const value = parsed.searchParams.get('value') ?? '';
        return {
          ok: true,
          json: async () => ({
            value,
            data_url: `data:image/svg+xml;base64,${btoa(`<svg>${value}</svg>`)}`,
          }),
        };
      }
      if (url.startsWith('/api/assets')) {
        if (init?.method === 'POST') {
          const parsed = new URL(url, 'http://localhost');
          const kind = (parsed.searchParams.get('kind') ?? 'image') as 'logo' | 'image';
          const assetId = kind === 'logo' ? 'logo-asset' : 'hero-asset';
          const payload: {
            id: string;
            preview_data_url: string;
            width_px: number;
            height_px: number;
            mime_type: string;
            kind: 'logo' | 'image';
            sha256: string;
          } = {
            id: assetId,
            preview_data_url: 'data:image/png;base64,' + btoa('preview'),
            width_px: kind === 'logo' ? 300 : 600,
            height_px: kind === 'logo' ? 150 : 300,
            mime_type: 'image/png',
            kind,
            sha256: 'test',
          };
          uploadedAssets[assetId] = payload;
          return {
            ok: true,
            json: async () => payload,
          };
        }
        const assetId = url.split('/').pop() ?? '';
        const asset = uploadedAssets[assetId];
        if (asset) {
          return {
            ok: true,
            json: async () => asset,
          };
        }
        return {
          ok: true,
          json: async () => ({
            id: 'asset-1',
            preview_data_url: 'data:image/png;base64,' + btoa('preview'),
            width_px: 2000,
            height_px: 1000,
            mime_type: 'image/png',
          }),
        };
      }
      return {
        ok: false,
        json: async () => ({}),
        text: async () => 'not found',
      };
    }),
  );

  render(<App />);

  expect(await screen.findByRole('button', { name: /A6 Card/i, pressed: true })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /DL Card/i })).toBeInTheDocument();
  expect(screen.queryByText('Hidden Card')).not.toBeInTheDocument();
  const initialDetail = screen.getByText('Selected product').closest('article');
  expect(initialDetail).not.toBeNull();
  expect(within(initialDetail as HTMLElement).getByText('105 × 148 mm')).toBeInTheDocument();
  expect(within(initialDetail as HTMLElement).getByText('DPI')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Google Reviews Classic' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Google Reviews Bold' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Google Reviews Minimal' })).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Wedding Reviews' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Google Reviews Classic/i }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Google Reviews Classic/i, pressed: true })).toBeInTheDocument();
  });
  expect(screen.getByText('Felder geladen')).toBeInTheDocument();
  expect(screen.getByText('Layoutvarianten')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'businessName' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'headline' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'qrTarget' })).toBeInTheDocument();
  expect(screen.getByText('Logo im Fokus')).toBeInTheDocument();
  expect(screen.getByText('Text im Fokus')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText(/QR code 'proof-qr' is below the minimum size/)).toBeInTheDocument();
  });
  expect(screen.getByRole('button', { name: 'Design freigeben' })).toBeDisabled();

  const businessNameInput = screen.getByRole('textbox', { name: 'businessName' });
  fireEvent.change(businessNameInput, { target: { value: 'Studio One' } });
  await waitFor(() => {
    expect(screen.getByDisplayValue('Studio One')).toBeInTheDocument();
  });
  expect(screen.getByText('Max. 40 Zeichen · 30 Zeichen verbleibend')).toBeInTheDocument();
  const livePreview = screen.getByText('Live-Vorschau').closest('.template-live-preview');
  expect(livePreview).not.toBeNull();
  expect(within(livePreview as HTMLElement).getByText('Studio One')).toBeInTheDocument();

  const qrTargetInput = screen.getByRole('textbox', { name: 'qrTarget' });
  fireEvent.change(qrTargetInput, { target: { value: 'example.com/review' } });
  await waitFor(() => {
    expect(screen.getByDisplayValue('https://example.com/review')).toBeInTheDocument();
  });
  await waitFor(() => {
    expect(screen.getAllByTestId('proof-canvas')).toHaveLength(2);
  });
  expect(within(livePreview as HTMLElement).getByText('Studio One')).toBeInTheDocument();

  const logoFile = new File([new Uint8Array([1, 2, 3])], 'logo.png', { type: 'image/png' });
  const logoInput = screen.getByLabelText('logo');
  fireEvent.change(logoInput, { target: { files: [logoFile] } });
  await waitFor(() => {
    expect(screen.getByAltText('logo Vorschau')).toBeInTheDocument();
  });
  await waitFor(() => {
    expect(screen.getByText(/Bildqualität: grenzwertig/)).toBeInTheDocument();
  });
  const studioLogoImages = screen.getAllByRole('img', { name: 'Studio logo' });
  expect(studioLogoImages).toHaveLength(2);
  expect(screen.getAllByRole('img', { name: 'QR: https://example.com/review' })).toHaveLength(2);
  const logoOffsetX = screen.getByLabelText('logo verschiebung x');
  fireEvent.change(logoOffsetX, { target: { value: '0.25' } });
  await waitFor(() => {
    expect(screen.getByDisplayValue('0.25')).toBeInTheDocument();
  });
  await waitFor(() => {
    expect(studioLogoImages[0]).toHaveStyle(
      'transform: translate(1.5mm, 0mm) scale(1);',
    );
  });
  expect(studioLogoImages[0]).toHaveStyle(
    'filter: contrast(1.06) saturate(1.01);',
  );
  const logoField = logoOffsetX.closest('.template-field');
  expect(logoField).not.toBeNull();
  fireEvent.click(within(logoField as HTMLElement).getByRole('button', { name: 'Zurücksetzen' }));
  await waitFor(() => {
    expect(studioLogoImages[0]).toHaveStyle(
      'transform: translate(0mm, 0mm) scale(1);',
    );
  });
  expect(screen.getByAltText('logo Vorschau')).toBeInTheDocument();

  const heroFile = new File([new Uint8Array([4, 5, 6])], 'hero.png', { type: 'image/png' });
  const heroInput = screen.getByLabelText('heroImage');
  fireEvent.change(heroInput, { target: { files: [heroFile] } });
  await waitFor(() => {
    expect(screen.getByAltText('heroImage Vorschau')).toBeInTheDocument();
  });
  await waitFor(() => {
    expect(screen.getByText(/Bildqualität: ausreichend/)).toBeInTheDocument();
  });
  const heroScale = screen.getByLabelText('heroImage skalierung');
  expect(heroScale).toHaveAttribute('min', '0.8');
  expect(heroScale).toHaveAttribute('max', '1.3');
  const heroImages = screen.getAllByRole('img', { name: 'Review hero image' });
  expect(heroImages).toHaveLength(2);
  expect(screen.getAllByText(/Bildqualität: grenzwertig/)).toHaveLength(1);
  const heroOffsetY = screen.getByLabelText('heroImage verschiebung y');
  fireEvent.change(heroOffsetY, { target: { value: '-0.2' } });
  await waitFor(() => {
    expect(heroImages[0]).toHaveStyle(
      'transform: translate(0mm, -0.8mm) scale(1);',
    );
  });
  fireEvent.change(heroScale, { target: { value: '1.3' } });
  await waitFor(() => {
    expect(heroImages[0]).toHaveStyle(
      'transform: translate(0mm, -0.8mm) scale(1.3);',
    );
  });
  await waitFor(() => {
    expect(screen.getAllByText(/Bildqualität: grenzwertig/)).toHaveLength(2);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Layout zurücksetzen' }));
  await waitFor(() => {
    expect(heroImages[0]).toHaveStyle(
      'transform: translate(0mm, 0mm) scale(1);',
    );
  });
  expect(screen.getByDisplayValue('Studio One')).toBeInTheDocument();
  expect(screen.getByAltText('logo Vorschau')).toBeInTheDocument();
  expect(screen.getByAltText('heroImage Vorschau')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('tab', { name: 'Text im Fokus' }));
  await waitFor(() => {
    expect(screen.getByRole('tab', { name: 'Text im Fokus', selected: true })).toBeInTheDocument();
  });
  expect(screen.getByDisplayValue('Studio One')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Google Reviews Classic - Text im Fokus' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /DL Card/i }));

  expect(screen.getByRole('button', { name: /DL Card/i, pressed: true })).toBeInTheDocument();
  const updatedDetail = screen.getByText('Selected product').closest('article');
  expect(updatedDetail).not.toBeNull();
  expect(within(updatedDetail as HTMLElement).getByText('99 × 210 mm')).toBeInTheDocument();
});

test('approves a draft and locks editing afterward', async () => {
  const bundle = {
    use_cases: [
      {
        id: 'google_reviews',
        name: 'Google Reviews',
        description: 'Scan to leave a Google review after service.',
        preview_asset: 'google_reviews_preview.png',
        active: true,
      },
    ],
    products: [
      {
        id: 'a6_card',
        name: 'A6 Card',
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
    ],
    templates: [
      {
        schema_version: 1,
        id: 'proof_a6_card',
        version: '1.0.0',
        name: 'Google Reviews Classic',
        preview_asset: 'template_google_reviews_classic.png',
        product_id: 'a6_card',
        use_case_ids: ['google_reviews'],
        active: true,
        fields: [
          {
            id: 'businessName',
            type: 'text',
            required: true,
            max_length: 40,
            max_lines: 2,
          },
          {
            id: 'headline',
            type: 'text',
            required: true,
            max_length: 60,
            max_lines: 3,
          },
          {
            id: 'qrTarget',
            type: 'url',
            required: true,
            max_length: null,
            max_lines: null,
          },
        ],
        variants: [
          {
            id: 'logo-focused',
            name: 'Logo im Fokus',
            active: true,
            preview_asset: 'template_google_reviews_classic.png',
          },
        ],
        elements: [],
        page_width_mm: 111,
        page_height_mm: 154,
        bleed_mm: 3,
        font_family: 'Proof Sans',
        fonts: [],
      },
    ],
  };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/healthz')) {
        return { ok: true, json: async () => ({ status: 'ok' }) };
      }
      if (url.endsWith('/api/registries')) {
        return { ok: true, json: async () => bundle };
      }
      if (url.endsWith('/api/drafts/current')) {
        return {
          ok: true,
          json: async () => ({
            id: 1,
            name: 'Current draft',
            use_case_id: 'google_reviews',
            product_id: 'a6_card',
            template_id: 'proof_a6_card',
            template_version: '1.0.0',
            variant_id: 'logo-focused',
            approved_at: null,
            approval_snapshot: null,
            approval_checklist: null,
            layout_state: {
              variant_id: 'logo-focused',
              element_adjustments: {},
              text_values: {
                businessName: 'Studio One',
                headline: 'Leave a Google review',
                qrTarget: 'https://example.com/review',
              },
              asset_values: {},
            },
          }),
        };
      }
      if (url.endsWith('/api/drafts/current/validation')) {
        return {
          ok: true,
          json: async () => ({
            issues: [],
            blocking: false,
          }),
        };
      }
      if (url.endsWith('/api/orders') && init?.method !== 'POST') {
        return {
          ok: true,
          json: async () => [],
        };
      }
      if (url.endsWith('/api/drafts/current/approval')) {
        return {
          ok: true,
          json: async () => ({
            id: 1,
            name: 'Current draft',
            use_case_id: 'google_reviews',
            product_id: 'a6_card',
            template_id: 'proof_a6_card',
            template_version: '1.0.0',
            variant_id: 'logo-focused',
            approved_at: '2026-07-30T12:00:00.000Z',
            approval_snapshot: {
              template_id: 'proof_a6_card',
              template_version: '1.0.0',
              variant_id: 'logo-focused',
              layout_state: {
                variant_id: 'logo-focused',
                element_adjustments: {},
                text_values: {
                  businessName: 'Studio One',
                  headline: 'Leave a Google review',
                  qrTarget: 'https://example.com/review',
                },
                asset_values: {},
              },
            },
            approval_checklist: {
              texts_checked: true,
              url_checked: true,
              image_crop_checked: true,
              preview_released: true,
            },
            layout_state: {
              variant_id: 'logo-focused',
              element_adjustments: {},
              text_values: {
                businessName: 'Studio One',
                headline: 'Leave a Google review',
                qrTarget: 'https://example.com/review',
              },
              asset_values: {},
            },
          }),
        };
      }
      if (url.endsWith('/api/orders') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            id: 'order-1',
            order_number: 'ORD-20260730-ABC123',
            display_name: null,
            use_case_id: 'google_reviews',
            product_id: 'a6_card',
            template_id: 'proof_a6_card',
            template_version: '1.0.0',
            variant_id: 'logo-focused',
            approved_at: '2026-07-30T12:05:00.000Z',
            created_at: '2026-07-30T12:06:00.000Z',
            preview_path: '/tmp/order-1/preview.png',
            use_case_snapshot: {},
            product_snapshot: {},
            template_snapshot: {},
            layout_snapshot: {
              variant_id: 'logo-focused',
              element_adjustments: {},
              text_values: {
                businessName: 'Studio One',
                headline: 'Leave a Google review',
                qrTarget: 'https://example.com/review',
              },
              asset_values: {},
            },
            validation_snapshot: {
              issues: [],
              blocking: false,
            },
            mockup_path: '/tmp/order-1/preview.png',
            pdf_path: null,
            render_engine_version: '1',
            assets: [],
          }),
        };
      }
      if (url.endsWith('/api/orders/order-1')) {
        return {
          ok: true,
          json: async () => ({
            id: 'order-1',
            order_number: 'ORD-20260730-ABC123',
            display_name: null,
            use_case_id: 'google_reviews',
            product_id: 'a6_card',
            template_id: 'proof_a6_card',
            template_version: '1.0.0',
            variant_id: 'logo-focused',
            approved_at: '2026-07-30T12:05:00.000Z',
            created_at: '2026-07-30T12:06:00.000Z',
            preview_path: '/tmp/order-1/preview.png',
            use_case_snapshot: {},
            product_snapshot: {},
            template_snapshot: {},
            layout_snapshot: {
              variant_id: 'logo-focused',
              element_adjustments: {},
              text_values: {
                businessName: 'Studio One',
                headline: 'Leave a Google review',
                qrTarget: 'https://example.com/review',
              },
              asset_values: {},
            },
            validation_snapshot: {
              issues: [],
              blocking: false,
            },
            mockup_path: '/tmp/order-1/preview.png',
            pdf_path: null,
            render_engine_version: '1',
            assets: [],
          }),
        };
      }
      return {
        ok: false,
        json: async () => ({}),
        text: async () => 'not found',
      };
    }),
  );

  render(<App />);

  expect(await screen.findByRole('button', { name: /Google Reviews Classic/i, pressed: true })).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Texte geprüft'));
  fireEvent.click(screen.getByLabelText('URL geprüft'));
  fireEvent.click(screen.getByLabelText('Bildausschnitt geprüft'));
  fireEvent.click(screen.getByLabelText('Vorschau freigegeben'));
  expect(screen.getByRole('button', { name: 'Design freigeben' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Design freigeben' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Freigegeben' })).toBeDisabled();
  });
  expect(screen.getByText(/Freigegeben am/)).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'businessName' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Layout zurücksetzen' })).toBeDisabled();
  expect(screen.getByRole('checkbox', { name: 'Texte geprüft' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: 'Auftrag erstellen' }));

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'ORD-20260730-ABC123' })).toBeInTheDocument();
  });
  expect(window.location.pathname).toBe('/render/orders/order-1');
  const previewImage = screen.getByAltText('Auftragsvorschau ORD-20260730-ABC123');
  fireEvent.load(previewImage);
  await waitFor(() => {
    expect(document.documentElement.dataset.renderReady).toBe('true');
  });
});
