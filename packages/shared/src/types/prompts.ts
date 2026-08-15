import type { AcademicFieldId } from '../constants/academicFields';

export type SignalPrompt = {
  id: string;
  fieldId: AcademicFieldId;
  fieldLabel: string;
  text: string;
  active: boolean;
  sortOrder: number;
};

export type SignalPromptsResponse = {
  categories: Array<{
    fieldId: AcademicFieldId;
    label: string;
  }>;
  prompts: SignalPrompt[];
};
