// All prompt building and output parsing lives on the server.
import { TURNAROUND_LIBRARY } from './library.js'

export const MODEL = 'claude-sonnet-5-5'

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

const JSON_RULE = 'Always respond with valid JSON only. No markdown fences, no preamble.'

// Shared option format: an array of 4 options plus the index of the best one.
// The server shuffles them into A-D afterwards, so the model never has to "hide" the answer.
const OPTIONS_SHAPE = `"options": [
    { "label": "short label", "description": "1-2 sentences with the specific logic and numbers of this choice" },
    { "label": "...", "description": "..." },
    { "label": "...", "description": "..." },
    { "label": "...", "description": "..." }
  ],
  "bestIndex": 0`

// ---- ARTICLE ----------------------------------------------------------------
export function articleRequest(concept, conceptsSeen = []) {
  const system = `You are a world-class finance educator writing for an ambitious person learning VC and impact investing.
Your writing style: narrative, gripping, real. You explain finance through stories of actual companies and real people.
No bullet points in the main body. Write like a great long-form journalist who happens to know finance deeply.
Only use real numbers you are confident about; if unsure, describe the order of magnitude instead of inventing a figure.
${JSON_RULE}`
  const seen = conceptsSeen.length ? `Concepts ALREADY covered (do not repeat or overlap with ANY of these): ${conceptsSeen.join('; ')}.` : ''
  const prompt = `Write a 5-7 minute read explaining the finance concept: "${concept}"

${seen}

Rules:
- Open with a gripping real-world story or moment (a specific company, founder, deal, or crisis)
- Weave the concept explanation naturally through the narrative
- Use at least 2 real company examples (name actual companies, actual numbers where known)
- End with a "Why this matters for you" paragraph connecting to VC/impact investing decisions

Return JSON with this exact shape:
{
  "concept": ${JSON.stringify(concept)},
  "title": "punchy headline (not the concept name, but an angle on it)",
  "readTime": "6 min",
  "tag": "one of: VC FUNDAMENTALS | PE & BUYOUTS | IMPACT | TURNAROUND | FUND MECHANICS",
  "hook": "one sentence that makes you want to read",
  "body": "the full article, 600-900 words, paragraphs separated by \\n\\n, no bullet points",
  "keyTakeaway": "one crisp sentence"
}`
  return { system, prompt, maxTokens: 8000 }
}

// ---- INVESTMENT CASE (realistic scenario) -----------------------------------
export const CASE_STYLES = [
  { name: 'DEAL MATH', brief: 'A numbers-first decision: term sheets, round pricing, debt structures, waterfall/dilution math. The winning option is provable with arithmetic.', calcRole: 'The calculation fully decides the answer; show the arithmetic that proves it.' },
  { name: 'STRATEGIC JUDGMENT', brief: 'A strategy decision where numbers inform but do NOT decide: market entry/exit, pivot vs. persevere, build vs. buy vs. partner, founder/CEO decisions. The best answer turns on positioning, timing, incentives, second-order effects.', calcRole: 'The calculation frames the stakes, but the deciding logic is strategic.' },
  { name: 'NEGOTIATION & TERMS', brief: 'A negotiation moment: which term to concede, counteroffer design, board seat vs. valuation, earnouts, LP side letters.', calcRole: 'Quantify what each term is worth, then weigh it against control, alignment and relationship.' },
  { name: 'PORTFOLIO & TIMING', brief: 'A portfolio or timing call: reserve allocation, when to sell, follow-on into a struggling company, concentration risk.', calcRole: 'Show the portfolio math (ownership, reserves, expected value), then the timing judgment.' },
  { name: 'OPERATOR CRISIS', brief: 'An in-company decision under pressure: runway crunch, layoffs vs. bridge, pricing change, key-customer ultimatum. The investor advises the board.', calcRole: 'Show the cash/runway math, then the operational reasoning.' },
]

export function caseRequest(style, recentTitles = []) {
  const system = `You design hard, realistic investment decision cases for someone training as a VC/PE/impact investor (seed-stage Dutch hardware/deeptech fund experience).
Today's case style is "${style.name}": ${style.brief}
Realism rules: the reader gets a role, a date, and only the information a real investor would have at that moment, including the messy parts (incomplete data, a founder's spin, a deadline).
The four options must all be plausible; a smart person should find at least two tempting.
${JSON_RULE}`
  const avoid = recentTitles.length ? `Avoid these recently used setups: ${recentTitles.slice(-8).join(' | ')}.` : ''
  const prompt = `Create ONE small, hard, realistic investment decision case. One concrete moment, not a company's whole story.

${avoid}

REQUIREMENTS:
- Style: ${style.name}. ${style.brief}
- It is a realistic scenario (fictional company), set in Europe, 2015-2025, inspired by how such situations really go.
- Give the reader a ROLE (e.g. "You are the lead partner on the board") and an AS-OF date.
- Context: exactly 2 short dense paragraphs.
- Put the key numbers in an EXHIBIT of 4-7 rows (label + value), like a slide in an IC memo.
- Exactly 4 options that differ in real logic, not just numbers.
- "calculation": ${style.calcRole} One step per line, separated by \\n. Plain arithmetic the reader can check.
- Make sure the arithmetic is correct. Double-check every number.

Return JSON with this EXACT shape:
{
  "company": "Company name",
  "year": 2021,
  "asOf": "Month YYYY",
  "role": "You are ...",
  "domain": "${style.name}",
  "title": "Short, specific decision title",
  "context": "2 short paragraphs separated by \\n\\n",
  "exhibit": [ { "label": "Post-money valuation", "value": "€24m" } ],
  "decision": "The precise question in one sentence.",
  ${OPTIONS_SHAPE},
  "calculation": "step-by-step lines separated by \\n",
  "outcome": "2 short paragraphs: what the numbers implied and how this kind of situation typically plays out. Explain why the best option wins and why the most tempting alternative falls short.",
  "lessonTitle": "The transferable principle (short)",
  "lesson": "1-2 sentences connecting to a reusable investing principle."
}`
  return { system, prompt, maxTokens: 8000 }
}

// ---- TURNAROUND: REAL CASE FROM LIBRARY --------------------------------------
export function realTurnaroundRequest(entry) {
  const hindsightRule = entry.hindsight === 'real-was-best'
    ? 'The option that matches what the company really did is the BEST answer.'
    : entry.hindsight === 'better-existed'
      ? `What the company really did was NOT the best answer. The best option is: ${entry.betterNote} Include the real choice as one of the 4 options (it should look tempting), and set "realIndex" to it.`
      : `This decision is contested. ${entry.betterNote || ''} Pick the option best supported by the facts known at the time, set "realIndex" to what the company actually did, and in "whyBest" explain honestly why it is debatable.`

  const system = `You turn REAL historical business situations into decision cases for someone learning turnarounds and investing.
Hard rules:
- Use ONLY the facts provided for numbers. Never invent figures. If a number is not in the facts, leave it out or describe it in words.
- The situation and exhibit may only contain what was known on the as-of date. No spoilers in the context, exhibit, decision or options.
- The other options must be realistic alternatives that were actually on the table or debated at the time (e.g. sell the company, break it up, raise debt, cut deeper, do nothing).
- Write in clear, concrete English. No buzzwords.
${JSON_RULE}`

  const prompt = `REAL CASE
Company: ${entry.company} (${entry.country})
As of: ${entry.asOf}
Role: ${entry.role}
Decision: ${entry.decision}

FACTS KNOWN AT THE TIME:
${entry.facts.map(f => '- ' + f).join('\n')}

WHAT THEY ACTUALLY DID:
${entry.realChoice}

WHAT HAPPENED AFTER:
${entry.outcome}

ANSWER KEY: ${hindsightRule}

Write the case. Return JSON with this EXACT shape:
{
  "company": ${JSON.stringify(entry.company)},
  "year": ${entry.year},
  "asOf": ${JSON.stringify(entry.asOf)},
  "role": ${JSON.stringify(entry.role)},
  "domain": ${JSON.stringify(entry.domain)},
  "title": "Short, specific decision title (no spoiler)",
  "context": "2 short paragraphs separated by \\n\\n, only what was known at the as-of date",
  "exhibit": [ { "label": "...", "value": "..." } ],
  "decision": "The precise question in one sentence.",
  ${OPTIONS_SHAPE},
  "realIndex": 0,
  "calculation": "4-7 diagnosis lines separated by \\n mixing the key facts with the reasoning that decides it",
  "outcome": "2 short paragraphs: what they actually did and what happened, with the real numbers from the facts.",
  "whyBest": "2-3 sentences: why the best option is best, and why the most tempting alternative falls short.",
  "lessonTitle": "The transferable principle (short)",
  "lesson": "1-2 sentences on the reusable turnaround principle."
}
The exhibit should have 4-6 rows taken from the facts.`
  return { system, prompt, maxTokens: 8000 }
}

// ---- TURNAROUND: FICTIONAL SME FALLBACK ----------------------------------------
export const TURNAROUND_STYLES = [
  { name: 'CASH CRISIS', brief: 'A business running out of money. The decision is about sequencing survival moves: what to cut, what to protect, who to talk to first.' },
  { name: 'DEMAND PROBLEM', brief: 'Revenue has stalled or is falling. Is it pricing, positioning, channel, product or market? The best answer finds the real bottleneck.' },
  { name: 'MARGIN REPAIR', brief: 'Revenue is fine but the business does not make money. Where does margin really leak: pricing, mix, cost-to-serve, discounting, overhead?' },
  { name: 'SCALING BOTTLENECK', brief: 'A healthy small business that cannot grow past a ceiling: founder dependency, capacity, hiring, systems, concentration.' },
  { name: 'PEOPLE & OWNERSHIP', brief: 'The problem is organisational: a founder who cannot let go, a wrong key hire, broken incentives, family succession.' },
  { name: 'CUSTOMER CONCENTRATION', brief: 'The business depends on one or a few customers, channels or suppliers.' },
]

export function fictionalTurnaroundRequest(style, recentTitles = []) {
  const system = `You design realistic turnaround cases for small and mid-sized European businesses (think Dutch manufacturers, wholesalers, hardware start-ups, service firms).
Today's case type is "${style.name}": ${style.brief}
These are OPERATING decisions: the reader is the owner, CEO or operating partner deciding what to do on Monday morning.
Realism rules: give a role and a date; show the numbers like a management report; include one messy real-world detail (a bank deadline, a key person threatening to leave, an unreliable number).
${JSON_RULE}`
  const avoid = recentTitles.length ? `Avoid these recently used setups: ${recentTitles.slice(-8).join(' | ')}.` : ''
  const prompt = `Create ONE realistic turnaround-or-scale decision case for a small or mid-sized business. This is a realistic scenario, not a real company.

${avoid}

REQUIREMENTS:
- Case type: ${style.name}. ${style.brief}
- One concrete decision at one moment. 2 short dense paragraphs of context.
- An EXHIBIT of 5-7 rows: revenue, growth/decline, gross margin, EBITDA or loss, cash, monthly burn, headcount, concentration, whatever fits.
- Exactly 4 options with genuinely different operating logic.
- "calculation": a diagnosis block of 4-7 lines, e.g. "Runway: €380k cash / €95k burn = 4.0 months". Check every number.

Return JSON with this EXACT shape:
{
  "company": "Business name",
  "year": 2023,
  "asOf": "Month YYYY",
  "role": "You are ...",
  "domain": "${style.name}",
  "title": "Short, specific decision title",
  "context": "2 short paragraphs separated by \\n\\n",
  "exhibit": [ { "label": "...", "value": "..." } ],
  "decision": "The precise operating question in one sentence.",
  ${OPTIONS_SHAPE},
  "calculation": "diagnosis lines separated by \\n",
  "outcome": "2 short paragraphs: what happens if they take the best path, with numbers, and why the most tempting alternative would fail.",
  "lessonTitle": "The transferable operating principle (short)",
  "lesson": "1-2 sentences."
}`
  return { system, prompt, maxTokens: 8000 }
}

// ---- FEEDBACK ON THE USER'S REASONING ----------------------------------------
export function feedbackRequest(caseData, choice, reasoning) {
  const opts = Object.entries(caseData.options || {}).map(([k, o]) => `${k}: ${o.label} - ${o.description}`).join('\n')
  const system = `You are a sharp, kind mentor (experienced PE operating partner). You give short, concrete feedback on someone's reasoning in a case. Plain English, no buzzwords, no flattery. Max 120 words.`
  const prompt = `Case: ${caseData.title} (${caseData.company}, ${caseData.asOf || caseData.year})
Decision: ${caseData.decision}
Options:
${opts}
Best answer: ${caseData.actualChoice}. Why: ${caseData.whyBest || caseData.lesson || ''}

They picked ${choice}. Their reasoning: "${reasoning}"

Give feedback in 3 parts, plain text:
1. What was right in their reasoning (1-2 sentences).
2. What they missed or got wrong (1-2 sentences, specific).
3. One question they should ask themselves next time (1 sentence).`
  return { system, prompt, maxTokens: 600 }
}

// ---- PARSING & NORMALISING -----------------------------------------------------
export function parseJsonLoose(raw) {
  if (!raw) return null
  const c = raw.replace(/```json|```/g, '').trim()
  const start = c.indexOf('{')
  if (start < 0) return null
  // Walk to the matching closing brace, ignoring braces inside strings
  let depth = 0, inStr = false, esc = false
  for (let i = start; i < c.length; i++) {
    const ch = c[i]
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue }
    if (ch === '"') inStr = true
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) {
      try { return JSON.parse(c.slice(start, i + 1)) } catch { break }
    }
  }
  try { return JSON.parse(c.slice(start, c.lastIndexOf('}') + 1)) } catch { return null }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Turn the model's options array into the A-D object the app uses, in random order.
export function normaliseCase(parsed, extra = {}) {
  if (!parsed) return null
  if (parsed.options && !Array.isArray(parsed.options) && typeof parsed.options === 'object') {
    // Model used {A:..,B:..} instead of an array: convert, and map a letter bestIndex
    const keys = Object.keys(parsed.options)
    parsed.options = keys.map(k => parsed.options[k])
    for (const f of ['bestIndex', 'realIndex']) if (typeof parsed[f] === 'string' && keys.includes(parsed[f])) parsed[f] = keys.indexOf(parsed[f])
  }
  if (!Array.isArray(parsed.options) || parsed.options.length !== 4) return null
  const best = Number(parsed.bestIndex)
  if (!(best >= 0 && best <= 3)) return null
  const real = parsed.realIndex === undefined || parsed.realIndex === null ? null : Number(parsed.realIndex)

  const tagged = parsed.options.map((o, i) => ({ ...o, _best: i === best, _real: i === real }))
  const order = shuffle(tagged)
  const letters = ['A', 'B', 'C', 'D']
  const options = {}
  let actualChoice = null, realChoice = null
  order.forEach((o, i) => {
    options[letters[i]] = { label: o.label, description: o.description }
    if (o._best) actualChoice = letters[i]
    if (o._real) realChoice = letters[i]
  })
  const { bestIndex, realIndex, ...rest } = parsed
  return {
    ...rest,
    ...extra,
    id: extra.id || `${(parsed.company || 'case').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Date.now().toString(36)}`,
    options,
    actualChoice,
    realChoice,
  }
}

export function pickConcepts(seen, n) {
  const unseen = CONCEPTS.filter(c => !seen.includes(c))
  const pool = shuffle(unseen.length >= n ? unseen : [...unseen, ...shuffle(CONCEPTS.filter(c => !unseen.includes(c)))])
  return pool.slice(0, n)
}

export function pickTurnaroundKeys(used, n) {
  const unused = TURNAROUND_LIBRARY.filter(c => !used.includes(c.key)).map(c => c.key)
  const picks = shuffle(unused).slice(0, n)
  while (picks.length < n) picks.push(null) // null = fictional fallback once the library is used up
  return picks
}

export function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)]
}
