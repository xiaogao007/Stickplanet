一个帮助用户培养自律习惯的打卡类小程序，提供"50天坚持计划"为核心功能，帮助用户规划、执行并复盘个人成长计划。

---

## 项目概述

坚持喵是一款基于 Taro + React + TypeScript 开发的微信小程序，使用 Tailwind CSS 进行样式设计，Supabase 作为后端数据库。

### 核心功能

- **用户认证**：手机号/邮箱登录，首位用户自动成为管理员
- **计划管理**：创建、编辑、暂停、删除个人坚持计划
- **推荐计划**：10+ 精选计划模板，一键加入
- **每日打卡**：支持文字记录、心情选择、图片上传
- **日历视图**：月历展示打卡记录，直观查看坚持情况
- **成就系统**：7天、21天、50天、100天里程碑勋章
- **数据统计**：完成率、连续天数、剩余天数等多维度统计
- **个人中心**：用户信息、等级、积分、成就展示

---

## 技术架构

### 前端技术栈
- **Taro 3.x** - 跨平台开发框架
- **React 18** - UI 框架
- **TypeScript** - 类型系统
- **Tailwind CSS** - 样式方案
- **Zustand** - 状态管理

### 后端技术栈
- **Supabase** - 后端服务
  - PostgreSQL 数据库
  - 用户认证（Auth）
  - 文件存储（Storage）
  - 行级安全策略（RLS）

### 设计系统
- **主色调**：白色和浅灰色背景 + 鲜艳绿色强调（#10B981）- 干净明亮、清新活力
- **配色方案**：白色/浅灰色主色调 + 绿色强调色 + 辅助色（蓝色、粉色、黄色）
- **语义化颜色**：primary（绿色）, secondary（蓝色）, accent（粉色）, success（绿色）, warning（黄色）, destructive（红色）

---

## 项目结构

```
├── src/
│   ├── app.config.ts           # Taro 应用配置（路由、TabBar）
│   ├── app.tsx                 # 应用入口（AuthProvider）
│   ├── app.scss                # 全局样式（设计系统变量）
│   ├── client/
│   │   └── supabase.ts         # Supabase 客户端配置
│   ├── db/
│   │   ├── types.ts            # 数据库类型定义
│   │   └── api.ts              # 数据库 API 封装
│   ├── utils/
│   │   └── upload.ts           # 图片上传工具
│   ├── pages/
│   │   ├── login/              # 登录页
│   │   ├── home/               # 首页（TabBar）
│   │   ├── plans/              # 计划列表（TabBar）
│   │   ├── calendar/           # 打卡日历（TabBar）
│   │   ├── profile/            # 个人中心（TabBar）
│   │   ├── plan-create/        # 创建计划
│   │   ├── plan-detail/        # 计划详情
│   │   ├── templates/          # 推荐计划
│   │   ├── checkin/            # 每日打卡
│   │   └── achievements/       # 成就勋章
│   └── assets/
│       └── images/             # TabBar 图标
│           ├── selected/       # 选中态图标
│           └── unselected/     # 未选中态图标
├── supabase/
│   └── migrations/             # 数据库迁移文件
│       ├── 01_create_initial_tables.sql
│       └── 02_create_checkin_images_bucket.sql
└── .env                        # 环境变量配置
```

---

## 数据库设计

### 表结构

#### profiles - 用户信息表
- `id` (uuid) - 用户ID
- `phone` (text) - 手机号
- `email` (text) - 邮箱
- `nickname` (text) - 昵称
- `avatar_url` (text) - 头像URL
- `role` (user_role) - 角色（user/admin）
- `total_days` (integer) - 累计坚持天数
- `level` (integer) - 用户等级
- `points` (integer) - 积分

#### plans - 坚持计划表
- `id` (uuid) - 计划ID
- `user_id` (uuid) - 用户ID
- `name` (text) - 计划名称
- `description` (text) - 计划描述
- `start_date` (date) - 开始日期
- `end_date` (date) - 结束日期
- `total_days` (integer) - 总天数
- `frequency` (text) - 执行频次
- `daily_target` (text) - 每日目标
- `motivation_text` (text) - 激励语
- `status` (text) - 状态（active/paused/completed）
- `is_template` (boolean) - 是否为模板

#### check_ins - 打卡记录表
- `id` (uuid) - 打卡ID
- `plan_id` (uuid) - 计划ID
- `user_id` (uuid) - 用户ID
- `check_date` (date) - 打卡日期
- `completed` (boolean) - 是否完成
- `note` (text) - 打卡备注
- `images` (text[]) - 图片URL数组
- `mood` (text) - 心情

#### achievements - 成就勋章表
- `id` (uuid) - 成就ID
- `user_id` (uuid) - 用户ID
- `plan_id` (uuid) - 计划ID
- `type` (text) - 成就类型
- `title` (text) - 成就标题
- `description` (text) - 成就描述

### 安全策略
- 所有表启用 RLS（行级安全）
- 管理员拥有所有表的完全访问权限
- 用户只能查看和管理自己的数据
- 计划模板对所有人可见

---

## 路由配置

### TabBar 页面
- `/pages/home/index` - 首页
- `/pages/plans/index` - 计划列表
- `/pages/calendar/index` - 打卡日历
- `/pages/profile/index` - 个人中心

### 其他页面
- `/pages/login/index` - 登录页
- `/pages/plan-create/index` - 创建计划
- `/pages/plan-detail/index` - 计划详情
- `/pages/templates/index` - 推荐计划
- `/pages/checkin/index` - 每日打卡
- `/pages/achievements/index` - 成就勋章

---

## 安装和运行

```bash
# 安装依赖
pnpm install

# 代码检查
pnpm run lint

# 开发环境运行（微信小程序）
pnpm run dev:weapp

# 开发环境运行（H5）
pnpm run dev:h5

# 生产环境构建
pnpm run build:weapp
pnpm run build:h5
```

---

## 环境变量配置

在 `.env` 文件中配置以下变量：

```env
# 微信云开发环境ID（必填）
TARO_APP_CLOUD_ENV=cloud1-9gu9ppxt5c82bbc1

# 应用配置（可选）
TARO_APP_NAME=坚持喵
TARO_APP_APP_ID=app-7nmudrc1tudd
```

> 提示：可以复制 `.env.example` 文件为 `.env` 并修改配置

---

## 功能特性

### 1. 用户认证
- 使用微信授权登录
- 通过云函数处理用户认证
- 首位注册用户自动成为管理员
- 全局 AuthProvider 保护路由

### 2. 计划管理
- 创建自定义计划（7-365天）
- 使用推荐计划模板快速开始
- 计划状态管理（进行中/已暂停/已完成）
- 计划详情展示（进度、统计、打卡记录）

### 3. 打卡功能
- 每日打卡记录
- 心情选择（开心/一般/低落）
- 文字记录（最多500字）
- 图片上传（最多3张，单张1MB）
- 自动压缩图片

### 4. 数据统计
- 已坚持天数
- 连续打卡天数
- 完成率百分比
- 剩余天数
- 月度统计

### 5. 成就系统
- 7天成就 🥉
- 21天成就 🥈
- 50天成就 🥇
- 100天成就 👑
- 自动解锁成就

### 6. 日历视图
- 月历展示打卡记录
- 不同颜色标识状态
- 月度统计数据
- 左右切换月份

---

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 使用 Biome 进行代码格式化
- 使用语义化颜色 token
- 禁止直接使用 Tailwind 颜色类

### 组件规范
- 使用 Taro 组件（View, Text, Button 等）
- 使用 React Hooks
- 使用 useCallback 包装 useEffect 依赖函数
- 使用 useDidShow 刷新页面数据

### 数据库规范
- 所有查询使用 `.maybeSingle()` 而非 `.single()`
- 所有查询使用 `.order().limit()` 而非单独 `.limit()`
- 返回数据使用 `Array.isArray(data) ? data : []` 保护
- 字段访问使用可选链 `?.` 和空值合并 `||`

---

## 项目亮点

1. **完整的用户体系**：认证、权限、个人信息管理
2. **丰富的计划模板**：10+ 精选计划，覆盖多个领域
3. **直观的数据可视化**：日历视图、进度条、统计图表
4. **完善的激励机制**：成就勋章、等级积分、激励语
5. **优秀的用户体验**：流畅动画、响应式设计、友好提示
6. **安全的数据管理**：RLS 策略、数据加密、权限控制
7. **可扩展的架构**：模块化设计、类型安全、易于维护

---

## 后续优化方向

- [ ] 添加社交功能（好友、分享、排行榜）
- [ ] 添加提醒功能（订阅消息、定时提醒）
- [ ] 添加数据导出功能
- [ ] 添加主题切换功能
- [ ] 添加多语言支持
- [ ] 优化性能和加载速度
- [ ] 添加更多计划模板
- [ ] 添加数据分析和报表

---

## 许可证

MIT License

---

## 联系方式

如有问题或建议，欢迎反馈。
