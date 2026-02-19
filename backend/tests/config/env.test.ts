import { describe, it, expect } from 'vitest';
import { parseEnv } from '../../src/config/env';

describe('parseEnv', () => {
  it('requires SESSION_SECRET in production mode', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        PORT: '3001',
        SESSION_SECRET: '',
      })
    ).toThrow(/SESSION_SECRET/);
  });
});
