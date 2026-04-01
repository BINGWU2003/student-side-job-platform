import { Router } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/hash';
import { signToken } from '../lib/jwt';
import {
  loginSchema,
  registerSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from '@student-side-job-platform/shared-schemas';
import { ApiCode, HttpStatus } from '@student-side-job-platform/shared';
import { AppError } from '../lib/AppError';
import { authenticate } from '../middlewares/authenticate';
import type { LoginResponse } from '@student-side-job-platform/shared-types';
import type { User } from '@prisma/client';

const router = Router();

async function getUserWithProfiles(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      employerProfile: true,
    },
  });
}

function buildUserInfo(user: NonNullable<Awaited<ReturnType<typeof getUserWithProfiles>>>) {
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    studentProfile: user.studentProfile,
    employerProfile: user.employerProfile,
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid payload',
        400
      );
    }

    const data = parsed.data;
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) {
      throw new AppError(ApiCode.CONFLICT, 'Username already exists', 409);
    }

    const hashed = await hashPassword(data.password);
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          password: hashed,
          phone: data.phone,
          role: data.role,
          status: 'ACTIVE',
        },
      });

      if (data.role === 'STUDENT') {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            realName: data.realName ?? null,
            studentNo: data.studentNo ?? null,
            school: data.school ?? null,
            major: data.major ?? null,
          },
        });
      }

      if (data.role === 'EMPLOYER') {
        await tx.employerProfile.create({
          data: {
            userId: user.id,
            companyName: data.companyName ?? null,
            contactName: data.contactName ?? null,
            description: data.description ?? null,
          },
        });
      }

      return user;
    });

    const userWithProfiles = await getUserWithProfiles(created.id);
    if (!userWithProfiles) {
      throw new AppError(ApiCode.SERVER_ERROR, 'User creation failed', 500);
    }

    res.status(HttpStatus.CREATED).json({
      code: ApiCode.SUCCESS,
      message: 'success',
      data: buildUserInfo(userWithProfiles),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid payload',
        400
      );
    }

    const { username, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Username or password is incorrect', 401);
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Username or password is incorrect', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(ApiCode.FORBIDDEN, 'User is disabled', 403);
    }

    const token = signToken({ userId: user.id, role: user.role });
    const userWithProfiles = await getUserWithProfiles(user.id);
    if (!userWithProfiles) {
      throw new AppError(ApiCode.SERVER_ERROR, 'User not found', 500);
    }

    const data: LoginResponse = {
      token,
      user: buildUserInfo(userWithProfiles),
    };

    res.json({ code: ApiCode.SUCCESS, message: 'success', data });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Unauthorized', 401);
    }

    const user = await getUserWithProfiles(userId);
    if (!user) {
      throw new AppError(ApiCode.NOT_FOUND, 'User not found', 404);
    }

    res.json({
      code: ApiCode.SUCCESS,
      message: 'success',
      data: buildUserInfo(user),
    });
  } catch (error) {
    next(error);
  }
});

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Unauthorized', 401);
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid payload',
        400
      );
    }

    const input = parsed.data;
    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (!current) {
      throw new AppError(ApiCode.NOT_FOUND, 'User not found', 404);
    }

    if (input.username && input.username !== current.username) {
      const occupied = await prisma.user.findUnique({ where: { username: input.username } });
      if (occupied) {
        throw new AppError(ApiCode.CONFLICT, 'Username already exists', 409);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(input.username !== undefined ? { username: input.username } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
        },
      });

      if (current.role === 'STUDENT') {
        await tx.studentProfile.upsert({
          where: { userId },
          update: {
            ...(input.realName !== undefined ? { realName: input.realName } : {}),
            ...(input.studentNo !== undefined ? { studentNo: input.studentNo } : {}),
            ...(input.school !== undefined ? { school: input.school } : {}),
            ...(input.major !== undefined ? { major: input.major } : {}),
          },
          create: {
            userId,
            realName: input.realName ?? null,
            studentNo: input.studentNo ?? null,
            school: input.school ?? null,
            major: input.major ?? null,
          },
        });
      }

      if (current.role === 'EMPLOYER') {
        await tx.employerProfile.upsert({
          where: { userId },
          update: {
            ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
            ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
          },
          create: {
            userId,
            companyName: input.companyName ?? null,
            contactName: input.contactName ?? null,
            description: input.description ?? null,
          },
        });
      }
    });

    const updated = await getUserWithProfiles(userId);
    if (!updated) {
      throw new AppError(ApiCode.NOT_FOUND, 'User not found', 404);
    }

    res.json({
      code: ApiCode.SUCCESS,
      message: 'success',
      data: buildUserInfo(updated),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/password', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Unauthorized', 401);
    }

    const parsed = updatePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid payload',
        400
      );
    }

    const { oldPassword, newPassword } = parsed.data;
    const user: User | null = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(ApiCode.NOT_FOUND, 'User not found', 404);
    }

    const valid = await comparePassword(oldPassword, user.password);
    if (!valid) {
      throw new AppError(ApiCode.BAD_REQUEST, 'Old password is incorrect', 400);
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
