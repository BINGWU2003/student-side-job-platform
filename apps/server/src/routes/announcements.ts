import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { ApiCode } from '@student-side-job-platform/shared';
import { AppError } from '../lib/AppError';
import { createAnnouncementSchema, idParamSchema } from '@student-side-job-platform/shared-schemas';

const router = Router();

router.get('/announcements', async (_req, res, next) => {
  try {
    const list = await prisma.announcement.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: list });
  } catch (error) {
    next(error);
  }
});

router.get('/announcements/:id', async (req, res, next) => {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(ApiCode.BAD_REQUEST, parsed.error.issues[0]?.message ?? 'Invalid id', 400);
    }

    const item = await prisma.announcement.findUnique({ where: { id: parsed.data.id } });
    if (!item) {
      throw new AppError(ApiCode.NOT_FOUND, 'Announcement not found', 404);
    }

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: item });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/announcements', authenticate, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const list = await prisma.announcement.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ code: ApiCode.SUCCESS, message: 'success', data: list });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/announcements', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const parsed = createAnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        ApiCode.BAD_REQUEST,
        parsed.error.issues[0]?.message ?? 'Invalid payload',
        400
      );
    }

    const item = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        isPinned: parsed.data.isPinned ?? false,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({ code: ApiCode.SUCCESS, message: 'success', data: item });
  } catch (error) {
    next(error);
  }
});

router.put(
  '/admin/announcements/:id',
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

      const parsed = createAnnouncementSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          ApiCode.BAD_REQUEST,
          parsed.error.issues[0]?.message ?? 'Invalid payload',
          400
        );
      }

      const exists = await prisma.announcement.findUnique({ where: { id: idParsed.data.id } });
      if (!exists) {
        throw new AppError(ApiCode.NOT_FOUND, 'Announcement not found', 404);
      }

      const item = await prisma.announcement.update({
        where: { id: idParsed.data.id },
        data: {
          title: parsed.data.title,
          content: parsed.data.content,
          isPinned: parsed.data.isPinned ?? false,
        },
      });

      res.json({ code: ApiCode.SUCCESS, message: 'success', data: item });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/admin/announcements/:id',
  authenticate,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const parsed = idParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new AppError(
          ApiCode.BAD_REQUEST,
          parsed.error.issues[0]?.message ?? 'Invalid id',
          400
        );
      }

      const exists = await prisma.announcement.findUnique({ where: { id: parsed.data.id } });
      if (!exists) {
        throw new AppError(ApiCode.NOT_FOUND, 'Announcement not found', 404);
      }

      await prisma.announcement.delete({ where: { id: parsed.data.id } });
      res.json({ code: ApiCode.SUCCESS, message: 'success', data: null });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
