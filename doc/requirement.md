# 大学生校园兼职系统 — 需求文档

## 1. 项目概述

### 1.1 课题名称

大学生校园兼职系统

### 1.2 课题背景

随着高等教育规模的持续扩大与社会就业压力的逐渐显现，大学生群体对实践能力培养和经济独立的需求日益增强。校园兼职已成为大学生接触社会、提升综合素质、缓解经济负担的重要途径。然而，当前校园兼职市场仍面临诸多挑战：信息渠道分散、岗位真实性难以保障、供需匹配效率低下、管理与结算方式不规范等。

在数字化快速发展的时代背景下，通过开发大学生校园兼职系统，可以实现兼职信息的集中发布、审核与匹配，强化岗位真实性与信用保障，简化报名、考勤、评价流程，为学生提供便捷可靠的兼职参与渠道，同时帮助雇主高效招募与管理兼职人员。

### 1.3 项目目标

- 搭建校园兼职信息发布与管理平台
- 实现学生、雇主、管理员三方协作闭环
- 覆盖兼职从发布、申请、录用到评价的完整流程
- 系统简洁易用，无需过度复杂的实现

### 1.4 技术栈

| 层级 | 技术                                  |
| ---- | ------------------------------------- |
| 前端 | Vue 3、Vite、Vue Router、Pinia、Axios |
| 后端 | Express.js、Prisma ORM、MySQL         |
| 校验 | Zod（前后端共用）                     |
| 认证 | JWT（jsonwebtoken + bcryptjs）        |
| 构建 | Turbo、pnpm workspace、TypeScript     |

---

## 2. 系统角色

| 角色                 | 说明                                                   |
| -------------------- | ------------------------------------------------------ |
| **管理员（Admin）**  | 平台超级管理员，负责审核岗位、管理用户、查看统计数据   |
| **雇主（Employer）** | 发布兼职岗位，查看申请人，录用/拒绝学生                |
| **学生（Student）**  | 浏览岗位，提交申请，查看录用状态，对完成的兼职进行评价 |

---

## 3. 功能需求

### 3.1 用户认证模块（Auth）

#### 3.1.1 注册

- 学生和雇主均可自行注册
- 注册信息：用户名、密码、手机号、角色（student / employer）
- 学生需填写：姓名、学号、所在学校、专业
- 雇主需填写：企业/组织名称、联系人、联系方式
- 密码需 bcrypt 加密存储

#### 3.1.2 登录

- 用户名 + 密码登录
- 登录成功后返回 JWT Token
- 管理员账号由初始化脚本/seed 创建，不开放注册

#### 3.1.3 个人信息

- 登录后可查看和修改自己的基本信息
- 可修改密码

---

### 3.2 岗位管理模块（Job）

#### 3.2.1 雇主：发布岗位

雇主登录后可发布兼职岗位，填写以下信息：

- 岗位名称（必填）
- 岗位类型（枚举：促销导购、家教辅导、活动策划、餐饮服务、其他）
- 工作描述（必填）
- 工作地点（必填）
- 薪资待遇（时薪或总薪，单位：元）
- 薪资类型（时薪 / 总薪）
- 招募人数（必填，整数）
- 工作时间（开始日期 ~ 结束日期）
- 截止报名日期（必填）
- 岗位要求（选填，文本）

发布后岗位状态为 **待审核（pending）**，等待管理员审核。

#### 3.2.2 管理员：审核岗位

- 管理员可查看所有待审核岗位列表
- 可通过（approved）或拒绝（rejected），拒绝需填写原因
- 审核通过后岗位对学生可见

#### 3.2.3 学生：浏览岗位

- 学生可查看所有已审核通过的岗位列表
- 支持按岗位类型、工作地点筛选
- 支持按发布时间排序
- 可查看岗位详情

#### 3.2.4 雇主：管理我的岗位

- 雇主可查看自己发布的所有岗位（含各状态）
- 可对 **待审核** 或 **已拒绝** 的岗位进行编辑
- 可对 **已通过** 的岗位执行关闭（closed）操作，关闭后不再接受申请

---

### 3.3 申请管理模块（Application）

#### 3.3.1 学生：提交申请

- 学生对已通过的岗位可提交申请
- 每个学生对同一岗位只能申请一次
- 申请时可填写自我介绍（选填）
- 申请初始状态为 **待处理（pending）**

#### 3.3.2 雇主：处理申请

- 雇主可查看自己岗位收到的所有申请列表
- 可录用（accepted）或拒绝（rejected）申请人
- 录用人数达到招募人数上限后，该岗位自动关闭

#### 3.3.3 学生：查看我的申请

- 学生可查看自己提交的所有申请及当前状态

---

### 3.4 评价模块（Review）

#### 3.4.1 学生评价雇主

- 申请状态为 **已录用（accepted）** 且工作结束日期已过，学生可对该岗位/雇主进行评价
- 评价内容：星级（1~5）、文字评语（选填）
- 每个申请只能评价一次

#### 3.4.2 雇主评价学生

- 工作结束日期已过，雇主可对已录用的学生进行评价
- 评价内容：星级（1~5）、文字评语（选填）

---

### 3.5 管理后台统计模块（Dashboard）

管理员首页展示平台核心数据概览：

- 注册用户总数（学生数 / 雇主数）
- 岗位总数（按状态分类：待审核 / 已通过 / 已拒绝 / 已关闭）
- 申请总数（按状态分类：待处理 / 已录用 / 已拒绝）
- 近 7 天新增用户数（折线图）
- 近 7 天新增岗位数（折线图）

---

### 3.6 用户管理模块（Admin）

管理员可管理所有用户：

- 查看学生列表、雇主列表
- 禁用/启用账号（禁用后无法登录）
- 查看用户详情（基本信息 + 评价记录）

---

### 3.7 收藏模块（JobFavorite）

- 学生可收藏感兴趣的岗位（需登录）
- 可取消收藏
- 可查看我的收藏列表（分页）
- 收藏不影响申请，仅作标记用途

---

### 3.8 公告模块（Announcement）

- 管理员可在后台发布、编辑、删除平台公告
- 公告有标题、正文、置顶标志、发布时间
- 前台首页展示最新公告列表（最多显示5条）
- 学生/雇主可查看公告详情

---

### 3.9 投诉模块（Complaint）

- 学生可对已通过的岗位发起投诉举报
- 投诉填写：投诉类型（虚假信息 / 违规内容 / 其他）、投诉说明
- 同一学生对同一岗位只能投诉一次
- 管理员在后台查看投诉列表，可标记为已处理（resolved）或驳回（dismissed）
- 处理后可关联关闭被投诉岗位

---

### 3.10 操作日志模块（AdminLog）

- 系统自动记录管理员的关键操作（审核岗位、禁用用户、处理投诉等）
- 日志内容：操作人、操作类型、操作目标 ID、备注、操作时间
- 管理员可在后台查看操作日志列表，支持按日期筛选
- 仅作记录展示，不支持删除

---

## 4. 非功能需求

| 类别         | 要求                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| **安全**     | 所有接口（除登录/注册外）需 JWT 鉴权；密码 bcrypt 加密；接口根据角色做权限控制 |
| **数据校验** | 前后端统一使用 Zod Schema 校验请求数据，错误信息友好                           |
| **响应格式** | 统一返回结构 `{ code, message, data }`，使用 `ApiCode` 常量                    |
| **分页**     | 列表接口支持分页（page / pageSize），默认 pageSize=10                          |
| **简洁性**   | 不引入消息队列、缓存中间件等复杂组件，保持架构简单                             |

---

## 5. 数据模型

> 共 10 张表，ER 关系如下：
>
> - User 1:1 StudentProfile / EmployerProfile（角色扩展）
> - User 1:N Job（雇主发布岗位）
> - Job 1:N Application（岗位申请）
> - Application 1:N Review（申请评价）
> - User N:N Job（收藏，通过 JobFavorite 中间表）
> - Job 1:N Complaint（岗位投诉）
> - User 1:N AdminLog（管理员操作日志）

---

### 表1：User（用户基础表）

```
id          Int        主键，自增
username    String     用户名，唯一
password    String     bcrypt 加密密码
phone       String?    手机号
role        Enum       ADMIN | EMPLOYER | STUDENT
status      Enum       ACTIVE | DISABLED，默认 ACTIVE
createdAt   DateTime   创建时间
updatedAt   DateTime   更新时间
```

### 表2：StudentProfile（学生详情，与 User 1:1）

```
id          Int       主键，自增
userId      Int       外键 → User.id，唯一
realName    String?   真实姓名
studentNo   String?   学号
school      String?   学校
major       String?   专业
```

### 表3：EmployerProfile（雇主详情，与 User 1:1）

```
id           Int       主键，自增
userId       Int       外键 → User.id，唯一
companyName  String?   企业/组织名称
contactName  String?   联系人姓名
description  String?   企业简介
```

### 表4：Job（岗位）

```
id            Int       主键，自增
title         String    岗位名称
type          Enum      PROMOTION | TUTORING | EVENT | CATERING | OTHER
description   String    工作描述
location      String    工作地点
salary        Float     薪资金额
salaryType    Enum      HOURLY | TOTAL
headcount     Int       招募人数
startDate     DateTime  工作开始日期
endDate       DateTime  工作结束日期
deadline      DateTime  截止报名日期
requirement   String?   岗位要求
status        Enum      PENDING | APPROVED | REJECTED | CLOSED
rejectReason  String?   拒绝原因（管理员填写）
employerId    Int       外键 → User.id（雇主）
createdAt     DateTime
updatedAt     DateTime
```

### 表5：JobFavorite（收藏）

```
id          Int       主键，自增
studentId   Int       外键 → User.id（学生）
jobId       Int       外键 → Job.id
createdAt   DateTime  收藏时间

唯一约束：(studentId, jobId)
```

### 表6：Application（申请）

```
id           Int       主键，自增
jobId        Int       外键 → Job.id
studentId    Int       外键 → User.id（学生）
intro        String?   自我介绍
status       Enum      PENDING | ACCEPTED | REJECTED
createdAt    DateTime
updatedAt    DateTime

唯一约束：(jobId, studentId)
```

### 表7：Review（评价）

```
id            Int       主键，自增
applicationId Int       外键 → Application.id
fromUserId    Int       评价方 User.id
toUserId      Int       被评价方 User.id
rating        Int       星级 1~5
comment       String?   文字评语
createdAt     DateTime

唯一约束：(applicationId, fromUserId)
```

### 表8：Announcement（公告）

```
id          Int       主键，自增
title       String    公告标题
content     String    公告正文（支持长文本）
isPinned    Boolean   是否置顶，默认 false
createdBy   Int       外键 → User.id（发布管理员）
createdAt   DateTime
updatedAt   DateTime
```

### 表9：Complaint（投诉）

```
id            Int       主键，自增
jobId         Int       外键 → Job.id（被投诉岗位）
studentId     Int       外键 → User.id（投诉发起学生）
type          Enum      FAKE_INFO | ILLEGAL_CONTENT | OTHER
description   String    投诉说明
status        Enum      PENDING | RESOLVED | DISMISSED，默认 PENDING
handleNote    String?   管理员处理备注
createdAt     DateTime
updatedAt     DateTime

唯一约束：(jobId, studentId)
```

### 表10：AdminLog（管理员操作日志）

```
id           Int       主键，自增
adminId      Int       外键 → User.id（操作管理员）
action       String    操作类型（如：APPROVE_JOB、REJECT_JOB、DISABLE_USER、RESOLVE_COMPLAINT）
targetId     Int?      操作目标的资源 ID
targetType   String?   操作目标类型（如：JOB、USER、COMPLAINT）
note         String?   备注说明
createdAt    DateTime  操作时间
```

---

## 6. API 接口概要

### 认证

| 方法  | 路径               | 描述                           | 权限   |
| ----- | ------------------ | ------------------------------ | ------ |
| POST  | /api/auth/register | 注册                           | 公开   |
| POST  | /api/auth/login    | 登录                           | 公开   |
| GET   | /api/auth/me       | 获取当前用户信息（含 profile） | 已登录 |
| PUT   | /api/auth/me       | 修改个人基本信息（不含密码）   | 已登录 |
| PATCH | /api/auth/password | 修改密码（需提供旧密码）       | 已登录 |

### 岗位

| 方法  | 路径                         | 描述                                                                 | 权限               |
| ----- | ---------------------------- | -------------------------------------------------------------------- | ------------------ |
| GET   | /api/jobs                    | 获取岗位列表（?type=&location=&sort=latest&page=&pageSize=）         | 公开               |
| GET   | /api/jobs/:id                | 获取岗位详情                                                         | 公开               |
| POST  | /api/jobs                    | 发布岗位                                                             | Employer           |
| GET   | /api/employer/jobs           | 获取我发布的岗位（?status=&page=&pageSize=）                         | Employer           |
| GET   | /api/employer/jobs/:id       | 获取我的某个岗位详情（含所有状态）                                   | Employer（仅本人） |
| PUT   | /api/employer/jobs/:id       | 编辑岗位（仅 PENDING/REJECTED 状态可编辑，编辑后状态重置为 PENDING） | Employer（仅本人） |
| PATCH | /api/employer/jobs/:id/close | 关闭岗位（仅 APPROVED 状态可关闭）                                   | Employer（仅本人） |
| GET   | /api/admin/jobs              | 获取所有岗位列表（?status=&page=&pageSize=）                         | Admin              |
| PATCH | /api/admin/jobs/:id/review   | 审核岗位                                                             | Admin              |

### 申请

| 方法   | 路径                                   | 描述                        | 权限                   |
| ------ | -------------------------------------- | --------------------------- | ---------------------- |
| POST   | /api/applications                      | 提交申请                    | Student                |
| GET    | /api/applications/my                   | 我的申请列表                | Student                |
| DELETE | /api/applications/:id                  | 撤回申请（仅 PENDING 状态） | Student（仅本人）      |
| GET    | /api/employer/jobs/:jobId/applications | 某岗位的申请列表            | Employer（仅本人岗位） |
| PATCH  | /api/employer/applications/:id/review  | 录用/拒绝申请               | Employer               |

### 评价

| 方法 | 路径                      | 描述               | 权限               |
| ---- | ------------------------- | ------------------ | ------------------ |
| POST | /api/reviews              | 提交评价           | Student / Employer |
| GET  | /api/reviews/user/:userId | 获取用户收到的评价 | 已登录             |

### 收藏

| 方法   | 路径                  | 描述         | 权限    |
| ------ | --------------------- | ------------ | ------- |
| POST   | /api/favorites/:jobId | 收藏岗位     | Student |
| DELETE | /api/favorites/:jobId | 取消收藏     | Student |
| GET    | /api/favorites/my     | 我的收藏列表 | Student |

### 公告

| 方法   | 路径                         | 描述             | 权限  |
| ------ | ---------------------------- | ---------------- | ----- |
| GET    | /api/announcements           | 公告列表（前台） | 公开  |
| GET    | /api/announcements/:id       | 公告详情         | 公开  |
| POST   | /api/admin/announcements     | 创建公告         | Admin |
| PUT    | /api/admin/announcements/:id | 编辑公告         | Admin |
| DELETE | /api/admin/announcements/:id | 删除公告         | Admin |

### 投诉

| 方法  | 路径                             | 描述         | 权限    |
| ----- | -------------------------------- | ------------ | ------- |
| POST  | /api/complaints                  | 提交投诉     | Student |
| GET   | /api/complaints/my               | 我的投诉列表 | Student |
| GET   | /api/admin/complaints            | 所有投诉列表 | Admin   |
| PATCH | /api/admin/complaints/:id/handle | 处理投诉     | Admin   |

### 管理员

| 方法  | 路径                        | 描述                                             | 权限  |
| ----- | --------------------------- | ------------------------------------------------ | ----- |
| GET   | /api/admin/dashboard        | 统计数据                                         | Admin |
| GET   | /api/admin/users            | 用户列表（?role=STUDENT\|EMPLOYER&status= 筛选） | Admin |
| GET   | /api/admin/users/:id        | 用户详情（基本信息 + 评价记录）                  | Admin |
| PATCH | /api/admin/users/:id/status | 禁用/启用用户                                    | Admin |
| GET   | /api/admin/logs             | 操作日志列表（?startDate=&endDate= 筛选）        | Admin |

---

## 7. 前端应用划分

系统分为**两个独立前端应用**，对应 Monorepo 中的两个 app：

| 应用                  | 目录         | 用户       | 端口 | 说明                                                   |
| --------------------- | ------------ | ---------- | ---- | ------------------------------------------------------ |
| **前台（web）**       | `apps/web`   | 学生、雇主 | 3000 | 面向普通用户，注册登录、浏览岗位、提交申请、发布岗位等 |
| **后台管理（admin）** | `apps/admin` | 管理员     | 3001 | 管理员专用，审核岗位、管理用户、查看统计               |

---

### 7.1 前台（apps/web）页面规划

#### 公共页面

- `/` — 首页（展示平台介绍 + 最新公告 + 热门岗位）
- `/login` — 登录页
- `/register` — 注册页（选择角色：学生 / 雇主）
- `/announcements` — 公告列表
- `/announcements/:id` — 公告详情

#### 学生端页面（登录角色：student）

- `/jobs` — 岗位列表（支持按类型、地点筛选）
- `/jobs/:id` — 岗位详情 + 申请按钮 + 投诉入口
- `/my/applications` — 我的申请列表（含状态 + 评价入口）
- `/my/favorites` — 我的收藏岗位列表
- `/my/complaints` — 我的投诉列表
- `/my/profile` — 个人信息修改

#### 雇主端页面（登录角色：employer）

- `/employer/jobs` — 我发布的岗位列表
- `/employer/jobs/create` — 发布新岗位
- `/employer/jobs/:id/edit` — 编辑岗位
- `/employer/jobs/:id/applications` — 查看该岗位申请列表 + 录用/拒绝操作
- `/my/profile` — 个人信息修改

> 前台根据登录用户的 `role` 字段控制菜单和路由可见性，学生和雇主看到不同的导航和页面。

---

### 7.2 后台管理（apps/admin）页面规划

- `/login` — 管理员登录页（独立入口，不共用前台登录）
- `/dashboard` — 数据概览首页（统计图表）
- `/jobs` — 岗位管理列表（可按状态筛选，含审核操作）
- `/jobs/:id` — 岗位详情 + 审核通过/拒绝操作
- `/users` — 用户管理列表（学生 + 雇主）
- `/users/:id` — 用户详情（基本信息 + 收到的评价）
- `/announcements` — 公告管理列表（含新建/编辑/删除）
- `/complaints` — 投诉管理列表（含处理操作）
- `/logs` — 管理员操作日志列表

---

## 8. 项目结构（基于现有 Monorepo）

```
apps/
├── web/            # Vue 3 前台（学生 + 雇主，端口 3000）
├── admin/          # Vue 3 后台管理（管理员，端口 3001）
└── server/         # Express 后端（端口 4000）
    ├── prisma/
    │   └── schema.prisma    # 数据模型定义
    └── src/
        ├── routes/          # 路由：auth / jobs / applications / reviews / admin
        ├── middlewares/     # JWT 鉴权、角色权限中间件
        └── utils/           # 工具函数

packages/
├── shared/          # Axios 工厂、ApiCode、ApiResponse 类型
├── shared-types/    # TypeScript 接口：User、Job、Application、Review
└── shared-schemas/  # Zod Schema：注册、岗位、申请等校验规则
```

---

## 9. 业务规则详述

### 9.1 岗位访问规则

- 岗位列表（`/api/jobs`）和岗位详情（`/api/jobs/:id`）**无需登录**，游客可浏览
- 仅展示状态为 `APPROVED` 的岗位；`CLOSED`、`REJECTED`、`PENDING` 状态岗位对游客/学生不可见
- **被禁用雇主（`status=DISABLED`）发布的岗位，即使状态为 `APPROVED`，也从公开列表中隐藏**（查询时 JOIN User 表过滤 `status=ACTIVE` 的雇主）
- 雇主通过 `/api/employer/jobs/:id` 可查看自己发布的任意状态岗位
- 岗位详情（`/api/jobs/:id`）返回字段包含：
  - 岗位基本信息（所有 Job 表字段，不含 rejectReason）
  - 雇主信息（companyName、contactName，来自 EmployerProfile）
  - 已录用人数（已 ACCEPTED 的申请数量，用于前端展示招募进度）
  - 当前用户是否已申请（`hasApplied: boolean`，未登录时为 false）
  - 当前用户是否已收藏（`isFavorited: boolean`，未登录时为 false）

### 9.2 岗位编辑规则

- 仅 `PENDING` 或 `REJECTED` 状态的岗位可以编辑
- **编辑 `REJECTED` 状态的岗位后，状态自动重置为 `PENDING`**，重新进入审核队列
- `APPROVED` 状态的岗位不可编辑（只能关闭）

### 9.3 岗位字段校验规则（Zod Schema 依据）

- `salary`：必填，大于 0 的数字
- `headcount`：必填，正整数，最小为 1
- `startDate`：必填，必须 ≥ 今天
- `endDate`：必填，必须 > `startDate`
- `deadline`：必填，必须 ≤ `startDate`（截止报名不能晚于工作开始）
- `title`：必填，1~50 字符
- `description`：必填，1~2000 字符

### 9.4 申请规则

- 学生申请岗位的前提：岗位状态为 `APPROVED` **且** 当前日期 ≤ `deadline`（截止报名日期）
- 每个学生对同一岗位只能有一条申请记录（唯一约束），被拒绝后**不可重新申请**
- 学生可撤回 `PENDING` 状态的申请，撤回操作为**物理删除**该申请记录，撤回后可再次提交申请
- 申请状态变为 `ACCEPTED` 或 `REJECTED` 后，不可撤回

### 9.5 录用上限规则

- 雇主录用人数达到岗位 `headcount` 时，系统自动将岗位状态改为 `CLOSED`
- 岗位变为 `CLOSED` 后，剩余 `PENDING` 状态的申请**保持不变**（由雇主自行拒绝或忽略）

### 9.6 评价触发规则

- 评价入口在 `/my/applications` 页面，满足以下**全部条件**才展示评价按钮：
  1. 申请状态为 `ACCEPTED`
  2. 当前日期 > 岗位 `endDate`（工作已结束）
  3. 当前用户尚未对该申请提交过评价（查 Review 表唯一约束）
- 雇主在 `/employer/jobs/:id/applications` 页面对已录用学生评价，条件相同

### 9.7 禁用用户规则

- 用户被禁用（`status=DISABLED`）后，登录接口返回 403，已颁发的 JWT Token 立即失效（后端校验时检查 DB 状态）
- 被禁用雇主的已审核岗位**不自动关闭**，保持原状态，但不可新增申请（因为雇主已无法操作）

### 9.8 投诉与岗位关联规则

- 管理员处理投诉时，若选择 `RESOLVED`，可附带操作：同时将被投诉岗位状态改为 `CLOSED`（可选，非强制）
- 操作日志自动记录此次操作

### 9.9 注册后状态

- 学生和雇主注册后直接激活（`status=ACTIVE`），**无需审核**，可立即登录使用

---

## 10. 业务流程图

### 10.1 主流程：岗位发布 → 录用 → 评价

```
[雇主] 发布岗位 → Job.status = PENDING
        ↓
[管理员] 审核
  ├─ 通过 → Job.status = APPROVED（学生可见）
  └─ 拒绝 → Job.status = REJECTED（雇主可编辑后重新发布）
        ↓ (APPROVED)
[学生] 浏览岗位 + 提交申请 → Application.status = PENDING
        ↓
[雇主] 处理申请
  ├─ 录用 → Application.status = ACCEPTED
  │     └─ 若录用人数已满 → Job.status = CLOSED（自动）
  └─ 拒绝 → Application.status = REJECTED
        ↓ (ACCEPTED，且工作结束日期已过)
[学生] 评价雇主 → Review（fromUserId=学生, toUserId=雇主）
[雇主] 评价学生 → Review（fromUserId=雇主, toUserId=学生）
```

### 10.2 投诉流程

```
[学生] 对 APPROVED 岗位提交投诉 → Complaint.status = PENDING
        ↓
[管理员] 查看投诉列表
  ├─ 驳回 → Complaint.status = DISMISSED（记录 AdminLog）
  └─ 处理 → Complaint.status = RESOLVED（记录 AdminLog）
        └─ 可选：同时关闭被投诉岗位 → Job.status = CLOSED
```

### 10.3 用户注册/登录流程

```
[用户] 填写注册信息（选择角色：student / employer）
  ├─ 校验通过 → 创建 User + 创建对应 Profile（StudentProfile / EmployerProfile）
  │              → 自动激活，返回成功提示
  └─ 校验失败 → 返回具体错误信息

[用户] 登录（username + password）
  ├─ 账号不存在 → 401
  ├─ 密码错误 → 401
  ├─ 账号已禁用 → 403
  └─ 成功 → 返回 JWT Token + 用户基本信息（含 role）
```

---

## 11. 关键接口请求/响应体规范

### 审核岗位 `PATCH /api/admin/jobs/:id/review`

```json
// 请求体
{ "action": "approve" }
{ "action": "reject", "reason": "岗位信息不真实" }
```

### 录用/拒绝申请 `PATCH /api/employer/applications/:id/review`

```json
// 请求体
{ "action": "accept" }
{ "action": "reject" }
```

### 处理投诉 `PATCH /api/admin/complaints/:id/handle`

```json
// 请求体
{ "status": "RESOLVED", "closeJob": true, "note": "已核实，关闭岗位" }
{ "status": "DISMISSED", "note": "投诉内容不实" }
```

### 提交评价 `POST /api/reviews`

```json
// 请求体（toUserId 由后端从 applicationId 推导，前端不传）
{
  "applicationId": 1,
  "rating": 5,
  "comment": "工作体验很好"
}
```

> 后端根据 `applicationId` 查出 Application，再结合当前登录用户角色判断 `toUserId`：
>
> - 若当前用户是学生 → `toUserId` = Application 对应 Job 的 `employerId`
> - 若当前用户是雇主 → `toUserId` = Application 的 `studentId`

### 禁用/启用用户 `PATCH /api/admin/users/:id/status`

```json
// 请求体
{ "status": "DISABLED" }
{ "status": "ACTIVE" }
```

---

## 12. 错误码规范（ApiCode）

| Code | 含义                             | HTTP 状态码 |
| ---- | -------------------------------- | ----------- |
| 0    | 成功                             | 200         |
| 400  | 请求参数错误（Zod 校验失败）     | 400         |
| 401  | 未登录或 Token 无效/过期         | 401         |
| 403  | 无权限（角色不符或账号禁用）     | 403         |
| 404  | 资源不存在                       | 404         |
| 409  | 业务冲突（如：重复申请、已评价） | 409         |
| 500  | 服务端内部错误                   | 500         |

统一响应结构：

```json
{ "code": 0, "message": "success", "data": { ... } }
```

分页列表响应结构（`data` 字段）：

```json
{
  "list": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

错误示例：

```json
{ "code": 409, "message": "您已申请过该岗位", "data": null }
```

---

## 13. 认证与 Token 规范

- 登录成功后，服务端返回 `{ token: "..." }`
- 前台（web）和后台（admin）均将 Token 存储于 **`localStorage`**
  - 前台 key：`web_token`
  - 后台 key：`admin_token`
- 所有需鉴权的请求，前端在 Axios 请求拦截器中自动附加 Header：`Authorization: Bearer <token>`
- Token 过期时间：**7 天**（`JWT_EXPIRES_IN=7d`）
- 后端每次鉴权中间件除验证 JWT 签名外，还需查询 DB 确认用户 `status=ACTIVE`（防止禁用用户用旧 Token 继续访问）

---

## 14. 数据库初始化（Seed）

管理员账号由 `prisma/seed.ts` 初始化，初始数据：

```
username: admin
password: Admin@123456（bcrypt 加密存储）
role: ADMIN
status: ACTIVE
```

> 生产环境部署后应立即修改默认密码。

---

## 15. 约束与边界

1. 不实现支付/结算功能，薪资信息仅作展示
2. 不实现站内消息/通知功能，状态变更通过页面刷新感知
3. 不实现文件上传（简历、头像等），保持简单
4. 管理员账号通过数据库 seed 脚本初始化，不开放注册入口
5. 前台（web）和后台管理（admin）为两个独立 Vue 3 SPA，共用同一套后端 API
6. 两个前端应用共享 `packages/` 下的类型、校验和工具包
7. 前台未登录用户可浏览岗位列表和详情，申请/收藏/投诉需登录
8. 前台路由守卫：未登录访问需认证页面，重定向至 `/login`；登录后访问 `/login` 重定向至首页
