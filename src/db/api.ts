// 此文件已迁移到 cloudApi.ts，保留此文件以保持向后兼容
// 请使用 @/db/cloudApi 替代
export * from './cloudApi'
export type * from './types'

export const profileApi = {
  async getProfile(userId: string): Promise<Profile | null> {
    const {data, error} = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
    return data
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    const {error} = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) {
      console.error('更新用户信息失败:', error)
      return false
    }
    return true
  },

  async getAllProfiles(): Promise<Profile[]> {
    const {data, error} = await supabase.from('profiles').select('*').order('created_at', {ascending: false})
    if (error) {
      console.error('获取所有用户失败:', error)
      return []
    }
    return Array.isArray(data) ? data : []
  }
}

export const planApi = {
  async getTemplates(): Promise<Plan[]> {
    const {data, error} = await supabase
      .from('plans')
      .select('*')
      .eq('is_template', true)
      .order('created_at', {ascending: false})
    if (error) {
      console.error('获取推荐计划失败:', error)
      return []
    }
    return Array.isArray(data) ? data : []
  },

  async getUserPlans(userId: string): Promise<PlanWithStats[]> {
    const {data, error} = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_template', false)
      .order('created_at', {ascending: false})
    if (error) {
      console.error('获取用户计划失败:', error)
      return []
    }
    const plans = Array.isArray(data) ? data : []
    const plansWithStats = await Promise.all(
      plans.map(async (plan) => {
        const stats = await this.getPlanStats(plan.id)
        return {...plan, ...stats}
      })
    )
    return plansWithStats
  },

  async getPlanById(planId: string): Promise<Plan | null> {
    const {data, error} = await supabase.from('plans').select('*').eq('id', planId).maybeSingle()
    if (error) {
      console.error('获取计划详情失败:', error)
      return null
    }
    return data
  },

  async createPlan(plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    const {data, error} = await supabase.from('plans').insert([plan]).select('id').maybeSingle()
    if (error) {
      console.error('创建计划失败:', error)
      return null
    }
    return data?.id || null
  },

  async updatePlan(planId: string, updates: Partial<Plan>): Promise<boolean> {
    const {error} = await supabase.from('plans').update(updates).eq('id', planId)
    if (error) {
      console.error('更新计划失败:', error)
      return false
    }
    return true
  },

  async deletePlan(planId: string): Promise<boolean> {
    const {error} = await supabase.from('plans').delete().eq('id', planId)
    if (error) {
      console.error('删除计划失败:', error)
      return false
    }
    return true
  },

  async getPlanStats(planId: string): Promise<{
    checked_days: number
    completion_rate: number
    current_streak: number
    remaining_days: number
  }> {
    const plan = await this.getPlanById(planId)
    if (!plan) {
      return {checked_days: 0, completion_rate: 0, current_streak: 0, remaining_days: 0}
    }

    const {data: checkIns} = await supabase
      .from('check_ins')
      .select('check_date, completed')
      .eq('plan_id', planId)
      .eq('completed', true)
      .order('check_date', {ascending: true})

    const checkedDays = checkIns?.length || 0
    const completionRate = plan.total_days > 0 ? (checkedDays / plan.total_days) * 100 : 0

    let currentStreak = 0
    if (checkIns && checkIns.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const sortedCheckIns = [...checkIns].sort(
        (a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime()
      )

      for (let i = 0; i < sortedCheckIns.length; i++) {
        const checkDate = new Date(sortedCheckIns[i].check_date)
        checkDate.setHours(0, 0, 0, 0)
        const expectedDate = new Date(today)
        expectedDate.setDate(expectedDate.getDate() - i)
        expectedDate.setHours(0, 0, 0, 0)

        if (checkDate.getTime() === expectedDate.getTime()) {
          currentStreak++
        } else {
          break
        }
      }
    }

    const endDate = new Date(plan.end_date)
    const today = new Date()
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

    return {
      checked_days: checkedDays,
      completion_rate: Math.round(completionRate),
      current_streak: currentStreak,
      remaining_days: remainingDays
    }
  }
}

export const checkInApi = {
  async getCheckInsByPlan(planId: string): Promise<CheckIn[]> {
    const {data, error} = await supabase
      .from('check_ins')
      .select('*')
      .eq('plan_id', planId)
      .order('check_date', {ascending: false})
    if (error) {
      console.error('获取打卡记录失败:', error)
      return []
    }
    return Array.isArray(data) ? data : []
  },

  async getCheckInByDate(planId: string, date: string): Promise<CheckIn | null> {
    const {data, error} = await supabase
      .from('check_ins')
      .select('*')
      .eq('plan_id', planId)
      .eq('check_date', date)
      .maybeSingle()
    if (error) {
      console.error('获取打卡记录失败:', error)
      return null
    }
    return data
  },

  async createCheckIn(checkIn: Omit<CheckIn, 'id' | 'created_at'>): Promise<string | null> {
    const {data, error} = await supabase.from('check_ins').insert([checkIn]).select('id').maybeSingle()
    if (error) {
      console.error('创建打卡记录失败:', error)
      return null
    }
    return data?.id || null
  },

  async updateCheckIn(checkInId: string, updates: Partial<CheckIn>): Promise<boolean> {
    const {error} = await supabase.from('check_ins').update(updates).eq('id', checkInId)
    if (error) {
      console.error('更新打卡记录失败:', error)
      return false
    }
    return true
  },

  async getUserCheckInsForMonth(userId: string, year: number, month: number): Promise<CheckIn[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`

    const {data, error} = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .gte('check_date', startDate)
      .lte('check_date', endDate)
      .order('check_date', {ascending: true})

    if (error) {
      console.error('获取月度打卡记录失败:', error)
      return []
    }
    return Array.isArray(data) ? data : []
  }
}

export const achievementApi = {
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const {data, error} = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', {ascending: false})
    if (error) {
      console.error('获取成就列表失败:', error)
      return []
    }
    return Array.isArray(data) ? data : []
  },

  async createAchievement(achievement: Omit<Achievement, 'id' | 'achieved_at'>): Promise<string | null> {
    const {data, error} = await supabase.from('achievements').insert([achievement]).select('id').maybeSingle()
    if (error) {
      console.error('创建成就失败:', error)
      return null
    }
    return data?.id || null
  },

  async checkAndCreateAchievement(userId: string, planId: string, checkedDays: number): Promise<void> {
    const milestones = [
      {days: 7, type: 'day_7', title: '坚持7天', description: '连续打卡7天，养成习惯的开始！'},
      {days: 21, type: 'day_21', title: '坚持21天', description: '21天习惯养成，你已经做到了！'},
      {days: 50, type: 'day_50', title: '坚持50天', description: '50天坚持不懈，你是最棒的！'},
      {days: 100, type: 'day_100', title: '坚持100天', description: '百日坚持，成就非凡！'}
    ]

    for (const milestone of milestones) {
      if (checkedDays === milestone.days) {
        const {data: existing} = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('plan_id', planId)
          .eq('type', milestone.type)
          .maybeSingle()

        if (!existing) {
          await this.createAchievement({
            user_id: userId,
            plan_id: planId,
            type: milestone.type,
            title: milestone.title,
            description: milestone.description,
            icon: '🏆'
          })
        }
      }
    }
  }
}
