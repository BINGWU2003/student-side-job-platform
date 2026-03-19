# 项目架构文档

> 项目名称：student-side-job-platform
> 文档日期：2026-03-19

---

## 1. 项目概述

本项目是一个基于 **pnpm Workspaces + Turborepo** 的 Monorepo，包含管理后台前端（admin）和后端服务（server），以及若干共享包（packages）。目前以图书管理为示例业务，预留学生兼职平台的扩展能力。

---

## 2. 仓库结构

```
student-side-job-platform/
├── apps/
│   ├── admin/          # 管理后台前端（Vue 3 + Vite）
│   └── server/         # 后端 API 服务（Express.js + Prisma）
├── packages/
│   ├── shared/         # 共享工具：HTTP 客户端、状态码、工具函数
│   ├── shared-types/   # 共享 TypeScript 类型定义
│   ├── shared-schemas/ # 共享 Zod 校验 Schema
│   └── components/     # 共享 Vue 3 UI 组件库
├── doc/                # 项目文档
├── package.json        # 根 package（Monorepo 入口）
├── turbo.json          # Turborepo 构建配置
├── eslint.config.js    # 全局 ESLint 配置
└── .prettierrc.cjs     # 全局 Prettier 配置
```

---

## 3. 技术栈

| 层级          | 技术                                    | 版本                 |
| ------------- | --------------------------------------- | -------------------- |
| 前端框架      | Vue 3                                   | ^3.5                 |
| 前端路由      | Vue Router                              | ^4.4                 |
| 前端状态管理  | Pinia                                   | ^2.2                 |
| 前端构建工具  | Vite                                    | ^7.2                 |
| 后端框架      | Express.js                              | ^4.21                |
| ORM           | Prisma                                  | ^6.0                 |
| 数据库        | MySQL                                   | —                    |
| 认证          | JWT (jsonwebtoken)                      | ^9.0                 |
| 密码加密      | bcryptjs                                | ^2.4                 |
| 数据校验      | Zod（via shared-schemas）               | —                    |
| 语言          | TypeScript                              | ~5.9                 |
| 包管理器      | pnpm                                    | >=10.0               |
| Monorepo 构建 | Turborepo                               | ^2.7                 |
| 后端打包      | tsup                                    | ^8.5                 |
| 进程管理      | PM2                                     | ecosystem.config.cjs |
| 代码规范      | ESLint + Prettier + Husky + lint-staged | —                    |
| Git 提交规范  | commitlint (Conventional Commits)       | —                    |

---

## 4. 应用架构

### 4.1 后端服务（`apps/server`）

**运行端口：** 4000（默认）

#### 目录结构

```
apps/server/src/
├── index.ts            # 入口，启动 HTTP Server
├── app.ts              # Express 应用配置（中间件、路由挂载）
├── config/
│   └── index.ts        # 环境变量统一读取（port、jwt、cors）
├── lib/
│   ├── prisma.ts       # Prisma Client 单例
│   ├── jwt.ts          # JWT 签发 / 验证
│   └── hash.ts         # bcrypt 密码加密 / 对比
├── middlewares/
│   ├── authenticate.ts # Bearer Token 鉴权中间件
│   ├── errorHandler.ts # 全局错误处理
│   └── logger.ts       # 请求日志
├── routes/
│   ├── index.ts        # 路由聚合（挂载到 /api）
│   ├── health.ts       # GET /api/health
│   ├── auth.ts         # POST /api/auth/register|login
│   └── books.ts        # /api/books CRUD
└── types/
    ├── index.ts        # 扩展 Express Request（req.user）
    └── env.d.ts        # 环境变量类型声明
```

#### API 路由一览

| Method | Path                 | 是否需要认证 | 说明                             |
| ------ | -------------------- | ------------ | -------------------------------- |
| GET    | `/`                  | 否           | 服务信息                         |
| GET    | `/api/health`        | 否           | 健康检查                         |
| POST   | `/api/auth/register` | 否           | 用户注册                         |
| POST   | `/api/auth/login`    | 否           | 用户登录，返回 JWT               |
| GET    | `/api/books`         | ✅           | 图书列表（分页 + 标题/作者筛选） |
| GET    | `/api/books/:id`     | ✅           | 图书详情                         |
| POST   | `/api/books`         | ✅           | 创建图书                         |
| PUT    | `/api/books/:id`     | ✅           | 更新图书                         |
| DELETE | `/api/books/:id`     | ✅           | 删除图书                         |

#### 认证机制

1. 登录成功后服务端签发 JWT（默认有效期 7 天）。
2. 客户端请求受保护接口时在 `Authorization` 头携带 `Bearer <token>`。
3. `authenticate` 中间件解析并验证 Token，将 `{ id, role }` 注入 `req.user`。

#### 统一响应格式

```ts
{
  code: number,     // 业务状态码（来自 shared 包 ApiCode）
  message: string,
  data: T | null
}
```

---

### 4.2 管理后台前端（`apps/admin`）

**运行端口：** 3001（开发）

#### 目录结构

```
apps/admin/src/
├── main.ts             # 应用入口，注册插件
├── App.vue             # 根组件（路由出口）
├── style.css           # 全局样式
├── api/
│   ├── index.ts        # Axios 实例封装（自动注入 token、统一错误处理）
│   ├── auth.ts         # 注册 / 登录接口
│   └── books.ts        # 图书 CRUD 接口
├── stores/
│   ├── index.ts        # Pinia 初始化
│   └── auth.ts         # 认证状态（token、用户信息、登出）
├── router/
│   └── index.ts        # 路由配置 + 导航守卫
├── layouts/
│   ├── AdminLayout.vue # 后台主布局（导航侧边栏 + 内容区）
│   └── AuthLayout.vue  # 认证页布局（居中卡片）
└── views/
    ├── LoginView.vue     # 登录页
    ├── RegisterView.vue  # 注册页
    ├── DashboardView.vue # 仪表盘
    ├── BooksView.vue     # 图书管理（列表 + CRUD）
    └── NotFoundView.vue  # 404 页
```

#### 路由结构

```
/login          → AuthLayout > LoginView       （公开）
/register       → AuthLayout > RegisterView    （公开）
/               → AdminLayout > DashboardView  （需登录）
/books          → AdminLayout > BooksView      （需登录）
/*              → NotFoundView
```

导航守卫：检测 `authStore.isLoggedIn`，未登录时重定向到 `/login`。

---

## 5. 共享包（`packages/`）

| 包名                                        | 说明                                                                                                                          | 使用方                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `@student-side-job-platform/shared`         | HTTP 状态码（`HttpStatus`）、业务码（`ApiCode`）、HTTP 客户端封装、工具函数（日期、随机数）                                   | admin、server                         |
| `@student-side-job-platform/shared-types`   | TypeScript 类型定义（`LoginResponse`、`BookItem` 等）                                                                         | admin、server                         |
| `@student-side-job-platform/shared-schemas` | Zod Schema（`loginSchema`、`registerSchema`、`createBookSchema`、`updateBookSchema`、`bookListQuerySchema`、`idParamSchema`） | admin（表单校验）、server（入参校验） |
| `@student-side-job-platform/components`     | Vue 3 公共组件（`Button`、`Input`）                                                                                           | admin                                 |

---

## 6. 数据库模型

数据库：MySQL，ORM：Prisma

### User（用户表）

| 字段      | 类型            | 说明              |
| --------- | --------------- | ----------------- |
| id        | Int (PK, Auto)  | 主键              |
| email     | String (unique) | 邮箱（登录账号）  |
| username  | String          | 用户名            |
| password  | String          | bcrypt 加密密码   |
| role      | String          | 角色，默认 `user` |
| createdAt | DateTime        | 创建时间          |
| updatedAt | DateTime        | 更新时间          |

### Book（图书表）

| 字段        | 类型             | 说明     |
| ----------- | ---------------- | -------- |
| id          | Int (PK, Auto)   | 主键     |
| title       | String           | 书名     |
| author      | String           | 作者     |
| isbn        | String? (unique) | ISBN     |
| description | Text?            | 描述     |
| price       | Decimal(10,2)?   | 价格     |
| publishedAt | DateTime?        | 出版日期 |
| createdAt   | DateTime         | 创建时间 |
| updatedAt   | DateTime         | 更新时间 |

---

## 7. 开发工作流

### 启动开发环境

```bash
# 全部启动
pnpm dev

# 单独启动
pnpm dev:admin    # 前端 http://localhost:3001
pnpm dev:server   # 后端 http://localhost:4000
```

### 数据库操作

```bash
# 同步 schema 到开发库
pnpm --filter server db:push

# 生成并执行迁移
pnpm --filter server db:migrate

# 打开 Prisma Studio
pnpm --filter server db:studio
```

### 构建

```bash
pnpm build          # 全部构建（Turborepo 并行）
pnpm build:admin
pnpm build:server
```

### 代码规范

- **提交前**：Husky 触发 lint-staged，自动运行 ESLint + Prettier
- **提交信息**：commitlint 强制 Conventional Commits 规范（`feat:`、`fix:`、`chore:` 等）

---

## 8. 环境变量

各环境的配置文件位于对应 app 的 `env/` 目录，参考 `.env.example`：

### `apps/server/env/.env.*`

| 变量             | 说明                       | 默认值                                        |
| ---------------- | -------------------------- | --------------------------------------------- |
| `PORT`           | 服务端口                   | `4000`                                        |
| `DATABASE_URL`   | MySQL 连接字符串           | —                                             |
| `JWT_SECRET`     | JWT 签名密钥               | `change_me_in_production`                     |
| `JWT_EXPIRES_IN` | Token 有效期               | `7d`                                          |
| `CORS_ORIGINS`   | 允许的跨域来源（逗号分隔） | `http://localhost:3000,http://localhost:3001` |

### `apps/admin/env/.env.*`

| 变量                | 说明                                        |
| ------------------- | ------------------------------------------- |
| `VITE_API_BASE_URL` | 后端 API 地址（如 `http://localhost:4000`） |

---

## 9. 部署

### 后端（PM2）

```bash
pnpm build:server
pnpm --filter server pm2:start        # 生产
pnpm --filter server pm2:start:test   # 测试
```

PM2 配置见 `apps/server/ecosystem.config.cjs`。

数据库迁移 + 启动一体命令：

```bash
pnpm deploy:server
```

### 前端

构建产物输出到 `apps/admin/dist/`，部署到 Nginx 或 CDN 静态托管即可。

---

## 10. 架构关系图

```
┌────────────────────────────────────────────────────────┐
│                     Monorepo                           │
│                                                        │
│  ┌─────────────────────┐  ┌────────────────────────┐  │
│  │    apps/admin        │  │     apps/server         │  │
│  │  Vue3 + Vite + Pinia │  │  Express + Prisma + JWT │  │
│  │  port: 3001          │  │  port: 4000             │  │
│  └──────────┬──────────┘  └───────────┬────────────┘  │
│             │  HTTP REST (Bearer JWT)  │               │
│             └─────────────────────────┘               │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                  packages/                        │  │
│  │  shared │ shared-types │ shared-schemas │ components│  │
│  └──────────────────────────────────────────────────┘  │
│                          │                             │
│                    ┌─────▼─────┐                       │
│                    │   MySQL   │                       │
│                    └───────────┘                       │
└────────────────────────────────────────────────────────┘
```
