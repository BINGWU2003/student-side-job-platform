import type { Role } from '@prisma/client';

export interface RequestUser {
  id: number;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
