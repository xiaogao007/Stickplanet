// 此文件已迁移到 cloudUpload.ts，保留此文件以保持向后兼容
// 请使用 @/utils/cloudUpload 替代
export * from './cloudUpload'
export type {UploadFileInput, UploadResult} from './cloudUpload'

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

const BUCKET_NAME = 'app-7nmudrc1tudd_checkin_images'
const MAX_FILE_SIZE = 1024 * 1024

function generateFileName(originalPath: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const ext = originalPath.split('.').pop() || 'jpg'
  return `${timestamp}_${random}.${ext}`
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

export async function uploadImage(file: UploadFileInput): Promise<UploadResult> {
  try {
    if (file.size > MAX_FILE_SIZE) {
      const compressedPath = await compressImage(file.path)
      file.path = compressedPath
    }

    const fileName = file.name || generateFileName(file.path)
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')

    const fileContent = file.originalFileObj || ({tempFilePath: file.path} as any)

    const {data, error} = await supabase.storage.from(BUCKET_NAME).upload(sanitizedFileName, fileContent, {
      cacheControl: '3600',
      upsert: false
    })

    if (error) {
      console.error('上传图片失败:', error)
      return {success: false, error: error.message}
    }

    const {data: urlData} = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('上传图片异常:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    }
  }
}

export async function uploadMultipleImages(files: UploadFileInput[]): Promise<string[]> {
  const results = await Promise.all(files.map((file) => uploadImage(file)))
  return results.filter((r) => r.success).map((r) => r.url!)
}
