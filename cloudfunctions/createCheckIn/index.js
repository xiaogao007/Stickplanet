// 云函数：创建打卡记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const {checkIn} = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const checkInsCollection = db.collection('check_ins')
    
    // 检查是否已存在该日期的打卡记录
    const existing = await checkInsCollection
      .where({
        plan_id: checkIn.plan_id,
        check_date: checkIn.check_date
      })
      .get()

    let result
    if (existing.data.length > 0) {
      // 更新现有记录
      result = await checkInsCollection.doc(existing.data[0]._id).update({
        data: {
          completed: checkIn.completed !== undefined ? checkIn.completed : true,
          note: checkIn.note || null,
          images: checkIn.images || [],
          mood: checkIn.mood || null,
          is_makeup: checkIn.is_makeup || false
        }
      })
      return {
        id: existing.data[0]._id
      }
    } else {
      // 创建新记录
      const newCheckIn = {
        plan_id: checkIn.plan_id,
        user_id: checkIn.user_id,
        check_date: checkIn.check_date,
        completed: checkIn.completed !== undefined ? checkIn.completed : true,
        note: checkIn.note || null,
        images: checkIn.images || [],
        mood: checkIn.mood || null,
        is_makeup: checkIn.is_makeup || false,
        created_at: db.serverDate()
      }

      result = await checkInsCollection.add({
        data: newCheckIn
      })

      return {
        id: result._id
      }
    }
  } catch (error) {
    console.error('创建打卡记录失败:', error)
    throw error
  }
}

