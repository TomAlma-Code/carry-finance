// Content engine.
// - Content is made in weekly batches (Anthropic Message Batches API: half price).
// - One bundle (article + case + turnaround) is released per day, and only when the app is opened.
//   Days you skip don't use up content: the queue just waits.
// - The browser can only ask for fixed actions; it can't send its own prompts or pick a model.
import { createClient } from '@supabase/supabase-js'
import { getLibraryCase } from './_lib/library.js'
import {
  MODEL, CASE_STYLES, TURNAROUND_STYLES,
  articleRequest, caseRequest, realTurnaroundRequest, fictionalTurnaroundRequest, feedbackRequest,
  parseJsonLoose, normaliseCase, pickConcepts, pickTurnaroundKeys, randomFrom,
} from './_lib/prompts.js'

const SUPA_URL = process.env.SUPABASE_URL || 'https://bxjsrnzuopvngijnmfob.supabase.co'
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4anNybnp1b3B2bmdpam5tZm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MjEyMDIsImV4cCI6MjA5NjM5NzIwMn0.f_pCJp3EQmstRJcEXkcnP1czDh35aKpkjruq6oAY9fI'
const db = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } })

let WEEK = Number(process.env.CARRY_WEEK) || 7  // bundles per batch
const REFILL_BELOW = 3  // start a new batch when fewer than this many bundles are waiting
const API = 'https://api.anthropic.com/v1'

// ---------------------------------------------------------------------------
async function apiKey() {
  // Preferred: Vercel environment variable. Fallback: old config table (to be removed).
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  const { data } = await db.from('config').select('value').eq('key', 'ak').maybeSingle()
  if (!data?.value) throw new Error('Anthropic API key not configured')
  return data.value
}

async function anthropic(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-api-key': await apiKey(), 'anthropic-version': '2023-06-01' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data; try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    const msg = data?.error?.message || String(text).slice(0, 300)
    if (/credit balance|billing|quota/i.test(msg)) throw new Error('Anthropic API credits have run out. Top up at console.anthropic.com under Plans & Billing, then tap Try again.')
    throw new Error(msg)
  }
  return data
}

function params(req) {
  return { model: MODEL, max_tokens: req.maxTokens, system: req.system, messages: [{ role: 'user', content: req.prompt }] }
}

function textOf(message) {
  return (message?.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
}

async function callNow(req) {
  return textOf(await anthropic('/messages', { method: 'POST', body: params(req) }))
}

// ---------------------------------------------------------------------------
// Planning: decide what goes into the next N bundles, avoiding repeats.
async function usedSoFar(userId) {
  const [{ data: rows }, { data: batches }, { data: prog }] = await Promise.all([
    db.from('content_queue').select('concept, turnaround_key, case_json->>title').eq('user_id', userId),
    db.from('content_batches').select('plan').eq('user_id', userId).eq('status', 'pending'),
    db.from('progress').select('concepts_seen').eq('user_id', userId).maybeSingle(),
  ])
  const concepts = new Set(prog?.concepts_seen || [])
  const keys = new Set()
  const titles = []
  for (const r of rows || []) {
    if (r.concept) concepts.add(r.concept)
    if (r.turnaround_key) keys.add(r.turnaround_key)
    if (r.title) titles.push(r.title)
  }
  for (const b of batches || []) for (const p of b.plan || []) {
    if (p.concept) concepts.add(p.concept)
    if (p.turnaroundKey) keys.add(p.turnaroundKey)
  }
  return { concepts: [...concepts], keys: [...keys], titles }
}

function planBundles(used, n) {
  const concepts = pickConcepts(used.concepts, n)
  const keys = pickTurnaroundKeys(used.keys, n)
  return Array.from({ length: n }, (_, i) => ({
    concept: concepts[i],
    caseStyle: randomFrom(CASE_STYLES).name,
    turnaroundKey: keys[i],
    turnStyle: randomFrom(TURNAROUND_STYLES).name,
  }))
}

function requestsFor(plan, titles) {
  const style = CASE_STYLES.find(s => s.name === plan.caseStyle) || CASE_STYLES[0]
  const entry = plan.turnaroundKey ? getLibraryCase(plan.turnaroundKey) : null
  const turnStyle = TURNAROUND_STYLES.find(s => s.name === plan.turnStyle) || TURNAROUND_STYLES[0]
  return {
    article: articleRequest(plan.concept),
    case: caseRequest(style, titles),
    turn: entry ? realTurnaroundRequest(entry) : fictionalTurnaroundRequest(turnStyle, titles),
  }
}

function logFail(what, raw, out) {
  if (!out) console.error(`[carry] ${what} failed to parse. Length ${raw?.length || 0}. Tail: ${String(raw || '').slice(-400)}`)
  return out
}

function buildBundle(plan, raw) {
  const article = logFail('article', raw.article, parseJsonLoose(raw.article))
  if (article && plan.concept) article.concept = plan.concept
  const kase = logFail('case', raw.case, normaliseCase(parseJsonLoose(raw.case), { kind: 'scenario' }))
  const entry = plan.turnaroundKey ? getLibraryCase(plan.turnaroundKey) : null
  const turn = logFail('turnaround', raw.turn, normaliseCase(parseJsonLoose(raw.turn), entry
    ? { kind: 'real', country: entry.country, sources: entry.sources, id: `real-${entry.key}` }
    : { kind: 'scenario' }))
  return { article, kase, turn, entry }
}

function queueRow(userId, plan, b, extra = {}) {
  return {
    user_id: userId,
    article_json: b.article,
    case_json: b.kase,
    turnaround_json: b.turn,
    concept: plan.concept,
    turnaround_key: b.turn && b.entry ? b.entry.key : null, // only "use up" a library case if it parsed
    ...extra,
  }
}

// ---------------------------------------------------------------------------
// Weekly batch: create, and collect when finished.
async function startBatch(userId) {
  // Claim the slot first so two app opens can't start two batches (unique index on pending).
  const { data: claim, error } = await db.from('content_batches')
    .insert({ user_id: userId, status: 'pending', plan: [] }).select().single()
  if (error) return { started: false, reason: 'batch already pending' }
  try {
    const used = await usedSoFar(userId)
    const plans = planBundles(used, WEEK)
    const requests = []
    plans.forEach((p, i) => {
      const r = requestsFor(p, used.titles)
      requests.push({ custom_id: `b${i}-article`, params: params(r.article) })
      requests.push({ custom_id: `b${i}-case`, params: params(r.case) })
      requests.push({ custom_id: `b${i}-turn`, params: params(r.turn) })
    })
    const batch = await anthropic('/messages/batches', { method: 'POST', body: { requests } })
    await db.from('content_batches').update({ anthropic_batch_id: batch.id, plan: plans }).eq('id', claim.id)
    return { started: true, batchId: batch.id }
  } catch (e) {
    await db.from('content_batches').update({ status: 'failed', error: String(e.message || e) }).eq('id', claim.id)
    throw e
  }
}

async function collectBatch(userId) {
  const { data: pending } = await db.from('content_batches').select('*')
    .eq('user_id', userId).eq('status', 'pending').maybeSingle()
  if (!pending) return { pending: false }
  if (!pending.anthropic_batch_id) {
    // A claim that never got a batch id (crashed) — clear it after 10 minutes.
    if (Date.now() - new Date(pending.created_at).getTime() > 10 * 60 * 1000) {
      await db.from('content_batches').update({ status: 'failed', error: 'no batch id' }).eq('id', pending.id)
    }
    return { pending: true }
  }
  const batch = await anthropic(`/messages/batches/${pending.anthropic_batch_id}`)
  if (batch.processing_status !== 'ended') return { pending: true, status: batch.processing_status }

  const res = await fetch(batch.results_url, { headers: { 'x-api-key': await apiKey(), 'anthropic-version': '2023-06-01' } })
  const lines = (await res.text()).split('\n').filter(Boolean)
  const out = {}
  for (const line of lines) {
    try {
      const r = JSON.parse(line)
      if (r.result?.type === 'succeeded') out[r.custom_id] = textOf(r.result.message)
    } catch {}
  }
  const rows = []
  ;(pending.plan || []).forEach((plan, i) => {
    const b = buildBundle(plan, { article: out[`b${i}-article`], case: out[`b${i}-case`], turn: out[`b${i}-turn`] })
    if (b.article && (b.kase || b.turn)) rows.push(queueRow(userId, plan, b, { batch_id: pending.anthropic_batch_id }))
  })
  if (rows.length) await db.from('content_queue').insert(rows)
  await db.from('content_batches').update({ status: 'done', ended_at: new Date().toISOString(), bundles: rows.length }).eq('id', pending.id)
  return { pending: false, added: rows.length }
}

// ---------------------------------------------------------------------------
// Today: return today's bundle, releasing the next one from the queue if needed.
async function releasedFor(userId, date) {
  const { data } = await db.from('content_queue').select('*').eq('user_id', userId).eq('released_on', date).maybeSingle()
  return data
}

async function releaseNext(userId, date) {
  const { data: next } = await db.from('content_queue').select('id')
    .eq('user_id', userId).eq('status', 'queued').order('created_at').limit(1).maybeSingle()
  if (!next) return null
  const { error } = await db.from('content_queue')
    .update({ status: 'released', released_on: date }).eq('id', next.id).eq('status', 'queued')
  if (error) return releasedFor(userId, date) // another open already released today's
  return releasedFor(userId, date)
}

async function generateOneNow(userId, date) {
  const used = await usedSoFar(userId)
  const [plan] = planBundles(used, 1)
  const r = requestsFor(plan, used.titles)
  const retry = async (req) => { try { return await callNow(req) } catch (e) { if (/credits/.test(e.message)) throw e; return callNow(req) } }
  const [a, c, t] = await Promise.all([retry(r.article), retry(r.case), retry(r.turn)])
  const b = buildBundle(plan, { article: a, case: c, turn: t })
  if (!b.kase) b.kase = normaliseCase(parseJsonLoose(await callNow(r.case).catch(() => '')), { kind: 'scenario' })
  if (!b.turn) b.turn = buildBundle(plan, { turn: await callNow(r.turn).catch(() => '') }).turn
  if (!b.article || (!b.kase && !b.turn)) throw new Error('Content generation failed. Tap Try again.')
  const { error } = await db.from('content_queue').insert(queueRow(userId, plan, b, { status: 'released', released_on: date }))
  if (error) { const existing = await releasedFor(userId, date); if (existing) return existing; throw new Error(error.message) }
  return releasedFor(userId, date)
}

async function today(userId, date) {
  let row = await releasedFor(userId, date)
  if (!row) row = await releaseNext(userId, date)
  if (!row) { await collectBatch(userId).catch(() => {}); row = await releaseNext(userId, date) }
  if (!row) row = await generateOneNow(userId, date) // first run, or the batch isn't ready yet
  const { count } = await db.from('content_queue').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('status', 'queued')
  return { bundle: { id: row.id, article: row.article_json, case: row.case_json, turnaround: row.turnaround_json }, queued: count || 0 }
}

async function maintain(userId) {
  const collected = await collectBatch(userId)
  if (collected.pending) return collected
  const { count } = await db.from('content_queue').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('status', 'queued')
  if ((count || 0) < REFILL_BELOW) return { queued: count, ...(await startBatch(userId)) }
  return { queued: count, ...collected }
}

async function feedback(userId, caseData, choice, reasoning) {
  if (!caseData?.options || !choice || !reasoning) throw new Error('Missing input')
  const text = await callNow(feedbackRequest(caseData, choice, String(reasoning).slice(0, 2000)))
  const { data: last } = await db.from('decisions').select('id')
    .eq('user_id', userId).eq('case_id', caseData.id).order('decided_at', { ascending: false }).limit(1).maybeSingle()
  if (last) await db.from('decisions').update({ feedback: text }).eq('id', last.id)
  return { feedback: text }
}

// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  // TEMP: preview-only self test via GET (removed before merge)
  if (req.method === 'GET' && process.env.VERCEL_ENV === 'preview' && req.query?.selftest) {
    req.body = { action: req.query.action, userId: 'selftest_tmp', date: req.query.date || '2026-11-11' }
    if (req.query.week) WEEK = Number(req.query.week)
  } else if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const { action, userId, date } = body || {}
  if (!userId || !/^[a-z0-9_]{4,40}$/i.test(userId)) return res.status(400).json({ error: 'Bad user' })
  try {
    if (action === 'today') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ error: 'Bad date' })
      return res.status(200).json(await today(userId, date))
    }
    if (action === 'maintain') return res.status(200).json(await maintain(userId))
    if (action === 'feedback') return res.status(200).json(await feedback(userId, body.caseData, body.choice, body.reasoning))
    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) })
  }
}
