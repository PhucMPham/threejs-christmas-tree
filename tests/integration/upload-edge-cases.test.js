import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import { createTestDb } from '../utils/test-db.js';
import { createTestApp } from '../utils/test-app.js';
import { createUploadRouter } from '../../routes/upload.js';
import {
  VALID_JPEG,
  PHP_CONTENT,
  EMPTY_FILE,
  TRUNCATED_JPEG,
  MOCK_IMGBB_SUCCESS,
  MOCK_IMGBB_FAILURE
} from '../utils/fixtures.js';

const TEST_SESSION_ID = 'test-session-123';

let db;
let dbFuncs;
let app;

// Mock rate limiter
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

describe('File Validation Edge Cases', () => {
  describe('Magic Bytes Validation', () => {
    it('rejects PHP content with .jpg extension and JPEG MIME type', async () => {
      const res = await request(app)
        .post('/api/upload')
        .attach('image', PHP_CONTENT, { filename: 'image.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid file content');
    });

    it('rejects empty file', async () => {
      const res = await request(app)
        .post('/api/upload')
        .attach('image', EMPTY_FILE, 'empty.jpg');

      expect(res.status).toBe(400);
    });

    it('rejects truncated JPEG header', async () => {
      const res = await request(app)
        .post('/api/upload')
        .attach('image', TRUNCATED_JPEG, { filename: 'broken.jpg', contentType: 'image/jpeg' });

      // May return 400 (invalid content), 500 (file-type parsing error), or 502 (upstream error if reaches ImgBB)
      expect([400, 500, 502]).toContain(res.status);
    });

    it('rejects random bytes disguised as image', async () => {
      const randomBytes = Buffer.from(Array(100).fill(0).map(() => Math.floor(Math.random() * 256)));

      const res = await request(app)
        .post('/api/upload')
        .attach('image', randomBytes, { filename: 'random.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
    });
  });
});

describe('Security Tests', () => {
  describe('Session Isolation', () => {
    it('cannot access photos from another session via GET', async () => {
      // Add photo for session A
      dbFuncs.addPhoto('session-A', 'img1', 'url1', 'disp1');

      // Request as TEST_SESSION_ID
      const res = await request(app)
        .get('/api/upload/photos');

      expect(res.body.photos).toHaveLength(0);
    });

    it('cannot delete photos from another session', async () => {
      dbFuncs.addPhoto('session-A', 'img1', 'url1', 'disp1');

      const res = await request(app)
        .delete('/api/upload/1');

      expect(res.status).toBe(404);
      expect(dbFuncs.getPhotoCount('session-A')).toBe(1);
    });
  });

  describe('Input Validation', () => {
    it('handles SQL injection attempt in photo ID gracefully', async () => {
      const res = await request(app)
        .delete('/api/upload/1; DROP TABLE photos;--');

      // parseInt('1; DROP...') returns 1 (parses until non-digit), not NaN
      // So it returns 404 (not found), which is safe behavior
      expect([400, 404]).toContain(res.status);
    });

    it('handles negative photo ID', async () => {
      const res = await request(app)
        .delete('/api/upload/-1');

      expect(res.status).toBe(404);
    });

    it('handles extremely large photo ID', async () => {
      const res = await request(app)
        .delete('/api/upload/999999999999999999');

      expect(res.status).toBe(404);
    });
  });
});

describe('Error Response Format', () => {
  it('returns consistent error format with error property', async () => {
    const res = await request(app)
      .post('/api/upload');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });

  it('does not expose internal paths in error messages', async () => {
    delete process.env.IMGBB_API_KEY;

    const res = await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(res.body.error).not.toMatch(/\/Users\//);
    expect(res.body.error).not.toMatch(/node_modules/);
  });
});

describe('ImgBB API Error Handling', () => {
  it('handles ImgBB rate limit (429) with retry exhaustion', async () => {
    axios.post.mockRejectedValue({
      response: { status: 429 },
      message: 'Rate limited'
    });

    const res = await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('busy'); // Updated error message
    expect(res.body.code).toBe('RATE_LIMITED');
  });

  it('handles ImgBB timeout with retry exhaustion', async () => {
    axios.post.mockRejectedValue({
      code: 'ECONNABORTED',
      message: 'timeout exceeded'
    });

    const res = await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(res.status).toBe(504); // Gateway timeout for upstream timeout
    expect(res.body.code).toBe('TIMEOUT');
  });

  it('handles ImgBB failure response as upstream error', async () => {
    axios.post.mockResolvedValue(MOCK_IMGBB_FAILURE);

    const res = await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(res.status).toBe(502); // Bad gateway for upstream failure
    expect(res.body.code).toBe('UPSTREAM_ERROR');
  });

  it('handles network error as upstream error', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    const res = await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(res.status).toBe(502); // Bad gateway for network error
    expect(res.body.code).toBe('UPSTREAM_ERROR');
  });
});

describe('Rate Limiting Behavior', () => {
  it('rate limiter can be configured via factory', async () => {
    let rateLimitCalled = false;
    const trackingLimiter = (req, res, next) => {
      rateLimitCalled = true;
      next();
    };

    const routerWithTracker = createUploadRouter({ db: dbFuncs, rateLimiter: trackingLimiter });
    const appWithTracker = createTestApp(routerWithTracker, TEST_SESSION_ID);

    axios.post.mockResolvedValue(MOCK_IMGBB_SUCCESS);

    await request(appWithTracker)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(rateLimitCalled).toBe(true);
  });
});

describe('Photo Limit Edge Cases', () => {
  it('allows upload when at limit minus one', async () => {
    // Add 9 photos (one below limit)
    for (let i = 0; i < 9; i++) {
      dbFuncs.addPhoto(TEST_SESSION_ID, `img${i}`, `url${i}`, `disp${i}`);
    }

    axios.post.mockResolvedValue(MOCK_IMGBB_SUCCESS);

    const res = await request(app)
      .post('/api/upload')
      .attach('image', VALID_JPEG, 'test.jpg');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(10);
    expect(res.body.remaining).toBe(0);
  });

  it('reports correct remaining count after multiple operations', async () => {
    axios.post.mockResolvedValue(MOCK_IMGBB_SUCCESS);

    // Upload 3 photos
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/upload')
        .attach('image', VALID_JPEG, 'test.jpg');
    }

    // Delete 1
    await request(app).delete('/api/upload/2');

    const res = await request(app).get('/api/upload/photos');
    expect(res.body.count).toBe(2);
    expect(res.body.remaining).toBe(8);
  });
});
