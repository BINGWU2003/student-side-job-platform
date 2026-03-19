import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import booksRouter from './books';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/books', booksRouter);

export default router;
