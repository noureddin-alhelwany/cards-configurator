import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import type { BoxMm, QrZoneDefinition, SafeAreaDefinition, SafeAreaVariableDefinition } from '../design/types';
import { uiText } from '../ui/text';
import './ZoneEditor.css';

export type ZoneKind = 'dynamicText' | 'fixedText' | 'qr';

export type EditableZone = SafeAreaDefinition & {
  kind: ZoneKind;
};

type FontOption = {
  id: string;
  family: string;
};

type Props = {
  zones: EditableZone[];
  selectedZoneId: string | null;
  pageWidthMm: number;
  pageHeightMm: number;
  availableFonts: FontOption[];
  globalFontFamilyId: string | null;
  qrMinimumWidthMm: number | null;
  testValues: Record<string, string>;
  frame: ReactNode;
  onSelectZone: (zoneId: string | null) => void;
  onCreateZone: (kind: ZoneKind) => void;
  onUpdateZone: (zoneId: string, nextZone: EditableZone) => void;
  onDeleteZone: (zoneId: string) => void;
  onUpdateTestValue: (variableId: string, value: string) => void;
  showGuides: boolean;
};

type DragState = {
  zoneId: string;
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  baseBox: BoxMm;
  stageWidthPx: number;
  stageHeightPx: number;
};

const ZONE_KINDS: Array<{ kind: ZoneKind; label: string; description: string; widthMm: number; heightMm: number }> = [
  { kind: 'dynamicText', label: 'Dynamischer Text', description: 'Nutzereingabe für Inhalte', widthMm: 58, heightMm: 20 },
  { kind: 'fixedText', label: 'Fester Text', description: 'Statischer Text im Design', widthMm: 46, heightMm: 16 },
  { kind: 'qr', label: 'QR-Code', description: 'QR-Zone', widthMm: 24, heightMm: 24 },
];

const TEXT_ZONE_KINDS: ZoneKind[] = ['dynamicText', 'fixedText'];

const ZONE_CREATE_OPTIONS: Array<{ kind: ZoneKind; label: string }> = [
  { kind: 'dynamicText', label: 'Textzone' },
  { kind: 'qr', label: 'QR-Code' },
];

const VARIABLE_KIND_LABELS: Record<ZoneKind, string> = {
  dynamicText: 'Dynamischer Text',
  fixedText: 'Fester Text',
  qr: 'QR-Code',
};

const TEXT_ALIGN_OPTIONS: Array<{ value: 'left' | 'center' | 'right'; label: string }> = [
  { value: 'left', label: 'Links' },
  { value: 'center', label: 'Mitte' },
  { value: 'right', label: 'Rechts' },
];

const TEXT_OVERFLOW_OPTIONS: Array<{ value: 'shrink' | 'wrap' | 'error'; label: string }> = [
  { value: 'shrink', label: 'Shrink' },
  { value: 'wrap', label: 'Umbruch' },
  { value: 'error', label: 'Fehler' },
];

const DEFAULT_TEXT_FONT = 'Proof Sans';
const DEFAULT_STAGE_SCALE = 1.8;
const MAX_STAGE_SCALE = 3;
const SCALE_BOOST = 1.3;
const DEFAULT_PIXELS_PER_MM = 3.7795275591;
const MM_PROBE_WIDTH_MM = 100;
const FEATURED_FONT_ORDER = [
  'inter',
  'manrope',
  'dm-sans',
  'montserrat',
  'nunito-sans',
  'source-sans-3',
  'playfair-display',
  'cormorant-garamond',
  'bodoni-moda',
  'lora',
  'libre-baskerville',
  'source-serif-4',
  'poppins',
  'space-grotesk',
  'fraunces',
];
const FEATURED_FONT_IDS = new Set(FEATURED_FONT_ORDER);
const FEATURED_FONT_ORDER_INDEX = new Map(FEATURED_FONT_ORDER.map((fontId, index) => [fontId, index]));
const DEFAULT_QR_ZONE: QrZoneDefinition = {
  error_correction: 'm',
  color: '#1f1a17',
  background: '#ffffff',
  quiet_zone_mm: 2,
};

function zoneKindMeta(kind: ZoneKind) {
  return ZONE_KINDS.find((option) => option.kind === kind) ?? ZONE_KINDS[0];
}

function splitFontOptions(fonts: FontOption[]) {
  const featured: FontOption[] = [];
  const rest: FontOption[] = [];

  for (const font of fonts) {
    if (FEATURED_FONT_IDS.has(font.id)) {
      featured.push(font);
    } else {
      rest.push(font);
    }
  }

  featured.sort(
    (left, right) =>
      (FEATURED_FONT_ORDER_INDEX.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (FEATURED_FONT_ORDER_INDEX.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );

  return { featured, rest };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function measurePixelsPerMm(probe: HTMLDivElement | null) {
  if (!probe) {
    return DEFAULT_PIXELS_PER_MM;
  }
  const widthPx = probe.getBoundingClientRect().width;
  return widthPx > 0 ? widthPx / MM_PROBE_WIDTH_MM : DEFAULT_PIXELS_PER_MM;
}

function computeStageScale(
  pageWidthMm: number,
  pageHeightMm: number,
  pixelsPerMm: number,
  availableWidthPx: number,
) {
  if (availableWidthPx <= 0) {
    return DEFAULT_STAGE_SCALE;
  }

  const naturalWidthPx = pageWidthMm * pixelsPerMm;
  const widthLimitedScale = availableWidthPx / naturalWidthPx;
  const fitScale = Math.min(widthLimitedScale, MAX_STAGE_SCALE);
  return clamp(fitScale * SCALE_BOOST, 1, MAX_STAGE_SCALE);
}

function zoneLabel(zone: EditableZone) {
  return zoneKindMeta(zone.kind).label;
}

function zoneKindClass(kind: ZoneKind) {
  return `zone-editor__zone--${kind}`;
}

function isTextZone(kind: ZoneKind) {
  return kind === 'dynamicText' || kind === 'fixedText';
}

function zoneTextValue(variable: SafeAreaVariableDefinition | null) {
  if (!variable) {
    return '';
  }
  return variable.default_value ?? '';
}

function effectiveZoneFontFamily(
  availableFonts: FontOption[],
  variable: SafeAreaVariableDefinition | null,
  globalFontFamilyId: string | null,
  currentGlobalFont: FontOption | null,
) {
  const fontId = variable?.font_family_id ?? globalFontFamilyId;
  if (fontId) {
    const resolved = availableFonts.find((font) => font.id === fontId)?.family ?? null;
    if (resolved) {
      return resolved;
    }
  }
  return currentGlobalFont?.family ?? variable?.font_family ?? DEFAULT_TEXT_FONT;
}

function qrZoneOrDefault(zone: EditableZone): QrZoneDefinition {
  return zone.qr ?? DEFAULT_QR_ZONE;
}

function hexToRgb(color: string) {
  const value = color.trim().replace('#', '');
  if (value.length === 3) {
    return [
      Number.parseInt(value[0] + value[0], 16) / 255,
      Number.parseInt(value[1] + value[1], 16) / 255,
      Number.parseInt(value[2] + value[2], 16) / 255,
    ] as const;
  }
  if (value.length === 6) {
    return [
      Number.parseInt(value.slice(0, 2), 16) / 255,
      Number.parseInt(value.slice(2, 4), 16) / 255,
      Number.parseInt(value.slice(4, 6), 16) / 255,
    ] as const;
  }
  return null;
}

function relativeLuminance(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return null;
  }
  const channel = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  if (foregroundLuminance == null || backgroundLuminance == null) {
    return null;
  }
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function nextVariableId(zoneId: string, kind: ZoneKind, index: number) {
  return `var-${zoneId}-${kind}-${index + 1}`;
}

function offsetBox(box: BoxMm, deltaX: number, deltaY: number, widthMm: number, heightMm: number): BoxMm {
  const maxX = Math.max(0, widthMm - box.width_mm);
  const maxY = Math.max(0, heightMm - box.height_mm);
  return {
    ...box,
    x_mm: clamp(box.x_mm + deltaX, 0, maxX),
    y_mm: clamp(box.y_mm + deltaY, 0, maxY),
  };
}

function resizeBox(box: BoxMm, deltaWidth: number, deltaHeight: number, widthMm: number, heightMm: number): BoxMm {
  const minSize = 8;
  const nextWidth = clamp(box.width_mm + deltaWidth, minSize, widthMm - box.x_mm);
  const nextHeight = clamp(box.height_mm + deltaHeight, minSize, heightMm - box.y_mm);
  return {
    ...box,
    width_mm: nextWidth,
    height_mm: nextHeight,
  };
}

function createVariable(
  zoneId: string,
  kind: ZoneKind,
  index: number,
  availableFonts: FontOption[],
): SafeAreaVariableDefinition {
  const defaultFont = availableFonts[0] ?? null;
  return {
    id: nextVariableId(zoneId, kind, index),
    kind,
    key: `${kind}_${index + 1}`,
    label: `${VARIABLE_KIND_LABELS[kind]} ${index + 1}`,
    font_family: defaultFont?.family ?? DEFAULT_TEXT_FONT,
    font_family_id: null,
    font_weight: kind === 'dynamicText' ? 700 : 400,
    font_size_mm: kind === 'dynamicText' ? 6.8 : 4.4,
    min_font_size_mm: kind === 'dynamicText' ? 4.5 : 3.2,
    line_height: kind === 'dynamicText' ? 1.05 : 1.15,
    color: '#1f1a17',
    align: 'left',
    max_length: null,
    max_lines: kind === 'dynamicText' ? 3 : 1,
    overflow: 'shrink',
    required: false,
    default_value: null,
  };
}

function isSameVariableContent(a: SafeAreaVariableDefinition | null | undefined, b: SafeAreaVariableDefinition | null) {
  if (!a || !b) {
    return a === b;
  }
  return (
    a.id === b.id &&
    a.kind === b.kind &&
    a.key === b.key &&
    a.default_value === b.default_value &&
    a.font_family_id === b.font_family_id &&
    a.font_family === b.font_family &&
    a.font_weight === b.font_weight &&
    a.font_size_mm === b.font_size_mm &&
    a.min_font_size_mm === b.min_font_size_mm &&
    a.line_height === b.line_height &&
    a.color === b.color &&
    a.align === b.align &&
    a.max_length === b.max_length &&
    a.max_lines === b.max_lines &&
    a.overflow === b.overflow &&
    a.required === b.required
  );
}

export default function ZoneEditor({
  zones,
  selectedZoneId,
  pageWidthMm,
  pageHeightMm,
  availableFonts,
  globalFontFamilyId,
  qrMinimumWidthMm,
  testValues,
  frame,
  onSelectZone,
  onCreateZone,
  onUpdateZone,
  onDeleteZone,
  onUpdateTestValue,
  showGuides,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const mmProbeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [stageScale, setStageScale] = useState(DEFAULT_STAGE_SCALE);

  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === selectedZoneId) ?? null,
    [selectedZoneId, zones],
  );
  const selectedVariable = selectedZone?.variables?.[0] ?? null;
  const currentGlobalFont = useMemo(
    () => availableFonts.find((font) => font.id === globalFontFamilyId) ?? null,
    [availableFonts, globalFontFamilyId],
  );

  useEffect(() => {
    if (!selectedZoneId || zones.some((zone) => zone.id === selectedZoneId)) {
      return;
    }
    onSelectZone(zones[0]?.id ?? null);
  }, [onSelectZone, selectedZoneId, zones]);

  useEffect(() => {
    function updateStageScale() {
      const wrap = canvasWrapRef.current;
      if (!wrap) {
        return;
      }

      const pxPerMm = measurePixelsPerMm(mmProbeRef.current);
      const wrapRect = wrap.getBoundingClientRect();
      const availableWidthPx = wrapRect.width;
      setStageScale(computeStageScale(pageWidthMm, pageHeightMm, pxPerMm, availableWidthPx));
    }

    updateStageScale();

    const observer =
      typeof ResizeObserver !== 'undefined' && canvasWrapRef.current ? new ResizeObserver(updateStageScale) : null;
    if (observer && canvasWrapRef.current) {
      observer.observe(canvasWrapRef.current);
    }
    window.addEventListener('resize', updateStageScale);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateStageScale);
    };
  }, [pageHeightMm, pageWidthMm]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    function stopDrag() {
      dragRef.current = null;
      setDragState(null);
    }

    function handleMove(event: MouseEvent) {
      const drag = dragState;
      const stage = stageRef.current;
      if (!drag || !stage) {
        return;
      }
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const deltaX = (event.clientX - drag.startX) * (pageWidthMm / drag.stageWidthPx);
      const deltaY = (event.clientY - drag.startY) * (pageHeightMm / drag.stageHeightPx);
      const zone = zones.find((item) => item.id === drag.zoneId);
      if (!zone) {
        return;
      }

      const nextBox =
        drag.mode === 'move'
          ? offsetBox(drag.baseBox, deltaX, deltaY, pageWidthMm, pageHeightMm)
          : resizeBox(drag.baseBox, deltaX, deltaY, pageWidthMm, pageHeightMm);

      onUpdateZone(zone.id, { ...zone, box_mm: nextBox });
    }

    if (dragRef.current) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', stopDrag, { once: true });
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', stopDrag);
      };
    }
    return undefined;
  }, [dragState, onUpdateZone, pageHeightMm, pageWidthMm, zones]);

  function startDrag(zone: EditableZone, mode: 'move' | 'resize', event: ReactMouseEvent<HTMLButtonElement | HTMLDivElement>) {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      zoneId: zone.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      baseBox: zone.box_mm,
      stageWidthPx: rect.width,
      stageHeightPx: rect.height,
    };
    setDragState(dragRef.current);
    onSelectZone(zone.id);
  }

  function updateZone(zone: EditableZone, patch: Partial<EditableZone>) {
    if (patch.kind && patch.kind !== zone.kind) {
      const existingVariable = zone.variables?.[0] ?? null;
      onUpdateZone(zone.id, {
        ...zone,
        ...patch,
        variables: [
          existingVariable
            ? {
                ...existingVariable,
                kind: patch.kind,
              }
            : createVariable(zone.id, patch.kind, 0, availableFonts),
        ],
        box_mm: patch.box_mm ?? zone.box_mm,
      });
      return;
    }

    onUpdateZone(zone.id, {
      ...zone,
      ...patch,
      box_mm: patch.box_mm ?? zone.box_mm,
    });
  }

  function updateVariable(zone: EditableZone, variableId: string, patch: Partial<SafeAreaVariableDefinition>) {
    onUpdateZone(zone.id, {
      ...zone,
      variables: (zone.variables ?? []).map((variable) =>
        variable.id === variableId ? { ...variable, ...patch } : variable,
      ),
    });
  }

  function updateQrZone(zone: EditableZone, patch: Partial<QrZoneDefinition>) {
    onUpdateZone(zone.id, {
      ...zone,
      qr: {
        ...qrZoneOrDefault(zone),
        ...patch,
      },
    });
  }

  function createZone(kind: ZoneKind) {
    onCreateZone(kind);
  }

  return (
    <section className="template-tool-zone-editor">
      <aside className="template-tool-card template-tool-zone-editor__sidebar">
        <div className="template-tool-card__heading">
          <h2>Zonen</h2>
          <p>{zones.length} aktiv</p>
        </div>
        <div className="template-tool-zone-editor__create">
          {ZONE_CREATE_OPTIONS.map((option) => (
            <button key={option.kind} type="button" className="template-tool-reset" onClick={() => createZone(option.kind)}>
              {option.label} erstellen
            </button>
          ))}
        </div>
        {selectedZone ? (
          <div className="template-tool-zone-editor__form">
            <div className="template-tool-card__heading">
              <h3>Zone bearbeiten</h3>
              <button type="button" className="template-tool-reset" onClick={() => onDeleteZone(selectedZone.id)}>
                Löschen
              </button>
            </div>

            {isTextZone(selectedZone.kind) ? (
              <label className="template-tool-control template-tool-control--toggle">
                <span>Text personalisierbar</span>
                <input
                  type="checkbox"
                  checked={selectedZone.kind === 'dynamicText'}
                  onChange={(event) =>
                    updateZone(selectedZone, {
                      kind: event.target.checked ? 'dynamicText' : 'fixedText',
                    })
                  }
                />
              </label>
            ) : null}

            {isTextZone(selectedZone.kind) ? (
              <div className="template-tool-zone-editor__section">
                <div className="template-tool-card__heading">
                  <h3>Text</h3>
                </div>
                <label className="template-tool-control">
                  <span>Textinhalt</span>
                  <textarea
                    rows={3}
                    value={selectedVariable?.default_value ?? ''}
                    onChange={(event) => {
                      if (!selectedVariable) {
                        return;
                      }

                      updateVariable(selectedZone, selectedVariable.id, {
                        default_value: event.target.value,
                      });
                      if (selectedZone.kind === 'dynamicText') {
                        onUpdateTestValue(selectedVariable.id, event.target.value);
                      }
                    }}
                    placeholder="Text für diese Zone"
                  />
                </label>
                <label className="template-tool-control">
                  <span>Schriftfamilie</span>
                  <select
                    value={selectedVariable?.font_family_id ?? ''}
                    onChange={(event) =>
                      selectedVariable
                        ? updateVariable(selectedZone, selectedVariable.id, {
                            font_family_id: event.target.value === '' ? null : event.target.value,
                          })
                        : undefined
                    }
                    disabled={availableFonts.length === 0}
                  >
                    <option value="">Globale Schrift verwenden</option>
                    {(() => {
                      const { featured, rest } = splitFontOptions(availableFonts);
                      return (
                        <>
                          {featured.length > 0 ? (
                            <optgroup label="Favoriten">
                              {featured.map((font) => (
                                <option key={font.id} value={font.id}>
                                  {font.family}
                                </option>
                              ))}
                            </optgroup>
                          ) : null}
                          {rest.length > 0 ? <option value="" disabled>─────</option> : null}
                          {rest.length > 0 ? (
                            <optgroup label="Weitere Fonts">
                              {rest.map((font) => (
                                <option key={font.id} value={font.id}>
                                  {font.family}
                                </option>
                              ))}
                            </optgroup>
                          ) : null}
                        </>
                      );
                    })()}
                  </select>
                </label>
                <div className="template-tool-zone-editor__style-grid">
                  <label className="template-tool-control">
                    <span>Schriftgröße mm</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={selectedVariable?.font_size_mm ?? ''}
                      onChange={(event) =>
                        selectedVariable
                          ? updateVariable(selectedZone, selectedVariable.id, {
                              font_size_mm: Number(event.target.value),
                            })
                          : undefined
                      }
                    />
                  </label>
                  <label className="template-tool-control">
                    <span>Zeilenhöhe</span>
                    <input
                      type="number"
                      min="0"
                      step="0.05"
                      value={selectedVariable?.line_height ?? ''}
                      onChange={(event) =>
                        selectedVariable
                          ? updateVariable(selectedZone, selectedVariable.id, {
                              line_height: Number(event.target.value),
                            })
                          : undefined
                      }
                    />
                  </label>
                  <label className="template-tool-control">
                    <span>Farbe</span>
                    <input
                      type="color"
                      value={selectedVariable?.color ?? '#1f1a17'}
                      onChange={(event) =>
                        selectedVariable
                          ? updateVariable(selectedZone, selectedVariable.id, { color: event.target.value })
                          : undefined
                      }
                    />
                  </label>
                  <label className="template-tool-control">
                    <span>Ausrichtung</span>
                    <select
                      value={selectedVariable?.align ?? 'left'}
                      onChange={(event) =>
                        selectedVariable
                          ? updateVariable(selectedZone, selectedVariable.id, {
                              align: event.target.value as 'left' | 'center' | 'right',
                            })
                          : undefined
                      }
                    >
                      {TEXT_ALIGN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <details className="template-tool-zone-editor__advanced">
                  <summary>Erweitert</summary>
                  <div className="template-tool-zone-editor__advanced-grid">
                    <label className="template-tool-control">
                      <span>Gewicht</span>
                      <input
                        type="number"
                        min="100"
                        max="900"
                        step="100"
                        value={selectedVariable?.font_weight ?? ''}
                        onChange={(event) =>
                          selectedVariable
                            ? updateVariable(selectedZone, selectedVariable.id, {
                                font_weight: Number(event.target.value),
                              })
                            : undefined
                        }
                      />
                    </label>
                    <label className="template-tool-control">
                      <span>Mindestgröße mm</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={selectedVariable?.min_font_size_mm ?? ''}
                        onChange={(event) =>
                          selectedVariable
                            ? updateVariable(selectedZone, selectedVariable.id, {
                                min_font_size_mm: event.target.value === '' ? null : Number(event.target.value),
                              })
                            : undefined
                        }
                      />
                    </label>
                    <label className="template-tool-control">
                      <span>Zeichenlimit</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={selectedVariable?.max_length ?? ''}
                        onChange={(event) =>
                          selectedVariable
                            ? updateVariable(selectedZone, selectedVariable.id, {
                                max_length: event.target.value === '' ? null : Number(event.target.value),
                              })
                            : undefined
                        }
                      />
                    </label>
                    <label className="template-tool-control">
                      <span>Max. Zeilen</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={selectedVariable?.max_lines ?? ''}
                        onChange={(event) =>
                          selectedVariable
                            ? updateVariable(selectedZone, selectedVariable.id, {
                                max_lines: event.target.value === '' ? null : Number(event.target.value),
                              })
                            : undefined
                        }
                      />
                    </label>
                    <label className="template-tool-control">
                      <span>Überlauf</span>
                      <select
                        value={selectedVariable?.overflow ?? 'shrink'}
                        onChange={(event) =>
                          selectedVariable
                            ? updateVariable(selectedZone, selectedVariable.id, {
                                overflow: event.target.value as 'shrink' | 'wrap' | 'error',
                              })
                            : undefined
                        }
                      >
                        {TEXT_OVERFLOW_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </details>
              </div>
            ) : null}

            {selectedZone.kind === 'qr' ? (
              <div className="template-tool-zone-editor__section">
                <div className="template-tool-card__heading">
                  <h3>QR-Konfiguration</h3>
                  <p>Mindestbreite: {qrMinimumWidthMm?.toFixed(1) ?? 'n/a'} mm</p>
                </div>
                <label className="template-tool-control">
                  <span>Test-URL</span>
                  <input
                    type="text"
                    value={selectedVariable ? testValues[selectedVariable.id] ?? selectedVariable.default_value ?? '' : ''}
                    onChange={(event) =>
                      selectedVariable
                        ? onUpdateTestValue(selectedVariable.id, event.target.value)
                        : undefined
                    }
                    placeholder="https://example.com/review"
                  />
                </label>
                <div className="template-tool-zone-editor__style-grid">
                  <label className="template-tool-control">
                    <span>Fehlerkorrektur</span>
                    <select
                      value={qrZoneOrDefault(selectedZone).error_correction}
                      onChange={(event) =>
                        updateQrZone(selectedZone, {
                          error_correction: event.target.value as QrZoneDefinition['error_correction'],
                        })
                      }
                    >
                      <option value="m">M</option>
                      <option value="q">Q</option>
                      <option value="h">H</option>
                    </select>
                  </label>
                  <label className="template-tool-control">
                    <span>Ruhezone mm</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={qrZoneOrDefault(selectedZone).quiet_zone_mm}
                      onChange={(event) =>
                        updateQrZone(selectedZone, { quiet_zone_mm: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="template-tool-control">
                    <span>Farbe</span>
                    <input
                      type="color"
                      value={qrZoneOrDefault(selectedZone).color}
                      onChange={(event) => updateQrZone(selectedZone, { color: event.target.value })}
                    />
                  </label>
                  <label className="template-tool-control">
                    <span>Hintergrund</span>
                    <input
                      type="color"
                      value={qrZoneOrDefault(selectedZone).background}
                      onChange={(event) => updateQrZone(selectedZone, { background: event.target.value })}
                    />
                  </label>
                </div>
                <p className="template-tool-zone-editor__status">
                  Die Zone selbst definiert die Größe. Der Printpfad erzeugt den QR-Code später im Backend.
                </p>
                {qrMinimumWidthMm != null && selectedZone.box_mm.width_mm < qrMinimumWidthMm ? (
                  <p className="template-tool-zone-editor__status template-tool-zone-editor__status--warning">
                    Die QR-Breite liegt unter dem Produktminimum von {qrMinimumWidthMm.toFixed(1)} mm.
                  </p>
                ) : null}
                {contrastRatio(qrZoneOrDefault(selectedZone).color, qrZoneOrDefault(selectedZone).background) != null &&
                (contrastRatio(qrZoneOrDefault(selectedZone).color, qrZoneOrDefault(selectedZone).background) ?? 0) < 3 ? (
                  <p className="template-tool-zone-editor__status template-tool-zone-editor__status--warning">
                    Der Kontrast zwischen QR-Farbe und Hintergrund ist zu gering.
                  </p>
                ) : null}
              </div>
            ) : null}

            <p className="template-tool-zone-editor__help">
              Ziehen verschiebt die Zone, der Griff unten rechts skaliert sie.
            </p>
          </div>
        ) : null}
      </aside>

      <div ref={canvasWrapRef} className="template-tool-zone-editor__canvas-wrap">
        <div ref={mmProbeRef} className="template-tool-zone-editor__mm-probe" aria-hidden="true" />
        <div
          className="template-tool-zone-editor__canvas"
          style={{
            width: `calc(${pageWidthMm}mm * ${stageScale})`,
            aspectRatio: `${pageWidthMm} / ${pageHeightMm}`,
          }}
        >
          <div
            ref={stageRef}
            className="template-tool-zone-editor__canvas-content"
            style={{
              width: `${pageWidthMm}mm`,
              height: `${pageHeightMm}mm`,
              transform: `scale(${stageScale})`,
              transformOrigin: 'top left',
            }}
          >
            {frame}
            <div className="template-tool-zone-editor__overlay">
              {zones.map((zone) => {
                const selected = zone.id === selectedZoneId;
                const zoneVariable = zone.variables?.[0] ?? null;
                const isEditableTextZone = selected && isTextZone(zone.kind);
                const fontFamily = effectiveZoneFontFamily(availableFonts, zoneVariable, globalFontFamilyId, currentGlobalFont);
                const value = zoneTextValue(zoneVariable);
                return (
                  <div
                    key={zone.id}
                    className={`template-tool-zone-editor__zone ${zoneKindClass(zone.kind)}${selected ? ' template-tool-zone-editor__zone--selected' : ''}`}
                    data-testid={`template-tool-zone-${zone.id}`}
                    style={{
                      left: `${zone.box_mm.x_mm}mm`,
                      top: `${zone.box_mm.y_mm}mm`,
                      width: `${zone.box_mm.width_mm}mm`,
                      height: `${zone.box_mm.height_mm}mm`,
                    }}
                    onMouseDown={(event) => startDrag(zone, 'move', event)}
                  >
                    {isTextZone(zone.kind) ? (
                      <div
                        className="template-tool-zone-editor__zone-text template-tool-zone-editor__zone-text--static"
                        style={{
                          color: zoneVariable?.color ?? '#1f1a17',
                          fontFamily,
                          fontSize: `${zoneVariable?.font_size_mm ?? 4.4}mm`,
                          fontWeight: zoneVariable?.font_weight ?? 400,
                          lineHeight: zoneVariable?.line_height ?? 1.15,
                          textAlign: zoneVariable?.align ?? 'left',
                        }}
                      >
                        {value || 'Text hier eingeben'}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="template-tool-zone-editor__resize"
                      aria-label={`${zoneLabel(zone)} skalieren`}
                      onMouseDown={(event) => startDrag(zone, 'resize', event)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
