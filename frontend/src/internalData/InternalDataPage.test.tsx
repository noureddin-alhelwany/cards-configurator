import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
          assets: [],
          draft: { template_id: 'proof_a6_card' },
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
  const editor = await screen.findByLabelText('Registry JSON');
  await waitFor(() => expect(editor).toHaveValue('{"id":"proof_a6_card"}'));
});
