# Multiplayer Chess Board (2v2)

A real-time 2v2 multiplayer chess game for web browsers. Teams of 2 players collaborate to play chess against each other.

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation & Running

1. **Clone and setup:**
```bash
git clone <repository-url>
cd multiplayer-chess-board
```

2. **Backend (Terminal 1):**
```bash
cd backend
npm install
npm run dev
```
Server runs on http://localhost:3001

3. **Frontend (Terminal 2):**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
App runs on http://localhost:5173

4. **Play:**
   - Open http://localhost:5173 in your browser
   - Create a room and share the code with 3 friends
   - First 2 players = White team, Next 2 = Black team
   - Any player on the active team can make moves

## Documentation

- **[DESIGN.md](./DESIGN.md)** - Architecture, tech stack, and design decisions
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Jira-style tickets and sprint plan
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide, API docs, and deployment

## Features Implemented

✅ Create/join rooms with unique codes
✅ 2v2 team-based gameplay
✅ Real-time move synchronization
✅ Full chess rules validation (chess.js)
✅ Checkmate/stalemate/draw detection
✅ Resignation support
✅ Spectator mode (5+ players)
✅ Clean, responsive UI

## Tech Stack

- **Backend:** Node.js, Express, Socket.IO, chess.js, TypeScript
- **Frontend:** React, Vite, react-chessboard, Socket.IO client, TypeScript
- **Game Logic:** chess.js (battle-tested chess engine)
- **Real-time:** Socket.IO (WebSocket)

---

## Requirements (Original Spec)

### Functional requirements

Join game (landing page → create or join a room).

Create a match (host creates a private room / public lobby).

Join a match (by room code or join lobby).

Make a move (submit move, server validates legal move).

Real-time update/broadcast board state to opponent(s).

End game detection (checkmate, draw, resignation, timeout).

Basic spectator mode (optional) — view-only.

POC: no accounts/login, no persistence beyond active session (but support minimal history if desired).

Non-functional requirements (POC / small)

Target concurrency: ≤100 users total (≈50 simultaneous games worst case).

Latency: low (sub-second for moves).

Consistency: strong consistency for game state (single source of truth).

Availability: moderate — should be up during evenings; graceful recovery okay.

Simplicity and rapid delivery prioritized over premature scaling.

Actors

Player (human in browser)

Opponent (another player)

Web Client (browser UI)

Game Server (authoritative game state + validator)

WebSocket Broker or Server (real-time messaging)

Optional DB (for persistent history / POC telemetry)

High-level use case (choose one to walk through)

Use case: Player makes a move

Player A makes move in UI and clicks “Submit”.

Client sends move to Game Server via WebSocket: {gameId, from, to, promotion?}.

Game Server checks: is it Player A’s turn? Is move legal (using move validator / chess library)?

If legal: server updates authoritative board state, increments move number, checks end conditions, persists move (optional), emits update to both clients (opponent + player) via WebSocket.

If illegal: server responds with error and client shows message.

If game ended, server broadcasts final state and reason.

Activity / sequence (verbal / short)

Client connects → opens WebSocket → registers gameId and clientId.

On create: server creates gameId, initial board, assigns white/black, returns room code.

On move: client → WS → server validates → server updates → server → WS broadcast to both clients.
