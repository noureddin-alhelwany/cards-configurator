import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';

function setPath(path: string) {
  if (typeof window !== 'undefined') {
    window.history.pushState({}, '', path);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  setPath('/');
});

test('renders the internal template tool with separate preview and source layers', async () => {
  const qrDataUrl = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22%3E%3Crect width=%2224%22 height=%2224%22 fill=%22%23ffffff%22/%3E%3C/svg%3E';
  const bundle = {
    categories: [
      {
        id: 'google_reviews',
        name: 'Google Reviews',
        description: 'Collect review requests after service.',
        preview_asset: 'review.png',
        active: true,
      },
    ],
    products: [
      {
        id: 'a6_card',
        name: 'A6 Card',
        description: null,
        category_ids: ['google_reviews'],
        preview_asset: 'a6_preview.png',
        active: true,
      },
    ],
    templates: [
      {
        schema_version: 1,
        id: 'proof_a6_card',
        version: '1.6.0',
        name: 'Google Reviews Host',
        description: null,
        product_id: 'a6_card',
        active: true,
        page_width_mm: 111,
        page_height_mm: 154,
        bleed_mm: 3,
        safe_areas: [],
        text_rules: [],
        qr_rules: [],
        fields: [
          {
            id: 'headline',
            type: 'text',
            required: false,
            max_length: 60,
            max_lines: 3,
            label: 'Headline',
            help_text: null,
            group: 'Texte',
            placeholder: null,
            suggestions: [],
            default_value: 'Scanne den QR-Code',
          },
          {
            id: 'qrTarget',
            type: 'url',
            required: false,
            max_length: null,
            max_lines: null,
            label: 'QR-Ziel',
            help_text: null,
            group: 'QR',
            placeholder: null,
            suggestions: [],
            default_value: 'example.com/review',
          },
        ],
        elements: [
          {
            kind: 'text',
            id: 'headline',
            box_mm: { x_mm: 10, y_mm: 12, width_mm: 70, height_mm: 20 },
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
          {
            kind: 'qr',
            id: 'proof-qr',
            box_mm: { x_mm: 72, y_mm: 72, width_mm: 22, height_mm: 22 },
            z_index: 2,
            value: 'example.com/review',
            color: '#1f1a17',
            background: '#ffffff',
            error_correction: 'm',
            quiet_zone_mm: 4,
          },
        ],
        designs: [
          {
            id: 'bold',
            name: 'Bold',
            active: true,
            preview_asset: 'preview/template_google_reviews_bold.png',
            source_asset: 'source/template_google_reviews_bold.png',
            background_asset: 'backgrounds/template_google_reviews_bold.svg',
            accent_color: '#315a86',
            fonts: [
              {
                id: 'proof-sans',
                family: 'Proof Sans',
                file: '/fonts/ProofSans.ttf',
                weight: 400,
                style: 'normal',
              },
              {
                id: 'proof-serif',
                family: 'Proof Serif',
                file: '/fonts/ProofSerif.ttf',
                weight: 400,
                style: 'normal',
              },
            ],
          },
          {
            id: 'warm',
            name: 'Warm',
            active: true,
            preview_asset: 'preview/template_google_reviews_warm.png',
            source_asset: null,
            background_asset: null,
            accent_color: '#a67b4d',
            fonts: [
              {
                id: 'proof-sans',
                family: 'Proof Sans',
                file: '/fonts/ProofSans.ttf',
                weight: 400,
                style: 'normal',
              },
              {
                id: 'proof-serif',
                family: 'Proof Serif',
                file: '/fonts/ProofSerif.ttf',
                weight: 400,
                style: 'normal',
              },
            ],
          },
        ],
      },
    ],
    diagnostics: [],
  };

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const requestUrl = input instanceof Request ? input.url : String(input);
    if (requestUrl === '/api/registries') {
      return {
        ok: true,
        json: async () => bundle,
      } as Response;
    }
    if (requestUrl === '/api/font-catalog') {
      return {
        ok: true,
        json: async () => [
          { id: 'inter', family: 'Inter', type: 'google', category: 'sans-serif', variable: true, subsets: ['latin'] },
          { id: 'libre-baskerville', family: 'Libre Baskerville', type: 'google', category: 'serif', variable: false, subsets: ['latin'] },
          { id: 'abril-fatface', family: 'Abril Fatface', type: 'google', category: 'display', variable: false, subsets: ['latin'] },
        ],
      } as Response;
    }
    if (requestUrl === '/api/font-catalog/inter') {
      return {
        ok: true,
        json: async () => ({
          id: 'inter',
          family: 'Inter',
          file: '/fonts/inter.woff2',
          weight: 400,
          style: 'normal',
        }),
      } as Response;
    }
    if (requestUrl === '/api/font-catalog/libre-baskerville') {
      return {
        ok: true,
        json: async () => ({
          id: 'libre-baskerville',
          family: 'Libre Baskerville',
          file: '/fonts/libre-baskerville.woff2',
          weight: 400,
          style: 'normal',
        }),
      } as Response;
    }
    if (requestUrl === '/api/font-catalog/abril-fatface') {
      return {
        ok: true,
        json: async () => ({
          id: 'abril-fatface',
          family: 'Abril Fatface',
          file: '/fonts/abril-fatface.woff2',
          weight: 400,
          style: 'normal',
        }),
      } as Response;
    }
    if (requestUrl.startsWith('/api/qr')) {
      return {
        ok: true,
        json: async () => ({
          value: 'https://example.com/review',
          data_url: qrDataUrl,
        }),
      } as Response;
    }
    throw new Error(`Unexpected fetch: ${String(input)}`);
  });

  vi.stubGlobal('fetch', fetchMock);
  setPath('/template-tool');

  render(<App />);

  expect(await screen.findByText('Templates und Design-Overlays')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith('/api/registries');
  expect(fetchMock).toHaveBeenCalledWith('/api/font-catalog');
  expect(screen.getByLabelText('Preview anzeigen')).toBeInTheDocument();
  expect(screen.getByLabelText('Preview-Deckkraft')).toBeInTheDocument();
  expect(screen.getByLabelText('Source anzeigen')).toBeInTheDocument();
  expect(screen.getByLabelText('Source-Deckkraft')).toBeInTheDocument();
  expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(2);

  const previewImage = await screen.findByTestId('template-tool-preview-image');
  expect(previewImage).toHaveAttribute('src', '/proof-assets/preview/template_google_reviews_bold.png');
  const sourceOverlay = await screen.findByTestId('template-tool-overlay');
  expect(sourceOverlay).toHaveAttribute('src', '/proof-assets/source/template_google_reviews_bold.png');

  expect(screen.queryByAltText('QR: https://example.com/review')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Text erstellen' }));

  await screen.findByLabelText('Schrift suchen');
  expect(screen.getByText('Zuordnung')).toBeInTheDocument();
  expect(screen.getByText('Headline')).toBeInTheDocument();
  expect(screen.getByLabelText('Textinhalt')).toHaveValue('Scanne den QR-Code');
  expect(await screen.findByRole('button', { name: /Inter/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Libre Baskerville/ })).toBeInTheDocument();
  expect(screen.getAllByText('AaBb 123').length).toBeGreaterThanOrEqual(2);
  expect(screen.queryByRole('button', { name: /Weitere Fonts laden/ })).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Schrift suchen'), { target: { value: 'Abril' } });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/font-catalog/abril-fatface'));
  expect(await screen.findByRole('button', { name: /Abril Fatface/ })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Schrift suchen'), { target: { value: '' } });
  expect(screen.getByLabelText('Textinhalt')).toHaveValue('Scanne den QR-Code');

  const stage = document.querySelector('.template-tool-zone-editor__canvas-content') as HTMLElement | null;
  expect(stage).not.toBeNull();
  const stageElement = stage as HTMLElement;
  Object.defineProperty(stageElement, 'getBoundingClientRect', {
    value: () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 1110,
      bottom: 1540,
      width: 1110,
      height: 1540,
      toJSON: () => ({}),
    }),
  });

  const draggableZone = document.querySelector('[data-testid^="template-tool-zone-zone-text"]') as HTMLElement | null;
  expect(draggableZone).not.toBeNull();
  const draggableZoneElement = draggableZone as HTMLElement;
  expect(draggableZoneElement.querySelector('.template-tool-zone-editor__zone-text--static')).not.toBeNull();

  fireEvent.change(screen.getByLabelText('Textinhalt'), { target: { value: 'Hallo Fix' } });
  expect(screen.getByLabelText('Textinhalt')).toHaveValue('Hallo Fix');
  await waitFor(() => {
    const previewText = document.querySelector<HTMLElement>('.template-tool-zone-editor__zone-text--static');
    expect(previewText).not.toBeNull();
    expect(previewText?.textContent).toContain('Hallo Fix');
  });
  const previewTextBefore = document.querySelector<HTMLElement>('.template-tool-zone-editor__zone-text--static');
  expect(previewTextBefore?.style.fontFamily).toContain('Proof Sans');

  const initialLeft = draggableZoneElement.style.left;
  const initialTop = draggableZoneElement.style.top;
  fireEvent.mouseDown(draggableZoneElement, { clientX: 100, clientY: 100 });
  fireEvent.mouseMove(window, { clientX: 211, clientY: 254 });
  fireEvent.mouseUp(window);
  expect(draggableZoneElement.style.left).not.toBe(initialLeft);
  expect(draggableZoneElement.style.top).not.toBe(initialTop);
  expect(draggableZoneElement.querySelector('.template-tool-zone-editor__zone-text--static')).toHaveTextContent('Hallo Fix');
  expect(screen.getByText('Zuordnung')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Schrift suchen'), { target: { value: 'Inter' } });
  fireEvent.change(screen.getByLabelText('Kategorie'), { target: { value: 'sans-serif' } });
  expect(await screen.findByRole('button', { name: /Inter/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Inter/ }));
  expect(fetchMock).toHaveBeenCalledWith('/api/font-catalog/inter');
  await waitFor(() => {
    const previewText = document.querySelector<HTMLElement>('.template-tool-zone-editor__zone-text--static');
    expect(previewText?.style.fontFamily).toContain('Inter');
  });

  fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));
  await waitFor(() => {
    expect(screen.queryByLabelText('Text skalieren')).not.toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('button', { name: 'QR-Code erstellen' }));
  await screen.findByText('QR-Konfiguration');
  fireEvent.change(screen.getByLabelText('Test-URL'), {
    target: { value: 'https://example.com/review' },
  });
  fireEvent.change(screen.getByLabelText('Fehlerkorrektur'), { target: { value: 'h' } });
  fireEvent.change(screen.getByLabelText('Ruhezone mm'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Farbe'), { target: { value: '#ffffff' } });
  fireEvent.change(screen.getByLabelText('Hintergrund'), { target: { value: '#ffffff' } });
  expect(screen.getByLabelText('Fehlerkorrektur')).toHaveValue('h');
  expect(screen.getByText('Der Kontrast zwischen QR-Farbe und Hintergrund ist zu gering.')).toBeInTheDocument();
  expect(screen.queryByAltText('QR: https://example.com/review')).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Preview anzeigen'));
  expect(screen.queryByTestId('template-tool-preview-image')).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Preview anzeigen'));
  expect(screen.getByTestId('template-tool-preview-image')).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Source anzeigen'));

  await waitFor(() => {
    expect(screen.queryByTestId('template-tool-overlay')).not.toBeInTheDocument();
  });
});
