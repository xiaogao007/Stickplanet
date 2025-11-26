import {Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {profileApi} from '@/db/cloudApi'
import {useAuth} from '@/hooks/useAuth'
import type {Profile} from '@/db/types'

const ProfilePage: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const data = await profileApi.getProfile(user.id)
      setProfile(data)
    } catch (error) {
      console.error('加载用户信息失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useDidShow(() => {
    loadProfile()
  })

  const handleViewAchievements = () => {
    Taro.navigateTo({url: '/pages/achievements/index'})
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY className="min-h-screen bg-background box-border">
      <View className="p-4 space-y-6">
        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <View className="flex items-center space-x-4 mb-6">
            <View className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} className="w-20 h-20 rounded-full" mode="aspectFill" />
              ) : (
                <Text className="text-3xl text-primary-foreground">{profile?.nickname?.[0] || '喵'}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground block mb-1">{profile?.nickname || '一刻习惯用户'}</Text>
              <View className="flex items-center space-x-2">
                <View className="px-2 py-1 rounded-full bg-primary/10">
                  <Text className="text-xs font-semibold text-primary">Lv.{profile?.level || 1}</Text>
                </View>
                {profile?.role === 'admin' && (
                  <View className="px-2 py-1 rounded-full bg-accent">
                    <Text className="text-xs font-semibold text-accent-foreground">管理员</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View className="grid grid-cols-3 gap-4">
            <View className="text-center">
              <Text className="text-2xl font-bold text-primary block">{profile?.total_days || 0}</Text>
              <Text className="text-sm text-muted-foreground block mt-1">累计天数</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold text-primary block">{profile?.points || 0}</Text>
              <Text className="text-sm text-muted-foreground block mt-1">积分</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold text-primary block">{profile?.level || 1}</Text>
              <Text className="text-sm text-muted-foreground block mt-1">等级</Text>
            </View>
          </View>
        </View>

        <View className="bg-card rounded-2xl overflow-hidden shadow-sm">
          <View
            className="flex items-center justify-between p-4 border-b border-border"
            onClick={handleViewAchievements}>
            <View className="flex items-center space-x-3">
              <View className="text-2xl">🏆</View>
              <Text className="text-base font-semibold text-foreground">我的成就</Text>
            </View>
            <Text className="text-muted-foreground">→</Text>
          </View>

          <View
            className="flex items-center justify-between p-4 border-b border-border"
            onClick={() => Taro.showToast({title: '功能开发中', icon: 'none'})}>
            <View className="flex items-center space-x-3">
              <View className="text-2xl">⚙️</View>
              <Text className="text-base font-semibold text-foreground">设置</Text>
            </View>
            <Text className="text-muted-foreground">→</Text>
          </View>

          <View
            className="flex items-center justify-between p-4"
            onClick={() => Taro.showToast({title: '功能开发中', icon: 'none'})}>
            <View className="flex items-center space-x-3">
              <View className="text-2xl">ℹ️</View>
              <Text className="text-base font-semibold text-foreground">关于</Text>
            </View>
            <Text className="text-muted-foreground">→</Text>
          </View>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-sm text-muted-foreground block mb-2">📧 联系方式</Text>
          {profile?.email && <Text className="text-sm text-foreground block mb-1">邮箱：{profile.email}</Text>}
          {profile?.phone && <Text className="text-sm text-foreground block">手机：{profile.phone}</Text>}
        </View>

      </View>
    </ScrollView>
  )
}

export default ProfilePage
