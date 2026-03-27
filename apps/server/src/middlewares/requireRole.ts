import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { ApiCode } from '@student-side-job-platform/shared';
import { AppError } from '../lib/AppError';

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(ApiCode.UNAUTHORIZED, 'Unauthorized', 401));
      return;
    }

    if (req.user.role !== role) {
      next(new AppError(ApiCode.FORBIDDEN, 'Forbidden', 403));
      return;
    }

    next();
  };
}
