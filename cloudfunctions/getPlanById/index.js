// 云函数：获取计划详情
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const {planId} = event

  try {
    const plansCollection = db.collection('plans')
    const result = await plansCollection.doc(planId).get()

    if (!result.data) {
      return null
    }

    const plan = result.data
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
      updated_at: plan.updated_at
    }
  } catch (error) {
    console.error('获取计划详情失败:', error)
    throw error
  }
}

