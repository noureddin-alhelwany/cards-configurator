import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.pushState({}, '', '/');
});

test('renders the internal data page at the separate admin url', async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const requestUrl = input instanceof Request ? input.url : String(input);
    if (requestUrl === '/api/admin/data') {
      return {
        ok: true,
        json: async () => ({
          registries: [
            {
              kind: 'template',
              path: 'proof_a6_card-1.6.0.json',
              id: 'proof_a6_card',
              title: 'Google Reviews Host',
              version: '1.6.0',
              active: true,
              order_count: 0,
              asset_count: 0,
              error: null,
            },
          ],
          categories: [],
          products: [],
          templates: [],
          orders: [],
          draft: { template_id: 'proof_a6_card' },
          diagnostics: [],
        }),
      } as Response;
    }
    if (requestUrl === '/api/registries') {
      return {
        ok: true,
        json: async () => ({
          categories: [
            {
              id: 'cat-1',
              name: 'Kategorie 1',
              description: 'Beschreibung',
              preview_asset: 'categories/cat-1.svg',
              active: true,
            },
          ],
          products: [
            {
              id: 'a6_card',
              name: 'A6 Card',
              description: null,
              category_ids: ['cat-1'],
              preview_asset: 'products/review.png',
              active: true,
            },
          ],
          templates: [
            {
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
              fields: [],
              text_rules: [],
              qr_rules: [],
              elements: [],
              designs: [
                {
                  id: 'warm',
                  name: 'Warm',
                  active: true,
                  preview_asset: 'template/template-warm-preview.png',
                  source_asset: 'template/template-warm-source.png',
                  background_asset: 'template/template-warm-background.png',
                  accent_color: null,
                  zones: [],
                  fonts: [],
                },
              ],
            },
          ],
          diagnostics: [],
        }),
      } as Response;
    }
    if (requestUrl === '/api/admin/registries/template/proof_a6_card-1.6.0.json') {
      return {
        ok: true,
        json: async () => ({
          kind: 'template',
          path: 'proof_a6_card-1.6.0.json',
          content: '{"id":"proof_a6_card"}',
        }),
      } as Response;
    }
    throw new Error(`Unexpected fetch: ${String(input)}`);
  });

  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState({}, '', '/template-tool/data');

  render(<App />);

  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/data'));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/registries'));
  const editor = await screen.findByLabelText('Registry JSON');
  await waitFor(() => expect(editor).toHaveValue('{"id":"proof_a6_card"}'));

  fireEvent.click(screen.getByRole('button', { name: 'Assets' }));
  const showLinks = await screen.findAllByRole('link', { name: 'Show' });
  expect(showLinks).toHaveLength(5);
  expect(document.querySelector('.internal-data-asset-card__thumb')).toHaveAttribute('src', '/proof-assets/categories/cat-1.svg');
  expect(showLinks.map((link) => link.getAttribute('href'))).toEqual([
    '/proof-assets/categories/cat-1.svg',
    '/proof-assets/products/review.png',
    '/proof-assets/template/template-warm-preview.png',
    '/proof-assets/template/template-warm-source.png',
    '/proof-assets/template/template-warm-background.png',
  ]);
  expect(showLinks[0]).toHaveAttribute('target', '_blank');
});
