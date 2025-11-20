import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from '@/hooks/useAuth'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {achievementApi} from '@/db/cloudApi'
import type {Achievement} from '@/db/types'

const Achievements: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  const loadAchievements = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const data = await achievementApi.getUserAchievements(user.id)
      setAchievements(data)
    } catch (error) {
      console.error('加载成就失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadAchievements()
  }, [loadAchievements])

  useDidShow(() => {
    loadAchievements()
  })

  const getAchievementIcon = (type: string) => {
    const iconMap = {
      day_7: '🥉',
      day_21: '🥈',
      day_50: '🥇',
      day_100: '👑'
    }
    return iconMap[type] || '🏆'
  }

  const getAchievementColor = (type: string) => {
    const colorMap = {
      day_7: 'bg-amber-100',
      day_21: 'bg-gray-200',
      day_50: 'bg-yellow-100',
      day_100: 'bg-purple-100'
    }
    return colorMap[type] || 'bg-muted'
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
        <View className="bg-card rounded-2xl p-6 shadow-sm text-center">
          <View className="text-6xl mb-4">🏆</View>
          <Text className="text-2xl font-bold text-foreground block mb-2">我的成就</Text>
          <Text className="text-sm text-muted-foreground">已获得 {achievements.length} 个成就勋章</Text>
        </View>

        {achievements.length === 0 ? (
          <View className="bg-card rounded-2xl p-12 shadow-sm text-center">
            <View className="text-6xl mb-4">🎯</View>
            <Text className="text-lg font-semibold text-foreground block mb-2">还没有获得成就</Text>
            <Text className="text-sm text-muted-foreground">坚持打卡，解锁更多成就勋章！</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                className={`rounded-2xl p-6 shadow-sm ${getAchievementColor(achievement.type)}`}>
                <View className="flex items-start space-x-4">
                  <View className="text-5xl">{getAchievementIcon(achievement.type)}</View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-foreground block mb-2">{achievement.title}</Text>
                    {achievement.description && (
                      <Text className="text-sm text-muted-foreground block mb-3">{achievement.description}</Text>
                    )}
                    <Text className="text-xs text-muted-foreground">
                      获得时间：
                      {new Date(achievement.achieved_at).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-foreground block mb-4">成就说明</Text>
          <View className="space-y-3">
            <View className="flex items-center space-x-3">
              <View className="text-2xl">🥉</View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground block">坚持7天</Text>
                <Text className="text-xs text-muted-foreground">连续打卡7天即可获得</Text>
              </View>
            </View>
            <View className="flex items-center space-x-3">
              <View className="text-2xl">🥈</View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground block">坚持21天</Text>
                <Text className="text-xs text-muted-foreground">连续打卡21天即可获得</Text>
              </View>
            </View>
            <View className="flex items-center space-x-3">
              <View className="text-2xl">🥇</View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground block">坚持50天</Text>
                <Text className="text-xs text-muted-foreground">连续打卡50天即可获得</Text>
              </View>
            </View>
            <View className="flex items-center space-x-3">
              <View className="text-2xl">👑</View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground block">坚持100天</Text>
                <Text className="text-xs text-muted-foreground">连续打卡100天即可获得</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default Achievements
