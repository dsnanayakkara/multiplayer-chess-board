import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../../src/app';

describe('POST /api/auth/magic-link/start', () => {
  it('returns ok for valid email without disclosing account existence', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/auth/magic-link/start')
      .send({ email: 'player@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
