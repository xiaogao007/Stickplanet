#!/usr/bin/env node

/**
 * 云函数一键部署脚本 (Node.js 版本)
 * 使用方法: node scripts/deploy-cloudfunctions.js
 * 或: npm run deploy:cloudfunctions
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const CLOUDFUNCTIONS_DIR = path.join(__dirname, '../cloudfunctions')
const CLOUD_ENV_ID = 'cloud1-9gu9ppxt5c82bbc1'

const FUNCTIONS = [
  'wechatLogin',
  'getProfile',
  'getUserPlans',
  'getTemplates',
  'getPlanById',
  'createPlan',
  'createCheckIn',
  'getCheckInsByPlan',
  'getUserCheckInsForMonth',
  'getUserAchievements'
]

function execCommand(command, cwd = process.cwd()) {
  try {
    console.log(`执行: ${command}`)
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    })
    return true
  } catch (error) {
    console.error(`执行失败: ${command}`)
    return false
  }
}

function checkCloudbaseCLI() {
  try {
    execSync('cloudbase --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function checkLogin() {
  try {
    // 尝试执行一个简单的命令来检查是否已登录
    execSync('cloudbase env:list', { stdio: 'ignore', encoding: 'utf8' })
    return true
  } catch {
    return false
  }
}

function deployFunction(funcName) {
  const funcPath = path.join(CLOUDFUNCTIONS_DIR, funcName)
  
  if (!fs.existsSync(funcPath)) {
    console.log(`⚠️  跳过: ${funcName} (目录不存在)`)
    return false
  }
  
  const packageJsonPath = path.join(funcPath, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  警告: ${funcName}/package.json 不存在，跳过`)
    return false
  }
  
  console.log(`\n正在部署: ${funcName}`)
  console.log('----------------------------------------')
  
  // 安装依赖
  const nodeModulesPath = path.join(funcPath, 'node_modules')
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 正在安装依赖...')
    if (!execCommand('npm install', funcPath)) {
      console.error(`❌ ${funcName} 依赖安装失败`)
      return false
    }
  } else {
    console.log('📦 依赖已存在，跳过安装')
  }
  
  // 部署云函数
  console.log('🚀 正在部署到云端...')
  const cloudfunctionsDir = path.join(__dirname, '../cloudfunctions')
  
  // 优先使用配置文件（cloudbaserc.json），因为更可靠
  const cloudbasercPath = path.join(cloudfunctionsDir, 'cloudbaserc.json')
  let deployCommand
  
  if (fs.existsSync(cloudbasercPath)) {
    // 方法1: 使用配置文件（推荐）
    console.log('📋 使用配置文件部署...')
    deployCommand = `cloudbase functions:deploy ${funcName}`
  } else {
    // 方法2: 使用 -e 参数
    deployCommand = `cloudbase functions:deploy ${funcName} -e ${CLOUD_ENV_ID}`
  }
  
  // 从 cloudfunctions 目录执行
  if (!execCommand(deployCommand, cloudfunctionsDir)) {
    // 如果配置文件方式失败，尝试使用 -e 参数
    if (fs.existsSync(cloudbasercPath)) {
      console.log('⚠️  配置文件方式失败，尝试使用环境ID参数...')
      deployCommand = `cloudbase functions:deploy ${funcName} -e ${CLOUD_ENV_ID}`
      if (!execCommand(deployCommand, cloudfunctionsDir)) {
        console.error(`❌ ${funcName} 部署失败`)
        showDeployHelp(funcName)
        return false
      }
    } else {
      console.error(`❌ ${funcName} 部署失败`)
      showDeployHelp(funcName)
      return false
    }
  }
  
  console.log(`✅ ${funcName} 部署完成`)
  return true
}

function showDeployHelp(funcName) {
  console.log('\n💡 部署失败，请检查以下事项:')
  console.log('')
  console.log('1. 确保已登录 CloudBase CLI:')
  console.log('   cloudbase login')
  console.log('')
  console.log('2. 检查环境是否存在:')
  console.log('   cloudbase env:list')
  console.log('')
  console.log('3. 如果环境不存在，需要先创建云开发环境:')
  console.log('   📖 详细步骤请查看: docs/cloud-env-setup.md')
  console.log('   快速步骤:')
  console.log('   a) 在微信开发者工具中打开"云开发"控制台')
  console.log('   b) 点击"开通"或"创建环境"')
  console.log('   c) 记录创建后的环境ID')
  console.log('   d) 更新以下文件中的环境ID:')
  console.log('      - scripts/deploy-cloudfunctions.js (第14行)')
  console.log('      - cloudfunctions/cloudbaserc.json (第2行)')
  console.log('      - src/client/cloud.ts (第7行)')
  console.log('')
  console.log('4. 如果环境ID不同，请更新配置:')
  console.log('   当前配置的环境ID: ' + CLOUD_ENV_ID)
  console.log('   如果不同，请更新 scripts/deploy-cloudfunctions.js 和 cloudfunctions/cloudbaserc.json')
  console.log('')
  console.log('5. 尝试手动部署:')
  console.log(`   cd cloudfunctions`)
  console.log(`   cloudbase functions:deploy ${funcName}`)
  console.log('')
  console.log('6. 或使用微信开发者工具手动部署（推荐）:')
  console.log('   - 在微信开发者工具中右键点击 cloudfunctions/' + funcName)
  console.log('   - 选择"上传并部署：云端安装依赖"')
}

function main() {
  console.log('==========================================')
  console.log('开始部署云函数...')
  console.log('==========================================')
  
  // 检查 cloudfunctions 目录
  if (!fs.existsSync(CLOUDFUNCTIONS_DIR)) {
    console.error('错误: cloudfunctions 目录不存在')
    process.exit(1)
  }
  
  // 检查 cloudbase-cli
  if (!checkCloudbaseCLI()) {
    console.error('\n❌ 未检测到 cloudbase-cli')
    console.log('\n请先安装:')
    console.log('  npm install -g @cloudbase/cli')
    console.log('\n或者使用微信开发者工具手动部署：')
    console.log('1. 在微信开发者工具中打开项目')
    console.log('2. 右键点击 cloudfunctions/wechatLogin 目录')
    console.log('3. 选择"上传并部署：云端安装依赖"')
    console.log('4. 重复上述步骤部署其他云函数')
    process.exit(1)
  }
  
  // 检查是否已登录
  console.log('🔐 检查登录状态...')
  if (!checkLogin()) {
    console.error('\n❌ 未登录 CloudBase CLI')
    console.log('\n请先登录:')
    console.log('  cloudbase login')
    console.log('\n登录后，请重新运行此脚本')
    process.exit(1)
  }
  console.log('✅ 已登录')
  
  // 检查环境是否存在
  console.log('🔍 检查云开发环境...')
  try {
    const envListOutput = execSync('cloudbase env:list', { 
      encoding: 'utf8',
      stdio: 'pipe'
    })
    const envIdPattern = new RegExp(CLOUD_ENV_ID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    if (!envIdPattern.test(envListOutput)) {
      console.warn(`⚠️  警告: 环境 ${CLOUD_ENV_ID} 未在环境列表中找到`)
      console.log('\n可能的原因:')
      console.log('1. 环境尚未创建')
      console.log('2. 环境ID配置错误')
      console.log('\n解决方案:')
      console.log('📖 查看详细指南: docs/cloud-env-setup.md')
      console.log('快速步骤:')
      console.log('1. 在微信开发者工具中打开"云开发"控制台')
      console.log('2. 创建云开发环境（如果还没有）')
      console.log('3. 复制环境ID并更新配置文件')
      console.log('\n当前配置的环境ID: ' + CLOUD_ENV_ID)
      console.log('\n是否继续部署？(可能会失败)')
      console.log('建议：先创建环境后再部署')
    } else {
      console.log(`✅ 环境 ${CLOUD_ENV_ID} 已找到`)
    }
  } catch (error) {
    console.warn('⚠️  无法检查环境列表，继续部署...')
  }
  
  // 部署所有云函数
  let successCount = 0
  let failCount = 0
  
  for (const func of FUNCTIONS) {
    if (deployFunction(func)) {
      successCount++
    } else {
      failCount++
    }
  }
  
  console.log('\n==========================================')
  console.log('部署完成！')
  console.log(`成功: ${successCount} 个`)
  console.log(`失败: ${failCount} 个`)
  console.log('==========================================')
  
  if (failCount > 0) {
    process.exit(1)
  }
}

main()

