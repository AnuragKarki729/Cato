import type { FastifyReply } from 'fastify';

type SseClient = {
  send: (event: string, payload: unknown) => void;
};

const applicantClients = new Map<string, Set<SseClient>>();
const recruiterClients = new Map<string, Set<SseClient>>();

function addClient(registry: Map<string, Set<SseClient>>, userId: string, client: SseClient) {
  const clients = registry.get(userId) ?? new Set<SseClient>();
  clients.add(client);
  registry.set(userId, clients);

  return () => {
    clients.delete(client);
    if (clients.size === 0) {
      registry.delete(userId);
    }
  };
}

function publish(registry: Map<string, Set<SseClient>>, userId: string, event: string, payload: unknown) {
  const clients = registry.get(userId);

  if (!clients) {
    return;
  }

  clients.forEach((client) => client.send(event, payload));
}

export function attachSseClient(reply: FastifyReply, userId: string, role: 'applicant' | 'recruiter') {
  reply.hijack();
  reply.raw.writeHead(200, {
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no'
  });
  reply.raw.write(': connected\n\n');

  const client: SseClient = {
    send: (event, payload) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  };
  const cleanup = addClient(role === 'applicant' ? applicantClients : recruiterClients, userId, client);
  const heartbeat = setInterval(() => {
    reply.raw.write(': heartbeat\n\n');
  }, 25000);

  reply.raw.on('close', () => {
    clearInterval(heartbeat);
    cleanup();
  });
}

export function publishApplicantEvent(userId: string, event: string, payload: unknown) {
  publish(applicantClients, userId, event, payload);
}

export function publishRecruiterEvent(userId: string, event: string, payload: unknown) {
  publish(recruiterClients, userId, event, payload);
}
