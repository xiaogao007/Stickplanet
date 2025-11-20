import {Button, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import type React from 'react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import inspirations from '@/assets/inspirations.json'
import {planApi, profileApi} from '@/db/cloudApi'
import {useAuth} from '@/hooks/useAuth'
import type {PlanWithStats, Profile} from '@/db/types'

type InspirationItem = {
  id: number
  text: string
}

const inspirationList = inspirations as InspirationItem[]

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const Home: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activePlans, setActivePlans] = useState<PlanWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(false) // 使用 ref 防止重复加载

  // 初始化时，如果已有用户信息，先显示登录时保存的信息（包含昵称和头像）
  useEffect(() => {
    if (user && !profile) {
      console.log('初始化用户信息:', user)
      setProfile({
        id: user.id,
        nickname: user.nickname || '坚持喵用户',
        avatar_url: user.avatar_url || null,
        phone: null,
        email: null,
        role: (user.role as 'user' | 'admin') || 'user',
        total_days: 0,
        level: 1,
        points: 0,
        created_at: new Date().toISOString()
      })
    }
  }, [user, profile])

  const loadData = useCallback(async () => {
    if (!user?.id || loadingRef.current) return // 防止重复加载

    loadingRef.current = true
    setLoading(true)
    try {
      const [profileData, plansData] = await Promise.all([
        profileApi.getProfile(user.id),
        planApi.getUserPlans(user.id)
      ])

      // 如果从数据库获取的 profile 不为空，使用数据库的数据（包含完整统计信息）
      // 但如果数据库中的头像或昵称为空（包括空字符串），保留登录时的信息
      if (profileData) {
        // 检查数据库中的值是否有效（非空且非空字符串）
        const dbNickname = profileData.nickname && typeof profileData.nickname === 'string' && profileData.nickname.trim() ? profileData.nickname.trim() : null
        const dbAvatarUrl = profileData.avatar_url && typeof profileData.avatar_url === 'string' && profileData.avatar_url.trim() ? profileData.avatar_url.trim() : null
        
        setProfile({
          ...profileData,
          // 如果数据库中的头像或昵称为空（包括空字符串），使用登录时保存的信息
          nickname: dbNickname || user?.nickname || '坚持喵用户',
          avatar_url: dbAvatarUrl || user?.avatar_url || null
        })
      } else if (user) {
        // 如果数据库没有数据，使用登录时保存的用户信息（包含昵称和头像）
        // 只在当前 profile 为空时设置，避免覆盖已有数据
        setProfile((prev) => {
          if (prev) return prev // 如果已有数据，不覆盖
          return {
            id: user.id,
            nickname: user.nickname || '坚持喵用户',
            avatar_url: user.avatar_url || null,
            phone: null,
            email: null,
            role: (user.role as 'user' | 'admin') || 'user',
            total_days: 0,
            level: 1,
            points: 0,
            created_at: new Date().toISOString()
          }
        })
      }

      setActivePlans(plansData?.filter((p) => p.status === 'active').slice(0, 3) || [])
    } catch (error) {
      console.error('加载数据失败:', error)
      // 如果加载失败，至少显示登录时保存的用户信息
      if (user) {
        setProfile((prev) => {
          if (prev) return prev // 如果已有数据，不覆盖
          return {
            id: user.id,
            nickname: user.nickname || '坚持喵用户',
            avatar_url: user.avatar_url || null,
            phone: null,
            email: null,
            role: (user.role as 'user' | 'admin') || 'user',
            total_days: 0,
            level: 1,
            points: 0,
            created_at: new Date().toISOString()
          }
        })
      }
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [user?.id]) // 只依赖 user.id，移除 profile 和 loading

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  // 获取要显示的头像和昵称（优先使用 profile，其次使用 user）
  // 确保空字符串也被视为无效值
  const getValidString = (value: string | null | undefined): string | null => {
    if (!value || typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  
  const displayAvatar = getValidString(profile?.avatar_url) || getValidString(user?.avatar_url) || null
  const displayNickname = getValidString(profile?.nickname) || getValidString(user?.nickname) || '坚持喵用户'
  
  // 调试日志（必须在 return 之前）
  useEffect(() => {
    console.log('首页用户信息:', {
      user: user,
      profile: profile,
      displayAvatar: displayAvatar,
      displayNickname: displayNickname
    })
  }, [user, profile, displayAvatar, displayNickname])

  const inspirationText = useMemo(() => {
    if (!inspirationList.length) {
      return '给自己一点时间，习惯正悄悄变好。'
    }
    const todayIndex = getDayOfYear(new Date()) % inspirationList.length
    return inspirationList[todayIndex]?.text || '给自己一点时间，习惯正悄悄变好。'
  }, [])

  const handleCreatePlan = () => {
    Taro.navigateTo({url: '/pages/plan-create/index'})
  }

  const handleViewTemplates = () => {
    Taro.navigateTo({url: '/pages/templates/index'})
  }

  const handleViewPlanDetail = (planId: string) => {
    Taro.navigateTo({url: `/pages/plan-detail/index?id=${planId}`})
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
      <View className="p-4 space-y-4 md:space-y-6">
        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <View className="flex items-center space-x-4">
            <View className="w-16 h-16 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              {displayAvatar ? (
                <Image 
                  src={displayAvatar} 
                  className="w-16 h-16 rounded-full" 
                  mode="aspectFill"
                  onError={(e) => {
                    console.error('头像加载失败:', e, '头像URL:', displayAvatar)
                  }}
                />
              ) : (
                <Text className="text-2xl text-primary-foreground">
                  {displayNickname?.[0] || '喵'}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground block">
                {displayNickname}
              </Text>
              <View className="flex items-center space-x-4 mt-2">
                <View>
                  <Text className="text-sm text-muted-foreground block">累计坚持</Text>
                  <Text className="text-lg font-bold text-primary block">{profile?.total_days || 0} 天</Text>
                </View>
                <View>
                  <Text className="text-sm text-muted-foreground block">等级</Text>
                  <Text className="text-lg font-bold text-primary block">Lv.{profile?.level || 1}</Text>
                </View>
                <View>
                  <Text className="text-sm text-muted-foreground block">积分</Text>
                  <Text className="text-lg font-bold text-primary block">{profile?.points || 0}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <View className="flex items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">进行中的计划</Text>
            <Text className="text-sm text-primary" onClick={() => Taro.switchTab({url: '/pages/plans/index'})}>
              查看全部 →
            </Text>
          </View>

          {activePlans.length === 0 ? (
            <View className="py-8 text-center">
              <View className="text-6xl mb-4">🎯</View>
              <Text className="text-muted-foreground block mb-4">还没有进行中的计划</Text>
              <Button
                className="bg-primary text-primary-foreground py-3 px-6 rounded-full break-keep text-base"
                size="default"
                onClick={handleCreatePlan}>
                创建第一个计划
              </Button>
            </View>
          ) : (
            <View className="space-y-3">
              {activePlans.map((plan) => (
                <View key={plan.id} className="bg-muted rounded-xl p-4" onClick={() => handleViewPlanDetail(plan.id)}>
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-base font-semibold text-foreground">{plan.name}</Text>
                    <Text className="text-sm text-muted-foreground">剩余 {plan.remaining_days || 0} 天</Text>
                  </View>
                  <View className="w-full h-2 bg-background rounded-full overflow-hidden mb-2">
                    <View className="h-full bg-primary rounded-full" style={{width: `${plan.completion_rate || 0}%`}} />
                  </View>
                  <View className="flex items-center justify-between">
                    <Text className="text-xs text-muted-foreground">
                      已打卡 {plan.checked_days || 0}/{plan.total_days} 天
                    </Text>
                    <Text className="text-xs text-primary font-semibold">{plan.completion_rate || 0}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="grid grid-cols-2 gap-4">
          <View className="bg-card rounded-2xl p-6 shadow-sm text-center" onClick={handleCreatePlan}>
            <View className="text-4xl mb-2">✨</View>
            <Text className="text-base font-semibold text-foreground block">创建计划</Text>
            <Text className="text-xs text-muted-foreground block mt-1">开启新的坚持</Text>
          </View>
          <View className="bg-card rounded-2xl p-6 shadow-sm text-center" onClick={handleViewTemplates}>
            <View className="text-4xl mb-2">📋</View>
            <Text className="text-base font-semibold text-foreground block">推荐计划</Text>
            <Text className="text-xs text-muted-foreground block mt-1">发现热门模板</Text>
          </View>
          <View
            className="bg-card rounded-2xl p-6 shadow-sm text-center"
            onClick={() => Taro.switchTab({url: '/pages/calendar/index'})}>
            <View className="text-4xl mb-2">📅</View>
            <Text className="text-base font-semibold text-foreground block">打卡日历</Text>
            <Text className="text-xs text-muted-foreground block mt-1">查看打卡记录</Text>
          </View>
          <View
            className="bg-card rounded-2xl p-6 shadow-sm text-center"
            onClick={() => Taro.navigateTo({url: '/pages/achievements/index'})}>
            <View className="text-4xl mb-2">🏆</View>
            <Text className="text-base font-semibold text-foreground block">我的成就</Text>
            <Text className="text-xs text-muted-foreground block mt-1">查看勋章荣誉</Text>
          </View>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-base font-bold text-foreground block mb-3">坚持信号</Text>
          <View className="rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-primary/10 border border-primary/20">
            <Text className="absolute top-3 left-4 text-5xl font-serif text-primary/30">“</Text>
            <Text className="text-sm text-slate-800 leading-relaxed pl-8 pr-3">{inspirationText}</Text>
            <Text className="text-xs text-emerald-600 block mt-4 text-right pr-1 tracking-wide">一刻习惯 · DAILY</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default Home
