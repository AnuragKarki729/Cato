// Static content pools + small helpers used to build varied dummy applicants.
// Nothing here talks to the DB or the network — it is pure data generation.

const FIRST_NAMES = [
  'Ava', 'Liam', 'Maya', 'Noah', 'Zoe', 'Ethan', 'Priya', 'Diego', 'Sofia', 'Kai',
  'Amara', 'Leo', 'Nina', 'Omar', 'Grace', 'Ravi', 'Chloe', 'Marcus', 'Yara', 'Tao'
];

const LAST_NAMES = [
  'Chen', 'Patel', 'Rodriguez', 'Kim', 'Okafor', 'Nguyen', 'Silva', 'Haddad', 'Johnson',
  'Ivanova', 'Ali', 'Garcia', 'Mensah', 'Novak', 'Reyes', 'Sato', 'Bauer', 'Kowalski'
];

const UNIVERSITIES = [
  { name: 'Stanford University', unitId: '243744', emailDomain: 'stanford.edu' },
  { name: 'Massachusetts Institute of Technology', unitId: '166683', emailDomain: 'mit.edu' },
  { name: 'University of California, Berkeley', unitId: '110635', emailDomain: 'berkeley.edu' },
  { name: 'Georgia Institute of Technology', unitId: '139755', emailDomain: 'gatech.edu' },
  { name: 'University of Michigan', unitId: '170976', emailDomain: 'umich.edu' },
  { name: 'University of Texas at Austin', unitId: '228778', emailDomain: 'utexas.edu' },
  { name: 'Carnegie Mellon University', unitId: '211440', emailDomain: 'cmu.edu' },
  { name: 'University of Washington', unitId: '236948', emailDomain: 'uw.edu' },
  { name: 'New York University', unitId: '193900', emailDomain: 'nyu.edu' },
  { name: 'University of Illinois Urbana-Champaign', unitId: '145637', emailDomain: 'illinois.edu' }
];

const MAJORS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Data Science',
  'Business Administration', 'Economics', 'Cognitive Science', 'Industrial Design',
  'Marketing', 'Biomedical Engineering', 'Statistics', 'Information Systems',
  'Finance', 'Human-Computer Interaction'
];

const MINORS = [
  undefined, undefined, 'Mathematics', 'Psychology', 'Entrepreneurship',
  'Design', 'Public Policy', 'Philosophy', 'Music'
];

const SEMESTERS = [
  { label: 'Sophomore — 3rd semester', number: 3 },
  { label: 'Sophomore — 4th semester', number: 4 },
  { label: 'Junior — 5th semester', number: 5 },
  { label: 'Junior — 6th semester', number: 6 },
  { label: 'Senior — 7th semester', number: 7 },
  { label: 'Senior — 8th semester', number: 8 }
];

const COMPANIES = [
  'Stripe', 'Notion', 'Figma', 'Databricks', 'Ramp', 'Vercel', 'Anthropic', 'Airtable',
  'Local Robotics Lab', 'City Health Startup', 'Retool', 'Plaid', 'Scale AI', 'Rivian'
];

const ROLE_DEPARTMENTS = [
  'Engineering', 'Product', 'Data', 'Engineering',
  'Marketing', 'Design', 'Operations', 'Research', 'Finance'
];

// Signal prompts snapshot — these mirror the kind of prompt an applicant selects
// during onboarding. Stored as a snapshot on the signal document.
const SIGNAL_PROMPTS = [
  { id: 'technology:1', fieldId: 'technology', fieldLabel: 'Technology', text: 'What technology should be simpler?' },
  { id: 'business:1', fieldId: 'business', fieldLabel: 'Business', text: 'What makes a customer trust a product?' },
  { id: 'engineering:1', fieldId: 'engineering', fieldLabel: 'Engineering', text: 'What design tradeoff do people ignore?' },
  { id: 'arts_media:1', fieldId: 'arts_media', fieldLabel: 'Arts & Media', text: 'What story deserves to be told better?' },
  { id: 'science:1', fieldId: 'science', fieldLabel: 'Science', text: 'What question would you keep testing?' },
  { id: 'general:1', fieldId: 'general', fieldLabel: 'General', text: "What's your hot take?" }
];

const ELABORATIONS = [
  'I led a two-person team to ship a campus food-waste tracker used by 400 students.',
  'I rewrote our lab data pipeline and cut processing time from hours to minutes.',
  'I organized a 90-person hackathon and mentored five first-time teams to demo day.',
  'I am obsessed with distributed systems and built a toy Raft implementation for fun.',
  'I shipped an accessibility overhaul that unblocked screen-reader users on our app.',
  'My first startup failed, but it taught me how to talk to users before writing code.'
];

const SOFT_SKILL_LABELS = [
  'Communication', 'Leadership', 'Problem Solving', 'Adaptability', 'Collaboration',
  'Initiative', 'Attention to Detail', 'Resilience', 'Creativity', 'Time Management'
];

const SOFT_SKILL_EVIDENCE = [
  'Clearly articulated tradeoffs and kept stakeholders aligned.',
  'Stepped up to coordinate the team under a tight deadline.',
  'Broke an ambiguous problem into a concrete, testable plan.',
  'Adjusted quickly when requirements changed mid-project.',
  'Actively unblocked teammates and shared credit.',
  'Proposed and drove an improvement without being asked.',
  'Caught subtle edge cases others missed.',
  'Kept momentum after an early setback.'
];

const CONFIDENCE = ['low', 'medium', 'high'];

const FIELD_MAPPINGS = {
  'business administration': ['business'],
  'biomedical engineering': ['engineering', 'healthcare'],
  'cognitive science': ['science', 'technology', 'social_sciences'],
  'computer science': ['technology', 'engineering'],
  'data science': ['technology', 'science'],
  design: ['arts_media'],
  economics: ['business', 'social_sciences'],
  'electrical engineering': ['engineering', 'technology'],
  entrepreneurship: ['business'],
  finance: ['business'],
  'human computer interaction': ['technology', 'arts_media'],
  'industrial design': ['arts_media', 'engineering'],
  'information systems': ['technology', 'business'],
  marketing: ['business', 'arts_media'],
  mathematics: ['science', 'technology'],
  'mechanical engineering': ['engineering'],
  music: ['arts_media'],
  philosophy: ['social_sciences'],
  psychology: ['social_sciences', 'healthcare'],
  'public policy': ['public_policy', 'social_sciences'],
  statistics: ['science', 'technology']
};

const PROJECT_TYPES = ['built_project', 'research', 'thesis', 'video', 'writing', 'other'];
const PROJECT_TITLES = [
  'Campus Food Waste Tracker',
  'Dorm Energy Dashboard',
  'Student Mental Health Survey',
  'Portfolio Redesign',
  'Robotics Lab Demo',
  'Local Business Analytics Report',
  'Senior Thesis Prototype',
  'YouTube Explainer Series'
];
const PROJECT_DESCRIPTIONS = [
  'Built a working prototype and tested it with classmates.',
  'Published a short walkthrough showing the process and results.',
  'Analyzed messy data and turned it into a clear recommendation.',
  'Led research, interviews, and a final presentation.',
  'Designed the experience, shipped a demo, and gathered feedback.'
];

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN(rng, arr, n) {
  const pool = [...arr];
  const out = [];
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

// Deterministic-ish PRNG so a given seed produces repeatable variety.
export function makeRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function round(value, digits) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function normalizeAcademicText(value) {
  return value?.trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function deriveFieldIds(value) {
  const normalized = normalizeAcademicText(value);

  if (!normalized) return [];

  const exact = FIELD_MAPPINGS[normalized];
  if (exact) return exact;

  const match = Object.entries(FIELD_MAPPINGS).find(([major]) => normalized.includes(major) || major.includes(normalized));
  return match?.[1] ?? [];
}

// Builds one applicant's full logical profile (not yet persisted). Media assets
// (videos, resume) are injected later by the seed script.
export function buildApplicantProfile(index, rng) {
  const first = pick(rng, FIRST_NAMES);
  const last = pick(rng, LAST_NAMES);
  const name = `${first} ${last}`;
  const university = pick(rng, UNIVERSITIES);
  const semester = pick(rng, SEMESTERS);
  const major = pick(rng, MAJORS);
  const minor = pick(rng, MINORS);
  const gpa = round(2.6 + rng() * 1.4, 2); // 2.60 - 4.00
  const prompt = pick(rng, SIGNAL_PROMPTS);

  // Vary who has internships (some have 0), and who has a 30s deeper signal.
  const internshipCount = pick(rng, [0, 1, 1, 2, 2, 3]);
  const internships = Array.from({ length: internshipCount }, () => ({
    company: pick(rng, COMPANIES),
    durationMonths: pick(rng, [2, 3, 4, 6, 8, 12]),
    roleDepartment: pick(rng, ROLE_DEPARTMENTS)
  }));

  // The 10s signal video is mandatory for every applicant. The 30s deeper
  // signal and the resume are both optional and vary across the seed set.
  const hasThirtySecond = rng() < 0.55;
  const hasResume = rng() < 0.6;
  const projectCount = pick(rng, [0, 0, 1, 1, 2, 3]);
  const projects = Array.from({ length: projectCount }, () => ({
    title: pick(rng, PROJECT_TITLES),
    type: pick(rng, PROJECT_TYPES),
    description: pick(rng, PROJECT_DESCRIPTIONS),
    linkUrl: rng() < 0.55 ? `https://example.com/cato-seed/${slugify(name)}-${Math.floor(rng() * 10000)}` : undefined
  }));

  const skillCount = 3 + Math.floor(rng() * 3); // 3-5 skills
  const softSkills = pickN(rng, SOFT_SKILL_LABELS, skillCount).map((label) => ({
    label,
    rating: 3 + Math.floor(rng() * 3), // 3-5
    evidence: pick(rng, SOFT_SKILL_EVIDENCE),
    confidence: pick(rng, CONFIDENCE)
  }));

  const emailSlug = `${slugify(first)}.${slugify(last)}.${index}`;

  return {
    index,
    name,
    emailSlug,
    university,
    education: {
      universityUnitId: university.unitId,
      universityName: university.name,
      universityMatchedFromEmail: rng() < 0.7,
      semesterLabel: semester.label,
      semesterNumber: semester.number,
      gpa,
      major,
      majorFieldIds: deriveFieldIds(major),
      minor,
      minorFieldIds: deriveFieldIds(minor)
    },
    internships,
    projects,
    signal: {
      promptId: prompt.id,
      promptFieldId: prompt.fieldId,
      promptFieldLabel: prompt.fieldLabel,
      promptTextSnapshot: prompt.text,
      tenSecondElaboration: pick(rng, ELABORATIONS),
      hasThirtySecond
    },
    hasResume,
    softSkills
  };
}
