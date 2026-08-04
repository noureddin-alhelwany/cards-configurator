import { useEffect, useMemo, useState } from 'react';
import type { OrderDetail } from './types';
import './OrderPage.css';
import StateMessage from '../ui/StateMessage';
import { snapshotString } from '../ui/viewHelpers';
import { uiText } from '../ui/text';
import {
  OrderActionLinks,
  OrderAssetsSection,
  OrderSnapshotSection,
  OrderNextStepSection,
  OrderPreviewSection,
  variantLabelFromTemplateSnapshot,
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
  const [mockupReady, setMockupReady] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [mockupError, setMockupError] = useState(false);

  useEffect(() => {
    let active = true;
    document.documentElement.dataset.renderReady = 'false';
    setOrder(null);
    setError(null);
    setPreviewReady(false);
    setMockupReady(false);
    setPreviewError(false);
    setMockupError(false);

    loadOrder(orderId)
      .then((data) => {
        if (active) {
          setOrder(data);
        }
      })
      .catch(() => {
        if (active) {
          setError('Der Auftrag konnte nicht geladen werden.');
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
    if (order && fontsReady && previewReady && mockupReady) {
      document.documentElement.dataset.renderReady = 'true';
    }
  }, [fontsReady, mockupReady, order, previewReady]);

  const previewSrc = useMemo(() => `/api/orders/${encodeURIComponent(orderId)}/preview`, [orderId]);
  const mockupSrc = useMemo(() => `/api/orders/${encodeURIComponent(orderId)}/mockup`, [orderId]);
  const categoryName = snapshotString(order?.category_snapshot, 'name') ?? 'Kategorie';
  const productName = snapshotString(order?.product_snapshot, 'name') ?? 'Produkt';
  const templateName = snapshotString(order?.template_snapshot, 'name') ?? 'Design';
  const variantName = variantLabelFromTemplateSnapshot(order?.template_snapshot, order?.variant_id ?? null);
  const displayName = order?.display_name ?? productName;
  const pdfHref = `/api/orders/${encodeURIComponent(orderId)}/pdf`;
  const productionHref = `/render/orders/${orderId}/production`;
  const mockupHref = `/api/orders/${encodeURIComponent(orderId)}/mockup`;
  const reopenHref = `/render/orders/${orderId}`;

  if (error) {
    return (
      <main className="order-shell order-shell--error">
        <StateMessage
          tone="error"
          kicker={uiText.order.error.kicker}
          title={uiText.order.error.title}
          description={error}
        />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="order-shell">
        <StateMessage
          tone="loading"
          kicker={uiText.order.loading.kicker}
          title={uiText.order.loading.title}
          description={uiText.order.loading.description}
        />
      </main>
    );
  }

  return (
    <main className="order-shell">
      <section className="order-card order-card--stacked">
        <header className="order-header">
          <div className="order-header__copy">
            <p className="order-kicker">{uiText.order.created.kicker}</p>
            <h1>{order.order_number}</h1>
            <p className="order-summary">{uiText.order.created.summary}</p>
          </div>
          <OrderActionLinks
            productionHref={productionHref}
            pdfHref={pdfHref}
            pdfAvailable={Boolean(order.pdf_path)}
            mockupHref={mockupHref}
            mockupAvailable={Boolean(order.mockup_path)}
            reopenHref={reopenHref}
          />
        </header>

        <OrderSnapshotSection
          displayName={displayName}
          categoryName={categoryName}
          productName={productName}
          templateName={templateName}
          variantName={variantName}
          approvedAt={order.approved_at}
          renderEngineVersion={order.render_engine_version}
          layoutSnapshot={order.layout_snapshot}
          validationSnapshot={order.validation_snapshot}
        />

        <div className="order-layout">
          <OrderPreviewSection
            orderNumber={order.order_number}
            previewSrc={previewSrc}
            previewPath={order.preview_path}
            mockupSrc={mockupSrc}
            mockupPath={order.mockup_path}
            previewReady={previewReady}
            mockupReady={mockupReady}
            previewError={previewError}
            mockupError={mockupError}
            onPreviewLoad={() => setPreviewReady(true)}
            onPreviewError={() => setPreviewError(true)}
            onMockupLoad={() => setMockupReady(true)}
            onMockupError={() => setMockupError(true)}
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

        <OrderAssetsSection assets={order.assets} />
      </section>
    </main>
  );
}
