# 微信云开发云函数

本目录包含所有云函数，用于处理小程序的后端逻辑。

## 云函数列表

### 认证相关
- `wechatLogin` - 微信授权登录

### 用户相关
- `getProfile` - 获取用户资料
- `updateProfile` - 更新用户资料
- `getAllProfiles` - 获取所有用户（管理员）

### 计划相关
- `getTemplates` - 获取推荐计划模板
- `getUserPlans` - 获取用户计划列表（包含统计信息）
- `getPlanById` - 获取计划详情
- `createPlan` - 创建计划
- `updatePlan` - 更新计划
- `deletePlan` - 删除计划
- `getPlanStats` - 获取计划统计信息

### 打卡相关
- `getCheckInsByPlan` - 获取计划的打卡记录
- `getCheckInByDate` - 获取指定日期的打卡记录
- `createCheckIn` - 创建打卡记录
- `updateCheckIn` - 更新打卡记录
- `getUserCheckInsForMonth` - 获取用户月度打卡记录

### 成就相关
- `getUserAchievements` - 获取用户成就列表
- `createAchievement` - 创建成就
- `checkAndCreateAchievement` - 检查并创建成就

## 部署说明

1. 在微信开发者工具中，右键点击 `cloudfunctions` 目录
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

## 数据库集合

需要在云数据库中创建以下集合：

- `profiles` - 用户资料
- `plans` - 计划
- `check_ins` - 打卡记录
- `achievements` - 成就

## 环境变量

在云函数中，环境ID通过 `cloud.DYNAMIC_CURRENT_ENV` 自动获取。

