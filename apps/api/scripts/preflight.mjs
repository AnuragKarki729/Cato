import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookup } from 'node:dns/promises';
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
  resolve(__dirname, '../../../.env')
];
const envPath = envCandidates.find((candidate) => existsSync(candidate));

config({
  path: envPath
});

process.env.SUPABASE_URL ??= process.env.EXPO_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY ??= process.env.SUPABASE_SECRET_KEY;
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= process.env.EXPO_PUBLIC_SUPABASE_KEY;

const checks = [];

function addCheck(name, passed, detail) {
  checks.push({ name, passed, detail });
}

function masked(value) {
  if (!value) {
    return 'missing';
  }

  return 'set';
}

function requireEnv(name) {
  const value = process.env[name];
  addCheck(`env:${name}`, Boolean(value), masked(value));
  return value;
}

async function timed(name, fn) {
  try {
    const detail = await fn();
    addCheck(name, true, detail ?? 'ok');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addCheck(name, false, message);
  }
}

const supabaseUrl = requireEnv('SUPABASE_URL');
const supabaseAnonKey = requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
const mobileSupabaseUrl = requireEnv('EXPO_PUBLIC_SUPABASE_URL');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
requireEnv('EXPO_PUBLIC_SUPABASE_KEY');
requireEnv('SUPABASE_SECRET_KEY');
const mongoUrl = requireEnv('MONGODB_URL');
const cloudName = requireEnv('CLOUDINARY_CLOUD_NAME');
const cloudinaryApiKey = requireEnv('CLOUDINARY_API_KEY');
const cloudinaryApiSecret = requireEnv('CLOUDINARY_API_SECRET');
requireEnv('CLOUDINARY_URL');
requireEnv('EXPO_PUBLIC_API_BASE_URL');

if (supabaseUrl && mobileSupabaseUrl) {
  addCheck(
    'env:supabase-url-match',
    supabaseUrl === mobileSupabaseUrl,
    supabaseUrl === mobileSupabaseUrl ? 'ok' : 'SUPABASE_URL and EXPO_PUBLIC_SUPABASE_URL differ'
  );
}

if (supabaseUrl) {
  await timed('supabase:dns', async () => {
    const hostname = new URL(supabaseUrl).hostname;
    await lookup(hostname);
    return 'resolved';
  });

  await timed('supabase:auth-health', async () => {
    const headers = supabaseAnonKey
      ? {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`
        }
      : undefined;
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`, {
      headers,
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return `HTTP ${response.status}`;
  });
}

if (mongoUrl) {
  await timed('mongodb:ping', async () => {
    const client = new MongoClient(mongoUrl, {
      serverSelectionTimeoutMS: 8000
    });

    try {
      await client.connect();
      await client.db().command({ ping: 1 });
      return 'ok';
    } finally {
      await client.close();
    }
  });
}

if (cloudName && cloudinaryApiKey && cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret
  });

  await timed('cloudinary:ping', async () => {
    await cloudinary.api.ping();
    return 'ok';
  });
}

const maxNameLength = Math.max(...checks.map((check) => check.name.length));

for (const check of checks) {
  const label = check.passed ? 'PASS' : 'FAIL';
  console.log(`${label} ${check.name.padEnd(maxNameLength)} ${check.detail}`);
}

if (checks.some((check) => !check.passed)) {
  process.exitCode = 1;
}
