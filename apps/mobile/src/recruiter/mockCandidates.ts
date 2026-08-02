export type RecruiterCandidate = {
  id: string;
  name: string;
  role: string;
  university: string;
  location: string;
  major: string;
  gpa: string;
  signalPrompt: string;
  signalSummary: string;
  thumbnailUrl: string;
  skills: Array<{
    label: string;
    rating: number;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
};

export const recruiterCandidates: RecruiterCandidate[] = [
  {
    id: 'hira-riaz',
    name: 'Hira Riaz',
    role: 'UX/UI Designer',
    university: 'UC Berkeley',
    location: 'San Francisco, CA',
    major: 'Design',
    gpa: '3.8',
    signalPrompt: "What's a problem you love solving?",
    signalSummary: 'Clear communicator with strong product instincts and a calm, structured presence on video.',
    thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/w_480,h_480,c_fill,g_face/sample.jpg',
    skills: [
      { label: 'Communication', rating: 5 },
      { label: 'Authenticity', rating: 4 },
      { label: 'Adaptability', rating: 4 }
    ],
    experience: [
      { title: 'UX Designer', company: 'HeadSpring', duration: 'Jan 2023 - Present' },
      { title: 'Junior UX Designer', company: 'NordCode', duration: 'Jun 2022 - Dec 2022' }
    ]
  },
  {
    id: 'marcus-lee',
    name: 'Marcus Lee',
    role: 'Product Manager',
    university: 'UCLA',
    location: 'Los Angeles, CA',
    major: 'Business Analytics',
    gpa: '3.7',
    signalPrompt: "What's your hot take?",
    signalSummary: 'Strong prioritization mindset with confident storytelling and clear ownership signals.',
    thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/w_480,h_480,c_fill,g_face/face_left.png',
    skills: [
      { label: 'Leadership', rating: 5 },
      { label: 'Promptness', rating: 4 },
      { label: 'Collaboration', rating: 4 }
    ],
    experience: [{ title: 'Product Intern', company: 'Northstar Labs', duration: '4 months' }]
  },
  {
    id: 'sofia-martinez',
    name: 'Sofia Martinez',
    role: 'Data Analyst',
    university: 'USC',
    location: 'Los Angeles, CA',
    major: 'Data Science',
    gpa: '3.9',
    signalPrompt: "What's a hill you'd die on?",
    signalSummary: 'Analytical, concise, and unusually good at translating technical ideas for non-technical teams.',
    thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/w_480,h_480,c_fill,g_face/woman.jpg',
    skills: [
      { label: 'Clarity', rating: 5 },
      { label: 'Curiosity', rating: 4 },
      { label: 'Empathy', rating: 4 }
    ],
    experience: [{ title: 'Analytics Intern', company: 'CivicPulse', duration: '3 months' }]
  }
];

export function findRecruiterCandidate(candidateId: string) {
  return recruiterCandidates.find((candidate) => candidate.id === candidateId) ?? recruiterCandidates[0];
}
