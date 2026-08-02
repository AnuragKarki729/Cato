export type SoftSkillConfidence = 'low' | 'medium' | 'high';

export type SoftSkillItem = {
  label: string;
  rating: number;
  evidence: string;
  confidence: SoftSkillConfidence;
};

export type SoftSkillOutput = {
  source: 'dummy' | 'resume';
  provider: 'none' | 'gemini';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  items: SoftSkillItem[];
  editableByApplicant: boolean;
  generatedAt?: string;
  updatedAt: string;
};

export type SoftSkillOutputResponse = {
  softSkills: SoftSkillOutput | null;
};
