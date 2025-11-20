// 云函数：获取用户月度打卡记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const {userId, year, month} = event

  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`

    const checkInsCollection = db.collection('check_ins')
    const result = await checkInsCollection
      .where({
        user_id: userId,
        check_date: _.gte(startDate).and(_.lte(endDate))
      })
      .orderBy('check_date', 'asc')
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
    console.error('获取月度打卡记录失败:', error)
    throw error
  }
}

