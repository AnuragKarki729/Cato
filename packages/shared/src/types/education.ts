export type EducationProfile = {
  universityUnitId?: string;
  universityName: string;
  universityMatchedFromEmail: boolean;
  semesterLabel: string;
  semesterNumber: number;
  gpa?: number;
  major?: string;
  minor?: string;
  updatedAt: string;
};

export type SaveEducationRequest = {
  universityUnitId?: string;
  universityName: string;
  universityMatchedFromEmail: boolean;
  semesterLabel: string;
  semesterNumber: number;
  gpa?: number;
  major?: string;
  minor?: string;
};

export type SaveEducationResponse = {
  education: EducationProfile;
};
