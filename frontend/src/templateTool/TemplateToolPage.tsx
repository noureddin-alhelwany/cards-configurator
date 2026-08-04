import { useDeferredValue, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { buildTemplatePreviewFixture } from '../selection/selectionPreview';
import { loadRegistries } from '../registries/loadRegistries';
import type { RegistryBundle, TemplateDefinition } from '../registries/types';
import type { FontDefinition, SafeAreaVariableDefinition, TemplateFieldDefinition } from '../design/types';
import { uiText } from '../ui/text';
import DesignPreviewFrame from '../design/DesignPreviewFrame';
import { ensureFontDefinitionsLoaded } from '../design/fonts';
import {
  activeRegistryProduct,
  activeRegistryTemplates,
  activeRegistryCategory,
  activeRegistryVariant,
  activeRegistryVariants,
} from '../registries/registrySelection';
import ZoneEditor, { type EditableZone, type ZoneKind } from './ZoneEditor';
import { loadFontCatalog, loadFontFace, type FontCatalogEntry } from '../fontCatalog';
import './TemplateToolPage.css';

type LoadState = {
  bundle: RegistryBundle | null;
  error: string | null;
};

const DEFAULT_PREVIEW_OPACITY = 50;
const DEFAULT_SOURCE_OPACITY = 50;
const TEMPLATE_TOOL_STAGE_SCALE = 2;
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

type FontOption = {
  id: string;
  family: string;
};

function templateLabel(template: TemplateDefinition) {
  return template.name ?? template.id;
}

function templateSubtitle(template: TemplateDefinition) {
  return `${template.product_id} · ${activeRegistryVariants(template).length} Varianten`;
}

function assetUrl(asset: string | null | undefined) {
  return asset ? `/proof-assets/${asset}` : null;
}

function fieldDisplayLabel(field: TemplateFieldDefinition) {
  return field.label ?? field.id;
}

function fieldKindMatchesZone(field: TemplateFieldDefinition, kind: 'text' | 'qr') {
  if (kind === 'qr') {
    return field.type === 'qr' || field.type === 'url';
  }
  return field.type === 'text';
}

function defaultFieldIdForKind(template: TemplateDefinition, kind: 'text' | 'qr') {
  const allowedTypes = kind === 'qr' ? ['qr', 'url'] : ['text'];
  return template.fields.find((field) => allowedTypes.includes(field.type))?.id ?? `${kind}_1`;
}

function fieldForZone(template: TemplateDefinition, kind: 'text' | 'qr', fieldId?: string | null) {
  if (fieldId) {
    const matched = template.fields.find((field) => field.id === fieldId);
    if (matched && fieldKindMatchesZone(matched, kind)) {
      return matched;
    }
  }
  return template.fields.find((field) => fieldKindMatchesZone(field, kind)) ?? null;
}

function resolvePreviewAsset(
  selectedTemplate: TemplateDefinition | null,
  selectedVariant: ReturnType<typeof activeRegistryVariant>,
) {
  return assetUrl(selectedVariant?.preview_asset ?? selectedTemplate?.preview_asset ?? null);
}

function resolveSourceAsset(
  selectedTemplate: TemplateDefinition | null,
  selectedVariant: ReturnType<typeof activeRegistryVariant>,
) {
  return assetUrl(
    selectedVariant?.source_asset ??
      selectedVariant?.background_asset ??
      selectedTemplate?.source_asset ??
      selectedTemplate?.reference_asset ??
      selectedTemplate?.background_asset ??
      null,
  );
}

function stageStyle(
  pageWidthMm: number,
  pageHeightMm: number,
): CSSProperties {
  return {
    width: '100%',
    maxWidth: `calc(${pageWidthMm}mm * ${TEMPLATE_TOOL_STAGE_SCALE})`,
    aspectRatio: `${pageWidthMm} / ${pageHeightMm}`,
    justifySelf: 'start',
  };
}

function createZoneVariable(
  zoneId: string,
  kind: 'text' | 'qr',
  index: number,
  fonts: FontOption[],
  template: TemplateDefinition,
  fieldId: string | null,
): SafeAreaVariableDefinition {
  const defaultFont = fonts[0] ?? null;
  const field = fieldForZone(template, kind, fieldId);
  const nextFieldId = field?.id ?? fieldId ?? defaultFieldIdForKind(template, kind);
  return {
    id: `var-${zoneId}-${kind}-${index + 1}`,
    kind,
    field_id: nextFieldId,
    label: field ? fieldDisplayLabel(field) : nextFieldId,
    font_family_id: defaultFont?.id ?? null,
    font_weight: 700,
    font_size_mm: 6.8,
    min_font_size_mm: 4.5,
    line_height: 1.05,
    letter_spacing_em: 0,
    color: '#1f1a17',
    align: 'left',
    max_length: field?.max_length ?? null,
    max_lines: field?.max_lines ?? null,
    required: field?.required ?? false,
    default_value: field?.default_value ?? null,
  };
}

function fontOptionsFromDefinitions(fonts: Array<{ id?: string; family: string }>): FontOption[] {
  return fonts.map((font) => ({
    id: font.id ?? font.family,
    family: font.family,
  }));
}

function normalizeZones(template: TemplateDefinition, fonts: FontOption[]): EditableZone[] {
  return (template.safe_areas ?? []).map((safeArea, index) => ({
    ...safeArea,
    id: safeArea.id || `zone-${index + 1}`,
    kind: safeArea.kind ?? 'text',
    variables: (() => {
      const kind = safeArea.kind ?? 'text';
      const sourceVariable =
        (safeArea.variables ?? []).find((variable) => variable.kind === kind) ?? (safeArea.variables ?? [])[0] ?? null;
      const fieldId = sourceVariable?.field_id ?? defaultFieldIdForKind(template, kind);
      const field = fieldForZone(template, kind, fieldId);
      const defaultFont = fonts[0] ?? null;
      const nextVariable = sourceVariable
        ? {
            ...sourceVariable,
            kind,
            field_id: field?.id ?? fieldId,
            label: field ? fieldDisplayLabel(field) : fieldId,
            font_family_id: sourceVariable.font_family_id ?? defaultFont?.id ?? null,
            max_length: sourceVariable.max_length ?? field?.max_length ?? null,
            max_lines: sourceVariable.max_lines ?? field?.max_lines ?? null,
            required: sourceVariable.required ?? field?.required ?? false,
            default_value: sourceVariable.default_value ?? field?.default_value ?? null,
          }
        : createZoneVariable(
            safeArea.id || `zone-${index + 1}`,
            kind,
            0,
            fonts,
            template,
            fieldId,
          );

      return [nextVariable];
    })(),
    qr:
      safeArea.kind === 'qr'
        ? safeArea.qr ?? {
            error_correction: 'm',
            color: '#1f1a17',
            background: '#ffffff',
            quiet_zone_mm: 2,
          }
        : safeArea.qr ?? null,
  }));
}

function createZone(
  kind: ZoneKind,
  index: number,
  pageWidthMm: number,
  pageHeightMm: number,
  fonts: FontOption[],
  template: TemplateDefinition,
): EditableZone {
  const defaults = kind === 'qr' ? { width_mm: 24, height_mm: 24 } : { width_mm: 58, height_mm: 20 };
  const offset = 12 + index * 4;
  return {
    id: `zone-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index + 1}`,
    kind,
    label: kind,
    box_mm: {
      x_mm: Math.min(offset, Math.max(0, pageWidthMm - defaults.width_mm)),
      y_mm: Math.min(offset, Math.max(0, pageHeightMm - defaults.height_mm)),
      width_mm: defaults.width_mm,
      height_mm: defaults.height_mm,
    },
    personalizable: kind !== 'qr',
    qr:
      kind === 'qr'
        ? {
            error_correction: 'm',
            color: '#1f1a17',
            background: '#ffffff',
            quiet_zone_mm: 2,
        }
        : null,
    variables: [createZoneVariable(`zone-${kind}-${index + 1}`, kind, 0, fonts, template, defaultFieldIdForKind(template, kind))],
  };
}

function buildPreviewFixture(
  selectedTemplate: TemplateDefinition,
  selectedProduct: NonNullable<ReturnType<typeof activeRegistryProduct>>,
  selectedCategory: NonNullable<ReturnType<typeof activeRegistryCategory>>,
  zones: EditableZone[],
  selectedVariant: ReturnType<typeof activeRegistryVariant>,
  testValues: Record<string, string>,
  fontDefinitions: FontDefinition[],
) {
  const fixture = buildTemplatePreviewFixture(selectedTemplate, selectedProduct, selectedCategory, {
    textMode: 'blank',
  });
  if (!fixture) {
    return null;
  }

  const previewTextValues = { ...fixture.layout_state.text_values };
  for (const zone of zones) {
    for (const variable of zone.variables ?? []) {
      previewTextValues[variable.field_id ?? variable.id] = variable.default_value ?? '';
    }
  }

  fixture.layout_state.text_values = previewTextValues;
  fixture.template = {
    ...fixture.template,
    fonts: fontDefinitions,
    safe_areas: zones,
    background_asset: null,
    source_asset: null,
    variants: fixture.template.variants.map((variant) => ({
      ...variant,
      background_asset: null,
      source_asset: null,
    })),
  };
  if (selectedVariant) {
    fixture.layout_state.variant_id = selectedVariant.id;
  }
  fixture.template = {
    ...fixture.template,
    elements: fixture.template.elements.filter((element) => element.kind !== 'qr' && element.kind !== 'text'),
  };
  fixture.assets = Object.fromEntries(Object.entries(fixture.assets).filter(([key]) => key !== 'qr'));
  return fixture;
}

function renderTemplateToolStage({
  previewFixture,
  selectedTemplate,
  selectedProduct,
  selectedVariant,
  zones,
  selectedZoneId,
  testValues,
  availableFonts,
  templateFields,
  fontSearch,
  onFontSearchChange,
  fontCategory,
  onFontCategoryChange,
  fontCategories,
  filteredFontCatalog,
  fontCatalogError,
  guidesVisible,
  previewVisible,
  previewOpacity,
  sourceVisible,
  sourceOpacity,
  onSelectZone,
  onCreateZone,
  onUpdateZone,
  onDeleteZone,
  onUpdateTestValue,
}: {
  previewFixture: NonNullable<ReturnType<typeof buildPreviewFixture>>;
  selectedTemplate: TemplateDefinition;
  selectedProduct: ReturnType<typeof activeRegistryProduct>;
  selectedVariant: ReturnType<typeof activeRegistryVariant>;
  zones: EditableZone[];
  selectedZoneId: string | null;
  testValues: Record<string, string>;
  availableFonts: FontOption[];
  templateFields: TemplateFieldDefinition[];
  fontSearch: string;
  onFontSearchChange: (value: string) => void;
  fontCategory: string;
  onFontCategoryChange: (value: string) => void;
  fontCategories: string[];
  filteredFontCatalog: FontCatalogEntry[];
  fontCatalogError: string | null;
  guidesVisible: boolean;
  previewVisible: boolean;
  previewOpacity: number;
  sourceVisible: boolean;
  sourceOpacity: number;
  onSelectZone: (zoneId: string | null) => void;
  onCreateZone: (kind: ZoneKind) => void;
  onUpdateZone: (zoneId: string, nextZone: EditableZone) => void;
  onDeleteZone: (zoneId: string) => void;
  onUpdateTestValue: (variableId: string, value: string) => void;
}) {
  return (
    <ZoneEditor
      zones={zones}
      selectedZoneId={selectedZoneId}
      pageWidthMm={selectedTemplate.page_width_mm}
      pageHeightMm={selectedTemplate.page_height_mm}
      availableFonts={availableFonts}
      templateFields={templateFields}
      fontSearch={fontSearch}
      onFontSearchChange={onFontSearchChange}
      fontCategory={fontCategory}
      onFontCategoryChange={onFontCategoryChange}
      fontCategories={fontCategories}
      filteredFontCatalog={filteredFontCatalog}
      fontCatalogError={fontCatalogError}
      qrMinimumWidthMm={selectedProduct?.qr_min_width_mm ?? null}
      testValues={testValues}
      frame={
        <div
          className="template-tool-stage-shell"
          style={stageStyle(selectedTemplate.page_width_mm, selectedTemplate.page_height_mm)}
        >
          <div className="template-tool-stage-shell__layer template-tool-stage-shell__layer--live">
            <DesignPreviewFrame fixture={previewFixture} style={{ width: '100%', height: '100%' }} showGuides={guidesVisible} />
          </div>
          {previewVisible ? (
            <img
              className="template-tool-stage-shell__layer template-tool-stage-shell__layer--preview"
              data-testid="template-tool-preview-image"
              src={resolvePreviewAsset(selectedTemplate, selectedVariant) ?? undefined}
              alt=""
              aria-hidden="true"
              style={{ opacity: previewOpacity / 100 }}
            />
          ) : null}
          {sourceVisible ? (
            <img
              className="template-tool-stage-shell__layer template-tool-stage-shell__layer--source"
              data-testid="template-tool-overlay"
              src={resolveSourceAsset(selectedTemplate, selectedVariant) ?? undefined}
              alt=""
              aria-hidden="true"
              style={{ opacity: sourceOpacity / 100 }}
            />
          ) : null}
        </div>
      }
      onSelectZone={onSelectZone}
      onCreateZone={onCreateZone}
      onUpdateZone={onUpdateZone}
      onDeleteZone={onDeleteZone}
      onUpdateTestValue={onUpdateTestValue}
    />
  );
}

export default function TemplateToolPage() {
  const [state, setState] = useState<LoadState>({ bundle: null, error: null });
  const [fontCatalog, setFontCatalog] = useState<FontCatalogEntry[]>([]);
  const [fontCatalogError, setFontCatalogError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [previewOpacity, setPreviewOpacity] = useState(DEFAULT_PREVIEW_OPACITY);
  const [sourceVisible, setSourceVisible] = useState(true);
  const [sourceOpacity, setSourceOpacity] = useState(DEFAULT_SOURCE_OPACITY);
  const [guidesVisible, setGuidesVisible] = useState(true);
  const [zones, setZones] = useState<EditableZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [fontSearch, setFontSearch] = useState('');
  const [fontCategory, setFontCategory] = useState<string>('');
  const [fontFacesById, setFontFacesById] = useState<Record<string, FontDefinition>>({});

  useEffect(() => {
    let active = true;

    loadRegistries()
      .then((bundle) => {
        if (active) {
          setState({ bundle, error: null });
        }
      })
      .catch(() => {
        if (active) {
          setState({ bundle: null, error: uiText.templateTool.error.description });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    loadFontCatalog()
      .then((catalog) => {
        if (active) {
          setFontCatalog(catalog);
          setFontCatalogError(null);
        }
      })
      .catch(() => {
        if (active) {
          setFontCatalog([]);
          setFontCatalogError('Fontsource-Liste konnte nicht geladen werden.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const templates = useMemo(() => activeRegistryTemplates(state.bundle), [state.bundle]);
  const selectedTemplate = useMemo(() => {
    if (templates.length === 0) {
      return null;
    }
    return templates.find((template) => template.id === selectedTemplateId) ?? templates[0] ?? null;
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    if (!selectedTemplate) {
      setSelectedVariantId(null);
      return;
    }

    const variants = activeRegistryVariants(selectedTemplate);
    const nextVariantId =
      variants.find((variant) => variant.id === selectedVariantId)?.id ?? variants[0]?.id ?? null;
    if (nextVariantId !== selectedVariantId) {
      setSelectedVariantId(nextVariantId);
    }
  }, [selectedTemplate, selectedVariantId]);

  useEffect(() => {
    if (selectedTemplate && selectedTemplate.id !== selectedTemplateId) {
      setSelectedTemplateId(selectedTemplate.id);
    }
  }, [selectedTemplate, selectedTemplateId]);

  useEffect(() => {
    if (!selectedTemplate) {
      setZones([]);
      setSelectedZoneId(null);
      setTestValues({});
      return;
    }
    const nextZones = normalizeZones(selectedTemplate, fontOptionsFromDefinitions(selectedTemplate.fonts));
    setZones(nextZones);
    setSelectedZoneId(nextZones[0]?.id ?? null);
  }, [selectedTemplate]);

  useEffect(() => {
    setTestValues((current) => {
      const nextValues: Record<string, string> = {};
      for (const zone of zones) {
        for (const variable of zone.variables ?? []) {
          const valueKey = variable.field_id ?? variable.id;
          nextValues[valueKey] = current[valueKey] ?? variable.default_value ?? '';
        }
      }
      return nextValues;
    });
  }, [zones]);

  useEffect(() => {
    if (selectedZoneId && zones.some((zone) => zone.id === selectedZoneId)) {
      return;
    }
    setSelectedZoneId(zones[0]?.id ?? null);
  }, [selectedZoneId, zones]);

  const selectedProduct = useMemo(
    () => activeRegistryProduct(state.bundle, selectedTemplate?.product_id ?? null),
    [selectedTemplate, state.bundle],
  );

  const selectedCategory = useMemo(
    () => activeRegistryCategory(state.bundle, selectedTemplate),
    [selectedTemplate, state.bundle],
  );

  const selectedVariant = useMemo(() => {
    return activeRegistryVariant(selectedTemplate, selectedVariantId);
  }, [selectedTemplate, selectedVariantId]);

  const previewAsset = resolvePreviewAsset(selectedTemplate, selectedVariant);
  const sourceAsset = resolveSourceAsset(selectedTemplate, selectedVariant);
  const availableFonts = useMemo<FontOption[]>(() => {
    const fonts = fontOptionsFromDefinitions(selectedTemplate?.fonts ?? []);
    for (const font of fontCatalog) {
      if (!fonts.some((existing) => (existing.id ?? existing.family) === font.id)) {
        fonts.push({
          id: font.id,
          family: font.family,
        });
      }
    }
    return fonts;
  }, [fontCatalog, selectedTemplate?.fonts]);

  const fontCategories = useMemo(
    () =>
      Array.from(
        new Set(
          fontCatalog
            .map((font) => font.category)
            .filter((category): category is string => Boolean(category)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [fontCatalog],
  );

  const deferredFontSearch = useDeferredValue(fontSearch);

  const queryActive = deferredFontSearch.trim().length > 0 || fontCategory.length > 0;

  const fontBrowserCatalog = useMemo(() => {
    if (queryActive) {
      return fontCatalog;
    }
    return fontCatalog
      .filter((font) => FEATURED_FONT_IDS.has(font.id))
      .sort((left, right) => {
        return (FEATURED_FONT_ORDER_INDEX.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (FEATURED_FONT_ORDER_INDEX.get(right.id) ?? Number.MAX_SAFE_INTEGER);
      });
  }, [fontCatalog, queryActive]);

  const filteredFontCatalog = useMemo(() => {
    const query = deferredFontSearch.trim().toLowerCase();
    return fontBrowserCatalog.filter((font) => {
      if (fontCategory && font.category !== fontCategory) {
        return false;
      }
      if (!query) {
        return true;
      }
      return font.family.toLowerCase().includes(query) || font.id.toLowerCase().includes(query);
    });
  }, [deferredFontSearch, fontCategory, fontBrowserCatalog]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    const neededFontIds = new Set<string>();
    for (const font of selectedTemplate.fonts ?? []) {
      if (font.id) {
        neededFontIds.add(font.id);
      }
    }
    for (const font of filteredFontCatalog) {
      neededFontIds.add(font.id);
    }
    for (const zone of zones) {
      for (const variable of zone.variables ?? []) {
        if (variable.font_family_id) {
          neededFontIds.add(variable.font_family_id);
        }
      }
    }

    const templateFontIds = new Set((selectedTemplate.fonts ?? []).map((font) => font.id ?? font.family));
    const missingFontIds = [...neededFontIds].filter((fontId) => !templateFontIds.has(fontId) && !fontFacesById[fontId]);
    if (missingFontIds.length === 0) {
      return;
    }

    let active = true;
    void Promise.all(missingFontIds.map((fontId) => loadFontFace(fontId)))
      .then((faces) => {
        if (!active) {
          return;
        }
        setFontFacesById((current) => {
          const next = { ...current };
          for (const face of faces) {
            next[face.id ?? face.family] = face;
          }
          return next;
        });
        void ensureFontDefinitionsLoaded(faces);
      })
      .catch(() => {
        if (active) {
          setFontCatalogError('Ein ausgewählter Fontsource-Face konnte nicht geladen werden.');
        }
      });

    return () => {
      active = false;
    };
  }, [filteredFontCatalog, fontFacesById, selectedTemplate, zones]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    const selectedAndVisibleFontIds = new Set<string>();
    for (const font of selectedTemplate.fonts ?? []) {
      if (font.id) {
        selectedAndVisibleFontIds.add(font.id);
      }
    }
    for (const font of filteredFontCatalog) {
      selectedAndVisibleFontIds.add(font.id);
    }
    for (const zone of zones) {
      for (const variable of zone.variables ?? []) {
        if (variable.font_family_id) {
          selectedAndVisibleFontIds.add(variable.font_family_id);
        }
      }
    }

    setFontFacesById((current) => {
      let changed = false;
      const next: Record<string, FontDefinition> = {};
      for (const [fontId, face] of Object.entries(current)) {
        if (selectedAndVisibleFontIds.has(fontId)) {
          next[fontId] = face;
        } else {
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [filteredFontCatalog, selectedTemplate, zones]);

  const selectedFontDefinitions = useMemo(() => {
    const definitions = [...(selectedTemplate?.fonts ?? [])];
    for (const face of Object.values(fontFacesById)) {
      if (!definitions.some((font) => (font.id ?? font.family) === (face.id ?? face.family))) {
        definitions.push(face);
      }
    }
    return definitions;
  }, [fontFacesById, selectedTemplate?.fonts]);

  const previewFixture = useMemo(() => {
    if (!selectedTemplate || !selectedProduct || !selectedCategory) {
      return null;
    }
    return buildPreviewFixture(
      selectedTemplate,
      selectedProduct,
      selectedCategory,
      zones,
      selectedVariant,
      testValues,
      selectedFontDefinitions,
    );
  }, [selectedFontDefinitions, selectedProduct, selectedTemplate, selectedCategory, selectedVariant, testValues, zones]);
  const previewLabel = previewAsset;
  const sourceLabel = sourceAsset;

  if (state.error) {
    return (
      <main className="template-tool-shell template-tool-shell--error">
        <section className="template-tool-card">
          <p className="template-tool-kicker">{uiText.templateTool.error.kicker}</p>
          <h1>{uiText.templateTool.error.title}</h1>
          <p>{state.error}</p>
        </section>
      </main>
    );
  }

  if (!state.bundle) {
    return (
      <main className="template-tool-shell">
        <section className="template-tool-card">
          <p className="template-tool-kicker">{uiText.templateTool.loading.kicker}</p>
          <h1>{uiText.templateTool.loading.title}</h1>
          <p>{uiText.templateTool.loading.description}</p>
        </section>
      </main>
    );
  }

  if (templates.length === 0) {
    return (
      <main className="template-tool-shell">
        <section className="template-tool-card">
          <p className="template-tool-kicker">{uiText.templateTool.header.kicker}</p>
          <h1>{uiText.templateTool.empty.title}</h1>
          <p>{uiText.templateTool.empty.description}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="template-tool-shell">
      <section className="template-tool-card template-tool-card--hero">
        <p className="template-tool-kicker">{uiText.templateTool.header.kicker}</p>
        <h1>{uiText.templateTool.header.title}</h1>
        <p>{uiText.templateTool.header.lead}</p>
      </section>

      <div className="template-tool-layout">
        <aside className="template-tool-card template-tool-card--sidebar">
          <div className="template-tool-card__heading">
            <h2>{uiText.templateTool.controls.template}</h2>
            <p>{templates.length} Templates</p>
          </div>
          <div className="template-tool-list" role="list">
            {templates.map((template) => {
              const selected = template.id === selectedTemplate?.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  className={`template-tool-list__item${selected ? ' template-tool-list__item--selected' : ''}`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <span className="template-tool-list__name">{templateLabel(template)}</span>
                  <span className="template-tool-list__meta">{templateSubtitle(template)}</span>
                  <span className="template-tool-list__source">
                    {template.source_asset || template.background_asset ? 'Source vorhanden' : 'Keine Source'}
                  </span>
                </button>
              );
            })}
          </div>

        </aside>

        <div className="template-tool-main-column">
          <section className="template-tool-card template-tool-card--main">
          <div className="template-tool-card__heading">
            <div>
              <h2>{selectedTemplate ? templateLabel(selectedTemplate) : uiText.templateTool.controls.template}</h2>
              {selectedTemplate ? (
                <p>
                  {selectedTemplate.product_id}
                  {selectedProduct ? ` · ${selectedProduct.name}` : ''}
                </p>
              ) : null}
            </div>
            {selectedTemplate ? (
              <p className="template-tool-card__meta">
                {selectedCategory ? selectedCategory.name : 'Anwendungsfall fehlt'}
              </p>
            ) : null}
          </div>

          <div className="template-tool-sidebar-section">
            <div className="template-tool-card__heading">
              <div>
                <h3>Einstellungen</h3>
                <p>Vorlage, Vorschau und Produktion</p>
              </div>
            </div>
            <div className="template-tool-controls template-tool-controls--stack">
              <div className="template-tool-control-group template-tool-control-group--primary">
                <label className="template-tool-control">
                  <span>{uiText.templateTool.controls.variant}</span>
                  <select
                    value={selectedVariantId ?? ''}
                    onChange={(event) => setSelectedVariantId(event.target.value)}
                  >
                    {selectedTemplate
                      ? activeRegistryVariants(selectedTemplate).map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.name}
                          </option>
                        ))
                      : null}
                  </select>
                </label>
              </div>
              <div className="template-tool-control-group template-tool-control-group--toggles">
                <div className="template-tool-control-cluster">
                  <span className="template-tool-control-cluster__label">Vorschau</span>
                  <label className="template-tool-control template-tool-control--toggle">
                    <span>{uiText.templateTool.controls.previewVisible}</span>
                    <input
                      type="checkbox"
                      checked={previewVisible}
                      onChange={(event) => setPreviewVisible(event.target.checked)}
                    />
                  </label>
                  <label className="template-tool-control">
                    <span>{uiText.templateTool.controls.previewOpacity}</span>
                    <input
                      aria-label={uiText.templateTool.controls.previewOpacity}
                      type="range"
                      min="0"
                      max="100"
                      value={previewOpacity}
                      onChange={(event) => setPreviewOpacity(Number(event.target.value))}
                    />
                    <span className="template-tool-control__value">{previewOpacity}%</span>
                  </label>
                </div>

                <div className="template-tool-control-cluster">
                  <span className="template-tool-control-cluster__label">Source</span>
                  <label className="template-tool-control template-tool-control--toggle">
                    <span>{uiText.templateTool.controls.sourceVisible}</span>
                    <input
                      type="checkbox"
                      checked={sourceVisible}
                      onChange={(event) => setSourceVisible(event.target.checked)}
                    />
                  </label>
                  <label className="template-tool-control">
                    <span>{uiText.templateTool.controls.sourceOpacity}</span>
                    <input
                      aria-label={uiText.templateTool.controls.sourceOpacity}
                      type="range"
                      min="0"
                      max="100"
                      value={sourceOpacity}
                      onChange={(event) => setSourceOpacity(Number(event.target.value))}
                    />
                    <span className="template-tool-control__value">{sourceOpacity}%</span>
                  </label>
                </div>

                <div className="template-tool-control-cluster">
                  <span className="template-tool-control-cluster__label">Hilfen</span>
                  <label className="template-tool-control template-tool-control--toggle">
                    <span>{uiText.templateTool.controls.guidesVisible}</span>
                    <input
                      type="checkbox"
                      checked={guidesVisible}
                      onChange={(event) => setGuidesVisible(event.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {previewFixture && selectedTemplate ? (
            <div className="template-tool-preview">
              {renderTemplateToolStage({
                previewFixture,
                selectedTemplate,
                selectedProduct,
                selectedVariant,
                zones,
                selectedZoneId,
                testValues,
                availableFonts,
                templateFields: selectedTemplate.fields,
                fontSearch,
                onFontSearchChange: setFontSearch,
                fontCategory,
                onFontCategoryChange: setFontCategory,
                fontCategories,
                filteredFontCatalog,
                fontCatalogError,
                guidesVisible,
                previewVisible,
                previewOpacity,
                sourceVisible,
                sourceOpacity,
                onSelectZone: setSelectedZoneId,
                onCreateZone: (kind) => {
                  if (!selectedTemplate) {
                    return;
                  }
                  const nextZone = createZone(
                    kind,
                    zones.length,
                    selectedTemplate.page_width_mm,
                    selectedTemplate.page_height_mm,
                    availableFonts,
                    selectedTemplate,
                  );
                  setZones((current) => [...current, nextZone]);
                  setSelectedZoneId(nextZone.id);
                },
                onUpdateZone: (zoneId, nextZone) => {
                  setZones((current) => current.map((zone) => (zone.id === zoneId ? nextZone : zone)));
                },
                onDeleteZone: (zoneId) => {
                  setZones((current) => current.filter((zone) => zone.id !== zoneId));
                },
                onUpdateTestValue: (variableId, value) => {
                  setTestValues((current) => ({
                    ...current,
                    [variableId]: value,
                  }));
                },
              })}
            </div>
          ) : null}

          </section>

          <div className="template-tool-status template-tool-status--footer">
            <p>
              {uiText.templateTool.controls.selectedPreview}:{' '}
              {previewLabel ?? 'Keine Preview geladen'}
            </p>
            <p>
              {uiText.templateTool.controls.selectedSource}:{' '}
              {sourceLabel ?? 'Keine Source geladen'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
