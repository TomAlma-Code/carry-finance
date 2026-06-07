import React from 'react'

export default function HomeScreen({ progress, todayContent, onOpenArticle, onOpenCase }) {
  const articleDone = progress?.article_read_today
  const caseDone = progress?.case_done_today
  const streak = progress?.streak || 1
  const xp = progress?.xp || 0

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={styles.wrap}>
      <div style={styles.scroll}>
        {/* Top */}
        <div style={styles.top}>
          <div>
            <div style={styles.date}>{today}</div>
            <div style={styles.greeting}>Your daily briefing</div>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <span style={styles.statVal}>{streak}</span>
              <span style={styles.statLabel}>🔥</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statVal}>{xp}</span>
              <span style={styles.statLabel}>XP</span>
            </div>
          </div>
        </div>

        {/* Streak bar */}
        <div style={styles.streakWrap}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{
              ...styles.streakDay,
              background: i < Math.min(streak, 7) ? '#c5f135' : '#1a1c17',
              border: `1px solid ${i < Math.min(streak, 7) ? '#c5f135' : '#252820'}`,
            }} />
          ))}
          <span style={styles.streakLabel}>{streak} day streak</span>
        </div>

        <div style={styles.divider} />

        {/* Today's content */}
        <div style={styles.sectionLabel}>TODAY</div>

        {/* Article card */}
        <div
          style={{ ...styles.card, ...styles.articleCard, opacity: articleDone ? 0.7 : 1 }}
          onClick={onOpenArticle}
        >
          <div style={styles.cardTop}>
            <span style={styles.cardType}>CONCEPT</span>
            {articleDone && <span style={styles.doneBadge}>✓ Read</span>}
          </div>
          {todayContent?.article ? (
            <>
              <div style={styles.cardTag}>{todayContent.article.tag}</div>
              <h2 style={styles.cardTitle}>{todayContent.article.title}</h2>
              <p style={styles.cardHook}>{todayContent.article.hook}</p>
              <div style={styles.cardMeta}>{todayContent.article.readTime} read · +20 XP</div>
            </>
          ) : (
            <div style={styles.cardPlaceholder}>Loading article…</div>
          )}
          <div style={styles.cardArrow}>→</div>
        </div>

        {/* Case card */}
        <div
          style={{ ...styles.card, ...styles.caseCard, opacity: caseDone ? 0.7 : 1 }}
          onClick={onOpenCase}
        >
          <div style={styles.cardTop}>
            <span style={{ ...styles.cardType, color: '#f2a93b' }}>CASE STUDY</span>
            {caseDone && <span style={styles.doneBadge}>✓ Done</span>}
          </div>
          {todayContent?.case ? (
            <>
              <div style={{ ...styles.cardTag, color: '#f2a93b' }}>{todayContent.case.domain}</div>
              <h2 style={styles.cardTitle}>{todayContent.case.company} · {todayContent.case.year}</h2>
              <p style={styles.cardHook}>{todayContent.case.title}</p>
              <div style={styles.cardMeta}>Real decision · +30 XP if right</div>
            </>
          ) : (
            <div style={styles.cardPlaceholder}>Loading case…</div>
          )}
          <div style={{ ...styles.cardArrow, color: '#f2a93b' }}>→</div>
        </div>

        {/* XP progress */}
        <div style={styles.xpSection}>
          <div style={styles.xpTop}>
            <span style={styles.xpLabel}>TOTAL XP</span>
            <span style={styles.xpVal}>{xp} pts</span>
          </div>
          <div style={styles.xpBar}>
            <div style={{ ...styles.xpFill, width: `${Math.min((xp % 200) / 200 * 100, 100)}%` }} />
          </div>
          <div style={styles.xpSub}>Level {Math.floor(xp / 200) + 1} · {200 - (xp % 200)} XP to next</div>
        </div>

        {/* Concept map teaser */}
        <div style={styles.conceptMap}>
          <div style={styles.sectionLabel}>CONCEPTS COVERED</div>
          <p style={styles.conceptCount}>
            <span style={{ color: '#c5f135', fontFamily: 'DM Mono, monospace', fontSize: 24 }}>
              {progress?.concepts_seen?.length || 0}
            </span>
            <span style={{ color: '#7a7d6e', fontSize: 14, marginLeft: 8 }}>
              of 32 topics
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: { height: '100%', display: 'flex', flexDirection: 'column' },
  scroll: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 18px 40px' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  date: { fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#7a7d6e', letterSpacing: 1, marginBottom: 4 },
  greeting: { fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: '#ece9dc' },
  statsRow: { display: 'flex', gap: 12, alignItems: 'center' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statVal: { fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 500, color: '#c5f135' },
  statLabel: { fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#7a7d6e' },
  streakWrap: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 },
  streakDay: { width: 28, height: 6, borderRadius: 3 },
  streakLabel: { fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#7a7d6e', marginLeft: 6 },
  divider: { height: 1, background: '#252820', marginBottom: 20 },
  sectionLabel: { fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: 2, color: '#4a4d40', marginBottom: 12 },
  card: {
    background: '#1a1c17', border: '1px solid #252820', borderRadius: 16,
    padding: '18px', marginBottom: 14, cursor: 'pointer', position: 'relative',
    transition: '0.15s',
  },
  articleCard: { borderLeft: '3px solid #c5f135' },
  caseCard: { borderLeft: '3px solid #f2a93b' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardType: { fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: 2, color: '#c5f135' },
  doneBadge: { fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#7a7d6e' },
  cardTag: { fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#7a7d6e', letterSpacing: 1, marginBottom: 6 },
  cardTitle: { fontFamily: 'Playfair Display, serif', fontSize: 19, fontWeight: 600, lineHeight: 1.25, marginBottom: 8, color: '#ece9dc' },
  cardHook: { fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#7a7d6e', lineHeight: 1.5, marginBottom: 10 },
  cardMeta: { fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#4a4d40' },
  cardArrow: { position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', color: '#c5f135', fontSize: 18 },
  cardPlaceholder: { fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#4a4d40', padding: '20px 0' },
  xpSection: { background: '#1a1c17', border: '1px solid #252820', borderRadius: 12, padding: '14px 16px', marginBottom: 14 },
  xpTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  xpLabel: { fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: 2, color: '#7a7d6e' },
  xpVal: { fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#c5f135' },
  xpBar: { height: 6, background: '#252820', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  xpFill: { height: '100%', background: 'linear-gradient(90deg, #a0c828, #c5f135)', borderRadius: 6, transition: 'width 0.5s' },
  xpSub: { fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#4a4d40' },
  conceptMap: { background: '#1a1c17', border: '1px solid #252820', borderRadius: 12, padding: '14px 16px' },
  conceptCount: { margin: 0, display: 'flex', alignItems: 'baseline' },
}
