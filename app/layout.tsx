import type { Metadata } from "next";
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: "SOON 內部系統 · 劇本生成",
  description: "SOON 內部劇本工作台",
};

function NavBar({ creatorMode }: { creatorMode: boolean }) {
  const pillStyle = {
    fontSize: '12px',
    color: 'var(--soon-text-secondary)',
    textDecoration: 'none',
    padding: '8px 14px',
    borderRadius: 'var(--soon-radius)',
    border: '0.5px solid var(--soon-border)',
    background: 'transparent',
    letterSpacing: '0.03em',
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    whiteSpace: 'nowrap' as const,
  }

  const activePillStyle = {
    ...pillStyle,
    color: '#fff',
    border: '0.5px solid rgba(124,58,237,0.3)',
    background: 'var(--soon-purple)',
  }

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      background: '#0f0f0f',
      borderBottom: '0.5px solid var(--soon-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 18px',
      height: '64px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ width: '11px', height: '11px', borderRadius: '999px', background: 'var(--soon-purple)', display: 'inline-block' }} />
          <span style={{ width: '11px', height: '11px', borderRadius: '999px', background: 'var(--soon-purple-light)', display: 'inline-block' }} />
          <span style={{ width: '11px', height: '11px', borderRadius: '999px', background: 'var(--soon-success)', display: 'inline-block' }} />
        </div>
        <div style={{ color: 'var(--soon-text)', fontSize: '15px', fontWeight: 700, fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap' }}>
          SOON Internal
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', paddingLeft: '12px' }}>
        <a href="https://idea-brainstorm.vercel.app" style={pillStyle}>題材</a>
        <a href="https://script-generator-xi.vercel.app" style={activePillStyle}>劇本</a>
        <a href="https://soon-storyboard.vercel.app/storyboard" style={pillStyle}>分鏡</a>
        <a href="https://soon-strategy-library.vercel.app" style={pillStyle}>策略</a>
        {creatorMode && (
          <a href="https://soon-creator-network.vercel.app/creator-workspace" style={pillStyle}>
            Creator Dashboard
          </a>
        )}
      </div>
    </nav>
  )
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const creatorMode = cookieStore.get('soon_creator_mode')?.value === '1'

  return (
    <html lang="zh-HK">
      <head>
        <link rel="stylesheet" href="/soon-design-system.css" />
      </head>
      <body style={{ margin: 0, padding: 0, paddingTop: '64px', background: 'var(--soon-bg)' }}>
        <NavBar creatorMode={creatorMode} />
        {children}
      </body>
    </html>
  )
}
