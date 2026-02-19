# Multiplayer Chess

A real-time multiplayer chess game for web browsers with spectator support.

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
cp .env.example .env
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
   - Create a room and share the code with a friend
   - First player gets white, second gets black
   - Additional players (3+) join as spectators

## Environment Variables

### Backend (`backend/.env`)

- `PORT` - HTTP/WebSocket server port (default `3001`)
- `APP_ORIGIN` - frontend origin allowed by CORS (e.g. `http://localhost:5173`)
- `PUBLIC_APP_URL` - URL used to generate magic-link URLs
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SESSION_SECRET` - session secret (required in production, 32+ chars)

### Frontend (`frontend/.env`)

- `VITE_SOCKET_URL` - Socket.IO backend URL (e.g. `http://localhost:3001`)
- `VITE_API_URL` - HTTP API base URL (e.g. `http://localhost:3001`)

## Auth HTTP Endpoints

- `GET /api/auth/me`
- `GET /api/auth/csrf`
- `POST /api/auth/magic-link/start`
- `POST /api/auth/magic-link/verify`
- `POST /api/auth/logout`

## Documentation

- **[DESIGN.md](./DESIGN.md)** - Architecture, tech stack, and design decisions
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Jira-style tickets and sprint plan
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide, API docs, and deployment

## Features Implemented

✅ Create/join rooms with unique codes
✅ 1v1 multiplayer gameplay
✅ Real-time move synchronization
✅ Full chess rules validation (chess.js)
✅ Checkmate/stalemate/draw detection
✅ Resignation support
✅ Spectator mode (3+ players)
✅ Guest-first identity sessions
✅ Magic-link account upgrade flow
✅ Socket identity binding (guest/account)
✅ CSRF protection for auth mutations
✅ Auth rate limiting for magic-link requests
✅ Clean, responsive UI

## Security Features

- Cookie-based guest/account sessions (`httpOnly`, `sameSite=lax`, `secure` in production)
- CSRF token issuance and enforcement for protected auth operations
- Route-level rate limiting for magic-link start endpoint
- Magic-link verification and one-time session upgrade flow
- Server-side identity resolution for Socket.IO connections

## Roadmap / TODO

- [x] User authentication and accounts (guest + magic-link upgrade)
- [ ] Persistent game history and replay
- [ ] Time controls / chess clocks
- [ ] Player ratings / ELO system
- [ ] Matchmaking
- [ ] In-game chat
- [ ] Reconnection handling and robust resume flow
- [ ] Mobile native apps

## Tech Stack

- **Backend:** Node.js, Express, Socket.IO, chess.js, TypeScript
- **Frontend:** React, Vite, react-chessboard, Socket.IO client, TypeScript
- **Game Logic:** chess.js (battle-tested chess engine)
- **Real-time:** Socket.IO (WebSocket)

---

## System Requirements

### 1. Functional Requirements

#### FR-1: Room Management
- **FR-1.1**: Users shall be able to create a new game room with a unique 6-character alphanumeric code
- **FR-1.2**: Users shall be able to join an existing room using a room code
- **FR-1.3**: The system shall assign white to the first player and black to the second player
- **FR-1.4**: The system shall allow additional users (3+) to join as spectators with view-only access

#### FR-2: Game Play
- **FR-2.1**: The system shall enforce standard chess rules for all moves
- **FR-2.2**: The system shall validate that only the player whose turn it is can make a move
- **FR-2.3**: The system shall broadcast all moves to all participants in real-time
- **FR-2.4**: The system shall support pawn promotion (auto-promote to queen)
- **FR-2.5**: The system shall allow players to resign from the game

#### FR-3: Game State Management
- **FR-3.1**: The system shall detect and announce checkmate conditions
- **FR-3.2**: The system shall detect and announce stalemate conditions
- **FR-3.3**: The system shall detect and announce draw conditions (threefold repetition, insufficient material)
- **FR-3.4**: The system shall maintain game state on the server as the single source of truth

#### FR-4: User Interface
- **FR-4.1**: The UI shall display the current board position
- **FR-4.2**: The UI shall indicate whose turn it is
- **FR-4.3**: The UI shall show both players' names
- **FR-4.4**: The UI shall display the room code for sharing
- **FR-4.5**: The UI shall show game result when the game ends

#### FR-5: Identity and Session Management
- **FR-5.1**: Users shall be able to play as guests without registration
- **FR-5.2**: Users shall be able to upgrade to an account via magic link
- **FR-5.3**: Session identity shall be maintained with secure cookies

### 2. Non-Functional Requirements

#### NFR-1: Performance
- **NFR-1.1**: Move latency shall be under 500ms on local network
- **NFR-1.2**: The system shall support up to 100 concurrent users (~50 simultaneous games)

#### NFR-2: Consistency
- **NFR-2.1**: The server shall be the authoritative source for all game state
- **NFR-2.2**: All move validation shall occur server-side

#### NFR-3: Availability
- **NFR-3.1**: The system shall be available during testing periods
- **NFR-3.2**: Graceful degradation is acceptable for this POC

#### NFR-4: Usability
- **NFR-4.1**: The UI shall be intuitive and require no training
- **NFR-4.2**: The system shall provide clear error messages for invalid actions

#### NFR-5: Development Priorities
- **NFR-5.1**: Simplicity and rapid delivery are prioritized over premature optimization
- **NFR-5.2**: KISS (Keep It Simple, Stupid) and YAGNI (You Aren't Gonna Need It) principles shall be followed

### 3. System Actors

| Actor | Description |
|-------|-------------|
| **Player** | Human user playing chess in a web browser |
| **Spectator** | Human user viewing a game without playing |
| **Web Client** | Browser-based UI application |
| **Game Server** | Backend server managing authoritative game state and validation |
| **WebSocket Server** | Real-time bidirectional communication layer |

### 4. Key Use Cases

#### UC-1: Create and Join Game

**Primary Actor**: Player

**Preconditions**: User has access to the web application

**Main Flow**:
1. Player navigates to landing page
2. Player enters display name
3. Player creates a new room OR enters an existing room code
4. System assigns player a color (white/black) or spectator role
5. System displays waiting screen if second player hasn't joined
6. Game starts automatically when 2 players are present

**Postconditions**: Player is in an active or waiting game room

#### UC-2: Make a Move

**Primary Actor**: Player

**Preconditions**:
- Game is active
- It is the player's turn

**Main Flow**:
1. Player drags and drops a piece on the chessboard UI
2. Client sends move to server via WebSocket: `{roomId, from, to, promotion?}`
3. Server validates:
   - Is it the player's turn?
   - Is the move legal per chess rules?
4. If valid:
   - Server updates game state
   - Server broadcasts new state to all clients
   - Server checks for end conditions
5. If invalid:
   - Server sends error message to client
   - Client displays error to player

**Postconditions**: Board state is updated or error is displayed

#### UC-3: End Game

**Primary Actor**: System

**Preconditions**: Game is active

**Triggers**:
- Checkmate is detected
- Stalemate/draw is detected
- Player resigns
- Player disconnects

**Main Flow**:
1. System detects end condition
2. System broadcasts game result to all participants
3. System marks room as ended
4. UI displays result modal with option to start new game

**Postconditions**: Game is ended and result is displayed

### 5. System Architecture Overview

```
┌─────────────┐      WebSocket      ┌──────────────┐
│   Browser   │◄────────────────────►│ Game Server  │
│  (React)    │      Socket.IO      │  (Node.js)   │
└─────────────┘                      └──────────────┘
     │                                      │
     │                                      │
  UI Layer                            Game Engine
  - Chessboard (react-chessboard)    - Room Manager
  - Room Join/Create                 - Chess Rules (chess.js)
  - Real-time Updates                - Move Validation
                                     - State Management
```

### 6. Data Flow: Move Execution

```
Player makes move
    ↓
Client validates basic conditions (is it my turn?)
    ↓
Send via WebSocket: {roomId, from, to, promotion}
    ↓
Server receives and validates:
  - Room exists?
  - Player authorized?
  - Player's turn?
  - Move legal? (chess.js)
    ↓
If valid:                          If invalid:
  - Update game state                - Send error
  - Check win conditions             - Client shows message
  - Broadcast to all clients
  - Send confirmation
    ↓
All clients update board display
```

### 7. Out of Scope (Phase 1)

The following features are explicitly out of scope for this POC:

- Persistent game history or database
- Move history replay
- Time controls / chess clocks
- Player ratings / ELO system
- Matchmaking
- In-game chat
- Move hints or analysis
- Reconnection handling
- Mobile native apps
