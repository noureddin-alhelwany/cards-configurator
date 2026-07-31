import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.pushState({}, '', '/');
});

test('renders the registry selection flow and keeps only available products visible', async () => {
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
      original_filename: string;
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
        preview_asset: 'review.png',
        active: true,
      },
      {
        id: 'wedding_reviews',
        name: 'Wedding Reviews',
        description: 'Collect a wedding guest review after the event.',
        preview_asset: 'review.png',
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
            max_lines: 1,
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
            name: 'Logo',
            active: true,
            preview_asset: 'template_google_reviews_classic.png',
          },
          {
            id: 'text-focused',
            name: 'Text',
            active: true,
            preview_asset: 'booking.png',
          },
        ],
      },
      {
        ...sharedTemplateModel,
        schema_version: 1,
        id: 'proof_a6_card',
        version: '1.1.0',
        name: 'Google Reviews Bold',
        preview_asset: 'booking.png',
        product_id: 'a6_card',
        use_case_ids: ['google_reviews'],
        active: true,
        fields: [
          {
            id: 'businessName',
            type: 'text',
            required: true,
            max_length: 40,
            max_lines: 1,
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
            name: 'Logo',
            active: true,
            preview_asset: 'booking.png',
          },
          {
            id: 'text-focused',
            name: 'Text',
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
            max_lines: 1,
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
            name: 'Logo',
            active: true,
            preview_asset: 'template_google_reviews_minimal.png',
          },
          {
            id: 'text-focused',
            name: 'Text',
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
              // The resolution verdict is the server's alone: it knows the visible crop and
              // the clamped scale. The form must show this finding instead of recomputing one.
              {
                code: 'image_dpi_warning',
                severity: 'warning',
                path: 'logo',
                message: "Image in field 'logo' is below the recommended DPI",
                blocking: false,
                details: {
                  effective_dpi: 272.14,
                  minimum_dpi: 225,
                  warning_dpi: 300,
                  recommended_dpi: 450,
                  fit: 'contain',
                  applied_scale: 1,
                  requested_scale: 1,
                  dpi_x: 272.14,
                  dpi_y: 272.14,
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
            original_filename: string;
          } = {
            id: assetId,
            preview_data_url: 'data:image/png;base64,' + btoa('preview'),
            width_px: kind === 'logo' ? 300 : 600,
            height_px: kind === 'logo' ? 150 : 300,
            mime_type: 'image/png',
            kind,
            sha256: 'test',
            original_filename: parsed.searchParams.get('filename') ?? 'asset.png',
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
  fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: '2. Design' })).toBeInTheDocument();
  });
  expect(screen.queryByRole('button', { name: /A6 Card/i })).not.toBeInTheDocument();
  expect(screen.queryByText('Hidden Card')).not.toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Google Reviews Classic/i })).toBeInTheDocument();
  });
  expect(screen.getByRole('button', { name: /Google Reviews Bold/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Google Reviews Minimal/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Wedding Reviews/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Google Reviews Classic/i }));

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Personalisiere deine Karte' })).toBeInTheDocument();
  });
  expect(screen.getByText(/Gespeichert/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Weiter zur Prüfung' })).toBeEnabled();
  expect(screen.getByRole('textbox', { name: 'Unternehmensname' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Überschrift' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'QR-Ziel' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Logo' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Text' })).toBeInTheDocument();
  expect(screen.queryByText(/zu klein für dieses Produkt/)).not.toBeInTheDocument();

  const headlineInput = screen.getByRole('textbox', { name: 'Überschrift' });
  fireEvent.change(headlineInput, { target: { value: 'Studio One' } });
  await waitFor(() => {
    expect(screen.getByDisplayValue('Studio One')).toBeInTheDocument();
  });
  expect(screen.getByText('10 / 60 Zeichen')).toBeInTheDocument();
  const livePreview = screen.getByRole('heading', { name: 'Live-Vorschau' }).closest('.selection-sidecard');
  expect(livePreview).not.toBeNull();
  expect(within(livePreview as HTMLElement).getByText('Studio One')).toBeInTheDocument();

  const qrTargetInput = screen.getByRole('textbox', { name: 'QR-Ziel' });
  fireEvent.change(qrTargetInput, { target: { value: 'example.com/review' } });
  await waitFor(() => {
    expect(screen.getByDisplayValue('https://example.com/review')).toBeInTheDocument();
  });
  await waitFor(() => {
    expect(screen.getAllByTestId('proof-canvas')).toHaveLength(1);
  });
  // Shown once, at the field itself: the always-on feedback sidecard is gone and the
  // compact summary above the form only appears with more than one blocking issue.
  await waitFor(() => {
    expect(screen.getAllByText(/QR-Ziel ist zu klein für dieses Produkt/)).toHaveLength(1);
  });
  expect(within(livePreview as HTMLElement).getByText('Studio One')).toBeInTheDocument();

  // Before uploading, the empty state is compact: an upload control, no preview box.
  expect(screen.getByText('Logo hochladen')).toBeInTheDocument();
  expect(screen.queryByAltText('Logo Vorschau')).not.toBeInTheDocument();

  const logoFile = new File([new Uint8Array([1, 2, 3])], 'logo.png', { type: 'image/png' });
  const logoInput = screen.getByLabelText('Logo hochladen');
  fireEvent.change(logoInput, { target: { files: [logoFile] } });
  await waitFor(() => {
    expect(screen.getByAltText('Logo Vorschau')).toBeInTheDocument();
  });
  // 300 px across a 28 mm box is ~272 dpi: above the 225 minimum, below the 300 warning.
  // The wording comes from the server finding, not from a second formula in the form.
  await waitFor(() => {
    expect(screen.getByText(/Logo ist grenzwertig aufgelöst/)).toBeInTheDocument();
  });
  expect(screen.getByText('logo.png')).toBeInTheDocument();
  const studioLogoImages = screen.getAllByRole('img', { name: 'Studio logo' });
  expect(studioLogoImages).toHaveLength(1);
  expect(screen.getAllByRole('img', { name: 'QR: https://example.com/review' })).toHaveLength(1);
  // The empty-state input is unmounted once an asset exists, so re-resolve the container.
  const logoField = screen.getByAltText('Logo Vorschau').closest('.content-field');
  expect(logoField).not.toBeNull();
  expect(within(logoField as HTMLElement).getByLabelText('Logo ersetzen')).toBeInTheDocument();
  expect(within(logoField as HTMLElement).getByRole('button', { name: 'Logo entfernen' })).toBeInTheDocument();

  fireEvent.click(within(logoField as HTMLElement).getByRole('button', { name: 'Logo anpassen' }));
  await waitFor(() => {
    expect(screen.getByRole('dialog', { name: 'Logo' })).toBeInTheDocument();
  });

  const logoScale = screen.getByLabelText('Skalierung');
  expect(logoScale).toHaveAttribute('min', '0.7');
  expect(logoScale).toHaveAttribute('max', '1.2');

  const logoOffsetX = screen.getByLabelText('Verschieben X');
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

  const logoOffsetY = screen.getByLabelText('Verschieben Y');
  fireEvent.change(logoOffsetY, { target: { value: '-0.2' } });
  await waitFor(() => {
    expect(studioLogoImages[0]).toHaveStyle(
      'transform: translate(1.5mm, -0.8mm) scale(1);',
    );
  });
  fireEvent.change(logoScale, { target: { value: '1.2' } });
  await waitFor(() => {
    expect(studioLogoImages[0]).toHaveStyle(
      'transform: translate(1.5mm, -0.8mm) scale(1.2);',
    );
  });

  // Escape closes the dialog without discarding the adjustment.
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => {
    expect(screen.queryByRole('dialog', { name: 'Logo' })).not.toBeInTheDocument();
  });

  // Resetting the adjustments now lives in the global "Mehr" menu.
  fireEvent.click(screen.getByText('Mehr'));
  fireEvent.click(screen.getByRole('button', { name: 'Bildanpassungen zurücksetzen' }));
  await waitFor(() => {
    expect(studioLogoImages[0]).toHaveStyle(
      'transform: translate(0mm, 0mm) scale(1);',
    );
  });
  expect(screen.getByDisplayValue('Studio One')).toBeInTheDocument();
  expect(within(logoField as HTMLElement).getByAltText('Logo Vorschau')).toBeInTheDocument();

  expect(screen.getByRole('button', { name: 'Weiter zur Prüfung' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Weiter zur Prüfung' }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Design freigeben' })).toBeInTheDocument();
  });
  expect(screen.getByText('Freigabevorschau')).toBeInTheDocument();
  expect(screen.getAllByTestId('proof-canvas')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Design freigeben' })).toBeDisabled();
});

test('selecting a product advances directly to the design step', async () => {
  const bundle = {
    use_cases: [
      {
        id: 'google_reviews',
        name: 'Google Reviews',
        description: 'Scan to leave a Google review after service.',
        preview_asset: 'review.png',
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
            max_lines: 1,
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
            name: 'Logo',
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
      {
        schema_version: 1,
        id: 'proof_dl_card',
        version: '1.0.0',
        name: 'Google Reviews Slim',
        preview_asset: 'booking.png',
        product_id: 'dl_card',
        use_case_ids: ['google_reviews'],
        active: true,
        fields: [
          {
            id: 'businessName',
            type: 'text',
            required: true,
            max_length: 40,
            max_lines: 1,
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
            name: 'Logo',
            active: true,
            preview_asset: 'booking.png',
          },
        ],
        elements: [],
        page_width_mm: 99,
        page_height_mm: 210,
        bleed_mm: 3,
        font_family: 'Proof Sans',
        fonts: [],
      },
    ],
  };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
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
            use_case_id: null,
            product_id: null,
            template_id: null,
            template_version: null,
            variant_id: null,
            layout_state: {
              variant_id: '',
              element_adjustments: {},
              text_values: {},
              asset_values: {},
            },
          }),
        };
      }
      if (url.endsWith('/api/drafts/current/template')) {
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
            layout_state: {
              variant_id: 'logo-focused',
              element_adjustments: {},
              text_values: {},
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
      return {
        ok: false,
        json: async () => ({}),
        text: async () => 'not found',
      };
    }),
  );

  render(<App />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /DL Card/i })).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('button', { name: /DL Card/i }));

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: '2. Design' })).toBeInTheDocument();
  });
  expect(screen.getByRole('heading', { name: 'Google Reviews Slim' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /DL Card/i })).not.toBeInTheDocument();
});

test('approves a draft and locks editing afterward', async () => {
  const bundle = {
    use_cases: [
      {
        id: 'google_reviews',
        name: 'Google Reviews',
        description: 'Scan to leave a Google review after service.',
        preview_asset: 'review.png',
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
            max_lines: 1,
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
            name: 'Logo',
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
      if (url.endsWith('/api/drafts/current/template')) {
        const selection = JSON.parse(String(init?.body ?? '{}'));
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
            approved_at: null,
            approval_snapshot: null,
            approval_checklist: null,
            layout_state: {
              variant_id: selection.variant_id ?? 'logo-focused',
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
      if (url.endsWith('/api/drafts/current/reset')) {
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
            approved_at: null,
            approval_snapshot: null,
            approval_checklist: null,
            layout_state: {
              variant_id: '',
              element_adjustments: {},
              text_values: {},
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
            display_name: 'Studio One',
            use_case_id: 'google_reviews',
            product_id: 'a6_card',
            template_id: 'proof_a6_card',
            template_version: '1.0.0',
            variant_id: 'logo-focused',
            approved_at: '2026-07-30T12:05:00.000Z',
            created_at: '2026-07-30T12:06:00.000Z',
            preview_path: '/tmp/order-1/preview.png',
            use_case_snapshot: {
              name: 'Google Reviews',
            },
            product_snapshot: {
              name: 'A6 Card',
            },
            template_snapshot: {
              name: 'Google Reviews Classic',
            },
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
            display_name: 'Studio One',
            use_case_id: 'google_reviews',
            product_id: 'a6_card',
            template_id: 'proof_a6_card',
            template_version: '1.0.0',
            variant_id: 'logo-focused',
            approved_at: '2026-07-30T12:05:00.000Z',
            created_at: '2026-07-30T12:06:00.000Z',
            preview_path: '/tmp/order-1/preview.png',
            use_case_snapshot: {
              name: 'Google Reviews',
            },
            product_snapshot: {
              name: 'A6 Card',
            },
            template_snapshot: {
              name: 'Google Reviews Classic',
            },
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
      return {
        ok: false,
        json: async () => ({}),
        text: async () => 'not found',
      };
    }),
  );

  render(<App />);

  expect(screen.queryByText('Backend')).not.toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Personalisiere deine Karte' })).toBeInTheDocument();
  });
  expect(screen.getByText('Design: Classic')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /A6 Card/i })).not.toBeInTheDocument();

  expect(screen.getByText(/Gespeichert/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Weiter zur Prüfung' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Weiter zur Prüfung' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Design freigeben' })).toBeInTheDocument();
  });
  fireEvent.click(screen.getByLabelText('Ich habe die Vorschau geprüft'));
  expect(screen.getByRole('button', { name: 'Design freigeben' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Design freigeben' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Auftrag erstellen' })).toBeInTheDocument();
  });
  expect(screen.getByText(/Freigegeben am/)).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Auftrag erstellen' })).toBeEnabled();
  });
  fireEvent.click(screen.getByRole('button', { name: 'Auftrag erstellen' }));
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'ORD-20260730-ABC123' })).toBeInTheDocument();
  });
  expect(screen.getByText('Auftrag erstellt')).toBeInTheDocument();
  expect(screen.getByText('Dein Auftrag ist gespeichert und bereit für die Produktion.')).toBeInTheDocument();
  expect(screen.getByText('A6 Card')).toBeInTheDocument();
  expect(screen.getByText('Google Reviews')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Gespeicherte Auftragsdaten' })).toBeInTheDocument();
  expect(screen.getByText('Produkt-Mockup')).toBeInTheDocument();
  expect(screen.getByText('Keine gespeicherten Assets vorhanden.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Zur Produktionsansicht' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Mockup öffnen' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Auftrag erneut öffnen' })).toBeInTheDocument();
});

test('renders registry field copy for the review link and offers no example-link chips', async () => {
  // Mirrors the real Google-Reviews registry: label, help text and placeholder come from
  // the template, and the suggestion list is deliberately empty so no fake URL can be
  // written into a customer's card.
  const bundle = {
    use_cases: [
      {
        id: 'google_reviews',
        name: 'Google Reviews',
        description: 'Scan to leave a Google review after service.',
        preview_asset: 'review.png',
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
        version: '1.2.0',
        name: 'Google Reviews Bold',
        description: 'Kräftige Google-Bewertungsvorlage.',
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
            max_lines: 1,
            label: 'Unternehmensname',
            help_text: null,
            group: 'Texte',
            placeholder: 'Studio Sonnenschein',
            suggestions: [],
            default_value: 'Studio Sonnenschein',
          },
          {
            id: 'headline',
            type: 'text',
            required: true,
            max_length: 60,
            max_lines: 3,
            label: 'Überschrift',
            group: 'Texte',
            placeholder: 'Scanne und bewerte uns',
            suggestions: ['Scanne den QR-Code', 'Jetzt scannen', 'Zur Zielseite'],
            default_value: 'Scanne den QR-Code',
          },
          {
            id: 'logo',
            type: 'logo',
            required: false,
            max_length: null,
            max_lines: null,
            label: 'Logo',
            help_text: 'PNG, JPG oder SVG',
            group: 'Bilder',
          },
          {
            id: 'qrTarget',
            type: 'url',
            required: true,
            max_length: null,
            max_lines: null,
            label: 'Link zu deinen Google-Bewertungen',
            help_text: 'Wir erstellen daraus automatisch den QR-Code.',
            group: 'Link und QR',
            placeholder: 'Google-Bewertungslink einfügen',
            suggestions: [],
            default_value: '',
          },
        ],
        variants: [],
        elements: [],
        page_width_mm: 111,
        page_height_mm: 154,
        bleed_mm: 3,
        font_family: 'Proof Sans',
        fonts: [],
      },
    ],
  };

  const draft = {
    id: 1,
    name: 'Current draft',
    use_case_id: 'google_reviews',
    product_id: 'a6_card',
    template_id: 'proof_a6_card',
    template_version: '1.2.0',
    variant_id: null,
    approved_at: null,
    approval_snapshot: null,
    approval_checklist: null,
    layout_state: {
      variant_id: '',
      element_adjustments: {},
      text_values: { businessName: 'Studio Sonnenschein', headline: 'Scanne den QR-Code', qrTarget: '' },
      asset_values: {},
    },
  };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/healthz')) {
        return { ok: true, json: async () => ({ status: 'ok' }) };
      }
      if (url.endsWith('/api/registries')) {
        return { ok: true, json: async () => bundle };
      }
      if (url.endsWith('/api/drafts/current/validation')) {
        return { ok: true, json: async () => ({ issues: [], blocking: false }) };
      }
      if (url.endsWith('/api/drafts/current')) {
        return { ok: true, json: async () => draft };
      }
      return { ok: false, json: async () => ({}), text: async () => 'not found' };
    }),
  );

  render(<App />);

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Personalisiere deine Karte' })).toBeInTheDocument();
  });

  // Compact header instead of the template name plus description plus product repetition.
  expect(screen.getByText('Design: Bold')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Design ändern' })).toBeInTheDocument();
  expect(screen.queryByText('Kräftige Google-Bewertungsvorlage.')).not.toBeInTheDocument();
  expect(screen.queryByText('A6 Card')).not.toBeInTheDocument();

  // Single-field sections borrow the field label as their heading.
  expect(screen.getByRole('heading', { name: 'Link zu deinen Google-Bewertungen' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Logo' })).toBeInTheDocument();
  expect(screen.getByText('Wir erstellen daraus automatisch den QR-Code.')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Google-Bewertungslink einfügen')).toBeInTheDocument();

  // No example-link chips, and no leftover technical labels.
  expect(screen.queryByText(/example\.com/)).not.toBeInTheDocument();
  expect(screen.queryByText('QR-Ziel')).not.toBeInTheDocument();
  expect(screen.queryByText('Link und QR')).not.toBeInTheDocument();
  expect(screen.queryByText('Felder')).not.toBeInTheDocument();

  // Removed surfaces: no image field, no variant picker, no permanent feedback box.
  expect(screen.queryByLabelText('Bild hochladen')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Foto hochladen')).not.toBeInTheDocument();
  expect(screen.queryByText('Layoutvarianten')).not.toBeInTheDocument();
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(screen.queryByText('Rückmeldungen')).not.toBeInTheDocument();
  expect(screen.queryByText('Alles sieht gut aus')).not.toBeInTheDocument();
  expect(screen.queryByText('Noch keine kritischen Rückmeldungen.')).not.toBeInTheDocument();

  // Compact counter, and the headline offers at most three suggestion chips.
  expect(screen.getByText('19 / 40 Zeichen')).toBeInTheDocument();
  expect(screen.getByLabelText('Vorschläge für Überschrift').querySelectorAll('button')).toHaveLength(3);

  // Only one "Live-Vorschau" and no status line beneath it.
  expect(screen.getAllByText('Live-Vorschau')).toHaveLength(1);
  expect(screen.queryByText('Live-Vorschau sichtbar')).not.toBeInTheDocument();
});
