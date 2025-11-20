// 云函数：获取用户资料
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const {userId} = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const userCollection = db.collection('profiles')
    const result = await userCollection.where({
      _id: userId,
      _openid: openid
    }).get()

    if (result.data.length === 0) {
      return null
    }

    const user = result.data[0]
    return {
      id: user._id,
      phone: user.phone || null,
      email: user.email || null,
      nickname: user.nickname || null,
      avatar_url: user.avatar_url || null,
      role: user.role || 'user',
      total_days: user.total_days || 0,
      level: user.level || 1,
      points: user.points || 0,
      created_at: user.created_at
    }
  } catch (error) {
    console.error('获取用户资料失败:', error)
    throw error
  }
}

