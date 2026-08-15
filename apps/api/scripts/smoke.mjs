const baseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';

const protectedChecks = [
  { method: 'GET', path: '/me' },
  { method: 'POST', path: '/auth/sync' },
  { method: 'GET', path: '/onboarding/status' },
  { method: 'GET', path: '/universities/search?q=ucla' },
  { method: 'POST', path: '/privacy/consent' },
  { method: 'GET', path: '/signal-prompts' },
  { method: 'GET', path: '/resume' },
  { method: 'DELETE', path: '/resume' },
  { method: 'POST', path: '/onboarding/resume/skip' },
  { method: 'GET', path: '/profile/soft-skills' },
  { method: 'GET', path: '/signal' },
  { method: 'POST', path: '/onboarding/signal-prompt' },
  { method: 'POST', path: '/videos/10-second/upload-url' },
  { method: 'POST', path: '/videos/10-second/complete' },
  { method: 'POST', path: '/videos/30-second/upload-url' },
  { method: 'POST', path: '/videos/30-second/complete' },
  { method: 'GET', path: '/videos' },
  { method: 'DELETE', path: '/videos/10-second' },
  { method: 'DELETE', path: '/videos/30-second' },
  { method: 'POST', path: '/onboarding/deeper-signal/seen' },
  { method: 'POST', path: '/onboarding/deeper-video/skip' },
  { method: 'GET', path: '/profile' },
  { method: 'POST', path: '/onboarding/profile' },
  { method: 'PATCH', path: '/profile/education' },
  { method: 'POST', path: '/profile/internships' },
  { method: 'PATCH', path: '/profile/internships/000000000000000000000000' },
  { method: 'DELETE', path: '/profile/internships/000000000000000000000000' },
  { method: 'PATCH', path: '/profile/soft-skills' },
  { method: 'POST', path: '/recruiter/auth/sync' },
  { method: 'GET', path: '/recruiter/me' },
  { method: 'GET', path: '/recruiter/dashboard' },
  { method: 'GET', path: '/recruiter/candidates' },
  { method: 'GET', path: '/recruiter/candidates?q=engineering' },
  { method: 'GET', path: '/recruiter/candidates/000000000000000000000000' },
  { method: 'GET', path: '/recruiter/bookmarks' },
  { method: 'POST', path: '/recruiter/candidates/000000000000000000000000/bookmark' },
  { method: 'DELETE', path: '/recruiter/candidates/000000000000000000000000/bookmark' },
  { method: 'POST', path: '/recruiter/candidates/000000000000000000000000/contact' },
  { method: 'GET', path: '/recruiter/messages' },
  { method: 'DELETE', path: '/account' }
];

async function request(path, init) {
  return fetch(`${baseUrl}${path}`, init);
}

const health = await request('/health');

if (health.status !== 200) {
  throw new Error(`Expected /health to return 200, received ${health.status}`);
}

const ready = await request('/ready');

if (ready.status !== 200) {
  throw new Error(`Expected /ready to return 200, received ${ready.status}`);
}

for (const check of protectedChecks) {
  const response = await request(check.path, { method: check.method });

  if (response.status !== 401) {
    throw new Error(`${check.method} ${check.path} expected 401 without token, received ${response.status}`);
  }
}

console.log(`API smoke checks passed for ${baseUrl}`);
