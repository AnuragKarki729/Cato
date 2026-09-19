import type { Db, ObjectId } from 'mongodb';
import { academicFields } from '../data/academicFields.js';
import {
  findCustomMatchingOptions,
  normalizeMatchingOptionKey,
  serializeMatchingOption,
  upsertCustomMatchingOption
} from '../repositories/matchingOptions.repo.js';
import type { MatchingOptionDocument, MatchingOptionType } from '../repositories/matchingOptions.repo.js';

const extraCategoryLabels = [
  'Finance',
  'Accounting',
  'Sales',
  'Marketing',
  'Operations',
  'Product',
  'Design',
  'Data',
  'Cybersecurity',
  'Artificial Intelligence',
  'Human Resources',
  'Supply Chain',
  'Consulting',
  'Customer Success',
  'Real Estate',
  'Nonprofit',
  'Research',
  'Sustainability',
  'Entrepreneurship',
  'Communications',
  'Journalism',
  'UX Research',
  'Software Engineering',
  'Data Science',
  'Business Analytics'
];

const skillLabels = [
  'Python',
  'SQL',
  'React',
  'AWS',
  'JavaScript',
  'TypeScript',
  'Java',
  'C++',
  'C#',
  'Swift',
  'Kotlin',
  'Node.js',
  'Express',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'Docker',
  'Kubernetes',
  'Git',
  'REST APIs',
  'GraphQL',
  'HTML',
  'CSS',
  'Tailwind',
  'React Native',
  'iOS',
  'Android',
  'Firebase',
  'Supabase',
  'Excel',
  'Google Sheets',
  'Tableau',
  'Power BI',
  'Figma',
  'Adobe Photoshop',
  'Adobe Illustrator',
  'Canva',
  'Accounting',
  'Financial Modeling',
  'Bookkeeping',
  'QuickBooks',
  'Sales',
  'CRM',
  'HubSpot',
  'Salesforce',
  'Marketing',
  'SEO',
  'Content Strategy',
  'Copywriting',
  'Market Research',
  'User Research',
  'UX Design',
  'UI Design',
  'Product Management',
  'Project Management',
  'Agile',
  'Scrum',
  'Data Analysis',
  'Statistics',
  'Machine Learning',
  'Research',
  'Technical Writing',
  'Public Speaking',
  'Customer Support',
  'Operations',
  'Supply Chain',
  'Inventory Management',
  'Clinical Research',
  'Laboratory Skills',
  'Teaching',
  'Curriculum Design',
  'Policy Analysis',
  'Legal Research'
];

function createBuiltinOption(type: MatchingOptionType, label: string): MatchingOptionDocument & { builtin: true } {
  const now = new Date(0);

  return {
    type,
    key: normalizeMatchingOptionKey(label),
    label,
    usageCount: 0,
    builtin: true,
    createdAt: now,
    updatedAt: now
  };
}

const builtinOptions = [
  ...academicFields.map((field) => createBuiltinOption('category', field.label)),
  ...extraCategoryLabels.map((label) => createBuiltinOption('category', label)),
  ...skillLabels.map((label) => createBuiltinOption('skill', label))
];

function optionMatchesQuery(option: MatchingOptionDocument, query: string | undefined) {
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return option.label.toLowerCase().includes(normalizedQuery) || option.key.toLowerCase().includes(normalizedQuery.replace(/\s+/g, '_'));
}

export async function listMatchingOptions(db: Db, input: { type?: MatchingOptionType; q?: string; limit?: number }) {
  const customOptions = await findCustomMatchingOptions(db, input.type);
  const builtinByKey = new Map(
    builtinOptions
      .filter((option) => !input.type || option.type === input.type)
      .map((option) => [`${option.type}:${option.key}`, option])
  );
  const merged = [
    ...customOptions.map((option) => ({ ...option, builtin: false })),
    ...Array.from(builtinByKey.values()).filter(
      (builtin) => !customOptions.some((custom) => custom.type === builtin.type && custom.key === builtin.key)
    )
  ]
    .filter((option) => optionMatchesQuery(option, input.q))
    .sort((left, right) => {
      const query = input.q?.trim().toLowerCase();

      if (query) {
        const leftStarts = left.label.toLowerCase().startsWith(query) ? 1 : 0;
        const rightStarts = right.label.toLowerCase().startsWith(query) ? 1 : 0;

        if (leftStarts !== rightStarts) {
          return rightStarts - leftStarts;
        }
      }

      return Number(right.builtin) - Number(left.builtin) || right.usageCount - left.usageCount || left.label.localeCompare(right.label);
    })
    .slice(0, Math.max(1, Math.min(100, input.limit ?? 50)));

  return merged.map(serializeMatchingOption);
}

export async function addMatchingOption(db: Db, input: { type: MatchingOptionType; label: string; recruiterId?: ObjectId }) {
  const key = normalizeMatchingOptionKey(input.label);
  const builtin = builtinOptions.find((option) => option.type === input.type && option.key === key);

  if (builtin) {
    return serializeMatchingOption(builtin);
  }

  const option = await upsertCustomMatchingOption(db, {
    type: input.type,
    label: input.label,
    addedByRecruiterId: input.recruiterId
  });

  return serializeMatchingOption(option);
}
