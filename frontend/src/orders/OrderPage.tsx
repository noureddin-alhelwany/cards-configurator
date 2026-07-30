import { useEffect, useMemo, useState } from 'react';
import type { OrderDetail } from './types';
import './OrderPage.css';
import StateMessage from '../ui/StateMessage';
import { snapshotString } from '../ui/viewHelpers';
import {
  OrderActionLinks,
  OrderNextStepSection,
  OrderPreviewSection,
  OrderSummaryGrid,
} from './orderUi';

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
            <OrderSummaryGrid
              productName={productName}
              useCaseName={useCaseName}
              createdAt={order.created_at}
              displayName={displayName}
            />
          </div>
          <OrderActionLinks productionHref={productionHref} pdfHref={pdfHref} pdfAvailable={Boolean(order.pdf_path)} reopenHref={reopenHref} />
        </header>

        <div className="order-layout">
          <OrderPreviewSection
            orderNumber={order.order_number}
            previewSrc={previewSrc}
            previewPath={order.preview_path}
            previewReady={previewReady}
            previewError={previewError}
            onPreviewLoad={() => setPreviewReady(true)}
            onPreviewError={() => setPreviewError(true)}
          />

          <OrderNextStepSection
            productionHref={productionHref}
            pdfHref={pdfHref}
            pdfAvailable={Boolean(order.pdf_path)}
            createdAt={order.created_at}
            approvedAt={order.approved_at}
            previewReady={previewReady}
          />
        </div>
      </section>
    </main>
  );
}
