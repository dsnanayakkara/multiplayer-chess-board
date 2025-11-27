# Multiplayer Chess POC - Design Document

## Overview
Minimal viable multiplayer chess game for intranet use. Two players compete in standard chess with optional spectators.

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

## Game Model

### Player Structure
- **White Player**: First player to join the room
- **Black Player**: Second player to join the room
- **Spectators**: Players 3+ join as view-only observers
- **Turn-based**: Players alternate moves (white → black → white...)

### Game Flow
1. Player 1 creates room → receives room code → assigned white
2. Player 2 joins with room code → assigned black
3. Game starts automatically when 2 players connected
4. Players alternate making moves
5. Server validates and broadcasts each move
6. Game ends on checkmate/draw/resignation

## Data Models

### Room
```typescript
{
  id: string,
  players: Player[],  // First 2 are players, rest are spectators
  status: 'waiting' | 'active' | 'ended',
  createdAt: timestamp
}
```

### Player
```typescript
{
  id: string,         // socket.id
  name: string,       // display name
  color: 'white' | 'black' | null,  // assigned color
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

### Game State
```typescript
{
  fen: string,        // Board position in FEN notation
  currentTurn: 'white' | 'black',
  isCheck: boolean,
  isCheckmate: boolean,
  isDraw: boolean,
  lastMove?: { from: string; to: string }
}
```

## WebSocket Events

### Client → Server
- `create-room` → { playerName }
- `join-room` → { roomId, playerName }
- `make-move` → { roomId, from, to, promotion? }
- `resign` → { roomId }

### Server → Client
- `room-created` → { roomId, players, color, gameState }
- `room-joined` → { roomId, players, color, role, gameState, status }
- `player-joined` → { player, players }
- `game-started` → { gameState, players }
- `move-made` → { move, gameState, playerName }
- `invalid-move` → { error }
- `game-ended` → { result, winner, reason }
- `player-left` → { player, players, status }
- `error` → { message }

## Key Design Decisions

### 1. No Authentication (Phase 1)
- Players provide display name only
- Socket.id used as playerId
- Trust all clients (intranet assumption)
- Acceptable for POC environment

### 2. In-Memory State
- Room data stored in Map (roomId → Room)
- No persistence between server restarts
- Acceptable for POC
- Simple and fast

### 3. Strong Consistency
- Server is single source of truth
- Client sends intent, server validates
- Server broadcasts authoritative state
- Clients render received state (no optimistic updates for POC)

### 4. Player Assignment
- First player to join room = white
- Second player to join room = black
- Players 3+ = spectators (view-only)
- Simple, deterministic, fair

### 5. Game Start Condition
- Game auto-starts when 2 players join
- No manual "ready" button needed
- Immediate gameplay

## Validation & Concurrency

### Move Validation
- chess.js validates all moves
- Server checks: correct turn, legal move, correct player
- Reject if validation fails
- Return specific error messages

### Concurrency Control
- Single-threaded Node.js event loop
- Move processing is sequential
- No race conditions (event loop serializes requests)
- No locking needed

### Turn Enforcement
- Only the player whose color matches currentTurn can move
- Server validates player identity and turn
- Spectators cannot make moves

## End Game Detection

### Automatic Detection
- chess.js detects: checkmate, stalemate, draw (threefold repetition, insufficient material)
- Server broadcasts result to all participants

### Manual Termination
- Player resignation
- Player disconnect (game ends if < 2 players remain)

### Timeout Detection
- NOT in POC (future enhancement)
- Would require chess clocks

## Spectator Mode

### Implementation
- Players joining after 2 slots filled become spectators
- Spectators receive all game state broadcasts
- Spectators cannot make moves (server validates)
- Spectators appear in separate list in UI

### Limitations (POC)
- No spectator chat
- No spectator-specific features
- Simple view-only implementation

## Non-Goals (Out of Scope)

### Phase 1 Exclusions
- User accounts / authentication
- Persistent game history
- Move history replay
- Time controls / chess clocks
- Matchmaking / ELO ratings
- In-game chat (use external voice/chat)
- Reconnection handling
- Mobile apps

## Deployment (POC)

### Infrastructure
- Single Node.js server process
- Can handle ~50 games (100 users) easily
- Deploy on intranet VM or Docker container
- Serve static React build from Express

### Configuration
- PORT environment variable (default: 3001)
- No database configuration needed
- No external service dependencies

## Success Metrics (POC)

### Functional
- 2 players can join a room
- Players can make valid moves
- Game state updates in real-time
- Game ends correctly on checkmate/draw/resignation
- Spectators can watch games

### Performance
- Move latency < 500ms on LAN
- Support 50+ concurrent games
- No memory leaks during extended play

### Usability
- Intuitive UI requiring no training
- Clear error messages
- Room codes easy to share

## Security Considerations (POC)

### Known Limitations
- No input sanitization (intranet trust model)
- No rate limiting
- No authentication/authorization
- Socket.id is predictable

### Future Improvements
- Add input validation
- Implement rate limiting
- Add authentication layer
- Use secure session tokens

## Scalability Path (Future)

### When Needed
- Add Redis for session state (horizontal scaling)
- Add database for persistence
- Implement load balancing
- Add WebSocket sticky sessions

### Not Needed for POC
- Current in-memory approach sufficient
- Premature optimization avoided
