'use strict';

/**
 * PM2 Ecosystem 配置
 *
 * 常用命令：
 *   pm2 start ecosystem.config.cjs              # 启动生产环境
 *   pm2 start ecosystem.config.cjs --only server-test  # 启动测试环境
 *   pm2 stop ecosystem.config.cjs               # 停止所有
 *   pm2 reload ecosystem.config.cjs             # 零停机重载（生产）
 *   pm2 delete ecosystem.config.cjs             # 删除进程
 *   pm2 logs server                             # 查看日志
 *   pm2 status                                  # 查看状态
 *   pm2 save                                    # 保存当前进程列表（开机自启需要）
 *   pm2 startup                                 # 生成开机自启脚本
 */

module.exports = {
  apps: [
    // ─── 生产环境 ────────────────────────────────────────────────────────────
    {
      name: 'server',
      script: './dist/index.js',

      // 进程模式：fork（单实例） | cluster（多实例，利用多核）
      instances: 1,
      exec_mode: 'fork',

      // 自动重启
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000, // 重启间隔 1s
      exp_backoff_restart_delay: 100, // 指数退避，避免快速反复崩溃

      // 内存上限，超过后自动重启
      max_memory_restart: '512M',

      // 优雅关闭超时：超过此时间强制 kill
      kill_timeout: 5000,
      // 等待应用 listen 的超时（cluster 模式下有效）
      listen_timeout: 10000,

      watch: false,

      // 环境变量
      // NODE_ENV 决定 config/index.ts 加载哪个 env/*.env.* 文件
      env: {
        NODE_ENV: 'production',
      },

      // 日志
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
    },

    // ─── 测试 / 预发布环境 ───────────────────────────────────────────────────
    {
      name: 'server-test',
      script: './dist/index.js',

      instances: 1,
      exec_mode: 'fork',

      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,

      max_memory_restart: '512M',
      kill_timeout: 5000,

      watch: false,

      env: {
        NODE_ENV: 'test',
      },

      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: './logs/pm2-test-out.log',
      error_file: './logs/pm2-test-error.log',
      merge_logs: true,
    },
  ],
};
