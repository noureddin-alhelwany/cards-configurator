import { useEffect, useState } from 'react';
import DesignRenderer from '../design/DesignRenderer';
import type { ProofFixture } from '../design/types';
import './OrderProductionPage.css';
import StateMessage from '../ui/StateMessage';
import { uiText } from '../ui/text';

async function loadOrderFixture(orderId: string): Promise<ProofFixture> {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/fixture`);
  if (!response.ok) {
    throw new Error(`Failed to load order fixture: ${response.status}`);
  }
  return (await response.json()) as ProofFixture;
}

function expectedAssetCount(fixture: ProofFixture) {
  const imageAssets = fixture.template.elements
    .filter((element) => element.kind === 'image' && fixture.assets[element.asset_key])
    .length;
  const qrAssets = fixture.assets.qr ? 1 : 0;
  return imageAssets + qrAssets;
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
    <main className="order-render-shell">
      <DesignRenderer
        fixture={fixture}
        onAssetReady={() => {
          setAssetLoads((count) => count + 1);
        }}
      />
    </main>
  );
}
