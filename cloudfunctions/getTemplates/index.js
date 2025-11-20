// 云函数：获取推荐计划模板
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const TEMPLATE_ASSET_BASE = '/assets/images/temples'

const HOT_TEMPLATE_DOCS = [
  {
    id: 'citywalk-28',
    name: '周末 CityWalk 28 天',
    description: '拍照 + 咖啡 + 步行的轻度出逃计划，把周末留给市集、街区与朋友。',
    total_days: 28,
    frequency: '每周 2 次',
    daily_target: '选择一条 CityWalk 路线，步行 8,000 步并记录 3 张照片',
    motivation_text: '生活要有松弛感，把“出门走走”做成一个仪式。',
    template_category: '城市探索'
  },
  {
    id: 'early-riser-21',
    name: '早起自救 21 天',
    description: '7 点起床 + 30 分钟晨间例行，配合咖啡和拉伸，养成自律节奏。',
    total_days: 21,
    frequency: '每日',
    daily_target: '7 点前起床，10 分钟拉伸 + 20 分钟阅读/写作',
    motivation_text: '把早晨还给自己，打工人也能拥有掌控感。',
    template_category: '效率提升'
  },
  {
    id: 'home-fitness-35',
    name: '居家燃脂 35 天',
    description: '无器械 HIIT/Tabata 组合，搭配轻食和心情记录，让运动更好玩。',
    total_days: 35,
    frequency: '每日 20 分钟',
    daily_target: '跟练 1 个燃脂课程，记录体感与心情，并完成拉伸',
    motivation_text: '多巴胺穿搭 + 汗水自拍，记录每一次心率飙升。',
    template_category: '体态管理'
  },
  {
    id: 'commute-reading-50',
    name: '通勤阅读 50 天',
    description: '利用上下班碎片时间阅读 30 页，并做短笔记输出。',
    total_days: 50,
    frequency: '每日',
    daily_target: '上下班各阅读 15 页，Obsidian 摘录 3 句话',
    motivation_text: '把刷短视频的时间换成精神富养，沉淀观点更自洽。',
    template_category: '自我成长'
  }
].map(template => ({
  ...template,
  cover_image: `${TEMPLATE_ASSET_BASE}/${template.id}.png`
}))

async function seedHotTemplates(plansCollection) {
  const templateIds = HOT_TEMPLATE_DOCS.map(item => item.id)
  const existing = await plansCollection
    .where({
      _id: _.in(templateIds)
    })
    .get()

  const existingIdSet = new Set((existing.data || []).map(item => item._id))
  const now = new Date().toISOString()

  const docsToInsert = HOT_TEMPLATE_DOCS.filter(item => !existingIdSet.has(item.id)).map(item => ({
    _id: item.id,
    user_id: null,
    name: item.name,
    description: item.description,
    start_date: '',
    end_date: '',
    total_days: item.total_days,
    frequency: item.frequency || '每日',
    daily_target: item.daily_target,
    reminder_enabled: false,
    reminder_times: [],
    motivation_text: item.motivation_text,
    status: 'active',
    is_template: true,
    template_category: item.template_category,
    cover_image: item.cover_image,
    created_at: now,
    updated_at: now
  }))

  if (!docsToInsert.length) {
    return
  }

  for (const doc of docsToInsert) {
    const {_id, ...data} = doc
    await plansCollection.doc(_id).set({
      data
    })
  }
}

exports.main = async (event, context) => {
  try {
    const plansCollection = db.collection('plans')

    await seedHotTemplates(plansCollection)

    const result = await plansCollection
      .where({
        is_template: true
      })
      .orderBy('created_at', 'desc')
      .get()

    const plans = (result.data || []).map(plan => ({
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
    }))

    return plans
  } catch (error) {
    console.error('获取推荐计划失败:', error)
    throw error
  }
}

