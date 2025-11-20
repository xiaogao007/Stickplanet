import Taro from '@tarojs/taro'

let cloudInitialized = false

// 云开发环境ID（在构建时会被替换，或使用默认值）
// 注意：小程序运行时无法访问 process.env，所以使用常量
const CLOUD_ENV_ID = 'cloud1-9gu9ppxt5c82bbc1'

/**
 * 初始化微信云开发
 */
export function initCloud() {
  try {
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      if (!Taro.cloud) {
        console.error('云开发未启用，请在微信开发者工具中开通云开发')
        console.error('步骤：1. 点击工具栏"云开发"按钮 2. 开通云开发 3. 创建环境')
        return
      }
      
      if (!cloudInitialized) {
        console.log('正在初始化云开发，环境ID:', CLOUD_ENV_ID)
        Taro.cloud.init({
          env: CLOUD_ENV_ID,
          traceUser: true
        })
        cloudInitialized = true
        console.log('✅ 云开发初始化成功，环境ID:', CLOUD_ENV_ID)
        
        // 验证初始化是否成功
        try {
          const db = Taro.cloud.database()
          console.log('✅ 云数据库初始化成功')
        } catch (dbError) {
          console.warn('⚠️ 云数据库初始化警告:', dbError)
        }
      } else {
        console.log('云开发已初始化，环境ID:', CLOUD_ENV_ID)
      }
    } else {
      console.log('当前环境不是微信小程序，跳过云开发初始化')
    }
  } catch (error: any) {
    console.error('❌ 初始化云开发失败:', error)
    console.error('错误详情:', {
      message: error.message,
      code: error.errCode,
      errMsg: error.errMsg
    })
    console.error('解决方案:')
    console.error('1. 在微信开发者工具中点击"云开发"按钮')
    console.error('2. 开通云开发并创建环境')
    console.error('3. 确认环境ID为:', CLOUD_ENV_ID)
    console.error('4. 在项目设置中勾选"云开发"选项')
  }
}

/**
 * 确保云开发已初始化
 */
function ensureCloudInitialized() {
  if (!cloudInitialized) {
    initCloud()
  }
  
  // 如果初始化后仍然未成功，抛出错误
  if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP && !Taro.cloud) {
    throw new Error('云开发未启用，请在微信开发者工具中开通云开发')
  }
  
  if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP && !cloudInitialized) {
    throw new Error('云开发初始化失败，请检查环境配置')
  }
}

/**
 * 调用云函数
 */
export async function callCloudFunction<T = any>(
  name: string,
  data?: Record<string, any>
): Promise<T> {
  // 确保云开发已初始化
  ensureCloudInitialized()

  try {
    console.log(`📞 调用云函数: ${name}`, data ? '参数:' : '无参数', data)
    
    const res = await Taro.cloud.callFunction({
      name,
      data
    })
    
    console.log(`📥 云函数 ${name} 响应:`, res)
    
    // 检查响应结构
    if (!res || !res.result) {
      console.error(`❌ 云函数 ${name} 返回格式错误:`, res)
      throw new Error('云函数返回格式错误，请检查云函数是否已部署')
    }
    
    const result = res.result
    
    // 检查是否有错误码
    if (result.errCode !== undefined && result.errCode !== 0) {
      const errorMsg = result.errMsg || '云函数执行失败'
      console.error(`❌ 云函数 ${name} 执行失败:`, {
        errCode: result.errCode,
        errMsg: errorMsg,
        result: result
      })
      throw new Error(`云函数执行失败: ${errorMsg} (错误码: ${result.errCode})`)
    }
    
    // 检查云函数返回的 success 字段
    if (result.success === false) {
      const errorMsg = result.error || result.errMsg || '云函数执行失败'
      console.error(`❌ 云函数 ${name} 返回失败:`, result)
      throw new Error(errorMsg)
    }
    
    // 如果 errCode 为 0 或 success 为 true，返回数据
    if (result.errCode === 0 || result.success === true) {
      // 如果返回的是 data 字段，提取 data；否则返回整个 result
      const returnData = result.data !== undefined ? result.data : result
      console.log(`✅ 云函数 ${name} 调用成功`)
      return returnData as T
    }
    
    // 如果 result 没有 errCode 字段，说明是直接返回的数据对象（正常情况）
    if (result.errCode === undefined && result.errMsg === undefined) {
      // 检查是否是有效的数据对象（不是错误对象）
      if (typeof result === 'object' && result !== null) {
        console.log(`✅ 云函数 ${name} 调用成功（直接返回数据）`)
        return result as T
      }
    }
    
    // 如果都没有匹配，尝试直接返回 result
    console.warn(`⚠️ 云函数 ${name} 返回格式异常，尝试直接返回:`, result)
    return result as T
    
  } catch (error: any) {
    console.error(`❌ 调用云函数 ${name} 失败:`, error)
    
    // 提取更详细的错误信息
    const errorDetails: any = {
      message: error.message || '未知错误',
      name: error.name,
      stack: error.stack
    }
    
    // 如果是云函数调用错误，提取更多信息
    if (error.errCode !== undefined) {
      errorDetails.errCode = error.errCode
      errorDetails.errMsg = error.errMsg
    }
    
    // 如果是网络错误
    if (error.message?.includes('not found') || error.message?.includes('不存在')) {
      errorDetails.suggestion = '云函数可能未部署，请在微信开发者工具中部署云函数'
    }
    
    console.error('错误详情:', errorDetails)
    
    // 提供更友好的错误信息
    let friendlyMessage = error.message || '云函数调用失败'
    
    if (error.errCode) {
      friendlyMessage = `云函数调用失败: ${error.errMsg || error.message} (错误码: ${error.errCode})`
    } else if (error.message?.includes('not found') || error.message?.includes('不存在')) {
      friendlyMessage = '云函数未找到，请先部署云函数'
    }
    
    const enhancedError = new Error(friendlyMessage)
    Object.assign(enhancedError, errorDetails)
    throw enhancedError
  }
}

/**
 * 获取云数据库引用
 */
export function getCloudDB() {
  ensureCloudInitialized()
  return Taro.cloud.database()
}

/**
 * 获取云存储引用
 */
export function getCloudStorage() {
  ensureCloudInitialized()
  return Taro.cloud
}

