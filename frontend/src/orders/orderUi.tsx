import StateMessage from '../ui/StateMessage';
import { formatLocalizedDate } from '../ui/viewHelpers';

type OrderActionLinksProps = {
  productionHref: string;
  pdfHref: string;
  pdfAvailable: boolean;
  reopenHref: string;
};

export function OrderActionLinks({ productionHref, pdfHref, pdfAvailable, reopenHref }: OrderActionLinksProps) {
  return (
    <div className="order-header__actions">
      <a className="order-download" href={productionHref}>
        Zur Produktionsansicht
      </a>
      {pdfAvailable ? (
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
  );
}

type OrderSummaryGridProps = {
  productName: string;
  useCaseName: string;
  createdAt: string;
  displayName: string;
};

export function OrderSummaryGrid({ productName, useCaseName, createdAt, displayName }: OrderSummaryGridProps) {
  return (
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
        <dd>{formatLocalizedDate(createdAt)}</dd>
      </div>
      <div>
        <dt>Name</dt>
        <dd>{displayName}</dd>
      </div>
    </dl>
  );
}

type OrderPreviewProps = {
  orderNumber: string;
  previewSrc: string;
  previewPath: string | null;
  previewReady: boolean;
  previewError: boolean;
  onPreviewLoad: () => void;
  onPreviewError: () => void;
};

export function OrderPreviewSection({
  orderNumber,
  previewSrc,
  previewPath,
  previewReady,
  previewError,
  onPreviewLoad,
  onPreviewError,
}: OrderPreviewProps) {
  return (
    <section className="order-preview">
      <p className="order-section-title">Vorschau</p>
      {previewPath ? (
        previewError ? (
          <StateMessage
            tone="empty"
            kicker="Vorschau"
            title="Vorschau konnte nicht geladen werden"
            description="Die Produktion ist trotzdem gespeichert. Öffne die Produktionsansicht, um weiterzuarbeiten."
          />
        ) : (
          <img src={previewSrc} alt={`Vorschau für ${orderNumber}`} onLoad={onPreviewLoad} onError={onPreviewError} />
        )
      ) : (
        <StateMessage
          tone="empty"
          kicker="Vorschau"
          title="Keine Vorschau verfügbar"
          description="Die Auftragsdaten sind gespeichert. Öffne die Produktionsansicht, um weiterzuarbeiten."
        />
      )}
      <p className="order-preview__status">{previewReady ? 'Vorschau geladen' : 'Vorschau wird geladen'}</p>
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
        {pdfAvailable ? (
          <a className="order-download" href={pdfHref}>
            PDF herunterladen
          </a>
        ) : null}
      </div>
      <dl className="order-snapshot__grid">
        <div>
          <dt>Erstellt</dt>
          <dd>{formatLocalizedDate(createdAt)}</dd>
        </div>
        <div>
          <dt>Freigabe</dt>
          <dd>{formatLocalizedDate(approvedAt)}</dd>
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
  );
}
