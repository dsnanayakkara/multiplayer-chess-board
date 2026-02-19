import { createServer } from 'http';
import { Server } from 'socket.io';
import { RoomManager } from './RoomManager';
import { GameEngine } from './GameEngine';
import { MoveRequest } from './types';
import { createApp } from './app';

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, restrict this to your domain
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();
const gameEngine = new GameEngine();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  /**
   * Create a new room
   */
  socket.on('create-room', ({ playerName }: { playerName: string }) => {
    try {
      const room = roomManager.createRoom(socket.id, playerName);

      // Initialize game
      gameEngine.initGame(room.id);

      // Join socket room
      socket.join(room.id);

      // Send room details to creator
      socket.emit('room-created', {
        roomId: room.id,
        players: room.players,
        color: 'white',
        gameState: gameEngine.getGameState(room.id),
      });

      console.log(`Room ${room.id} created by ${playerName}`);
    } catch (error) {
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to create room',
      });
    }
  });

  /**
   * Join an existing room
   */
  socket.on('join-room', ({ roomId, playerName }: { roomId: string; playerName: string }) => {
    try {
      const room = roomManager.joinRoom(roomId, socket.id, playerName);
      const player = roomManager.getPlayer(roomId, socket.id);

      if (!player) {
        socket.emit('error', {
          message: 'Failed to join room',
          code: 'JOIN_FAILED'
        });
        return;
      }

      // Join socket room
      socket.join(roomId);

      // Notify the joining player
      socket.emit('room-joined', {
        roomId: room.id,
        players: room.players,
        color: player.color,
        role: player.role,
        gameState: gameEngine.getGameState(roomId),
        status: room.status,
      });

      // Notify other players
      socket.to(roomId).emit('player-joined', {
        player,
        players: room.players,
      });

      // If game just started (2 players), notify everyone
      if (room.status === 'active' && room.players.length === 2) {
        io.to(roomId).emit('game-started', {
          gameState: gameEngine.getGameState(roomId),
          players: room.players,
        });
      }

      console.log(`${playerName} joined room ${roomId} as ${player.role} (${player.color || 'spectator'})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      let errorCode = 'JOIN_ERROR';

      // Map specific error messages to error codes
      if (errorMessage.includes('not found')) {
        errorCode = 'ROOM_NOT_FOUND';
      } else if (errorMessage.includes('already ended')) {
        errorCode = 'GAME_ENDED';
      }

      socket.emit('error', {
        message: errorMessage,
        code: errorCode,
      });
    }
  });

  /**
   * Make a move
   */
  socket.on('make-move', ({ roomId, from, to, promotion }: MoveRequest) => {
    try {
      const room = roomManager.getRoom(roomId);
      const player = roomManager.getPlayer(roomId, socket.id);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (!player || player.role !== 'player') {
        socket.emit('error', { message: 'You are not a player in this game' });
        return;
      }

      if (room.status !== 'active') {
        socket.emit('error', { message: 'Game is not active' });
        return;
      }

      if (!player.color) {
        socket.emit('error', { message: 'You are not assigned a color' });
        return;
      }

      // Validate it's the player's turn
      if (!gameEngine.validateTurn(roomId, player.color)) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      // Make the move
      const result = gameEngine.makeMove(roomId, from, to, promotion);

      if (!result.success) {
        socket.emit('invalid-move', { error: result.error });
        return;
      }

      // Broadcast move to all players in room
      io.to(roomId).emit('move-made', {
        move: { from, to, promotion },
        gameState: result.gameState,
        playerName: player.name,
      });

      // If game ended, broadcast result
      if (result.result) {
        const winner = result.result === 'checkmate'
          ? (result.gameState!.currentTurn === 'white' ? 'black' : 'white')
          : null;

        io.to(roomId).emit('game-ended', {
          result: result.result,
          winner,
          gameState: result.gameState,
        });

        roomManager.endGame(roomId);
      }
    } catch (error) {
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to make move',
      });
    }
  });

  /**
   * Resign from game
   */
  socket.on('resign', ({ roomId }: { roomId: string }) => {
    try {
      const room = roomManager.getRoom(roomId);
      const player = roomManager.getPlayer(roomId, socket.id);

      if (!room || !player || !player.color) {
        socket.emit('error', { message: 'Invalid resignation request' });
        return;
      }

      const { winner, result } = gameEngine.resign(roomId, player.color);

      io.to(roomId).emit('game-ended', {
        result,
        winner,
        resignedPlayer: player.name,
      });

      roomManager.endGame(roomId);
    } catch (error) {
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to resign',
      });
    }
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Find and remove player from all rooms
    // In a production system, you might want to handle reconnection
    // For POC, we'll just remove the player
    for (const [roomId] of socket.rooms) {
      if (roomId !== socket.id) {
        const player = roomManager.getPlayer(roomId, socket.id);
        if (player) {
          roomManager.removePlayer(roomId, socket.id);

          const room = roomManager.getRoom(roomId);

          // Notify other players
          socket.to(roomId).emit('player-left', {
            player,
            players: room?.players || [],
            status: room?.status || 'ended',
          });

          // If game ended due to insufficient players
          if (room?.status === 'ended') {
            io.to(roomId).emit('game-ended', {
              result: 'resignation',
              reason: 'Player disconnected',
            });
          }
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
});
