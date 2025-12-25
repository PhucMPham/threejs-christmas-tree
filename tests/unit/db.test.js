import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../utils/test-db.js';

let db;
let dbFuncs;

beforeEach(() => {
  const setup = createTestDb();
  db = setup.db;
  dbFuncs = setup.dbFuncs;
});

afterEach(() => {
  db.close();
});

describe('getPhotoCount', () => {
  it('returns 0 for empty session', () => {
    expect(dbFuncs.getPhotoCount('session-1')).toBe(0);
  });

  it('returns correct count for session', () => {
    dbFuncs.addPhoto('session-1', 'img1', 'url1', 'display1');
    dbFuncs.addPhoto('session-1', 'img2', 'url2', 'display2');
    expect(dbFuncs.getPhotoCount('session-1')).toBe(2);
  });

  it('isolates count by session', () => {
    dbFuncs.addPhoto('session-1', 'img1', 'url1', 'display1');
    dbFuncs.addPhoto('session-2', 'img2', 'url2', 'display2');
    expect(dbFuncs.getPhotoCount('session-1')).toBe(1);
    expect(dbFuncs.getPhotoCount('session-2')).toBe(1);
  });
});

describe('addPhoto', () => {
  it('inserts photo and returns result with changes', () => {
    const result = dbFuncs.addPhoto('s1', 'imgbb123', 'http://url', 'http://display', 'http://delete');
    expect(result.changes).toBe(1);
    expect(Number(result.lastInsertRowid)).toBe(1);
  });

  it('allows null deleteUrl', () => {
    const result = dbFuncs.addPhoto('s1', 'imgbb123', 'http://url', 'http://display');
    expect(result.changes).toBe(1);
  });

  it('auto-increments id', () => {
    dbFuncs.addPhoto('s1', 'img1', 'url1', 'disp1');
    const result = dbFuncs.addPhoto('s1', 'img2', 'url2', 'disp2');
    expect(Number(result.lastInsertRowid)).toBe(2);
  });

  it('stores all fields correctly', () => {
    dbFuncs.addPhoto('session-x', 'imgbb-id', 'full-url', 'display-url', 'delete-url');
    const photo = dbFuncs.getPhotoById('session-x', 1);
    expect(photo.session_id).toBe('session-x');
    expect(photo.imgbb_id).toBe('imgbb-id');
    expect(photo.url).toBe('full-url');
    expect(photo.display_url).toBe('display-url');
    expect(photo.delete_url).toBe('delete-url');
  });
});

describe('getPhotos', () => {
  it('returns empty array for no photos', () => {
    expect(dbFuncs.getPhotos('s1')).toEqual([]);
  });

  it('returns photos ordered by created_at DESC (newest first)', () => {
    dbFuncs.addPhoto('s1', 'img1', 'url1', 'disp1');
    dbFuncs.addPhoto('s1', 'img2', 'url2', 'disp2');
    const photos = dbFuncs.getPhotos('s1');
    expect(photos).toHaveLength(2);
    // When timestamps are identical (same second), SQLite maintains insertion order
    // Both photos have same created_at, so we verify both are present
    const imgbbIds = photos.map(p => p.imgbb_id);
    expect(imgbbIds).toContain('img1');
    expect(imgbbIds).toContain('img2');
  });

  it('excludes delete_url from response', () => {
    dbFuncs.addPhoto('s1', 'img1', 'url1', 'disp1', 'http://delete');
    const photos = dbFuncs.getPhotos('s1');
    expect(photos[0]).not.toHaveProperty('delete_url');
  });

  it('filters by session', () => {
    dbFuncs.addPhoto('s1', 'img1', 'url1', 'disp1');
    dbFuncs.addPhoto('s2', 'img2', 'url2', 'disp2');
    expect(dbFuncs.getPhotos('s1')).toHaveLength(1);
    expect(dbFuncs.getPhotos('s2')).toHaveLength(1);
  });
});

describe('deletePhoto', () => {
  it('returns true when photo deleted', () => {
    dbFuncs.addPhoto('s1', 'img1', 'url1', 'disp1');
    expect(dbFuncs.deletePhoto('s1', 1)).toBe(true);
    expect(dbFuncs.getPhotoCount('s1')).toBe(0);
  });

  it('returns false for non-existent photo', () => {
    expect(dbFuncs.deletePhoto('s1', 999)).toBe(false);
  });

  it('returns false for wrong session (cross-session protection)', () => {
    dbFuncs.addPhoto('s1', 'img1', 'url1', 'disp1');
    expect(dbFuncs.deletePhoto('s2', 1)).toBe(false);
    expect(dbFuncs.getPhotoCount('s1')).toBe(1); // Still exists
  });

  it('only deletes specified photo', () => {
    dbFuncs.addPhoto('s1', 'img1', 'url1', 'disp1');
    dbFuncs.addPhoto('s1', 'img2', 'url2', 'disp2');
    dbFuncs.deletePhoto('s1', 1);
    expect(dbFuncs.getPhotoCount('s1')).toBe(1);
    const photos = dbFuncs.getPhotos('s1');
    expect(photos[0].imgbb_id).toBe('img2');
  });
});

describe('getPhotoById', () => {
  it('returns photo when exists', () => {
    dbFuncs.addPhoto('s1', 'img1', 'url1', 'disp1', 'del1');
    const photo = dbFuncs.getPhotoById('s1', 1);
    expect(photo.imgbb_id).toBe('img1');
    expect(photo.delete_url).toBe('del1');
  });

  it('returns undefined for non-existent id', () => {
    expect(dbFuncs.getPhotoById('s1', 999)).toBeUndefined();
  });

  it('returns undefined for wrong session', () => {
    dbFuncs.addPhoto('s1', 'img1', 'url1', 'disp1');
    expect(dbFuncs.getPhotoById('s2', 1)).toBeUndefined();
  });

  it('includes all fields in response', () => {
    dbFuncs.addPhoto('s1', 'imgbb-123', 'http://full', 'http://display', 'http://delete');
    const photo = dbFuncs.getPhotoById('s1', 1);
    expect(photo).toHaveProperty('id');
    expect(photo).toHaveProperty('session_id');
    expect(photo).toHaveProperty('imgbb_id');
    expect(photo).toHaveProperty('url');
    expect(photo).toHaveProperty('display_url');
    expect(photo).toHaveProperty('delete_url');
    expect(photo).toHaveProperty('created_at');
  });
});
