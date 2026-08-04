import { useEffect, useState } from 'react';
import type { OrderAssetState } from './types';
import StateMessage from '../ui/StateMessage';
import { formatLocalizedDate } from '../ui/viewHelpers';
import { uiText } from '../ui/text';

type OrderActionLinksProps = {
  productionHref: string;
  pdfHref: string;
  pdfAvailable: boolean;
  mockupHref: string;
  mockupAvailable: boolean;
  reopenHref: string;
};

type OrderPreviewPanelProps = {
  title: string;
  src: string;
  alt: string;
  hasSource: boolean;
  error: boolean;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorDescription: string;
  onLoad: () => void;
  onError: () => void;
};

function OrderPreviewPanel({
  title,
  src,
  alt,
  hasSource,
  error,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorDescription,
  onLoad,
  onError,
}: OrderPreviewPanelProps) {
  return (
    <figure className="order-preview__panel">
      <figcaption>{title}</figcaption>
      {!hasSource ? (
        <StateMessage tone="empty" kicker={title} title={emptyTitle} description={emptyDescription} />
      ) : error ? (
        <StateMessage tone="empty" kicker={title} title={errorTitle} description={errorDescription} />
      ) : (
        <img src={src} alt={alt} onLoad={onLoad} onError={onError} />
      )}
    </figure>
  );
}

type OrderKeyValueGridProps = {
  className?: string;
  items: Array<{
    label: string;
    value: string;
  }>;
};

function OrderKeyValueGrid({ className = 'order-snapshot__grid', items }: OrderKeyValueGridProps) {
  return (
    <dl className={className}>
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function OrderActionLinks({ productionHref, pdfHref, pdfAvailable, mockupHref, mockupAvailable, reopenHref }: OrderActionLinksProps) {
  return (
    <div className="order-header__actions">
      <a className="order-download" href={productionHref}>
        {uiText.order.actions.production}
      </a>
      {mockupAvailable ? (
        <a className="order-download" href={mockupHref}>
          {uiText.order.actions.mockupOpen}
        </a>
      ) : (
        <p className="order-download order-download--disabled">{uiText.order.created.mockupLoading}</p>
      )}
      {pdfAvailable ? (
        <a className="order-download" href={pdfHref}>
          {uiText.order.actions.downloadPdf}
        </a>
      ) : (
        <p className="order-download order-download--disabled">{uiText.order.actions.pdfLoading}</p>
      )}
      <a className="order-reopen" href={reopenHref}>
        {uiText.order.actions.reopen}
      </a>
    </div>
  );
}

type OrderPreviewProps = {
  orderNumber: string;
  previewSrc: string;
  previewPath: string | null;
  mockupSrc: string;
  mockupPath: string | null;
  previewReady: boolean;
  mockupReady: boolean;
  previewError: boolean;
  mockupError: boolean;
  onPreviewLoad: () => void;
  onPreviewError: () => void;
  onMockupLoad: () => void;
  onMockupError: () => void;
};

export function OrderPreviewSection({
  orderNumber,
  previewSrc,
  previewPath,
  mockupSrc,
  mockupPath,
  previewReady,
  mockupReady,
  previewError,
  mockupError,
  onPreviewLoad,
  onPreviewError,
  onMockupLoad,
  onMockupError,
}: OrderPreviewProps) {
  return (
    <section className="order-preview">
      <p className="order-section-title">{uiText.order.created.previewTitle}</p>
      <div className="order-preview__gallery">
        <OrderPreviewPanel
          title={uiText.order.created.previewTitle}
          src={previewSrc}
          alt={`Vorschau für ${orderNumber}`}
          hasSource={Boolean(previewPath)}
          error={!previewPath ? false : previewError}
          emptyTitle={uiText.order.created.previewEmptyTitle}
          emptyDescription={uiText.order.created.previewEmptyDescription}
          errorTitle={uiText.order.created.previewErrorTitle}
          errorDescription={uiText.order.created.previewErrorDescription}
          onLoad={onPreviewLoad}
          onError={onPreviewError}
        />
        <OrderPreviewPanel
          title={uiText.order.created.mockupTitle}
          src={mockupSrc}
          alt={`Mockup für ${orderNumber}`}
          hasSource={Boolean(mockupPath)}
          error={!mockupPath ? false : mockupError}
          emptyTitle={uiText.order.created.mockupEmptyTitle}
          emptyDescription={uiText.order.created.mockupEmptyDescription}
          errorTitle={uiText.order.created.mockupErrorTitle}
          errorDescription={uiText.order.created.mockupErrorDescription}
          onLoad={onMockupLoad}
          onError={onMockupError}
        />
      </div>
      <p className="order-preview__status">
        {previewReady ? uiText.order.created.previewLoaded : uiText.order.created.previewLoading}
        {' · '}
        {mockupReady ? uiText.order.created.mockupLoaded : uiText.order.created.mockupLoading}
      </p>
    </section>
  );
}

function snapshotTextValues(snapshot: Record<string, unknown> | null | undefined) {
  const textValues = snapshot?.text_values;
  if (!textValues || typeof textValues !== 'object') {
    return [] as Array<[string, string]>;
  }
  return Object.entries(textValues).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
}

function snapshotAssetValues(snapshot: Record<string, unknown> | null | undefined) {
  const assetValues = snapshot?.asset_values;
  if (!assetValues || typeof assetValues !== 'object') {
    return [] as Array<[string, string]>;
  }
  return Object.entries(assetValues).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0);
}

export function designNameFromSnapshot(templateSnapshot: Record<string, unknown> | null | undefined, designId: string | null) {
  if (!designId) {
    return '—';
  }
  const designs = templateSnapshot?.designs;
  if (!Array.isArray(designs)) {
    return designId;
  }
  const design = designs.find((entry) => entry && typeof entry === 'object' && 'id' in entry && (entry as { id?: unknown }).id === designId);
  if (!design || typeof design !== 'object' || !('name' in design) || typeof (design as { name?: unknown }).name !== 'string') {
    return designId;
  }
  return (design as { name: string }).name;
}

type OrderSnapshotProps = {
  displayName: string;
  categoryName: string;
  productName: string;
  templateName: string;
  designName: string;
  approvedAt: string;
  renderEngineVersion: string;
  layoutSnapshot: Record<string, unknown>;
  validationSnapshot: Record<string, unknown>;
};

export function OrderSnapshotSection({
  displayName,
  categoryName,
  productName,
  templateName,
  designName,
  approvedAt,
  renderEngineVersion,
  layoutSnapshot,
  validationSnapshot,
}: OrderSnapshotProps) {
  const textValues = snapshotTextValues(layoutSnapshot);
  const assetValues = snapshotAssetValues(layoutSnapshot);
  const validationBlocking = typeof validationSnapshot.blocking === 'boolean' ? validationSnapshot.blocking : null;
  return (
    <section className="order-snapshot order-snapshot--detail">
      <p className="order-section-title">{uiText.order.created.snapshotTitle}</p>
      <h2>{uiText.order.created.snapshotTitle}</h2>
      <p className="order-snapshot__lead">{uiText.order.created.snapshotLead}</p>
      <OrderKeyValueGrid
        items={[
          { label: uiText.order.created.snapshotCustomer, value: displayName },
          { label: uiText.order.created.snapshotCategory, value: categoryName },
          { label: uiText.order.created.snapshotProduct, value: productName },
          { label: uiText.order.created.snapshotTemplate, value: templateName },
          { label: uiText.order.created.snapshotDesign, value: designName },
          { label: uiText.order.created.snapshotApprovedAt, value: formatLocalizedDate(approvedAt) },
          { label: uiText.order.created.snapshotRenderEngine, value: renderEngineVersion },
          {
            label: uiText.order.created.snapshotValidation,
            value: validationBlocking === null ? '—' : validationBlocking ? 'Blockierend' : 'Ohne Blocker',
          },
        ]}
      />
      <div className="order-snapshot__details">
        <article className="order-snapshot__detail-card">
          <p className="order-section-subtitle">{uiText.order.created.snapshotTextValues}</p>
          {textValues.length > 0 ? (
            <OrderKeyValueGrid
              className="order-snapshot__list"
              items={textValues.map(([key, value]) => ({ label: key, value }))}
            />
          ) : (
            <p className="order-snapshot__empty">—</p>
          )}
        </article>
        <article className="order-snapshot__detail-card">
          <p className="order-section-subtitle">{uiText.order.created.snapshotAssetValues}</p>
          {assetValues.length > 0 ? (
            <OrderKeyValueGrid
              className="order-snapshot__list"
              items={assetValues.map(([key, value]) => ({ label: key, value }))}
            />
          ) : (
            <p className="order-snapshot__empty">—</p>
          )}
        </article>
      </div>
    </section>
  );
}

type OrderNextStepProps = {
  productionHref: string;
  pdfHref: string;
  pdfAvailable: boolean;
  createdAt: string;
  approvedAt: string;
  previewReady: boolean;
};

export function OrderNextStepSection({
  productionHref,
  pdfHref,
  pdfAvailable,
  createdAt,
  approvedAt,
  previewReady,
}: OrderNextStepProps) {
  return (
    <section className="order-snapshot">
      <p className="order-section-title">{uiText.order.created.nextStepTitle}</p>
      <h2>{uiText.order.created.nextStepTitle}</h2>
      <p className="order-snapshot__lead">{uiText.order.created.nextStepLead}</p>
      <div className="order-snapshot__actions">
        <a className="order-download" href={productionHref}>
          {uiText.order.actions.productionOpen}
        </a>
        {pdfAvailable ? (
          <a className="order-download" href={pdfHref}>
            {uiText.order.actions.pdfDownload}
          </a>
        ) : null}
      </div>
      <OrderKeyValueGrid
        items={[
          { label: 'Erstellt', value: formatLocalizedDate(createdAt) },
          { label: 'Freigabe', value: formatLocalizedDate(approvedAt) },
          { label: 'Vorschau', value: previewReady ? uiText.order.created.previewLoaded : uiText.common.loading },
          { label: 'Status', value: uiText.order.created.nextStepStatus },
        ]}
      />
    </section>
  );
}

type OrderAssetsSectionProps = {
  assets: OrderAssetState[];
};

type AssetMetadata = {
  id: string;
  kind: string;
  original_filename: string;
  mime_type: string;
  preview_data_url: string;
};

export function OrderAssetsSection({ assets }: OrderAssetsSectionProps) {
  const [metadataById, setMetadataById] = useState<Record<string, AssetMetadata>>({});

  useEffect(() => {
    let active = true;
    if (assets.length === 0) {
      setMetadataById({});
      return () => {
        active = false;
      };
    }

    Promise.all(
      assets.map(async (asset) => {
        const response = await fetch(`/api/assets/${encodeURIComponent(asset.asset_id)}`);
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as AssetMetadata;
      }),
    )
      .then((entries) => {
        if (!active) {
          return;
        }
        setMetadataById(
          Object.fromEntries(entries.filter((entry): entry is AssetMetadata => entry !== null).map((asset) => [asset.id, asset] as const)),
        );
      })
      .catch(() => {
        if (active) {
          setMetadataById({});
        }
      });

    return () => {
      active = false;
    };
  }, [assets]);

  return (
    <section className="order-assets">
      <p className="order-section-title">{uiText.order.created.assetsTitle}</p>
      {assets.length === 0 ? (
        <p className="order-assets__empty">{uiText.order.created.assetsEmpty}</p>
      ) : (
        <div className="order-assets__grid">
          {assets.map((asset) => {
            const metadata = metadataById[asset.asset_id] ?? null;
            return (
              <article key={asset.asset_id} className="order-asset-card">
                {metadata ? <img src={metadata.preview_data_url} alt={metadata.original_filename} /> : <div className="order-asset-card__placeholder">Lädt…</div>}
                <div className="order-asset-card__body">
                  <p className="order-asset-card__role">{asset.semantic_role}</p>
                  <h3>{metadata?.original_filename ?? asset.asset_id}</h3>
                  <p>{metadata ? `${metadata.kind} · ${metadata.mime_type}` : asset.asset_id}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function designLabelFromTemplateSnapshot(templateSnapshot: Record<string, unknown> | null | undefined, designId: string | null) {
  return designNameFromSnapshot(templateSnapshot, designId);
}
