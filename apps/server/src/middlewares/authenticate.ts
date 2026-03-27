import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import prisma from '../lib/prisma';
import { ApiCode } from '@student-side-job-platform/shared';
import { AppError } from '../lib/AppError';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(ApiCode.UNAUTHORIZED, 'Unauthorized', 401));
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user) {
      next(new AppError(ApiCode.UNAUTHORIZED, 'Unauthorized', 401));
      return;
    }

    if (user.status !== 'ACTIVE') {
      next(new AppError(ApiCode.FORBIDDEN, 'User is disabled', 403));
      return;
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    next(new AppError(ApiCode.UNAUTHORIZED, 'Token invalid or expired', 401));
  }
}
