# Auth and Accounts Design

Date: 2026-02-19
Project: multiplayer-chess-board
Status: Approved for planning

## 1. Scope and Decisions

This design introduces authentication and user accounts to the existing guest-first multiplayer chess app.

Confirmed decisions:
- Account model: `Guest + Optional Account Upgrade`
- Upgrade unlocks in v1: `Identity only` (persistent identity, reclaimable across sessions)
- Sign-in method: `Email magic link or passkey` (v1 uses magic link)
- Guest access: Guests can use all current gameplay flows
- Persistence: PostgreSQL
- Security posture: Internet-facing beta defaults

Non-goals for this phase:
- Ratings/ELO, matchmaking, social graph, chat, subscriptions, billing
- Complex profile system
- Multi-provider OAuth (future-compatible schema allowed)

## 2. Current-State Context

Current project behavior:
- No authentication/authorization layer
- In-memory room and game state
- Players identified by socket/session runtime identity
- Socket.IO drives game events (`create-room`, `join-room`, `make-move`, `resign`)

Implication:
- Adding accounts requires durable identity and secure session management without breaking existing guest flows.

## 3. Proposed Architecture

### 3.1 Identity Model

Two identity states:
1. `guest`
2. `account`

Every visitor starts as `guest` automatically. Upgrade flow can promote the current session to `account` without forcing gameplay interruption.

### 3.2 Runtime Components

Backend stays as a unified Express + Socket.IO service and adds auth modules:
- `SessionService` (Redis-backed server sessions)
- `AuthService` (magic link request/verify)
- `UserService` (identity/profile read/update)
- `RateLimitService` (auth and socket abuse controls)
- `GameIdentityAdapter` (bridges identity into room/game logic)

### 3.3 Storage Split

- PostgreSQL: durable account/auth records
- Redis: active session state, transient auth flow state, and rate-limit counters

### 3.4 Session Transport

Session cookie is authoritative for HTTP and Socket.IO handshake identity resolution.

Cookie defaults (production):
- `httpOnly`
- `secure`
- `sameSite=lax`
- short idle timeout + absolute expiration

Session ID rotates on upgrade and logout.

## 4. Data Model

### 4.1 PostgreSQL Tables

`users`
- `id uuid pk`
- `email text unique not null` (normalized lowercase)
- `email_verified_at timestamptz null`
- `display_name text null`
- `avatar_url text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`auth_magic_links`
- `id uuid pk`
- `user_id uuid null references users(id)`
- `email text not null`
- `token_hash text not null`
- `expires_at timestamptz not null`
- `used_at timestamptz null`
- `requested_ip text null`
- `user_agent text null`
- `created_at timestamptz not null default now()`

`user_identities` (future-proofing)
- `id uuid pk`
- `user_id uuid not null references users(id)`
- `provider text not null` (initially `magic_link`)
- `provider_subject text not null`
- `created_at timestamptz not null default now()`

`guest_account_links` (audit/support)
- `id uuid pk`
- `guest_id text not null`
- `user_id uuid not null references users(id)`
- `linked_at timestamptz not null default now()`

### 4.2 Redis Keys

- `sess:<session_id>`: session payload (`guestId`, optional `userId`, timestamps, metadata)
- `rl:<route>:<ip|email>`: rate-limit counters
- `auth_nonce:<id>`: short-lived anti-replay/context state

## 5. API and Socket Contract

### 5.1 HTTP Endpoints

`GET /api/auth/me`
- Returns current identity state and minimal profile
- Example guest response:
```json
{
  "identityType": "guest",
  "displayName": "Guest-AB12",
  "user": null
}
```

`POST /api/auth/magic-link/start`
- Input: `{ "email": "user@example.com" }`
- Output: `{ "ok": true }`
- Always uniform output (prevents account enumeration)

`POST /api/auth/magic-link/verify`
- Input: `{ "token": "<opaque-token>" }`
- Verifies one-time token, creates/loads user, links current session to user, rotates session
- Output:
```json
{
  "ok": true,
  "identityType": "account",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "..."
  }
}
```

`POST /api/auth/logout`
- Invalidates current session, issues fresh guest session

`PATCH /api/users/me` (optional but recommended in v1)
- Updates display name/avatar

### 5.2 Socket.IO Contract

Keep existing gameplay events stable:
- `create-room`
- `join-room`
- `make-move`
- `resign`

Changes:
- Resolve identity from cookie-backed session at handshake
- `playerName` can become optional; server can default from identity profile/display name
- Room player identity should move from socket-only identity to stable guest/account identity mapping

## 6. Core Flows

### 6.1 Anonymous Guest Start
1. User opens app
2. Backend ensures guest session cookie exists
3. Frontend calls `/api/auth/me` and shows guest identity
4. User can create/join/play immediately

### 6.2 Upgrade to Account
1. Guest submits email
2. Backend creates one-time magic link token (hashed-at-rest)
3. Backend sends magic-link email
4. User opens link and verifies token
5. Backend creates/loads user, links current session, rotates session
6. Frontend refreshes identity state to `account`

### 6.3 Post-Upgrade Gameplay
1. Socket uses updated cookie session
2. Server recognizes stable account identity
3. Existing gameplay remains unchanged

## 7. Security and Abuse Controls

### 7.1 Token Security
- High-entropy token generation
- Store only token hash
- One-time usage via `used_at`
- Expire after 10-15 minutes

### 7.2 Rate Limiting
- Per-IP and per-email limit on magic-link start
- Verify endpoint throttling
- Socket connect/event abuse counters

### 7.3 CSRF/XSS/CORS
- CSRF protection for mutating cookie-authenticated routes
- Input validation/sanitization on user-editable fields
- Strict CORS allow-list in production (no wildcard)
- Add/maintain restrictive CSP headers

### 7.4 Transport
- HTTPS-only production
- HSTS at edge/reverse proxy

## 8. Error Handling

User-facing errors:
- Expired/used magic link: prompt to request a new link
- Rate-limited actions: clear retry messaging
- Generic failures: stable message + correlation ID

Server-facing:
- Structured error codes (e.g., `AUTH_TOKEN_EXPIRED`, `AUTH_RATE_LIMITED`)
- Auth audit logging for request/verify/logout lifecycle

## 9. Testing Strategy

### 9.1 Unit
- Session lifecycle (create/rotate/invalidate/expiry)
- Magic-link lifecycle (issue/hash/verify/expire/reuse-block)
- Identity adapter behavior (guest/account resolution)

### 9.2 Integration
- `start -> verify -> /me` happy path
- Invalid/expired/reused token paths
- Rate-limit behavior and non-enumeration response parity
- Logout resets to guest identity
- Socket handshake identity after upgrade

### 9.3 Security
- Cookie flags in production mode
- CSRF enforcement on mutating endpoints
- Abuse burst tests on auth routes

### 9.4 Manual E2E
- Guest creates and plays game
- Guest upgrades mid-session without breaking flow
- Returning account session resolves correctly
- Spectator/player mechanics unchanged

## 10. Rollout Plan

1. Phase 1: Foundation
- Add PostgreSQL and Redis wiring
- Add session middleware + `GET /api/auth/me`

2. Phase 2: Upgrade Flow
- Add magic-link start/verify/logout
- Add minimal frontend upgrade UI

3. Phase 3: Socket Identity Hardening
- Resolve identity via session cookie in handshake
- Keep gameplay payloads backward-compatible

4. Phase 4: Security + Observability
- Rate limiting, CSRF, structured logs, metrics, alerts

5. Phase 5: Controlled Launch
- Feature flag auth upgrade path
- Staged rollout: internal -> beta subset -> full exposure

## 11. Acceptance Criteria

- Guests can still create/join/play with no forced login
- Users can upgrade via magic link and retain stable account identity
- `/api/auth/me` reflects correct identity state
- Session rotation occurs on upgrade/logout
- Security controls enabled for internet-facing deployment
- Socket/game flows remain functional with identity integration

