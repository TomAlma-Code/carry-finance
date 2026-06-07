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
      max_tokens: 1000,
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
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

export async function generateCase(conceptsSeen = [], casesDone = []) {
  const systemPrompt = `You are designing genuinely hard investment decision cases for a VC/impact investor in training.
Cases should be based on real companies and real situations. The decision should be genuinely difficult — a smart person could go either way.
Make the reader feel the weight of the decision. Include enough context that they can reason carefully.
Always respond with valid JSON only. No markdown fences, no preamble.`

  const doneNote = casesDone.length > 0 
    ? `Cases already used: ${casesDone.slice(-5).join(', ')}. Use different companies.` 
    : ''

  const prompt = `Create a real-world investment/strategy decision case for a VC and impact investor in training.

${doneNote}

The case should:
- Be based on a real company at a real decision point (can be historical — 2005-2023)
- Cover one of these domains: VC investment decision, PE turnaround, impact investing tradeoff, capital allocation, strategic pivot
- Present genuine ambiguity — a smart investor could reasonably choose either option
- Include specific numbers, market context, and founder/company details
- Reveal what actually happened and the finance lesson behind it

Return JSON with this exact shape:
{
  "id": "company-name-year",
  "company": "Company Name",
  "year": 2012,
  "domain": "VC DECISION | PE TURNAROUND | IMPACT TRADEOFF | CAPITAL ALLOCATION",
  "title": "Compelling case title",
  "context": "3-4 paragraphs of rich context. Real numbers. Real situation. The reader needs to feel like they're in the room. Make it gripping.",
  "decision": "The exact question the decision-maker faced — one clear choice between two paths",
  "optionA": {
    "label": "short label",
    "description": "2-3 sentences explaining this path and its logic"
  },
  "optionB": {
    "label": "short label", 
    "description": "2-3 sentences explaining this path and its logic"
  },
  "actualChoice": "A or B",
  "outcome": "2-3 paragraphs: what actually happened, the numbers, and why. Be specific.",
  "lessonTitle": "The finance principle this case teaches",
  "lesson": "2-3 sentences connecting the outcome to a transferable finance/investing principle"
}`

  const raw = await callClaude(prompt, systemPrompt)
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

// Pick today's concept based on what's been seen
export function pickConcept(conceptsSeen = []) {
  const unseen = CONCEPTS.filter(c => !conceptsSeen.includes(c))
  const pool = unseen.length > 0 ? unseen : CONCEPTS
  const today = new Date().toISOString().split('T')[0]
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0)
  return pool[seed % pool.length]
}
