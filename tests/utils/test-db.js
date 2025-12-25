import Database from 'better-sqlite3';
import { createDbFunctions, SCHEMA } from '../../lib/db.js';

/**
 * Creates an in-memory SQLite database for testing
 * @returns {{ db: Database.Database, dbFuncs: ReturnType<typeof createDbFunctions> }}
 */
export function createTestDb() {
  const db = new Database(':memory:');
  db.exec(SCHEMA);
  const dbFuncs = createDbFunctions(db);
  return { db, dbFuncs };
}
