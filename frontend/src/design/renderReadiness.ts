import type { ProofFixture } from './types';
import { resolveTemplateBackgroundAsset } from './variantResolution';

/**
 * Number of `onAssetReady` callbacks a fixture will fire before it is fully painted.
 *
 * Counts only image elements whose asset is actually present: an element without an
 * asset renders with an undefined `src`, so its `onLoad` never fires. A fixed count
 * would leave `renderReady` stuck at `false` and hang the Playwright render.
 */
export function expectedAssetCount(fixture: ProofFixture) {
  const imageAssets = fixture.template.elements.filter(
    (element) => element.kind === 'image' && fixture.assets[element.asset_key],
  ).length;
  const qrAssets = fixture.assets.qr ? 1 : 0;
  // The background must be counted here or Playwright screenshots the card before the
  // artwork is decoded — a plausible-looking but wrong print file, produced without any
  // error. `BACKGROUND_ASSET_ID` is the id `DesignRenderer` reports it under.
  const backgroundAssets = resolveTemplateBackgroundAsset(fixture.template, fixture.layout_state) ? 1 : 0;
  return imageAssets + qrAssets + backgroundAssets;
}

/** Asset id `DesignRenderer` reports the background layer under; it has no element. */
export const BACKGROUND_ASSET_ID = '__background';

/**
 * Marks the page as unrenderable and names the reason.
 *
 * Deliberately does *not* set `renderReady`: a render that cannot draw the artwork has to
 * fail loudly rather than ship a card with a blank background.
 */
export function markRenderError(reason: string) {
  document.documentElement.dataset.renderError = reason;
}
