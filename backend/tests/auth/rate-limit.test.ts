import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../../src/app';

describe('magic-link start rate limit', () => {
  it('returns 429 after too many requests', async () => {
    const app = createApp();

    for (let i = 0; i < 6; i++) {
      await request(app).post('/api/auth/magic-link/start').send({ email: 'spam@example.com' });
    }

    const res = await request(app)
      .post('/api/auth/magic-link/start')
      .send({ email: 'spam@example.com' });

    expect(res.status).toBe(429);
    expect(res.body.code).toBe('AUTH_RATE_LIMITED');
  });
});
