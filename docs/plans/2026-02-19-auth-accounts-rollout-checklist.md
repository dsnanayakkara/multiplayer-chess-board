# Auth Accounts Rollout Checklist

## Functional Verification

- [x] Guest flow works (`GET /api/auth/me` returns guest identity)
- [x] Upgrade flow works (`magic-link/start` -> `magic-link/verify` -> account identity)
- [x] Logout flow works (account session resets to guest)

## Security Verification

- [x] Secure cookie behavior verified in app config (`httpOnly`, `sameSite`, prod `secure`)
- [x] Rate limiting verified (`AUTH_RATE_LIMITED` on excessive magic-link requests)
- [x] CSRF verified (`POST /api/auth/logout` without token returns `CSRF_INVALID`)

## Build and Test Verification

- [x] Backend tests pass
- [x] Backend build passes
- [x] Frontend tests pass
- [x] Frontend build passes

## Evidence

- `cd backend && npm run test` -> pass (`10` tests)
- `cd backend && npm run build` -> pass
- `cd frontend && npm run test` -> pass (`2` tests)
- `cd frontend && npm run build` -> pass
- Functional/security evidence from tests:
  - `backend/tests/auth/me.route.test.ts`
  - `backend/tests/auth/magic-link.verify.test.ts`
  - `backend/tests/auth/logout.test.ts`
  - `backend/tests/auth/rate-limit.test.ts`
  - `backend/tests/auth/csrf.test.ts`
