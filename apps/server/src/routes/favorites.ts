import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { ApiCode } from '@student-side-job-platform/shared';
import { AppError } from '../lib/AppError';
import { idParamSchema, pageQuerySchema } from '@student-side-job-platform/shared-schemas';

const router = Router();

router.post('/favorites/:jobId', authenticate, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const parsed = idParamSchema.safeParse({ id: req.params.jobId });
    if (!parsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, parsed.error.issues[0]?.message ?? 'Invalid job id', 400);
    }

    const jobId = parsed.data.id;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: { select: { status: true } } },
    });

    if (!job || job.status !== 'APPROVED' || job.employer.status !== 'ACTIVE') {
      throw new AppError(ApiCode.NOT_FOUND, 'Job not found', 404);
    }

    const favorite = await prisma.jobFavorite.create({
      data: {
        jobId,
        studentId: req.user!.id,
      },
    });

    res.status(201).json({ code: ApiCode.SUCCESS, message: 'success', data: favorite });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      next(new AppError(ApiCode.CONFLICT, 'Already favorited', 409));
      return;
    }

    next(error);
  }
});

router.delete('/favorites/:jobId', authenticate, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const parsed = idParamSchema.safeParse({ id: req.params.jobId });
    if (!parsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, parsed.error.issues[0]?.message ?? 'Invalid job id', 400);
    }

    const jobId = parsed.data.id;
    const favorite = await prisma.jobFavorite.findUnique({
      where: {
        studentId_jobId: {
          studentId: req.user!.id,
          jobId,
        },
      },
    });

    if (!favorite) {
      throw new AppError(ApiCode.NOT_FOUND, 'Favorite not found', 404);
    }

    await prisma.jobFavorite.delete({
      where: {
        studentId_jobId: {
          studentId: req.user!.id,
          jobId,
        },
      },
    });

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: null });
  } catch (error) {
    next(error);
  }
});

router.get('/favorites/my', authenticate, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const parsed = pageQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, parsed.error.issues[0]?.message ?? 'Invalid query', 400);
    }

    const { page, pageSize } = parsed.data;
    const where = { studentId: req.user!.id };

    const [total, list] = await Promise.all([
      prisma.jobFavorite.count({ where }),
      prisma.jobFavorite.findMany({
        where,
        include: {
          job: {
            include: {
              employer: {
                select: {
                  id: true,
                  username: true,
                  employerProfile: true,
                },
              },
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
