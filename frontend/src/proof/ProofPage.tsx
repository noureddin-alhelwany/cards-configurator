import { useEffect, useState } from 'react';
import DesignRenderer from '../design/DesignRenderer';
import type { ProofFixture } from '../design/types';
import './ProofPage.css';

const EXPECTED_ASSETS = 2;

async function loadProofFixture(): Promise<ProofFixture> {
  const response = await fetch('/api/render/proof-fixture');
  if (!response.ok) {
    throw new Error(`Failed to load proof fixture: ${response.status}`);
  }
  return (await response.json()) as ProofFixture;
}

export default function ProofPage() {
  const [fixture, setFixture] = useState<ProofFixture | null>(null);
  const [assetLoads, setAssetLoads] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    document.documentElement.dataset.renderReady = 'false';

    loadProofFixture()
      .then((data) => {
        if (active) {
          setFixture(data);
        }
      })
      .catch((exception: unknown) => {
        if (active) {
          setError(exception instanceof Error ? exception.message : 'Unknown proof fixture error');
        }
      });

    return () => {
      active = false;
      delete document.documentElement.dataset.renderReady;
    };
  }, []);

  useEffect(() => {
    let active = true;
    document.fonts.ready.then(() => {
      if (active) {
        setFontsReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (fixture && fontsReady && assetLoads >= EXPECTED_ASSETS) {
      document.documentElement.dataset.renderReady = 'true';
    }
  }, [assetLoads, fixture, fontsReady]);

  if (error) {
    return (
      <main className="proof-shell proof-shell--error">
        <section className="proof-card">
          <h1>Proof render unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!fixture) {
    return (
      <main className="proof-shell">
        <section className="proof-card">
          <p className="proof-kicker">Loading proof fixture</p>
          <h1>DesignRenderer</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="proof-shell">
      <section className="proof-card proof-card--stacked">
        <header className="proof-header">
          <p className="proof-kicker">Renderer proof</p>
          <h1>DesignRenderer</h1>
          <p className="proof-summary">
            {fixture.use_case.name} · {fixture.product.name} · {fixture.template.id}@{fixture.template.version}
          </p>
        </header>
        <DesignRenderer
          fixture={fixture}
          onAssetReady={() => {
            setAssetLoads((count) => count + 1);
          }}
        />
      </section>
    </main>
  );
}
