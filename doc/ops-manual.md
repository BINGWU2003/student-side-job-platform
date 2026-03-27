# 运维手册（简版）

## 一、首次部署
1. 安装依赖：`pnpm install`
2. 配置环境变量：
- `apps/server/env/.env.production`
- `apps/web/env/.env.production`
- `apps/admin/env/.env.production`
3. 初始化数据库：
- `pnpm --filter @student-side-job-platform/server db:migrate:deploy`
- `pnpm --filter @student-side-job-platform/server db:seed`
4. 构建：`pnpm build`
5. 启动 server：`pnpm --filter @student-side-job-platform/server start`

## 二、日常发布
1. 拉取代码后执行：`pnpm install`
2. 执行：`pnpm --filter @student-side-job-platform/server db:migrate:deploy`
3. 执行：`pnpm build`
4. 重启服务（PM2）：`pnpm --filter @student-side-job-platform/server pm2:reload`

## 三、常见问题
- Prisma 引擎文件被占用（Windows EPERM）
  - 关闭占用 `query_engine-windows.dll.node` 的进程后重试 `server build`
- 登录 401
  - 检查 token 是否过期
  - 检查 `JWT_SECRET` 与签发环境是否一致
- 前端调用失败
  - 检查 `VITE_API_BASE_URL` 指向
  - 检查浏览器控制台和 server 日志

## 四、回滚建议
1. 回滚代码到上一稳定版本
2. 若涉及数据库变更，优先使用前向修复迁移，不建议直接手工回滚生产数据
3. 回滚后执行冒烟：`/api/health`、admin 登录、岗位列表加载
