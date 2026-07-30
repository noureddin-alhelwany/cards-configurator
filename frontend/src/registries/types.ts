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
  TemplateDefinition,
  TemplateElementDefinition,
  TemplateFieldDefinition,
  TemplateVariantDefinition,
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
  TemplateDefinition,
  TemplateElementDefinition,
  TemplateFieldDefinition,
  TemplateVariantDefinition,
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
