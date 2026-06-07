import React from 'react'

export default function LoadingScreen({ message = 'Generating your daily briefing…' }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.inner}>
        <div style={styles.logo}>carry<span style={{ color: '#c5f135' }}>.</span></div>
        <div style={styles.spinner} />
        <p style={styles.message}>{message}</p>
        <p style={styles.sub}>Powered by Claude · content is fresh daily</p>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0c0d0b',
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    padding: 40,
  },
  logo: {
    fontFamily: 'Playfair Display, serif',
    fontSize: 36,
    fontWeight: 700,
    color: '#ece9dc',
    letterSpacing: '-1px',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '2px solid #252820',
    borderTop: '2px solid #c5f135',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  message: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 13,
    color: '#7a7d6e',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  sub: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 11,
    color: '#4a4d40',
    textAlign: 'center',
  },
}
