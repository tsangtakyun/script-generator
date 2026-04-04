'use client'
import { useState } from 'react'

const INDUSTRIES = ['飲食', '旅遊', '美妝', '活動', '好物分享', '生活', '文化', '科技']

const HOOK_STYLES = [
  { id: 'question', label: '問題式', desc: '以問題開場，引起好奇' },
  { id: 'shocking', label: '震撼式', desc: '驚人數據或事實開場' },
  { id: 'story', label: '故事式', desc: '以個人經歷帶入' },
  { id: 'contrast', label: '對比式', desc: '強烈前後對比' },
]

const TRANSITION_STYLES = [
  { id: 'natural', label: '自然過渡', desc: '流暢連接各段落' },
  { id: 'numbered', label: '數字式', desc: '第一、第二、第三' },
  { id: 'question', label: '問題引導', desc: '用問題帶出下一段' },
  { id: 'contrast', label: '轉折式', desc: '但係、然而、不過' },
]

const ENDING_STYLES = [
  { id: 'cta', label: '行動呼籲', desc: '叫用戶追蹤、分享' },
  { id: 'question', label: '互動提問', desc: '問用戶意見引留言' },
  { id: 'summary', label: '總結式', desc: '重申核心信息' },
  { id: 'tbc', label: '待續式', desc: '預告下集內容' },
]

export default function ScriptGenerator() {
  const [brand, setBrand] = useState('')
  const [industry, setIndustry] = useState('')
  const [topic, setTopic] = useState('')
  const [background, setBackground] = useState('')
  const [hookStyle, setHookStyle] = useState('')
  const [transitionStyle, setTransitionStyle] = useState('')
  const [endingStyle, setEndingStyle] = useState('')
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateScript = async () => {
    if (!brand || !industry || !topic || !background || !hookStyle || !transitionStyle || !endingStyle) {
      alert('請填寫所有欄位')
      return
    }
    setLoading(true)
    setScript('')
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `你係一個專業嘅香港短影片 Script Writer，請用廣東話（繁體中文）幫我寫一個 IG Reel / YouTube Shorts 嘅 Script。

品牌／個人名稱：${brand}
行業／類型：${industry}
主題：${topic}
背景資料：${background}
Hook 風格：${hookStyle}
轉場風格：${transitionStyle}
Ending 風格：${endingStyle}

請按以下格式輸出：

【HOOK】
（吸引眼球嘅開場，約5-10秒）

【主體內容】
（核心內容，分2-3個段落）

【ENDING】
（結尾行動呼籲）

【字幕建議】
（3-5個重點字幕）

【拍攝備註】
（給拍攝團隊嘅簡短備註）`
          }]
        })
      })
      const data = await response.json()
      setScript(data.content[0].text)
    } catch (error) {
      alert('生成失敗，請重試')
    }
    setLoading(false)
  }

  const copyScript = () => {
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const style = {
    label: { fontSize: '11px', letterSpacing: '0.15em', color: '#888', marginBottom: '12px', display: 'block' } as React.CSSProperties,
    input: { width: '100%', padding: '12px 16px', border: '1px solid #e0ddd6', backgroundColor: 'transparent', fontSize: '15px', fontFamily: 'EB Garamond, serif', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
    section: { marginBottom: '40px' } as React.CSSProperties,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F2EC', fontFamily: 'EB Garamond, serif', padding: '48px 32px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#888', marginBottom: '8px' }}>SOON · AI MEDIA CONTENT CREATION</p>
        <h1 style={{ fontSize: '36px', fontWeight: '400', color: '#1a1a1a', marginBottom: '48px' }}>劇本生成 <em>/ Beta</em></h1>

        {/* 01 品牌 */}
        <div style={style.section}>
          <label style={style.label}>01 &nbsp; 品牌 / 個人名稱</label>
          <input style={style.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="例：BBO、Tommy Tsang" />
        </div>

        {/* 02 行業 */}
        <div style={style.section}>
          <label style={style.label}>02 &nbsp; 行業 / 類型</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {INDUSTRIES.map(i => (
              <button key={i} onClick={() => setIndustry(i)} style={{
                padding: '8px 18px', border: '1px solid', cursor: 'pointer', fontSize: '14px', fontFamily: 'EB Garamond, serif',
                borderColor: industry === i ? '#1a1a1a' : '#e0ddd6',
                backgroundColor: industry === i ? '#1a1a1a' : 'transparent',
                color: industry === i ? '#F5F2EC' : '#1a1a1a',
              }}>{i}</button>
            ))}
          </div>
        </div>

        {/* 03 主題 */}
        <div style={style.section}>
          <label style={style.label}>03 &nbsp; 主題</label>
          <input style={style.input} value={topic} onChange={e => setTopic(e.target.value)} placeholder="例：介紹新開嘅隱藏餐廳" />
        </div>

        {/* 04 背景資料 */}
        <div style={style.section}>
          <label style={style.label}>04 &nbsp; 請提供完整背景資料</label>
          <textarea style={{ ...style.input, minHeight: '120px', resize: 'vertical' }} value={background} onChange={e => setBackground(e.target.value)} placeholder="例：餐廳位於中環，主打懷舊港式小炒，人均消費$150，最近獲米芝蓮推薦..." />
        </div>

        {/* 05 Hook */}
        <div style={style.section}>
          <label style={style.label}>05 &nbsp; Hook 風格</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {HOOK_STYLES.map(h => (
              <button key={h.id} onClick={() => setHookStyle(h.label)} style={{
                padding: '14px 16px', border: '1px solid', cursor: 'pointer', textAlign: 'left', fontFamily: 'EB Garamond, serif',
                borderColor: hookStyle === h.label ? '#1a1a1a' : '#e0ddd6',
                backgroundColor: hookStyle === h.label ? '#1a1a1a' : 'transparent',
                color: hookStyle === h.label ? '#F5F2EC' : '#1a1a1a',
              }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>{h.label}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{h.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 06 轉場 */}
        <div style={style.section}>
          <label style={style.label}>06 &nbsp; 轉場風格</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {TRANSITION_STYLES.map(t => (
              <button key={t.id} onClick={() => setTransitionStyle(t.label)} style={{
                padding: '14px 16px', border: '1px solid', cursor: 'pointer', textAlign: 'left', fontFamily: 'EB Garamond, serif',
                borderColor: transitionStyle === t.label ? '#1a1a1a' : '#e0ddd6',
                backgroundColor: transitionStyle === t.label ? '#1a1a1a' : 'transparent',
                color: transitionStyle === t.label ? '#F5F2EC' : '#1a1a1a',
              }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>{t.label}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 07 Ending */}
        <div style={style.section}>
          <label style={style.label}>07 &nbsp; Ending 風格</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {ENDING_STYLES.map(e => (
              <button key={e.id} onClick={() => setEndingStyle(e.label)} style={{
                padding: '14px 16px', border: '1px solid', cursor: 'pointer', textAlign: 'left', fontFamily: 'EB Garamond, serif',
                borderColor: endingStyle === e.label ? '#1a1a1a' : '#e0ddd6',
                backgroundColor: endingStyle === e.label ? '#1a1a1a' : 'transparent',
                color: endingStyle === e.label ? '#F5F2EC' : '#1a1a1a',
              }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>{e.label}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{e.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 生成按鈕 */}
        <button onClick={generateScript} disabled={loading} style={{
          width: '100%', padding: '16px', border: '1px solid #1a1a1a',
          backgroundColor: loading ? '#e0ddd6' : '#1a1a1a',
          color: loading ? '#888' : '#F5F2EC',
          fontSize: '15px', fontFamily: 'EB Garamond, serif', cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.1em', marginBottom: '40px',
        }}>
          {loading ? '生成中...' : '生成 Script'}
        </button>

        {/* Script 輸出 */}
        {script && (
          <div style={{ borderTop: '1px solid #e0ddd6', paddingTop: '40px' }}>
            <label style={style.label}>生成結果</label>
            <div style={{ backgroundColor: '#fff', padding: '24px', border: '1px solid #e0ddd6', whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.8', marginBottom: '16px' }}>
              {script}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={copyScript} style={{
                flex: 1, padding: '12px', border: '1px solid #1a1a1a', backgroundColor: 'transparent',
                color: '#1a1a1a', fontSize: '14px', fontFamily: 'EB Garamond, serif', cursor: 'pointer',
              }}>
                {copied ? '已複製！' : '複製 Script'}
              </button>
              <button onClick={generateScript} style={{
                flex: 1, padding: '12px', border: '1px solid #e0ddd6', backgroundColor: 'transparent',
                color: '#888', fontSize: '14px', fontFamily: 'EB Garamond, serif', cursor: 'pointer',
              }}>
                重新生成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
