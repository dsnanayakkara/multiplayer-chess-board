import { describe, it, expect } from 'vitest';
import { RoomManager } from '../../src/RoomManager';

describe('socket identity binding', () => {
  it('maps connected socket to session identity and persists account id in players', () => {
    const roomManager = new RoomManager();
    const room = roomManager.createRoom('socket-1', 'Alice', { identityId: 'user:alice-1' });

    expect(room.players[0].identityId).toBe('user:alice-1');

    roomManager.joinRoom(room.id, 'socket-2', 'Bob', { identityId: 'user:bob-1' });
    const rejoin = roomManager.joinRoom(room.id, 'socket-3', 'Alice', { identityId: 'user:alice-1' });

    const aliceEntries = rejoin.players.filter(p => p.identityId === 'user:alice-1');
    expect(aliceEntries).toHaveLength(1);
    expect(aliceEntries[0].id).toBe('socket-3');
  });
});
