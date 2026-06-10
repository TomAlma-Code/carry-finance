import React, { useState } from 'react'

const domainColors = {
  'VC DECISION': '#c5f135',
  'PE TURNAROUND': '#f2a93b',
  'IMPACT TRADEOFF': '#6fcf97',
  'CAPITAL ALLOCATION': '#88b4d4',
}

export default function CaseView({ caseData, onDecide, userDecision, completed }) {
  const [chosen, setChosen] = useState(userDecision || null)
  const [revealed, setRevealed] = useState(!!userDecision)

  const domainColor = domainColors[caseData.domain] || '#c5f135'
  const correct = chosen === caseData.actualChoice

  // Support both new (options{}) and legacy (optionA/optionB) shapes
  const optMap = caseData.options || {
    A: caseData.optionA, B: caseData.optionB,
  }
  const opts = Object.entries(optMap).filter(([, v]) => v)

  const handleChoose = (option) => {
    if (revealed) return
    setChosen(option)
    setRevealed(true)
    onDecide(option, option === caseData.actualChoice)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={{ ...styles.tag, color: domainColor, borderColor: domainColor + '44' }}>
          {caseData.domain}
        </span>
        <span style={styles.year}>{caseData.year}</span>
      </div>

      <div style={styles.scroll}>
        <div style={styles.content}>
          <div style={styles.company}>{caseData.company}</div>
          <h1 style={styles.title}>{caseData.title}</h1>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${domainColor} 0%, #252820 60%)`, marginBottom: 24 }} />

          {/* Context */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>THE SITUATION</div>
            {caseData.context.split('\n\n').filter(Boolean).map((p, i) => (
              <p key={i} style={{ ...styles.para, ...(i === 0 ? styles.firstPara : {}) }}>{p}</p>
            ))}
          </div>

          {/* Decision */}
          <div style={styles.decisionBox}>
            <div style={styles.decisionLabel}>THE DECISION</div>
            <p style={styles.decisionText}>{caseData.decision}</p>
          </div>

          {/* Options */}
          {!revealed ? (
            <div style={styles.options}>
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
              {/* Result banner */}
              <div style={{
                ...styles.choiceResult,
                borderColor: correct ? '#c5f135' : '#ff6b5e',
                background: correct ? 'rgba(197,241,53,0.06)' : 'rgba(255,107,94,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{correct ? '\u2713' : '\u2717'}</span>
                  <span style={{
                    fontFamily: 'DM Mono, monospace', fontSize: 12,
                    color: correct ? '#c5f135' : '#ff6b5e', letterSpacing: 1,
                  }}>
                    {correct ? 'GOOD CALL' : 'NOT THE BEST CALL'}
                  </span>
                </div>
              </div>

              {/* All options, color-coded */}
              <div style={{ ...styles.options, marginBottom: 24 }}>
                {opts.map(([key, opt]) => {
                  const isCorrect = key === caseData.actualChoice
                  const isChosen = key === chosen
                  const bg = isCorrect ? 'rgba(197,241,53,0.08)'
                    : (isChosen ? 'rgba(255,107,94,0.08)' : 'transparent')
                  const border = isCorrect ? '#c5f135'
                    : (isChosen ? '#ff6b5e' : '#252820')
                  const keyColor = isCorrect ? '#c5f135'
                    : (isChosen ? '#ff6b5e' : '#7a7d6e')
                  return (
                    <div key={key} style={{ ...styles.optionBtn, cursor: 'default', background: bg, borderColor: border }}>
                      <span style={{ ...styles.optionKey, color: keyColor, borderColor: border }}>{key}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={styles.optionLabel}>{opt.label}</div>
                          {isCorrect && <span style={styles.bestTag}>BEST ANSWER</span>}
                          {isChosen && !isCorrect && <span style={styles.yoursTag}>YOUR PICK</span>}
                          {isChosen && isCorrect && <span style={styles.yoursTag}>YOUR PICK</span>}
                        </div>
                        <div style={styles.optionDesc}>{opt.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* The calculation */}
              {caseData.calculation && (
                <div style={styles.calcBox}>
                  <div style={styles.calcLabel}>THE MATH</div>
                  {caseData.calculation.split('\n').filter(Boolean).map((line, i) => (
                    <p key={i} style={styles.calcLine}>{line}</p>
                  ))}
                </div>
              )}

              {/* What happened */}
              <div style={styles.section}>
                <div style={styles.sectionLabel}>WHAT ACTUALLY HAPPENED</div>
                {caseData.outcome.split('\n\n').filter(Boolean).map((p, i) => (
                  <p key={i} style={styles.para}>{p}</p>
                ))}
              </div>

              {/* Lesson */}
              <div style={styles.lesson}>
                <div style={styles.lessonTitle}>{caseData.lessonTitle}</div>
                <p style={styles.lessonText}>{caseData.lesson}</p>
              </div>

              {completed && (
                <div style={styles.completedBadge}>
                  <span style={{ color: '#c5f135', marginRight: 8 }}>\u2713</span>
                  Case completed \u00b7 +{correct ? 30 : 15} XP earned
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
