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
    try {
      // Check if file provided
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Check photo limit
      const count = db.getPhotoCount(req.sessionId);
      if (count >= MAX_PHOTOS) {
        return res.status(400).json({
          error: `Upload limit reached (${MAX_PHOTOS} photos)`,
          count,
          max: MAX_PHOTOS
        });
      }

      // Validate actual file type via magic bytes
      const fileType = await validateFileType(req.file.buffer);
      if (!fileType) {
        return res.status(400).json({ error: 'Invalid file content. Only JPEG, PNG, GIF, WebP allowed.' });
      }

      // Check API key
      if (!process.env.IMGBB_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      // Convert to base64 and upload to ImgBB
      const base64 = req.file.buffer.toString('base64');
      const form = new FormData();
      form.append('key', process.env.IMGBB_API_KEY);
      form.append('image', base64);

      const response = await axios.post('https://api.imgbb.com/1/upload', form, {
        headers: form.getHeaders(),
        timeout: 30000
      });

      if (!response.data.success) {
        return res.status(400).json({ error: 'Upload to image host failed' });
      }

      const { id: imgbbId, url, display_url, delete_url } = response.data.data;

      // Store in database and get the row ID
      const result = db.addPhoto(req.sessionId, imgbbId, url, display_url, delete_url);
      const dbId = Number(result.lastInsertRowid);
      const newCount = count + 1;

      res.json({
        success: true,
        data: { id: dbId, imgbb_id: imgbbId, url, display_url },
        count: newCount,
        remaining: MAX_PHOTOS - newCount,
        max: MAX_PHOTOS
      });
    } catch (err) {
      console.error('Upload error:', err.message);

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `File too large. Max ${MAX_FILE_SIZE_MB}MB allowed.` });
      }
      if (err.response?.status === 429) {
        return res.status(429).json({ error: 'Image host rate limited, try again later' });
      }
      if (err.message.includes('Invalid file')) {
        return res.status(400).json({ error: err.message });
      }

      res.status(500).json({ error: 'Upload failed' });
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
