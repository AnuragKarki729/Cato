import type { AcademicFieldId } from '../data/academicFields.js';
import { academicFields, signalPromptCategories } from '../data/academicFields.js';

export function listSignalPromptCategories() {
  const activeFieldIds = new Set(signalPromptCategories.map((category) => category.fieldId));

  return academicFields
    .filter((field) => activeFieldIds.has(field.id))
    .map((field) => ({
      fieldId: field.id,
      label: field.label
    }));
}

export function listSignalPrompts(fieldId?: AcademicFieldId) {
  return signalPromptCategories
    .filter((category) => !fieldId || category.fieldId === fieldId)
    .flatMap((category) =>
      category.prompts.map((text, index) => ({
        id: `${category.fieldId}:${index + 1}`,
        fieldId: category.fieldId,
        fieldLabel: category.label,
        text,
        active: true,
        sortOrder: index + 1
      }))
    );
}

export function findSignalPromptById(promptId: string) {
  return listSignalPrompts().find((prompt) => prompt.id === promptId && prompt.active) ?? null;
}
