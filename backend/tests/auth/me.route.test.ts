import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../../src/app';

describe('GET /api/auth/me', () => {
  it('returns guest identity when no account is linked', async () => {
    const app = createApp();
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.identityType).toBe('guest');
    expect(typeof res.body.displayName).toBe('string');
  });
});
