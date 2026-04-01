# 收尾发布清单（Release Checklist）

## 1. 环境准备

- Node.js >= 20
- pnpm >= 10
- MySQL 已启动，且可访问 `student_side_job` 数据库

## 2. 环境变量

- server: `apps/server/env/.env.development`
- web: `apps/web/env/.env.development`
- admin: `apps/admin/env/.env.development`
- 检查 `VITE_API_BASE_URL` 均指向 `http://localhost:4000`

## 3. 数据层准备

- 执行：`pnpm --filter @student-side-job-platform/server db:push`
- 执行：`pnpm --filter @student-side-job-platform/server db:seed`
- 验证管理员账号：`admin / Admin@123456`

## 4. 构建验证（已在 2026-03-27 验证通过）

- `pnpm --filter @student-side-job-platform/web build`
- `pnpm --filter @student-side-job-platform/admin build`
- `pnpm --filter @student-side-job-platform/server build`

## 5. 接口冒烟验证（已在 2026-03-27 验证通过）

- `GET /api/health` 返回 200
- `POST /api/auth/login`（admin）返回 200
- `GET /api/admin/dashboard`（admin token）返回 200

## 6. Phase 5 验收结果（已通过）

- 岗位审核后状态更新并写入 `AdminLog`
- 用户禁用/启用成功
- 公告 CRUD 可用
- 投诉处理可选“关闭岗位”并生效
- Dashboard 统计与 7 天图表数据可用
- 操作日志分页正常且只读

## 7. 启动命令

- 服务端：`pnpm --filter @student-side-job-platform/server dev`
- 学生端：`pnpm --filter @student-side-job-platform/web dev`
- 管理端：`pnpm --filter @student-side-job-platform/admin dev`

## 8. 生产建议

- 将 `JWT_SECRET` 替换为强随机值
- 生产数据库使用独立账号（不要用 root）
- 配置反向代理（Nginx）并启用 HTTPS
- 对 server 进程使用 PM2 守护
