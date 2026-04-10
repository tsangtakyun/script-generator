'use client'
import { createClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#171a2f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '32px' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: '520px', padding: '34px', borderRadius: '28px', background: 'rgba(34, 38, 68, 0.92)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 28px 80px rgba(3, 6, 20, 0.36)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '999px', background: '#ff7b4d', display: 'inline-block' }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '999px', background: '#7b61ff', display: 'inline-block' }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '999px', background: '#5e8bff', display: 'inline-block' }} />
          <span style={{ marginLeft: '8px', fontSize: '15px', fontWeight: 700, color: '#f7f8ff' }}>SOON Internal</span>
        </div>
        <p style={{ fontSize: '12px', letterSpacing: '0.16em', color: '#8e94ba', marginBottom: '10px', textTransform: 'uppercase' }}>SOON 劇本工作台</p>
        <h1 style={{ fontSize: '42px', lineHeight: 1.02, fontWeight: 600, color: '#f5f7ff', margin: '0 0 14px' }}>登入劇本生成系統</h1>
        <p style={{ fontSize: '15px', color: '#c9cdec', margin: '0 0 28px', lineHeight: 1.7 }}>
          進入 SOON 內部工作台，承接題材、生成初稿、進行 QC，再將內容推進下一個創作流程。
        </p>
        {error === 'unauthorized' && (
          <p style={{ color: '#ffc0c0', marginBottom: '20px', fontSize: '14px', padding: '14px 16px', borderRadius: '16px', background: 'rgba(88,26,34,0.55)', border: '1px solid rgba(255,120,120,0.2)' }}>
            你的帳號未獲授權，請聯絡管理員。
          </p>
        )}
        <button onClick={handleGoogleLogin} style={{ width: '100%', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(130,126,255,0.48)', background: 'linear-gradient(135deg,#7b61ff,#5e8bff)', color: '#fff', fontSize: '15px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: 'pointer', boxShadow: '0 18px 36px rgba(93,104,255,0.28)' }}>
          以 Google 帳號登入
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>
}
