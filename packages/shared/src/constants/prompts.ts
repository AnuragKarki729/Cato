import type { AcademicFieldId } from './academicFields';

export type SignalPromptCategory = {
  fieldId: AcademicFieldId;
  label: string;
  prompts: readonly string[];
};

export const signalPromptCategories: SignalPromptCategory[] = [
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
  {
    fieldId: 'business',
    label: 'Business',
    prompts: [
      'What makes a customer trust a product?',
      'What business problem do you notice everywhere?',
      'What is one market trend people miss?',
      'What makes a team worth investing in?',
      'What makes a brand feel honest?'
    ]
  },
  {
    fieldId: 'technology',
    label: 'Technology',
    prompts: [
      'What technology should be simpler?',
      'What product experience frustrates you?',
      'What system would you rebuild from scratch?',
      'What makes software feel trustworthy?',
      'What technical problem keeps your attention?'
    ]
  },
  {
    fieldId: 'engineering',
    label: 'Engineering',
    prompts: [
      'What design tradeoff do people ignore?',
      'What real-world system fascinates you?',
      'What should be built more carefully?',
      'What constraint makes work more interesting?',
      'What failure taught you better judgment?'
    ]
  },
  {
    fieldId: 'healthcare',
    label: 'Healthcare',
    prompts: [
      'What makes care feel human?',
      'What health problem deserves more attention?',
      'What does patient trust depend on?',
      'What would make healthcare less confusing?',
      'What does compassion look like under pressure?'
    ]
  },
  {
    fieldId: 'arts_media',
    label: 'Arts & Media',
    prompts: [
      'What story deserves to be told better?',
      'What makes creative work feel original?',
      'What audience do people misunderstand?',
      'What visual detail changes everything?',
      'What message would you redesign?'
    ]
  },
  {
    fieldId: 'education',
    label: 'Education',
    prompts: [
      'What makes learning actually stick?',
      'What would you change about classrooms?',
      'What does a great mentor notice?',
      'What skill should schools teach earlier?',
      'What makes feedback useful?'
    ]
  },
  {
    fieldId: 'social_sciences',
    label: 'Social Sciences',
    prompts: [
      'What human behavior fascinates you?',
      'What social assumption feels outdated?',
      'What makes a community work?',
      'What conflict do people oversimplify?',
      'What perspective changed how you listen?'
    ]
  },
  {
    fieldId: 'science',
    label: 'Science',
    prompts: [
      'What question would you keep testing?',
      'What discovery changed how you think?',
      'What pattern do people overlook?',
      'What evidence would change your mind?',
      'What natural system fascinates you?'
    ]
  },
  {
    fieldId: 'public_policy',
    label: 'Public Policy',
    prompts: [
      'What public problem feels solvable?',
      'What rule would you redesign?',
      'What does fairness require in practice?',
      'What community need is underestimated?',
      'What policy tradeoff deserves honesty?'
    ]
  },
  {
    fieldId: 'law',
    label: 'Law',
    prompts: [
      'What makes an argument persuasive?',
      'What does accountability look like?',
      'What rule protects people well?',
      'What conflict needs better structure?',
      'What does justice require from process?'
    ]
  },
  {
    fieldId: 'hospitality',
    label: 'Hospitality',
    prompts: [
      'What makes someone feel welcomed?',
      'What service detail matters most?',
      'What experience would you improve?',
      'What does calm under pressure mean?',
      'What makes a guest trust you?'
    ]
  },
  {
    fieldId: 'agriculture',
    label: 'Agriculture',
    prompts: [
      'What food system problem matters most?',
      'What does sustainability mean practically?',
      'What resource should be used wiser?',
      'What field problem deserves technology?',
      'What makes local systems resilient?'
    ]
  }
];

export const defaultSignalPrompts = signalPromptCategories[0].prompts;
