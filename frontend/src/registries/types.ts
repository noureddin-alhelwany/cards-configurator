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
  SafeAreaDefinition,
  TemplateDefinition,
  TemplateElementDefinition,
  TemplateFieldDefinition,
  TemplateVariantDefinition,
  TextRuleDefinition,
  TextElementDefinition,
  UseCaseDefinition,
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
  SafeAreaDefinition,
  TemplateDefinition,
  TemplateElementDefinition,
  TemplateFieldDefinition,
  TemplateVariantDefinition,
  TextRuleDefinition,
  TextElementDefinition,
  UseCaseDefinition,
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
  use_cases: UseCaseDefinition[];
  products: ProductDefinition[];
  templates: TemplateDefinition[];
  diagnostics: RegistryIssue[];
};
