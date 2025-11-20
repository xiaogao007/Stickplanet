import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from '@/hooks/useAuth'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {checkInApi, planApi} from '@/db/cloudApi'
import type {CheckIn, Plan} from '@/db/types'

const PlanDetail: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const planId = router.params.id || ''
  const [plan, setPlan] = useState<Plan | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [stats, setStats] = useState({
    checked_days: 0,
    completion_rate: 0,
    current_streak: 0,
    remaining_days: 0
  })
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!planId) return

    setLoading(true)
    try {
      const [planData, checkInsData, statsData] = await Promise.all([
        planApi.getPlanById(planId),
        checkInApi.getCheckInsByPlan(planId),
        planApi.getPlanStats(planId)
      ])

      setPlan(planData)
      setCheckIns(checkInsData)
      setStats(statsData)
    } catch (error) {
      console.error('加载计划详情失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [planId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  const handleCheckIn = () => {
    Taro.navigateTo({url: `/pages/checkin/index?planId=${planId}`})
  }

  const handlePausePlan = async () => {
    if (!plan) return

    Taro.showModal({
      title: '暂停计划',
      content: '确定要暂停这个计划吗？',
      success: async (res) => {
        if (res.confirm) {
          const success = await planApi.updatePlan(planId, {status: 'paused'})
          if (success) {
            Taro.showToast({title: '已暂停', icon: 'success'})
            loadData()
          } else {
            Taro.showToast({title: '操作失败', icon: 'none'})
          }
        }
      }
    })
  }

  const handleResumePlan = async () => {
    const success = await planApi.updatePlan(planId, {status: 'active'})
    if (success) {
      Taro.showToast({title: '已恢复', icon: 'success'})
      loadData()
    } else {
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  const handleDeletePlan = () => {
    Taro.showModal({
      title: '删除计划',
      content: '确定要删除这个计划吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          const success = await planApi.deletePlan(planId)
          if (success) {
            Taro.showToast({title: '已删除', icon: 'success'})
            setTimeout(() => {
              Taro.navigateBack()
            }, 1500)
          } else {
            Taro.showToast({title: '删除失败', icon: 'none'})
          }
        }
      }
    })
  }

  if (loading || !plan) {
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
          <View className="flex items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground block mb-2">{plan.name}</Text>
              {plan.description && <Text className="text-sm text-muted-foreground block">{plan.description}</Text>}
            </View>
            <View className={`px-3 py-1 rounded-full ${plan.status === 'active' ? 'bg-success/10' : 'bg-muted'}`}>
              <Text
                className={`text-xs font-semibold ${
                  plan.status === 'active' ? 'text-success' : 'text-muted-foreground'
                }`}>
                {plan.status === 'active' ? '进行中' : plan.status === 'paused' ? '已暂停' : '已完成'}
              </Text>
            </View>
          </View>

          {plan.motivation_text && (
            <View className="bg-muted rounded-lg p-4 mb-4">
              <Text className="text-sm text-foreground italic">{plan.motivation_text}</Text>
            </View>
          )}

          <View className="grid grid-cols-4 gap-4">
            <View className="text-center">
              <Text className="text-2xl font-bold text-primary block">{stats.checked_days}</Text>
              <Text className="text-xs text-muted-foreground block mt-1">已坚持</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold text-primary block">{stats.current_streak}</Text>
              <Text className="text-xs text-muted-foreground block mt-1">连续</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold text-primary block">{stats.completion_rate}%</Text>
              <Text className="text-xs text-muted-foreground block mt-1">完成率</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold text-muted-foreground block">{stats.remaining_days}</Text>
              <Text className="text-xs text-muted-foreground block mt-1">剩余</Text>
            </View>
          </View>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-foreground block mb-4">计划信息</Text>
          <View className="space-y-3">
            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">开始日期</Text>
              <Text className="text-sm font-semibold text-foreground">{plan.start_date}</Text>
            </View>
            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">结束日期</Text>
              <Text className="text-sm font-semibold text-foreground">{plan.end_date}</Text>
            </View>
            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">总天数</Text>
              <Text className="text-sm font-semibold text-foreground">{plan.total_days} 天</Text>
            </View>
            {plan.daily_target && (
              <View className="flex items-center justify-between">
                <Text className="text-sm text-muted-foreground">每日目标</Text>
                <Text className="text-sm font-semibold text-foreground">{plan.daily_target}</Text>
              </View>
            )}
            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">执行频次</Text>
              <Text className="text-sm font-semibold text-foreground">
                {plan.frequency === 'daily' ? '每日' : plan.frequency === 'weekly' ? '每周' : '自定义'}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-foreground block mb-4">最近打卡</Text>
          {checkIns.length === 0 ? (
            <View className="py-8 text-center">
              <View className="text-4xl mb-2">📝</View>
              <Text className="text-sm text-muted-foreground">还没有打卡记录</Text>
            </View>
          ) : (
            <View className="space-y-2">
              {checkIns.slice(0, 5).map((checkIn) => (
                <View
                  key={checkIn.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <View className="flex items-center space-x-3">
                    <View
                      className={`w-2 h-2 rounded-full ${checkIn.completed ? 'bg-success' : 'bg-muted-foreground'}`}
                    />
                    <Text className="text-sm text-foreground">{checkIn.check_date}</Text>
                  </View>
                  {checkIn.note && (
                    <Text className="text-xs text-muted-foreground">{checkIn.note.slice(0, 20)}...</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="space-y-3">
          {plan.status === 'active' && (
            <Button
              className="w-full bg-primary text-primary-foreground py-4 rounded-full break-keep text-base font-semibold"
              size="default"
              onClick={handleCheckIn}>
              今日打卡
            </Button>
          )}

          {plan.status === 'active' ? (
            <Button
              className="w-full bg-warning text-warning-foreground py-4 rounded-full break-keep text-base font-semibold"
              size="default"
              onClick={handlePausePlan}>
              暂停计划
            </Button>
          ) : plan.status === 'paused' ? (
            <Button
              className="w-full bg-success text-success-foreground py-4 rounded-full break-keep text-base font-semibold"
              size="default"
              onClick={handleResumePlan}>
              恢复计划
            </Button>
          ) : null}

          <Button
            className="w-full bg-destructive text-destructive-foreground py-4 rounded-full break-keep text-base font-semibold"
            size="default"
            onClick={handleDeletePlan}>
            删除计划
          </Button>
        </View>
      </View>
    </ScrollView>
  )
}

export default PlanDetail
