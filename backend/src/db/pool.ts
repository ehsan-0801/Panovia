import pg from 'pg';
import { env } from '../config/env.js';

// Neon presents a publicly-trusted certificate, so the default TLS verification
// that `sslmode=require` maps to in node-postgres works as-is — no custom CA and
// no `rejectUnauthorized: false`. `channel_binding` is a libpq-only parameter
// that node-postgres doesn't understand, so it's stripped here.
function cleanUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.delete('channel_binding');
  u.searchParams.delete('supa');
  return u.toString();
}

export const pool = new pg.Pool({
  connectionString: cleanUrl(env.databaseUrl),
  max: 10,
  keepAlive: true,
  // Neon's pooler is happy to hand connections back quickly, and letting idle
  // ones close lets the compute endpoint suspend (which is what keeps the free
  // tier's compute-hour budget from being burnt by an idle server).
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params as never);
}

/** True when the database is reachable — used by the health endpoint. */
export async function pingDb(): Promise<boolean> {
  try {
    await pool.query('select 1');
    return true;
  } catch {
    return false;
  }
}

/** Run a set of statements inside a single transaction. */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
