import { useEffect, useState } from 'react';
import DesignRenderer from '../design/DesignRenderer';
import type { ProofFixture } from '../design/types';
import { expectedAssetCount } from '../design/renderReadiness';
import './ProofPage.css';
import { uiText } from '../ui/text';

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
      .catch(() => {
        if (active) {
          setError(uiText.errors.proofLoad);
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
    if (fixture && fontsReady && assetLoads >= expectedAssetCount(fixture)) {
      document.documentElement.dataset.renderReady = 'true';
    }
  }, [assetLoads, fixture, fontsReady]);

  if (error) {
    return (
      <main className="proof-shell proof-shell--error">
        <section className="proof-card">
          <h1>{uiText.proof.error.title}</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!fixture) {
    return (
      <main className="proof-shell">
        <section className="proof-card">
          <p className="proof-kicker">{uiText.proof.loading.kicker}</p>
          <h1>{uiText.proof.loading.title}</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="proof-shell">
      <section className="proof-card proof-card--stacked">
        <header className="proof-header">
          <p className="proof-kicker">{uiText.proof.header.kicker}</p>
          <h1>{uiText.proof.header.title}</h1>
          <p className="proof-summary">
            {fixture.use_case.name} · {fixture.product.name} · {fixture.template.name ?? uiText.common.templateFallback}
          </p>
        </header>
        <DesignRenderer
          fixture={fixture}
          variant="production"
          onAssetReady={() => {
            setAssetLoads((count) => count + 1);
          }}
        />
      </section>
    </main>
  );
}
