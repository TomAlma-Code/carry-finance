import React, { useState } from 'react'
import { fetchFeedback } from './api'

const domainColors = {
  'VC DECISION': '#c5f135',
  'PE TURNAROUND': '#f2a93b',
  'IMPACT TRADEOFF': '#6fcf97',
  'CAPITAL ALLOCATION': '#88b4d4',
}

const pickKey = id => `carry_pick_${id}`

export default function CaseView({ caseData, onDecide, completed }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(pickKey(caseData.id))) } catch { return null } })()
  const [chosen, setChosen] = useState(saved?.choice || null)
  const [revealed, setRevealed] = useState(!!saved || !!completed)
  const [reasoning, setReasoning] = useState(saved?.reasoning || '')
  const [feedback, setFeedback] = useState(saved?.feedback || null)
  const [fbLoading, setFbLoading] = useState(false)

  const isReal = caseData.kind === 'real'
  const domainColor = domainColors[caseData.domain] || (isReal ? '#d98f4b' : '#c5f135')
  const correct = chosen === caseData.actualChoice
  const opts = Object.entries(caseData.options || {}).filter(([, v]) => v)
  const exhibit = Array.isArray(caseData.exhibit) ? caseData.exhibit : []

  const remember = (patch) => {
    const cur = (() => { try { return JSON.parse(localStorage.getItem(pickKey(caseData.id))) || {} } catch { return {} } })()
    localStorage.setItem(pickKey(caseData.id), JSON.stringify({ ...cur, ...patch }))
  }

  const handleChoose = async (option) => {
    if (revealed) return
    const why = reasoning.trim()
    setChosen(option)
    setRevealed(true)
    remember({ choice: option, reasoning: why })
    await onDecide(option, option === caseData.actualChoice, why || null)
    if (why) {
      setFbLoading(true)
      try {
        const { feedback: fb } = await fetchFeedback(caseData, option, why)
        setFeedback(fb); remember({ feedback: fb })
      } catch (e) { setFeedback('Could not load feedback: ' + e.message) }
      setFbLoading(false)
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={{ ...styles.tag, color: domainColor, borderColor: domainColor + '44' }}>
          {caseData.domain}
        </span>
        <span style={styles.year}>{isReal ? `REAL CASE · ${caseData.country || ''}` : 'REALISTIC SCENARIO'}</span>
      </div>

      <div style={styles.scroll}>
        <div style={styles.content}>
          <div style={styles.company}>{caseData.company} · {caseData.asOf || caseData.year}</div>
          <h1 style={styles.title}>{caseData.title}</h1>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${domainColor} 0%, #252820 60%)`, marginBottom: 20 }} />

          {caseData.role && <div style={styles.role}>{caseData.role}</div>}

          <div style={styles.section}>
            <div style={styles.sectionLabel}>THE SITUATION</div>
            {(caseData.context || '').split('\n\n').filter(Boolean).map((p, i) => (
              <p key={i} style={{ ...styles.para, ...(i === 0 ? styles.firstPara : {}) }}>{p}</p>
            ))}
          </div>

          {exhibit.length > 0 && (
            <div style={styles.exhibit}>
              <div style={styles.calcLabel}>EXHIBIT · KEY NUMBERS</div>
              {exhibit.map((row, i) => (
                <div key={i} style={{ ...styles.exRow, borderTop: i ? '1px solid #252820' : 'none' }}>
                  <span style={styles.exLabel}>{row.label}</span>
                  <span style={styles.exValue}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          <div style={styles.decisionBox}>
            <div style={styles.decisionLabel}>THE DECISION</div>
            <p style={styles.decisionText}>{caseData.decision}</p>
          </div>

          {!revealed ? (
            <div style={styles.options}>
              <div style={styles.sectionLabel}>YOUR REASONING (OPTIONAL · +5 XP · GETS FEEDBACK)</div>
              <textarea
                style={styles.textarea}
                placeholder="What is the real problem here, and what would you do first? Write it before you look at the options."
                value={reasoning}
                onChange={e => setReasoning(e.target.value)}
                rows={4}
              />
              <p style={styles.choosePrompt}>What would you do?</p>
              {opts.map(([key, opt]) => (
                <button key={key} style={styles.optionBtn} onClick={() => handleChoose(key)}>
                  <span style={styles.optionKey}>{key}</span>
                  <div>
                    <div style={styles.optionLabel}>{opt.label}</div>
                    <div style={styles.optionDesc}>{opt.description}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={styles.revealSection}>
              {chosen && (
                <div style={{
                  ...styles.choiceResult,
                  borderColor: correct ? '#c5f135' : '#ff6b5e',
                  background: correct ? 'rgba(197,241,53,0.06)' : 'rgba(255,107,94,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{correct ? '✓' : '✗'}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: correct ? '#c5f135' : '#ff6b5e', letterSpacing: 1 }}>
                      {correct ? 'GOOD CALL' : 'NOT THE BEST CALL'}
                    </span>
                  </div>
                  {isReal && caseData.realChoice && caseData.realChoice !== caseData.actualChoice && (
                    <p style={styles.note}>Note: what the company actually did ({caseData.realChoice}) was not the best answer.</p>
                  )}
                </div>
              )}

              <div style={{ ...styles.options, marginBottom: 24 }}>
                {opts.map(([key, opt]) => {
                  const isCorrect = key === caseData.actualChoice
                  const isChosen = key === chosen
                  const isRealPick = isReal && key === caseData.realChoice
                  const border = isCorrect ? '#c5f135' : (isChosen ? '#ff6b5e' : '#252820')
                  return (
                    <div key={key} style={{ ...styles.optionBtn, cursor: 'default', background: isCorrect ? 'rgba(197,241,53,0.08)' : (isChosen ? 'rgba(255,107,94,0.08)' : 'transparent'), borderColor: border }}>
                      <span style={{ ...styles.optionKey, color: isCorrect ? '#c5f135' : (isChosen ? '#ff6b5e' : '#7a7d6e') }}>{key}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={styles.optionLabel}>{opt.label}</div>
                          {isCorrect && <span style={styles.bestTag}>BEST ANSWER</span>}
                          {isRealPick && <span style={styles.realTag}>WHAT THEY DID</span>}
                          {isChosen && <span style={styles.yoursTag}>YOUR PICK</span>}
                        </div>
                        <div style={styles.optionDesc}>{opt.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {(feedback || fbLoading) && (
                <div style={styles.feedbackBox}>
                  <div style={{ ...styles.calcLabel, color: '#c5f135' }}>FEEDBACK ON YOUR REASONING</div>
                  {fbLoading ? <p style={styles.calcLine}>Reading your reasoning…</p> :
                    feedback.split('\n').filter(Boolean).map((l, i) => <p key={i} style={styles.fbLine}>{l}</p>)}
                </div>
              )}

              {caseData.calculation && (
                <div style={styles.calcBox}>
                  <div style={styles.calcLabel}>{isReal ? 'THE DIAGNOSIS' : 'THE MATH'}</div>
                  {caseData.calculation.split('\n').filter(Boolean).map((line, i) => (
                    <p key={i} style={styles.calcLine}>{line}</p>
                  ))}
                </div>
              )}

              {caseData.whyBest && (
                <div style={styles.section}>
                  <div style={styles.sectionLabel}>WHY THIS IS THE BEST ANSWER</div>
                  <p style={styles.para}>{caseData.whyBest}</p>
                </div>
              )}

              <div style={styles.section}>
                <div style={styles.sectionLabel}>{isReal ? 'WHAT ACTUALLY HAPPENED' : 'HOW IT PLAYS OUT'}</div>
                {(caseData.outcome || '').split('\n\n').filter(Boolean).map((p, i) => (
                  <p key={i} style={styles.para}>{p}</p>
                ))}
              </div>

              <div style={styles.lesson}>
                <div style={styles.lessonTitle}>{caseData.lessonTitle}</div>
                <p style={styles.lessonText}>{caseData.lesson}</p>
              </div>

              {isReal && Array.isArray(caseData.sources) && caseData.sources.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionLabel}>SOURCES</div>
                  {caseData.sources.map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer" style={styles.source}>{u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</a>
                  ))}
                </div>
              )}

              {completed && (
                <div style={styles.completedBadge}>
                  <span style={{ color: '#c5f135', marginRight: 8 }}>{'✓'}</span>
                  Case completed
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  role: {
    fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#d98f4b', fontStyle: 'italic',
    marginBottom: 18, lineHeight: 1.5,
  },
  exhibit: {
    background: '#101109', border: '1px solid #252820', borderLeft: '3px solid #88b4d4',
    borderRadius: 12, padding: '14px 16px', marginBottom: 24,
  },
  exRow: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0' },
  exLabel: { fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#9a9d8e' },
  exValue: { fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#ece9dc', textAlign: 'right' },
  textarea: {
    width: '100%', boxSizing: 'border-box', background: '#101109', color: '#ece9dc',
    border: '1px solid #252820', borderRadius: 12, padding: 14, marginBottom: 18,
    fontFamily: 'DM Sans, sans-serif', fontSize: 14, lineHeight: 1.5, resize: 'vertical',
  },
  realTag: {
    fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: 1,
    color: '#d98f4b', border: '1px solid #d98f4b', padding: '1px 6px', borderRadius: 10,
  },
  note: { fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#d98f4b', margin: '10px 0 0' },
  feedbackBox: {
    background: '#141510', border: '1px solid #252820', borderLeft: '3px solid #c5f135',
    borderRadius: 12, padding: '16px 18px', marginBottom: 24,
  },
  fbLine: { fontFamily: 'DM Sans, sans-serif', fontSize: 14, lineHeight: 1.6, color: '#d4d2c4', margin: '0 0 8px' },
  source: {
    display: 'inline-block', marginRight: 12, marginBottom: 6, fontFamily: 'DM Mono, monospace',
    fontSize: 12, color: '#88b4d4', textDecoration: 'underline',
  },
  wrap: { height: '100%', display: 'flex', flexDirection: 'column' },
  bestTag: {
    fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: 1,
    color: '#0c0d0b', background: '#c5f135', padding: '2px 7px', borderRadius: 10,
  },
  yoursTag: {
    fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: 1,
    color: '#ff6b5e', border: '1px solid #ff6b5e', padding: '1px 6px', borderRadius: 10,
  },
  calcBox: {
    background: '#101109', border: '1px solid #252820', borderLeft: '3px solid #88b4d4',
    borderRadius: 12, padding: '16px 18px', marginBottom: 24,
  },
  calcLabel: {
    fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: 2,
    color: '#88b4d4', marginBottom: 12,
  },
  calcLine: {
    fontFamily: 'DM Mono, monospace', fontSize: 13, lineHeight: 1.7,
    color: '#cdd3c4', margin: '2px 0', whiteSpace: 'pre-wrap',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid #252820', flexShrink: 0,
  },
  tag: {
    fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: 2,
    padding: '3px 10px', borderRadius: 20, border: '1px solid',
  },
  year: { fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#7a7d6e' },
  scroll: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  content: { padding: '24px 20px 48px', maxWidth: 600, margin: '0 auto' },
  company: {
    fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: 2,
    color: '#7a7d6e', textTransform: 'uppercase', marginBottom: 8,
  },
  title: {
    fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700,
    lineHeight: 1.2, letterSpacing: '-0.3px', color: '#ece9dc', marginBottom: 18,
  },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: 2,
    color: '#7a7d6e', marginBottom: 12,
  },
  para: {
    fontSize: 15, lineHeight: 1.75, color: '#d4d2c4',
    marginBottom: 16, fontFamily: 'DM Sans, sans-serif',
  },
  firstPara: { fontSize: 16, color: '#ece9dc', fontWeight: 300 },
  decisionBox: {
    background: '#1a1c17', border: '1px solid #252820', borderRadius: 12,
    padding: '18px', marginBottom: 24,
  },
  decisionLabel: {
    fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: 2,
    color: '#f2a93b', marginBottom: 10,
  },
  decisionText: {
    fontSize: 16, fontWeight: 500, lineHeight: 1.5, color: '#ece9dc',
    fontFamily: 'Playfair Display, serif', fontStyle: 'italic',
  },
  options: { marginBottom: 24 },
  choosePrompt: {
    fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#7a7d6e',
    letterSpacing: 1, marginBottom: 14, textAlign: 'center',
  },
  optionBtn: {
    width: '100%', textAlign: 'left', background: '#1a1c17',
    border: '1px solid #252820', borderRadius: 12, padding: '16px',
    marginBottom: 10, color: '#ece9dc', cursor: 'pointer',
    display: 'flex', gap: 14, alignItems: 'flex-start', transition: '0.15s',
  },
  optionKey: {
    fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 500,
    color: '#c5f135', flexShrink: 0, marginTop: 2,
  },
  optionLabel: {
    fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500,
    marginBottom: 4, color: '#ece9dc',
  },
  optionDesc: {
    fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#7a7d6e', lineHeight: 1.5,
  },
  revealSection: {},
  choiceResult: {
    border: '1px solid', borderRadius: 12, padding: '14px 16px', marginBottom: 24,
  },
  lesson: {
    background: '#1a1c17', border: '1px solid #252820', borderLeft: '3px solid #f2a93b',
    borderRadius: 12, padding: '16px 18px', marginBottom: 20,
  },
  lessonTitle: {
    fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: 2,
    color: '#f2a93b', marginBottom: 8,
  },
  lessonText: {
    fontSize: 15, lineHeight: 1.6, color: '#ece9dc',
    fontStyle: 'italic', fontFamily: 'Playfair Display, serif',
  },
  completedBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '14px', fontFamily: 'DM Mono, monospace', fontSize: 13,
    color: '#7a7d6e', border: '1px solid #252820', borderRadius: 12,
  },
}
