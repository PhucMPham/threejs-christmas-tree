import { Router } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import and mount upload routes
const uploadRouter = await import('./upload.js');
router.use('/upload', uploadRouter.default);

export default router;
