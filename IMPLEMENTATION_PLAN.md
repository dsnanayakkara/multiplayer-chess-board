# Implementation Plan - Jira-Style Tickets

## Epic: 2v2 Multiplayer Chess POC
Build minimal viable 2v2 chess game for intranet use with real-time gameplay.

---

## Sprint 1: Foundation & Backend

### CHESS-1: Project Setup & Dependencies
**Type**: Task
**Priority**: Highest
**Story Points**: 2

**Description**:
Set up monorepo structure with backend and frontend. Install core dependencies.

**Acceptance Criteria**:
- [ ] Initialize Node.js backend with TypeScript
- [ ] Initialize React frontend with TypeScript
- [ ] Install chess.js, socket.io, express, react-chessboard
- [ ] Configure build scripts
- [ ] Add .gitignore and basic README

**Tech Notes**:
```bash
Backend: express, socket.io, chess.js, cors
Frontend: react, socket.io-client, react-chessboard
```

---

### CHESS-2: Implement Room Manager
**Type**: Story
**Priority**: Highest
**Story Points**: 3

**Description**:
Create in-memory room management system to create/join/track game rooms.

**Acceptance Criteria**:
- [ ] RoomManager class with create/join/get methods
- [ ] Generate unique room codes (6-char alphanumeric)
- [ ] Store rooms in Map with roomId as key
- [ ] Auto-assign teams (first 2 white, next 2 black)
- [ ] Limit 4 players per room
- [ ] Track room status (waiting/active/ended)

**Tech Notes**:
```typescript
class RoomManager {
  createRoom(playerName: string): Room
  joinRoom(roomId: string, playerName: string): Room
  getRoom(roomId: string): Room | undefined
}
```

---

### CHESS-3: Implement Game Engine
**Type**: Story
**Priority**: Highest
**Story Points**: 5

**Description**:
Integrate chess.js for game state, move validation, and end-game detection.

**Acceptance Criteria**:
- [ ] Initialize chess.js instance per room
- [ ] Validate moves using chess.js
- [ ] Check player team matches current turn
- [ ] Detect checkmate, stalemate, draw
- [ ] Return FEN string for board state
- [ ] Handle pawn promotion
- [ ] Reject invalid moves with error message

**Tech Notes**:
- Use `chess.move()` for validation
- Use `chess.isCheckmate()`, `chess.isDraw()`, etc.
- Store chess instance in Room object

---

### CHESS-4: Implement WebSocket Server
**Type**: Story
**Priority**: Highest
**Story Points**: 5

**Description**:
Set up Socket.IO server with event handlers for room and game actions.

**Acceptance Criteria**:
- [ ] Socket.IO server initialized with Express
- [ ] Handle `create-room` event
- [ ] Handle `join-room` event
- [ ] Handle `make-move` event
- [ ] Handle `resign` event
- [ ] Broadcast game state updates to room
- [ ] Send errors to individual clients
- [ ] Handle disconnect (remove player from room)

**Events**:
```
Client→Server: create-room, join-room, make-move, resign
Server→Client: room-created, room-joined, game-started, move-made, game-ended, error
```

---

## Sprint 2: Frontend & Integration

### CHESS-5: Create Landing Page & Room UI
**Type**: Story
**Priority**: High
**Story Points**: 3

**Description**:
Build landing page with create/join room forms.

**Acceptance Criteria**:
- [ ] Landing page with "Create Room" button
- [ ] "Join Room" form with room code input
- [ ] Player name input field
- [ ] Navigate to game page on success
- [ ] Display error messages

**Components**:
- `LandingPage.tsx`
- `CreateRoom.tsx`
- `JoinRoom.tsx`

---

### CHESS-6: Implement Chess Board UI
**Type**: Story
**Priority**: High
**Story Points**: 5

**Description**:
Create game board component with react-chessboard, display teams and turn indicator.

**Acceptance Criteria**:
- [ ] Render chessboard with react-chessboard
- [ ] Display current position from FEN
- [ ] Show player names and teams
- [ ] Show current turn indicator
- [ ] Show "Waiting for players..." if < 4 players
- [ ] Flip board for black team players
- [ ] Display room code

**Components**:
- `GameBoard.tsx`
- `PlayerList.tsx`
- `TurnIndicator.tsx`

---

### CHESS-7: Implement Move Input & Validation
**Type**: Story
**Priority**: High
**Story Points**: 3

**Description**:
Handle drag-and-drop moves, send to server, display validation errors.

**Acceptance Criteria**:
- [ ] Enable drag-and-drop on chessboard
- [ ] Send move to server via WebSocket
- [ ] Disable moves if not player's team turn
- [ ] Handle promotion dialog (pawn to 8th rank)
- [ ] Display error toast on invalid move
- [ ] Disable board on game end

**Tech Notes**:
- Use `onPieceDrop` callback from react-chessboard
- Check local team before sending move

---

### CHESS-8: Implement Real-Time Updates
**Type**: Story
**Priority**: High
**Story Points**: 3

**Description**:
Connect WebSocket client, listen for game updates, update UI state.

**Acceptance Criteria**:
- [ ] Connect to Socket.IO server on mount
- [ ] Listen for `move-made` and update board
- [ ] Listen for `player-joined` and update player list
- [ ] Listen for `game-started` and enable board
- [ ] Listen for `game-ended` and show result modal
- [ ] Handle `error` events with toast notifications
- [ ] Disconnect on unmount

**Tech Notes**:
```typescript
socket.on('move-made', (data) => {
  setFen(data.gameState.fen)
  setCurrentTurn(data.currentTurn)
})
```

---

## Sprint 3: Polish & Testing

### CHESS-9: End Game Handling
**Type**: Story
**Priority**: Medium
**Story Points**: 2

**Description**:
Display game result modal and resignation button.

**Acceptance Criteria**:
- [ ] Show modal on checkmate/draw with result
- [ ] Display winning team or draw reason
- [ ] "Resign" button for active players
- [ ] Confirm resignation with dialog
- [ ] Return to landing page button

**Components**:
- `GameResultModal.tsx`
- `ResignButton.tsx`

---

### CHESS-10: Error Handling & Edge Cases
**Type**: Task
**Priority**: Medium
**Story Points**: 3

**Description**:
Handle disconnections, invalid room codes, full rooms.

**Acceptance Criteria**:
- [ ] Show error if room not found
- [ ] Show error if room full (4 players)
- [ ] Remove disconnected players from room
- [ ] End game if < 2 players remain (future: handle reconnect)
- [ ] Validate room code format on client

---

### CHESS-11: Integration Testing
**Type**: Task
**Priority**: Medium
**Story Points**: 3

**Description**:
Test full game flow with 4 clients.

**Acceptance Criteria**:
- [ ] 4 players can join same room
- [ ] Teams assigned correctly (2 white, 2 black)
- [ ] All players see moves in real-time
- [ ] Game ends on checkmate
- [ ] Invalid moves rejected
- [ ] Resignation works

**Test Cases**:
- Happy path: 4 players, full game to checkmate
- Edge: Player disconnects mid-game
- Edge: Invalid move submission
- Edge: Both teammates try simultaneous moves

---

### CHESS-12: Deployment Setup
**Type**: Task
**Priority**: Low
**Story Points**: 2

**Description**:
Create Docker setup and deployment instructions.

**Acceptance Criteria**:
- [ ] Dockerfile for backend
- [ ] Serve React build from Express
- [ ] Environment variables for port/config
- [ ] Docker Compose with single service
- [ ] README with deployment steps

**Tech Notes**:
```dockerfile
FROM node:18
# Build frontend, copy to backend/public
# Start Express server
```

---

## Optional (Phase 2 - Post-POC)

### CHESS-13: Spectator Mode
**Type**: Story
**Priority**: Low
**Story Points**: 3

**Description**:
Allow 5+ players to join as spectators (view-only).

**Acceptance Criteria**:
- [ ] Players 5+ assigned spectator role
- [ ] Spectators receive game updates
- [ ] Spectators cannot make moves
- [ ] Show spectator count in UI

---

### CHESS-14: Move History Display
**Type**: Story
**Priority**: Low
**Story Points**: 2

**Description**:
Display list of past moves in algebraic notation.

**Acceptance Criteria**:
- [ ] Show move list (1. e4 e5 2. Nf3...)
- [ ] Auto-scroll to latest move
- [ ] Highlight last move on board

---

## Summary

**Total Story Points**: 30 (Core) + 5 (Optional)
**Estimated Duration**: 2-3 sprints (2-3 weeks)

**Sprint 1**: CHESS-1 to CHESS-4 (Backend foundation)
**Sprint 2**: CHESS-5 to CHESS-8 (Frontend & integration)
**Sprint 3**: CHESS-9 to CHESS-11 (Polish & testing)
**Deployment**: CHESS-12

**Critical Path**: CHESS-1 → CHESS-2 → CHESS-3 → CHESS-4 → CHESS-6 → CHESS-7 → CHESS-8
