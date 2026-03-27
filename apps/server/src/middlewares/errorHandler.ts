import type { Request, Response, NextFunction } from 'express';
import { ApiCode } from '@student-side-job-platform/shared';
import { AppError } from '../lib/AppError';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.apiCode,
      message: err.message,
      data: null,
    });
    return;
  }

  res.status(500).json({
    code: ApiCode.SERVER_ERROR,
    message: err.message || 'Internal server error',
    data: null,
  });
}
