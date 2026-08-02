import type { FastifyReply, FastifyRequest } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

function normalizeName(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function titleCaseWord(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function inferNameFromEmail(email: string) {
  const localPart = email.split('@')[0];

  if (!localPart) {
    return undefined;
  }

  const readableName = localPart
    .split('+')[0]
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(' ');

  return readableName.length > 0 ? readableName : undefined;
}

function getSupabaseUserName(userMetadata: Record<string, unknown>, email: string) {
  return (
    normalizeName(userMetadata.name) ??
    normalizeName(userMetadata.full_name) ??
    normalizeName(userMetadata.display_name) ??
    inferNameFromEmail(email)
  );
}

export async function requireSupabaseUser(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined;

  if (!token) {
    return reply.code(401).send({ error: 'Missing bearer token' });
  }

  const user = await getSupabaseUserFromToken(token);

  if (!user) {
    return reply.code(401).send({ error: 'Invalid bearer token' });
  }

  request.user = user;
}

export async function getSupabaseUserFromToken(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  const email = data.user.email ?? '';
  const userMetadata = data.user.user_metadata as Record<string, unknown>;

  const authProvider: 'google' | 'email' = data.user.app_metadata.provider === 'google' ? 'google' : 'email';

  return {
    id: data.user.id,
    email,
    name: getSupabaseUserName(userMetadata, email),
    authProvider
  };
}
