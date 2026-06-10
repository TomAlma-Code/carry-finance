const ANTHROPIC_API = '/api/generate'

// Rotating concept curriculum — ensures breadth over time
export const CONCEPTS = [
  // VC core
  'IRR (Internal Rate of Return) in venture capital',
  'The J-curve in private equity fund performance',
  'Power law returns and portfolio construction in VC',
  'Cap table management and dilution across funding rounds',
  'Term sheet economics: liquidation preferences and their real impact',
  'Carried interest mechanics and GP alignment',
  'Fund of funds structure and LP economics',
  'Anti-dilution provisions: broad-based vs. ratchet',
  'Board composition and control dynamics in VC-backed companies',
  'Secondary markets in private equity',
  // PE / turnaround
  'LBO mechanics: how leverage amplifies equity returns',
  'EBITDA multiple expansion as a PE return driver',
  'Operational value creation in private equity buyouts',
  'Covenant-lite debt and its implications for PE deals',
  'Turnaround strategy: cash flow stabilization in distressed companies',
  'Working capital optimization in PE portfolio companies',
  'Buy-and-build acquisition strategies in private equity',
  'Management incentive packages in buyout deals',
  // Finance fundamentals
  'Free cash flow vs. net income: why VCs obsess over FCF',
  'Unit economics: CAC, LTV, and payback period',
  'Revenue quality: recurring vs. transactional and valuation implications',
  'Capital allocation decisions: reinvest vs. return to investors',
  'Valuation methods: DCF, comparables, and precedent transactions',
  'MOIC vs. IRR: when each metric tells a different story',
  'Gross margin and its signal about business model quality',
  'Burn rate, runway, and the psychology of startup survival',
  // Impact investing
  'Impact measurement frameworks: IRIS+ and theory of change',
  'Blended finance: catalytic capital and concessionary returns',
  'ESG integration vs. impact investing: a critical distinction',
  'Impact multiples of money (IMM) as a returns framework',
]

async function callClaude(prompt, systemPrompt) {
  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await response.json()
  return data.content?.[0]?.text || ''
}

export async function generateArticle(concept, conceptsSeen = []) {
  const systemPrompt = `You are a world-class finance educator writing for an ambitious person learning VC and impact investing. 
Your writing style: narrative, gripping, real. You explain finance through stories of actual companies and real people. 
No bullet points in the main body. Write like a great long-form journalist who happens to know finance deeply.
Always respond with valid JSON only. No markdown fences, no preamble.`

  const seenNote = conceptsSeen.length > 0 
    ? `Concepts already covered: ${conceptsSeen.slice(-8).join(', ')}. Don't repeat these.` 
    : ''

  const prompt = `Write a 5-7 minute read explaining the finance concept: "${concept}"

${seenNote}

Rules:
- Open with a gripping real-world story or moment (a specific company, founder, deal, or crisis)
- Weave the concept explanation naturally through the narrative
- Use at least 2 real company examples (name actual companies, actual numbers where known)
- End with a "Why this matters for you" paragraph connecting to VC/impact investing decisions
- Make it genuinely engaging — this person reads it every morning

Return JSON with this exact shape:
{
  "concept": "${concept}",
  "title": "punchy headline (not the concept name, but an angle on it)",
  "readTime": "6 min",
  "tag": "one of: VC FUNDAMENTALS | PE & BUYOUTS | IMPACT | TURNAROUND | FUND MECHANICS",
  "hook": "one sentence that makes you want to read — appears before the article",
  "body": "the full article — 600-900 words, paragraphs separated by \\n\\n, no bullet points",
  "keyTakeaway": "one crisp sentence — the single most important thing to remember"
}`

  const raw = await callClaude(prompt, systemPrompt)
  try {
    const c=raw.replace(/```json|```/g,"").trim();const s=c.indexOf("{");const e=c.lastIndexOf("}");if(s<0||e<0)return null;return JSON.parse(c.slice(s,e+1))
  } catch {
    return null
  }
}

export async function generateCase(conceptsSeen = [], casesDone = []) {
  // Randomize which position is correct so it's not always A
  const correctSlot = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]

  const systemPrompt = `You are designing genuinely hard, technical investment decision cases for a VC/PE/impact investor in training.
These are NOT big famous narrative stories. They are small, specific, numbers-driven decisions of the kind a junior investor faces weekly.
The reader should have to actually reason with the numbers — multiples, dilution, IRR, ownership math, unit economics, debt terms.
The four options must all be plausible. A smart person should find at least two genuinely tempting. Avoid making the right answer obvious.
Always respond with valid JSON only. No markdown fences, no preamble.`

  const doneNote = casesDone.length > 0
    ? `Avoid these recently used setups: ${casesDone.slice(-6).join(', ')}.`
    : ''

  const prompt = `Create ONE small, hard, realistic investment decision case. Think of a concrete moment, not a grand story.

${doneNote}

REQUIREMENTS:
- Small in scope: a single decision a real investor/operator faced (e.g. "accept this term sheet or counter", "which of these debt structures", "exercise pro-rata or not", "price this round at X or Y").
- Grounded in real-world practice. Can be inspired by real companies/situations (2008-2024) but the focus is the DECISION MATH, not the company's life story.
- MUST include hard numbers in the context: valuations, ownership %, revenue, growth rates, multiples, dilution, IRR/MOIC, debt terms, etc. The reader should be able to do back-of-envelope math.
- Keep context SHORT: 2 tight paragraphs maximum. Dense with parameters, not narrative fluff.
- Provide EXACTLY 4 options (A, B, C, D), all plausible, differing in subtle but important ways.
- The genuinely best/what-actually-happened answer must be option "${correctSlot}". Build the options so that "${correctSlot}" is the strongest choice on the merits — but make the other three defensible enough that it's a real decision.
- Difficulty: an experienced investor should still find it genuinely hard.

Return JSON with this EXACT shape:
{
  "id": "short-slug-${Date.now().toString().slice(-5)}",
  "company": "Company or scenario name",
  "year": 2019,
  "domain": "VC DECISION | PE TURNAROUND | IMPACT TRADEOFF | CAPITAL ALLOCATION",
  "title": "Short, specific decision title (not a grand headline)",
  "context": "EXACTLY 2 short paragraphs, dense with real numbers and parameters. Set up the decision precisely.",
  "decision": "The precise question being decided, in one sentence.",
  "options": {
    "A": { "label": "short label", "description": "1-2 sentences with the specific logic/numbers of this choice" },
    "B": { "label": "short label", "description": "1-2 sentences with the specific logic/numbers of this choice" },
    "C": { "label": "short label", "description": "1-2 sentences with the specific logic/numbers of this choice" },
    "D": { "label": "short label", "description": "1-2 sentences with the specific logic/numbers of this choice" }
  },
  "actualChoice": "${correctSlot}",
  "outcome": "2 short paragraphs: what the numbers actually implied and what happened. Reference the specific figures. Explain why ${correctSlot} was right and why the tempting alternatives fell short.",
  "lessonTitle": "The transferable principle (short)",
  "lesson": "1-2 sentences connecting to a reusable investing principle."
}`

  const raw = await callClaude(prompt, systemPrompt)
  try {
    const c = raw.replace(/```json|```/g, "").trim()
    const s = c.indexOf("{"); const e = c.lastIndexOf("}")
    if (s < 0 || e < 0) return null
    const parsed = JSON.parse(c.slice(s, e + 1))
    // Safety: force actualChoice to the slot we asked for
    parsed.actualChoice = correctSlot
    return parsed
  } catch (err) {
    console.error("Case parse error:", err)
    return null
  }
}

export function pickConcept(conceptsSeen = []) {
  const unseen = CONCEPTS.filter(c => !conceptsSeen.includes(c))
  const pool = unseen.length > 0 ? unseen : CONCEPTS
  const today = new Date().toISOString().split('T')[0]
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0)
  return pool[seed % pool.length]
}
