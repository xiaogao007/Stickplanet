// 云函数：获取用户计划列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const {userId} = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const plansCollection = db.collection('plans')
    
    // 获取用户计划
    const plansResult = await plansCollection
      .where({
        user_id: userId,
        is_template: false
      })
      .orderBy('created_at', 'desc')
      .get()

    const plans = plansResult.data || []

    // 计算每个计划的统计信息
    const checkInsCollection = db.collection('check_ins')
    const plansWithStats = await Promise.all(
      plans.map(async (plan) => {
        // 获取打卡记录
        const checkInsResult = await checkInsCollection
          .where({
            plan_id: plan._id,
            completed: true
          })
          .get()

        const checkIns = checkInsResult.data || []
        const checkedDays = checkIns.length
        const completionRate = plan.total_days > 0 ? Math.round((checkedDays / plan.total_days) * 100) : 0

        // 计算连续打卡天数
        let currentStreak = 0
        if (checkIns.length > 0) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const sortedCheckIns = [...checkIns].sort(
            (a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
          )

          for (let i = 0; i < sortedCheckIns.length; i++) {
            const checkDate = new Date(sortedCheckIns[i].check_date)
            checkDate.setHours(0, 0, 0, 0)
            const expectedDate = new Date(today)
            expectedDate.setDate(expectedDate.getDate() - i)
            expectedDate.setHours(0, 0, 0, 0)

            if (checkDate.getTime() === expectedDate.getTime()) {
              currentStreak++
            } else {
              break
            }
          }
        }

        // 计算剩余天数
        const endDate = new Date(plan.end_date)
        const today = new Date()
        const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

        return {
          id: plan._id,
          user_id: plan.user_id,
          name: plan.name,
          description: plan.description,
          start_date: plan.start_date,
          end_date: plan.end_date,
          total_days: plan.total_days,
          frequency: plan.frequency,
          daily_target: plan.daily_target,
          reminder_enabled: plan.reminder_enabled || false,
          reminder_times: plan.reminder_times || [],
          motivation_text: plan.motivation_text,
          status: plan.status,
          is_template: plan.is_template,
          template_category: plan.template_category,
          cover_image: plan.cover_image,
          created_at: plan.created_at,
          updated_at: plan.updated_at,
          checked_days: checkedDays,
          completion_rate: completionRate,
          current_streak: currentStreak,
          remaining_days: remainingDays
        }
      })
    )

    return plansWithStats
  } catch (error) {
    console.error('获取用户计划失败:', error)
    throw error
  }
}

