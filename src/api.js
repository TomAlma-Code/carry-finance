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

async function callClaude(prompt, systemPrompt, maxTokens = 4000) {
  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await response.json()
  if (data.error) throw new Error(data.error.message || 'API error')
  // Concatenate all text blocks in case the response is split
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
  return text
}

// Robust JSON extraction that tolerates markdown fences, stray prose,
// and (best-effort) truncated responses.
function parseJsonLoose(raw) {
  if (!raw) return null
  let c = raw.replace(/```json|```/g, '').trim()
  const s = c.indexOf('{')
  if (s < 0) return null
  c = c.slice(s)
  // Try direct parse from first { to last }
  const e = c.lastIndexOf('}')
  if (e > 0) {
    try { return JSON.parse(c.slice(0, e + 1)) } catch {}
  }
  // Best-effort repair for truncated JSON: balance braces/brackets
  try {
    let depthCurly = 0, depthSquare = 0, inStr = false, esc = false, out = ''
    for (const ch of c) {
      out += ch
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') inStr = !inStr
      if (inStr) continue
      if (ch === '{') depthCurly++
      else if (ch === '}') depthCurly--
      else if (ch === '[') depthSquare++
      else if (ch === ']') depthSquare--
    }
    if (inStr) out += '"'
    while (depthSquare-- > 0) out += ']'
    while (depthCurly-- > 0) out += '}'
    return JSON.parse(out)
  } catch {
    return null
  }
}


export async function generateArticle(concept, conceptsSeen = []) {
  const systemPrompt = `You are a world-class finance educator writing for an ambitious person learning VC and impact investing. 
Your writing style: narrative, gripping, real. You explain finance through stories of actual companies and real people. 
No bullet points in the main body. Write like a great long-form journalist who happens to know finance deeply.
Always respond with valid JSON only. No markdown fences, no preamble.`

  const seenNote = conceptsSeen.length > 0
    ? `Concepts ALREADY covered (do not repeat or substantially overlap with ANY of these): ${conceptsSeen.join('; ')}.`
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

  const raw = await callClaude(prompt, systemPrompt, 5000)
  try {
    return parseJsonLoose(raw)
  } catch (err) {
    console.error('Article parse error:', err)
    return null
  }
}


// Ordered accounting curriculum — builds knowledge step by step.
// Lesson N assumes lessons 0..N-1 are understood.
export const ACCOUNTING_CURRICULUM = [
  'The three financial statements and how they connect',
  'Reading a balance sheet: assets, liabilities, and what equity really means',
  'The income statement: revenue recognition, COGS, and the path to net income',
  'Cash flow statement basics: operating, investing, financing',
  'Accrual vs. cash accounting: why profits and cash diverge',
  'Working capital: receivables, payables, inventory and the cash conversion cycle',
  'Depreciation and amortization: how capex flows through the statements',
  'EBITDA: what it captures, what it hides, and why investors use it',
  'Free cash flow: from EBITDA to FCF step by step',
  'Deferred revenue and contract liabilities: SaaS accounting essentials',
  'Capitalized costs vs. expenses: R&D, software, and earnings quality',
  'Goodwill and intangibles: what acquisitions do to the balance sheet',
  'Leases on the balance sheet: operating vs. finance leases after IFRS 16',
  'Stock-based compensation: the expense investors love to ignore',
  'Net working capital in M&A: pegs, adjustments, and deal mechanics',
  'Quality of earnings: spotting aggressive accounting before you invest',
  'Debt schedules: reading covenants, maturities, and interest coverage',
  'Return metrics: ROIC, ROE, ROA — computing and interpreting them',
  'Inventory accounting: FIFO, LIFO, and margin distortion',
  'Consolidation, minority interest, and equity method investments',
  'Cash flow manipulation: classic red flags in the CFO section',
  'Purchase price allocation: what happens to the books after a buyout',
  'Unit economics from the ledger: mapping GAAP lines to CAC and LTV',
  'Building a simple 3-statement model: tying it all together',
]

export async function generateAccountingArticle(lessonIndex) {
  const idx = Math.min(lessonIndex, ACCOUNTING_CURRICULUM.length - 1)
  const topic = ACCOUNTING_CURRICULUM[idx]
  const priorTopics = ACCOUNTING_CURRICULUM.slice(0, idx)

  const systemPrompt = `You are a world-class accounting and finance educator teaching an aspiring VC/PE investor.
This is lesson ${idx + 1} of a sequential curriculum. The reader has already covered: ${priorTopics.length > 0 ? priorTopics.join('; ') : 'nothing yet — this is the first lesson'}.
Build on prior lessons naturally, referencing them briefly where helpful, but never re-explain them at length.
Always connect accounting mechanics to INVESTING decisions — how a VC or PE investor uses this in diligence, valuation, or portfolio work.
Use one running real-company example with plausible numbers through the piece. Show small worked calculations inline.
Always respond with valid JSON only. No markdown fences, no preamble.`

  const prompt = `Write lesson ${idx + 1} of the accounting-for-investors curriculum: "${topic}"

Rules:
- 500-800 words, clear and progressive — this is a curriculum, so precision beats flair (but keep it engaging)
- Use ONE real or realistic company example woven through, with actual numbers the reader can follow
- Include at least one small worked calculation shown step by step in the text
- End with "How investors use this" — 2-3 sentences tying it to diligence/valuation decisions
- Assume the reader knows the prior lessons listed in the system prompt

Return JSON with this exact shape:
{
  "concept": "${topic}",
  "lessonNumber": ${idx + 1},
  "title": "clear lesson title (can include the lesson number)",
  "readTime": "5 min",
  "tag": "LEDGER \u00b7 LESSON ${idx + 1}/${ACCOUNTING_CURRICULUM.length}",
  "hook": "one sentence on why this matters for investing",
  "body": "the full lesson \u2014 500-800 words, paragraphs separated by \\n\\n",
  "keyTakeaway": "one crisp sentence"
}`

  const raw = await callClaude(prompt, systemPrompt, 5000)
  try {
    return parseJsonLoose(raw)
  } catch (err) {
    console.error('Accounting article parse error:', err)
    return null
  }
}

const CASE_STYLES = [
  {
    name: 'DEAL MATH',
    brief: 'A numbers-first decision: term sheets, round pricing, debt structures, waterfall/dilution math. The winning option is provable with arithmetic.',
    calcRole: 'The calculation fully decides the answer \u2014 show the arithmetic that proves it.'
  },
  {
    name: 'STRATEGIC JUDGMENT',
    brief: 'A strategy decision where numbers inform but do NOT decide: market entry/exit, pivot vs. persevere, build vs. buy vs. partner, founder/CEO decisions, competitive response. The best answer turns on strategic reasoning \u2014 positioning, timing, incentives, second-order effects.',
    calcRole: 'The calculation frames the stakes, but the deciding logic is strategic \u2014 explain the qualitative reasoning that tips it.'
  },
  {
    name: 'NEGOTIATION & TERMS',
    brief: 'A negotiation moment: which term to concede, counteroffer design, board seat vs. valuation tradeoffs, earnout structures, LP side letters. Winner balances economics against control, alignment, and relationship.',
    calcRole: 'Quantify what each term is worth, then weigh it against the non-financial considerations.'
  },
  {
    name: 'PORTFOLIO & TIMING',
    brief: 'A portfolio-level or timing call: reserve allocation, when to sell/secondary, follow-on into a struggling company, fund pacing, concentration risk. Winner requires thinking in portfolio math AND judgment about information/timing.',
    calcRole: 'Show the portfolio-level math (ownership, reserves, expected value), then the timing/judgment reasoning.'
  },
  {
    name: 'OPERATOR CRISIS',
    brief: 'An in-company decision under pressure: runway crunch choices, layoffs vs. bridge, pricing change, key-customer ultimatum, supply shock. The investor advises the board. Winner blends cash math with organizational and market reality.',
    calcRole: 'Show the cash/runway math, then the operational reasoning that determines the best path.'
  },
]

export async function generateCase(conceptsSeen = [], casesDone = []) {
  // Randomize which position is correct so it's not always A
  const correctSlot = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
  // Rotate case style for variety
  const style = CASE_STYLES[Math.floor(Math.random() * CASE_STYLES.length)]

  const systemPrompt = `You are designing genuinely hard investment decision cases for a VC/PE/impact investor in training.
Today's case style is "${style.name}": ${style.brief}
The reader should have to genuinely reason \u2014 with numbers where they decide, with strategic judgment where they don't.
The four options must all be plausible. A smart person should find at least two genuinely tempting. Avoid making the right answer obvious.
Always respond with valid JSON only. No markdown fences, no preamble.`

  const doneNote = casesDone.length > 0
    ? `Avoid these recently used setups: ${casesDone.slice(-6).join(', ')}.`
    : ''

  const prompt = `Create ONE small, hard, realistic investment decision case. Think of a concrete moment, not a grand story.

${doneNote}

REQUIREMENTS:
- Case style: ${style.name}. ${style.brief}
- Small in scope: ONE concrete decision at one moment in time. Not a company's whole story.
- Grounded in real-world practice, inspired by real companies/situations (2008-2024).
- Include hard numbers in the context: valuations, ownership %, revenue, growth, multiples, cash, debt terms as relevant. The reader should be able to reason with them.
- Keep context SHORT: 2 tight paragraphs maximum. Dense, no fluff.
- Provide EXACTLY 4 options (A, B, C, D), all plausible, differing in subtle but important ways. For strategy-flavored styles, options should represent genuinely different strategic logics, not just different numbers.
- The genuinely best answer must be option "${correctSlot}". Build the options so "${correctSlot}" is strongest on the merits \u2014 but the other three must be defensible enough that it's a real decision.
- Difficulty: an experienced investor should still find it genuinely hard.
- Include a "calculation" field: ${style.calcRole} One step or point per line, separated by newlines. Plain arithmetic where used (e.g. "Entry: $40M EV / $8M EBITDA = 5.0x"). For judgment-heavy cases, this block may mix key figures with short decisive reasoning lines.

Return JSON with this EXACT shape:
{
  "id": "short-slug-${Date.now().toString().slice(-5)}",
  "company": "Company or scenario name",
  "year": 2019,
  "domain": "${style.name}",
  "title": "Short, specific decision title (not a grand headline)",
  "context": "EXACTLY 2 short paragraphs, dense with real numbers and parameters. Set up the decision precisely.",
  "decision": "The precise question being decided, in one sentence.",
  "calculation": "The step-by-step math, one step per line separated by \\n. Plain arithmetic the reader can verify. Show why the best option wins on the numbers.",
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

  const raw = await callClaude(prompt, systemPrompt, 5000)
  try {
    const parsed = parseJsonLoose(raw)
    if (!parsed) return null
    // Safety: force actualChoice to the slot we asked for
    parsed.actualChoice = correctSlot
    return parsed
  } catch (err) {
    console.error("Case parse error:", err)
    return null
  }
}


// ---- TURNAROUND / SCALE-UP CASES -------------------------------------------
// Same 4-option structure as investment cases, but the decision turns on
// operating strategy for a struggling or sub-scale business, not deal math.
const TURNAROUND_STYLES = [
  {
    name: 'CASH CRISIS',
    brief: 'A business running out of money. The decision is about sequencing survival moves: what to cut, what to protect, who to talk to first, and in what order. Cash math frames the runway; judgment decides the path.'
  },
  {
    name: 'DEMAND PROBLEM',
    brief: 'Revenue has stalled or is declining. The decision is diagnostic: is this a pricing, positioning, channel, product, or market problem? The best answer identifies the true bottleneck rather than treating a symptom.'
  },
  {
    name: 'MARGIN REPAIR',
    brief: 'Revenue is fine but the business does not make money. The decision is where margin actually leaks: pricing, mix, cost-to-serve, discounting, unit costs, or overhead. Winner fixes the structural cause.'
  },
  {
    name: 'SCALING BOTTLENECK',
    brief: 'A small but healthy business that cannot grow past a ceiling. The constraint may be founder dependency, ops capacity, hiring, systems, or concentration. Winner removes the true binding constraint.'
  },
  {
    name: 'PEOPLE & OWNERSHIP',
    brief: 'The problem is organizational: a founder who cannot let go, a wrong-fit key hire, a broken incentive structure, family-business succession, or a demoralized team. Winner addresses the human system driving performance.'
  },
  {
    name: 'CUSTOMER CONCENTRATION',
    brief: 'The business depends on one or a few customers, channels, or suppliers. The decision balances protecting near-term revenue against reducing structural fragility.'
  },
]

export async function generateTurnaroundCase(turnaroundsDone = []) {
  const correctSlot = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
  const style = TURNAROUND_STYLES[Math.floor(Math.random() * TURNAROUND_STYLES.length)]

  const systemPrompt = `You are designing realistic turnaround and scale-up decision cases for someone learning to fix and grow real businesses.
Today's case type is "${style.name}": ${style.brief}
These are OPERATING decisions, not investment decisions. There is no cap table, no term sheet, no IRR. The reader is effectively the owner, CEO, or operating partner deciding what to actually DO on Monday morning.
Numbers set the scene and constrain the choices, but the decision is won or lost on operating judgment: diagnosing the real problem, sequencing correctly, and understanding second-order effects on customers, staff, and cash.
The four options must all be plausible. At least two should be genuinely tempting. Avoid making the right answer obvious.
Always respond with valid JSON only. No markdown fences, no preamble.`

  const doneNote = turnaroundsDone.length > 0
    ? `Avoid reusing these recent setups: ${turnaroundsDone.slice(-6).join(', ')}.`
    : ''

  const prompt = `Create ONE realistic turnaround-or-scale decision case for a small or mid-sized business.

${doneNote}

REQUIREMENTS:
- Case type: ${style.name}. ${style.brief}
- The business should be small-to-midsize and relatable: e.g. a 40-person manufacturer, a regional services firm, a 12-location restaurant group, a niche SaaS at 2M ARR, a family wholesaler, a specialty retailer, a logistics operator, a clinic group.
- ONE concrete decision at ONE moment. Not the company's whole history.
- The intro MUST include concrete numbers so the reader can reason: revenue, growth or decline %, gross margin, EBITDA or losses, cash on hand, monthly burn, headcount, customer counts/concentration, churn, utilization, or whatever fits the situation. Use 5-8 specific figures.
- Keep context SHORT: exactly 2 tight paragraphs, dense with facts, no storytelling fluff.
- The decision must be about OPERATING STRATEGY: what to do, in what order, and why. NOT valuation, dilution, or deal structuring.
- Provide EXACTLY 4 options (A, B, C, D). Each must represent a genuinely different operating logic (e.g. cut cost vs. reprice vs. refocus segment vs. renegotiate terms) — not four versions of the same move.
- The genuinely best answer must be option "${correctSlot}". Make "${correctSlot}" strongest on the merits, but the other three must be defensible enough that a smart operator could pick them.
- Difficulty: an experienced operator should still find it genuinely hard.
- The "calculation" field here is a DIAGNOSIS block, not heavy math: 4-7 short lines mixing the few figures that matter with the decisive reasoning (e.g. "Runway: 380k cash / 95k burn = 4.0 months", "Top 2 customers = 61% of revenue -> cutting sales headcount risks the base", "Gross margin 34% vs. 51% industry -> problem is pricing, not volume"). One point per line, separated by newlines.

Return JSON with this EXACT shape:
{
  "id": "turn-slug-${Date.now().toString().slice(-5)}",
  "company": "Business name or descriptor",
  "year": 2021,
  "domain": "${style.name}",
  "title": "Short, specific decision title",
  "context": "EXACTLY 2 short paragraphs, dense with the operating numbers listed above.",
  "decision": "The precise operating question being decided, in one sentence.",
  "calculation": "4-7 diagnosis lines separated by \\n, mixing key figures with the decisive reasoning.",
  "options": {
    "A": { "label": "short label", "description": "1-2 sentences describing this operating move and its logic" },
    "B": { "label": "short label", "description": "1-2 sentences describing this operating move and its logic" },
    "C": { "label": "short label", "description": "1-2 sentences describing this operating move and its logic" },
    "D": { "label": "short label", "description": "1-2 sentences describing this operating move and its logic" }
  },
  "actualChoice": "${correctSlot}",
  "outcome": "2 short paragraphs: what happened, with specific numbers showing the result. Explain why ${correctSlot} worked and precisely why the most tempting alternative would have failed or underperformed.",
  "lessonTitle": "The transferable operating principle (short)",
  "lesson": "1-2 sentences on the reusable turnaround/scaling principle."
}`

  const raw = await callClaude(prompt, systemPrompt, 5000)
  try {
    const parsed = parseJsonLoose(raw)
    if (!parsed) return null
    parsed.actualChoice = correctSlot
    return parsed
  } catch (err) {
    console.error('Turnaround case parse error:', err)
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
