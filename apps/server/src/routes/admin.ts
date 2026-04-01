import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { ApiCode } from '@student-side-job-platform/shared';
import { AppError } from '../lib/AppError';
import {
  idParamSchema,
  pageQuerySchema,
  updateUserStatusSchema,
} from '@student-side-job-platform/shared-schemas';

const router = Router();

function formatLast7DaysChart(items: Array<{ createdAt: Date }>) {
  const today = new Date();
  const dates: string[] = [];
  const map = new Map<string, number>();

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = `${d.getMonth() + 1}`.padStart(2, '0') + `-${d.getDate()}`.padStart(2, '0');
    dates.push(key);
    map.set(key, 0);
  }

  for (const item of items) {
    const d = item.createdAt;
    const key = `${d.getMonth() + 1}`.padStart(2, '0') + `-${d.getDate()}`.padStart(2, '0');
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }

  return {
    dates,
    counts: dates.map((k) => map.get(k) ?? 0),
  };
}

router.get('/admin/dashboard', authenticate, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [
      totalUsers,
      totalStudents,
      totalEmployers,
      totalJobs,
      pendingJobs,
      approvedJobs,
      rejectedJobs,
      closedJobs,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      recentUsers,
      recentJobs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'EMPLOYER' } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'PENDING' } }),
      prisma.job.count({ where: { status: 'APPROVED' } }),
      prisma.job.count({ where: { status: 'REJECTED' } }),
      prisma.job.count({ where: { status: 'CLOSED' } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: 'PENDING' } }),
      prisma.application.count({ where: { status: 'ACCEPTED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.user.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.job.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    res.json({
      code: ApiCode.SUCCESS,
      message: 'success',
      data: {
        users: {
          total: totalUsers,
          students: totalStudents,
          employers: totalEmployers,
        },
        jobs: {
          total: totalJobs,
          pending: pendingJobs,
          approved: approvedJobs,
          rejected: rejectedJobs,
          closed: closedJobs,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          accepted: acceptedApplications,
          rejected: rejectedApplications,
        },
        chart: {
          users: formatLast7DaysChart(recentUsers),
          jobs: formatLast7DaysChart(recentJobs),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/users', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const parsed = pageQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid query',
        400
      );
    }

    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const allowedRoles = new Set(['STUDENT', 'EMPLOYER', 'ADMIN']);
    const allowedStatus = new Set(['ACTIVE', 'DISABLED']);
    const { page, pageSize } = parsed.data;

    const where = {
      ...(role && allowedRoles.has(role) ? { role: role as 'STUDENT' | 'EMPLOYER' | 'ADMIN' } : {}),
      ...(status && allowedStatus.has(status) ? { status: status as 'ACTIVE' | 'DISABLED' } : {}),
    };

    const [total, list] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          studentProfile: true,
          employerProfile: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: { list, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/users/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid user id',
        400
      );
    }

    const userId = parsed.data.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        employerProfile: true,
      },
    });

    if (!user) {
      throw new AppError(ApiCode.NOT_FOUND, 'User not found', 404);
    }

    const reviews = await prisma.review.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: { ...user, reviews } });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/admin/users/:id/status',
  authenticate,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const idParsed = idParamSchema.safeParse(req.params);
      if (!idParsed.success) {
        throw new AppError(
          ApiCode.BAD_REQUEST,
          idParsed.error.issues[0]?.message ?? 'Invalid user id',
          400
        );
      }

      const bodyParsed = updateUserStatusSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new AppError(
          ApiCode.BAD_REQUEST,
          bodyParsed.error.issues[0]?.message ?? 'Invalid payload',
          400
        );
      }

      const userId = idParsed.data.id;
      const { status } = bodyParsed.data;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError(ApiCode.NOT_FOUND, 'User not found', 404);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const nextUser = await tx.user.update({
          where: { id: userId },
          data: { status },
        });

        await tx.adminLog.create({
          data: {
            adminId: req.user!.id,
            action: status === 'DISABLED' ? 'DISABLE_USER' : 'ENABLE_USER',
            targetId: userId,
            targetType: 'USER',
            note: null,
          },
        });

        return nextUser;
      });

      res.json({ code: ApiCode.SUCCESS, message: 'success', data: updated });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/admin/logs', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const parsed = pageQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid query',
        400
      );
    }

    const { page, pageSize } = parsed.data;
    const startDate =
      typeof req.query.startDate === 'string' ? new Date(req.query.startDate) : undefined;
    const endDate = typeof req.query.endDate === 'string' ? new Date(req.query.endDate) : undefined;

    const where = {
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && !Number.isNaN(startDate.getTime()) ? { gte: startDate } : {}),
              ...(endDate && !Number.isNaN(endDate.getTime()) ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const [total, list] = await Promise.all([
      prisma.adminLog.count({ where }),
      prisma.adminLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: { list, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

export default router;
