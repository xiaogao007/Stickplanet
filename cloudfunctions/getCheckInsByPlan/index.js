// 云函数：获取计划的打卡记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const {planId} = event

  try {
    const checkInsCollection = db.collection('check_ins')
    const result = await checkInsCollection
      .where({
        plan_id: planId
      })
      .orderBy('check_date', 'desc')
      .get()

    const checkIns = (result.data || []).map(checkIn => ({
      id: checkIn._id,
      plan_id: checkIn.plan_id,
      user_id: checkIn.user_id,
      check_date: checkIn.check_date,
      completed: checkIn.completed,
      note: checkIn.note,
      images: checkIn.images || [],
      mood: checkIn.mood,
      is_makeup: checkIn.is_makeup || false,
      created_at: checkIn.created_at
    }))

    return checkIns
  } catch (error) {
    console.error('获取打卡记录失败:', error)
    throw error
  }
}

