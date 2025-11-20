// 云函数：微信登录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const {code, userInfo} = event
  const wxContext = cloud.getWXContext()

  try {
    // 获取用户的 openid
    const openid = wxContext.OPENID

    if (!openid) {
      return {
        success: false,
        error: '获取用户标识失败'
      }
    }

    // 查询用户是否已存在
    const userCollection = db.collection('profiles')
    const userQuery = await userCollection.where({
      _openid: openid
    }).get()

    let user
    if (userQuery.data.length > 0) {
      // 用户已存在，更新用户信息
      user = userQuery.data[0]
      if (userInfo) {
        await userCollection.doc(user._id).update({
          data: {
            nickname: userInfo.nickName || user.nickname,
            avatar_url: userInfo.avatarUrl || user.avatar_url,
            updated_at: db.serverDate()
          }
        })
        user.nickname = userInfo.nickName || user.nickname
        user.avatar_url = userInfo.avatarUrl || user.avatar_url
      }
    } else {
      // 新用户，创建用户记录
      const isFirstUser = (await userCollection.count()).total === 0
      const newUser = {
        _openid: openid,
        nickname: userInfo?.nickName || '微信用户',
        avatar_url: userInfo?.avatarUrl || '',
        phone: null,
        email: null,
        role: isFirstUser ? 'admin' : 'user',
        total_days: 0,
        level: 1,
        points: 0,
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      }

      const addResult = await userCollection.add({
        data: newUser
      })

      user = {
        _id: addResult._id,
        id: addResult._id,
        ...newUser
      }
    }

    return {
      success: true,
      user: {
        id: user._id || user.id,
        openid: openid,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        role: user.role
      }
    }
  } catch (error) {
    console.error('微信登录失败:', error)
    return {
      success: false,
      error: error.message || '登录失败'
    }
  }
}

