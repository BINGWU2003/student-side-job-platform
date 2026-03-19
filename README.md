# Bingwu Monorepo

基于 pnpm workspace + Turbo 构建的全栈 Monorepo 项目，包含 Vue 3 管理后台和 Express 服务端，共享类型、校验和工具包。

## 项目结构

```
bingwu-my-monorepo/
├── apps/
│   ├── admin/               # Vue 3 管理后台（Vite + Pinia + Vue Router）
│   └── server/              # Express 服务端（Prisma + JWT + MySQL）
├── packages/
│   ├── shared/              # 运行时工具：Axios 工厂、HttpStatus/ApiCode、通用类型
│   ├── shared-types/        # 纯 TypeScript 接口（User、Book 等 API 契约类型）
│   ├── shared-schemas/      # Zod 校验 Schema（前后端共用）
│   └── components/          # 公共 Vue 组件库
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 技术栈

| 层级 | 技术                                    |
| ---- | --------------------------------------- |
| 前端 | Vue 3、Vite、Vue Router、Pinia、Axios   |
| 后端 | Express.js、Prisma ORM、MySQL           |
| 校验 | Zod（`shared-schemas` 前后端共用）      |
| 认证 | JWT（jsonwebtoken + bcryptjs）          |
| 构建 | Turbo、pnpm workspace、TypeScript、tsup |
| 规范 | ESLint、Prettier、Husky、Commitlint     |

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 10.0.0

### 安装

```bash
# 安装 pnpm（如果还没有）
npm install -g pnpm

# 安装所有依赖
pnpm install
```

### 配置环境变量

```bash
# 服务端
cp apps/server/env/.env.example apps/server/env/.env.development

# 管理后台
cp apps/admin/.env.example apps/admin/.env.local
```

### 初始化数据库

```bash
cd apps/server

# 生成 Prisma Client
pnpm db:generate

# 同步数据库结构（开发环境）
pnpm db:push
```

### 启动开发服务

```bash
# 同时启动所有应用
pnpm dev

# 只启动管理后台（http://localhost:3000）
pnpm dev:admin

# 只启动服务端（http://localhost:4000）
pnpm dev:server
```

## 常用命令

### 根目录

```bash
pnpm dev              # 启动所有应用
pnpm build            # 构建所有应用
pnpm build:admin      # 仅构建管理后台
pnpm build:server     # 仅构建服务端
pnpm lint             # 代码检查
pnpm lint:fix         # 代码检查并修复
pnpm format           # 格式化代码
pnpm clean            # 清理构建产物
```

### 数据库（在 apps/server 目录下执行）

```bash
pnpm db:generate        # 生成 Prisma Client（修改 schema 后需执行）
pnpm db:push            # 推送 schema 变更到开发数据库（无迁移记录）
pnpm db:migrate         # 创建迁移文件并应用到开发数据库
pnpm db:migrate:deploy  # 应用迁移到生产数据库（CI/CD 使用）
pnpm db:studio          # 打开 Prisma Studio 可视化管理数据
pnpm db:reset           # 重置开发数据库（危险：会清空数据）
```

### 生产部署（在 apps/server 目录下执行）

```bash
pnpm pm2:start    # 使用 PM2 启动服务
pnpm pm2:reload   # 零停机重启
pnpm pm2:stop     # 停止服务
pnpm pm2:logs     # 查看日志
pnpm pm2:status   # 查看运行状态
```

## 包说明

### `@bingwu-my-monorepo/shared`

运行时工具包：

- `createHttpClient()` — 创建带拦截器的 Axios 实例
- `HttpStatus` — HTTP 状态码常量（`200`、`401` 等）
- `ApiCode` — 业务响应码常量（`0` 成功、`400` 参数错误等）
- `ApiResponse<T>`、`PageResult<T>` — 通用响应类型

### `@bingwu-my-monorepo/shared-types`

纯 TypeScript 接口，无运行时代码：

- `UserInfo`、`LoginResponse`
- `Book`、`BookListQuery`、`CreateBookRequest`、`UpdateBookRequest`

### `@bingwu-my-monorepo/shared-schemas`

Zod Schema，前后端统一校验规则：

- `loginSchema`、`registerSchema`
- `createBookSchema`、`updateBookSchema`

前端通过 `safeParse()` 做表单校验，后端用同一 Schema 校验请求体，保证规则一致。

## 生产数据库同步

> 不要在生产环境使用 `db:push`，应使用迁移文件。

```bash
# CI/CD 推荐流程
pnpm install
pnpm --filter @bingwu-my-monorepo/server db:migrate:deploy
pnpm build:server
pnpm --filter @bingwu-my-monorepo/server pm2:start
```

迁移文件（`prisma/migrations/`）需提交到 Git，与代码变更一起管理。

## 基于此模板二次开发

### 1. 替换命名空间

将所有 `@bingwu-my-monorepo` 批量替换为自己的 scope（如 `@my-company`）。

涉及文件：

| 文件                         | 修改内容                              |
| ---------------------------- | ------------------------------------- |
| `package.json`（根）         | `name` 字段                           |
| `packages/*/package.json`    | `name` 字段                           |
| `apps/*/package.json`        | `name` 字段及 `dependencies` 中的包名 |
| `apps/admin/vite.config.ts`  | `resolve.alias` 中的包名 key          |
| `apps/server/tsup.config.ts` | `noExternal` 数组中的包名             |
| 所有 `import` 语句           | `@bingwu-my-monorepo/*` 的引用        |

```bash
# 示例：用 VS Code 全局替换
@bingwu-my-monorepo  →  @my-company
```

> **注意**：`apps/server/tsup.config.ts` 的 `noExternal` 数组用于将 workspace 内部包打包进服务端产物（避免部署时符号链接问题），替换命名空间后需同步更新此数组。

### 2. 配置环境变量

**服务端** `apps/server/env/.env.development`：

```ini
PORT=4000
DATABASE_URL=mysql://root:password@localhost:3306/your_db
JWT_SECRET=your_strong_secret_key
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000
NODE_ENV=development
```

**管理后台** `apps/admin/.env.local`：

```ini
VITE_API_BASE_URL=http://localhost:4000
VITE_APP_TITLE=Your Admin
VITE_ENV=development
```

生产环境另建 `apps/server/env/.env.production`，`JWT_SECRET` 务必换成强随机值。

### 3. 修改数据库配置

文件：`apps/server/prisma/schema.prisma`

```prisma
datasource db {
  provider = "mysql"          // 按需改为 postgresql / sqlite
  url      = env("DATABASE_URL")
}
```

修改完 schema 后执行：

```bash
cd apps/server
pnpm db:generate   # 重新生成 Prisma Client
pnpm db:migrate    # 创建初始迁移文件
```

### 4. 修改 localStorage Key

前端 Token 和用户信息存储在 localStorage，默认 key 为 `admin_token` / `admin_user`，
建议改成项目专属名称避免与其他应用冲突。

需修改的文件：

- `apps/admin/src/api/index.ts` — `getToken` 回调中的 key
- `apps/admin/src/stores/auth.ts` — `getItem` / `setItem` / `removeItem` 中的 key

### 5. 调整 PM2 配置

文件：`apps/server/ecosystem.config.cjs`

```js
{
  name: 'your-server-name',   // pm2 进程名，改为项目名
  instances: 1,               // 多核机器可改为 'max' 或具体数字（需 cluster 模式）
  exec_mode: 'fork',          // 多实例时改为 'cluster'
  max_memory_restart: '512M', // 按服务器内存调整
}
```

### 6. 添加新的业务模块

以添加一个 `orders`（订单）模块为例，需要改动以下位置：

**1. 数据库层** `apps/server/prisma/schema.prisma` — 新增 `model Order { ... }`

**2. 共享类型** `packages/shared-types/src/index.ts` — 新增 `Order`、`CreateOrderRequest` 等接口

**3. 共享校验** `packages/shared-schemas/src/index.ts` — 新增 `createOrderSchema` 等 Zod Schema

**4. 服务端路由** `apps/server/src/routes/orders.ts` — 新增 CRUD 接口，在 `apps/server/src/routes/index.ts` 中挂载

**5. 前端 API** `apps/admin/src/api/orders.ts` — 封装请求函数

**6. 前端页面** `apps/admin/src/views/OrdersView.vue` + 注册路由

> **提示**：如果第 2、3 步新增了 workspace 包（如 `packages/shared-utils`），需将包名加入 `apps/server/tsup.config.ts` 的 `noExternal` 数组，否则服务端打包产物在部署时可能因符号链接缺失而报错。

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat:     新功能
fix:      Bug 修复
refactor: 重构（不涉及功能变更）
chore:    构建/工具/依赖更新
docs:     文档修改
style:    代码格式调整
test:     测试相关
```

## 参考资源

- [Turbo 文档](https://turbo.build/repo/docs)
- [pnpm workspace](https://pnpm.io/workspaces)
- [Prisma 文档](https://www.prisma.io/docs)
- [Zod 文档](https://zod.dev)
