import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// User ID — single user app, stored in localStorage
export function getUserId() {
  let id = localStorage.getItem('carry_user_id')
  if (!id) {
    id = 'user_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('carry_user_id', id)
  }
  return id
}

// Load user progress
export async function loadProgress() {
  const userId = getUserId()
  const { data } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

// Save/update progress
export async function saveProgress(updates) {
  const userId = getUserId()
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('progress')
    .select('id, streak, last_active, xp')
    .eq('user_id', userId)
    .single()

  if (existing) {
    const lastDate = existing.last_active
    const isConsecutive = lastDate && 
      (new Date(today) - new Date(lastDate)) / 86400000 <= 1

    const newStreak = lastDate === today 
      ? existing.streak 
      : isConsecutive 
        ? existing.streak + 1 
        : 1

    await supabase
      .from('progress')
      .update({ ...updates, streak: newStreak, last_active: today })
      .eq('user_id', userId)

    return { ...existing, ...updates, streak: newStreak, last_active: today }
  } else {
    const fresh = { user_id: userId, xp: 0, streak: 1, last_active: today, concepts_seen: [], cases_done: [], ...updates }
    await supabase.from('progress').insert(fresh)
    return fresh
  }
}

// Save a completed case decision
export async function saveDecision(caseId, decision, wasCorrect) {
  const userId = getUserId()
  await supabase.from('decisions').insert({
    user_id: userId,
    case_id: caseId,
    decision,
    was_correct: wasCorrect,
    decided_at: new Date().toISOString()
  })
}

// Load today's content (article + case) - cache in supabase to avoid regenerating
export async function loadTodayContent() {
  const today = new Date().toISOString().split('T')[0]
  const userId = getUserId()

  const { data } = await supabase
    .from('daily_content')
    .select('*')
    .eq('date', today)
    .eq('user_id', userId)
    .single()

  return data
}

export async function saveTodayContent(content) {
  const today = new Date().toISOString().split('T')[0]
  const userId = getUserId()

  await supabase.from('daily_content').upsert({
    date: today,
    user_id: userId,
    ...content,
    created_at: new Date().toISOString()
  }, { onConflict: 'date,user_id' })
}
