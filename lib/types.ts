export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  becoming_statement: string | null
  avatar_url: string | null
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
  status: 'pending' | 'active' | 'removed'
  invited_at: string
  joined_at: string | null
  profiles?: Profile
}

export type Task = {
  id: string
  council_id: string
  assigned_to: string
  assigned_by: string
  stat_category_id: string
  title: string
  description: string | null
  due_date: string | null
  status: 'active' | 'submitted' | 'approved' | 'rejected'
  created_at: string
  stat_categories?: StatCategory
  assigner?: Profile
}

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

export type Feedback = {
  id: string
  submission_id: string
  reviewer_id: string
  decision: 'approved' | 'rejected' | 'needs_more'
  comment: string | null
  created_at: string
}