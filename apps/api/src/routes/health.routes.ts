import type { FastifyInstance } from 'fastify';
import { getDatabase } from '../db/mongo.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'cato-api'
  }));

  app.get('/ready', async (request, reply) => {
    try {
      const db = await getDatabase();
      await db.command({ ping: 1 });

      return {
        status: 'ready',
        service: 'cato-api',
        checks: {
          mongo: 'ok'
        }
      };
    } catch (error) {
      request.log.error({ err: error }, 'readiness check failed');

      return reply.code(503).send({
        status: 'not_ready',
        service: 'cato-api',
        checks: {
          mongo: 'failed'
        }
      });
    }
  });
}
