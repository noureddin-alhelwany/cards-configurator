import { useEffect, useState } from 'react';
import DesignRenderer from '../design/DesignRenderer';
import type { ProofFixture } from '../design/types';
import './OrderProductionPage.css';

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
      .catch((exception: unknown) => {
        if (active) {
          setError(exception instanceof Error ? exception.message : 'Unknown order fixture error');
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
        <section className="order-render-message">
          <h1>Order render unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!fixture) {
    return (
      <main className="order-render-shell">
        <section className="order-render-message">
          <p className="order-render-kicker">Loading order fixture</p>
          <h1>DesignRenderer</h1>
        </section>
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
