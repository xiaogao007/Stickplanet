#!/usr/bin/env node

/**
 * 清理 dist 目录中的 source map 文件和其他不必要的文件
 */

const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '../dist')

function deleteFiles(dir, pattern) {
  if (!fs.existsSync(dir)) {
    return
  }

  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      deleteFiles(filePath, pattern)
    } else if (pattern.test(file)) {
      console.log(`删除: ${filePath}`)
      fs.unlinkSync(filePath)
    }
  })
}

console.log('开始清理 dist 目录...')

// 删除所有 .map 文件
deleteFiles(distDir, /\.map$/)

console.log('清理完成！')

