import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from '@/hooks/useAuth'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {checkInApi} from '@/db/cloudApi'
import type {CheckIn} from '@/db/types'

const Calendar: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [currentDate, setCurrentDate] = useState(new Date())
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)

  const loadCheckIns = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const data = await checkInApi.getUserCheckInsForMonth(user.id, year, month)
      setCheckIns(data)
    } catch (error) {
      console.error('加载打卡记录失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentDate])

  useEffect(() => {
    loadCheckIns()
  }, [loadCheckIns])

  useDidShow(() => {
    loadCheckIns()
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const isCheckedDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return checkIns.some((c) => c.check_date === dateStr && c.completed)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1)
  const emptyDays = Array.from({length: firstDay}, (_, i) => i)

  const monthCheckIns = checkIns.filter((c) => c.completed).length
  const monthDays = daysInMonth
  const completionRate = monthDays > 0 ? Math.round((monthCheckIns / monthDays) * 100) : 0

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
          <View className="flex items-center justify-between mb-6">
            <View className="text-2xl" onClick={handlePrevMonth}>
              ←
            </View>
            <Text className="text-xl font-bold text-foreground">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </Text>
            <View className="text-2xl" onClick={handleNextMonth}>
              →
            </View>
          </View>

          <View className="grid grid-cols-7 gap-2 mb-4">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <View key={day} className="text-center">
                <Text className="text-sm font-semibold text-muted-foreground">{day}</Text>
              </View>
            ))}
          </View>

          <View className="grid grid-cols-7 gap-2">
            {emptyDays.map((i) => (
              <View key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => (
              <View
                key={day}
                className={`aspect-square flex items-center justify-center rounded-lg ${
                  isCheckedDate(day) ? 'bg-primary' : isToday(day) ? 'bg-accent border-2 border-primary' : 'bg-muted'
                }`}>
                <Text
                  className={`text-sm font-semibold ${
                    isCheckedDate(day) ? 'text-primary-foreground' : isToday(day) ? 'text-primary' : 'text-foreground'
                  }`}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-foreground block mb-4">本月统计</Text>
          <View className="grid grid-cols-3 gap-4">
            <View className="text-center">
              <Text className="text-2xl font-bold text-primary block">{monthCheckIns}</Text>
              <Text className="text-sm text-muted-foreground block mt-1">打卡天数</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold text-primary block">{completionRate}%</Text>
              <Text className="text-sm text-muted-foreground block mt-1">完成率</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold text-primary block">{monthDays - monthCheckIns}</Text>
              <Text className="text-sm text-muted-foreground block mt-1">未打卡</Text>
            </View>
          </View>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <View className="flex items-center space-x-3">
            <View className="w-4 h-4 rounded bg-primary" />
            <Text className="text-sm text-muted-foreground">已打卡</Text>
          </View>
          <View className="flex items-center space-x-3 mt-2">
            <View className="w-4 h-4 rounded bg-accent border-2 border-primary" />
            <Text className="text-sm text-muted-foreground">今天</Text>
          </View>
          <View className="flex items-center space-x-3 mt-2">
            <View className="w-4 h-4 rounded bg-muted" />
            <Text className="text-sm text-muted-foreground">未打卡</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default Calendar
