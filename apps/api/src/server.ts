import { buildApp } from './app.js';
import { closeMongoClient } from './db/mongo.js';
import { env } from './config/env.js';

const app = await buildApp();

const shutdown = async () => {
  await app.close();
  await closeMongoClient();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({
  port: env.PORT,
  host: '0.0.0.0'
});
