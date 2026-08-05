import type {
  AssetDataUrl,
  BoxMm,
  ElementAdjustment,
  FontDefinition,
  ImageElementDefinition,
  LayoutState,
  ProductDefinition,
  ProofFixture,
  QrElementDefinition,
  QrRuleDefinition,
  TemplateDefinition,
  TemplateElementDefinition,
  TemplateFieldDefinition,
  TemplateDesignDefinition,
  TextRuleDefinition,
  TextElementDefinition,
  ZoneDefinition,
  CategoryDefinition,
} from '../design/types';

export type {
  AssetDataUrl,
  BoxMm,
  ElementAdjustment,
  FontDefinition,
  ImageElementDefinition,
  LayoutState,
  ProductDefinition,
  ProofFixture,
  QrElementDefinition,
  QrRuleDefinition,
  TemplateDefinition,
  TemplateElementDefinition,
  TemplateFieldDefinition,
  TemplateDesignDefinition,
  TextRuleDefinition,
  TextElementDefinition,
  ZoneDefinition,
  CategoryDefinition,
};

export type RegistryIssue = {
  code: string;
  severity: 'info' | 'warning' | 'error';
  path: string;
  message: string;
  blocking: boolean;
  details: Record<string, unknown>;
};

export type RegistryBundle = {
  categories: CategoryDefinition[];
  products: ProductDefinition[];
  templates: TemplateDefinition[];
  diagnostics: RegistryIssue[];
};
