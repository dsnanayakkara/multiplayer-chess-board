import express from 'express';
import cors from 'cors';
import path from 'path';

export const createApp = () => {
  const app = express();

  // CORS for development
  app.use(cors());

  app.use(express.json());

  // Serve static files from frontend build (for production)
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve React app for all other routes (for production)
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });

  return app;
};
