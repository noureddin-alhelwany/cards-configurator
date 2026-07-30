import { useEffect, useMemo, useState } from 'react';
import type { OrderDetail } from './types';
import './OrderPage.css';

async function loadOrder(orderId: string): Promise<OrderDetail> {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
  if (!response.ok) {
    throw new Error(`Failed to load order: ${response.status}`);
  }
  return (await response.json()) as OrderDetail;
}

export default function OrderPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(() => {
    let active = true;
    document.documentElement.dataset.renderReady = 'false';

    loadOrder(orderId)
      .then((data) => {
        if (active) {
          setOrder(data);
        }
      })
      .catch((exception: unknown) => {
        if (active) {
          setError(exception instanceof Error ? exception.message : 'Unknown order error');
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
    if (order && fontsReady && previewReady) {
      document.documentElement.dataset.renderReady = 'true';
    }
  }, [fontsReady, order, previewReady]);

  const previewSrc = useMemo(() => `/api/orders/${encodeURIComponent(orderId)}/preview`, [orderId]);

  if (error) {
    return (
      <main className="order-shell order-shell--error">
        <section className="order-card">
          <p className="order-kicker">Auftrag</p>
          <h1>Order preview unavailable</h1>
          <p className="order-error">{error}</p>
        </section>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="order-shell">
        <section className="order-card">
          <p className="order-kicker">Auftrag wird geladen</p>
          <h1>Order preview</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="order-shell">
      <section className="order-card order-card--stacked">
        <header className="order-header">
          <div>
            <p className="order-kicker">Auftrag erstellt</p>
            <h1>{order.order_number}</h1>
            <p className="order-summary">
              {order.use_case_id} · {order.product_id} · {order.template_id}@{order.template_version}
            </p>
          </div>
          <dl className="order-meta">
            <div>
              <dt>Status</dt>
              <dd>Freigegeben</dd>
            </div>
            <div>
              <dt>Erstellt</dt>
              <dd>{new Date(order.created_at).toLocaleString('de-DE')}</dd>
            </div>
            <div>
              <dt>Freigabe</dt>
              <dd>{new Date(order.approved_at).toLocaleString('de-DE')}</dd>
            </div>
            <div>
              <dt>Assets</dt>
              <dd>{order.assets.length}</dd>
            </div>
          </dl>
        </header>

        <div className="order-layout">
          <section className="order-preview">
            <p className="order-section-title">Auftragsvorschau</p>
            <img
              src={previewSrc}
              alt={`Auftragsvorschau ${order.order_number}`}
              onLoad={() => setPreviewReady(true)}
            />
          </section>

          <section className="order-snapshot">
            <p className="order-section-title">Snapshot</p>
            <div className="order-snapshot__grid">
              <div>
                <dt>Produkt</dt>
                <dd>{order.product_id}</dd>
              </div>
              <div>
                <dt>Template</dt>
                <dd>
                  {order.template_id}@{order.template_version}
                </dd>
              </div>
              <div>
                <dt>Varianten-ID</dt>
                <dd>{order.variant_id ?? '—'}</dd>
              </div>
              <div>
                <dt>Render Engine</dt>
                <dd>{order.render_engine_version}</dd>
              </div>
            </div>
            <details className="order-snapshot__details">
              <summary>Gespeicherte Daten</summary>
              <pre>{JSON.stringify(order.validation_snapshot, null, 2)}</pre>
            </details>
          </section>
        </div>
      </section>
    </main>
  );
}
