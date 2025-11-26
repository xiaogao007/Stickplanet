#!/usr/bin/env node

/**
 * 部署 getTemplates 云函数脚本
 * 使用方法: node scripts/deploy-getTemplates.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const CLOUDFUNCTIONS_DIR = path.join(__dirname, '../cloudfunctions')
const CLOUD_ENV_ID = 'cloud1-9gu9ppxt5c82bbc1'
const FUNC_NAME = 'getTemplates'

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

function main() {
  console.log('==========================================')
  console.log(`开始部署云函数: ${FUNC_NAME}`)
  console.log('==========================================\n')
  
  const funcPath = path.join(CLOUDFUNCTIONS_DIR, FUNC_NAME)
  
  if (!fs.existsSync(funcPath)) {
    console.error(`❌ 错误: ${funcPath} 目录不存在`)
    process.exit(1)
  }
  
  // 安装依赖
  console.log('📦 正在安装依赖...')
  if (!execCommand('npm install', funcPath)) {
    console.error(`❌ ${FUNC_NAME} 依赖安装失败`)
    process.exit(1)
  }
  
  // 部署云函数
  console.log('\n🚀 正在部署到云端...')
  const cloudbasercPath = path.join(CLOUDFUNCTIONS_DIR, 'cloudbaserc.json')
  let deployCommand
  
  // 使用新的命令格式 tcb fn deploy，并添加 --yes 自动确认
  if (fs.existsSync(cloudbasercPath)) {
    deployCommand = `tcb fn deploy ${FUNC_NAME} --yes`
  } else {
    deployCommand = `tcb fn deploy ${FUNC_NAME} -e ${CLOUD_ENV_ID} --yes`
  }
  
  // 如果新命令失败，尝试旧命令
  if (!execCommand(deployCommand, CLOUDFUNCTIONS_DIR)) {
    console.log('\n⚠️  新命令失败，尝试使用旧命令格式...')
    if (fs.existsSync(cloudbasercPath)) {
      deployCommand = `echo y | cloudbase functions:deploy ${FUNC_NAME}`
    } else {
      deployCommand = `echo y | cloudbase functions:deploy ${FUNC_NAME} -e ${CLOUD_ENV_ID}`
    }
    
    if (!execCommand(deployCommand, CLOUDFUNCTIONS_DIR)) {
      console.error(`❌ ${FUNC_NAME} 部署失败`)
      console.log('\n💡 提示: 如果部署失败，可以尝试在微信开发者工具中手动部署:')
      console.log(`   1. 右键点击 cloudfunctions/${FUNC_NAME} 目录`)
      console.log('   2. 选择"上传并部署：云端安装依赖"')
      process.exit(1)
    }
  }
  
  console.log(`\n✅ ${FUNC_NAME} 部署成功！`)
}

main()

