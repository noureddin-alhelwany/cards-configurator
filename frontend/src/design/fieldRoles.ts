import type { TemplateFieldDefinition } from './types';

export type TemplateFieldRole = 'business' | 'headline' | 'body' | 'qrTarget' | 'logo' | 'image' | 'generic';

/**
 * Classifies a template field so presentation layers can pick sensible copy and
 * fallbacks without hard-coding field ids.
 *
 * Lives in `design/` rather than `selection/` because both the live preview and the
 * production render need it to resolve the branding fallback.
 */
export function fieldRole(field: TemplateFieldDefinition, index: number): TemplateFieldRole {
  const id = field.id.toLowerCase();
  if (field.type === 'logo') {
    return 'logo';
  }
  if (field.type === 'image') {
    return 'image';
  }
  if (field.type === 'url' || id.includes('qr') || id.includes('url') || id.includes('target')) {
    return 'qrTarget';
  }
  if (id.includes('business') || id.includes('company') || id.includes('studio') || id.includes('brand')) {
    return 'business';
  }
  if (id.includes('headline') || id.includes('title') || id.includes('claim') || id.includes('hero')) {
    return 'headline';
  }
  if (id.includes('body') || id.includes('description') || id.includes('text') || id.includes('copy')) {
    return 'body';
  }
  if (index === 0) {
    return 'business';
  }
  if (index === 1) {
    return 'headline';
  }
  if (index === 2) {
    return 'body';
  }
  return 'generic';
}
