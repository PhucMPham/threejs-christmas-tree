import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required env vars
if (process.env.NODE_ENV === 'production' && !process.env.IMGBB_API_KEY) {
  console.error('FATAL: IMGBB_API_KEY not set');
  process.exit(1);
}

const app = express();

// Config from env with defaults
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 32;
const SESSION_DAYS = parseInt(process.env.SESSION_DAYS) || 30;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Session middleware
app.use((req, res, next) => {
  let sessionId = req.cookies.session_id;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000
    });
  }
  req.sessionId = sessionId;
  next();
});

// Error sanitization middleware - strip env vars from logs
app.use((err, req, res, next) => {
  if (err) {
    const sanitizedMessage = err.message?.replace(/IMGBB_API_KEY=[^\s]*/g, 'IMGBB_API_KEY=[REDACTED]') || 'Unknown error';
    console.error('Error:', sanitizedMessage);
  }
  next(err);
});

// Static files from dist (Vite build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Serve christmas-tree as static (uses import maps, not bundled)
app.use('/src/christmas-tree', express.static(path.join(__dirname, 'src', 'christmas-tree')));

// API routes
const apiRouter = await import('./routes/api.js');
app.use('/api', apiRouter.default);

// SPA fallback - serve index.html for all other routes
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
