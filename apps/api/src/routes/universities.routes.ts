import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { normalizeUniversitySearch, universities } from '../data/universities.js';

const matchEmailSchema = z.object({
  email: z.string().email()
});

const maxSearchLimit = 20;
const defaultSuggestionLimit = 3;

export async function universitiesRoutes(app: FastifyInstance) {
  app.get('/universities/search', { preHandler: requireSupabaseUser }, async (request) => {
    const query = typeof request.query === 'object' && request.query && 'q' in request.query
      ? String(request.query.q)
      : '';
    const requestedLimit = typeof request.query === 'object' && request.query && 'limit' in request.query
      ? Number(request.query.limit)
      : defaultSuggestionLimit;
    const requestedOffset = typeof request.query === 'object' && request.query && 'offset' in request.query
      ? Number(request.query.offset)
      : 0;
    const normalizedQuery = normalizeUniversitySearch(query);
    const limit = Math.min(
      maxSearchLimit,
      Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : defaultSuggestionLimit)
    );
    const offset = Math.max(0, Number.isFinite(requestedOffset) ? requestedOffset : 0);

    const matches = normalizedQuery
      ? universities.filter((university) => university.normalizedSearchText.includes(normalizedQuery))
      : universities;
    const page = matches.slice(offset, offset + limit);

    return {
      universities: page,
      pagination: {
        limit,
        offset,
        total: matches.length,
        hasMore: offset + page.length < matches.length
      }
    };
  });

  app.post('/universities/match-email', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = matchEmailSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid email payload', issues: parsed.error.issues });
    }

    const domain = parsed.data.email.split('@')[1]?.toLowerCase();
    const university = universities.find((item) => item.domains.includes(domain));

    return {
      university: university ?? null
    };
  });
}
