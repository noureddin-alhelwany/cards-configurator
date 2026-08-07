import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import type {
  BoxMm,
  QrZoneDefinition,
  TemplateFieldDefinition,
  ZoneDefinition,
  ZoneVariableDefinition,
} from '../design/types';
import { buildTextFitTypographyStyle, useTextFitRuntime } from '../design/useTextFitRuntime';
import { zoneVariableFieldId, zoneVariableStateKey } from '../design/zoneVariables';
import type { FontCatalogEntry } from '../fontCatalog';
import './ZoneEditor.css';

export type ZoneKind = 'text' | 'qr';

export type EditableZone = ZoneDefinition & {
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
  templateFields: TemplateFieldDefinition[];
  fontSearch: string;
  onFontSearchChange: (value: string) => void;
  filteredFontCatalog: FontCatalogEntry[];
  fontCatalogError: string | null;
  testValues: Record<string, string>;
  frame: ReactNode;
  onSelectZone: (zoneId: string | null) => void;
  onCreateZone: (kind: ZoneKind) => void;
  onUpdateZone: (zoneId: string, nextZone: EditableZone) => void;
  onDeleteZone: (zoneId: string) => void;
  onUpdateTestValue: (variableId: string, value: string) => void;
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
  { kind: 'text', label: 'Text', description: 'Inhalt mit Checkbox für Personalisierung', widthMm: 58, heightMm: 20 },
  { kind: 'qr', label: 'QR-Code', description: 'QR-Zone', widthMm: 24, heightMm: 24 },
];

const ZONE_CREATE_OPTIONS: Array<{ kind: ZoneKind; label: string }> = [
  { kind: 'text', label: 'Text' },
  { kind: 'qr', label: 'QR-Code' },
];

const VARIABLE_KIND_LABELS: Record<ZoneKind, string> = {
  text: 'Text',
  qr: 'QR-Code',
};

const TEXT_ALIGN_OPTIONS: Array<{ value: 'left' | 'center' | 'right'; label: string }> = [
  { value: 'left', label: 'Links' },
  { value: 'center', label: 'Mitte' },
  { value: 'right', label: 'Rechts' },
];

const FONT_WEIGHT_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Normal' },
  { value: 700, label: 'Bold' },
];

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
const UNASSIGNED_ZONE_VALUE = 'not_assigned';

function fieldLabel(field: TemplateFieldDefinition) {
  return field.label ?? field.id;
}

function fieldKindMatchesZone(field: TemplateFieldDefinition, kind: ZoneKind) {
  if (kind === 'qr') {
    return field.type === 'qr' || field.type === 'url';
  }
  return field.type === 'text';
}

function fontCategoryLabel(category: string | null | undefined) {
  if (!category) {
    return 'Sonstige';
  }
  return category
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

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

function zoneIsVisible(zone: EditableZone) {
  return zone.visible ?? true;
}

function zoneIsLocked(zone: EditableZone) {
  return zone.locked ?? false;
}

function zoneKindClass(kind: ZoneKind) {
  return `zone-editor__zone--${kind}`;
}

function isTextZone(kind: ZoneKind) {
  return kind === 'text';
}

function zoneTextValue(variable: ZoneVariableDefinition | null, values: Record<string, string>) {
  if (!variable) {
    return '';
  }
  const key = zoneVariableStateKey(variable);
  const defaultValue = variable.default_value === UNASSIGNED_ZONE_VALUE ? '' : variable.default_value ?? '';
  return values[key] ?? defaultValue;
}

function normalizeZoneDefaultValue(value: string | null | undefined) {
  return value === UNASSIGNED_ZONE_VALUE ? '' : value ?? '';
}

function qrZoneOrDefault(zone: EditableZone): QrZoneDefinition {
  return zone.qr ?? DEFAULT_QR_ZONE;
}

function singleLineZoneHeightMm(variable: ZoneVariableDefinition | null | undefined) {
  if (!variable) {
    return 2;
  }
  return Math.max(2, variable.font_size_mm * variable.line_height);
}

function isSingleLineZone(variable: ZoneVariableDefinition | null | undefined) {
  return (variable?.max_lines ?? null) === 1;
}

function enforceSingleLineZoneHeight(zone: EditableZone): EditableZone {
  const variable = zone.variables?.[0] ?? null;
  if (zone.kind !== 'text' || !variable || !isSingleLineZone(variable)) {
    return zone;
  }

  const nextHeight = singleLineZoneHeightMm(variable);
  if (Math.abs(zone.box_mm.height_mm - nextHeight) < 0.01) {
    return zone;
  }

  return {
    ...zone,
    box_mm: {
      ...zone.box_mm,
      height_mm: nextHeight,
    },
  };
}

type ZoneTextFitInput = {
  box_width_mm: number;
  box_height_mm: number;
  font_size_mm: number;
  line_height: number;
  letter_spacing_em: number | null | undefined;
  max_lines: number | null;
  min_font_size_mm: number | null | undefined;
};

function zoneTextFitInput(zone: EditableZone, variable: ZoneVariableDefinition): ZoneTextFitInput {
  return {
    box_width_mm: zone.box_mm.width_mm,
    box_height_mm: zone.box_mm.height_mm,
    font_size_mm: variable.font_size_mm,
    line_height: variable.line_height,
    letter_spacing_em: variable.letter_spacing_em,
    max_lines: variable.max_lines,
    min_font_size_mm: variable.min_font_size_mm,
  };
}

function zoneTextStyle(
  variable: ZoneVariableDefinition,
  fontFamily: string | undefined,
  appliedFit: { scale: number; letterSpacingEm: number | null },
): CSSProperties {
  return buildTextFitTypographyStyle({
    color: variable.color,
    fontFamily,
    fontSizeMm: variable.font_size_mm,
    fontWeight: variable.font_weight,
    lineHeight: variable.line_height,
    textAlign: variable.align,
    letterSpacingEm: variable.letter_spacing_em,
    appliedFit,
  });
}

function ZoneTextPreview({
  zone,
  variable,
  value,
  fontFamily,
}: {
  zone: EditableZone;
  variable: ZoneVariableDefinition;
  value: string;
  fontFamily: string | undefined;
}) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const { appliedFit } = useTextFitRuntime({
    ref: previewRef,
    text: value,
    fontFamily,
    fontWeight: variable.font_weight,
    textAlign: variable.align,
    ...zoneTextFitInput(zone, variable),
    padding: '0',
    whiteSpace: isSingleLineZone(variable) ? 'nowrap' : 'pre-wrap',
    overflowWrap: isSingleLineZone(variable) ? 'normal' : 'anywhere',
    wordBreak: isSingleLineZone(variable) ? 'normal' : 'break-word',
  });
  return (
    <div
      ref={previewRef}
      className="template-tool-zone-editor__text-shell"
      aria-hidden="true"
      style={{
        ...zoneTextStyle(variable, fontFamily, appliedFit),
        height: isSingleLineZone(variable) ? `${singleLineZoneHeightMm(variable)}mm` : '100%',
        whiteSpace: isSingleLineZone(variable) ? 'nowrap' : 'pre-wrap',
        overflowWrap: isSingleLineZone(variable) ? 'normal' : 'anywhere',
        wordBreak: isSingleLineZone(variable) ? 'normal' : 'break-word',
      }}
    >
      {value}
    </div>
  );
}

function ZoneEditableTextField({
  zone,
  variable,
  value,
  fontFamily,
  selectedVariableMaxLength,
  onFocus,
  onChangeValue,
}: {
  zone: EditableZone;
  variable: ZoneVariableDefinition;
  value: string;
  fontFamily: string | undefined;
  selectedVariableMaxLength: number | null;
  onFocus: () => void;
  onChangeValue: (value: string) => void;
}) {
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const { appliedFit } = useTextFitRuntime({
    ref: fieldRef,
    text: value,
    fontFamily,
    fontWeight: variable.font_weight,
    textAlign: variable.align,
    ...zoneTextFitInput(zone, variable),
    padding: '0',
    whiteSpace: isSingleLineZone(variable) ? 'nowrap' : 'pre-wrap',
    overflowWrap: isSingleLineZone(variable) ? 'normal' : 'anywhere',
    wordBreak: isSingleLineZone(variable) ? 'normal' : 'break-word',
  });

  const sharedStyle = zoneTextStyle(variable, fontFamily, appliedFit);

  const nextValue = (rawValue: string) =>
    selectedVariableMaxLength != null ? rawValue.slice(0, selectedVariableMaxLength) : rawValue;

  if (isSingleLineZone(variable)) {
    return (
      <input
        ref={fieldRef as unknown as Ref<HTMLInputElement>}
        type="text"
        className="template-tool-zone-editor__zone-text template-tool-zone-editor__zone-text--editable template-tool-zone-editor__zone-text--field template-tool-zone-editor__zone-text--single-line"
        aria-label={`Text in Zone ${zone.id}`}
        autoFocus
        maxLength={selectedVariableMaxLength ?? undefined}
        value={value}
        onFocus={onFocus}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChangeValue(nextValue(event.target.value))}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        style={sharedStyle}
      />
    );
  }

  return (
    <textarea
      ref={fieldRef as unknown as Ref<HTMLTextAreaElement>}
      className="template-tool-zone-editor__zone-text template-tool-zone-editor__zone-text--editable template-tool-zone-editor__zone-text--field"
      aria-label={`Text in Zone ${zone.id}`}
      autoFocus
      maxLength={selectedVariableMaxLength ?? undefined}
      value={value}
      onFocus={onFocus}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChangeValue(nextValue(event.target.value))}
      style={sharedStyle}
    />
  );
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
  const minSize = 2;
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
  templateFields: TemplateFieldDefinition[],
): ZoneVariableDefinition {
  const defaultFont = availableFonts[0] ?? null;
  const defaultField =
    templateFields.find((field) => fieldKindMatchesZone(field, kind)) ??
    templateFields[0] ??
    null;
  return {
    id: nextVariableId(zoneId, kind, index),
    kind,
    field_id: defaultField?.id ?? null,
    label: defaultField ? fieldLabel(defaultField) : `${VARIABLE_KIND_LABELS[kind]} ${index + 1}`,
    font_family_id: defaultFont?.id ?? null,
    font_weight: 700,
    font_size_mm: 6.8,
    min_font_size_mm: 4.5,
    line_height: 1.05,
    letter_spacing_em: 0,
    color: '#1f1a17',
    align: 'left',
    max_length: defaultField?.max_length ?? null,
    max_lines: defaultField?.max_lines ?? null,
    required: defaultField?.required ?? false,
    default_value: kind === 'text' ? UNASSIGNED_ZONE_VALUE : '',
  };
}

export default function ZoneEditor({
  zones,
  selectedZoneId,
  pageWidthMm,
  pageHeightMm,
  availableFonts,
  templateFields,
  fontSearch,
  onFontSearchChange,
  filteredFontCatalog,
  fontCatalogError,
  testValues,
  frame,
  onSelectZone,
  onCreateZone,
  onUpdateZone,
  onDeleteZone,
  onUpdateTestValue,
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
  const selectedVariableValueKey = selectedVariable ? zoneVariableStateKey(selectedVariable) : null;
  const availableFields = useMemo(
    () => templateFields.filter((field) => fieldKindMatchesZone(field, selectedZone?.kind ?? 'text')),
    [selectedZone?.kind, templateFields],
  );
  const selectedField = useMemo(() => {
    const fieldId = selectedVariable ? zoneVariableFieldId(selectedVariable) : null;
    if (fieldId == null) {
      return null;
    }
    return availableFields.find((field) => field.id === fieldId) ?? null;
  }, [availableFields, selectedVariable]);
  const zoneFontValue = selectedVariable?.font_family_id ?? null;
  const visibleZones = useMemo(() => zones.filter((zone) => zoneIsVisible(zone)), [zones]);
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
    if (zoneIsLocked(zone)) {
      return;
    }
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
      const nextField = templateFields.find((field) => fieldKindMatchesZone(field, patch.kind as ZoneKind)) ?? null;
      onUpdateZone(zone.id, enforceSingleLineZoneHeight({
        ...zone,
        ...patch,
        visible: patch.visible ?? zone.visible ?? true,
        locked: patch.locked ?? zone.locked ?? false,
        variables: [
          existingVariable
              ? {
                ...existingVariable,
                kind: patch.kind,
                field_id: nextField?.id ?? existingVariable.field_id ?? null,
                label: nextField ? fieldLabel(nextField) : existingVariable.label,
                max_length: nextField?.max_length ?? existingVariable.max_length,
                max_lines: nextField?.max_lines ?? existingVariable.max_lines,
                required: nextField?.required ?? existingVariable.required,
                default_value: nextField?.default_value ?? existingVariable.default_value,
              }
            : createVariable(zone.id, patch.kind, 0, availableFonts, templateFields),
        ],
        box_mm: patch.box_mm ?? zone.box_mm,
      }));
      return;
    }

    onUpdateZone(zone.id, enforceSingleLineZoneHeight({
      ...zone,
      ...patch,
      visible: patch.visible ?? zone.visible ?? true,
      locked: patch.locked ?? zone.locked ?? false,
      box_mm: patch.box_mm ?? zone.box_mm,
    }));
  }

  function updateVariable(zone: EditableZone, variableId: string, patch: Partial<ZoneVariableDefinition>) {
    onUpdateZone(zone.id, enforceSingleLineZoneHeight({
      ...zone,
      variables: (zone.variables ?? []).map((variable) =>
        variable.id === variableId ? { ...variable, ...patch } : variable,
      ),
    }));
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

  const fontQueryActive = fontSearch.trim().length > 0;
  const { featured: featuredFonts } = splitFontOptions(availableFonts);
  const selectedVariableMaxLength = selectedVariable?.max_length ?? null;

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

            {selectedZone.kind === 'text' ? (
              <div className="template-tool-zone-editor__inline-controls">
                {availableFields.length > 0 ? (
                  <label className="template-tool-control">
                    <span>Zuordnung</span>
                    <select
                      value={selectedField?.id ?? ''}
                      onChange={(event) => {
                        if (!selectedVariable) {
                          return;
                        }
                        const nextField = availableFields.find((field) => field.id === event.target.value) ?? null;
                        const valueKey = nextField?.id ?? selectedVariableValueKey ?? selectedVariable.id;
                        const nextValue = testValues[valueKey] ?? normalizeZoneDefaultValue(selectedVariable?.default_value);
                        updateVariable(selectedZone, selectedVariable.id, {
                          field_id: nextField?.id ?? null,
                          label: nextField ? fieldLabel(nextField) : selectedVariable.label,
                          max_length: nextField?.max_length ?? null,
                          max_lines: nextField?.max_lines ?? null,
                          required: nextField?.required ?? false,
                          default_value: normalizeZoneDefaultValue(nextField?.default_value ?? nextValue),
                        });
                        onUpdateTestValue(valueKey, nextValue);
                      }}
                    >
                      <option value="">Keine Zuordnung</option>
                      {availableFields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {fieldLabel(field)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <div className="template-tool-zone-editor__field-config-grid">
                  <div className="template-tool-control template-tool-control--static">
                    <span>Typ</span>
                    <strong>{zoneKindMeta(selectedZone.kind).label}</strong>
                  </div>
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
                  <label className="template-tool-control">
                    <span>Max. Zeichen</span>
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
                </div>
                <div className="template-tool-zone-editor__typography-grid">
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
                    <span>Buchstabenabstand em</span>
                    <input
                      type="number"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={selectedVariable?.letter_spacing_em ?? ''}
                      onChange={(event) =>
                        selectedVariable
                          ? updateVariable(selectedZone, selectedVariable.id, {
                              letter_spacing_em: Number(event.target.value),
                            })
                          : undefined
                      }
                    />
                  </label>
                  <label className="template-tool-control">
                    <span>Gewicht</span>
                    <select
                      value={selectedVariable?.font_weight ?? 400}
                      onChange={(event) =>
                        selectedVariable
                          ? updateVariable(selectedZone, selectedVariable.id, {
                              font_weight: Number(event.target.value),
                            })
                          : undefined
                      }
                    >
                      {FONT_WEIGHT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
                </div>
                <div className="template-tool-font-browser">
                  <label className="template-tool-control template-tool-control--wide">
                    <span>Schrift suchen</span>
                    <input
                      type="search"
                      value={fontSearch}
                      onChange={(event) => onFontSearchChange(event.target.value)}
                      placeholder="Fontsource durchsuchen"
                    />
                  </label>
                  {fontQueryActive ? (
                    <div className="template-tool-font-browser__list" role="listbox" aria-label="Schrift für Zone">
                      {filteredFontCatalog.length > 0 ? (
                        filteredFontCatalog.map((font) => {
                          const selected = font.id === zoneFontValue;
                          return (
                            <button
                              key={font.id}
                              type="button"
                              className={`template-tool-font-browser__item${selected ? ' template-tool-font-browser__item--selected' : ''}`}
                              onClick={() => {
                                if (!selectedVariable) {
                                  return;
                                }
                                updateVariable(selectedZone, selectedVariable.id, {
                                  font_family_id: font.id,
                                });
                              }}
                            >
                              <span className="template-tool-font-browser__name">{font.family}</span>
                              <span className="template-tool-font-browser__preview" style={{ fontFamily: font.family }}>
                                AaBb 123
                              </span>
                              <span className="template-tool-font-browser__meta">
                                {fontCategoryLabel(font.category)}
                                {font.variable ? ' · Variable' : ''}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="template-tool-font-browser__empty">Keine Fonts für diese Filter gefunden.</p>
                      )}
                    </div>
                  ) : (
                    <div
                      className="template-tool-font-browser__list template-tool-font-browser__list--featured"
                      role="listbox"
                      aria-label="Favoriten"
                    >
                      {featuredFonts.length > 0 ? (
                        featuredFonts.map((font) => {
                          const selected = font.id === zoneFontValue;
                          return (
                            <button
                              key={font.id}
                              type="button"
                              className={`template-tool-font-browser__item${selected ? ' template-tool-font-browser__item--selected' : ''}`}
                              onClick={() => {
                                if (!selectedVariable) {
                                  return;
                                }
                                updateVariable(selectedZone, selectedVariable.id, {
                                  font_family_id: font.id,
                                });
                              }}
                            >
                              <span className="template-tool-font-browser__name">{font.family}</span>
                              <span className="template-tool-font-browser__preview" style={{ fontFamily: font.family }}>
                                AaBb 123
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="template-tool-font-browser__empty">Keine Favoriten verfügbar.</p>
                      )}
                    </div>
                  )}
                </div>
                {fontCatalogError ? <p className="template-tool-status template-tool-status--warning">{fontCatalogError}</p> : null}
                <div className="template-tool-zone-editor__field-config-grid">
                  <label className="template-tool-control">
                    <span>Erforderlich</span>
                    <input
                      type="checkbox"
                      checked={selectedVariable?.required ?? false}
                      onChange={(event) =>
                        selectedVariable
                          ? updateVariable(selectedZone, selectedVariable.id, { required: event.target.checked })
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
                </div>
              </div>
            ) : null}

            {selectedZone.kind === 'qr' ? (
              <div className="template-tool-zone-editor__inline-controls">
                <div className="template-tool-zone-editor__inline-header">
                  <h3>QR-Konfiguration</h3>
                  <p>QR-Größe und Ziellink</p>
                </div>
                <label className="template-tool-control">
                  <span>Test-URL</span>
                  <input
                    type="text"
                    value={selectedVariableValueKey ? testValues[selectedVariableValueKey] ?? normalizeZoneDefaultValue(selectedVariable?.default_value) : ''}
                    onChange={(event) =>
                      selectedVariable ? onUpdateTestValue(selectedVariableValueKey ?? selectedVariable.id, event.target.value) : undefined
                    }
                    placeholder="https://example.com/review"
                  />
                </label>
                <div className="template-tool-zone-editor__inline-grid">
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
              {visibleZones.map((zone) => {
                const selected = zone.id === selectedZoneId;
                const zoneVariable = zone.variables?.[0] ?? null;
                const fontFamily = availableFonts.find((font) => font.id === zoneVariable?.font_family_id)?.family;
                const value = zoneTextValue(zoneVariable, testValues);
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
                    {isTextZone(zone.kind) && zoneVariable ? (
                      selected ? (
                        <ZoneEditableTextField
                          zone={zone}
                          variable={zoneVariable}
                          value={value}
                          fontFamily={fontFamily}
                          selectedVariableMaxLength={selectedVariableMaxLength}
                          onFocus={() => onSelectZone(zone.id)}
                          onChangeValue={(nextValue) =>
                            onUpdateTestValue(zoneVariableStateKey(zoneVariable), nextValue)
                          }
                        />
                      ) : (
                        <ZoneTextPreview zone={zone} variable={zoneVariable} value={value} fontFamily={fontFamily} />
                      )
                    ) : null}
                    <button
                      type="button"
                      className="template-tool-zone-editor__resize"
                      aria-label={`${zoneLabel(zone)} skalieren`}
                      onMouseDown={(event) => startDrag(zone, 'resize', event)}
                      disabled={zoneIsLocked(zone)}
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
