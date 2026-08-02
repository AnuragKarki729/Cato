import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import Fastify from 'fastify';
import { env } from './config/env.js';
import { accountRoutes } from './routes/account.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { meRoutes } from './routes/me.routes.js';
import { onboardingRoutes } from './routes/onboarding.routes.js';
import { privacyRoutes } from './routes/privacy.routes.js';
import { promptsRoutes } from './routes/prompts.routes.js';
import { profileRoutes } from './routes/profile.routes.js';
import { recruiterRoutes } from './routes/recruiter.routes.js';
import { resumeRoutes } from './routes/resume.routes.js';
import { signalsRoutes } from './routes/signals.routes.js';
import { softSkillsRoutes } from './routes/softSkills.routes.js';
import { universitiesRoutes } from './routes/universities.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test'
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN
  });
  await app.register(websocket);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(meRoutes);
  await app.register(onboardingRoutes);
  await app.register(universitiesRoutes);
  await app.register(privacyRoutes);
  await app.register(promptsRoutes);
  await app.register(resumeRoutes);
  await app.register(signalsRoutes);
  await app.register(softSkillsRoutes);
  await app.register(profileRoutes);
  await app.register(recruiterRoutes);
  await app.register(accountRoutes);

  return app;
}
