'use client'
import { useState, useEffect } from 'react'

const INDUSTRIES = ['飲食', '旅遊', '美妝', '活動', '好物分享', '生活', '文化', '科技']

const HOOKS = [
  { c: 'H1', n: '極端行動質問', d: '誇張行為/處境問觀眾' },
  { c: 'H2', n: '真定假 — 直接挑戰', d: '質疑廣泛聲稱，邀請驗證' },
  { c: 'H3', n: '聽講 — 半信半疑', d: '借第三者說法引入懸念' },
  { c: 'H4', n: '感官喚起 + 懸念', d: '啟動感官記憶再拋轉折' },
  { c: 'H5', n: '反差驚喜 — 竟然', d: '意想不到對比，情緒跳躍' },
  { c: 'H6', n: '意外自我披露', d: '個人資訊拉近距離' },
  { c: 'H7', n: '荒誕事實', d: '真實但匪夷所思，引發驚訝' },
  { c: 'H8', n: '代入感假設', d: '「如果」句式直問觀眾' },
]

const TRANS = [
  { c: 'T1', n: '情緒代入 — 同行感', d: '主持緊張，拉觀眾入狀態' },
  { c: 'T2', n: '轉念 — 入去先信咗', d: '懷疑被現實正面打臉' },
  { c: 'T3', n: '質疑名氣 — 實力存疑', d: '對名氣打預防針' },
  { c: 'T4', n: '實測宣言 — 等我試下', d: '宣佈「我幫你試」' },
  { c: 'T5', n: '場景切割 — 另有真相', d: '意想不到角度重新定義' },
  { c: 'T6', n: '第一印象反轉', d: '坦白第一眼唔吸引' },
  { c: 'T7', n: '靈魂轉移 — 重點喺呢度', d: '真正精華喺另一樣' },
  { c: 'T8', n: '頓悟時刻', d: '具體動作到情感領悟' },
]

const ENDS = [
  { c: 'E1', n: '留白式 Verdict', d: '坦白收，短句，唔誇張' },
  { c: 'E2', n: '值唔值得 — 親身作答', d: '回應開場，直接給答案' },
  { c: 'E3', n: '情懷翻轉 — 真材實料', d: '老字號靠真實力' },
  { c: 'E4', n: '自嘲收尾 — 解鎖', d: '輕鬆收，帶幽默' },
  { c: 'E5', n: '詩意留白', d: '短句節奏，情緒拉遠' },
  { c: 'E6', n: '個人感悟 — 超越食玩', d: '升華到人生意義' },
  { c: 'E7', n: '哲學收結', d: '最有重量，適合文化類' },
]

type StyleMemoryEntry = {
  id: string
  topic: string
  createdAt: string
  editSummary: string
  styleRules: string[]
  bannedTone: string[]
  winningTouches: string[]
}

const STYLE_MEMORY_KEY = 'soon-script-style-memory-v1'

function buildSystem(styleMemoryText?: string) {
  return `你係廣東話短片 script 寫手，幫 content creator 寫 IG Reel / YouTube Short。
廣東話口語，短句，坦白，唔oversell，每句有目的。

結構：
1.【Opening Hook】一句，5秒
2.【背景 VO】80-100字
3.【轉場】一句，10秒
4.【實測內容】4項，每項：名稱、拍攝提示、旁白1-2句
5.【Ending】一句5秒＋主持1-2句感想

Hook：H1誇張行為問觀眾｜H2挑戰廣泛聲稱｜H3借第三者引懸念｜H4感官記憶+轉折｜H5意外對比｜H6個人披露｜H7荒誕事實｜H8如果句式
轉場：T1主持緊張同行｜T2懷疑被打臉｜T3對名氣存疑｜T4宣佈親自試｜T5意外角度｜T6第一眼唔吸引｜T7重點係另一樣｜T8動作到領悟
Ending：E1坦白留白｜E2直接回應開場｜E3真實力｜E4自嘲幽默｜E5詩意短句｜E6升華人生｜E7哲學重量

輸出格式：

【Opening Hook】
（一句）

【背景 VO】
（80-100字）

【轉場】
（一句）

【實測內容】
1. 名稱
   拍攝：
   旁白：

2. 名稱
   拍攝：
   旁白：

3. 名稱
   拍攝：
   旁白：

4. 名稱
   拍攝：
   旁白：

【Ending】
（一句）
＋ 主持1-2句感想

${styleMemoryText ? `請額外遵守以下已驗證風格記憶：
${styleMemoryText}` : ''}`
}

function buildStyleAnalysisSystem() {
  return `你係內容總監，專門分析「AI 初稿」同「人手 QC 稿」之間嘅差異。
請只輸出有效 JSON：
{
  "editSummary": "用繁體中文總結 2-3 句，說明今次主要改稿方向",
  "styleRules": ["3-6條具體寫作規則"],
  "bannedTone": ["2-5條不想再出現的AI語氣/寫法"],
  "winningTouches": ["2-5條這次加得好的有趣位/人味處理"]
}`
}

function splitScriptSections(raw: string) {
  const sectionTitles = ['【Opening Hook】', '【背景 VO】', '【轉場】', '【實測內容】', '【Ending】']
  const sections = sectionTitles.map((title, index) => {
    const start = raw.indexOf(title)
    if (start === -1) return null
    const nextTitle = sectionTitles.slice(index + 1).map(t => raw.indexOf(t)).find(pos => pos !== -1 && pos > start) ?? raw.length
    const content = raw.slice(start + title.length, nextTitle).trim()
    return { title, content }
  }).filter(Boolean) as { title: string; content: string }[]
  return sections.length ? sections : [{ title: '完整 Script', content: raw.trim() }]
}

const css = {
  bg: '#EEEADE',
  ink: '#1a1a18',
  ink2: '#5a5a52',
  ink3: '#9a9a8e',
  border: 'rgba(26,26,24,0.13)',
  border2: 'rgba(26,26,24,0.28)',
  inputBg: 'rgba(255,255,255,0.55)',
  inputFocus: 'rgba(255,255,255,0.85)',
  radius: '8px',
}

export default function ScriptGenerator() {
  const [brand, setBrand] = useState('')
  const [industry, setIndustry] = useState('飲食')
  const [topic, setTopic] = useState('')
  const [background, setBackground] = useState('')
  const [selH, setSelH] = useState('H1')
  const [selT, setSelT] = useState('T1')
  const [selE, setSelE] = useState('E1')
  const [script, setScript] = useState('')
  const [qcScript, setQcScript] = useState('')
  const [styleMemory, setStyleMemory] = useState<StyleMemoryEntry[]>([])
  const [editSummary, setEditSummary] = useState('')
  const [styleRulesPreview, setStyleRulesPreview] = useState<string[]>([])
  const [analyzingEdits, setAnalyzingEdits] = useState(false)
  const [styleSaved, setStyleSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedQc, setCopiedQc] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [importedFromIdea, setImportedFromIdea] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const topicParam = params.get('topic')
    const backgroundParam = params.get('background')
    if (topicParam) setTopic(topicParam)
    if (backgroundParam) setBackground(backgroundParam)
    if (topicParam || backgroundParam) setImportedFromIdea(true)
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STYLE_MEMORY_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setStyleMemory(parsed)
    } catch {
      // ignore corrupt local memory
    }
  }, [])

  const generate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setScript('')
    setQcScript('')
    setError('')
    setUploadDone(false)
    setDriveUrl('')
    setEditSummary('')
    setStyleRulesPreview([])
    setStyleSaved(false)

    const h = HOOKS.find(x => x.c === selH)!
    const t = TRANS.find(x => x.c === selT)!
    const e = ENDS.find(x => x.c === selE)!

    const learnedRules = styleMemory
      .slice(0, 8)
      .flatMap(entry => entry.styleRules.map(rule => `- ${rule}`))
      .slice(0, 12)
      .join('\n')

    const userMsg = `${brand ? `品牌：${brand}\n` : ''}類型：${industry}
主題：${topic}
${background ? `背景資料：${background}\n` : ''}Hook：${h.c}｜轉場：${t.c}｜Ending：${e.c}

請即刻輸出完整 script，唔好加前言。`

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: buildSystem(learnedRules ? `你以往人手 QC 後沉澱出以下偏好規則，請盡量貼近：\n${learnedRules}` : ''),
          messages: [{ role: 'user', content: userMsg }]
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      const generated = data.content?.[0]?.text || ''
      setScript(generated)
      setQcScript(generated)
    } catch (err: any) {
      setError('出現錯誤：' + err.message)
    }
    setLoading(false)
  }

  const copyScript = () => {
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyQcScript = () => {
    navigator.clipboard.writeText(qcScript || script)
    setCopiedQc(true)
    setTimeout(() => setCopiedQc(false), 2000)
  }

  const analyzeEdits = async () => {
    if (!script.trim() || !qcScript.trim()) return
    setAnalyzingEdits(true)
    setError('')
    try {
      const prompt = `以下係同一條 script 的兩個版本。

【AI 初稿】
${script}

【QC 最終稿】
${qcScript}

請分析我今次點樣由 AI 味改到更似真人寫，輸出 JSON。`

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          system: buildStyleAnalysisSystem(),
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message || data.error)
      const text = data.content?.[0]?.text || ''
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      setEditSummary(parsed.editSummary || '')
      setStyleRulesPreview(Array.isArray(parsed.styleRules) ? parsed.styleRules : [])
      const nextEntry: StyleMemoryEntry = {
        id: `${Date.now()}`,
        topic,
        createdAt: new Date().toISOString(),
        editSummary: parsed.editSummary || '',
        styleRules: Array.isArray(parsed.styleRules) ? parsed.styleRules : [],
        bannedTone: Array.isArray(parsed.bannedTone) ? parsed.bannedTone : [],
        winningTouches: Array.isArray(parsed.winningTouches) ? parsed.winningTouches : [],
      }
      const nextMemory = [nextEntry, ...styleMemory].slice(0, 30)
      setStyleMemory(nextMemory)
      window.localStorage.setItem(STYLE_MEMORY_KEY, JSON.stringify(nextMemory))
      setStyleSaved(true)
    } catch (err: any) {
      setError('分析改稿規律失敗：' + err.message)
    }
    setAnalyzingEdits(false)
  }

  const uploadToDrive = async () => {
    const finalContent = qcScript || script
    if (!finalContent) return
    setUploading(true)
    setUploadDone(false)
    try {
      const title = `${brand || '未命名'} — ${topic || 'Script'}${qcScript ? ' (QC)' : ''}`
      const res = await fetch('/api/upload-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: finalContent }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDriveUrl(data.url)
      setUploadDone(true)
    } catch (err: any) {
      alert('上傳失敗：' + err.message)
    }
    setUploading(false)
  }

  const StyleCard = ({ item, selected, onSelect }: { item: any, selected: boolean, onSelect: () => void }) => (
    <div onClick={onSelect} style={{
      cursor: 'pointer', padding: '15px 17px', borderRadius: css.radius,
      border: `1px solid ${selected ? css.ink : css.border}`,
      backgroundColor: selected ? css.inputFocus : css.inputBg,
      transition: 'all .18s',
    }}>
      <div style={{ fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: css.ink3, marginBottom: '5px', fontWeight: 500 }}>{item.c}</div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: css.ink, marginBottom: '3px' }}>{item.n}</div>
      <div style={{ fontSize: '11px', color: css.ink3, lineHeight: 1.45 }}>{item.d}</div>
    </div>
  )

  const inputStyle = {
    width: '100%', background: css.inputBg, border: `1px solid ${css.border}`,
    borderRadius: css.radius, padding: '16px 20px', fontSize: '15px',
    fontFamily: "'DM Sans', sans-serif", color: css.ink, outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ backgroundColor: css.bg, color: css.ink, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '56px 40px 100px' }}>

        <div style={{ fontSize: '11px', letterSpacing: '.17em', textTransform: 'uppercase' as const, color: css.ink3, marginBottom: '14px' }}>AI Media Content Creation</div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '52px', fontWeight: 400, lineHeight: 1.05, color: css.ink, marginBottom: '36px' }}>
          Script Generator <span style={{ color: css.ink3, fontStyle: 'italic' }}>/ Beta</span>
        </h1>
        {importedFromIdea && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: css.radius,
            border: `1px solid ${css.border2}`,
            background: 'rgba(255,255,255,0.55)',
            fontSize: '13px',
            color: css.ink2,
          }}>
            已從 Idea Collection 帶入主題／背景資料，你可以喺生成前再微調。
          </div>
        )}
        <div style={{ height: '1px', background: css.border, marginBottom: '52px' }} />

        {/* 01 品牌 */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>01</div>
          <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '20px' }}>品牌 / 個人名稱</div>
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="例：One Bite、丁丁、Hilary Travels" style={inputStyle} />
        </div>

        {/* 02 行業 */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>02</div>
          <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '20px' }}>行業 / 類型</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '10px' }}>
            {INDUSTRIES.map(i => (
              <button key={i} onClick={() => setIndustry(i)} style={{
                cursor: 'pointer', fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
                padding: '9px 22px', borderRadius: '99px',
                border: `1px solid ${industry === i ? css.ink : css.border2}`,
                color: industry === i ? css.bg : css.ink2,
                background: industry === i ? css.ink : 'transparent',
              }}>{i}</button>
            ))}
          </div>
        </div>

        {/* 03 主題 */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>03</div>
          <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '20px' }}>主題</div>
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="例：最強宵夜滷肉飯？全世界最靚聖誕市集？" style={inputStyle} />
        </div>

        {/* 04 背景資料 */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>04</div>
          <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '20px' }}>請提供完整背景資料</div>
          <textarea value={background} onChange={e => setBackground(e.target.value)}
            placeholder="例：係老字號，成立1920年，主打豬油糕同老婆餅..."
            style={{ ...inputStyle, minHeight: '130px', resize: 'vertical' as const, lineHeight: 1.65 }} />
        </div>

        <div style={{ height: '1px', background: css.border, marginBottom: '52px' }} />

        {/* 05 Hook */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>05</div>
          <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '20px' }}>Hook 風格</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
            {HOOKS.map(h => <StyleCard key={h.c} item={h} selected={selH === h.c} onSelect={() => setSelH(h.c)} />)}
          </div>
        </div>

        {/* 06 轉場 */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>06</div>
          <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '20px' }}>轉場風格</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
            {TRANS.map(t => <StyleCard key={t.c} item={t} selected={selT === t.c} onSelect={() => setSelT(t.c)} />)}
          </div>
        </div>

        {/* 07 Ending */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>07</div>
          <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '20px' }}>Ending 風格</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
            {ENDS.map(e => <StyleCard key={e.c} item={e} selected={selE === e.c} onSelect={() => setSelE(e.c)} />)}
          </div>
        </div>

        {/* 生成按鈕 */}
        <button onClick={generate} disabled={loading} style={{
          width: '100%', padding: '18px', borderRadius: css.radius, border: 'none',
          background: loading ? css.ink3 : css.ink, color: css.bg,
          fontSize: '15px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px',
        }}>
          {loading ? '正在生成，約需 15 秒...' : '生成 Script'}
        </button>

        {error && (
          <div style={{ marginTop: '14px', padding: '14px 18px', borderRadius: css.radius, background: 'rgba(180,60,60,.08)', border: '1px solid rgba(180,60,60,.2)', color: '#8b3333', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* 輸出結果 */}
        {script && (
          <div style={{ marginTop: '56px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: css.ink3, marginBottom: '16px' }}>
              {[brand, industry, topic].filter(Boolean).join('  ·  ')}
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.65)', border: `1px solid ${css.border}`, borderRadius: css.radius, padding: '24px 28px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase' as const, color: css.ink3, marginBottom: '14px' }}>AI 初稿</div>
                <div style={{ display: 'grid', gap: '14px' }}>
                  {splitScriptSections(script).map(section => (
                    <div key={section.title} style={{ borderBottom: `1px solid ${css.border}`, paddingBottom: '14px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 500, color: css.ink, marginBottom: '8px' }}>{section.title}</div>
                      <div style={{ fontSize: '14px', lineHeight: 1.9, color: css.ink, whiteSpace: 'pre-wrap' as const }}>{section.content}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.78)', border: `1px solid ${css.border2}`, borderRadius: css.radius, padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
                  <div>
                    <div style={{ fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase' as const, color: css.ink3, marginBottom: '6px' }}>QC 最終稿</div>
                    <div style={{ fontSize: '13px', color: css.ink2 }}>你改完呢版之後，上傳去 Drive 會以呢份為準。</div>
                  </div>
                  <div style={{ fontSize: '11px', color: styleSaved ? '#4a8a5c' : css.ink3 }}>
                    {styleSaved ? '✓ 已加入 Style Memory' : `${styleMemory.length} 條 Style Memory`}
                  </div>
                </div>
                <textarea
                  value={qcScript}
                  onChange={e => setQcScript(e.target.value)}
                  style={{ ...inputStyle, minHeight: '320px', resize: 'vertical' as const, lineHeight: 1.8, background: 'rgba(255,255,255,0.9)' }}
                />
              </div>
            </div>

            {(editSummary || styleRulesPreview.length > 0) && (
              <div style={{ marginTop: '18px', background: 'rgba(255,255,255,0.55)', border: `1px solid ${css.border}`, borderRadius: css.radius, padding: '22px 24px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase' as const, color: css.ink3, marginBottom: '10px' }}>Style Memory</div>
                {editSummary && (
                  <div style={{ fontSize: '14px', lineHeight: 1.8, color: css.ink2, marginBottom: '12px' }}>{editSummary}</div>
                )}
                {styleRulesPreview.length > 0 && (
                  <ul style={{ paddingLeft: '18px', color: css.ink, lineHeight: 1.8, fontSize: '14px' }}>
                    {styleRulesPreview.map(rule => <li key={rule}>{rule}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' as const }}>
              <button onClick={copyScript} style={{
                fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '10px 22px',
                borderRadius: '99px', border: `1px solid ${css.ink}`, background: css.ink, color: css.bg, cursor: 'pointer',
              }}>{copied ? '已複製！' : '複製 Script'}</button>
              <button onClick={copyQcScript} style={{
                fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '10px 22px',
                borderRadius: '99px', border: `1px solid ${css.border2}`, background: 'transparent', color: css.ink2, cursor: 'pointer',
              }}>{copiedQc ? '已複製 QC 稿！' : '複製 QC 稿'}</button>
              <button onClick={analyzeEdits} disabled={analyzingEdits || !qcScript.trim()} style={{
                fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '10px 22px',
                borderRadius: '99px', border: `1px solid ${css.border2}`, background: css.inputBg, color: css.ink, cursor: analyzingEdits ? 'not-allowed' : 'pointer',
              }}>{analyzingEdits ? '分析改稿中...' : '分析我改咗咩'}</button>
              <button onClick={uploadToDrive} disabled={uploading} style={{
                fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '10px 22px',
                borderRadius: '99px', border: `1px solid ${uploading ? css.border2 : '#4a8a5c'}`,
                background: uploading ? 'transparent' : uploadDone ? '#4a8a5c' : '#4a8a5c',
                color: uploading ? css.ink3 : '#fff', cursor: uploading ? 'not-allowed' : 'pointer',
              }}>{uploading ? '上傳中...' : uploadDone ? '✓ 已上傳 QC 稿到 Drive' : '📁 上傳 QC 稿去 Drive'}</button>
              <button onClick={generate} style={{
                fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '10px 22px',
                borderRadius: '99px', border: `1px solid ${css.border2}`, background: 'transparent', color: css.ink2, cursor: 'pointer',
              }}>重新生成</button>
            </div>
            {driveUrl && (
              <a href={driveUrl} target="_blank" rel="noopener" style={{
                display: 'inline-block', marginTop: '12px', fontSize: '12px', color: '#4a8a5c', textDecoration: 'none',
              }}>→ 喺 Google Drive 開啟</a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
