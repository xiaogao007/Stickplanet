#!/bin/bash

# 云函数一键部署脚本
# 使用方法: ./scripts/deploy-cloudfunctions.sh

set -e

CLOUDFUNCTIONS_DIR="cloudfunctions"
FUNCTIONS=(
  "wechatLogin"
  "getProfile"
  "getUserPlans"
  "getTemplates"
  "getPlanById"
  "createPlan"
  "createCheckIn"
  "getCheckInsByPlan"
  "getUserCheckInsForMonth"
  "getUserAchievements"
)

echo "=========================================="
echo "开始部署云函数..."
echo "=========================================="

# 检查 cloudfunctions 目录是否存在
if [ ! -d "$CLOUDFUNCTIONS_DIR" ]; then
  echo "错误: cloudfunctions 目录不存在"
  exit 1
fi

# 检查是否安装了 cloudbase-cli
if ! command -v cloudbase &> /dev/null; then
  echo "警告: 未检测到 cloudbase-cli"
  echo "请先安装: npm install -g @cloudbase/cli"
  echo ""
  echo "或者使用微信开发者工具手动部署："
  echo "1. 在微信开发者工具中打开项目"
  echo "2. 右键点击 cloudfunctions/wechatLogin 目录"
  echo "3. 选择'上传并部署：云端安装依赖'"
  echo "4. 重复上述步骤部署其他云函数"
  exit 1
fi

# 部署每个云函数
for func in "${FUNCTIONS[@]}"; do
  func_path="$CLOUDFUNCTIONS_DIR/$func"
  
  if [ ! -d "$func_path" ]; then
    echo "⚠️  跳过: $func (目录不存在)"
    continue
  fi
  
  echo ""
  echo "正在部署: $func"
  echo "----------------------------------------"
  
  cd "$func_path"
  
  # 检查 package.json 是否存在
  if [ ! -f "package.json" ]; then
    echo "⚠️  警告: $func/package.json 不存在，跳过"
    cd ../..
    continue
  fi
  
  # 安装依赖
  if [ -d "node_modules" ]; then
    echo "📦 依赖已存在，跳过安装"
  else
    echo "📦 正在安装依赖..."
    npm install
  fi
  
  # 部署云函数
  echo "🚀 正在部署到云端..."
  cloudbase functions:deploy "$func" --env cloud1-9gu9ppxt5c82bbc1
  
  cd ../..
  
  echo "✅ $func 部署完成"
done

echo ""
echo "=========================================="
echo "所有云函数部署完成！"
echo "=========================================="

