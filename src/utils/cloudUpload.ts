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

