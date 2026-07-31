import { useEffect, useState } from 'react';
import DesignRenderer from '../design/DesignRenderer';
import type { ProofFixture } from '../design/types';
import { expectedAssetCount } from '../design/renderReadiness';
import { brandingFallbackDataUrl, businessNameFromLayout, logoAssetKeys } from '../design/branding';
import './OrderProductionPage.css';
import StateMessage from '../ui/StateMessage';
import { uiText } from '../ui/text';

/**
 * Fills in the typographic branding stand-in for logo slots without an uploaded asset.
 *
 * The live preview does the same, so an approved proof prints exactly as reviewed —
 * and the logo box never renders as a broken image.
 */
function withBrandingFallback(fixture: ProofFixture): ProofFixture {
  const missing = logoAssetKeys(fixture.template).filter((assetKey) => !fixture.assets[assetKey]);
  if (missing.length === 0) {
    return fixture;
  }
  const businessName = businessNameFromLayout(fixture.template, fixture.layout_state);
  const assets = { ...fixture.assets };
  missing.forEach((assetKey) => {
    assets[assetKey] = { mime_type: 'image/svg+xml', data_url: brandingFallbackDataUrl(businessName) };
  });
  return { ...fixture, assets };
}

async function loadOrderFixture(orderId: string): Promise<ProofFixture> {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/fixture`);
  if (!response.ok) {
    throw new Error(`Failed to load order fixture: ${response.status}`);
  }
  return withBrandingFallback((await response.json()) as ProofFixture);
}

export default function OrderProductionPage({ orderId }: { orderId: string }) {
  const [fixture, setFixture] = useState<ProofFixture | null>(null);
  const [assetLoads, setAssetLoads] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    document.documentElement.dataset.renderReady = 'false';

    loadOrderFixture(orderId)
      .then((data) => {
        if (active) {
          setFixture(data);
        }
      })
      .catch(() => {
        if (active) {
          setError(uiText.errors.orderFixtureLoad);
        }
      });

    return () => {
      active = false;
      delete document.documentElement.dataset.renderReady;
    };
  }, [orderId]);

  useEffect(() => {
    let active = true;
    const fontsReadyPromise = document.fonts?.ready ?? Promise.resolve();
    fontsReadyPromise.then(() => {
      if (active) {
        setFontsReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (fixture && fontsReady && assetLoads >= expectedAssetCount(fixture)) {
      document.documentElement.dataset.renderReady = 'true';
    }
  }, [assetLoads, fixture, fontsReady]);

  if (error) {
    return (
      <main className="order-render-shell order-render-shell--error">
        <StateMessage tone="error" kicker={uiText.order.error.kicker} title="Produktion nicht verfügbar" description={error} />
      </main>
    );
  }

  if (!fixture) {
    return (
      <main className="order-render-shell">
        <StateMessage
          tone="loading"
          kicker={uiText.common.loading}
          title="DesignRenderer"
          description="Die Produktionsdaten werden geladen."
        />
      </main>
    );
  }

  return (
    <main className="order-render-shell order-render-shell--production">
      <DesignRenderer
        fixture={fixture}
        variant="production"
        onAssetReady={() => {
          setAssetLoads((count) => count + 1);
        }}
      />
    </main>
  );
}
