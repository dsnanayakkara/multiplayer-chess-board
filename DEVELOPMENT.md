# Development Guide

## Project Structure

```
multiplayer-chess-board/
├── backend/              # Node.js + Express + Socket.IO server
│   ├── src/
│   │   ├── index.ts     # Main server entry point
│   │   ├── types.ts     # TypeScript type definitions
│   │   ├── RoomManager.ts   # Room creation and management
│   │   └── GameEngine.ts    # Chess game logic wrapper
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx      # Main app component
│   │   ├── LandingPage.tsx  # Create/join room UI
│   │   ├── GameBoard.tsx    # Chess board and game UI
│   │   ├── useSocket.ts     # Socket.IO custom hook
│   │   └── types.ts         # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
├── DESIGN.md             # Architecture and design decisions
├── IMPLEMENTATION_PLAN.md # Jira-style implementation tickets
└── README.md             # Project overview and requirements
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Development Workflow

### Running Both Services

**Option 1: Two terminals**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Option 2: Single command (from project root)**
```bash
# Install concurrently globally if needed
npm install -g concurrently

# Run both services
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

### Testing the Application

1. Open browser to `http://localhost:5173`
2. Create a room with a player name
3. Copy the room code
4. Open 3 more browser tabs/windows (or use incognito)
5. Join the same room with different player names
6. Play chess!

### Key Development Commands

**Backend:**
```bash
npm run dev      # Start dev server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm run test     # Run backend test suite
npm run db:migrate # Apply SQL migrations
npm start        # Run compiled production build
```

**Frontend:**
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run test     # Run frontend test suite
npm run preview  # Preview production build
```

### Auth Environment Variables

Backend (`backend/.env`):
- `DATABASE_URL`
- `REDIS_URL`
- `SESSION_SECRET`
- `APP_ORIGIN`
- `PUBLIC_APP_URL`

Frontend (`frontend/.env`):
- `VITE_SOCKET_URL`
- `VITE_API_URL`

## Architecture Overview

### Backend (Server)

**RoomManager** (`RoomManager.ts`):
- Creates unique 6-character room codes
- Manages player joins and team assignments
- Handles player disconnections
- Tracks room status (waiting/active/ended)

**GameEngine** (`GameEngine.ts`):
- Wraps chess.js library for game logic
- Validates all moves
- Detects checkmate, stalemate, draw
- Manages game state (FEN, turn, check status)

**WebSocket Server** (`index.ts`):
- Socket.IO event handlers
- Room broadcasting
- Error handling
- Serves frontend build in production

### Frontend (Client)

**App.tsx**:
- Main application logic
- Routes between landing page and game board
- Manages global state (room data)

**LandingPage.tsx**:
- Create room UI
- Join room UI
- Player name input

**GameBoard.tsx**:
- Chess board rendering (react-chessboard)
- Player list and team display
- Turn indicator
- Move handling
- Game end modal

**useSocket.ts**:
- Custom React hook for Socket.IO
- Connection management
- Auto-reconnection

## WebSocket Events

### Client → Server
- `create-room` - Create a new game room
- `join-room` - Join existing room by code
- `make-move` - Submit a chess move
- `resign` - Resign from the game

### Server → Client
- `room-created` - Room created successfully
- `room-joined` - Joined room successfully
- `game-started` - 4 players joined, game begins
- `move-made` - Move validated and applied
- `invalid-move` - Move rejected with error
- `game-ended` - Game finished with result
- `player-joined` - Another player joined
- `player-left` - Player disconnected
- `error` - General error message

### Auth HTTP Endpoints
- `GET /api/auth/me`
- `GET /api/auth/csrf`
- `POST /api/auth/magic-link/start`
- `POST /api/auth/magic-link/verify`
- `POST /api/auth/logout`

## Game Rules (2v2)

- **Team Assignment**: First 2 players = White, Next 2 = Black
- **Move Authority**: ANY player on the active team can make a move
- **No Turn Queue**: Teams self-coordinate (use voice/chat externally)
- **Standard Chess**: All standard chess rules apply
- **End Conditions**: Checkmate, stalemate, draw, resignation

## Development Tips

### Debugging WebSocket

Enable Socket.IO debug logs:
```bash
# Backend
DEBUG=socket.io* npm run dev

# Frontend (in browser console)
localStorage.debug = 'socket.io-client:*'
```

### Testing with Multiple Clients

Use browser profiles or incognito windows to simulate multiple players on the same machine.

### Common Issues

**CORS errors:**
- Check backend CORS configuration in `index.ts`
- Ensure frontend `.env` has correct `VITE_SOCKET_URL`

**Board not updating:**
- Check browser console for WebSocket errors
- Verify backend is running and accessible
- Check that room ID matches

**Invalid move errors:**
- chess.js is strict about legal moves
- Ensure it's the correct team's turn
- Check that the move notation is valid (e.g., 'e2', 'e4')

## Production Deployment

### Build for Production

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build
```

### Deploy

The backend serves the frontend in production:

1. Copy `frontend/dist` to `backend/dist/frontend`
2. Set environment variable `PORT` if needed
3. Start backend: `cd backend && npm start`
4. Access app at `http://your-server:3001`

### Docker (Optional)

A Dockerfile can be created to containerize the application:

```dockerfile
FROM node:18

WORKDIR /app

# Copy and build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend
RUN cd frontend && npm run build

# Copy and build backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend ./backend
RUN cd backend && npm run build

# Copy frontend build to backend
RUN cp -r frontend/dist backend/dist/frontend

WORKDIR /app/backend

EXPOSE 3001

CMD ["npm", "start"]
```

## Future Enhancements (Out of Scope for POC)

- Player reconnection handling
- Move history and game replay
- Time controls / chess clocks
- Chat within the game
- Spectator mode improvements
- Persistent game storage
- Matchmaking / ELO ratings
