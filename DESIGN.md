# 2v2 Multiplayer Chess POC - Design Document

## Overview
Minimal viable 2v2 chess game for intranet use. Two teams (white/black), 2 players per team, collaborate on moves in real-time.

## Architecture

### Tech Stack
- **Backend**: Node.js + Express + Socket.IO (WebSocket)
- **Frontend**: React + Socket.IO client
- **Chess Logic**: chess.js (validation, move generation, game state)
- **Chess UI**: react-chessboard (visual board component)
- **Storage**: In-memory (Map/Object) - no DB for POC

### Components

```
┌─────────────┐      WebSocket      ┌──────────────┐
│   Browser   │◄────────────────────►│ Game Server  │
│  (React)    │                      │  (Node.js)   │
└─────────────┘                      └──────────────┘
     │                                      │
     │                                      │
  UI Layer                            Game Engine
  - Chessboard                        - Room Manager
  - Room Join/Create                  - Game State
  - Move Input                        - Validation
                                      - Broadcasting
```

## Game Model (2v2 Mechanics)

### Team Structure
- **White Team**: 2 players (both can see board, discuss moves)
- **Black Team**: 2 players (both can see board, discuss moves)
- **Move Authority**: ANY player from active team can submit move
- **Turn-based**: White team → Black team → White team...

### Game Flow
1. Host creates room → receives room code
2. 3 other players join with room code
3. Server assigns teams (first 2 = white, next 2 = black)
4. Game starts when 4 players connected
5. Players make moves, server validates and broadcasts
6. Game ends on checkmate/draw/resignation

## Data Models

### Room
```typescript
{
  roomId: string,
  players: Player[],  // max 4
  gameState: Chess,   // chess.js instance
  status: 'waiting' | 'active' | 'ended',
  currentTurn: 'white' | 'black',
  createdAt: timestamp
}
```

### Player
```typescript
{
  playerId: string,   // socket.id
  name: string,       // display name
  team: 'white' | 'black' | null,
  role: 'player' | 'spectator'
}
```

### Move Message
```typescript
{
  roomId: string,
  from: string,       // e.g., 'e2'
  to: string,         // e.g., 'e4'
  promotion?: string  // 'q', 'r', 'b', 'n'
}
```

## WebSocket Events

### Client → Server
- `create-room` → { playerName }
- `join-room` → { roomId, playerName }
- `make-move` → { roomId, from, to, promotion? }
- `resign` → { roomId }

### Server → Client
- `room-created` → { roomId }
- `room-joined` → { roomId, players, team, gameState }
- `player-joined` → { player }
- `game-started` → { gameState }
- `move-made` → { move, gameState, currentTurn }
- `invalid-move` → { error }
- `game-ended` → { result, reason }
- `error` → { message }

## Key Design Decisions

### 1. No Authentication (Phase 1)
- Players provide display name only
- Socket.id used as playerId
- Trust all clients (intranet assumption)

### 2. In-Memory State
- Room data stored in Map (roomId → Room)
- No persistence between server restarts
- Acceptable for POC

### 3. Strong Consistency
- Server is single source of truth
- Client sends intent, server validates
- Server broadcasts authoritative state
- Clients render received state (no optimistic updates for POC)

### 4. Team Move Authority
- ANY player on active team can submit move
- No turn-taking within team (simplest approach)
- Teams self-coordinate via chat/voice (out of scope)

### 5. Game Start Condition
- Game auto-starts when 4 players join
- First 2 join → white team
- Next 2 join → black team

## Validation & Concurrency

### Move Validation
- chess.js validates all moves
- Server checks: correct turn, legal move, correct team
- Reject if validation fails

### Concurrency Control
- Single-threaded Node.js event loop
- Move processing is sequential
- Race condition: if 2 teammates submit simultaneously, first wins
- No locking needed (event loop serializes)

## End Game Detection
- chess.js detects: checkmate, stalemate, draw
- Server detects: resignation
- Timeout detection: NOT in POC (future enhancement)

## Spectator Mode (Optional - Phase 2)
- Join as 5+ player → spectator role
- Receive broadcasts, cannot make moves
- Lower priority for MVP

## Non-Goals (Out of Scope)
- User accounts / authentication
- Persistent game history
- Matchmaking / ELO
- Chat (use external voice/chat)
- Reconnection handling
- Move history replay
- Time controls / clocks

## Deployment (POC)
- Single Node.js server
- Can handle ~50 games (100 users) easily
- Deploy on intranet VM or Docker container
- Serve static React build from Express

## Success Metrics (POC)
- 4 players can join a room
- Teams can make valid moves
- Game state updates in real-time
- Game ends correctly on checkmate/draw
- Move latency < 500ms on LAN
