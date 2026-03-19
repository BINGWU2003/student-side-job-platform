import { Router } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/hash';
import { signToken } from '../lib/jwt';
import { loginSchema, registerSchema } from '@bingwu-my-monorepo/shared-schemas';
import { HttpStatus, ApiCode } from '@bingwu-my-monorepo/shared';
import type { LoginResponse } from '@bingwu-my-monorepo/shared-types';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        code: ApiCode.BAD_REQUEST,
        message: result.error.issues[0]?.message ?? '参数错误',
        data: null,
      });
      return;
    }
    const { email, username, password } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res
        .status(HttpStatus.CONFLICT)
        .json({ code: ApiCode.CONFLICT, message: '邮箱已被注册', data: null });
      return;
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, username, password: hashed },
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    });

    res.status(HttpStatus.CREATED).json({ code: ApiCode.SUCCESS, message: '注册成功', data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        code: ApiCode.BAD_REQUEST,
        message: result.error.issues[0]?.message ?? '参数错误',
        data: null,
      });
      return;
    }
    const { email, password } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ code: ApiCode.UNAUTHORIZED, message: '邮箱或密码错误', data: null });
      return;
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ code: ApiCode.UNAUTHORIZED, message: '邮箱或密码错误', data: null });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });
    const data: LoginResponse = {
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    };
    res.json({ code: ApiCode.SUCCESS, message: '登录成功', data });
  } catch (err) {
    next(err);
  }
});

export default router;
