import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

let client: MongoClient | undefined;

export async function getMongoClient() {
  if (!client) {
    client = new MongoClient(env.MONGODB_URL);
    await client.connect();
  }

  return client;
}

export async function getDatabase() {
  const mongoClient = await getMongoClient();
  return mongoClient.db();
}

export async function closeMongoClient() {
  if (client) {
    await client.close();
    client = undefined;
  }
}
