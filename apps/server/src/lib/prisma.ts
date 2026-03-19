import { PrismaClient } from '@prisma/client';
import { config } from '../config/index';

const isDev = config.nodeEnv === 'development';

const prisma = new PrismaClient({
  log: [...(isDev && process.env.LOG_SQL === 'true' ? (['query'] as const) : []), 'warn', 'error'],
});

export default prisma;
