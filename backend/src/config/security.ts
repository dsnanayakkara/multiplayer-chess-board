import { AppEnv } from './env';

export const securityConfig = (env: AppEnv) => ({
  cookie: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.nodeEnv === 'production',
    path: '/',
  },
  cors: {
    origin: env.appOrigin,
    credentials: true,
  },
});
