// Client side: talks only to our own /api/content endpoint.
import { getUserId } from './supabase'

export const TOTAL_CONCEPTS = 30

export function localDate() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in the phone's own time zone
}

async function post(body) {
  const res = await fetch('/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: getUserId(), ...body }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

// Today's bundle. Releases a new one from the weekly queue only when the app is opened.
export const fetchToday = () => post({ action: 'today', date: localDate() })

// Collects a finished weekly batch or starts a new one when the queue runs low. Fire and forget.
export const maintainQueue = () => post({ action: 'maintain' }).catch(() => {})

export const fetchFeedback = (caseData, choice, reasoning) =>
  post({ action: 'feedback', caseData, choice, reasoning })
