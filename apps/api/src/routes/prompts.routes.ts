import type { FastifyInstance } from 'fastify';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { listSignalPrompts } from '../services/prompts.service.js';

export async function promptsRoutes(app: FastifyInstance) {
  app.get('/signal-prompts', { preHandler: requireSupabaseUser }, async () => ({
    prompts: listSignalPrompts()
  }));
}
