import { Router } from 'express';
import prisma from '../lib/prisma';
import type { JobStatus } from '@prisma/client';
import { authenticate } from '../middlewares/authenticate';
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate';
import { requireRole } from '../middlewares/requireRole';
import { AppError } from '../lib/AppError';
import { ApiCode } from '@student-side-job-platform/shared';
import {
  createJobSchema,
  updateJobSchema,
  reviewJobSchema,
  jobListQuerySchema,
  idParamSchema,
} from '@student-side-job-platform/shared-schemas';

const router = Router();

function parseStatusPagingQuery(query: Record<string, unknown>) {
  const allowedStatus = new Set<JobStatus>(['PENDING', 'APPROVED', 'REJECTED', 'CLOSED']);
  const rawStatus = typeof query.status === 'string' ? query.status : undefined;
  const status = rawStatus && allowedStatus.has(rawStatus as JobStatus) ? (rawStatus as JobStatus) : undefined;
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10));
  return { status, page, pageSize };
}

router.get('/jobs', optionalAuthenticate, async (req, res, next) => {
  try {
    const parsed = jobListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, parsed.error.issues[0]?.message ?? 'Invalid query', 400);
    }

    const { type, location, sort, page, pageSize } = parsed.data;
    const where = {
      status: 'APPROVED' as const,
      ...(type ? { type } : {}),
      ...(location ? { location: { contains: location } } : {}),
      employer: { status: 'ACTIVE' as const },
    };

    const [total, list] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        include: {
          employer: {
            select: {
              id: true,
              username: true,
              phone: true,
              employerProfile: true,
            },
          },
        },
        orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      code: ApiCode.SUCCESS,
      message: 'success',
      data: { list, total, page, pageSize },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/jobs/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const idParsed = idParamSchema.safeParse(req.params);
    if (!idParsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, idParsed.error.issues[0]?.message ?? 'Invalid id', 400);
    }

    const jobId = idParsed.data.id;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          select: {
            id: true,
            username: true,
            phone: true,
            employerProfile: true,
            status: true,
          },
        },
      },
    });

    if (!job || job.status !== 'APPROVED' || job.employer.status !== 'ACTIVE') {
      throw new AppError(ApiCode.NOT_FOUND, 'Job not found', 404);
    }

    const acceptedCountPromise = prisma.application.count({
      where: { jobId, status: 'ACCEPTED' },
    });

    let hasApplied = false;
    let isFavorited = false;

    if (req.user?.role === 'STUDENT') {
      const [appliedCount, favoritedCount] = await Promise.all([
        prisma.application.count({ where: { jobId, studentId: req.user.id } }),
        prisma.jobFavorite.count({ where: { jobId, studentId: req.user.id } }),
      ]);
      hasApplied = appliedCount > 0;
      isFavorited = favoritedCount > 0;
    }

    const acceptedCount = await acceptedCountPromise;

    res.json({
      code: ApiCode.SUCCESS,
      message: 'success',
      data: {
        ...job,
        acceptedCount,
        hasApplied,
        isFavorited,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/jobs', authenticate, requireRole('EMPLOYER'), async (req, res, next) => {
  try {
    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, parsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    }

    const data = parsed.data;
    const job = await prisma.job.create({
      data: {
        ...data,
        requirement: data.requirement ?? null,
        employerId: req.user!.id,
        status: 'PENDING',
      },
    });

    res.status(201).json({ code: ApiCode.SUCCESS, message: 'success', data: job });
  } catch (error) {
    next(error);
  }
});

router.get('/employer/jobs', authenticate, requireRole('EMPLOYER'), async (req, res, next) => {
  try {
    const { status, page, pageSize } = parseStatusPagingQuery(req.query as Record<string, unknown>);
    const where = {
      employerId: req.user!.id,
      ...(status ? { status } : {}),
    };

    const [total, list] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
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

router.get('/employer/jobs/:id', authenticate, requireRole('EMPLOYER'), async (req, res, next) => {
  try {
    const idParsed = idParamSchema.safeParse(req.params);
    if (!idParsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, idParsed.error.issues[0]?.message ?? 'Invalid id', 400);
    }

    const job = await prisma.job.findFirst({
      where: {
        id: idParsed.data.id,
        employerId: req.user!.id,
      },
    });

    if (!job) {
      throw new AppError(ApiCode.NOT_FOUND, 'Job not found', 404);
    }

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: job });
  } catch (error) {
    next(error);
  }
});

router.put('/employer/jobs/:id', authenticate, requireRole('EMPLOYER'), async (req, res, next) => {
  try {
    const idParsed = idParamSchema.safeParse(req.params);
    if (!idParsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, idParsed.error.issues[0]?.message ?? 'Invalid id', 400);
    }

    const payloadParsed = updateJobSchema.safeParse(req.body);
    if (!payloadParsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, payloadParsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    }

    const existing = await prisma.job.findFirst({
      where: {
        id: idParsed.data.id,
        employerId: req.user!.id,
      },
    });

    if (!existing) {
      throw new AppError(ApiCode.NOT_FOUND, 'Job not found', 404);
    }

    if (existing.status !== 'PENDING' && existing.status !== 'REJECTED') {
      throw new AppError(ApiCode.FORBIDDEN, 'Only pending or rejected jobs can be edited', 403);
    }

    const data = payloadParsed.data;
    const job = await prisma.job.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.salary !== undefined ? { salary: data.salary } : {}),
        ...(data.salaryType !== undefined ? { salaryType: data.salaryType } : {}),
        ...(data.headcount !== undefined ? { headcount: data.headcount } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
        ...(data.requirement !== undefined ? { requirement: data.requirement ?? null } : {}),
        ...(existing.status === 'REJECTED'
          ? { status: 'PENDING' as const, rejectReason: null }
          : {}),
      },
    });

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: job });
  } catch (error) {
    next(error);
  }
});

router.patch('/employer/jobs/:id/close', authenticate, requireRole('EMPLOYER'), async (req, res, next) => {
  try {
    const idParsed = idParamSchema.safeParse(req.params);
    if (!idParsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, idParsed.error.issues[0]?.message ?? 'Invalid id', 400);
    }

    const existing = await prisma.job.findFirst({
      where: { id: idParsed.data.id, employerId: req.user!.id },
    });

    if (!existing) {
      throw new AppError(ApiCode.NOT_FOUND, 'Job not found', 404);
    }

    if (existing.status !== 'APPROVED') {
      throw new AppError(ApiCode.FORBIDDEN, 'Only approved jobs can be closed', 403);
    }

    const job = await prisma.job.update({
      where: { id: existing.id },
      data: { status: 'CLOSED' },
    });

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: job });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/jobs', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { status, page, pageSize } = parseStatusPagingQuery(req.query as Record<string, unknown>);
    const where = status ? { status } : {};

    const [total, list] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        include: {
          employer: {
            select: {
              id: true,
              username: true,
              phone: true,
              employerProfile: true,
              status: true,
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

router.get('/admin/jobs/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const idParsed = idParamSchema.safeParse(req.params);
    if (!idParsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, idParsed.error.issues[0]?.message ?? 'Invalid id', 400);
    }

    const job = await prisma.job.findUnique({
      where: { id: idParsed.data.id },
      include: {
        employer: {
          select: {
            id: true,
            username: true,
            phone: true,
            employerProfile: true,
            status: true,
          },
        },
      },
    });

    if (!job) {
      throw new AppError(ApiCode.NOT_FOUND, 'Job not found', 404);
    }

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: job });
  } catch (error) {
    next(error);
  }
});

router.patch('/admin/jobs/:id/review', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const idParsed = idParamSchema.safeParse(req.params);
    if (!idParsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, idParsed.error.issues[0]?.message ?? 'Invalid id', 400);
    }

    const payloadParsed = reviewJobSchema.safeParse(req.body);
    if (!payloadParsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, payloadParsed.error.issues[0]?.message ?? 'Invalid payload', 400);
    }

    const id = idParsed.data.id;
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(ApiCode.NOT_FOUND, 'Job not found', 404);
    }

    if (existing.status !== 'PENDING') {
      throw new AppError(ApiCode.FORBIDDEN, 'Only pending jobs can be reviewed', 403);
    }

    const { action, reason } = payloadParsed.data;

    const job = await prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id },
        data:
          action === 'approve'
            ? { status: 'APPROVED', rejectReason: null }
            : { status: 'REJECTED', rejectReason: reason ?? null },
      });

      await tx.adminLog.create({
        data: {
          adminId: req.user!.id,
          action: action === 'approve' ? 'APPROVE_JOB' : 'REJECT_JOB',
          targetId: id,
          targetType: 'JOB',
          note: action === 'reject' ? reason ?? null : null,
        },
      });

      return updated;
    });

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: job });
  } catch (error) {
    next(error);
  }
});

export default router;
