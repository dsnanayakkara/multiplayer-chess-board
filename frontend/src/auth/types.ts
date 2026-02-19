export type IdentityType = 'guest' | 'account';

export interface AuthUser {
  id: string;
  email?: string;
  displayName: string;
}

export interface AuthIdentity {
  identityType: IdentityType;
  displayName: string;
  user: AuthUser | null;
}
