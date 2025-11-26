import Taro from '@tarojs/taro'

export interface UploadFileInput {
  path: string
  size: number
  name?: string
  originalFileObj?: File
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

const MAX_FILE_SIZE = 1024 * 1024 * 5 // 5MB

function generateFileName(originalPath: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const ext = originalPath.split('.').pop() || 'jpg'
  return `checkin_images/${timestamp}_${random}.${ext}`
}

async function compressImage(filePath: string): Promise<string> {
  try {
    const result = await Taro.compressImage({
      src: filePath,
      quality: 80
    })
    return result.tempFilePath
  } catch (error) {
    console.error('图片压缩失败:', error)
    return filePath
  }
}

/**
 * 上传图片到云存储
 */
export async function uploadImage(file: UploadFileInput): Promise<UploadResult> {
  try {
    let filePath = file.path

    // 如果文件太大，先压缩
    if (file.size > MAX_FILE_SIZE) {
      filePath = await compressImage(file.path)
    }

    const fileName = file.name || generateFileName(filePath)
    const cloudPath = fileName

    // 上传到云存储
    const uploadResult = await Taro.cloud.uploadFile({
      cloudPath,
      filePath
      // 注意：不需要指定 env，会自动使用已初始化的环境
    })

    if (!uploadResult.fileID) {
      return {
        success: false,
        error: '上传失败，未返回文件ID'
      }
    }

    // 获取文件下载链接
    const downloadResult = await Taro.cloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    })

    const url = downloadResult.fileList[0]?.tempFileURL || uploadResult.fileID

    return {
      success: true,
      url
    }
  } catch (error: any) {
    console.error('上传图片异常:', error)
    return {
      success: false,
      error: error.message || '上传失败'
    }
  }
}

/**
 * 批量上传图片
 */
export async function uploadMultipleImages(files: UploadFileInput[]): Promise<string[]> {
  const results = await Promise.all(files.map((file) => uploadImage(file)))
  return results.filter((r) => r.success).map((r) => r.url!)
}

/**
 * 将云存储路径转换为临时链接（用于在 Image 组件中显示）
 * 微信小程序中 Image 组件不能直接使用 cloud:// 路径，需要先获取临时链接
 */
export async function convertCloudPathToTempURL(cloudPath: string | null | undefined): Promise<string | null> {
  if (!cloudPath) {
    return null
  }

  // 如果不是 cloud:// 格式，直接返回
  if (!cloudPath.startsWith('cloud://')) {
    return cloudPath
  }

  try {
    // 确保在微信小程序环境中
    if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) {
      console.log('非小程序环境，跳过路径转换:', cloudPath)
      return cloudPath
    }

    // 确保云开发已初始化
    if (!Taro.cloud) {
      console.warn('云开发未初始化，无法转换云存储路径:', cloudPath)
      return cloudPath
    }

    console.log('正在转换云存储路径为临时链接:', cloudPath)

    // 获取临时链接
    const result = await Taro.cloud.getTempFileURL({
      fileList: [cloudPath]
    })

    console.log('getTempFileURL 返回结果:', result)

    if (result.fileList && result.fileList.length > 0) {
      const fileItem = result.fileList[0] as any
      
      // 检查是否有错误码
      if (fileItem.code) {
        if (fileItem.code === 'SUCCESS') {
          if (fileItem.tempFileURL) {
            console.log('✅ 成功获取临时链接:', fileItem.tempFileURL)
            return fileItem.tempFileURL
          } else {
            console.warn('⚠️ 获取临时链接成功但 URL 为空，路径:', cloudPath)
          }
        } else {
          console.error('❌ 获取临时链接失败:', {
            code: fileItem.code,
            errMsg: fileItem.errMsg,
            path: cloudPath
          })
          return null
        }
      } else if (fileItem.tempFileURL) {
        // 如果没有 code 字段但有 tempFileURL，也认为成功
        console.log('✅ 成功获取临时链接（无 code 字段）:', fileItem.tempFileURL)
        return fileItem.tempFileURL
      }
    }

    console.warn('⚠️ 获取临时链接失败，返回原路径:', cloudPath)
    return cloudPath
  } catch (error: any) {
    console.error('❌ 转换云存储路径异常:', {
      error: error.message || error,
      errCode: error.errCode,
      errMsg: error.errMsg,
      path: cloudPath
    })
    return cloudPath
  }
}

/**
 * 通过文件名从云存储获取完整的 File ID
 * 使用云数据库存储的完整 File ID，或通过云函数获取
 */
async function getCloudFileIDByPath(cloudPath: string): Promise<string | null> {
  try {
    // 从路径中提取目录和文件名
    // cloud://env-id/path/to/file.png -> path/to/file.png
    const pathMatch = cloudPath.match(/^cloud:\/\/[^/]+\/(.+)$/)
    if (!pathMatch) {
      console.warn('无法解析路径:', cloudPath)
      return null
    }

    const relativePath = pathMatch[1]
    const pathParts = relativePath.split('/')
    const fileName = pathParts[pathParts.length - 1]
    const dirPath = pathParts.slice(0, -1).join('/')

    console.log('🔍 查找文件:', {dirPath, fileName, relativePath})

    // 尝试通过云函数获取文件列表（如果云函数支持）
    // 或者尝试不同的路径格式
    // 由于 getFileList API 可能不可用，我们尝试直接构造可能的完整路径
    
    // 从截图看，完整路径格式可能是：
    // cloud://env-id.xxx-env-id-xxx/path/to/file.png
    // 但中间的 xxx 部分我们无法直接获取
    
    // 方案：尝试通过云函数调用获取文件列表
    try {
      const result = await Taro.cloud.callFunction({
        name: 'getCloudFileList',
        data: {
          prefix: dirPath ? `${dirPath}/` : '',
          fileName: fileName
        }
      })
      
      const resultData = result.result as any
      if (resultData && resultData.fileID) {
        console.log('✅ 通过云函数找到文件:', resultData.fileID)
        return resultData.fileID
      }
    } catch (funcError) {
      console.log('ℹ️ 云函数 getCloudFileList 不存在或失败，尝试其他方法')
    }

    // 如果云函数不可用，返回 null，让调用方处理
    console.warn('⚠️ 无法获取完整 File ID，需要手动配置或使用云函数')
    return null
  } catch (error: any) {
    console.error('❌ 获取文件 ID 失败:', error)
    return null
  }
}

/**
 * 批量转换云存储路径为临时链接
 */
export async function convertCloudPathsToTempURLs(
  cloudPaths: (string | null | undefined)[]
): Promise<(string | null)[]> {
  console.log('🔄 开始批量转换云存储路径，数量:', cloudPaths.length)
  
  if (cloudPaths.length === 0) {
    return []
  }
  
  // 过滤出需要转换的路径
  const needConvert = cloudPaths.filter((path) => path && path.startsWith('cloud://'))
  console.log('📝 需要转换的路径:', needConvert)
  
  if (needConvert.length === 0) {
    console.log('ℹ️ 没有需要转换的路径')
    return cloudPaths as (string | null)[]
  }

  try {
    // 检查环境
    const env = Taro.getEnv()
    console.log('🌍 当前环境:', env === Taro.ENV_TYPE.WEAPP ? '微信小程序' : '其他')
    
    if (env !== Taro.ENV_TYPE.WEAPP) {
      console.warn('⚠️ 非微信小程序环境，跳过转换')
      return cloudPaths as (string | null)[]
    }

    // 检查云开发是否初始化
    if (!Taro.cloud) {
      console.error('❌ 云开发未初始化，无法转换路径')
      return cloudPaths as (string | null)[]
    }

    // 先尝试直接使用原路径获取临时链接
    console.log('📞 第一次尝试：使用原路径调用 getTempFileURL')
    let result = await Taro.cloud.getTempFileURL({
      fileList: needConvert
    })

    console.log('📥 getTempFileURL 返回结果:', result)

    // 检查是否有文件不存在
    const failedPaths: string[] = []
    const successMap = new Map<string, string>()

    if (result.fileList) {
      result.fileList.forEach((item: any, index: number) => {
        const originalPath = needConvert[index]
        if (item.errMsg === 'STORAGE_FILE_NONEXIST' || (!item.tempFileURL && item.errMsg)) {
          console.warn('⚠️ 文件不存在，需要查找完整 File ID:', originalPath, item.errMsg)
          failedPaths.push(originalPath)
        } else if (item.tempFileURL) {
          successMap.set(originalPath, item.tempFileURL)
          console.log('✅ 成功转换:', originalPath, '->', item.tempFileURL)
        }
      })
    }

    // 对于失败的文件，尝试通过文件名查找完整的 File ID
    if (failedPaths.length > 0) {
      console.log('🔍 开始查找失败文件的完整 File ID，数量:', failedPaths.length)
      
      const fileIDMap = new Map<string, string>()
      
      // 并行查找所有失败文件的完整 File ID
      const fileIDPromises = failedPaths.map(async (path) => {
        const fileID = await getCloudFileIDByPath(path)
        if (fileID) {
          fileIDMap.set(path, fileID)
        }
        return {path, fileID}
      })

      await Promise.all(fileIDPromises)

      console.log('📋 找到的完整 File ID 映射:', Array.from(fileIDMap.entries()))

      // 使用完整的 File ID 再次获取临时链接
      if (fileIDMap.size > 0) {
        const fullFileIDs = Array.from(fileIDMap.values())
        console.log('📞 第二次尝试：使用完整 File ID 调用 getTempFileURL')
        
        const retryResult = await Taro.cloud.getTempFileURL({
          fileList: fullFileIDs
        })

        console.log('📥 第二次 getTempFileURL 返回结果:', retryResult)

        if (retryResult.fileList) {
          let fileIDIndex = 0
          fileIDMap.forEach((_fileID, originalPath) => {
            const item = retryResult.fileList[fileIDIndex++]
            if (item && item.tempFileURL) {
              successMap.set(originalPath, item.tempFileURL)
              console.log('✅ 成功转换（使用完整 File ID）:', originalPath, '->', item.tempFileURL)
            } else {
              console.error('❌ 使用完整 File ID 仍然失败:', originalPath, item)
            }
          })
        }
      }
    }

    // 转换所有路径
    const converted = cloudPaths.map((path) => {
      if (!path || !path.startsWith('cloud://')) {
        return path
      }
      const tempURL = successMap.get(path)
      if (tempURL) {
        return tempURL
      }
      console.warn('⚠️ 未找到转换后的链接，返回 null:', path)
      return null
    })
    
    console.log('✅ 批量转换完成，结果:', converted)
    return converted
  } catch (error: any) {
    console.error('❌ 批量转换云存储路径异常:', {
      error: error.message || error,
      errCode: error.errCode,
      errMsg: error.errMsg,
      stack: error.stack
    })
    return cloudPaths as (string | null)[]
  }
}

