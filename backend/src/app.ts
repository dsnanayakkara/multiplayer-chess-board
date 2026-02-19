import express from 'express';
import cors from 'cors';
import path from 'path';
import { AppEnv, parseEnv } from './config/env';
import { securityConfig } from './config/security';
import { sessionMiddleware } from './auth/session/sessionMiddleware';
import { meRoute } from './auth/routes/meRoute';
import { magicLinkStartRoute } from './auth/routes/magicLinkStartRoute';

export const createApp = (env: AppEnv = parseEnv(process.env)) => {
  const app = express();
  const security = securityConfig(env);

  // CORS for development
  app.use(cors(security.cors));

  app.use(express.json());
  app.use(sessionMiddleware());
  app.use('/api/auth', meRoute);
  app.use('/api/auth', magicLinkStartRoute);

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
