// ================================
// 🧠 CORE DATE HELPERS (unchanged but cleaned)
// ================================

// Returns days until Sunday (end of cycle)
export function getDaysUntilCycleEnd(): number {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday
  return day === 0 ? 0 : 7 - day
}

// Returns the current cycle start (Monday 00:00)
export function getCurrentCycleStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// Returns the current cycle end (Sunday 23:59)
export function getCurrentCycleEnd(): Date {
  const start = getCurrentCycleStart()
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

// Returns a formatted cycle label e.g. "Week of Apr 22"
export function getCycleLabel(): string {
  const start = getCurrentCycleStart()
  return `Week of ${start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })}`
}

// ================================
// 🎨 UI HELPERS
// ================================

export function getCycleUrgencyColor(daysLeft: number): string {
  if (daysLeft <= 1) return '#EF4444'
  if (daysLeft <= 3) return '#F59E0B'
  return '#A3E635'
}

export function getStreakFlame(streak: number): string {
  if (streak === 0) return '○'
  if (streak < 3) return '🔥'
  if (streak < 6) return '🔥🔥'
  return '🔥🔥🔥'
}

// ================================
// 🔥 NEW: CORE CYCLE LOGIC
// ================================

// Generate a stable cycle key (e.g. "2026-04-21")
export function getCycleKey(date: Date = new Date()): string {
  const start = getCurrentCycleStart()
  return start.toISOString().slice(0, 10)
}

// Check if a task belongs to current cycle
export function isTaskInCurrentCycle(taskCycle: string | null): boolean {
  if (!taskCycle) return false
  return taskCycle === getCycleKey()
}

// ================================
// 🧠 STREAK LOGIC (basic but real)
// ================================

export function shouldIncrementStreak(
  lastCompletedCycle: string | null,
  currentCycle: string
): boolean {
  if (!lastCompletedCycle) return true

  const last = new Date(lastCompletedCycle)
  const current = new Date(currentCycle)

  const diffDays = Math.floor(
    (current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Only increment if exactly 7 days apart (weekly consistency)
  return diffDays === 7
}

export function shouldResetStreak(
  lastCompletedCycle: string | null,
  currentCycle: string
): boolean {
  if (!lastCompletedCycle) return false

  const last = new Date(lastCompletedCycle)
  const current = new Date(currentCycle)

  const diffDays = Math.floor(
    (current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  )

  return diffDays > 7
}

// ================================
// 🚀 CRITICAL: APPLY CYCLE RESULTS
// ================================

// This is what runs at cycle end (cron job or manual trigger)
export async function applyCycleCompletion({
  supabase,
  userId,
}: {
  supabase: any
  userId: string
}) {
  const currentCycle = getCycleKey()

  // 1. Get all pending stat changes
  const { data: pendingChanges, error } = await supabase
    .from('pending_stat_changes')
    .select('*')
    .eq('user_id', userId)
    .eq('applied', false)

  if (error || !pendingChanges) return

  // 2. Group by stat category
  const grouped: Record<string, number> = {}

  for (const change of pendingChanges) {
    if (!grouped[change.stat_category_id]) {
      grouped[change.stat_category_id] = 0
    }
    grouped[change.stat_category_id] += change.delta
  }

  // 3. Apply stat updates
  for (const statCategoryId of Object.keys(grouped)) {
    const delta = grouped[statCategoryId]

    await supabase.rpc('increment_user_stat', {
      user_id_input: userId,
      stat_category_id_input: statCategoryId,
      delta_input: delta,
    }).catch(() => {})
  }

  // 4. Mark changes as applied
  await supabase
    .from('pending_stat_changes')
    .update({ applied: true })
    .eq('user_id', userId)
    .eq('applied', false)

  // 5. Update streaks (basic)
  const { data: streaks } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)

  for (const streak of streaks || []) {
    if (shouldIncrementStreak(streak.last_completed_cycle, currentCycle)) {
      await supabase
        .from('streaks')
        .update({
          current_streak: streak.current_streak + 1,
          longest_streak: Math.max(
            streak.longest_streak,
            streak.current_streak + 1
          ),
          last_completed_cycle: currentCycle,
        })
        .eq('id', streak.id)
    } else if (shouldResetStreak(streak.last_completed_cycle, currentCycle)) {
      await supabase
        .from('streaks')
        .update({
          current_streak: 0,
          last_completed_cycle: currentCycle,
        })
        .eq('id', streak.id)
    }
  }
}