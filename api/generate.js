// Server-side proxy. Fetches Claude API key from Supabase config table at runtime.
const SUPA_URL = 'https://bxjsrnzuopvngijnmfob.supabase.co'
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4anNybnp1b3B2bmdpam5tZm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MjEyMDIsImV4cCI6MjA5NjM5NzIwMn0.f_pCJp3EQmstRJcEXkcnP1czDh35aKpkjruq6oAY9fI'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Get the Claude key from Supabase (stored securely server-side)
    const cfgRes = await fetch(`${SUPA_URL}/rest/v1/config?key=eq.ak&select=value`, {
      headers: { apikey: SUPA_ANON, Authorization: `Bearer ${SUPA_ANON}` }
    })
    const cfg = await cfgRes.json()
    const key = Array.isArray(cfg) && cfg[0] ? cfg[0].value : null
    if (!key) return res.status(500).json({ error: 'API key not found in config' })

    let body = req.body
    if (typeof body === 'string') body = JSON.parse(body)
    if (isSelfTest) body = { model: 'claude-sonnet-4-20250514', max_tokens: 30, messages: [{ role: 'user', content: 'Reply with the single word: OK' }] }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) })
  }
}
