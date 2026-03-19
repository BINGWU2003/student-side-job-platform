import type { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({
    code: statusCode,
    message: err.message || '服务器内部错误',
    data: null,
  });
}
