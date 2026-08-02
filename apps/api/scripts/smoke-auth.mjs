const baseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error('SUPABASE_ACCESS_TOKEN is required for authenticated smoke checks');
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} failed with ${response.status}: ${text}`);
  }

  return body;
}

async function requestStatus(path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers
  });
  const text = await response.text();

  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
    text
  };
}

function json(method, body) {
  return {
    method,
    body: JSON.stringify(body)
  };
}

function assertStatus(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${expected}, received ${actual}`);
  }
}

function dataUriToBlob(dataUri) {
  const [metadata, base64] = dataUri.split(',');
  const mimeType = metadata.match(/^data:(.*);base64$/)?.[1] ?? 'video/mp4';
  const bytes = Buffer.from(base64, 'base64');

  return {
    blob: new Blob([bytes], { type: mimeType }),
    mimeType,
    size: bytes.length
  };
}

async function uploadVideo(type, dataUri, durationSeconds) {
  const file = dataUriToBlob(dataUri);
  const prepared = await request(`/videos/${type}/upload-url`, json('POST', {
    contentType: file.mimeType,
    fileSizeBytes: file.size
  }));

  const formData = new FormData();
  formData.append('file', file.blob, `${type}.mp4`);
  formData.append('api_key', prepared.apiKey);
  formData.append('timestamp', String(prepared.timestamp));
  formData.append('signature', prepared.signature);
  formData.append('folder', prepared.folder);
  formData.append('public_id', prepared.publicId);

  const uploadResponse = await fetch(prepared.uploadUrl, {
    method: 'POST',
    body: formData
  });
  const uploadText = await uploadResponse.text();

  if (!uploadResponse.ok) {
    throw new Error(`Cloudinary ${type} upload failed with ${uploadResponse.status}: ${uploadText}`);
  }

  const uploaded = JSON.parse(uploadText);

  await request(`/videos/${type}/complete`, json('POST', {
    cloudinaryPublicId: uploaded.public_id,
    secureUrl: uploaded.secure_url,
    contentType: file.mimeType,
    fileSizeBytes: uploaded.bytes ?? file.size,
    durationSeconds
  }));
}

await request('/auth/sync', { method: 'POST' });

let status = await request('/onboarding/status');
assertStatus(status.onboardingStatus, 'auth_complete', 'initial onboarding status');

await request('/universities/search?q=ucla');
await request('/universities/match-email', json('POST', { email: 'student@example.com' }));
await request('/privacy/consent', json('POST', {
  resume: true,
  video: true,
  privacyPolicy: true
}));

await request('/onboarding/education', json('POST', {
  universityUnitId: '110662',
  universityName: 'University of California, Los Angeles',
  universityMatchedFromEmail: false,
  semesterLabel: 'Senior / Semester 8',
  semesterNumber: 8
}));

status = await request('/onboarding/status');
assertStatus(status.onboardingStatus, 'education_complete', 'education onboarding status');

if (process.env.TEST_RESUME_DATA_URI) {
  await request('/resume/upload', json('POST', {
    dataUri: process.env.TEST_RESUME_DATA_URI,
    originalFileName: process.env.TEST_RESUME_FILE_NAME ?? 'test-resume.pdf',
    fileType: process.env.TEST_RESUME_FILE_TYPE ?? 'pdf',
    fileSizeBytes: Number(process.env.TEST_RESUME_FILE_SIZE_BYTES ?? 1)
  }));
} else {
  await request('/onboarding/resume/skip', { method: 'POST' });
}

status = await request('/onboarding/status');
assertStatus(status.onboardingStatus, 'resume_complete', 'resume onboarding status');

const prompts = await request('/signal-prompts');
const prompt = prompts.prompts[0];

await request('/onboarding/signal-prompt', json('POST', {
  promptId: prompt.id
}));

status = await request('/onboarding/status');
assertStatus(status.onboardingStatus, 'signal_prompt_selected', 'signal prompt onboarding status');

if (process.env.TEST_TEN_SECOND_VIDEO_DATA_URI) {
  await uploadVideo('10-second', process.env.TEST_TEN_SECOND_VIDEO_DATA_URI, 10);

  status = await request('/onboarding/status');
  assertStatus(status.onboardingStatus, 'signal_video_uploaded', '10-second video onboarding status');

  const deleteRequiredVideo = await requestStatus('/videos/10-second', { method: 'DELETE' });

  if (deleteRequiredVideo.status !== 409) {
    throw new Error(`DELETE /videos/10-second expected 409, received ${deleteRequiredVideo.status}: ${deleteRequiredVideo.text}`);
  }
} else {
  throw new Error('TEST_TEN_SECOND_VIDEO_DATA_URI is required because the 10-second signal video is mandatory.');
}

await request('/onboarding/deeper-signal/seen', { method: 'POST' });

status = await request('/onboarding/status');
assertStatus(status.onboardingStatus, 'deeper_signal_seen', 'deeper signal onboarding status');

if (process.env.TEST_THIRTY_SECOND_VIDEO_DATA_URI) {
  await uploadVideo('30-second', process.env.TEST_THIRTY_SECOND_VIDEO_DATA_URI, 30);

  status = await request('/onboarding/status');
  assertStatus(status.onboardingStatus, 'deeper_video_uploaded', '30-second video onboarding status');
} else {
  await request('/onboarding/deeper-video/skip', { method: 'POST' });

  status = await request('/onboarding/status');
  assertStatus(status.onboardingStatus, 'deeper_video_skipped', 'deeper video skip onboarding status');
}

await request('/onboarding/profile', json('POST', {
  universityUnitId: '110662',
  universityName: 'University of California, Los Angeles',
  universityMatchedFromEmail: false,
  semesterLabel: 'Senior / Semester 8',
  semesterNumber: 8,
  gpa: 3.5,
  major: 'Computer Science',
  internships: [
    {
      company: 'POC Company',
      durationMonths: 3,
      roleDepartment: 'Engineering'
    }
  ]
}));

status = await request('/onboarding/status');
assertStatus(status.onboardingStatus, 'onboarding_complete', 'completed onboarding status');

const profile = await request('/profile');

if (!profile.applicant || !profile.education) {
  throw new Error('Profile response missing applicant or education');
}

await request('/profile/education', json('PATCH', {
  universityUnitId: '110662',
  universityName: 'University of California, Los Angeles',
  universityMatchedFromEmail: false,
  semesterLabel: 'Senior / Semester 8',
  semesterNumber: 8,
  gpa: 3.7,
  major: 'Computer Science',
  minor: 'Statistics'
}));

const createdInternship = await request('/profile/internships', json('POST', {
  company: 'POC CRUD Company',
  durationMonths: 2,
  roleDepartment: 'Product'
}));

if (!createdInternship.internship?.id) {
  throw new Error('Internship create response missing id');
}

await request(`/profile/internships/${createdInternship.internship.id}`, json('PATCH', {
  company: 'POC CRUD Company Updated',
  durationMonths: 4,
  roleDepartment: 'Engineering'
}));

await request(`/profile/internships/${createdInternship.internship.id}`, { method: 'DELETE' });

await request('/profile/soft-skills', json('PATCH', {
  items: [
    {
      label: 'Communication',
      rating: 4,
      evidence: 'POC smoke test editable soft-skill item.',
      confidence: 'medium'
    }
  ]
}));

if (process.env.DELETE_SMOKE_ACCOUNT === 'true') {
  await request('/account', { method: 'DELETE' });
  console.log('Authenticated smoke checks passed and account was deleted.');
} else {
  console.log('Authenticated smoke checks passed. Account was not deleted. Set DELETE_SMOKE_ACCOUNT=true to verify deletion.');
}
