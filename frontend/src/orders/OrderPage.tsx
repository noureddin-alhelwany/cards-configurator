import { useEffect, useMemo, useState } from 'react';
import type { OrderDetail } from './types';
import './OrderPage.css';
import StateMessage from '../ui/StateMessage';
import { formatLocalizedDate, snapshotString } from '../ui/viewHelpers';

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
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    let active = true;
    document.documentElement.dataset.renderReady = 'false';
    setOrder(null);
    setError(null);
    setPreviewReady(false);
    setPreviewError(false);

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
  const useCaseName = snapshotString(order?.use_case_snapshot, 'name') ?? 'Use Case';
  const productName = snapshotString(order?.product_snapshot, 'name') ?? 'Produkt';
  const displayName = order?.display_name ?? productName;
  const pdfHref = `/api/orders/${encodeURIComponent(orderId)}/pdf`;
  const productionHref = `/render/orders/${orderId}/production`;
  const reopenHref = `/render/orders/${orderId}`;

  if (error) {
    return (
      <main className="order-shell order-shell--error">
        <StateMessage
          tone="error"
          kicker="Auftrag"
          title="Auftrag konnte nicht geladen werden"
          description={error}
        />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="order-shell">
        <StateMessage tone="loading" kicker="Auftrag wird geladen" title="Erfolgsansicht" description="Die Auftragsdaten werden vorbereitet." />
      </main>
    );
  }

  return (
    <main className="order-shell">
      <section className="order-card order-card--stacked">
        <header className="order-header">
          <div className="order-header__copy">
            <p className="order-kicker">Auftrag erstellt</p>
            <h1>{order.order_number}</h1>
            <p className="order-summary">Dein Auftrag ist gespeichert und bereit für die Produktion.</p>
            <dl className="order-meta order-meta--inline">
              <div>
                <dt>Produkt</dt>
                <dd>{productName}</dd>
              </div>
              <div>
                <dt>Use Case</dt>
                <dd>{useCaseName}</dd>
              </div>
              <div>
                <dt>Datum</dt>
                <dd>{formatLocalizedDate(order.created_at)}</dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>{displayName}</dd>
              </div>
            </dl>
          </div>
          <div className="order-header__actions">
            <a className="order-download" href={productionHref}>
              Zur Produktionsansicht
            </a>
            {order.pdf_path ? (
              <a className="order-download" href={pdfHref}>
                Produktions-PDF herunterladen
              </a>
            ) : (
              <p className="order-download order-download--disabled">Produktions-PDF wird erzeugt</p>
            )}
            <a className="order-reopen" href={reopenHref}>
              Auftrag erneut öffnen
            </a>
          </div>
        </header>

        <div className="order-layout">
          <section className="order-preview">
            <p className="order-section-title">Vorschau</p>
            {order.preview_path ? (
              previewError ? (
                <StateMessage
                  tone="empty"
                  kicker="Vorschau"
                  title="Vorschau konnte nicht geladen werden"
                  description="Die Produktion ist trotzdem gespeichert. Öffne die Produktionsansicht, um weiterzuarbeiten."
                />
              ) : (
                <img
                  src={previewSrc}
                  alt={`Vorschau für ${order.order_number}`}
                  onLoad={() => setPreviewReady(true)}
                  onError={() => setPreviewError(true)}
                />
              )
            ) : (
              <StateMessage
                tone="empty"
                kicker="Vorschau"
                title="Keine Vorschau verfügbar"
                description="Die Auftragsdaten sind gespeichert. Öffne die Produktionsansicht, um weiterzuarbeiten."
              />
            )}
          </section>

          <section className="order-snapshot">
            <p className="order-section-title">Nächster Schritt</p>
            <h2>Produktions-PDF prüfen</h2>
            <p className="order-snapshot__lead">
              In der Produktionsansicht siehst du dieselbe Geometrie wie in der Vorschau. Danach kannst du den Auftrag erneut
              öffnen oder weiter im Workflow arbeiten.
            </p>
            <div className="order-snapshot__actions">
              <a className="order-download" href={productionHref}>
                Produktionsansicht öffnen
              </a>
              {order.pdf_path ? (
                <a className="order-download" href={pdfHref}>
                  PDF herunterladen
                </a>
              ) : null}
            </div>
            <dl className="order-snapshot__grid">
              <div>
                <dt>Erstellt</dt>
                <dd>{formatLocalizedDate(order.created_at)}</dd>
              </div>
              <div>
                <dt>Freigabe</dt>
                <dd>{formatLocalizedDate(order.approved_at)}</dd>
              </div>
              <div>
                <dt>Vorschau</dt>
                <dd>{previewReady ? 'Geladen' : 'Wird geladen'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Bereit für die Produktion</dd>
              </div>
            </dl>
          </section>
        </div>
      </section>
    </main>
  );
}
