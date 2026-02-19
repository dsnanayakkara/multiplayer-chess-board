import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('001_auth_core.sql', () => {
  it('creates required auth tables', () => {
    const sql = readFileSync('src/db/migrations/001_auth_core.sql', 'utf8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS auth_magic_links');
  });
});
