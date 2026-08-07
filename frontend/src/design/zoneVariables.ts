import type { ZoneVariableDefinition } from './types';

export function zoneVariableFieldId(variable: ZoneVariableDefinition): string | null {
  return variable.field_id ?? null;
}

export function zoneVariableStateKey(variable: ZoneVariableDefinition): string {
  return variable.field_id ?? variable.id;
}
