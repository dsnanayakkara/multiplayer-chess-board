import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../../src/app';

describe('CSRF protection', () => {
  it('rejects POST /api/auth/logout without csrf header', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_INVALID');
  });
});
