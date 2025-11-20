import Taro from '@tarojs/taro'
import {useEffect, useState} from 'react'

interface User {
  id: string
  openid?: string
  nickname?: string
  avatar_url?: string
  role?: string
}

interface UseAuthOptions {
  guard?: boolean
}

export function useAuth(options: UseAuthOptions = {}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = () => {
    try {
      const storedUser = Taro.getStorageSync('user')
      if (storedUser) {
        console.log('从本地存储加载用户信息:', storedUser)
        setUser(storedUser)
      } else if (options.guard) {
        // 如果要求登录但未登录，跳转到登录页
        Taro.reLaunch({url: '/pages/login/index'})
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    Taro.removeStorageSync('user')
    setUser(null)
    Taro.reLaunch({url: '/pages/login/index'})
  }

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user
  }
}

