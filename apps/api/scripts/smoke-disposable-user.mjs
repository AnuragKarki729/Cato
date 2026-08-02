import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const rootEnvPath = resolve(process.cwd(), '../../.env');

config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined
});

process.env.SUPABASE_URL ??= process.env.EXPO_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY ??= process.env.SUPABASE_SECRET_KEY;
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= process.env.EXPO_PUBLIC_SUPABASE_KEY;

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and EXPO_PUBLIC_SUPABASE_ANON_KEY are required');
}

const timestamp = Date.now();
const email = process.env.SMOKE_TEST_EMAIL ?? `cato-smoke-${timestamp}@example.edu`;
const password = process.env.SMOKE_TEST_PASSWORD ?? `CatoSmoke!${timestamp}`;
const tinyPortraitMp4DataUri = 'data:video/mp4;base64,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'.replace(/\s+/g, '');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
const supabasePublic = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

let createdUserId;

try {
  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'Cato Smoke Test'
    }
  });

  if (created.error || !created.data.user) {
    throw created.error ?? new Error('Supabase test user creation failed');
  }

  createdUserId = created.data.user.id;

  const session = await supabasePublic.auth.signInWithPassword({
    email,
    password
  });

  if (session.error || !session.data.session?.access_token) {
    throw session.error ?? new Error('Supabase test user sign-in failed');
  }

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, ['scripts/smoke-auth.mjs'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DELETE_SMOKE_ACCOUNT: 'true',
        TEST_TEN_SECOND_VIDEO_DATA_URI: process.env.TEST_TEN_SECOND_VIDEO_DATA_URI ?? tinyPortraitMp4DataUri,
        SUPABASE_ACCESS_TOKEN: session.data.session.access_token
      },
      stdio: 'inherit'
    });

    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`Authenticated smoke script exited with code ${code}`));
      }
    });
  });
} finally {
  if (createdUserId) {
    await supabaseAdmin.auth.admin.deleteUser(createdUserId);
  }
}
