import React, { useState, useEffect } from 'react'
import LoadingScreen from './LoadingScreen'
import HomeScreen from './HomeScreen'
import ArticleView from './ArticleView'
import CaseView from './CaseView'
import { loadProgress, saveProgress, saveDecision } from './supabase'
import { fetchToday, maintainQueue, localDate } from './api'

const TODAY = localDate()
const LS_CONTENT = `carry_bundle_v9_${TODAY}`
const LS_PROGRESS = `carry_progress_${TODAY}`
const DAY_RESET = { article_read_today: false, case_done_today: false, turnaround_done_today: false }

function readLS(k) { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } }
function setCachedContent(c) {
  Object.keys(localStorage).filter(k => (k.startsWith('carry_content_') || k.startsWith('carry_bundle_')) && k !== LS_CONTENT).forEach(k => localStorage.removeItem(k))
  localStorage.setItem(LS_CONTENT, JSON.stringify(c))
}
function setCachedProgress(p) { localStorage.setItem(LS_PROGRESS, JSON.stringify(p)) }

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [loadingMsg, setLoadingMsg] = useState('Loading carry...')
  const [progress, setProgress] = useState(null)
  const [todayContent, setTodayContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { init() }, [])

  async function syncProgress() {
    let prog = await loadProgress()
    if (!prog) prog = await saveProgress({ xp: 0, concepts_seen: [], cases_done: [], ...DAY_RESET })
    else if (prog.last_active !== TODAY) prog = await saveProgress(DAY_RESET)
    setProgress(prog)
    setCachedProgress(prog)
    return prog
  }

  async function init() {
    try {
      const cachedContent = readLS(LS_CONTENT)
      const cachedProgress = readLS(LS_PROGRESS)

      if (cachedContent && cachedProgress) {
        setTodayContent(cachedContent)
        setProgress(cachedProgress)
        setScreen('home')
        syncProgress().catch(console.error)
        maintainQueue()
        return
      }

      setLoadingMsg('Loading your progress...')
      await syncProgress()

      setLoadingMsg("Opening today's briefing...")
      // Slow path only happens the very first time (or if the weekly batch isn't ready yet)
      const slow = setTimeout(() => setLoadingMsg('Writing a fresh briefing, this takes about a minute...'), 4000)
      const { bundle } = await fetchToday().finally(() => clearTimeout(slow))
      setCachedContent(bundle)
      setTodayContent(bundle)
      setScreen('home')

      // Top up the weekly queue in the background
      maintainQueue()
    } catch (err) {
      console.error('Init error:', err)
      setError(err.message)
    }
  }

  async function update(updates) {
    const updated = await saveProgress(updates)
    setProgress(updated)
    setCachedProgress(updated)
  }

  async function handleArticleComplete() {
    await update({
      article_read_today: true,
      xp: (progress?.xp || 0) + 20,
      concepts_seen: [...new Set([...(progress?.concepts_seen || []), todayContent?.article?.concept].filter(Boolean))],
    })
  }

  async function handleCaseDecide(decision, wasCorrect, reasoning) {
    await update({
      case_done_today: true,
      xp: (progress?.xp || 0) + (wasCorrect ? 30 : 15) + (reasoning ? 5 : 0),
      cases_done: [...(progress?.cases_done || []), todayContent?.case?.id].filter(Boolean),
    })
    if (todayContent?.case?.id) await saveDecision(todayContent.case.id, decision, wasCorrect, reasoning, 'case')
  }

  async function handleTurnaroundDecide(decision, wasCorrect, reasoning) {
    await update({
      turnaround_done_today: true,
      xp: (progress?.xp || 0) + (wasCorrect ? 30 : 15) + (reasoning ? 5 : 0),
      turnarounds_done: [...(progress?.turnarounds_done || []), todayContent?.turnaround?.id].filter(Boolean),
    })
    if (todayContent?.turnaround?.id) await saveDecision(todayContent.turnaround.id, decision, wasCorrect, reasoning, 'turnaround')
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

  const navBtn = (key, icon, label, onClick) => (
    <button key={key} style={{ flex:1, background:'none', border:'none', color: key === 'home' ? '#c5f135' : '#7a7d6e', fontFamily:'DM Mono,monospace', fontSize:10, padding:'10px 2px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' }} onClick={onClick}>
      <span style={{fontSize:16}}>{icon}</span><span>{label}</span>
    </button>
  )

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
        {screen === 'home' && <HomeScreen progress={progress} todayContent={todayContent} onOpenArticle={() => setScreen('article')} onOpenCase={() => setScreen('case')} onOpenTurnaround={() => setScreen('turnaround')} />}
        {screen === 'article' && todayContent?.article && <ArticleView article={todayContent.article} onComplete={handleArticleComplete} completed={progress?.article_read_today} />}
        {screen === 'case' && todayContent?.case && <CaseView key="case" caseData={todayContent.case} onDecide={handleCaseDecide} completed={progress?.case_done_today} />}
        {screen === 'turnaround' && todayContent?.turnaround && <CaseView key="turn" caseData={todayContent.turnaround} onDecide={handleTurnaroundDecide} completed={progress?.turnaround_done_today} />}
      </div>

      {screen === 'home' && (
        <nav style={{ flexShrink:0, display:'flex', background:'#141510', borderTop:'1px solid #252820', paddingBottom:'env(safe-area-inset-bottom)' }}>
          {navBtn('home', '◆', 'Today', () => {})}
          {navBtn('article', '▦', 'Article', () => setScreen('article'))}
          {navBtn('case', '❖', 'Case', () => setScreen('case'))}
          {navBtn('turnaround', '⟳', 'Turnaround', () => setScreen('turnaround'))}
        </nav>
      )}
    </div>
  )
}
