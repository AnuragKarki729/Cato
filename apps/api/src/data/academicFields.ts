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

export const academicFields: Array<{ id: AcademicFieldId; label: string }> = [
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
];

const majorFieldMappings: Record<string, AcademicFieldId[]> = {
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

export const signalPromptCategories: Array<{ fieldId: AcademicFieldId; label: string; prompts: string[] }> = [
  {
    fieldId: 'general',
    label: 'General',
    prompts: [
      "What's your hot take?",
      "What's a hill you'd die on?",
      "What's something people misunderstand about you?",
      "What's a problem you love solving?",
      "What's a rule you think should be broken?",
      "What's a moment that changed how you work?"
    ]
  },
  { fieldId: 'business', label: 'Business', prompts: ['What makes a customer trust a product?', 'What business problem do you notice everywhere?', 'What is one market trend people miss?', 'What makes a team worth investing in?', 'What makes a brand feel honest?'] },
  { fieldId: 'technology', label: 'Technology', prompts: ['What technology should be simpler?', 'What product experience frustrates you?', 'What system would you rebuild from scratch?', 'What makes software feel trustworthy?', 'What technical problem keeps your attention?'] },
  { fieldId: 'engineering', label: 'Engineering', prompts: ['What design tradeoff do people ignore?', 'What real-world system fascinates you?', 'What should be built more carefully?', 'What constraint makes work more interesting?', 'What failure taught you better judgment?'] },
  { fieldId: 'healthcare', label: 'Healthcare', prompts: ['What makes care feel human?', 'What health problem deserves more attention?', 'What does patient trust depend on?', 'What would make healthcare less confusing?', 'What does compassion look like under pressure?'] },
  { fieldId: 'arts_media', label: 'Arts & Media', prompts: ['What story deserves to be told better?', 'What makes creative work feel original?', 'What audience do people misunderstand?', 'What visual detail changes everything?', 'What message would you redesign?'] },
  { fieldId: 'education', label: 'Education', prompts: ['What makes learning actually stick?', 'What would you change about classrooms?', 'What does a great mentor notice?', 'What skill should schools teach earlier?', 'What makes feedback useful?'] },
  { fieldId: 'social_sciences', label: 'Social Sciences', prompts: ['What human behavior fascinates you?', 'What social assumption feels outdated?', 'What makes a community work?', 'What conflict do people oversimplify?', 'What perspective changed how you listen?'] },
  { fieldId: 'science', label: 'Science', prompts: ['What question would you keep testing?', 'What discovery changed how you think?', 'What pattern do people overlook?', 'What evidence would change your mind?', 'What natural system fascinates you?'] },
  { fieldId: 'public_policy', label: 'Public Policy', prompts: ['What public problem feels solvable?', 'What rule would you redesign?', 'What does fairness require in practice?', 'What community need is underestimated?', 'What policy tradeoff deserves honesty?'] },
  { fieldId: 'law', label: 'Law', prompts: ['What makes an argument persuasive?', 'What does accountability look like?', 'What rule protects people well?', 'What conflict needs better structure?', 'What does justice require from process?'] },
  { fieldId: 'hospitality', label: 'Hospitality', prompts: ['What makes someone feel welcomed?', 'What service detail matters most?', 'What experience would you improve?', 'What does calm under pressure mean?', 'What makes a guest trust you?'] },
  { fieldId: 'agriculture', label: 'Agriculture', prompts: ['What food system problem matters most?', 'What does sustainability mean practically?', 'What resource should be used wiser?', 'What field problem deserves technology?', 'What makes local systems resilient?'] }
];

function normalizeAcademicText(value: string | undefined) {
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
