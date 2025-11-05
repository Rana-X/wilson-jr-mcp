/**
 * Database connection module for Neon PostgreSQL
 */

import postgres from 'postgres';

// Lazily create database connection
let _sql: ReturnType<typeof postgres> | null = null;

/**
 * Get or create the database connection
 */
export function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    _sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      max: 10, // Maximum number of connections in pool
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  return _sql;
}

// For backward compatibility - most tools use this
export const sql = new Proxy({} as any, {
  get(_target, prop) {
    return getSql()[prop as keyof ReturnType<typeof postgres>];
  },
  apply(_target, _thisArg, args: any[]) {
    const sqlFn = getSql();
    return sqlFn(...(args as [any, ...any[]]));
  }
});

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = getSql();
    await connection`SELECT NOW() as current_time`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeConnection(): Promise<void> {
  if (_sql) {
    await _sql.end();
    _sql = null;
  }
}

/**
 * Execute a query with error handling
 */
export async function executeQuery<T>(
  queryFn: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${errorMessage}:`, message);
    throw new Error(`${errorMessage}: ${message}`);
  }
}
