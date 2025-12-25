import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db', 'photos.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
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
`);

export function getPhotoCount(sessionId) {
  const row = db.prepare('SELECT COUNT(*) as count FROM photos WHERE session_id = ?').get(sessionId);
  return row.count;
}

export function addPhoto(sessionId, imgbbId, url, displayUrl, deleteUrl = null) {
  const stmt = db.prepare('INSERT INTO photos (session_id, imgbb_id, url, display_url, delete_url) VALUES (?, ?, ?, ?, ?)');
  return stmt.run(sessionId, imgbbId, url, displayUrl, deleteUrl);
}

export function getPhotos(sessionId) {
  return db.prepare('SELECT id, imgbb_id, url, display_url, created_at FROM photos WHERE session_id = ? ORDER BY created_at DESC').all(sessionId);
}

export function deletePhoto(sessionId, photoId) {
  const stmt = db.prepare('DELETE FROM photos WHERE id = ? AND session_id = ?');
  const result = stmt.run(photoId, sessionId);
  return result.changes > 0;
}

export function getPhotoById(sessionId, photoId) {
  return db.prepare('SELECT * FROM photos WHERE id = ? AND session_id = ?').get(photoId, sessionId);
}

export default {
  getPhotoCount,
  addPhoto,
  getPhotos,
  deletePhoto,
  getPhotoById
};
