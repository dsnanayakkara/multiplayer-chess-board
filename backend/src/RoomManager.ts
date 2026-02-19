import { Room, Player, RoomStatus } from './types';

interface IdentityContext {
  identityId: string;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private pendingDeletions: Map<string, NodeJS.Timeout> = new Map();
  private readonly GRACE_PERIOD_MS = 120000; // 2 minutes

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
  createRoom(playerId: string, playerName: string, identity: IdentityContext): Room {
    const roomId = this.generateRoomCode();

    const host: Player = {
      id: playerId,
      identityId: identity.identityId,
      name: playerName,
      color: 'white', // First player gets white
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
  joinRoom(roomId: string, playerId: string, playerName: string, identity: IdentityContext): Room {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status === 'ended') {
      throw new Error('Game has already ended');
    }

    // Cancel pending deletion if someone joins
    if (this.pendingDeletions.has(roomId)) {
      clearTimeout(this.pendingDeletions.get(roomId)!);
      this.pendingDeletions.delete(roomId);
      console.log(`Cancelled pending deletion for room ${roomId}`);
    }

    // Check if player already in room (reconnection scenario)
    const existingPlayer = room.players.find(p => p.identityId === identity.identityId);
    if (existingPlayer) {
      existingPlayer.id = playerId;
      return room;
    }

    // Determine role and color
    let color: Player['color'] = null;
    let role: 'player' | 'spectator' = 'spectator';

    if (room.players.length < 2) {
      role = 'player';
      // First player = white (already in room), second player = black
      color = 'black';
    }

    const newPlayer: Player = {
      id: playerId,
      identityId: identity.identityId,
      name: playerName,
      color,
      role,
    };

    room.players.push(newPlayer);

    // Start game when 2 players joined
    if (room.players.length === 2 && room.status === 'waiting') {
      room.status = 'active';
      console.log(`Game started in room ${roomId}`);
    }

    console.log(`${playerName} joined room ${roomId} as ${role} (${color || 'spectator'})`);

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

    // Clean up empty rooms with grace period for waiting rooms
    if (room.players.length === 0) {
      if (room.status === 'waiting') {
        // Grace period: Wait before deleting to allow reconnection
        console.log(`Room ${roomId} is now empty (waiting). Scheduling deletion in ${this.GRACE_PERIOD_MS / 1000}s`);
        const timeout = setTimeout(() => {
          this.rooms.delete(roomId);
          this.pendingDeletions.delete(roomId);
          console.log(`Room ${roomId} deleted after grace period`);
        }, this.GRACE_PERIOD_MS);
        this.pendingDeletions.set(roomId, timeout);
      } else {
        // Active/ended games: delete immediately
        this.rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty, ${room.status})`);
      }
    } else if (room.status === 'active' && room.players.filter(p => p.role === 'player').length < 2) {
      // End active games if not enough players
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

  /**
   * Cancel pending deletion for a room (useful for reconnection)
   */
  cancelPendingDeletion(roomId: string): boolean {
    if (this.pendingDeletions.has(roomId)) {
      clearTimeout(this.pendingDeletions.get(roomId)!);
      this.pendingDeletions.delete(roomId);
      console.log(`Cancelled pending deletion for room ${roomId}`);
      return true;
    }
    return false;
  }

  /**
   * Clean up all pending deletions (for graceful shutdown)
   */
  cleanup(): void {
    for (const timeout of this.pendingDeletions.values()) {
      clearTimeout(timeout);
    }
    this.pendingDeletions.clear();
    console.log('Cleaned up all pending room deletions');
  }
}
