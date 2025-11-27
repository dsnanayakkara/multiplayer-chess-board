# Disconnect Handling - Implementation Notes

## Overview
Implemented improvements to handle player disconnections gracefully, addressing the issue where room creators disconnecting would leave joiners confused.

## Changes Implemented

### Option A: Grace Period for Waiting Rooms

**Problem**: When a room creator disconnects during the waiting phase, the room is immediately deleted, causing "Room not found" errors for players trying to join.

**Solution**: Added a 2-minute grace period before deleting empty waiting rooms.

**Implementation** (`backend/src/RoomManager.ts`):
- Added `pendingDeletions` Map to track scheduled room deletions
- Added `GRACE_PERIOD_MS` constant (120000ms = 2 minutes)
- Modified `removePlayer()` to schedule deletion instead of immediate deletion for empty waiting rooms
- Modified `joinRoom()` to cancel pending deletions when someone joins
- Added `cancelPendingDeletion()` method for manual cancellation
- Added `cleanup()` method for graceful server shutdown

**Behavior**:
```
Before:
Creator creates room "ABC123" → Creator disconnects → Room deleted immediately →
Joiner tries to join "ABC123" → Error: "Room not found"

After:
Creator creates room "ABC123" → Creator disconnects → Room scheduled for deletion in 2min →
Joiner tries to join "ABC123" → Cancels deletion → Room restored → Join successful
```

**Notes**:
- Grace period only applies to **waiting** rooms (status = 'waiting')
- Active games are still deleted immediately when empty (no grace period)
- Ended games are deleted immediately

---

### Option C: Better Error Messages

**Problem**: Users get generic "Room not found" errors without context about what happened.

**Solution**: Added error codes to distinguish different error scenarios and provide contextual messages.

**Implementation**:

#### Backend (`backend/src/index.ts`):
- Added error codes to error emissions
- Map specific errors to codes:
  - `ROOM_NOT_FOUND`: Room doesn't exist
  - `GAME_ENDED`: Game has already ended
  - `JOIN_FAILED`: Generic join failure

**Error Structure**:
```typescript
socket.emit('error', {
  message: string,  // Technical error message
  code: string      // Error code for UI handling
});
```

#### Frontend (`frontend/src/LandingPage.tsx`):
- Added `useEffect` to listen for error events
- Map error codes to user-friendly messages:

**Error Messages**:

| Code | User Message |
|------|--------------|
| `ROOM_NOT_FOUND` | "Room not found. The host may have left before you joined, or the room code is incorrect. Please ask them to create a new room or double-check the code." |
| `GAME_ENDED` | "This game has already ended. Please create a new room or join a different one." |
| Default | Shows server's error message |

---

## Testing Scenarios

### Scenario 1: Creator Disconnects During Waiting Phase
**Steps**:
1. Player A creates room "XYZ789"
2. Player A's browser crashes / disconnects
3. Player B tries to join "XYZ789" within 2 minutes

**Expected**: Player B successfully joins, room is restored

### Scenario 2: Room Not Found
**Steps**:
1. Player B tries to join invalid room code

**Expected**: Clear error message explaining possible causes

### Scenario 3: Grace Period Expires
**Steps**:
1. Player A creates room
2. Player A disconnects
3. No one joins for 2+ minutes

**Expected**: Room is automatically deleted after grace period

---

## Benefits

1. **Reduced User Confusion**: Clear error messages explain what went wrong
2. **Better UX**: Grace period allows reconnection and late joins
3. **Fault Tolerance**: Handles network hiccups gracefully
4. **No Breaking Changes**: All existing functionality preserved

---

## Future Enhancements (Not Implemented)

### Reconnection for Active Games
- Allow players to rejoin games after disconnect
- Preserve player identity with session tokens
- Grace period for active games (30-60s)

### Room Ownership Transfer
- Transfer ownership when creator leaves
- Allow new owner to kick players
- More complex state management

### Persistent Sessions
- Store sessions in Redis
- Allow reconnection across server restarts
- Requires external dependency

---

## Configuration

**Grace Period Duration**:
```typescript
// backend/src/RoomManager.ts
private readonly GRACE_PERIOD_MS = 120000; // 2 minutes
```

To adjust, modify this constant and restart the server.

---

## Metrics to Monitor

- Number of rooms with pending deletions
- Number of cancelled deletions (successful reconnections)
- Frequency of "ROOM_NOT_FOUND" errors
- Average time between room creation and first join

---

## Code Complexity Impact

- **Backend**: +30 lines (RoomManager)
- **Frontend**: +25 lines (LandingPage)
- **Total**: ~55 lines added
- **Complexity Increase**: ~15% (as estimated)

---

## Deployment Notes

1. No database migration needed (in-memory only)
2. No breaking API changes
3. Gracefully handles old clients (they ignore error codes)
4. Server restart clears all pending deletions (by design)

---

## Related Files

- `backend/src/RoomManager.ts` - Grace period logic
- `backend/src/index.ts` - Error codes
- `frontend/src/LandingPage.tsx` - Error handling UI
