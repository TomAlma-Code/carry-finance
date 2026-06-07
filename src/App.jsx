import React, { useState, useEffect } from 'react'
import LoadingScreen from './LoadingScreen'
import HomeScreen from './HomeScreen'
import ArticleView from './ArticleView'
import CaseView from './CaseView'
import { loadProgress, saveProgress, saveDecision, loadTodayContent, saveTodayContent } from './supabase'
import { generateArticle, generateCase, pickConcept } from './api'

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [loadingMsg, setLoadingMsg] = useState('Loading carry...')
  const [progress, setProgress] = useState(null)
  const [todayContent, setTodayContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { init() }, [])

  async function init() {
    try {
      setLoadingMsg('Loading your progress...')
      let prog = await loadProgress()
      if (!prog) {
        prog = await saveProgress({ xp: 0, concepts_seen: [], cases_done: [], article_read_today: false, case_done_today: false })
      }

      const today = new Date().toISOString().split('T')[0]
      if (prog && prog.last_active !== today) {
        prog = await saveProgress({ article_read_today: false, case_done_today: false })
      }
      setProgress(prog || { xp: 0, streak: 1, concepts_seen: [], cases_done: [] })

      setLoadingMsg('Generating today\'s briefing...')
      let content = await loadTodayContent()

      if (!content || !content.article_json || !content.case_json) {
        const conceptsSeen = prog?.concepts_seen || []
        const casesDone = prog?.cases_done || []
        const concept = pickConcept(conceptsSeen)

        setLoadingMsg(`Writing: ${concept.split(' ').slice(0,4).join(' ')}...`)
        
        const [article, caseData] = await Promise.all([
          generateArticle(concept, conceptsSeen),
          generateCase(conceptsSeen, casesDone)
        ])

        if (!article || !caseData) throw new Error('Content generation failed - check API key')

        content = { article_json: article, case_json: caseData }
        await saveTodayContent({ article_json: article, case_json: caseData })
      }

      setTodayContent({ article: content.article_json, case: content.case_json })
      setScreen('home')
    } catch (err) {
      console.error('Init error:', err)
      setError(err.message)
    }
  }

  async function handleArticleComplete() {
    const updated = await saveProgress({
      article_read_today: true,
      xp: (progress?.xp || 0) + 20,
      concepts_seen: [...(progress?.concepts_seen || []), todayContent?.article?.concept].filter(Boolean),
    })
    setProgress(updated)
  }

  async function handleCaseDecide(decision, wasCorrect) {
    const xpGain = wasCorrect ? 30 : 15
    const updated = await saveProgress({
      case_done_today: true,
      xp: (progress?.xp || 0) + xpGain,
      cases_done: [...(progress?.cases_done || []), todayContent?.case?.id].filter(Boolean),
    })
    setProgress(updated)
    if (todayContent?.case?.id) await saveDecision(todayContent.case.id, decision, wasCorrect)
  }

  if (error) {
    return (
      <div style={{ height:'100vh', background:'#0c0d0b', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:32 }}>
        <div style={{ fontFamily:'Playfair Display,serif', fontSize:32, color:'#ece9dc' }}>carry<span style={{color:'#c5f135'}}>.</span></div>
        <p style={{ fontFamily:'DM Mono,monospace', fontSize:14, color:'#ff6b5e', textAlign:'center' }}>Something went wrong</p>
        <p style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'#4a4d40', textAlign:'center', maxWidth:280 }}>{error}</p>
        <button style={{ background:'#c5f135', color:'#0c0d0b', border:'none', borderRadius:10, padding:'12px 24px', fontFamily:'DM Mono,monospace', fontSize:13, cursor:'pointer' }}
          onClick={() => { setError(null); setScreen('loading'); init() }}>Try again</button>
      </div>
    )
  }

  if (screen === 'loading') return <LoadingScreen message={loadingMsg} />

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#0c0d0b', maxWidth:540, margin:'0 auto' }}>
      <header style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 12px', borderBottom:'1px solid #252820', background:'linear-gradient(180deg,#141510 0%,transparent 100%)' }}>
        {screen !== 'home' ? (
          <button style={{ background:'none', border:'none', color:'#7a7d6e', fontFamily:'DM Mono,monospace', fontSize:13, cursor:'pointer', padding:'4px 0' }} onClick={() => setScreen('home')}>← Back</button>
        ) : (
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color:'#ece9dc', letterSpacing:'-0.5px' }}>carry<span style={{color:'#c5f135'}}>.</span></div>
        )}
        <div style={{ fontFamily:'DM Mono,monospace', fontSize:13, color:'#7a7d6e' }}>
          {progress?.streak || 1}🔥 · <span style={{color:'#c5f135'}}>{progress?.xp || 0}</span> XP
        </div>
      </header>

      <div style={{ flex:1, overflow:'hidden' }}>
        {screen === 'home' && <HomeScreen progress={progress} todayContent={todayContent} onOpenArticle={() => setScreen('article')} onOpenCase={() => setScreen('case')} />}
        {screen === 'article' && todayContent?.article && <ArticleView article={todayContent.article} onComplete={handleArticleComplete} completed={progress?.article_read_today} />}
        {screen === 'case' && todayContent?.case && <CaseView caseData={todayContent.case} onDecide={handleCaseDecide} userDecision={progress?.case_done_today ? 'done' : null} completed={progress?.case_done_today} />}
      </div>

      {screen === 'home' && (
        <nav style={{ flexShrink:0, display:'flex', background:'#141510', borderTop:'1px solid #252820', paddingBottom:'env(safe-area-inset-bottom)' }}>
          <button style={{ flex:1, background:'none', border:'none', color:'#c5f135', fontFamily:'DM Mono,monospace', fontSize:11, padding:'10px 4px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' }}>
            <span style={{fontSize:16}}>◆</span><span>Today</span>
          </button>
          <button style={{ flex:1, background:'none', border:'none', color:'#7a7d6e', fontFamily:'DM Mono,monospace', fontSize:11, padding:'10px 4px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' }} onClick={() => setScreen('article')}>
            <span style={{fontSize:16}}>▦</span><span>Article</span>
          </button>
          <button style={{ flex:1, background:'none', border:'none', color:'#7a7d6e', fontFamily:'DM Mono,monospace', fontSize:11, padding:'10px 4px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' }} onClick={() => setScreen('case')}>
            <span style={{fontSize:16}}>❖</span><span>Case</span>
          </button>
        </nav>
      )}
    </div>
  )
}
