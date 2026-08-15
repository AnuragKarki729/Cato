import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { listSignalPromptCategories, listSignalPrompts } from '../services/prompts.service.js';

const signalPromptsQuerySchema = z.object({
  fieldId: z.string().optional()
});

export async function promptsRoutes(app: FastifyInstance) {
  app.get('/signal-prompts', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = signalPromptsQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid signal prompt query' });
    }

    return {
      categories: listSignalPromptCategories(),
      prompts: listSignalPrompts(parsed.data.fieldId as Parameters<typeof listSignalPrompts>[0])
    };
  });
}
