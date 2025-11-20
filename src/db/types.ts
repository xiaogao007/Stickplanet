export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  phone: string | null
  email: string | null
  nickname: string | null
  avatar_url: string | null
  role: UserRole
  total_days: number
  level: number
  points: number
  created_at: string
}

export interface Plan {
  id: string
  user_id: string | null
  name: string
  description: string | null
  start_date: string
  end_date: string
  total_days: number
  frequency: string
  daily_target: string | null
  reminder_enabled: boolean
  reminder_times: string[] | null
  motivation_text: string | null
  status: string
  is_template: boolean
  template_category: string | null
  cover_image: string | null
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: string
  plan_id: string
  user_id: string
  check_date: string
  completed: boolean
  note: string | null
  images: string[] | null
  mood: string | null
  is_makeup: boolean
  created_at: string
}

export interface Achievement {
  id: string
  user_id: string
  plan_id: string | null
  type: string
  title: string
  description: string | null
  icon: string | null
  achieved_at: string
}

export interface PlanWithStats extends Plan {
  checked_days?: number
  completion_rate?: number
  current_streak?: number
  remaining_days?: number
}
