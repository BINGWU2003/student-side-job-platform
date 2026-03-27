import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import prisma from '../lib/prisma';

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = undefined;
    next();
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      req.user = undefined;
      next();
      return;
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    req.user = undefined;
    next();
  }
}
