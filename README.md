# 学生兼职平台（Monorepo）

基于 `pnpm workspace + Turborepo` 的全栈项目，包含：

- 学生端 Web（Vue 3）
- 管理后台 Admin（Vue 3）
- 服务端 Server（Express + Prisma + MySQL）
- 共享包（`shared`、`shared-types`、`shared-schemas`）

## 项目结构

```text
student-side-job-platform/
├─ apps/
│  ├─ web/                # 学生/雇主前台（Vite + Vue3 + Pinia + Router）
│  ├─ admin/              # 管理后台（Vite + Vue3 + Pinia + Router）
│  └─ server/             # 后端服务（Express + Prisma + JWT）
├─ packages/
│  ├─ shared/             # 运行时共享（HTTP 客户端、状态码等）
│  ├─ shared-types/       # 共享 TypeScript 类型
│  └─ shared-schemas/     # 共享 Zod 校验
├─ doc/
│  ├─ requirement.md
│  ├─ architecture.md
│  ├─ dev-plan.md
│  ├─ release-checklist.md
│  └─ ops-manual.md
├─ turbo.json
└─ pnpm-workspace.yaml
```

## 技术栈

- 前端：Vue 3、Vite、Pinia、Vue Router
- 后端：Express、Prisma、MySQL
- 鉴权：JWT、bcryptjs
- 校验：Zod（前后端共用）
- 构建：Turborepo、pnpm workspace、TypeScript

## 环境要求

- Node.js >= 20
- pnpm >= 10
- MySQL >= 8

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

- 服务端：`apps/server/env/.env.development`
- 学生端：`apps/web/env/.env.development`
- 管理端：`apps/admin/env/.env.development`

可先从 `.env.example` 复制。

### 3. 初始化数据库

```bash
pnpm --filter @student-side-job-platform/server db:push
pnpm --filter @student-side-job-platform/server db:seed
```

### 4. （可选）灌入假数据

```bash
pnpm --filter @student-side-job-platform/server db:seed:mock
```

内置测试账号：

- 管理员：`admin / Admin@123456`
- 雇主：`demo_employer_1 / Demo@123456`
- 雇主：`demo_employer_2 / Demo@123456`
- 学生：`demo_student_1 / Demo@123456`
- 学生：`demo_student_2 / Demo@123456`
- 学生：`demo_student_3 / Demo@123456`

### 5. 启动开发服务

```bash
pnpm dev:server   # http://localhost:4000
pnpm dev:web      # http://localhost:3000
pnpm dev:admin    # http://localhost:3001
```

## 常用命令

### 根目录

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
```

### Server

```bash
pnpm --filter @student-side-job-platform/server db:generate
pnpm --filter @student-side-job-platform/server db:push
pnpm --filter @student-side-job-platform/server db:migrate
pnpm --filter @student-side-job-platform/server db:migrate:deploy
pnpm --filter @student-side-job-platform/server db:seed
pnpm --filter @student-side-job-platform/server db:seed:mock
pnpm --filter @student-side-job-platform/server dev
```

### Web / Admin

```bash
pnpm --filter @student-side-job-platform/web build
pnpm --filter @student-side-job-platform/admin build
```

## 当前开发进度

- Phase 1：数据层与共享包重构（完成）
- Phase 2：核心后端 API（完成）
- Phase 3：扩展后端 API（完成）
- Phase 4：前台 Web（完成，中文化）
- Phase 5：后台 Admin（完成，中文化）

## 发布与运维

请参考：

- 发布清单：[doc/release-checklist.md](doc/release-checklist.md)
- 运维手册：[doc/ops-manual.md](doc/ops-manual.md)

## 说明

- 默认开发数据库连接示例为本地 MySQL，请按实际环境修改。
- 生产环境请务必替换 `JWT_SECRET`，并使用独立数据库账号。
- 本项目已移除旧示例 `Book` 体系，切换到兼职业务模型。
