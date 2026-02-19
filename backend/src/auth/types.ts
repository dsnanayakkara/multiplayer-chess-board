export type IdentityType = 'guest' | 'account';

export interface SessionIdentity {
  sessionId: string;
  guestId: string;
  userId?: string;
  displayName?: string;
  createdAt: number;
  updatedAt: number;
}
