import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
  authToken: process.env.DATABASE_AUTH_TOKEN, // Tursoを使う場合は必要
});