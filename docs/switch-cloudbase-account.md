# CloudBase CLI 账号切换指南

当 CLI 登录的账号与创建环境的账号不一致时，需要切换账号。

## 问题症状

- `cloudbase env:list` 看不到新创建的环境
- 部署时提示 "Environment not found"
- 环境ID 在微信开发者工具中存在，但 CLI 中找不到

## 解决步骤

### 1. 退出当前账号

```bash
cloudbase logout
```

或者使用简写：

```bash
tcb logout
```

### 2. 使用正确的账号重新登录

确保使用与创建云环境相同的微信/腾讯云账号登录：

```bash
cloudbase login
```

或者使用简写：

```bash
tcb login
```

登录过程：
1. 会打开浏览器或显示二维码
2. 使用微信扫码登录
3. 确认授权
4. 登录成功后，CLI 会显示登录信息

### 3. 验证登录状态

查看当前登录的账号信息：

```bash
cloudbase login:list
```

或者：

```bash
tcb login:list
```

确保显示的账号信息与创建云环境的账号一致。

### 4. 检查环境列表

确认登录后，查看可用的云环境列表：

```bash
cloudbase env:list
```

或者使用新命令：

```bash
tcb env list
```

现在应该能看到新创建的环境 `cloud1-9gu9ppxt5c82bbc1`。

### 5. 验证环境信息

查看环境详情：

```bash
cloudbase env:info -e cloud1-9gu9ppxt5c82bbc1
```

或者：

```bash
tcb env info -e cloud1-9gu9ppxt5c82bbc1
```

### 6. 重新部署云函数

如果环境已正确识别，可以重新运行部署：

```bash
npm run deploy:cloudfunctions
```

## 常见问题

### Q1: 登录后仍然看不到环境

**可能原因**：
- 环境是在不同的微信账号下创建的
- 环境创建失败或未完成
- 账号权限不足

**解决方案**：
1. 确认在微信开发者工具中，环境确实存在且状态为"正常"
2. 确认登录的账号与创建环境的账号是同一个
3. 尝试在微信开发者工具中直接部署（推荐）

### Q2: 如何确认账号是否一致？

**方法一：查看微信开发者工具**
- 打开微信开发者工具
- 查看右上角登录的微信账号
- 在云开发控制台查看环境信息

**方法二：查看 CLI 登录信息**
```bash
cloudbase login:list
```

### Q3: 可以同时登录多个账号吗？

CloudBase CLI 通常只支持一个登录会话。如果需要切换账号，需要先退出当前账号。

### Q4: 登录失败怎么办？

**检查**：
1. 网络连接是否正常
2. 微信账号是否已认证开发者
3. 是否已开通云开发服务

**解决**：
- 检查网络代理设置
- 尝试使用不同的网络
- 联系腾讯云客服

## 快速命令参考

```bash
# 退出登录
cloudbase logout

# 重新登录
cloudbase login

# 查看登录信息
cloudbase login:list

# 查看环境列表
cloudbase env:list

# 查看环境详情
cloudbase env:info -e <环境ID>

# 部署云函数
npm run deploy:cloudfunctions
```

## 推荐方案

如果账号切换后仍然无法识别环境，**强烈建议使用微信开发者工具直接部署**：

1. 在微信开发者工具中打开项目
2. 右键点击 `cloudfunctions` 目录下的云函数
3. 选择"上传并部署：云端安装依赖"

这种方式不依赖 CLI 的环境同步，更稳定可靠。

详细步骤请参考：[使用微信开发者工具部署云函数](./deploy-via-wechat-tool.md)

