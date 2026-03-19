import app from './app';
import { config } from './config/index';
import prisma from './lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function killPortProcess(port: number): Promise<boolean> {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port} | findstr LISTENING`);
      const match = stdout.match(/\s+(\d+)\s*$/m);
      if (match) {
        await execAsync(`taskkill /PID ${match[1]} /F`);
        return true;
      }
    } else {
      const { stdout } = await execAsync(`lsof -ti :${port}`);
      const pids = stdout.trim().split('\n').filter(Boolean).join(' ');
      if (pids) {
        await execAsync(`kill -9 ${pids}`);
        return true;
      }
    }
  } catch {
    // 查找或关闭失败时静默处理
  }
  return false;
}

async function shutdown(server: ReturnType<typeof app.listen>) {
  console.log('\n[server] 正在关闭...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('[server] 已关闭');
    process.exit(0);
  });
}

function startServer() {
  const server = app.listen(config.port, () => {
    console.log(`[server] 运行在 http://localhost:${config.port}`);
    console.log(`[server] 环境: ${config.nodeEnv}`);
  });

  server.on('error', async (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\n[server] 端口 ${config.port} 已被占用，正在自动关闭占用进程...`);
      const killed = await killPortProcess(config.port);
      if (killed) {
        console.log(`[server] 占用进程已关闭，正在重启服务...\n`);
        setTimeout(startServer, 500);
      } else {
        console.error(`[server] 无法自动关闭占用进程，请手动处理后重试\n`);
        process.exit(1);
      }
    } else {
      throw err;
    }
  });

  process.on('SIGTERM', () => shutdown(server));
  process.on('SIGINT', () => shutdown(server));
}

startServer();
