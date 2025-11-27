import { Room, Player, RoomStatus } from './types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  /**
   * Generate a unique 6-character room code
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check for collision (unlikely but safe)
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  /**
   * Create a new room with the host player
   */
  createRoom(playerId: string, playerName: string): Room {
    const roomId = this.generateRoomCode();

    const host: Player = {
      id: playerId,
      name: playerName,
      team: 'white', // First player gets white
      role: 'player',
    };

    const room: Room = {
      id: roomId,
      players: [host],
      status: 'waiting',
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    console.log(`Room created: ${roomId} by ${playerName}`);

    return room;
  }

  /**
   * Join an existing room
   */
  joinRoom(roomId: string, playerId: string, playerName: string): Room {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status === 'ended') {
      throw new Error('Game has already ended');
    }

    // Check if player already in room (reconnection scenario)
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      return room;
    }

    // Determine role and team
    let team = null;
    let role: 'player' | 'spectator' = 'spectator';

    if (room.players.length < 4) {
      role = 'player';
      // First 2 players = white, next 2 = black
      team = room.players.length < 2 ? 'white' : 'black';
    }

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      team,
      role,
    };

    room.players.push(newPlayer);

    // Start game when 4 players joined
    if (room.players.length === 4 && room.status === 'waiting') {
      room.status = 'active';
      console.log(`Game started in room ${roomId}`);
    }

    console.log(`${playerName} joined room ${roomId} as ${role} (${team || 'spectator'})`);

    return room;
  }

  /**
   * Get a room by ID
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Remove a player from a room
   */
  removePlayer(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    console.log(`${player.name} left room ${roomId}`);

    // Clean up empty rooms or end game if not enough players
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    } else if (room.status === 'active' && room.players.filter(p => p.role === 'player').length < 2) {
      room.status = 'ended';
      console.log(`Game ended in room ${roomId} (not enough players)`);
    }
  }

  /**
   * Get player from room
   */
  getPlayer(roomId: string, playerId: string): Player | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    return room.players.find(p => p.id === playerId);
  }

  /**
   * End a game
   */
  endGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = 'ended';
      console.log(`Game ended in room ${roomId}`);
    }
  }
}
