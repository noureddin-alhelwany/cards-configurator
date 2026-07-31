export function previewAssetPath(asset: string) {
  return `/preview-assets/${asset}`;
}

export function emptyPreviewAsset(label: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8efe4" />
          <stop offset="100%" stop-color="#e7d6c2" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" rx="56" fill="url(#bg)" />
      <rect x="78" y="78" width="644" height="644" rx="40" fill="none" stroke="#8f5a2a" stroke-width="10" stroke-dasharray="18 14" />
      <text x="400" y="402" fill="#5c3a1b" font-family="Avenir Next, Segoe UI, sans-serif" font-size="54" font-weight="700" text-anchor="middle">${label}</text>
      <text x="400" y="466" fill="#7a6856" font-family="Avenir Next, Segoe UI, sans-serif" font-size="26" text-anchor="middle">Platzhalter</text>
    </svg>
  `)}`;
}

export function placeholderQrDataUrl() {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="QR Platzhalter">
      <rect width="800" height="800" rx="56" fill="#ffffff" />
      <rect x="72" y="72" width="656" height="656" rx="36" fill="none" stroke="#1f1a15" stroke-width="16" />
      <rect x="128" y="128" width="152" height="152" rx="18" fill="#1f1a15" />
      <rect x="520" y="128" width="152" height="152" rx="18" fill="#1f1a15" />
      <rect x="128" y="520" width="152" height="152" rx="18" fill="#1f1a15" />
      <rect x="184" y="184" width="40" height="40" fill="#ffffff" />
      <rect x="536" y="184" width="40" height="40" fill="#ffffff" />
      <rect x="184" y="576" width="40" height="40" fill="#ffffff" />
      <rect x="336" y="160" width="48" height="48" fill="#1f1a15" />
      <rect x="424" y="160" width="48" height="48" fill="#1f1a15" />
      <rect x="336" y="248" width="48" height="48" fill="#1f1a15" />
      <rect x="424" y="248" width="48" height="48" fill="#1f1a15" />
      <rect x="336" y="336" width="48" height="48" fill="#1f1a15" />
      <rect x="472" y="336" width="48" height="48" fill="#1f1a15" />
      <rect x="560" y="336" width="48" height="48" fill="#1f1a15" />
      <rect x="336" y="424" width="48" height="48" fill="#1f1a15" />
      <rect x="424" y="424" width="48" height="48" fill="#1f1a15" />
      <rect x="512" y="424" width="48" height="48" fill="#1f1a15" />
      <rect x="336" y="512" width="48" height="48" fill="#1f1a15" />
      <rect x="424" y="512" width="48" height="48" fill="#1f1a15" />
      <text x="400" y="726" fill="#1f1a15" font-family="Avenir Next, Segoe UI, sans-serif" font-size="34" font-weight="700" text-anchor="middle">QR Platzhalter</text>
    </svg>
  `)}`;
}
