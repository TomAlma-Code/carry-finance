import React, { useState } from 'react'

const tagColors = {
  'VC FUNDAMENTALS': '#c5f135',
  'PE & BUYOUTS': '#f2a93b',
  'IMPACT': '#6fcf97',
  'TURNAROUND': '#ff6b5e',
  'FUND MECHANICS': '#88b4d4',
}

export default function ArticleView({ article, onComplete, completed }) {
  const [scrolled, setScrolled] = useState(false)

  const tagColor = tagColors[article.tag] || '#c5f135'

  const handleScroll = (e) => {
    const el = e.target
    const pct = el.scrollTop / (el.scrollHeight - el.clientHeight)
    if (pct > 0.85 && !scrolled) setScrolled(true)
  }

  const paragraphs = article.body.split('\n\n').filter(Boolean)

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <span style={{ ...styles.tag, color: tagColor, borderColor: tagColor + '44' }}>
          {article.tag}
        </span>
        <span style={styles.readTime}>{article.readTime} read</span>
      </div>

      {/* Scrollable content */}
      <div style={styles.scroll} onScroll={handleScroll}>
        <div style={styles.content}>
          {/* Hook */}
          <p style={styles.hook}>{article.hook}</p>

          {/* Title */}
          <h1 style={styles.title}>{article.title}</h1>

          <div style={styles.divider} />

          {/* Body */}
          {paragraphs.map((p, i) => (
            <p key={i} style={{
              ...styles.para,
              ...(i === 0 ? styles.firstPara : {})
            }}>{p}</p>
          ))}

          {/* Key takeaway */}
          <div style={styles.takeaway}>
            <div style={styles.takeawayLabel}>KEY TAKEAWAY</div>
            <p style={styles.takeawayText}>{article.keyTakeaway}</p>
          </div>

          {/* Complete button */}
          <div style={styles.bottom}>
            {completed ? (
              <div style={styles.completedBadge}>
                <span style={{ color: '#c5f135', marginRight: 8 }}>✓</span>
                Read today
              </div>
            ) : (
              <button
                style={styles.completeBtn}
                onClick={onComplete}
              >
                Mark as read · +20 XP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #252820',
    flexShrink: 0,
  },
  tag: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    letterSpacing: 2,
    padding: '3px 10px',
    borderRadius: 20,
    border: '1px solid',
  },
  readTime: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 12,
    color: '#7a7d6e',
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  content: {
    padding: '28px 22px 40px',
    maxWidth: 600,
    margin: '0 auto',
  },
  hook: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 13,
    color: '#c5f135',
    letterSpacing: 0.3,
    marginBottom: 18,
    lineHeight: 1.5,
  },
  title: {
    fontFamily: 'Playfair Display, serif',
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: '-0.5px',
    color: '#ece9dc',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, #c5f135 0%, #252820 60%)',
    marginBottom: 24,
  },
  para: {
    fontSize: 16,
    lineHeight: 1.75,
    color: '#d4d2c4',
    marginBottom: 20,
    fontFamily: 'DM Sans, sans-serif',
  },
  firstPara: {
    fontSize: 18,
    color: '#ece9dc',
    fontWeight: 300,
  },
  takeaway: {
    background: '#1a1c17',
    border: '1px solid #252820',
    borderLeft: '3px solid #c5f135',
    borderRadius: 12,
    padding: '16px 18px',
    margin: '28px 0',
  },
  takeawayLabel: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    letterSpacing: 2,
    color: '#c5f135',
    marginBottom: 8,
  },
  takeawayText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: '#ece9dc',
    fontStyle: 'italic',
    fontFamily: 'Playfair Display, serif',
  },
  bottom: {
    paddingTop: 8,
  },
  completedBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    fontFamily: 'DM Mono, monospace',
    fontSize: 13,
    color: '#7a7d6e',
    border: '1px solid #252820',
    borderRadius: 12,
  },
  completeBtn: {
    width: '100%',
    background: '#c5f135',
    color: '#0c0d0b',
    border: 'none',
    borderRadius: 12,
    padding: '16px',
    fontFamily: 'DM Mono, monospace',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    letterSpacing: 0.3,
  },
}
