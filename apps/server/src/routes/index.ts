import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import jobsRouter from './jobs';
import applicationsRouter from './applications';
import reviewsRouter from './reviews';
import favoritesRouter from './favorites';
import announcementsRouter from './announcements';
import complaintsRouter from './complaints';
import adminRouter from './admin';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/', jobsRouter);
router.use('/', applicationsRouter);
router.use('/', reviewsRouter);
router.use('/', favoritesRouter);
router.use('/', announcementsRouter);
router.use('/', complaintsRouter);
router.use('/', adminRouter);

export default router;
