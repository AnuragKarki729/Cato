import type { ApplicantSignalDocument } from '../repositories/signals.repo.js';

type SoftSkillItem = {
  label: string;
  rating: number;
  evidence: string;
  confidence: 'low' | 'medium' | 'high';
};

type Trait = {
  label: string;
  tier: 'baseline' | 'mid' | 'high';
};

const traits: Trait[] = [
  { label: 'Communication', tier: 'baseline' },
  { label: 'Authenticity', tier: 'baseline' },
  { label: 'Empathy', tier: 'baseline' },
  { label: 'Curiosity', tier: 'baseline' },
  { label: 'Presence', tier: 'baseline' },
  { label: 'Warmth', tier: 'baseline' },
  { label: 'Composure', tier: 'baseline' },
  { label: 'Self awareness', tier: 'baseline' },
  { label: 'Drive', tier: 'baseline' },
  { label: 'Listening', tier: 'baseline' },
  { label: 'Reliability', tier: 'baseline' },
  { label: 'Humility', tier: 'baseline' },
  { label: 'Resilience', tier: 'mid' },
  { label: 'Flexibility', tier: 'mid' },
  { label: 'Inclusivity', tier: 'mid' },
  { label: 'Open mindedness', tier: 'mid' },
  { label: 'Consistency', tier: 'mid' },
  { label: 'Thoughtfulness', tier: 'mid' },
  { label: 'Patience', tier: 'mid' },
  { label: 'Professionalism', tier: 'mid' },
  { label: 'Confidence', tier: 'mid' },
  { label: 'Ownership', tier: 'mid' },
  { label: 'Positivity', tier: 'mid' },
  { label: 'Perspective', tier: 'mid' },
  { label: 'Adaptability', tier: 'high' },
  { label: 'Collaboration', tier: 'high' },
  { label: 'Critical thinking', tier: 'high' },
  { label: 'Creativity', tier: 'high' },
  { label: 'Leadership', tier: 'high' },
  { label: 'Discernment', tier: 'high' },
  { label: 'Resourcefulness', tier: 'high' },
  { label: 'Strategic thinking', tier: 'high' },
  { label: 'Problem solving', tier: 'high' },
  { label: 'Influence', tier: 'high' },
  { label: 'Decision making', tier: 'high' },
  { label: 'Originality', tier: 'high' }
];

const praiseByBand = {
  steady: [
    'Shows a steady presence with room to grow.',
    'Comes across as grounded and fairly clear.',
    'Leaves a sincere impression with early promise.',
    'Shows a thoughtful start with some definition.',
    'Feels measured, genuine, and quietly promising.',
    'Hints at a reliable style and mindset.',
    'Reads as sincere with growing self-awareness.',
    'Shows enough signal to feel directionally strong.',
    'Carries a calm tone with clear intent.',
    'Feels open, steady, and reasonably self-possessed.',
    'Shows potential through a composed first impression.',
    'Signals a real trait with modest depth.',
    'Feels authentic with some room for range.',
    'Shows early consistency in how they present.',
    'Leaves a balanced impression with visible effort.'
  ],
  strong: [
    'Shows a confident style with clear personal intent.',
    'Comes across as thoughtful, clear, and engaged.',
    'Builds a strong impression with steady substance.',
    'Makes this trait feel easy to recognize.',
    'Shows good range with a composed perspective.',
    'Feels clear, present, and meaningfully intentional.',
    'Leaves a polished impression with real substance.',
    'Presents a trait that feels genuinely developed.',
    'Shows a mature tone with useful self-direction.',
    'Feels engaged and comfortable sharing perspective.',
    'Creates a strong read on how they operate.',
    'Shows consistency backed by real personal clarity.',
    'Feels deliberate without sounding overly rehearsed.',
    'Carries confidence in a balanced, appealing way.',
    'Shows a solid signal with thoughtful follow-through.'
  ],
  standout: [
    'Creates a standout impression with depth and voice.',
    'Shows unusual completeness, presence, and follow-through.',
    'Feels memorable, assured, and distinctly well formed.',
    'Reads as thoughtful, composed, and notably distinctive.',
    'Shows uncommon clarity with a strong personal center.',
    'Carries impressive polish without losing authenticity.',
    'Feels deeply intentional and easy to remember.',
    'Shows strong perspective with natural, confident presence.',
    'Leaves a rich impression with clear conviction.',
    'Feels highly developed while staying personally grounded.',
    'Shows standout clarity paired with personal warmth.',
    'Reads as confident, reflective, and notably compelling.',
    'Leaves a refined impression with real individuality.',
    'Shows strong follow-through and distinctive self-possession.',
    'Feels both polished and naturally self-aware.'
  ]
} as const;

export function generateDummySoftSkills(seed: string) {
  return buildSoftSkills(seed, 3);
}

export function generateSoftSkillsFromSignal(seed: string, signal?: ApplicantSignalDocument | null) {
  const effortScore = calculateEffortScore(signal);
  const selectedTraits = selectTraits(seed, effortScore);
  const lowestEffort = isLowestEffort(signal);

  return selectedTraits.map((trait, index) => {
    const rating = ratingForEffort(seed, effortScore, index, lowestEffort);

    return {
      label: trait.label,
      rating,
      evidence: praiseForRating(seed, trait.label, rating),
      confidence: confidenceForRating(rating)
    };
  });
}

function buildSoftSkills(seed: string, baselineRating: number): SoftSkillItem[] {
  return selectTraits(seed, 0).map((trait, index) => {
    const rating = clampRating(baselineRating + (stableNumber(`${seed}:${index}`) % 2) * 0.5);

    return {
      label: trait.label,
      rating,
      evidence: praiseForRating(seed, trait.label, rating),
      confidence: confidenceForRating(rating)
    };
  });
}

function calculateEffortScore(signal?: ApplicantSignalDocument | null) {
  const tenSecondDuration = signal?.tenSecondVideo?.durationSeconds ?? 0;
  const elaborationLength = signal?.tenSecondElaboration?.trim().length ?? 0;
  const thirtySecondDuration = signal?.thirtySecondVideo?.durationSeconds ?? 0;

  let score = 0;

  if (tenSecondDuration >= 2) {
    score += 1;
  }

  if (tenSecondDuration > 6) {
    score += 2;
  }

  if (elaborationLength >= 20) {
    score += 1;
  }

  if (elaborationLength > 50) {
    score += 2;
  }

  if (thirtySecondDuration > 0) {
    score += 1;
  }

  if (thirtySecondDuration > 10) {
    score += 2;
  }

  if (thirtySecondDuration > 15) {
    score += 2;
  }

  return Math.min(score, 10);
}

function selectTraits(seed: string, effortScore: number) {
  const allowedTiers =
    effortScore >= 8 ? ['baseline', 'mid', 'high'] : effortScore >= 5 ? ['baseline', 'mid'] : ['baseline'];
  const pool = traits.filter((trait) => allowedTiers.includes(trait.tier));
  const shuffled = [...pool].sort((left, right) => stableNumber(`${seed}:${left.label}`) - stableNumber(`${seed}:${right.label}`));

  return shuffled.slice(0, 4);
}

function isLowestEffort(signal?: ApplicantSignalDocument | null) {
  const tenSecondDuration = signal?.tenSecondVideo?.durationSeconds ?? 0;
  const elaborationLength = signal?.tenSecondElaboration?.trim().length ?? 0;
  const thirtySecondSkipped = signal?.thirtySecondVideoSkipped === true && !signal?.thirtySecondVideo;

  return tenSecondDuration < 5 && elaborationLength < 50 && thirtySecondSkipped;
}

function ratingForEffort(seed: string, effortScore: number, index: number, lowestEffort: boolean) {
  const normalFloor = lowestEffort ? 2.5 : 3.5;
  const base = lowestEffort ? 2.5 : effortScore >= 8 ? 4 : effortScore >= 5 ? 3.75 : 3.5;
  const spread = [-0.25, 0.25, 0.75, 0.5][index % 4];
  const jitter = ((stableNumber(`${seed}:rating:${index}`) % 3) - 1) * 0.25;
  const raw = base + spread + jitter;

  return clampRating(roundToHalf(Math.min(5, Math.max(normalFloor, raw))));
}

function praiseForRating(seed: string, traitLabel: string, rating: number) {
  const band = rating >= 5 ? praiseByBand.standout : rating >= 4 ? praiseByBand.strong : praiseByBand.steady;
  const index = stableNumber(`${seed}:${traitLabel}:${rating}`) % band.length;

  return band[index];
}

function confidenceForRating(rating: number): 'low' | 'medium' | 'high' {
  if (rating >= 5) {
    return 'high';
  }

  if (rating >= 4) {
    return 'medium';
  }

  return 'low';
}

function clampRating(value: number) {
  return Math.min(5, Math.max(1, value));
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function stableNumber(seed: string) {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}
