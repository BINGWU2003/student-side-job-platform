import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { HttpStatus, ApiCode } from '@student-side-job-platform/shared';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ code: ApiCode.UNAUTHORIZED, message: '未授权', data: null });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ code: ApiCode.UNAUTHORIZED, message: 'Token 无效或已过期', data: null });
  }
}
