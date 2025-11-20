// 云函数：同步推荐计划模板
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

function normalizeTemplate(template) {
  return {
    name: template.name,
    description: template.description || '',
    total_days: template.total_days || 0,
    frequency: template.frequency || '每日',
    daily_target: template.daily_target || '',
    motivation_text: template.motivation_text || '',
    template_category: template.template_category || '',
    cover_image: template.cover_image || ''
  }
}

exports.main = async event => {
  const {templates = [], user_id, user_role} = event

  if (!user_role || user_role !== 'admin') {
    throw new Error('无权限操作：仅管理员可同步模板')
  }

  if (!Array.isArray(templates) || templates.length === 0) {
    return {success: true, inserted: 0, updated: 0}
  }

  try {
    const plansCollection = db.collection('plans')
    const stats = {inserted: 0, updated: 0}

    for (const template of templates) {
      const normalized = normalizeTemplate(template)
      if (!normalized.name) {
        continue
      }

      const existing = await plansCollection
        .where({
          is_template: true,
          name: normalized.name
        })
        .limit(1)
        .get()

      const payload = {
        user_id: null,
        name: normalized.name,
        description: normalized.description,
        start_date: '',
        end_date: '',
        total_days: normalized.total_days,
        frequency: normalized.frequency,
        daily_target: normalized.daily_target,
        reminder_enabled: false,
        reminder_times: [],
        motivation_text: normalized.motivation_text,
        status: 'active',
        is_template: true,
        template_category: normalized.template_category,
        cover_image: normalized.cover_image,
        updated_at: db.serverDate()
      }

      if (existing.data && existing.data.length > 0) {
        await plansCollection.doc(existing.data[0]._id).update({
          data: payload
        })
        stats.updated += 1
      } else {
        await plansCollection.add({
          data: {
            ...payload,
            created_at: db.serverDate()
          }
        })
        stats.inserted += 1
      }
    }

    return {
      success: true,
      ...stats
    }
  } catch (error) {
    console.error('同步推荐模板失败:', error)
    throw error
  }
}


