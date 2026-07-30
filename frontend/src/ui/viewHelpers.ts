export function snapshotString(snapshot: Record<string, unknown> | null | undefined, key: string) {
  const value = snapshot?.[key];
  return typeof value === 'string' ? value : null;
}

export function formatLocalizedDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString('de-DE');
}

export function friendlyOrderTitle(snapshot: Record<string, unknown> | null | undefined, fallback: string) {
  return snapshotString(snapshot, 'name') ?? snapshotString(snapshot, 'title') ?? fallback;
}
