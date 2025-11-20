import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from '@/hooks/useAuth'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {planApi} from '@/db/cloudApi'
import type {PlanWithStats} from '@/db/types'

const Plans: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [plans, setPlans] = useState<PlanWithStats[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadPlans = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const data = await planApi.getUserPlans(user.id)
      setPlans(data)
    } catch (error) {
      console.error('加载计划失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  useDidShow(() => {
    loadPlans()
  })

  const filteredPlans = plans.filter((plan) => {
    if (filter === 'all') return true
    return plan.status === filter
  })

  const handleCreatePlan = () => {
    Taro.navigateTo({url: '/pages/plan-create/index'})
  }

  const handleViewPlanDetail = (planId: string) => {
    Taro.navigateTo({url: `/pages/plan-detail/index?id=${planId}`})
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      active: '进行中',
      completed: '已完成',
      paused: '已暂停',
      abandoned: '已放弃'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      active: 'text-success',
      completed: 'text-primary',
      paused: 'text-warning',
      abandoned: 'text-muted-foreground'
    }
    return colorMap[status] || 'text-muted-foreground'
  }

  const handlePullDown = async () => {
    if (refreshing) return
    setRefreshing(true)
    await loadPlans()
    setRefreshing(false)
  }

  const filterTabs = [
    {key: 'all', label: '全部'},
    {key: 'active', label: '进行中'},
    {key: 'completed', label: '已完成'},
    {key: 'paused', label: '已暂停'}
  ] as const

  if (loading) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-background via-background to-[#f6fef9]">
      <View className="px-4 pt-4 pb-3 space-y-3">
        <View className="bg-card rounded-3xl p-5 shadow-[0_15px_40px_rgba(17,24,39,0.06)] border border-border/60">
          <View className="flex items-center justify-between mb-5">
            <View>
              <Text className="text-lg font-semibold text-foreground block mb-1">我的计划</Text>
              <Text className="text-sm text-muted-foreground">
                共 {plans.length} 个计划 · 保持节奏，循序渐进
              </Text>
            </View>
            <Button
              className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium"
              size="default"
              onClick={handleCreatePlan}>
              新建计划
            </Button>
          </View>
          <View className="grid grid-cols-4 gap-2">
            {filterTabs.map((tab) => (
              <Button
                key={tab.key}
                className={`py-2 rounded-2xl text-sm font-medium ${
                  filter === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/70 text-muted-foreground'
                }`}
                size="default"
                onClick={() => setFilter(tab.key)}>
                {tab.label}
              </Button>
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        scrollY
        enableBackToTop
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handlePullDown}
        className="h-screen box-border">
        <View className="p-4 space-y-4 pb-24">
          {filteredPlans.length === 0 ? (
            <View className="py-20 text-center bg-card rounded-3xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] border border-border/60">
              <View className="text-4xl mb-5">🌱</View>
              <Text className="text-sm text-muted-foreground block mb-5 px-4 leading-relaxed">
                {filter === 'all' ? '还没有创建任何计划' : `没有${getStatusText(filter)}的计划`}
              </Text>
              <Button
                className="bg-primary text-primary-foreground py-3 px-6 rounded-full break-keep text-sm font-medium"
                size="default"
                onClick={handleCreatePlan}>
                创建新计划
              </Button>
            </View>
          ) : (
            filteredPlans.map((plan) => (
              <View
                key={plan.id}
                className="bg-card rounded-3xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)] border border-border/60"
                onClick={() => handleViewPlanDetail(plan.id)}>
                <View className="flex items-start justify-between mb-4">
                  <View className="flex-1 space-y-1.5 pr-3">
                    <Text className="text-base font-semibold text-foreground block leading-snug">{plan.name}</Text>
                    {plan.description && (
                      <Text className="text-sm text-muted-foreground block leading-relaxed line-clamp-2">
                        {plan.description}
                      </Text>
                    )}
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full border ${
                      plan.status === 'active' ? 'border-emerald-400 bg-emerald-50/70' : 'border-border bg-muted/80'
                    }`}>
                    <Text className={`text-xs font-medium ${getStatusColor(plan.status)}`}>
                      {getStatusText(plan.status)}
                    </Text>
                  </View>
                </View>

                <View className="grid grid-cols-3 gap-3 mb-4">
                  <View className="bg-muted rounded-2xl p-3">
                    <Text className="text-xs text-muted-foreground">已坚持</Text>
                    <Text className="text-lg font-semibold text-primary mt-1">{plan.checked_days || 0} 天</Text>
                  </View>
                  <View className="bg-muted rounded-2xl p-3">
                    <Text className="text-xs text-muted-foreground">连续</Text>
                    <Text className="text-lg font-semibold text-primary mt-1">{plan.current_streak || 0} 天</Text>
                  </View>
                  <View className="bg-muted rounded-2xl p-3">
                    <Text className="text-xs text-muted-foreground">剩余</Text>
                    <Text className="text-lg font-semibold text-foreground mt-1">{plan.remaining_days || 0} 天</Text>
                  </View>
                </View>

                <View>
                  <View className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <View
                      className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                      style={{width: `${Math.min(plan.completion_rate || 0, 100)}%`}}
                    />
                  </View>
                  <View className="flex items-center justify-between text-xs text-muted-foreground">
                    <Text className="tracking-wide">
                      {plan.checked_days || 0}/{plan.total_days} 天
                    </Text>
                    <Text className="text-primary font-semibold">{plan.completion_rate || 0}%</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View className="fixed bottom-20 right-4">
        <Button
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center break-keep text-2xl"
          size="default"
          onClick={handleCreatePlan}>
          +
        </Button>
      </View>
    </View>
  )
}

export default Plans
