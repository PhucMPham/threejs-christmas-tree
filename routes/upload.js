import { Router } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import rateLimit from 'express-rate-limit';
import { fileTypeFromBuffer } from 'file-type';
import defaultDb from '../lib/db.js';

// Config from env with defaults
const MAX_PHOTOS = parseInt(process.env.MAX_PHOTOS) || 10;
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 32;

// Allowed MIME types
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Multer config with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP allowed.'));
    }
    cb(null, true);
  }
});

// Validate magic bytes for actual file type
async function validateFileType(buffer) {
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !ALLOWED_MIMES.includes(type.mime)) {
    return false;
  }
  return type;
}

/**
 * Error Codes:
 * - NO_FILE: No file in request
 * - LIMIT_REACHED: User hit 10 photo limit
 * - INVALID_TYPE: File type not allowed
 * - CONFIG_ERROR: Server misconfiguration
 * - RATE_LIMITED: ImgBB rate limit hit
 * - TIMEOUT: ImgBB request timed out
 * - UPSTREAM_ERROR: ImgBB unavailable
 * - FILE_TOO_LARGE: Exceeds 32MB limit
 * - INVALID_FILE: Multer rejection
 * - INTERNAL_ERROR: Unexpected server error
 */

// Determine if error is worth retrying
function isRetryableError(err) {
  // Network errors
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    return true;
  }
  // Rate limit - retry with backoff
  if (err.response?.status === 429) {
    return true;
  }
  // Server errors (5xx)
  if (err.response?.status >= 500) {
    return true;
  }
  return false;
}

// Retry with exponential backoff
async function withRetry(fn, options = {}) {
  const { retries = 3, baseDelay = 1000, maxDelay = 8000 } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      const isLastAttempt = attempt === retries;
      const isRetryable = isRetryableError(err);

      if (isLastAttempt || !isRetryable) {
        throw err;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.log(`Retry ${attempt + 1}/${retries} after ${delay}ms: ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Calculate timeout based on file size
function calculateTimeout(fileSizeBytes) {
  const MB = 1024 * 1024;
  const sizeMB = fileSizeBytes / MB;

  // Base: 15s, add 5s per MB, max 60s
  const timeout = Math.min(15000 + (sizeMB * 5000), 60000);
  return Math.round(timeout);
}

// Upload to ImgBB with retry
async function uploadToImgBB(base64Image, fileSizeBytes) {
  const form = new FormData();
  form.append('key', process.env.IMGBB_API_KEY);
  form.append('image', base64Image);

  const timeout = calculateTimeout(fileSizeBytes);

  return withRetry(async (attempt) => {
    const response = await axios.post('https://api.imgbb.com/1/upload', form, {
      headers: form.getHeaders(),
      timeout,
      validateStatus: (status) => status < 500 || attempt > 0
    });

    if (!response.data.success) {
      const err = new Error('ImgBB upload failed');
      err.response = response;
      throw err;
    }

    return response.data;
  }, {
    retries: 3,
    baseDelay: 1000
  });
}

/**
 * Factory function to create upload router with injected dependencies
 * @param {object} options
 * @param {object} options.db - Database functions (getPhotoCount, addPhoto, getPhotos, deletePhoto)
 * @param {object} options.rateLimiter - Optional rate limiter middleware
 * @returns {Router}
 */
export function createUploadRouter(options = {}) {
  const db = options.db || defaultDb;
  const router = Router();

  // Rate limiting: 15 uploads per minute per session
  const uploadLimiter = options.rateLimiter || rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    keyGenerator: (req) => req.sessionId || 'anonymous',
    message: { error: 'Too many uploads, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false
  });

  // Upload endpoint
  router.post('/', uploadLimiter, upload.single('image'), async (req, res) => {
    const startTime = Date.now();

    try {
      // Check if file provided
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          code: 'NO_FILE'
        });
      }

      const fileSize = req.file.size;
      console.log(`Upload started: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);

      // Check photo limit
      const count = db.getPhotoCount(req.sessionId);
      if (count >= MAX_PHOTOS) {
        return res.status(400).json({
          error: `Upload limit reached (${MAX_PHOTOS} photos)`,
          code: 'LIMIT_REACHED',
          count,
          max: MAX_PHOTOS
        });
      }

      // Validate actual file type via magic bytes
      const fileType = await validateFileType(req.file.buffer);
      if (!fileType) {
        return res.status(400).json({
          error: 'Invalid file content. Only JPEG, PNG, GIF, WebP allowed.',
          code: 'INVALID_TYPE'
        });
      }

      // Check API key
      if (!process.env.IMGBB_API_KEY) {
        console.error('IMGBB_API_KEY not configured');
        return res.status(500).json({
          error: 'Server configuration error',
          code: 'CONFIG_ERROR'
        });
      }

      // Convert to base64 and upload to ImgBB with retry
      const base64 = req.file.buffer.toString('base64');

      let imgbbData;
      try {
        imgbbData = await uploadToImgBB(base64, fileSize);
      } catch (err) {
        console.error('ImgBB upload failed after retries:', err.message);

        // Categorize error for client
        if (err.response?.status === 429) {
          return res.status(429).json({
            error: 'Image host busy, please try again in a moment',
            code: 'RATE_LIMITED',
            retryAfter: 60
          });
        }
        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
          return res.status(504).json({
            error: 'Upload timed out, please try again',
            code: 'TIMEOUT'
          });
        }
        return res.status(502).json({
          error: 'Image host unavailable, please try again',
          code: 'UPSTREAM_ERROR'
        });
      }

      const { id: imgbbId, url, display_url, delete_url } = imgbbData.data;

      // Store in database and get the row ID
      const result = db.addPhoto(req.sessionId, imgbbId, url, display_url, delete_url);
      const dbId = Number(result.lastInsertRowid);
      const newCount = count + 1;

      const duration = Date.now() - startTime;
      console.log(`Upload complete: ${dbId} in ${duration}ms`);

      res.json({
        success: true,
        data: { id: dbId, imgbb_id: imgbbId, url, display_url },
        count: newCount,
        remaining: MAX_PHOTOS - newCount,
        max: MAX_PHOTOS
      });
    } catch (err) {
      console.error('Upload error:', err.message, err.stack);

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: `File too large. Max ${MAX_FILE_SIZE_MB}MB allowed.`,
          code: 'FILE_TOO_LARGE'
        });
      }
      if (err.message.includes('Invalid file')) {
        return res.status(400).json({
          error: err.message,
          code: 'INVALID_FILE'
        });
      }

      res.status(500).json({
        error: 'Upload failed, please try again',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // Get user's photos
  router.get('/photos', (req, res) => {
    try {
      const photos = db.getPhotos(req.sessionId);
      const count = photos.length;
      res.json({
        photos,
        count,
        max: MAX_PHOTOS,
        remaining: MAX_PHOTOS - count
      });
    } catch (err) {
      console.error('Get photos error:', err.message);
      res.status(500).json({ error: 'Failed to retrieve photos' });
    }
  });

  // Delete a photo
  router.delete('/:id', (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      if (isNaN(photoId)) {
        return res.status(400).json({ error: 'Invalid photo ID' });
      }

      const deleted = db.deletePhoto(req.sessionId, photoId);
      if (!deleted) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      const count = db.getPhotoCount(req.sessionId);
      res.json({
        success: true,
        message: 'Photo deleted',
        count,
        remaining: MAX_PHOTOS - count
      });
    } catch (err) {
      console.error('Delete error:', err.message);
      res.status(500).json({ error: 'Failed to delete photo' });
    }
  });

  return router;
}

// Default export for production use
export default createUploadRouter();
