import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { z } from 'zod';

const rootEnvPath = resolve(process.cwd(), '../../.env');

config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined
});

process.env.SUPABASE_URL ??= process.env.EXPO_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY ??= process.env.SUPABASE_SECRET_KEY;
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= process.env.EXPO_PUBLIC_SUPABASE_KEY;

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),
  MONGODB_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_URL: z.string().min(1)
});

export const env = envSchema.parse(process.env);
