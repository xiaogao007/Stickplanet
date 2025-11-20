import Taro from '@tarojs/taro'
import {callCloudFunction} from '@/client/cloud'

/**
 * 微信授权登录
 * 使用微信登录获取 code 和用户信息，然后通过云函数进行认证
 * @param userInfo 用户信息（可选，如果未提供则会在函数内部尝试获取）
 */
export async function wechatLogin(
  userInfo?: Taro.getUserProfile.SuccessCallbackResult['userInfo'] | null
): Promise<{
  success: boolean
  user: any
  error?: string
}> {
  try {
    // 1. 获取微信登录 code
    const loginRes = await Taro.login()
    if (!loginRes.code) {
      return {
        success: false,
        user: null,
        error: '获取微信登录凭证失败'
      }
    }

    const code = loginRes.code

    // 2. 如果未提供用户信息，尝试获取（但可能失败，因为必须在用户点击事件中调用）
    let finalUserInfo = userInfo
    if (!finalUserInfo) {
      try {
        const profileRes = await Taro.getUserProfile({
          desc: '用于完善用户资料'
        })
        finalUserInfo = profileRes.userInfo
      } catch (err) {
        console.warn('获取用户信息失败，将使用默认信息:', err)
        // 如果用户拒绝授权，仍然可以登录，只是没有昵称和头像
      }
    }

    // 3. 调用云函数进行登录
    const result = await callCloudFunction<{
      success: boolean
      user: any
      error?: string
    }>('wechatLogin', {
      code,
      userInfo: finalUserInfo
        ? {
            nickName: finalUserInfo.nickName,
            avatarUrl: finalUserInfo.avatarUrl,
            gender: finalUserInfo.gender,
            country: finalUserInfo.country,
            province: finalUserInfo.province,
            city: finalUserInfo.city
          }
        : null
    })

    if (!result.success) {
      return {
        success: false,
        user: null,
        error: result.error || '登录失败'
      }
    }

    return {
      success: true,
      user: result.user
    }
  } catch (error: any) {
    console.error('微信登录失败:', error)
    return {
      success: false,
      user: null,
      error: error.message || '登录失败，请重试'
    }
  }
}
