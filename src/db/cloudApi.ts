import Taro from '@tarojs/taro'
import {callCloudFunction} from '@/client/cloud'
import type {Achievement, CheckIn, Plan, PlanWithStats, Profile} from './types'

type TemplateSeedPayload = Pick<
  Plan,
  'name' | 'description' | 'total_days' | 'frequency' | 'daily_target' | 'motivation_text' | 'template_category' | 'cover_image'
>

/**
 * 用户资料 API
 */
export const profileApi = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const result = await callCloudFunction<Profile>('getProfile', {userId})
      return result
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      await callCloudFunction('updateProfile', {userId, updates})
      return true
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return false
    }
  },

  async getAllProfiles(): Promise<Profile[]> {
    try {
      const result = await callCloudFunction<Profile[]>('getAllProfiles', {})
      return result || []
    } catch (error) {
      console.error('获取所有用户失败:', error)
      return []
    }
  }
}

/**
 * 计划 API
 */
export const planApi = {
  async getTemplates(): Promise<Plan[]> {
    try {
      const result = await callCloudFunction<Plan[]>('getTemplates', {})
      return result || []
    } catch (error) {
      console.error('获取推荐计划失败:', error)
      return []
    }
  },

  async getUserPlans(userId: string): Promise<PlanWithStats[]> {
    try {
      const result = await callCloudFunction<PlanWithStats[]>('getUserPlans', {userId})
      return result || []
    } catch (error) {
      console.error('获取用户计划失败:', error)
      return []
    }
  },

  async getPlanById(planId: string): Promise<Plan | null> {
    try {
      const result = await callCloudFunction<Plan>('getPlanById', {planId})
      return result
    } catch (error) {
      console.error('获取计划详情失败:', error)
      return null
    }
  },

  async createPlan(plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const result = await callCloudFunction<{id: string}>('createPlan', {plan})
      return result?.id || null
    } catch (error) {
      console.error('创建计划失败:', error)
      return null
    }
  },

  async updatePlan(planId: string, updates: Partial<Plan>): Promise<boolean> {
    try {
      await callCloudFunction('updatePlan', {planId, updates})
      return true
    } catch (error) {
      console.error('更新计划失败:', error)
      return false
    }
  },

  async deletePlan(planId: string): Promise<boolean> {
    try {
      await callCloudFunction('deletePlan', {planId})
      return true
    } catch (error) {
      console.error('删除计划失败:', error)
      return false
    }
  },

  async getPlanStats(planId: string): Promise<{
    checked_days: number
    completion_rate: number
    current_streak: number
    remaining_days: number
  }> {
    try {
      const result = await callCloudFunction<{
        checked_days: number
        completion_rate: number
        current_streak: number
        remaining_days: number
      }>('getPlanStats', {planId})
      return result || {checked_days: 0, completion_rate: 0, current_streak: 0, remaining_days: 0}
    } catch (error) {
      console.error('获取计划统计失败:', error)
      return {checked_days: 0, completion_rate: 0, current_streak: 0, remaining_days: 0}
    }
  },

  async syncTemplates(templates: TemplateSeedPayload[], user?: {id?: string; role?: string}): Promise<boolean> {
    if (!templates.length) {
      return true
    }

    try {
      await callCloudFunction('syncTemplates', {
        templates,
        user_id: user?.id,
        user_role: user?.role
      })
      return true
    } catch (error) {
      console.error('同步推荐计划失败:', error)
      return false
    }
  }
}

/**
 * 打卡 API
 */
export const checkInApi = {
  async getCheckInsByPlan(planId: string): Promise<CheckIn[]> {
    try {
      const result = await callCloudFunction<CheckIn[]>('getCheckInsByPlan', {planId})
      return result || []
    } catch (error) {
      console.error('获取打卡记录失败:', error)
      return []
    }
  },

  async getCheckInByDate(planId: string, date: string): Promise<CheckIn | null> {
    try {
      const result = await callCloudFunction<CheckIn>('getCheckInByDate', {planId, date})
      return result
    } catch (error) {
      console.error('获取打卡记录失败:', error)
      return null
    }
  },

  async createCheckIn(checkIn: Omit<CheckIn, 'id' | 'created_at'>): Promise<string | null> {
    try {
      const result = await callCloudFunction<{id: string}>('createCheckIn', {checkIn})
      return result?.id || null
    } catch (error) {
      console.error('创建打卡记录失败:', error)
      return null
    }
  },

  async updateCheckIn(checkInId: string, updates: Partial<CheckIn>): Promise<boolean> {
    try {
      await callCloudFunction('updateCheckIn', {checkInId, updates})
      return true
    } catch (error) {
      console.error('更新打卡记录失败:', error)
      return false
    }
  },

  async getUserCheckInsForMonth(userId: string, year: number, month: number): Promise<CheckIn[]> {
    try {
      const result = await callCloudFunction<CheckIn[]>('getUserCheckInsForMonth', {
        userId,
        year,
        month
      })
      return result || []
    } catch (error) {
      console.error('获取月度打卡记录失败:', error)
      return []
    }
  }
}

/**
 * 成就 API
 */
export const achievementApi = {
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const result = await callCloudFunction<Achievement[]>('getUserAchievements', {userId})
      return result || []
    } catch (error) {
      console.error('获取成就列表失败:', error)
      return []
    }
  },

  async createAchievement(achievement: Omit<Achievement, 'id' | 'achieved_at'>): Promise<string | null> {
    try {
      const result = await callCloudFunction<{id: string}>('createAchievement', {achievement})
      return result?.id || null
    } catch (error) {
      console.error('创建成就失败:', error)
      return null
    }
  },

  async checkAndCreateAchievement(userId: string, planId: string, checkedDays: number): Promise<void> {
    try {
      await callCloudFunction('checkAndCreateAchievement', {userId, planId, checkedDays})
    } catch (error) {
      console.error('检查并创建成就失败:', error)
    }
  }
}

