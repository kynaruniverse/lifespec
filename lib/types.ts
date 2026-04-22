export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  becoming_statement: string | null
  avatar_url: string | null
  onboarding_complete: boolean
  email_notifications: boolean
  created_at: string
  updated_at: string
}

export type StatCategory = {
  id: string
  name: string
  icon: string
  description: string
}

export type UserStat = {
  id: string
  user_id: string
  stat_category_id: string
  current_value: number
  stat_categories?: StatCategory
}

// ✅ NEW: Pending stat changes (for cycle-based updates)
export type PendingStatChange = {
  id: string
  user_id: string
  stat_category_id: string
  delta: number
  source: 'task'
  source_id: string
  created_at: string
  applied: boolean
}

export type Streak = {
  id: string
  user_id: string
  stat_category_id: string
  current_streak: number
  longest_streak: number
  last_completed_cycle: string | null
  stat_categories?: StatCategory
}

// ✅ NEW: Weekly cycle system
export type WeeklyCycle = {
  id: string
  user_id: string
  start_date: string
  end_date: string
  status: 'active' | 'completed'
}

export type Council = {
  id: string
  owner_id: string
  name: string
  created_at: string
}

export type CouncilMember = {
  id: string
  council_id: string
  member_id: string
  invite_email?: string
  invite_token?: string
  status: 'pending' | 'active' | 'removed'
  invited_at: string
  joined_at: string | null
  profiles?: Profile
}

// ✅ NEW: Track council engagement/activity
export type CouncilActivity = {
  id: string
  council_member_id: string
  last_active_at: string
}

// ✅ UPDATED: Task status simplified
export type Task = {
  id: string
  council_id: string
  assigned_to: string
  assigned_by: string
  stat_category_id: string
  title: string
  description: string | null
  due_date: string | null
  cycle_week: string | null
  status: 'active' | 'completed' | 'expired'
  created_at: string
  stat_categories?: StatCategory
  assigner?: Profile
}

// ✅ Submission handles approval state (separate from task)
export type Submission = {
  id: string
  task_id: string
  user_id: string
  note: string | null
  media_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'needs_more'
  submitted_at: string
  reviewed_at: string | null
  tasks?: Task
}

// ✅ UPDATED: Feedback supports comments + reviews
export type Feedback = {
  id: string
  submission_id: string
  reviewer_id: string
  type: 'review' | 'comment'
  decision?: 'approved' | 'rejected' | 'needs_more'
  comment: string | null
  created_at: string
}

// ✅ NEW: Task templates (for low-friction assignment)
export type TaskTemplate = {
  id: string
  title: string
  description: string | null
  stat_category_id: string
  suggested_value: number
}