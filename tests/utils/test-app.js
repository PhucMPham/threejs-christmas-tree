import express from 'express';
import cookieParser from 'cookie-parser';

/**
 * Creates a test Express app with session middleware
 * @param {Router} uploadRouter - The upload router to mount
 * @param {string} sessionId - Session ID to inject into requests
 * @returns {express.Application}
 */
export function createTestApp(uploadRouter, sessionId = 'test-session-123') {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Inject test session ID
  app.use((req, res, next) => {
    req.sessionId = sessionId;
    next();
  });

  app.use('/api/upload', uploadRouter);
  return app;
}
