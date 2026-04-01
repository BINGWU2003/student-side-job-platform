import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middlewares/authenticate';
import { ApiCode } from '@student-side-job-platform/shared';
import { AppError } from '../lib/AppError';
import { submitReviewSchema } from '@student-side-job-platform/shared-schemas';

const router = Router();

router.post('/reviews', authenticate, async (req, res, next) => {
  try {
    const role = req.user?.role;
    if (!role || (role !== 'STUDENT' && role !== 'EMPLOYER')) {
      throw new AppError(ApiCode.FORBIDDEN, 'Only student or employer can submit reviews', 403);
    }

    const parsed = submitReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid payload',
        400
      );
    }

    const { applicationId, rating, comment } = parsed.data;
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            employerId: true,
            endDate: true,
          },
        },
      },
    });

    if (!application) {
      throw new AppError(ApiCode.NOT_FOUND, 'Application not found', 404);
    }

    if (application.status !== 'ACCEPTED') {
      throw new AppError(ApiCode.FORBIDDEN, 'Only accepted applications can be reviewed', 403);
    }

    if (application.job.endDate.getTime() > Date.now()) {
      throw new AppError(ApiCode.FORBIDDEN, 'The job has not ended yet', 403);
    }

    let toUserId: number;

    if (role === 'STUDENT') {
      if (application.studentId !== req.user!.id) {
        throw new AppError(ApiCode.FORBIDDEN, 'Forbidden', 403);
      }
      toUserId = application.job.employerId;
    } else {
      if (application.job.employerId !== req.user!.id) {
        throw new AppError(ApiCode.FORBIDDEN, 'Forbidden', 403);
      }
      toUserId = application.studentId;
    }

    const review = await prisma.review.create({
      data: {
        applicationId,
        fromUserId: req.user!.id,
        toUserId,
        rating,
        comment: comment ?? null,
      },
    });

    res.status(201).json({ code: ApiCode.SUCCESS, message: 'success', data: review });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      next(new AppError(ApiCode.CONFLICT, 'You already reviewed this application', 409));
      return;
    }

    next(error);
  }
});

router.get('/reviews/user/:userId', authenticate, async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError(ApiCode.BAD_REQUEST, 'Invalid user id', 400);
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

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: reviews });
  } catch (error) {
    next(error);
  }
});

export default router;
