import { useEffect, useMemo, useState } from 'react';
import StateMessage from '../ui/StateMessage';
import { loadRegistries } from '../registries/loadRegistries';
import type { RegistryBundle } from '../registries/types';
import './InternalDataPage.css';

type RegistryKind = 'category' | 'product' | 'template';
type MainSection = 'registries' | 'assets' | 'orders' | 'draft';

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
  draft: Record<string, unknown>;
  diagnostics: Array<{ code: string; message: string; path: string; blocking: boolean }>;
};

type RegistryAssetSummary = {
  asset_id: string;
  label: string;
  kind: 'category' | 'product' | 'template' | 'design';
  role: string;
  url: string;
  source: string;
};

type RegistryAssetGroup = {
  key: 'categories' | 'products' | 'templates';
  title: string;
  description: string;
  emptyText: string;
  assets: RegistryAssetSummary[];
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

function assetUrl(asset: string | null | undefined) {
  return asset ? `/proof-assets/${asset}` : null;
}

function labelForTemplate(templateName: string | null, fallback: string) {
  return templateName ?? fallback;
}

function collectCategoryAssets(bundle: RegistryBundle | null): RegistryAssetSummary[] {
  if (!bundle) {
    return [];
  }

  const assets: RegistryAssetSummary[] = [];
  const seen = new Set<string>();
  const push = (asset: RegistryAssetSummary | null) => {
    if (!asset || seen.has(asset.asset_id)) {
      return;
    }
    seen.add(asset.asset_id);
    assets.push(asset);
  };

  for (const category of bundle.categories.filter((entry) => entry.active)) {
    const url = assetUrl(category.preview_asset);
    if (!url) {
      continue;
    }
    push({
      asset_id: category.preview_asset,
      label: category.name,
      kind: 'category',
      role: 'Vorschau',
      url,
      source: `Kategorie: ${category.name}`,
    });
  }

  return assets;
}

function collectProductAssets(bundle: RegistryBundle | null): RegistryAssetSummary[] {
  if (!bundle) {
    return [];
  }

  const assets: RegistryAssetSummary[] = [];
  const seen = new Set<string>();
  const push = (asset: RegistryAssetSummary | null) => {
    if (!asset || seen.has(asset.asset_id)) {
      return;
    }
    seen.add(asset.asset_id);
    assets.push(asset);
  };

  for (const product of bundle.products.filter((entry) => entry.active)) {
    const url = assetUrl(product.preview_asset);
    if (!url) {
      continue;
    }
    push({
      asset_id: product.preview_asset,
      label: product.name,
      kind: 'product',
      role: 'Vorschau',
      url,
      source: `Produkt: ${product.name}`,
    });
  }

  return assets;
}

function collectTemplateAssets(bundle: RegistryBundle | null): RegistryAssetSummary[] {
  if (!bundle) {
    return [];
  }

  const assets: RegistryAssetSummary[] = [];
  const seen = new Set<string>();
  const push = (asset: RegistryAssetSummary | null) => {
    if (!asset || seen.has(asset.asset_id)) {
      return;
    }
    seen.add(asset.asset_id);
    assets.push(asset);
  };

  for (const template of bundle.templates.filter((entry) => entry.active)) {
    const templateLabel = labelForTemplate(template.name, template.id);
    for (const design of template.designs ?? []) {
      if (!design.active) {
        continue;
      }
      const designLabel = `${templateLabel} · ${design.name}`;
      const designAssets = [
        ['preview', design.preview_asset],
        ['source', design.source_asset ?? design.background_asset],
        ['background', design.background_asset],
      ] as const;
      for (const [role, asset] of designAssets) {
        const url = assetUrl(asset ?? null);
        if (!url || !asset) {
          continue;
        }
        push({
          asset_id: asset,
          label: designLabel,
          kind: role === 'preview' ? 'template' : 'design',
          role: role === 'preview' ? 'Preview' : role === 'source' ? 'Source' : 'Hintergrund',
          url,
          source: `${templateLabel} · ${design.name}`,
        });
      }
    }
  }

  return assets;
}

function collectAssetGroups(bundle: RegistryBundle | null): RegistryAssetGroup[] {
  return [
    {
      key: 'categories',
      title: 'Kategorien',
      description: 'Nur Kategorie-Bilder. Sie werden in der Auswahl und Filterung verwendet.',
      emptyText: 'Keine Kategorie-Assets vorhanden.',
      assets: collectCategoryAssets(bundle),
    },
    {
      key: 'products',
      title: 'Produkte',
      description: 'Nur Produktbilder. Sie werden in der Produktauswahl verwendet.',
      emptyText: 'Keine Produkt-Assets vorhanden.',
      assets: collectProductAssets(bundle),
    },
    {
      key: 'templates',
      title: 'Templates und Designs',
      description: 'Nur die zu Templates gehörenden Preview-, Source- und Hintergrunddateien.',
      emptyText: 'Keine Template- oder Design-Assets vorhanden.',
      assets: collectTemplateAssets(bundle),
    },
  ];
}

export default function InternalDataPage() {
  const [data, setData] = useState<AdminDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<MainSection>('registries');
  const [selectedKind, setSelectedKind] = useState<RegistryKind>('template');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState('');
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingRegistry, setDeletingRegistry] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [registryBundle, setRegistryBundle] = useState<RegistryBundle | null>(null);
  const [registryBundleError, setRegistryBundleError] = useState<string | null>(null);

  const currentRegistries = useMemo(
    () => data?.registries.filter((registry) => registry.kind === selectedKind) ?? [],
    [data, selectedKind],
  );

  const selectedRegistry = useMemo(
    () => currentRegistries.find((registry) => registry.path === selectedPath) ?? null,
    [currentRegistries, selectedPath],
  );
  const assetGroups = useMemo(() => collectAssetGroups(registryBundle), [registryBundle]);
  const dataSummary = useMemo(
    () => ({
      categories: data?.categories.length ?? 0,
      products: data?.products.length ?? 0,
      templates: data?.templates.length ?? 0,
      orders: data?.orders.length ?? 0,
      assets: assetGroups.reduce((sum, group) => sum + group.assets.length, 0),
    }),
    [assetGroups, data],
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
    let active = true;
    loadRegistries()
      .then((bundle) => {
        if (active) {
          setRegistryBundle(bundle);
          setRegistryBundleError(null);
        }
      })
      .catch((nextError) => {
        if (active) {
          setRegistryBundle(null);
          setRegistryBundleError(nextError instanceof Error ? nextError.message : 'Die Registries konnten nicht geladen werden.');
        }
      });
    return () => {
      active = false;
    };
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
            <p className="internal-data-lead">Registrierte Quellen, Bestellungen und Daten-Snapshots an einem Ort.</p>
          </div>
          <div className="internal-data-actions">
            <button type="button" className="internal-data-button" onClick={loadData} disabled={loading}>
              {loading ? 'Lädt...' : 'Neu laden'}
            </button>
          </div>
        </div>
        <div className="internal-data-summary" aria-label="Datenübersicht">
          <div className="internal-data-summary__item">
            <span className="internal-data-summary__value">{dataSummary.categories}</span>
            <span className="internal-data-summary__label">Kategorien</span>
          </div>
          <div className="internal-data-summary__item">
            <span className="internal-data-summary__value">{dataSummary.products}</span>
            <span className="internal-data-summary__label">Produkte</span>
          </div>
          <div className="internal-data-summary__item">
            <span className="internal-data-summary__value">{dataSummary.templates}</span>
            <span className="internal-data-summary__label">Templates</span>
          </div>
          <div className="internal-data-summary__item">
            <span className="internal-data-summary__value">{dataSummary.orders}</span>
            <span className="internal-data-summary__label">Bestellungen</span>
          </div>
          <div className="internal-data-summary__item">
            <span className="internal-data-summary__value">{dataSummary.assets}</span>
            <span className="internal-data-summary__label">Assets</span>
          </div>
        </div>
        {actionMessage ? <p className="internal-data-status">{actionMessage}</p> : null}
        {error ? <p className="internal-data-error">{error}</p> : null}
      </section>

      <section className="internal-data-card internal-data-card--section">
        <div className="internal-data-sections" role="tablist" aria-label="Hauptbereiche">
          {[
            ['registries', 'Registries'],
            ['assets', 'Assets'],
            ['orders', 'Aufträge'],
            ['draft', 'Draft'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`internal-data-section-tab${activeSection === key ? ' internal-data-section-tab--active' : ''}`}
              onClick={() => setActiveSection(key as MainSection)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeSection === 'registries' ? (
          <div className="internal-data-panel">
            <section className="internal-data-card internal-data-card--section internal-data-card--subsection">
              <div className="internal-data-section-header">
                <div>
                  <p className="internal-data-kicker">Registry-Typ</p>
                  <h2>Registry auswählen</h2>
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

              <label className="internal-data-select">
                <span className="internal-data-muted">Bereich</span>
                <select value={selectedKind} onChange={(event) => setSelectedKind(event.target.value as RegistryKind)}>
                  {(Object.keys(KIND_LABELS) as RegistryKind[]).map((kind) => (
                    <option key={kind} value={kind}>
                      {KIND_LABELS[kind]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="internal-data-registry-list">
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
            </section>

            <section className="internal-data-card internal-data-card--section internal-data-card--subsection">
              <div className="internal-data-section-header">
                <div>
                  <p className="internal-data-kicker">Registry</p>
                  <h2>{selectedRegistry?.title ?? 'Keine Auswahl'}</h2>
                  <p className="internal-data-muted">{selectedRegistry?.path ?? 'Wähle oben einen Eintrag.'}</p>
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
          </div>
        ) : null}

        {activeSection === 'assets' ? (
          <div className="internal-data-asset-panel">
            {registryBundleError ? <p className="internal-data-error">{registryBundleError}</p> : null}
            {assetGroups.map((group) => (
              <article key={group.key} className="internal-data-asset-group">
                <div className="internal-data-asset-group__header">
                  <div>
                    <h3>{group.title}</h3>
                    <p className="internal-data-muted">{group.description}</p>
                  </div>
                  <span className="internal-data-asset-group__count">{group.assets.length} Assets</span>
                </div>
                {group.assets.length ? (
                  <div className="internal-data-asset-grid">
                    {group.assets.map((asset) => (
                      <div key={asset.asset_id} className="internal-data-asset-card">
                        <img className="internal-data-asset-card__thumb" src={asset.url} alt="" aria-hidden="true" />
                        <div className="internal-data-asset-card__body">
                          <strong>{asset.label}</strong>
                          <p>
                            {asset.role} · {asset.source}
                          </p>
                        </div>
                        <a
                          className="internal-data-button internal-data-button--secondary internal-data-asset-card__action"
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Show
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="internal-data-muted">{group.emptyText}</p>
                )}
              </article>
            ))}
          </div>
        ) : null}

        {activeSection === 'orders' ? (
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
        ) : null}

        {activeSection === 'draft' ? (
          <div className="internal-data-panel">
            <section className="internal-data-card internal-data-card--section internal-data-card--subsection">
              <div className="internal-data-section-header">
                <div>
                  <p className="internal-data-kicker">Entwurf</p>
                  <h2>Aktueller Draft</h2>
                </div>
              </div>
              <pre className="internal-data-pre">{JSON.stringify(data?.draft ?? {}, null, 2)}</pre>
            </section>

            {data?.diagnostics?.length ? (
              <section className="internal-data-card internal-data-card--section internal-data-card--subsection">
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
          </div>
        ) : null}
      </section>
    </main>
  );
}
