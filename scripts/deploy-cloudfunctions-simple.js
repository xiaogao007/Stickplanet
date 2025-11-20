#!/usr/bin/env node

/**
 * 云函数一键部署脚本 (简化版 - 使用微信开发者工具)
 * 注意：此脚本仅用于提示，实际部署需要通过微信开发者工具
 */

const fs = require('fs')
const path = require('path')

const CLOUDFUNCTIONS_DIR = path.join(__dirname, '../cloudfunctions')

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

console.log('==========================================')
console.log('云函数部署指南')
console.log('==========================================')
console.log('')
console.log('由于 cloudbase CLI 的命令格式限制，')
console.log('建议使用微信开发者工具进行部署：')
console.log('')
console.log('方法一：使用微信开发者工具（推荐）')
console.log('----------------------------------------')
console.log('1. 在微信开发者工具中打开项目')
console.log('2. 在左侧文件树中找到 cloudfunctions 目录')
console.log('3. 右键点击每个云函数目录，选择"上传并部署：云端安装依赖"')
console.log('')
console.log('需要部署的云函数：')
FUNCTIONS.forEach((func, index) => {
  const funcPath = path.join(CLOUDFUNCTIONS_DIR, func)
  const exists = fs.existsSync(funcPath)
  console.log(`  ${index + 1}. ${func} ${exists ? '✅' : '❌ 目录不存在'}`)
})
console.log('')
console.log('方法二：使用 cloudbase CLI')
console.log('----------------------------------------')
console.log('1. 安装 CLI: npm install -g @cloudbase/cli')
console.log('2. 登录: cloudbase login')
console.log('3. 切换到 cloudfunctions 目录: cd cloudfunctions')
console.log('4. 部署单个函数: cloudbase functions:deploy <函数名> -e cloud1-9gu9ppxt5c82bbc1')
console.log('')
console.log('例如：')
console.log('  cd cloudfunctions')
console.log('  cloudbase functions:deploy wechatLogin -e cloud1-9gu9ppxt5c82bbc1')
console.log('')
console.log('==========================================')

