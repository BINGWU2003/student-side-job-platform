import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { ApiCode } from '@student-side-job-platform/shared';
import { AppError } from '../lib/AppError';
import {
  submitComplaintSchema,
  handleComplaintSchema,
  pageQuerySchema,
  idParamSchema,
} from '@student-side-job-platform/shared-schemas';

const router = Router();

router.post('/complaints', authenticate, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const parsed = submitComplaintSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid payload',
        400
      );
    }

    const { jobId, type, description } = parsed.data;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.status !== 'APPROVED') {
      throw new AppError(ApiCode.NOT_FOUND, 'Job not found', 404);
    }

    const item = await prisma.complaint.create({
      data: {
        jobId,
        studentId: req.user!.id,
        type,
        description,
      },
    });

    res.status(201).json({ code: ApiCode.SUCCESS, message: 'success', data: item });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      next(new AppError(ApiCode.CONFLICT, 'You already complained about this job', 409));
      return;
    }

    next(error);
  }
});

router.get('/complaints/my', authenticate, requireRole('STUDENT'), async (req, res, next) => {
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
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
              employerId: true,
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

router.get('/admin/complaints', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const allowed = new Set(['PENDING', 'RESOLVED', 'DISMISSED']);
    const parsed = pageQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid query',
        400
      );
    }

    const { page, pageSize } = parsed.data;
    const where =
      status && allowed.has(status)
        ? { status: status as 'PENDING' | 'RESOLVED' | 'DISMISSED' }
        : {};

    const [total, list] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
              employerId: true,
            },
          },
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

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: { list, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/admin/complaints/:id/handle',
  authenticate,
  requireRole('ADMIN'),
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

      const bodyParsed = handleComplaintSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new AppError(
          ApiCode.BAD_REQUEST,
          bodyParsed.error.issues[0]?.message ?? 'Invalid payload',
          400
        );
      }

      const complaintId = idParsed.data.id;
      const { status, note, closeJob } = bodyParsed.data;

      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.complaint.findUnique({
          where: { id: complaintId },
          select: { id: true, jobId: true, status: true },
        });

        if (!existing) {
          throw new AppError(ApiCode.NOT_FOUND, 'Complaint not found', 404);
        }

        if (existing.status !== 'PENDING') {
          throw new AppError(ApiCode.FORBIDDEN, 'Complaint has already been handled', 403);
        }

        if (closeJob) {
          await tx.job.update({ where: { id: existing.jobId }, data: { status: 'CLOSED' } });
        }

        const handled = await tx.complaint.update({
          where: { id: complaintId },
          data: {
            status,
            handleNote: note ?? null,
          },
        });

        await tx.adminLog.create({
          data: {
            adminId: req.user!.id,
            action: status === 'RESOLVED' ? 'RESOLVE_COMPLAINT' : 'DISMISS_COMPLAINT',
            targetId: complaintId,
            targetType: 'COMPLAINT',
            note: note ?? null,
          },
        });

        return handled;
      });

      res.json({ code: ApiCode.SUCCESS, message: 'success', data: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
