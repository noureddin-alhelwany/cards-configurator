import { useEffect, useMemo, useState } from 'react';
import StateMessage from '../ui/StateMessage';
import './InternalDataPage.css';

type RegistryKind = 'category' | 'product' | 'template';

type RegistryFileSummary = {
  kind: RegistryKind;
  path: string;
  id: string;
  title: string;
  version: string | null;
  active: boolean | null;
  order_count: number;
  asset_count: number;
  error: string | null;
};

type RegistryFileContent = {
  kind: RegistryKind;
  path: string;
  content: string;
};

type AdminAssetSummary = {
  asset_id: string;
  kind: string | null;
  original_filename: string | null;
  mime_type: string | null;
  sha256: string | null;
  preview_path: string | null;
  render_path: string | null;
  original_path: string | null;
  order_count: number;
};

type AdminDataResponse = {
  registries: RegistryFileSummary[];
  categories: Array<{ id: string; name: string; active: boolean }>;
  products: Array<{ id: string; name: string; active: boolean }>;
  templates: Array<{ id: string; name: string | null; version: string; active: boolean }>;
  orders: Array<{
    id: string;
    order_number: string;
    display_name: string | null;
    template_id: string;
    template_version: string;
    created_at: string;
    approved_at: string;
  }>;
  assets: AdminAssetSummary[];
  draft: Record<string, unknown>;
  diagnostics: Array<{ code: string; message: string; path: string; blocking: boolean }>;
};

const KIND_LABELS: Record<RegistryKind, string> = {
  category: 'Kategorien',
  product: 'Produkte',
  template: 'Designs',
};

function registryFileUrl(kind: RegistryKind, path: string) {
  return `/api/admin/registries/${kind}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

function registryFileDeleteUrl(kind: RegistryKind, path: string) {
  return registryFileUrl(kind, path);
}

function orderLabel(order: AdminDataResponse['orders'][number]) {
  return `${order.order_number} · ${order.display_name ?? order.template_id}`;
}

function assetLabel(asset: AdminAssetSummary) {
  return asset.original_filename ?? asset.asset_id;
}

export default function InternalDataPage() {
  const [data, setData] = useState<AdminDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<RegistryKind>('template');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState('');
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingRegistry, setDeletingRegistry] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  const currentRegistries = useMemo(
    () => data?.registries.filter((registry) => registry.kind === selectedKind) ?? [],
    [data, selectedKind],
  );

  const selectedRegistry = useMemo(
    () => currentRegistries.find((registry) => registry.path === selectedPath) ?? null,
    [currentRegistries, selectedPath],
  );

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/data');
      if (!response.ok) {
        throw new Error(`Failed to load admin data: ${response.status}`);
      }
      const next = (await response.json()) as AdminDataResponse;
      setData(next);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Die Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }
    if (currentRegistries.length === 0) {
      setSelectedPath(null);
      setEditorValue('');
      return;
    }
    if (!selectedPath || !currentRegistries.some((registry) => registry.path === selectedPath)) {
      setSelectedPath(currentRegistries[0].path);
    }
  }, [currentRegistries, data, selectedPath]);

  useEffect(() => {
    if (!selectedRegistry) {
      setEditorValue('');
      return;
    }
    let active = true;
    setEditorLoading(true);
    setEditorError(null);
    fetch(registryFileUrl(selectedRegistry.kind, selectedRegistry.path))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load registry file: ${response.status}`);
        }
        return (await response.json()) as RegistryFileContent;
      })
      .then((file) => {
        if (active) {
          setEditorValue(file.content);
        }
      })
      .catch((nextError) => {
        if (active) {
          setEditorError(nextError instanceof Error ? nextError.message : 'Die Registry-Datei konnte nicht geladen werden.');
        }
      })
      .finally(() => {
        if (active) {
          setEditorLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectedRegistry]);

  async function handleSaveRegistry() {
    if (!selectedRegistry) {
      return;
    }
    setSaving(true);
    setEditorError(null);
    setActionMessage(null);
    try {
      const response = await fetch(registryFileUrl(selectedRegistry.kind, selectedRegistry.path), {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ content: editorValue }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail ?? `Registry konnte nicht gespeichert werden (${response.status})`);
      }
      const file = (await response.json()) as RegistryFileContent;
      setEditorValue(file.content);
      setActionMessage('Registry gespeichert.');
      await loadData();
    } catch (nextError) {
      setEditorError(nextError instanceof Error ? nextError.message : 'Die Registry-Datei konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRegistry() {
    if (!selectedRegistry || !window.confirm(`Registry wirklich löschen?\n\n${selectedRegistry.path}`)) {
      return;
    }
    setDeletingRegistry(true);
    setEditorError(null);
    setActionMessage(null);
    try {
      const response = await fetch(registryFileDeleteUrl(selectedRegistry.kind, selectedRegistry.path), {
        method: 'DELETE',
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail ?? `Registry konnte nicht gelöscht werden (${response.status})`);
      }
      setActionMessage('Registry gelöscht.');
      await loadData();
    } catch (nextError) {
      setEditorError(nextError instanceof Error ? nextError.message : 'Die Registry-Datei konnte nicht gelöscht werden.');
    } finally {
      setDeletingRegistry(false);
    }
  }

  async function handleDeleteOrder(orderId: string) {
    if (!window.confirm(`Bestellung wirklich löschen?\n\n${orderId}`)) {
      return;
    }
    setDeletingOrderId(orderId);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail ?? `Bestellung konnte nicht gelöscht werden (${response.status})`);
      }
      setActionMessage('Bestellung gelöscht.');
      await loadData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Die Bestellung konnte nicht gelöscht werden.');
    } finally {
      setDeletingOrderId(null);
    }
  }

  async function handleDeleteAsset(assetId: string) {
    if (!window.confirm(`Asset wirklich löschen?\n\n${assetId}`)) {
      return;
    }
    setDeletingAssetId(assetId);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/admin/assets/${encodeURIComponent(assetId)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail ?? `Asset konnte nicht gelöscht werden (${response.status})`);
      }
      setActionMessage('Asset gelöscht.');
      await loadData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Das Asset konnte nicht gelöscht werden.');
    } finally {
      setDeletingAssetId(null);
    }
  }

  if (loading && !data) {
    return (
      <main className="internal-data-shell internal-data-shell--loading">
        <StateMessage
          tone="loading"
          kicker="Interne Daten"
          title="Datenverwaltung"
          description="Templates, Designs, Bestellungen und Assets werden geladen."
        />
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="internal-data-shell internal-data-shell--error">
        <StateMessage
          tone="error"
          kicker="Interne Daten"
          title="Datenverwaltung konnte nicht geladen werden"
          description={error}
        />
      </main>
    );
  }

  return (
    <main className="internal-data-shell">
      <section className="internal-data-card internal-data-card--hero">
        <div className="internal-data-hero">
          <div>
            <p className="internal-data-kicker">Interne Daten</p>
            <h1>Datenverwaltung</h1>
            <p className="internal-data-lead">
              Separate URL für registrierte Templates, Designs, Bestellungen, Assets und den aktuellen Entwurf.
            </p>
          </div>
          <div className="internal-data-actions">
            <button type="button" className="internal-data-button" onClick={loadData} disabled={loading}>
              {loading ? 'Lädt...' : 'Neu laden'}
            </button>
          </div>
        </div>
        {actionMessage ? <p className="internal-data-status">{actionMessage}</p> : null}
        {error ? <p className="internal-data-error">{error}</p> : null}
      </section>

      <section className="internal-data-grid">
        <aside className="internal-data-card internal-data-card--sidebar">
          <div className="internal-data-tabs" role="tablist" aria-label="Datenarten">
            {(Object.keys(KIND_LABELS) as RegistryKind[]).map((kind) => (
              <button
                key={kind}
                type="button"
                className={`internal-data-tab${kind === selectedKind ? ' internal-data-tab--active' : ''}`}
                onClick={() => setSelectedKind(kind)}
              >
                {KIND_LABELS[kind]}
              </button>
            ))}
          </div>

          <div className="internal-data-list">
            {currentRegistries.length === 0 ? (
              <p className="internal-data-muted">Keine Einträge vorhanden.</p>
            ) : (
              currentRegistries.map((registry) => (
                <button
                  key={`${registry.kind}:${registry.path}`}
                  type="button"
                  className={`internal-data-list-item${
                    registry.path === selectedPath ? ' internal-data-list-item--selected' : ''
                  }`}
                  onClick={() => setSelectedPath(registry.path)}
                >
                  <span className="internal-data-list-item__title">{registry.title}</span>
                  <span className="internal-data-list-item__meta">
                    {registry.path}
                    {registry.version ? ` · ${registry.version}` : ''}
                  </span>
                  <span className="internal-data-list-item__meta">
                    {registry.active === false ? 'inaktiv' : 'aktiv'}
                    {registry.order_count > 0 ? ` · ${registry.order_count} Aufträge` : ''}
                    {registry.error ? ' · fehlerhaft' : ''}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="internal-data-card internal-data-card--editor">
          <div className="internal-data-section-header">
            <div>
              <p className="internal-data-kicker">Registry</p>
              <h2>{selectedRegistry?.title ?? 'Keine Auswahl'}</h2>
              <p className="internal-data-muted">{selectedRegistry?.path ?? 'Wähle links einen Eintrag.'}</p>
            </div>
            <div className="internal-data-inline-actions">
              <button
                type="button"
                className="internal-data-button internal-data-button--secondary"
                onClick={handleDeleteRegistry}
                disabled={!selectedRegistry || deletingRegistry}
              >
                {deletingRegistry ? 'Löscht...' : 'Löschen'}
              </button>
              <button
                type="button"
                className="internal-data-button"
                onClick={handleSaveRegistry}
                disabled={!selectedRegistry || saving || editorLoading}
              >
                {saving ? 'Speichert...' : 'Speichern'}
              </button>
            </div>
          </div>

          {selectedRegistry?.error ? <p className="internal-data-error">{selectedRegistry.error}</p> : null}
          {editorError ? <p className="internal-data-error">{editorError}</p> : null}

          <textarea
            className="internal-data-editor"
            aria-label="Registry JSON"
            value={editorValue}
            onChange={(event) => setEditorValue(event.target.value)}
            spellCheck={false}
            disabled={!selectedRegistry || editorLoading}
          />
        </section>
      </section>

      <section className="internal-data-card internal-data-card--section">
        <div className="internal-data-section-header">
          <div>
            <p className="internal-data-kicker">Bestellungen</p>
            <h2>Alle Aufträge</h2>
          </div>
        </div>
        <div className="internal-data-table">
          {data?.orders.length ? (
            data.orders.map((order) => (
              <div key={order.id} className="internal-data-row">
                <div>
                  <strong>{orderLabel(order)}</strong>
                  <div className="internal-data-muted">
                    {order.template_id} · {order.template_version}
                  </div>
                </div>
                <div className="internal-data-row__actions">
                  <a className="internal-data-link" href={`/render/orders/${order.id}`}>
                    Öffnen
                  </a>
                  <button
                    type="button"
                    className="internal-data-button internal-data-button--secondary"
                    onClick={() => void handleDeleteOrder(order.id)}
                    disabled={deletingOrderId === order.id}
                  >
                    {deletingOrderId === order.id ? 'Löscht...' : 'Löschen'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="internal-data-muted">Keine Bestellungen vorhanden.</p>
          )}
        </div>
      </section>

      <section className="internal-data-card internal-data-card--section">
        <div className="internal-data-section-header">
          <div>
            <p className="internal-data-kicker">Assets</p>
            <h2>Alle Assets</h2>
          </div>
        </div>
        <div className="internal-data-table">
          {data?.assets.length ? (
            data.assets.map((asset) => (
              <div key={asset.asset_id} className="internal-data-row">
                <div>
                  <strong>{assetLabel(asset)}</strong>
                  <div className="internal-data-muted">
                    {asset.asset_id}
                    {asset.kind ? ` · ${asset.kind}` : ''}
                    {asset.order_count > 0 ? ` · ${asset.order_count} Aufträge` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  className="internal-data-button internal-data-button--secondary"
                  onClick={() => void handleDeleteAsset(asset.asset_id)}
                  disabled={deletingAssetId === asset.asset_id}
                >
                  {deletingAssetId === asset.asset_id ? 'Löscht...' : 'Löschen'}
                </button>
              </div>
            ))
          ) : (
            <p className="internal-data-muted">Keine Assets vorhanden.</p>
          )}
        </div>
      </section>

      <section className="internal-data-card internal-data-card--section">
        <div className="internal-data-section-header">
          <div>
            <p className="internal-data-kicker">Entwurf</p>
            <h2>Aktueller Draft</h2>
          </div>
        </div>
        <pre className="internal-data-pre">{JSON.stringify(data?.draft ?? {}, null, 2)}</pre>
      </section>

      {data?.diagnostics?.length ? (
        <section className="internal-data-card internal-data-card--section">
          <div className="internal-data-section-header">
            <div>
              <p className="internal-data-kicker">Diagnosen</p>
              <h2>Registry-Hinweise</h2>
            </div>
          </div>
          <div className="internal-data-list internal-data-list--diagnostics">
            {data.diagnostics.map((issue, index) => (
              <div key={`${issue.path}:${issue.code}:${index}`} className="internal-data-diagnostic">
                <strong>{issue.message}</strong>
                <span className="internal-data-muted">
                  {issue.path}
                  {issue.blocking ? ' · blockierend' : ' · Hinweis'}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
