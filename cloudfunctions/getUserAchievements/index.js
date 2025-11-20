// 云函数：获取用户成就列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const {userId} = event

  try {
    const achievementsCollection = db.collection('achievements')
    const result = await achievementsCollection
      .where({
        user_id: userId
      })
      .orderBy('achieved_at', 'desc')
      .get()

    const achievements = (result.data || []).map(achievement => ({
      id: achievement._id,
      user_id: achievement.user_id,
      plan_id: achievement.plan_id,
      type: achievement.type,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      achieved_at: achievement.achieved_at
    }))

    return achievements
  } catch (error) {
    console.error('获取成就列表失败:', error)
    throw error
  }
}

