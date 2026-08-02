type University = {
  unitId: string;
  name: string;
  aliases: string[];
  domains: string[];
  city: string;
  state: string;
  normalizedSearchText: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function university(input: Omit<University, 'normalizedSearchText'>): University {
  return {
    ...input,
    normalizedSearchText: normalize([
      input.name,
      ...input.aliases,
      ...input.domains,
      input.city,
      input.state
    ].join(' '))
  };
}

export const universities = [
  university({
    unitId: '166027',
    name: 'Harvard University',
    aliases: ['Harvard'],
    domains: ['harvard.edu'],
    city: 'Cambridge',
    state: 'MA'
  }),
  university({
    unitId: '243744',
    name: 'Stanford University',
    aliases: ['Stanford'],
    domains: ['stanford.edu'],
    city: 'Stanford',
    state: 'CA'
  }),
  university({
    unitId: '110635',
    name: 'University of California, Berkeley',
    aliases: ['UC Berkeley', 'Berkeley', 'Cal'],
    domains: ['berkeley.edu'],
    city: 'Berkeley',
    state: 'CA'
  }),
  university({
    unitId: '110662',
    name: 'University of California, Los Angeles',
    aliases: ['UCLA'],
    domains: ['ucla.edu'],
    city: 'Los Angeles',
    state: 'CA'
  }),
  university({
    unitId: '193900',
    name: 'New York University',
    aliases: ['NYU'],
    domains: ['nyu.edu'],
    city: 'New York',
    state: 'NY'
  }),
  university({
    unitId: '186131',
    name: 'Princeton University',
    aliases: ['Princeton'],
    domains: ['princeton.edu'],
    city: 'Princeton',
    state: 'NJ'
  }),
  university({
    unitId: '215062',
    name: 'University of Pennsylvania',
    aliases: ['UPenn', 'Penn'],
    domains: ['upenn.edu'],
    city: 'Philadelphia',
    state: 'PA'
  }),
  university({
    unitId: '190150',
    name: 'Columbia University in the City of New York',
    aliases: ['Columbia University', 'Columbia'],
    domains: ['columbia.edu'],
    city: 'New York',
    state: 'NY'
  })
];

export function normalizeUniversitySearch(value: string) {
  return normalize(value);
}
