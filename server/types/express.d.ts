import 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      role?: 'admin' | 'user';
      isLocal?: boolean;
      isGoogle?: boolean;
      claims?: any;
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}
