import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import { createTestDb } from '../utils/test-db.js';
import { createTestApp } from '../utils/test-app.js';
import { createUploadRouter } from '../../routes/upload.js';
import { VALID_JPEG, MOCK_IMGBB_SUCCESS } from '../utils/fixtures.js';

const TEST_SESSION_ID = 'test-session-123';

let db;
let dbFuncs;
let app;

// Mock rate limiter that always allows requests
const mockRateLimiter = (req, res, next) => next();

beforeEach(() => {
  vi.clearAllMocks();
  process.env.IMGBB_API_KEY = 'test-api-key';

  const setup = createTestDb();
  db = setup.db;
  dbFuncs = setup.dbFuncs;

  const uploadRouter = createUploadRouter({ db: dbFuncs, rateLimiter: mockRateLimiter });
  app = createTestApp(uploadRouter, TEST_SESSION_ID);
});

afterEach(() => {
  db?.close();
  delete process.env.IMGBB_API_KEY;
});

describe('POST /api/upload', () => {
  it('uploads valid JPEG successfully', async () => {
    axios.post.mockResolvedValue(MOCK_IMGBB_SUCCESS);

    const res = await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.imgbb_id).toBe('imgbb-test-123');
    expect(res.body.count).toBe(1);
    expect(res.body.remaining).toBe(9);
    expect(res.body.max).toBe(10);
  });

  it('stores photo in database after upload', async () => {
    axios.post.mockResolvedValue(MOCK_IMGBB_SUCCESS);

    await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    const photos = dbFuncs.getPhotos(TEST_SESSION_ID);
    expect(photos).toHaveLength(1);
    expect(photos[0].imgbb_id).toBe('imgbb-test-123');
  });

  it('rejects request without file', async () => {
    const res = await request(app)
      .post('/api/upload');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No file');
  });

  it('rejects invalid MIME type', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('image', Buffer.from('fake'), { filename: 'test.exe', contentType: 'application/octet-stream' });

    // Multer rejects with 400 or 500 depending on how error is caught
    expect([400, 500]).toContain(res.status);
  });

  it('rejects when photo limit reached (10 photos)', async () => {
    // Pre-fill 10 photos
    for (let i = 0; i < 10; i++) {
      dbFuncs.addPhoto(TEST_SESSION_ID, `img${i}`, `url${i}`, `disp${i}`);
    }

    const res = await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('limit reached');
    expect(res.body.count).toBe(10);
  });

  it('returns 500 when IMGBB_API_KEY missing', async () => {
    delete process.env.IMGBB_API_KEY;

    const res = await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('configuration');
  });

  it('calls axios with correct parameters and dynamic timeout', async () => {
    axios.post.mockResolvedValue(MOCK_IMGBB_SUCCESS);

    await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(axios.post).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.imgbb.com/1/upload',
      expect.any(Object), // FormData
      expect.objectContaining({
        timeout: expect.any(Number), // Dynamic timeout based on file size
        validateStatus: expect.any(Function)
      })
    );
  });
});

describe('GET /api/upload/photos', () => {
  it('returns empty array for new session', async () => {
    const res = await request(app)
      .get('/api/upload/photos');

    expect(res.status).toBe(200);
    expect(res.body.photos).toEqual([]);
    expect(res.body.count).toBe(0);
    expect(res.body.max).toBe(10);
    expect(res.body.remaining).toBe(10);
  });

  it('returns photos for session', async () => {
    dbFuncs.addPhoto(TEST_SESSION_ID, 'img1', 'url1', 'disp1');
    dbFuncs.addPhoto(TEST_SESSION_ID, 'img2', 'url2', 'disp2');

    const res = await request(app)
      .get('/api/upload/photos');

    expect(res.status).toBe(200);
    expect(res.body.photos).toHaveLength(2);
    expect(res.body.count).toBe(2);
    expect(res.body.remaining).toBe(8);
  });

  it('excludes photos from other sessions', async () => {
    dbFuncs.addPhoto(TEST_SESSION_ID, 'my-img', 'url1', 'disp1');
    dbFuncs.addPhoto('other-session', 'other-img', 'url2', 'disp2');

    const res = await request(app)
      .get('/api/upload/photos');

    expect(res.body.photos).toHaveLength(1);
    expect(res.body.photos[0].imgbb_id).toBe('my-img');
  });
});

describe('DELETE /api/upload/:id', () => {
  it('deletes existing photo', async () => {
    dbFuncs.addPhoto(TEST_SESSION_ID, 'img1', 'url1', 'disp1');

    const res = await request(app)
      .delete('/api/upload/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(0);
    expect(dbFuncs.getPhotoCount(TEST_SESSION_ID)).toBe(0);
  });

  it('returns 404 for non-existent photo', async () => {
    const res = await request(app)
      .delete('/api/upload/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  it('returns 400 for invalid ID', async () => {
    const res = await request(app)
      .delete('/api/upload/invalid');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid');
  });

  it('prevents cross-session deletion', async () => {
    // Insert photo for different session
    dbFuncs.addPhoto('other-session', 'img1', 'url1', 'disp1');

    const res = await request(app)
      .delete('/api/upload/1');

    expect(res.status).toBe(404);
    // Photo should still exist in other session
    expect(dbFuncs.getPhotoCount('other-session')).toBe(1);
  });

  it('updates remaining count after deletion', async () => {
    dbFuncs.addPhoto(TEST_SESSION_ID, 'img1', 'url1', 'disp1');
    dbFuncs.addPhoto(TEST_SESSION_ID, 'img2', 'url2', 'disp2');

    const res = await request(app)
      .delete('/api/upload/1');

    expect(res.body.count).toBe(1);
    expect(res.body.remaining).toBe(9);
  });
});
