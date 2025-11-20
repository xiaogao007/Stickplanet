// 云函数：获取计划统计信息
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const DEFAULT_STATS = {
  checked_days: 0,
  completion_rate: 0,
  current_streak: 0,
  remaining_days: 0
}

const toStartOfDay = (dateInput) => {
  if (!dateInput) {
    return null
  }

  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  date.setHours(0, 0, 0, 0)
  return date
}

exports.main = async (event) => {
  const {planId} = event || {}

  if (!planId) {
    console.error('缺少 planId 参数')
    return DEFAULT_STATS
  }

  try {
    const plansCollection = db.collection('plans')
    const checkInsCollection = db.collection('check_ins')

    const planDoc = await plansCollection.doc(planId).get()
    const plan = planDoc.data

    if (!plan) {
      console.warn(`未找到计划：${planId}`)
      return DEFAULT_STATS
    }

    const checkInsResult = await checkInsCollection
      .where({
        plan_id: planId,
        completed: true
      })
      .get()

    const completedCheckIns = checkInsResult.data || []
    const checkedDays = completedCheckIns.length
    const completionRate = plan.total_days > 0 ? Math.round((checkedDays / plan.total_days) * 100) : 0

    // 计算当前连续打卡天数
    let currentStreak = 0
    if (completedCheckIns.length > 0) {
      const today = toStartOfDay(new Date())
      const sortedCheckIns = completedCheckIns
        .map((checkIn) => toStartOfDay(checkIn.check_date))
        .filter(Boolean)
        .sort((a, b) => b.getTime() - a.getTime())

      for (let i = 0; i < sortedCheckIns.length; i++) {
        const expectedDate = new Date(today)
        expectedDate.setDate(expectedDate.getDate() - i)

        if (sortedCheckIns[i].getTime() === expectedDate.getTime()) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // 计算剩余天数
    let remainingDays = 0
    const endDate = toStartOfDay(plan.end_date)
    const today = toStartOfDay(new Date())
    if (endDate && today) {
      const diff = endDate.getTime() - today.getTime()
      remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    return {
      checked_days: checkedDays,
      completion_rate: completionRate,
      current_streak: currentStreak,
      remaining_days: remainingDays
    }
  } catch (error) {
    console.error('获取计划统计失败:', error)
    throw error
  }
}

