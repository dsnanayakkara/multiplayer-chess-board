export interface AppEnv {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  sessionSecret: string;
  appOrigin: string;
}

export const parseEnv = (raw: NodeJS.ProcessEnv): AppEnv => {
  const nodeEnv = (raw.NODE_ENV as AppEnv['nodeEnv']) || 'development';
  const sessionSecret = raw.SESSION_SECRET || (nodeEnv === 'production' ? '' : 'dev-session-secret');

  if (nodeEnv === 'production' && sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 chars in production');
  }

  const parsedPort = Number(raw.PORT || 3001);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3001;

  return {
    nodeEnv,
    port,
    sessionSecret,
    appOrigin: raw.APP_ORIGIN || 'http://localhost:5173',
  };
};
