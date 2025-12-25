import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Schema for initializing database
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    imgbb_id TEXT NOT NULL,
    url TEXT NOT NULL,
    display_url TEXT NOT NULL,
    delete_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_session ON photos(session_id);
`;

// Factory function for creating db functions with injected database
export function createDbFunctions(database) {
  return {
    getPhotoCount(sessionId) {
      const row = database.prepare('SELECT COUNT(*) as count FROM photos WHERE session_id = ?').get(sessionId);
      return row.count;
    },
    addPhoto(sessionId, imgbbId, url, displayUrl, deleteUrl = null) {
      const stmt = database.prepare('INSERT INTO photos (session_id, imgbb_id, url, display_url, delete_url) VALUES (?, ?, ?, ?, ?)');
      return stmt.run(sessionId, imgbbId, url, displayUrl, deleteUrl);
    },
    getPhotos(sessionId) {
      return database.prepare('SELECT id, imgbb_id, url, display_url, created_at FROM photos WHERE session_id = ? ORDER BY created_at DESC').all(sessionId);
    },
    deletePhoto(sessionId, photoId) {
      const stmt = database.prepare('DELETE FROM photos WHERE id = ? AND session_id = ?');
      const result = stmt.run(photoId, sessionId);
      return result.changes > 0;
    },
    getPhotoById(sessionId, photoId) {
      return database.prepare('SELECT * FROM photos WHERE id = ? AND session_id = ?').get(photoId, sessionId);
    }
  };
}

// Initialize production database
const dbPath = path.join(__dirname, '..', 'db', 'photos.db');
const db = new Database(dbPath);
db.exec(SCHEMA);

// Create and export default instance
const dbFunctions = createDbFunctions(db);

export const { getPhotoCount, addPhoto, getPhotos, deletePhoto, getPhotoById } = dbFunctions;
export { SCHEMA };
export default dbFunctions;
