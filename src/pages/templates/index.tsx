import {Button, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from '@/hooks/useAuth'
import type React from 'react'
import {useCallback, useEffect, useRef, useState} from 'react'
import {planApi} from '@/db/cloudApi'
import type {Plan} from '@/db/types'
import {convertCloudPathsToTempURLs} from '@/utils/cloudUpload'

const FALLBACK_TEMPLATES: Plan[] = []

const FALLBACK_TEMPLATE_SEED = FALLBACK_TEMPLATES.map(template => ({
  name: template.name,
  description: template.description,
  total_days: template.total_days,
  frequency: template.frequency,
  daily_target: template.daily_target,
  motivation_text: template.motivation_text,
  template_category: template.template_category,
  cover_image: template.cover_image
}))

const Templates: React.FC = () => {
  const {user} = useAuth() // 移除 guard，允许未登录用户浏览模板
  const [templates, setTemplates] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [usedFallback, setUsedFallback] = useState(false)
  const seedTriggeredRef = useRef(false)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const data = await planApi.getTemplates()
      console.log('📋 获取到的模板数据:', data)
      
      if (Array.isArray(data) && data.length > 0) {
        // 将云存储路径转换为临时链接（微信小程序 Image 组件需要）
        const coverImages = data.map((t) => t.cover_image)
        console.log('🖼️ 原始封面图片路径:', coverImages)
        
        const tempURLs = await convertCloudPathsToTempURLs(coverImages)
        console.log('🔗 转换后的临时链接:', tempURLs)
        
        // 更新模板数据，使用转换后的临时链接
        const templatesWithTempURLs = data.map((template, index) => ({
          ...template,
          cover_image: tempURLs[index]
        }))
        
        console.log('✅ 更新后的模板数据:', templatesWithTempURLs)
        setTemplates(templatesWithTempURLs)
        setUsedFallback(false)
      } else {
        setTemplates(FALLBACK_TEMPLATES)
        setUsedFallback(true)
      }
    } catch (error) {
      console.error('加载推荐计划失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    const shouldSeed = usedFallback && user?.role === 'admin' && !seedTriggeredRef.current

    if (!shouldSeed) {
      return
    }

    seedTriggeredRef.current = true

    ;(async () => {
      const success = await planApi.syncTemplates(FALLBACK_TEMPLATE_SEED, user)
      if (success) {
        Taro.showToast({title: '已同步热门模板', icon: 'success'})
        loadTemplates()
      } else {
        Taro.showToast({title: '同步模板失败', icon: 'none'})
      }
    })()
  }, [usedFallback, user, loadTemplates])

  const handleUseTemplate = async (template: Plan) => {
    if (!user?.id) {
      Taro.showModal({
        title: '提示',
        content: '使用模板需要登录，是否前往登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({url: '/subpackages/auth/pages/login/index'})
          }
        }
      })
      return
    }

    try {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + template.total_days - 1)

      const planId = await planApi.createPlan({
        user_id: user.id,
        name: template.name,
        description: template.description,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        total_days: template.total_days,
        frequency: template.frequency,
        daily_target: template.daily_target,
        motivation_text: template.motivation_text,
        reminder_enabled: false,
        reminder_times: null,
        status: 'active',
        is_template: false,
        template_category: template.template_category,
        cover_image: template.cover_image
      })

      if (planId) {
        Taro.showToast({title: '已加入计划', icon: 'success'})
        setTimeout(() => {
          Taro.switchTab({url: '/pages/plans/index'})
        }, 1500)
      } else {
        Taro.showToast({title: '加入失败', icon: 'none'})
      }
    } catch (error) {
      console.error('加入计划失败:', error)
      Taro.showToast({title: '加入失败', icon: 'none'})
    }
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
      <View className="p-4 space-y-4">
        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-2xl font-bold text-foreground block mb-2">推荐计划</Text>
          <Text className="text-sm text-muted-foreground">精选优质计划模板，帮助你快速开始坚持之旅</Text>
        </View>

        {templates.map((template) => (
          <View
            key={template.id}
            className="bg-card rounded-3xl overflow-hidden border border-border shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            {template.cover_image ? (
              <View className="relative h-44">
                <Image src={template.cover_image} className="w-full h-full object-cover" mode="scaleToFill" />
                <View className="absolute inset-0 h-full bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <View className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                  <View className="space-y-1">
                    <Text className="text-white text-lg font-semibold">{template.name}</Text>
                    {template.template_category && (
                      <View className="inline-flex px-2 py-0.5 rounded-full bg-white/20">
                        <Text className="text-xs text-white">{template.template_category}</Text>
                      </View>
                    )}
                  </View>
                  <View className="px-3 py-1 rounded-full bg-white/80">
                    <Text className="text-sm font-semibold text-primary">{template.total_days} 天</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className="p-5 pb-0">
                <Text className="text-lg font-bold text-foreground block">{template.name}</Text>
                {template.template_category && (
                  <View className="inline-flex px-2 py-0.5 rounded-full bg-secondary mt-2">
                    <Text className="text-xs text-secondary-foreground">{template.template_category}</Text>
                  </View>
                )}
              </View>
            )}

            <View className="p-5 space-y-4">
              {template.description && (
                <Text className="text-sm text-muted-foreground leading-relaxed">{template.description}</Text>
              )}

              <View className="grid grid-cols-2 gap-3 text-sm">
                <View className="bg-muted rounded-2xl p-3 space-y-1">
                  <Text className="text-xs text-muted-foreground">坚持周期</Text>
                  <Text className="text-base font-semibold text-foreground">{template.total_days} 天</Text>
                </View>
                <View className="bg-muted rounded-2xl p-3 space-y-1">
                  <Text className="text-xs text-muted-foreground">频率建议</Text>
                  <Text className="text-base font-semibold text-foreground">{template.frequency || '—'}</Text>
                </View>
              </View>

              {template.daily_target && (
                <View className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                  <Text className="text-xs text-primary font-semibold tracking-wide">每日目标</Text>
                  <Text className="text-sm text-foreground mt-1 leading-relaxed">{template.daily_target}</Text>
                </View>
              )}

              {template.motivation_text && (
                <View className="bg-muted rounded-2xl p-4">
                  <Text className="text-xs text-muted-foreground">坚持宣言</Text>
                  <Text className="text-sm text-foreground italic mt-1 leading-relaxed">
                    “{template.motivation_text}”
                  </Text>
                </View>
              )}

              <Button
                className="w-full bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground py-3 rounded-2xl text-base font-semibold"
                size="default"
                onClick={() => handleUseTemplate(template)}>
                立即参加
              </Button>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default Templates
