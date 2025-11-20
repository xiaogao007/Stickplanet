# 微信云开发迁移指南

本项目已从 Supabase 迁移到微信云开发。

## 主要变更

### 1. 后端服务
- **之前**: 使用 Supabase 作为后端服务
- **现在**: 使用微信云开发（云函数 + 云数据库 + 云存储）

### 2. 认证方式
- **之前**: 使用 `miaoda-auth-taro` 和 Supabase Auth
- **现在**: 使用微信授权登录，通过云函数处理

### 3. 数据库操作
- **之前**: 直接调用 Supabase API
- **现在**: 通过云函数调用云数据库

### 4. 文件上传
- **之前**: 上传到 Supabase Storage
- **现在**: 上传到微信云存储

## 配置步骤

### 1. 配置云开发环境

在微信开发者工具中：
1. 打开"云开发"控制台
2. 创建云开发环境（如果还没有）
3. 记录环境ID

### 2. 配置环境变量

在项目根目录创建或更新 `.env` 文件：

```env
# 云开发环境ID（必填）
TARO_APP_CLOUD_ENV=cloud1-9gu9ppxt5c82bbc1

# 其他配置（可选）
TARO_APP_NAME=坚持喵
TARO_APP_APP_ID=app-7nmudrc1tudd
```

### 3. 部署云函数

1. 在微信开发者工具中，右键点击 `cloudfunctions` 目录
2. 选择"上传并部署：云端安装依赖"
3. 等待所有云函数部署完成

### 4. 创建云数据库集合

在云开发控制台的"数据库"中创建以下集合：

#### profiles（用户资料）
- `_id`: String（自动生成）
- `_openid`: String（自动生成）
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

#### plans（计划）
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
- `status`: String
- `is_template`: Boolean
- `template_category`: String
- `cover_image`: String
- `created_at`: Date
- `updated_at`: Date

#### check_ins（打卡记录）
- `_id`: String（自动生成）
- `plan_id`: String
- `user_id`: String
- `check_date`: String
- `completed`: Boolean
- `note`: String
- `images`: Array
- `mood`: String
- `is_makeup`: Boolean
- `created_at`: Date

#### achievements（成就）
- `_id`: String（自动生成）
- `user_id`: String
- `plan_id`: String
- `type`: String
- `title`: String
- `description`: String
- `icon`: String
- `achieved_at`: Date

### 5. 配置数据库权限

为每个集合设置权限：
- **读取权限**: 仅创建者可读
- **写入权限**: 仅创建者可写

### 6. 初始化模板数据

可以通过云函数或直接在数据库中插入推荐计划模板数据。

## 代码变更说明

### API 调用变更

**之前**:
```typescript
import {planApi} from '@/db/api'
```

**现在**:
```typescript
import {planApi} from '@/db/cloudApi'
```

### 认证 Hook 变更

**之前**:
```typescript
import {useAuth} from 'miaoda-auth-taro'
```

**现在**:
```typescript
import {useAuth} from '@/hooks/useAuth'
```

### 上传功能变更

**之前**:
```typescript
import {uploadImage} from '@/utils/upload'
```

**现在**:
```typescript
import {uploadImage} from '@/utils/cloudUpload'
```

## 注意事项

1. **环境ID配置**: 确保在 `.env` 文件中正确配置 `TARO_APP_CLOUD_ENV`
2. **云函数部署**: 所有云函数都需要部署后才能使用
3. **数据库索引**: 建议为常用查询字段创建索引以提高性能
4. **权限设置**: 确保数据库权限设置正确，防止数据泄露
5. **云存储**: 图片上传需要配置云存储权限

## 故障排查

### 云函数调用失败
- 检查云函数是否已部署
- 检查环境ID是否正确
- 查看云函数日志

### 数据库操作失败
- 检查数据库集合是否已创建
- 检查数据库权限设置
- 查看云函数日志

### 图片上传失败
- 检查云存储是否已开通
- 检查云存储权限设置
- 检查文件大小限制

## 后续优化建议

1. 添加数据库索引优化查询性能
2. 实现数据缓存减少云函数调用
3. 添加错误重试机制
4. 实现数据分页加载
5. 添加数据备份机制

