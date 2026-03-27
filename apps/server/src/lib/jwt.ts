import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import type { Role } from '@prisma/client';

export interface JwtPayload {
  userId: number;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}
