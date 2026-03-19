import express from 'express';
import cors from 'cors';
import { config } from './config/index';
import { logger } from './middlewares/logger';
import { errorHandler } from './middlewares/errorHandler';
import apiRouter from './routes/index';

const app = express();

app.use(cors({ origin: config.cors.origins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use('/api', apiRouter);

app.get('/', (_req, res) => {
  res.json({
    name: '@student-side-job-platform/server',
    version: '0.0.0',
    env: config.nodeEnv,
    docs: '/api/health',
  });
});

app.use(errorHandler);

export default app;
