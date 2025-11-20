import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from '@/hooks/useAuth'
import type React from 'react'
import {useState} from 'react'
import {planApi} from '@/db/cloudApi'

const PlanCreate: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [totalDays, setTotalDays] = useState('50')
  const [dailyTarget, setDailyTarget] = useState('')
  const [motivationText, setMotivationText] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [submitting, setSubmitting] = useState(false)

  const frequencyOptions = ['daily', 'weekly', 'custom']
  const frequencyLabels = {daily: '每日', weekly: '每周', custom: '自定义'}

  const handleFrequencyChange = (e) => {
    setFrequency(frequencyOptions[e.detail.value])
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      Taro.showToast({title: '请输入计划名称', icon: 'none'})
      return
    }

    const days = Number.parseInt(totalDays, 10)
    if (Number.isNaN(days) || days < 1 || days > 365) {
      Taro.showToast({title: '计划天数必须在1-365之间', icon: 'none'})
      return
    }

    if (!user?.id) {
      Taro.showToast({title: '请先登录', icon: 'none'})
      return
    }

    setSubmitting(true)
    try {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days - 1)

      const planId = await planApi.createPlan({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        total_days: days,
        frequency,
        daily_target: dailyTarget.trim() || null,
        motivation_text: motivationText.trim() || null,
        reminder_enabled: false,
        reminder_times: null,
        status: 'active',
        is_template: false,
        template_category: null,
        cover_image: null
      })

      if (planId) {
        Taro.showToast({title: '创建成功', icon: 'success'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({title: '创建失败', icon: 'none'})
      }
    } catch (error) {
      console.error('创建计划失败:', error)
      Taro.showToast({title: '创建失败', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView scrollY className="min-h-screen bg-background box-border">
      <View className="p-4 space-y-6">
        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-foreground block mb-4">基本信息</Text>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-semibold text-foreground block mb-2">
                计划名称 <Text className="text-destructive">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-4 py-3 rounded-lg border border-border w-full"
                  placeholder="例如：50天早起挑战"
                  value={name}
                  maxlength={50}
                  onInput={(e) => setName(e.detail.value)}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground block mb-2">计划描述</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-input text-foreground px-4 py-3 rounded-lg border border-border w-full"
                  placeholder="简单描述一下你的计划..."
                  value={description}
                  maxlength={200}
                  style={{height: '80px'}}
                  onInput={(e) => setDescription(e.detail.value)}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground block mb-2">
                计划天数 <Text className="text-destructive">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-4 py-3 rounded-lg border border-border w-full"
                  type="number"
                  placeholder="建议7-100天"
                  value={totalDays}
                  onInput={(e) => setTotalDays(e.detail.value)}
                />
              </View>
              <Text className="text-xs text-muted-foreground block mt-1">
                推荐：7天入门、21天养成、50天巩固、100天精通
              </Text>
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground block mb-2">执行频次</Text>
              <Picker
                mode="selector"
                range={frequencyOptions.map((f) => frequencyLabels[f])}
                onChange={handleFrequencyChange}>
                <View className="bg-input text-foreground px-4 py-3 rounded-lg border border-border">
                  <Text className="text-foreground">{frequencyLabels[frequency]}</Text>
                </View>
              </Picker>
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground block mb-2">每日目标</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-4 py-3 rounded-lg border border-border w-full"
                  placeholder="例如：30分钟、1次、5公里"
                  value={dailyTarget}
                  maxlength={50}
                  onInput={(e) => setDailyTarget(e.detail.value)}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground block mb-2">激励语</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-input text-foreground px-4 py-3 rounded-lg border border-border w-full"
                  placeholder="给自己一句鼓励的话..."
                  value={motivationText}
                  maxlength={100}
                  style={{height: '60px'}}
                  onInput={(e) => setMotivationText(e.detail.value)}
                />
              </View>
            </View>
          </View>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-sm text-muted-foreground block mb-2">💡 温馨提示</Text>
          <Text className="text-xs text-muted-foreground block">• 建议从小目标开始，循序渐进</Text>
          <Text className="text-xs text-muted-foreground block">• 设定具体可衡量的每日目标</Text>
          <Text className="text-xs text-muted-foreground block">• 坚持打卡，养成习惯需要时间</Text>
        </View>

        <Button
          className="w-full bg-primary text-primary-foreground py-4 rounded-full break-keep text-base font-semibold"
          size="default"
          disabled={submitting}
          onClick={handleSubmit}>
          {submitting ? '创建中...' : '创建计划'}
        </Button>
      </View>
    </ScrollView>
  )
}

export default PlanCreate
