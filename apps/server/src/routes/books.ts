import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middlewares/authenticate';
import {
  createBookSchema,
  updateBookSchema,
  bookListQuerySchema,
  idParamSchema,
} from '@bingwu-my-monorepo/shared-schemas';
import { HttpStatus, ApiCode } from '@bingwu-my-monorepo/shared';

const router = Router();

// GET /api/books?page=1&pageSize=10&title=&author=
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = bookListQuerySchema.safeParse(req.query);
    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        code: ApiCode.BAD_REQUEST,
        message: result.error.issues[0]?.message ?? '参数错误',
        data: null,
      });
      return;
    }
    const { page, pageSize, title, author } = result.data;

    const where = {
      ...(title ? { title: { contains: title } } : {}),
      ...(author ? { author: { contains: author } } : {}),
    };

    const [total, list] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ code: ApiCode.SUCCESS, message: 'ok', data: { list, total, page, pageSize } });
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const idResult = idParamSchema.safeParse(req.params);
    if (!idResult.success) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ code: ApiCode.BAD_REQUEST, message: '无效的 id', data: null });
      return;
    }
    const { id } = idResult.data;

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json({ code: ApiCode.NOT_FOUND, message: '书籍不存在', data: null });
      return;
    }

    res.json({ code: ApiCode.SUCCESS, message: 'ok', data: book });
  } catch (err) {
    next(err);
  }
});

// POST /api/books  （需要登录）
router.post('/', authenticate, async (req, res, next) => {
  try {
    const result = createBookSchema.safeParse(req.body);
    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        code: ApiCode.BAD_REQUEST,
        message: result.error.issues[0]?.message ?? '参数错误',
        data: null,
      });
      return;
    }
    const { title, author, isbn, description, price, publishedAt } = result.data;

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn: isbn ?? null,
        description: description ?? null,
        price: price != null ? price : null,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    res.status(HttpStatus.CREATED).json({ code: ApiCode.SUCCESS, message: '创建成功', data: book });
  } catch (err) {
    next(err);
  }
});

// PUT /api/books/:id  （需要登录）
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const idResult = idParamSchema.safeParse(req.params);
    if (!idResult.success) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ code: ApiCode.BAD_REQUEST, message: '无效的 id', data: null });
      return;
    }
    const { id } = idResult.data;

    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json({ code: ApiCode.NOT_FOUND, message: '书籍不存在', data: null });
      return;
    }

    const result = updateBookSchema.safeParse(req.body);
    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        code: ApiCode.BAD_REQUEST,
        message: result.error.issues[0]?.message ?? '参数错误',
        data: null,
      });
      return;
    }
    const { title, author, isbn, description, price, publishedAt } = result.data;

    const book = await prisma.book.update({
      where: { id },
      data: {
        ...(title != null ? { title } : {}),
        ...(author != null ? { author } : {}),
        ...(isbn !== undefined ? { isbn: isbn ?? null } : {}),
        ...(description !== undefined ? { description: description ?? null } : {}),
        ...(price !== undefined ? { price: price != null ? price : null } : {}),
        ...(publishedAt !== undefined
          ? { publishedAt: publishedAt ? new Date(publishedAt) : null }
          : {}),
      },
    });

    res.json({ code: ApiCode.SUCCESS, message: '更新成功', data: book });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/books/:id  （需要登录）
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const idResult = idParamSchema.safeParse(req.params);
    if (!idResult.success) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ code: ApiCode.BAD_REQUEST, message: '无效的 id', data: null });
      return;
    }
    const { id } = idResult.data;

    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json({ code: ApiCode.NOT_FOUND, message: '书籍不存在', data: null });
      return;
    }

    await prisma.book.delete({ where: { id } });
    res.json({ code: ApiCode.SUCCESS, message: '删除成功', data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
