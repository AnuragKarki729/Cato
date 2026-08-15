import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { countUnreadNotifications, markNotificationsRead } from '../repositories/notifications.repo.js';
import { findAppUserRole } from '../repositories/userRoles.repo.js';

const markSeenSchema = z.object({
  bucket: z.enum(['requests'])
});

export async function notificationsRoutes(app: FastifyInstance) {
  app.get('/notifications/unread-counts', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();
    const role = await findAppUserRole(db, user.id);

    if (!role) {
      return reply.code(404).send({ error: 'User role not found' });
    }

    const requests = await countUnreadNotifications(db, {
      recipientSupabaseUserId: user.id,
      role: role.role,
      bucket: 'requests'
    });

    return {
      counts: {
        requests
      }
    };
  });

  app.post('/notifications/seen', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;
    const parsed = markSeenSchema.safeParse(request.body);

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid notification bucket' });
    }

    const db = await getDatabase();
    const role = await findAppUserRole(db, user.id);

    if (!role) {
      return reply.code(404).send({ error: 'User role not found' });
    }

    await markNotificationsRead(db, {
      recipientSupabaseUserId: user.id,
      role: role.role,
      bucket: parsed.data.bucket
    });

    return {
      counts: {
        [parsed.data.bucket]: 0
      }
    };
  });
}
