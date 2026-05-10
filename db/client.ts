import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

/**
 * Neon serverless HTTP client + Drizzle ORM.
 *
 * Import `db` anywhere a server-side query is needed. All API route handlers
 * should use this single instance so connection reuse and Neon's HTTP cache
 * work correctly on Vercel.
 */
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
