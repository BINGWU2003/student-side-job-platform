import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { ApiCode } from '@student-side-job-platform/shared';
import { AppError } from '../lib/AppError';
import {
  submitApplicationSchema,
  reviewApplicationSchema,
  idParamSchema,
  pageQuerySchema,
} from '@student-side-job-platform/shared-schemas';

const router = Router();

router.post('/applications', authenticate, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const parsed = submitApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid payload',
        400
      );
    }

    const { jobId, intro } = parsed.data;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: { select: { status: true } } },
    });

    if (!job || job.status !== 'APPROVED' || job.employer.status !== 'ACTIVE') {
      throw new AppError(ApiCode.NOT_FOUND, 'Job not found', 404);
    }

    if (job.deadline.getTime() < Date.now()) {
      throw new AppError(ApiCode.BAD_REQUEST, 'Application deadline has passed', 400);
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        studentId: req.user!.id,
        intro: intro ?? null,
        status: 'PENDING',
      },
    });

    res.status(201).json({ code: ApiCode.SUCCESS, message: 'success', data: application });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      next(new AppError(ApiCode.CONFLICT, 'You already applied to this job', 409));
      return;
    }

    next(error);
  }
});

router.get('/applications/my', authenticate, requireRole('STUDENT'), async (req, res, next) => {
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
    const where = { studentId: req.user!.id };

    const [total, list] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              type: true,
              location: true,
              startDate: true,
              endDate: true,
              deadline: true,
              status: true,
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

    const appIds = list.map((item) => item.id);
    const reviewed = appIds.length
      ? await prisma.review.findMany({
          where: {
            applicationId: { in: appIds },
            fromUserId: req.user!.id,
          },
          select: { applicationId: true },
        })
      : [];

    const reviewedSet = new Set(reviewed.map((item) => item.applicationId));
    const mapped = list.map((item) => ({
      ...item,
      hasReviewed: reviewedSet.has(item.id),
    }));

    res.json({
      code: ApiCode.SUCCESS,
      message: 'success',
      data: { list: mapped, total, page, pageSize },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/applications/:id', authenticate, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, parsed.error.issues[0]?.message ?? 'Invalid id', 400);
    }

    const id = parsed.data.id;
    const application = await prisma.application.findFirst({
      where: {
        id,
        studentId: req.user!.id,
      },
    });

    if (!application) {
      throw new AppError(ApiCode.NOT_FOUND, 'Application not found', 404);
    }

    if (application.status !== 'PENDING') {
      throw new AppError(ApiCode.FORBIDDEN, 'Only pending applications can be withdrawn', 403);
    }

    await prisma.application.delete({ where: { id } });

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: null });
  } catch (error) {
    next(error);
  }
});

router.get(
  '/employer/jobs/:jobId/applications',
  authenticate,
  requireRole('EMPLOYER'),
  async (req, res, next) => {
    try {
      const jobId = Number(req.params.jobId);
      if (!Number.isInteger(jobId) || jobId <= 0) {
        throw new AppError(ApiCode.BAD_REQUEST, 'Invalid job id', 400);
      }

      const queryParsed = pageQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        throw new AppError(
          ApiCode.BAD_REQUEST,
          queryParsed.error.issues[0]?.message ?? 'Invalid query',
          400
        );
      }

      const { page, pageSize } = queryParsed.data;

      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          employerId: req.user!.id,
        },
        select: { id: true },
      });

      if (!job) {
        throw new AppError(ApiCode.NOT_FOUND, 'Job not found', 404);
      }

      const where = { jobId };
      const [total, list] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.findMany({
          where,
          include: {
            student: {
              select: {
                id: true,
                username: true,
                phone: true,
                studentProfile: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      const appIds = list.map((item) => item.id);
      const reviewed = appIds.length
        ? await prisma.review.findMany({
            where: {
              applicationId: { in: appIds },
              fromUserId: req.user!.id,
            },
            select: { applicationId: true },
          })
        : [];

      const reviewedSet = new Set(reviewed.map((item) => item.applicationId));
      const mapped = list.map((item) => ({
        ...item,
        hasReviewed: reviewedSet.has(item.id),
      }));

      res.json({
        code: ApiCode.SUCCESS,
        message: 'success',
        data: { list: mapped, total, page, pageSize },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/employer/applications/:id/review',
  authenticate,
  requireRole('EMPLOYER'),
  async (req, res, next) => {
    try {
      const idParsed = idParamSchema.safeParse(req.params);
      if (!idParsed.success) {
        throw new AppError(
          ApiCode.BAD_REQUEST,
          idParsed.error.issues[0]?.message ?? 'Invalid id',
          400
        );
      }

      const bodyParsed = reviewApplicationSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new AppError(
          ApiCode.BAD_REQUEST,
          bodyParsed.error.issues[0]?.message ?? 'Invalid payload',
          400
        );
      }

      const appId = idParsed.data.id;
      const { action } = bodyParsed.data;

      const result = await prisma.$transaction(async (tx) => {
        const application = await tx.application.findUnique({
          where: { id: appId },
          include: {
            job: {
              select: {
                id: true,
                employerId: true,
                headcount: true,
                status: true,
              },
            },
          },
        });

        if (!application || application.job.employerId !== req.user!.id) {
          throw new AppError(ApiCode.NOT_FOUND, 'Application not found', 404);
        }

        if (application.job.status === 'CLOSED') {
          throw new AppError(ApiCode.FORBIDDEN, 'Job is already closed', 403);
        }

        const nextStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
        const updated = await tx.application.update({
          where: { id: application.id },
          data: { status: nextStatus },
        });

        if (action === 'accept') {
          const acceptedCount = await tx.application.count({
            where: {
              jobId: application.job.id,
              status: 'ACCEPTED',
            },
          });

          if (acceptedCount >= application.job.headcount) {
            await tx.job.update({
              where: { id: application.job.id },
              data: { status: 'CLOSED' },
            });
          }
        }

        return updated;
      });

      res.json({ code: ApiCode.SUCCESS, message: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
