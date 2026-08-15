export type AcademicFieldId =
  | 'business'
  | 'technology'
  | 'engineering'
  | 'healthcare'
  | 'science'
  | 'education'
  | 'arts_media'
  | 'social_sciences'
  | 'public_policy'
  | 'law'
  | 'hospitality'
  | 'agriculture'
  | 'general';

export type AcademicField = {
  id: AcademicFieldId;
  label: string;
};

export const academicFields: AcademicField[] = [
  { id: 'general', label: 'General' },
  { id: 'business', label: 'Business' },
  { id: 'technology', label: 'Technology' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'science', label: 'Science' },
  { id: 'education', label: 'Education' },
  { id: 'arts_media', label: 'Arts & Media' },
  { id: 'social_sciences', label: 'Social Sciences' },
  { id: 'public_policy', label: 'Public Policy' },
  { id: 'law', label: 'Law' },
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'agriculture', label: 'Agriculture' }
] as const;

export const majorFieldMappings: Record<string, AcademicFieldId[]> = {
  accounting: ['business'],
  actuarial: ['business', 'science'],
  'actuarial science': ['business', 'science'],
  advertising: ['business', 'arts_media'],
  aerospace: ['engineering'],
  'aerospace engineering': ['engineering'],
  agriculture: ['agriculture', 'science'],
  agribusiness: ['agriculture', 'business'],
  'animal science': ['agriculture', 'science'],
  anthropology: ['social_sciences'],
  'applied mathematics': ['science', 'technology'],
  architecture: ['engineering', 'arts_media'],
  art: ['arts_media'],
  'art history': ['arts_media'],
  astronomy: ['science'],
  astrophysics: ['science'],
  biochemistry: ['science', 'healthcare'],
  bioengineering: ['engineering', 'healthcare'],
  biology: ['science', 'healthcare'],
  biomedical: ['healthcare', 'engineering'],
  'biomedical engineering': ['engineering', 'healthcare'],
  biotechnology: ['science', 'healthcare'],
  business: ['business'],
  'business administration': ['business'],
  'business analytics': ['business', 'technology'],
  'business english': ['business', 'arts_media'],
  'chemical engineering': ['engineering', 'science'],
  chemistry: ['science'],
  'civil engineering': ['engineering'],
  classics: ['arts_media', 'education'],
  'cognitive science': ['science', 'technology', 'social_sciences'],
  communications: ['arts_media'],
  'community health': ['healthcare', 'public_policy'],
  'computer engineering': ['engineering', 'technology'],
  'computer science': ['technology', 'engineering'],
  'construction management': ['engineering', 'business'],
  criminology: ['social_sciences', 'law'],
  cybersecurity: ['technology'],
  'data science': ['technology', 'science'],
  design: ['arts_media'],
  'digital media': ['arts_media', 'technology'],
  'early childhood education': ['education'],
  'earth science': ['science'],
  economics: ['business', 'social_sciences'],
  education: ['education'],
  'electrical engineering': ['engineering', 'technology'],
  'elementary education': ['education'],
  english: ['arts_media', 'education'],
  entrepreneurship: ['business'],
  environmental: ['science', 'public_policy'],
  'environmental engineering': ['engineering', 'science', 'public_policy'],
  'environmental science': ['science', 'public_policy'],
  'exercise science': ['healthcare', 'science'],
  'film studies': ['arts_media'],
  finance: ['business'],
  'fine arts': ['arts_media'],
  'food science': ['agriculture', 'science'],
  'foreign language': ['arts_media', 'education'],
  forestry: ['agriculture', 'science'],
  geography: ['science', 'social_sciences', 'public_policy'],
  healthcare: ['healthcare'],
  'health administration': ['healthcare', 'business'],
  'health science': ['healthcare', 'science'],
  history: ['social_sciences', 'education'],
  hospitality: ['hospitality', 'business'],
  'human resources': ['business'],
  'human services': ['social_sciences', 'healthcare'],
  'industrial engineering': ['engineering', 'business'],
  informatics: ['technology', 'healthcare'],
  'information systems': ['technology', 'business'],
  'information technology': ['technology'],
  'international business': ['business', 'social_sciences'],
  'international relations': ['public_policy', 'social_sciences'],
  journalism: ['arts_media'],
  kinesiology: ['healthcare', 'science'],
  law: ['law'],
  'legal studies': ['law', 'social_sciences'],
  linguistics: ['social_sciences', 'arts_media'],
  management: ['business'],
  marketing: ['business', 'arts_media'],
  'materials science': ['science', 'engineering'],
  mathematics: ['science', 'technology'],
  'mechanical engineering': ['engineering'],
  media: ['arts_media'],
  'medical laboratory science': ['healthcare', 'science'],
  'middle grades education': ['education'],
  music: ['arts_media'],
  nursing: ['healthcare'],
  nutrition: ['healthcare', 'science'],
  philosophy: ['social_sciences'],
  physics: ['science', 'engineering'],
  'political science': ['public_policy', 'social_sciences'],
  'pre law': ['law'],
  'pre med': ['healthcare', 'science'],
  psychology: ['social_sciences', 'healthcare'],
  'public health': ['healthcare', 'public_policy'],
  'public policy': ['public_policy', 'social_sciences'],
  'public relations': ['arts_media', 'business'],
  'secondary education': ['education'],
  'social work': ['social_sciences', 'healthcare'],
  sociology: ['social_sciences'],
  software: ['technology'],
  'software engineering': ['technology', 'engineering'],
  'special education': ['education'],
  'sport management': ['business', 'hospitality'],
  statistics: ['science', 'technology'],
  supply: ['business'],
  'supply chain': ['business'],
  'supply chain management': ['business'],
  theatre: ['arts_media'],
  tourism: ['hospitality', 'business'],
  'urban planning': ['public_policy', 'engineering'],
  'veterinary science': ['healthcare', 'agriculture', 'science'],
  'visual arts': ['arts_media'],
  'web development': ['technology'],
  'wildlife science': ['agriculture', 'science']
};

export function normalizeAcademicText(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function deriveAcademicFieldIds(value: string | undefined): AcademicFieldId[] {
  const normalized = normalizeAcademicText(value);

  if (!normalized) {
    return [];
  }

  const exact = majorFieldMappings[normalized];

  if (exact) {
    return exact;
  }

  const matched = Object.entries(majorFieldMappings).find(([major]) => normalized.includes(major) || major.includes(normalized));
  return matched?.[1] ?? [];
}

export function getAcademicFieldLabel(fieldId: AcademicFieldId | undefined) {
  return academicFields.find((field) => field.id === fieldId)?.label ?? 'General';
}
