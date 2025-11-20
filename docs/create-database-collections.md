# 创建云数据库集合指南

## 错误信息

```
database collection not exists -502005
```

这个错误表示数据库集合不存在，需要先创建集合。

## 需要创建的集合

根据项目需求，需要创建以下数据库集合：

1. **profiles** - 用户资料（必需，用于登录）
2. **plans** - 计划（必需）
3. **check_ins** - 打卡记录（必需）
4. **achievements** - 成就（可选）

## 创建步骤

### 第一步：打开云开发控制台

1. 在微信开发者工具中，点击工具栏上的"云开发"按钮
2. 确认当前环境为 `cloud1-9gu9ppxt5c82bbc1`
3. 点击"数据库"标签

### 第二步：创建 profiles 集合（用户资料）

这是**最紧急**的，因为登录功能需要它。

1. **点击"添加集合"**
   - 集合名称：`profiles`
   - 权限设置：选择"仅创建者可读写"（推荐）
   - 点击"确定"

2. **添加字段（可选，系统会自动创建）**
   - `_id`: String（自动生成，无需手动添加）
   - `_openid`: String（自动生成，无需手动添加）
   - `nickname`: String
   - `avatar_url`: String
   - `phone`: String（可选）
   - `email`: String（可选）
   - `role`: String（'user' 或 'admin'）
   - `total_days`: Number
   - `level`: Number
   - `points`: Number
   - `created_at`: Date
   - `updated_at`: Date

   > **注意**：字段可以在首次插入数据时自动创建，不需要预先定义。

3. **设置权限（重要）**
   - 点击集合名称进入集合详情
   - 点击"权限设置"
   - 建议设置：
     - **读取权限**：仅创建者可读
     - **写入权限**：仅创建者可写
   - 点击"保存"

### 第三步：创建 plans 集合（计划）

1. **点击"添加集合"**
   - 集合名称：`plans`
   - 权限设置：选择"仅创建者可读写"
   - 点击"确定"

2. **字段结构**（会在插入数据时自动创建）
   - `_id`: String（自动生成）
   - `user_id`: String
   - `name`: String
   - `description`: String
   - `start_date`: String
   - `end_date`: String
   - `total_days`: Number
   - `frequency`: String
   - `daily_target`: String
   - `reminder_enabled`: Boolean
   - `reminder_times`: Array
   - `motivation_text`: String
   - `status`: String（'active' | 'paused' | 'completed'）
   - `is_template`: Boolean
   - `template_category`: String（可选）
   - `cover_image`: String（可选）
   - `created_at`: Date
   - `updated_at`: Date

3. **设置权限**
   - 读取权限：仅创建者可读
   - 写入权限：仅创建者可写

### 第四步：创建 check_ins 集合（打卡记录）

1. **点击"添加集合"**
   - 集合名称：`check_ins`
   - 权限设置：选择"仅创建者可读写"
   - 点击"确定"

2. **字段结构**
   - `_id`: String（自动生成）
   - `plan_id`: String
   - `user_id`: String
   - `check_date`: String（格式：YYYY-MM-DD）
   - `completed`: Boolean
   - `note`: String（可选）
   - `images`: Array（可选，存储图片URL）
   - `mood`: String（可选）
   - `is_makeup`: Boolean（是否补卡）
   - `created_at`: Date

3. **设置权限**
   - 读取权限：仅创建者可读
   - 写入权限：仅创建者可写

### 第五步：创建 achievements 集合（成就，可选）

1. **点击"添加集合"**
   - 集合名称：`achievements`
   - 权限设置：选择"仅创建者可读写"
   - 点击"确定"

2. **字段结构**
   - `_id`: String（自动生成）
   - `user_id`: String
   - `plan_id`: String（可选）
   - `type`: String（成就类型，如 '7days', '21days', '50days', '100days'）
   - `title`: String
   - `description`: String
   - `icon`: String（可选，图标URL）
   - `achieved_at`: Date

3. **设置权限**
   - 读取权限：仅创建者可读
   - 写入权限：仅创建者可写

## 快速创建（最小配置）

如果只想快速测试登录功能，**至少需要创建 `profiles` 集合**：

1. 打开云开发控制台 → 数据库
2. 点击"添加集合"
3. 集合名称：`profiles`
4. 权限：仅创建者可读写
5. 点击"确定"

其他集合可以在需要时再创建。

## 权限设置说明

### 推荐权限配置

- **profiles**：仅创建者可读写
- **plans**：仅创建者可读写
- **check_ins**：仅创建者可读写
- **achievements**：仅创建者可读写

### 如果需要模板计划对所有人可见

如果 `plans` 集合中有模板计划（`is_template: true`），需要特殊处理：

1. 在云函数中查询模板计划时，使用管理员权限
2. 或者设置 `plans` 集合的读取权限为"所有用户可读，仅创建者可写"

## 验证集合创建

创建完成后，验证步骤：

1. **在云开发控制台**
   - 点击"数据库"标签
   - 确认所有集合都已创建
   - 确认集合状态为"正常"

2. **测试登录功能**
   - 重新编译项目
   - 尝试登录
   - 查看控制台是否还有错误

## 常见问题

### Q1: 创建集合后仍然报错

**可能原因**：
- 集合名称拼写错误
- 权限设置不正确
- 环境ID不匹配

**解决**：
1. 确认集合名称完全匹配（区分大小写）
2. 检查权限设置
3. 确认当前环境为 `cloud1-9gu9ppxt5c82bbc1`

### Q2: 如何批量创建集合？

**方法**：
- 目前微信开发者工具不支持批量创建
- 需要逐个创建集合
- 或者使用云函数脚本批量创建（高级用法）

### Q3: 字段是否需要预先定义？

**不需要**：
- 微信云数据库是 NoSQL 数据库
- 字段可以在插入数据时自动创建
- 但建议在文档中记录字段结构，便于维护

### Q4: 如何查看集合数据？

**方法**：
1. 在云开发控制台 → 数据库
2. 点击集合名称
3. 可以查看、添加、编辑、删除数据

## 相关文档

- [云开发迁移指南](./cloud-migration.md)
- [解决云函数调用失败](./fix-cloudfunction-call-error.md)
- [微信云开发数据库文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/database.html)

