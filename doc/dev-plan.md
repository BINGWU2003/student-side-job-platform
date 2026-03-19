# 大学生校园兼职系统 — 开发规划文档

> 文档日期：2026-03-19
> 基于：`requirement.md` + `architecture.md`

---

## 1. 现状分析

### 已完成的基础设施

| 模块          | 现状                                                                                  |
| ------------- | ------------------------------------------------------------------------------------- |
| Monorepo 结构 | `apps/admin`、`apps/server`、`packages/*` 已就位，缺少 `apps/web`                     |
| 后端框架      | Express + Prisma + JWT + bcrypt 骨架已搭建，含 `auth`（注册/登录）和示例 `books` 路由 |
| 数据库模型    | 当前 schema 仅含 `User`（email 登录）和 `Book`，**需完全重写**                        |
| 管理后台前端  | `apps/admin` 有登录/注册/Dashboard/Books 示例页，**需大幅改造**                       |
| 共享包        | `shared`、`shared-types`、`shared-schemas`、`components` 均已建立，内容需扩充         |

### 需新建

- `apps/web`：面向学生 + 雇主的前台 Vue 3 SPA（端口 3000）

---

## 2. 开发分阶段计划

共分 **5 个阶段**，建议按顺序推进（后端先于前端，基础层先于业务层）。

```
Phase 1 → 数据层 & 共享包
Phase 2 → 后端 API（核心模块）
Phase 3 → 后端 API（扩展模块）
Phase 4 → 前台 web 开发
Phase 5 → 后台 admin 改造
```

---

## 3. Phase 1：数据层 & 共享包重写

> 目标：统一所有后续开发的类型、校验和数据库基础

### 3.1 Prisma Schema 重写（`apps/server/prisma/schema.prisma`）

删除旧 `Book` 模型，新增以下 10 张表（字段详见 `requirement.md` 第 5 节）：

| 表名              | 说明                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| `User`            | 用户基础表（替换旧表，去掉 email，改为 username 登录，增加 phone/role/status） |
| `StudentProfile`  | 学生详情（1:1 User）                                                           |
| `EmployerProfile` | 雇主详情（1:1 User）                                                           |
| `Job`             | 岗位表                                                                         |
| `JobFavorite`     | 收藏中间表                                                                     |
| `Application`     | 申请表                                                                         |
| `Review`          | 评价表                                                                         |
| `Announcement`    | 公告表                                                                         |
| `Complaint`       | 投诉表                                                                         |
| `AdminLog`        | 管理员操作日志                                                                 |

**Enum 类型清单：**

```prisma
enum Role        { ADMIN EMPLOYER STUDENT }
enum UserStatus  { ACTIVE DISABLED }
enum JobType     { PROMOTION TUTORING EVENT CATERING OTHER }
enum SalaryType  { HOURLY TOTAL }
enum JobStatus   { PENDING APPROVED REJECTED CLOSED }
enum AppStatus   { PENDING ACCEPTED REJECTED }
enum CmplType    { FAKE_INFO ILLEGAL_CONTENT OTHER }
enum CmplStatus  { PENDING RESOLVED DISMISSED }
```

**同步 Schema：**

```bash
pnpm --filter server db:push     # 开发环境同步
pnpm --filter server db:migrate  # 生成迁移文件（正式环境）
```

**新建 `apps/server/prisma/seed.ts`**（当前不存在），内容：创建 admin 账号（username: `admin`，password: bcrypt(`Admin@123456`)，role: `ADMIN`）。

同时在 `apps/server/package.json` 的 scripts 中添加：

```json
"db:seed": "dotenv -e env/.env.development -- tsx prisma/seed.ts"
```

然后执行：

```bash
pnpm --filter server db:seed     # 初始化管理员账号
```

### 3.2 `packages/shared-types` 改写

**需要改写的文件：**

- `src/auth.ts`：删除 `email` 字段，`UserInfo` 改为含 `phone`/`role`/`status`；`LoginResponse` 中 token 结构不变，`user` 字段更新
- `src/book.ts`：**完全删除**

**新增文件 `src/job.ts`、`src/application.ts` 等**，定义：

```
UserBase, StudentProfile, EmployerProfile
JobItem, JobDetail, JobListQuery
ApplicationItem, ReviewItem
AnnouncementItem, ComplaintItem, AdminLogItem
ApiResponse<T>, PagedData<T>
```

`src/index.ts` 删除 `export * from './book'`，添加新文件的导出。

### 3.3 `packages/shared-schemas` 改写

**需要改写的文件：**

- `src/auth.ts`：**完全重写**，登录字段从 `email` 改为 `username`；`registerSchema` 拆分为基础字段 + 角色分支（`role` 枚举 + `studentFields` / `employerFields`）
  - `role` 枚举仅允许 `STUDENT | EMPLOYER`（**禁止注册 ADMIN**）
  - 基础字段包含 `phone`（必填，手机号格式校验）
- `src/book.ts`：**完全删除**

**新增文件**，定义以下 Schema：

```
updateProfileSchema / updatePasswordSchema
createJobSchema / updateJobSchema（含 9.3 节字段校验规则）
reviewJobSchema（管理员审核：action: 'approve'|'reject' + reason?）
submitApplicationSchema
reviewApplicationSchema（action: 'accept'|'reject'）
submitReviewSchema
createAnnouncementSchema
submitComplaintSchema
handleComplaintSchema（status: 'RESOLVED'|'DISMISSED' + closeJob? + note?）
updateUserStatusSchema
jobListQuerySchema（type? location? sort? page pageSize）
```

`src/index.ts` 删除 `export * from './book'`，添加新文件的导出。

### 3.4 `packages/shared` 更新

- `ApiCode` 已包含所有必要码值（0/400/401/403/404/409/500），**无需修改**
- `createHttpClient(options: HttpClientOptions)` 已支持 `getToken` 回调，**无需修改**；前端使用时传入对应的 token 读取函数即可：
  ```ts
  // apps/web
  createHttpClient({ baseURL, getToken: () => localStorage.getItem('web_token') });
  // apps/admin
  createHttpClient({ baseURL, getToken: () => localStorage.getItem('admin_token') });
  ```

---

## 4. Phase 2：后端 API — 核心模块

> 目标：实现认证、岗位、申请、评价四个核心模块

### 4.0 基础设施改造（Phase 2 开始前完成）

**新建 `apps/server/src/lib/AppError.ts`：**

```ts
export class AppError extends Error {
  constructor(
    public apiCode: number,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}
```

**改造 `apps/server/src/middlewares/errorHandler.ts`：**

将现有实现改为识别 `AppError`，确保 `code` 字段使用 `apiCode` 而非 HTTP statusCode：

```ts
import { AppError } from '../lib/AppError';
// err instanceof AppError → code: err.apiCode, statusCode: err.statusCode
// 其他 Error → code: 500, statusCode: 500
```

### 4.1 认证模块（`apps/server/src/routes/auth.ts`）

**改造现有文件**（登录字段从 email → username，增加角色分支注册逻辑）

| 接口                       | 说明                                                      |
| -------------------------- | --------------------------------------------------------- |
| `POST /api/auth/register`  | 按 role 创建 User + StudentProfile 或 EmployerProfile     |
| `POST /api/auth/login`     | username + password，返回 JWT token + 用户信息（含 role） |
| `GET /api/auth/me`         | 返回当前用户信息 + 对应 profile                           |
| `PUT /api/auth/me`         | 更新基本信息（username/phone + profile 字段）             |
| `PATCH /api/auth/password` | 提供旧密码后更新密码                                      |

**中间件改造：`middlewares/authenticate.ts`**

- 验证 JWT 之后，额外查询 DB 确认 `user.status === ACTIVE`，禁用用户返回 403

### 4.2 岗位模块（新建 `apps/server/src/routes/jobs.ts`）

| 接口                                 | 权限             | 要点                                                                   |
| ------------------------------------ | ---------------- | ---------------------------------------------------------------------- |
| `GET /api/jobs`                      | 公开             | 仅返回 APPROVED + 雇主 ACTIVE；支持 type/location/sort/page/pageSize   |
| `GET /api/jobs/:id`                  | 公开             | 返回 job + employer profile + acceptedCount + hasApplied + isFavorited |
| `POST /api/jobs`                     | Employer         | 创建后 status=PENDING                                                  |
| `GET /api/employer/jobs`             | Employer         | 返回本人所有岗位，支持 status 筛选                                     |
| `GET /api/employer/jobs/:id`         | Employer（本人） | 含 rejectReason                                                        |
| `PUT /api/employer/jobs/:id`         | Employer（本人） | 仅 PENDING/REJECTED 可编辑，编辑 REJECTED → 重置为 PENDING             |
| `PATCH /api/employer/jobs/:id/close` | Employer（本人） | 仅 APPROVED 可关闭                                                     |
| `GET /api/admin/jobs`                | Admin            | 所有岗位，支持 status 筛选                                             |
| `PATCH /api/admin/jobs/:id/review`   | Admin            | approve/reject，记录 AdminLog                                          |

### 4.3 申请模块（新建 `apps/server/src/routes/applications.ts`）

| 接口                                          | 权限                 | 要点                                                                                                                   |
| --------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `POST /api/applications`                      | Student              | 岗位需 APPROVED 且未过 deadline；唯一约束防重复                                                                        |
| `GET /api/applications/my`                    | Student              | 含岗位信息、申请状态；**每条申请额外返回 `hasReviewed: boolean`**（是否已对该申请提交过评价，供前端控制评价按钮显示）  |
| `DELETE /api/applications/:id`                | Student（本人）      | 仅 PENDING 可撤回（物理删除）                                                                                          |
| `GET /api/employer/jobs/:jobId/applications`  | Employer（本人岗位） | 含学生 profile；**每条申请额外返回 `hasReviewed: boolean`**（雇主是否已对该学生评价）                                  |
| `PATCH /api/employer/applications/:id/review` | Employer             | 录用/拒绝；**录用操作使用 Prisma 事务**：先更新申请状态，再查已录用数，若 ≥ headcount 则同事务内关闭岗位（防并发竞态） |

### 4.4 评价模块（新建 `apps/server/src/routes/reviews.ts`）

| 接口                            | 权限               | 要点                              |
| ------------------------------- | ------------------ | --------------------------------- |
| `POST /api/reviews`             | Student / Employer | 后端推导 toUserId；唯一约束防重评 |
| `GET /api/reviews/user/:userId` | 已登录             | 返回该用户收到的所有评价          |

**`middlewares/` 新增/改造中间件：**

```ts
// 新建：requireRole.ts
requireRole('STUDENT'); // 仅学生，否则 403
requireRole('EMPLOYER'); // 仅雇主，否则 403
requireRole('ADMIN'); // 仅管理员，否则 403

// 新建：optionalAuthenticate.ts
// 有 Bearer Token 则验证并注入 req.user；无 Token 或 Token 无效则跳过（req.user = undefined）
// 用于公开接口（GET /api/jobs, GET /api/jobs/:id）需要条件性返回 hasApplied / isFavorited 的场景

// 改造：authenticate.ts
// 在现有 JWT 验证之后，额外查询 DB 确认 user.status === ACTIVE
// 禁用用户返回 403（AppError）
```

---

## 5. Phase 3：后端 API — 扩展模块

> 目标：收藏、公告、投诉、管理员后台接口

### 5.1 收藏模块（`apps/server/src/routes/favorites.ts`）

| 接口                           | 权限            |
| ------------------------------ | --------------- |
| `POST /api/favorites/:jobId`   | Student         |
| `DELETE /api/favorites/:jobId` | Student         |
| `GET /api/favorites/my`        | Student（分页） |

### 5.2 公告模块（`apps/server/src/routes/announcements.ts`）

| 接口                                  | 权限                        |
| ------------------------------------- | --------------------------- |
| `GET /api/announcements`              | 公开（最多 5 条，置顶优先） |
| `GET /api/announcements/:id`          | 公开                        |
| `POST /api/admin/announcements`       | Admin                       |
| `PUT /api/admin/announcements/:id`    | Admin                       |
| `DELETE /api/admin/announcements/:id` | Admin                       |

### 5.3 投诉模块（`apps/server/src/routes/complaints.ts`）

| 接口                                     | 权限    | 要点                                            |
| ---------------------------------------- | ------- | ----------------------------------------------- |
| `POST /api/complaints`                   | Student | 仅对 APPROVED 岗位投诉；唯一约束                |
| `GET /api/complaints/my`                 | Student |                                                 |
| `GET /api/admin/complaints`              | Admin   |                                                 |
| `PATCH /api/admin/complaints/:id/handle` | Admin   | RESOLVED/DISMISSED；可选关闭岗位；记录 AdminLog |

### 5.4 管理员模块（`apps/server/src/routes/admin.ts`）

| 接口                                | 说明                                         |
| ----------------------------------- | -------------------------------------------- |
| `GET /api/admin/dashboard`          | 用户数/岗位数/申请数统计 + 近 7 天折线图数据 |
| `GET /api/admin/users`              | 用户列表（role/status 筛选 + 分页）          |
| `GET /api/admin/users/:id`          | 用户详情 + 该用户收到的评价                  |
| `PATCH /api/admin/users/:id/status` | 禁用/启用；记录 AdminLog                     |
| `GET /api/admin/logs`               | 操作日志列表（日期筛选 + 分页）              |

**Dashboard 折线图数据格式（`data.chart` 字段）：**

```ts
{
  users: { dates: ['03-13','03-14',...,'03-19'], counts: [2,5,3,...] },  // 近7天新增用户
  jobs:  { dates: ['03-13','03-14',...,'03-19'], counts: [1,3,0,...] }   // 近7天新增岗位
}
```

前端按 `dates` 数组作 X 轴，`counts` 数组作 Y 轴渲染折线图。

### 5.5 路由聚合（`apps/server/src/routes/index.ts`）

将所有路由挂载到 `/api`，删除 `books.ts`：

```ts
router.use('/', authRouter);
router.use('/jobs', jobRouter);
router.use('/applications', applicationRouter);
router.use('/reviews', reviewRouter);
router.use('/favorites', favoriteRouter);
router.use('/announcements', announcementRouter);
router.use('/complaints', complaintRouter);
router.use('/employer', employerRouter); // employer/jobs, employer/applications
router.use('/admin', adminRouter); // admin/jobs, admin/users, admin/complaints...
```

---

## 6. Phase 4：前台 web 开发（`apps/web`）

> 目标：新建面向学生 + 雇主的 Vue 3 SPA

### 6.1 初始化项目

参考 `apps/admin` 的 Vite + Vue 3 配置创建 `apps/web`，需新建以下文件：

- `package.json`（name: `@student-side-job-platform/web`，dev 端口 3000）
- `vite.config.ts`、`tsconfig.json`、`tsconfig.app.json`、`index.html`
- `env/.env.development`、`env/.env.example`

**同时在根 `package.json` 的 scripts 中补充：**

```json
"dev:web": "turbo run dev --filter=web"
```

```json
// apps/web/package.json（关键字段）
{ "name": "@student-side-job-platform/web", "scripts": { "dev": "vite --port 3000" } }
```

```env
# apps/web/env/.env.development
VITE_API_BASE_URL=http://localhost:4000
```

### 6.2 目录结构

```
apps/web/src/
├── main.ts
├── App.vue
├── api/
│   ├── index.ts          # Axios 实例（token key: web_token）
│   ├── auth.ts
│   ├── jobs.ts
│   ├── applications.ts
│   ├── reviews.ts
│   ├── favorites.ts
│   ├── announcements.ts
│   └── complaints.ts
├── stores/
│   ├── auth.ts           # token + 用户信息 + role
│   └── index.ts
├── router/
│   └── index.ts          # 路由配置 + 导航守卫
├── layouts/
│   ├── DefaultLayout.vue # 顶部导航 + 内容区（公共/学生/雇主共用）
│   └── AuthLayout.vue
└── views/
    ├── HomeView.vue
    ├── LoginView.vue
    ├── RegisterView.vue
    ├── AnnouncementListView.vue
    ├── AnnouncementDetailView.vue
    ├── jobs/
    │   ├── JobListView.vue
    │   └── JobDetailView.vue
    ├── student/
    │   ├── ApplicationListView.vue
    │   ├── FavoriteListView.vue
    │   ├── ComplaintListView.vue
    │   └── ProfileView.vue
    └── employer/
        ├── JobListView.vue
        ├── JobCreateView.vue
        ├── JobEditView.vue
        ├── JobApplicationsView.vue
        └── ProfileView.vue
```

### 6.3 路由配置

```
/                          → DefaultLayout > HomeView          （公开）
/login                     → AuthLayout > LoginView            （公开）
/register                  → AuthLayout > RegisterView         （公开）
/announcements             → DefaultLayout > AnnouncementListView（公开）
/announcements/:id         → DefaultLayout > AnnouncementDetailView（公开）
/jobs                      → DefaultLayout > JobListView       （公开）
/jobs/:id                  → DefaultLayout > JobDetailView     （公开）

── 以下需登录（Student） ──────────────────────────────────────
/my/applications           → DefaultLayout > ApplicationListView
/my/favorites              → DefaultLayout > FavoriteListView
/my/complaints             → DefaultLayout > ComplaintListView
/my/profile                → DefaultLayout > ProfileView

── 以下需登录（Employer） ─────────────────────────────────────
/employer/jobs             → DefaultLayout > employer/JobListView
/employer/jobs/create      → DefaultLayout > employer/JobCreateView
/employer/jobs/:id/edit    → DefaultLayout > employer/JobEditView
/employer/jobs/:id/applications → DefaultLayout > employer/JobApplicationsView
/my/profile                → DefaultLayout > employer/ProfileView（与学生同路径，按 role 渲染）
```

**导航守卫逻辑：**

- 未登录访问需认证页 → 重定向 `/login`
- 已登录访问 `/login` → 重定向 `/`
- Student 访问 `/employer/*` → 重定向 `/`（或 404）
- Employer 访问 `/my/applications` 等 → 重定向 `/`

### 6.4 关键页面功能清单

| 页面                         | 关键功能                                                                  |
| ---------------------------- | ------------------------------------------------------------------------- |
| HomeView                     | 最新公告列表（最多 5 条）+ 热门/最新岗位展示                              |
| JobListView                  | 类型/地点筛选，发布时间排序，分页，收藏按钮（登录后）                     |
| JobDetailView                | 岗位详情，招募进度（已录用/总招募），申请按钮（学生），收藏按钮，投诉入口 |
| ApplicationListView          | 申请状态展示，评价按钮（满足条件时显示）                                  |
| employer/JobApplicationsView | 申请列表，录用/拒绝按钮，评价按钮（满足条件时显示）                       |
| RegisterView                 | 角色选择（student/employer），动态表单字段                                |

---

## 7. Phase 5：管理后台 admin 改造（`apps/admin`）

> 目标：将示例页面替换为实际管理功能

### 7.1 API 层重写

删除 `api/books.ts`，新增：

```
api/jobs.ts         # GET/PATCH admin/jobs, GET/PATCH admin/jobs/:id/review
api/users.ts        # GET admin/users, GET admin/users/:id, PATCH status
api/announcements.ts
api/complaints.ts
api/logs.ts
api/dashboard.ts
```

`api/index.ts` 中 token key 使用 `admin_token`。

### 7.2 路由重写

删除 `/books` 路由，新增：

```
/login             → AuthLayout > LoginView       （公开）
/                  → AdminLayout > DashboardView  （Admin）
/jobs              → AdminLayout > JobListView
/jobs/:id          → AdminLayout > JobDetailView
/users             → AdminLayout > UserListView
/users/:id         → AdminLayout > UserDetailView
/announcements     → AdminLayout > AnnouncementView
/complaints        → AdminLayout > ComplaintView
/logs              → AdminLayout > LogView
/*                 → NotFoundView
```

**导航守卫：** 仅允许 `role === ADMIN` 访问，否则退出并重定向 `/login`。

### 7.3 页面功能清单

| 页面             | 功能                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| DashboardView    | 用户/岗位/申请数字统计卡片 + 近 7 天折线图（ECharts 或轻量图表库）               |
| JobListView      | 状态筛选（PENDING/APPROVED/REJECTED/CLOSED）+ 分页，PENDING 状态行显示"审核"按钮 |
| JobDetailView    | 完整岗位信息（含 rejectReason）+ 审核通过/拒绝操作面板                           |
| UserListView     | role/status 筛选 + 分页，禁用/启用按钮                                           |
| UserDetailView   | 用户基本信息 + 收到的评价列表                                                    |
| AnnouncementView | 公告列表 + 新建/编辑（Modal 表单）/ 删除                                         |
| ComplaintView    | 投诉列表 + 处理操作（RESOLVED 含"同时关闭岗位"选项）                             |
| LogView          | 日志列表（日期范围筛选 + 分页），只读                                            |

### 7.4 AdminLayout 侧边栏菜单

```
仪表盘   /
岗位管理 /jobs
用户管理 /users
公告管理 /announcements
投诉管理 /complaints
操作日志 /logs
```

---

## 8. 任务优先级与依赖关系

```
Phase 1 ──────────────────────────────────────────────────────┐
  ├── [P1-1] Prisma Schema 重写 + migrate + 新建 seed.ts       │
  ├── [P1-2] shared-types 改写（auth.ts）+ 新增业务类型文件    │
  └── [P1-3] shared-schemas 改写（auth.ts）+ 新增校验文件      │
                                                              ↓
Phase 2 ──────────────────────────────────────────────────────┤
  ├── [P2-0] AppError 类 + errorHandler 改造                   │
  ├── [P2-1] auth 路由改写（依赖 P1-1/P1-3）                   │
  ├── [P2-2] authenticate 改造 + requireRole + optionalAuth   │
  ├── [P2-3] jobs 路由（依赖 P2-2）                            │
  ├── [P2-4] applications 路由（依赖 P2-3）                    │
  └── [P2-5] reviews 路由（依赖 P2-4）                         │
                                                              ↓
Phase 3 ──────────────────────────────────────────────────────┤
  ├── [P3-1] favorites 路由（依赖 P2-3）                       │
  ├── [P3-2] announcements 路由                               │
  ├── [P3-3] complaints 路由（依赖 P2-3）                      │
  └── [P3-4] admin 路由（依赖 P2, P3-3）                      │
                                                              ↓
Phase 4/5 并行（均依赖 Phase 1-3 后端完成）──────────────────┘
  ├── Phase 4: apps/web 从零搭建
  └── Phase 5: apps/admin 改造
```

---

## 9. 关键约定与开发规范

### 9.1 响应格式与错误处理

所有接口统一使用：

```ts
// 成功
res.json({ code: ApiCode.SUCCESS, message: 'success', data: result });

// 分页列表
res.json({ code: ApiCode.SUCCESS, message: 'success', data: { list, total, page, pageSize } });

// 抛出业务错误（由 errorHandler 统一捕获）
throw new AppError(ApiCode.NOT_FOUND, '岗位不存在', 404);
throw new AppError(ApiCode.CONFLICT, '您已申请过该岗位', 409);
throw new AppError(ApiCode.FORBIDDEN, '无操作权限', 403);
```

`errorHandler` 捕获后输出：

```json
{ "code": 404, "message": "岗位不存在", "data": null }
```

### 9.2 AdminLog 记录时机

以下操作必须写入 AdminLog：

| action 字符串       | 触发场景                   |
| ------------------- | -------------------------- |
| `APPROVE_JOB`       | 管理员审核通过岗位         |
| `REJECT_JOB`        | 管理员拒绝岗位             |
| `DISABLE_USER`      | 管理员禁用用户             |
| `ENABLE_USER`       | 管理员启用用户             |
| `RESOLVE_COMPLAINT` | 管理员处理投诉（resolved） |
| `DISMISS_COMPLAINT` | 管理员驳回投诉             |

### 9.3 分页参数默认值

```ts
const page = Number(req.query.page) || 1;
const pageSize = Number(req.query.pageSize) || 10;
const skip = (page - 1) * pageSize;
```

### 9.4 前端 Token 管理

| 应用       | localStorage key |
| ---------- | ---------------- |
| apps/web   | `web_token`      |
| apps/admin | `admin_token`    |

Axios 拦截器自动附加 `Authorization: Bearer <token>`，401 响应自动清除 token 并重定向 `/login`。

### 9.5 删除示例代码

完成 **Phase 1** 后、进入 Phase 2 之前统一清理，避免旧代码影响后续编译：

- `apps/server/src/routes/books.ts`（删除文件）
- `apps/server/src/routes/index.ts`（删除 books 路由挂载）
- `packages/shared-schemas/src/book.ts`（删除文件）
- `packages/shared-types/src/book.ts`（删除文件）
- `apps/admin/src/api/books.ts`（删除文件）
- `apps/admin/src/views/BooksView.vue`（删除文件）
- `apps/admin/src/router/index.ts`（删除 `/books` 路由）

### 9.6 `packages/components` 使用约定

`packages/components` 已提供 `Button`、`Input` 等基础组件，前端开发（Phase 4/5）优先复用，避免重复造轮子。如需新增组件，在此包内统一维护。

---

## 10. 环境变量清单

### `apps/server/env/.env.development`

```env
PORT=4000
DATABASE_URL=mysql://root:password@localhost:3306/student_side_job
JWT_SECRET=dev_secret_change_me
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### `apps/web/env/.env.development`

```env
VITE_API_BASE_URL=http://localhost:4000
```

### `apps/admin/env/.env.development`

```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 11. 验收标准

### Phase 1

- [ ] `prisma db push` 成功，10 张表与 requirement.md 一致
- [ ] `prisma/seed.ts` 创建完毕，`db:seed` 脚本注册到 package.json
- [ ] `prisma db seed` 成功创建 admin 账号（可用 `admin` / `Admin@123456` 登录）
- [ ] `shared-types` 导出所有业务接口类型，TypeScript 编译无报错，旧 Book 类型已删除
- [ ] `shared-schemas` 导出所有 Zod Schema，边界校验测试通过，旧 book schema 已删除

### Phase 2-3

- [ ] `AppError` 类创建完毕，`errorHandler` 正确返回 `apiCode` 字段
- [ ] `optionalAuthenticate` 中间件：有 Token 时注入 `req.user`，无 Token 时跳过（不报错）
- [ ] `authenticate` 中间件：增加 DB 查询，禁用用户返回 403
- [ ] 所有 API 接口可通过 Postman/Bruno 正常调用
- [ ] 角色权限控制正确（学生/雇主/管理员不可互访对方专属接口）
- [ ] `registerSchema` 不允许注册 ADMIN 角色
- [ ] 禁用用户后旧 Token 访问返回 403
- [ ] 录用操作在 Prisma 事务内执行，满员时岗位原子性关闭
- [ ] 管理员操作均写入 AdminLog
- [ ] Dashboard 折线图数据格式符合约定（dates + counts 数组）

### Phase 4（apps/web）

- [ ] 根 `package.json` 已补充 `dev:web` 脚本
- [ ] 注册页支持学生/雇主两种角色，表单字段动态切换，不允许选择 ADMIN
- [ ] 未登录可浏览岗位列表和详情，申请/收藏/投诉需登录
- [ ] 学生端：申请、撤回、收藏、投诉、评价功能均可用
- [ ] 评价按钮仅在 ACCEPTED + 工作已结束 + 未评价（`hasReviewed=false`）时显示
- [ ] 雇主端：发布/编辑/关闭岗位、处理申请、评价学生均可用
- [ ] 路由守卫正确区分 student/employer 页面权限

### Phase 5（apps/admin）

- [ ] Dashboard 数字统计与折线图展示正确
- [ ] 岗位审核操作成功更新岗位状态并写入 AdminLog
- [ ] 用户禁用/启用操作成功
- [ ] 公告 CRUD 全部可用
- [ ] 投诉处理含"关闭岗位"可选项
- [ ] 操作日志分页展示，不可删除
