// 云函数：创建计划
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const {plan} = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const plansCollection = db.collection('plans')
    const newPlan = {
      user_id: plan.user_id,
      name: plan.name,
      description: plan.description || null,
      start_date: plan.start_date,
      end_date: plan.end_date,
      total_days: plan.total_days,
      frequency: plan.frequency || 'daily',
      daily_target: plan.daily_target || null,
      reminder_enabled: plan.reminder_enabled || false,
      reminder_times: plan.reminder_times || [],
      motivation_text: plan.motivation_text || null,
      status: plan.status || 'active',
      is_template: false,
      template_category: plan.template_category || null,
      cover_image: plan.cover_image || null,
      created_at: db.serverDate(),
      updated_at: db.serverDate()
    }

    const result = await plansCollection.add({
      data: newPlan
    })

    return {
      id: result._id
    }
  } catch (error) {
    console.error('创建计划失败:', error)
    throw error
  }
}

