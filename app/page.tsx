'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

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
  fingerprint: string
  topic: string
  createdAt: string
  editSummary: string
  styleRules: string[]
  bannedTone: string[]
  winningTouches: string[]
  aiDraft?: string
  qcFinal?: string
}

type ScriptHistoryRecord = {
  id: string
  title?: string | null
  brand?: string | null
  industry?: string | null
  topic?: string | null
  background?: string | null
  hook_code?: string | null
  trans_code?: string | null
  ending_code?: string | null
  ai_draft?: string | null
  qc_final?: string | null
  content?: string | null
  created_at?: string | null
  generated_at?: string | null
}

const STYLE_MEMORY_KEY = 'soon-script-style-memory-v1'
const ANTHROPIC_MODEL = 'claude-sonnet-4-6'

function makeFingerprint(topic: string, aiDraft: string, qcFinal: string) {
  const source = `${topic}::${aiDraft}::${qcFinal}`
  let hash = 0
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0
  }
  return `sm_${hash.toString(16)}`
}

function mergeStyleMemories(entries: StyleMemoryEntry[]) {
  const seen = new Set<string>()
  return entries
    .filter(entry => {
      const key = entry.fingerprint || entry.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 30)
}

function normalizeStyleMemoryRow(row: any): StyleMemoryEntry {
  return {
    id: row.id,
    fingerprint: row.fingerprint || `${row.id}`,
    topic: row.topic || '',
    createdAt: row.created_at || new Date().toISOString(),
    editSummary: row.edit_summary || '',
    styleRules: Array.isArray(row.style_rules) ? row.style_rules : [],
    bannedTone: Array.isArray(row.banned_tone) ? row.banned_tone : [],
    winningTouches: Array.isArray(row.winning_touches) ? row.winning_touches : [],
    aiDraft: row.ai_draft || '',
    qcFinal: row.qc_final || '',
  }
}

function buildSystem(styleMemoryText?: string) {
  return `你係廣東話短片 script 寫手，幫 content creator 寫 IG Reel / YouTube Short。
廣東話口語，短句，坦白，唔oversell，每句有目的。

結構：
1.【Opening Hook】一句，5秒
2.【舖頭資料】如有舖頭名稱 / 地址就原文列出，方便試拍現場導航
3.【背景 VO】根據題目、地址同題材想法，由 AI 總結成 50-80 字背景資料
4.【轉場】一句，10秒
5.【實測內容】4項，每項獨立分段：名稱、拍攝、內容、現場調整
6.【Ending】一句5秒＋主持1-2句感想

實測內容規則：
- 唔好每一 part 都寫成「旁白」。
- 每一 part 用「內容：」取代「旁白：」。
- 「內容」要 AI 化身成主持，寫成現場試食/試玩/試用時會講同會做嘅內容，大概 45-60 字。
- 每一 part 都要加「現場調整：主持到場後按真實味道、環境、人流、排隊、價錢或服務再微調。」
- 拍攝提示同內容要分開，方便現場 crew 睇。

Hook：H1誇張行為問觀眾｜H2挑戰廣泛聲稱｜H3借第三者引懸念｜H4感官記憶+轉折｜H5意外對比｜H6個人披露｜H7荒誕事實｜H8如果句式
轉場：T1主持緊張同行｜T2懷疑被打臉｜T3對名氣存疑｜T4宣佈親自試｜T5意外角度｜T6第一眼唔吸引｜T7重點係另一樣｜T8動作到領悟
Ending：E1坦白留白｜E2直接回應開場｜E3真實力｜E4自嘲幽默｜E5詩意短句｜E6升華人生｜E7哲學重量

輸出格式：

【Opening Hook】
（一句）

【舖頭資料】
名稱：（如有就列出；如無就寫：未提供）
地址：（如有就列出；如無就寫：未提供）

【背景 VO】
（50-80字。唔好照抄題材想法，要整理成可直接旁白嘅背景資料）

【轉場】
（一句）

【實測內容】
1. 名稱
   拍攝：
   內容：
   現場調整：

2. 名稱
   拍攝：
   內容：
   現場調整：

3. 名稱
   拍攝：
   內容：
   現場調整：

4. 名稱
   拍攝：
   內容：
   現場調整：

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
  const sectionTitles = ['【Opening Hook】', '【舖頭資料】', '【舖頭地址】', '【背景 VO】', '【轉場】', '【實測內容】', '【Ending】']
  const sections = sectionTitles.map((title, index) => {
    const start = raw.indexOf(title)
    if (start === -1) return null
    const nextTitle = sectionTitles.slice(index + 1).map(t => raw.indexOf(t)).find(pos => pos !== -1 && pos > start) ?? raw.length
    const content = raw.slice(start + title.length, nextTitle).trim()
    return { title, content }
  }).filter(Boolean) as { title: string; content: string }[]
  return sections.length ? sections : [{ title: '完整 Script', content: raw.trim() }]
}

function splitTestContentItems(content: string) {
  const items = content
    .split(/\n(?=\d+\.\s)/)
    .map(item => item.trim())
    .filter(Boolean)
  return items.length > 1 ? items : [content]
}

function extractShopNameFromNote(note: string) {
  const match = note.match(/(?:^|\n)(?:店鋪 \/ 品牌|舖頭名稱|店鋪名稱)：([^\n]+)/)
  return match?.[1]?.trim() || ''
}

function getApiErrorMessage(error: unknown) {
  if (!error) return '未知錯誤'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return '未知錯誤'
}

function decodeSoonAuthHash() {
  if (typeof window === 'undefined') return null
  const marker = '#soon_auth='
  if (!window.location.hash.startsWith(marker)) return null

  try {
    const raw = decodeURIComponent(window.location.hash.slice(marker.length))
    return JSON.parse(window.atob(raw)) as {
      accessToken?: string
      refreshToken?: string
      userId?: string
      workspaceId?: string
    }
  } catch {
    return null
  }
}

function formatHistoryDate(value?: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-HK', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const css = {
  bg: '#171a2f',
  ink: '#f5f7ff',
  ink2: '#c9cdec',
  ink3: '#8e94ba',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(128,118,255,0.28)',
  inputBg: 'rgba(255,255,255,0.05)',
  inputFocus: 'rgba(111,107,255,0.14)',
  radius: '18px',
}

export default function ScriptGenerator() {
  const supabase = createClient()
  const [authReady, setAuthReady] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [brand, setBrand] = useState('')
  const [industry, setIndustry] = useState('飲食')
  const [topic, setTopic] = useState('')
  const [shopName, setShopName] = useState('')
  const [address, setAddress] = useState('')
  const [ideaNote, setIdeaNote] = useState('')
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
  const [styleStorageMode, setStyleStorageMode] = useState<'local' | 'supabase'>('local')
  const [styleSyncing, setStyleSyncing] = useState(false)
  const [styleSyncMessage, setStyleSyncMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [copiedQc, setCopiedQc] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [importedFromIdea, setImportedFromIdea] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [sendingStoryboard, setSendingStoryboard] = useState(false)
  const [scriptHistory, setScriptHistory] = useState<ScriptHistoryRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySaving, setHistorySaving] = useState(false)
  const [historyMessage, setHistoryMessage] = useState('')

  const persistLocalMemory = (entries: StyleMemoryEntry[]) => {
    window.localStorage.setItem(STYLE_MEMORY_KEY, JSON.stringify(entries))
    setStyleMemory(entries)
  }

  const syncEntriesToSupabase = async (entries: StyleMemoryEntry[]) => {
    if (!supabase) throw new Error('Supabase 未設定，暫時只會儲存在本機')

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) throw new Error('請先登入，先可以同步到 Supabase')

    const payload = entries.map(entry => ({
      user_id: user.id,
      fingerprint: entry.fingerprint,
      topic: entry.topic,
      edit_summary: entry.editSummary,
      style_rules: entry.styleRules,
      banned_tone: entry.bannedTone,
      winning_touches: entry.winningTouches,
      ai_draft: entry.aiDraft || '',
      qc_final: entry.qcFinal || '',
      created_at: entry.createdAt,
    }))

    const { data, error } = await supabase
      .from('style_memories')
      .upsert(payload, { onConflict: 'user_id,fingerprint' })
      .select('*')

    if (error) throw error

    const merged = mergeStyleMemories([
      ...(Array.isArray(data) ? data.map(normalizeStyleMemoryRow) : []),
      ...entries,
    ])
    persistLocalMemory(merged)
    setStyleStorageMode('supabase')
    return merged
  }

  const syncLocalMemoryToSupabase = async () => {
    setStyleSyncing(true)
    setStyleSyncMessage('')
    try {
      if (styleMemory.length === 0) throw new Error('目前冇 Style Memory 可同步')
      await syncEntriesToSupabase(styleMemory)
      setStyleSyncMessage('✓ Local Style Memory 已同步到 Supabase')
    } catch (err: any) {
      setStyleStorageMode('local')
      setStyleSyncMessage(`同步失敗：${err.message}`)
    } finally {
      setStyleSyncing(false)
    }
  }

  useEffect(() => {
    const bootstrapSoonAuth = async () => {
      if (!supabase) {
        setAuthReady(true)
        return
      }

      try {
        const authPayload = decodeSoonAuthHash()
        if (authPayload?.accessToken && authPayload.refreshToken) {
          await supabase.auth.setSession({
            access_token: authPayload.accessToken,
            refresh_token: authPayload.refreshToken,
          })
          if (authPayload.workspaceId) setActiveWorkspaceId(authPayload.workspaceId)
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
        }

        const { data } = await supabase.auth.getUser()
        if (data.user?.id) setCurrentUserId(data.user.id)
      } finally {
        setAuthReady(true)
      }
    }

    bootstrapSoonAuth()
  }, [])

  const loadScriptHistory = async (userId = currentUserId) => {
    if (!supabase || !userId) return
    setHistoryLoading(true)
    setHistoryMessage('')
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setScriptHistory((data ?? []) as ScriptHistoryRecord[])
    } catch (err: any) {
      setHistoryMessage(`歷史載入失敗：${err.message}`)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (!authReady || !currentUserId) return
    void loadScriptHistory(currentUserId)
  }, [authReady, currentUserId])

  const saveScriptToHistory = async () => {
    const finalContent = qcScript || script
    if (!finalContent.trim()) {
      setHistoryMessage('請先生成劇本，先可以同步到歷史。')
      return
    }
    if (!supabase) {
      setHistoryMessage('Supabase 未設定，暫時未能同步歷史。')
      return
    }

    setHistorySaving(true)
    setHistoryMessage('')
    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) throw new Error('請先登入，先可以同步到歷史')

      const payload = {
        user_id: user.id,
        workspace_id: activeWorkspaceId,
        title: topic.trim() || brand.trim() || shopName.trim() || 'IG Reel 劇本',
        brand: brand.trim() || shopName.trim() || null,
        industry,
        topic: topic.trim() || null,
        background: [
          shopName.trim() ? `舖頭名稱：${shopName.trim()}` : '',
          address.trim() ? `地址：${address.trim()}` : '',
          ideaNote.trim() ? ideaNote.trim() : '',
        ].filter(Boolean).join('\n\n') || null,
        hook_code: selH,
        trans_code: selT,
        ending_code: selE,
        ai_draft: script.trim() || finalContent.trim(),
        qc_final: finalContent.trim(),
        model: ANTHROPIC_MODEL,
        generated_at: new Date().toISOString(),
      }

      let { error } = await supabase.from('scripts').insert(payload)
      if (error) {
        const fallbackPayload = {
          user_id: payload.user_id,
          workspace_id: payload.workspace_id,
          title: payload.title,
          brand: payload.brand,
          industry: payload.industry,
          topic: payload.topic,
          background: payload.background,
          hook_code: payload.hook_code,
          trans_code: payload.trans_code,
          ending_code: payload.ending_code,
          ai_draft: payload.ai_draft,
          qc_final: payload.qc_final,
        }
        ;({ error } = await supabase.from('scripts').insert(fallbackPayload))
      }
      if (error) throw error

      setHistoryMessage('✓ 已同步到劇本歷史')
      setCurrentUserId(user.id)
      await loadScriptHistory(user.id)
    } catch (err: any) {
      setHistoryMessage(`同步失敗：${err.message}`)
    } finally {
      setHistorySaving(false)
    }
  }

  const loadHistoryItem = (item: ScriptHistoryRecord) => {
    const finalContent = item.qc_final || item.content || item.ai_draft || ''
    setBrand(item.brand || '')
    setIndustry(item.industry || '飲食')
    setTopic(item.topic || item.title || '')
    setIdeaNote(item.background || '')
    if (item.hook_code && HOOKS.some(option => option.c === item.hook_code)) setSelH(item.hook_code)
    if (item.trans_code && TRANS.some(option => option.c === item.trans_code)) setSelT(item.trans_code)
    if (item.ending_code && ENDS.some(option => option.c === item.ending_code)) setSelE(item.ending_code)
    setScript(item.ai_draft || finalContent)
    setQcScript(finalContent)
    setHistoryMessage('已載入歷史劇本')
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const topicParam = params.get('topic')
    const backgroundParam = params.get('background')
    const ideaParam = params.get('idea')
    const shopParam = params.get('shop') || params.get('shopName') || params.get('placeName') || params.get('name')
    const addressParam = params.get('address')
    if (topicParam) setTopic(topicParam)
    if (ideaParam || backgroundParam) setIdeaNote(ideaParam || backgroundParam || '')
    if (shopParam || ideaParam || backgroundParam) setShopName(shopParam || extractShopNameFromNote(ideaParam || backgroundParam || ''))
    if (addressParam) setAddress(addressParam)
    if (topicParam || ideaParam || backgroundParam || shopParam || addressParam) setImportedFromIdea(true)
  }, [])

  useEffect(() => {
    const bootstrapStyleMemory = async () => {
      let localEntries: StyleMemoryEntry[] = []
      try {
        const raw = window.localStorage.getItem(STYLE_MEMORY_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            localEntries = parsed.map((entry: any) => ({
              ...entry,
              fingerprint: entry.fingerprint || makeFingerprint(entry.topic || '', entry.aiDraft || '', entry.qcFinal || ''),
            }))
          }
        }
      } catch {
        // ignore corrupt local memory
      }

      if (localEntries.length > 0) setStyleMemory(mergeStyleMemories(localEntries))
      if (!supabase) {
        setStyleStorageMode('local')
        return
      }

      try {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user
        if (!user) return

        const { data, error } = await supabase
          .from('style_memories')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30)

        if (error) throw error

        if (Array.isArray(data) && data.length > 0) {
          const merged = mergeStyleMemories([...data.map(normalizeStyleMemoryRow), ...localEntries])
          persistLocalMemory(merged)
          setStyleStorageMode('supabase')
          if (localEntries.length > 0) {
            await syncEntriesToSupabase(merged)
            setStyleSyncMessage('✓ 已讀取 Supabase，並合併你本機既有記憶')
          }
          return
        }

        if (localEntries.length > 0) {
          await syncEntriesToSupabase(localEntries)
          setStyleSyncMessage('✓ 已把本機 Style Memory 搬去 Supabase')
        }
      } catch {
        setStyleStorageMode('local')
      }
    }

    bootstrapStyleMemory()
  }, [])

  useEffect(() => {
    if (!loading) {
      setGenerationProgress(0)
      return
    }

    const timer = window.setInterval(() => {
      setGenerationProgress((current) => {
        if (current >= 92) return current
        if (current < 30) return current + 8
        if (current < 60) return current + 5
        return current + 2
      })
    }, 450)

    return () => window.clearInterval(timer)
  }, [loading])

  const generate = async () => {
    if (!topic.trim()) {
      setError('請先填寫主題，AI 先知道今次條片要講咩。')
      return
    }
    setLoading(true)
    setGenerationProgress(6)
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
${shopName ? `舖頭名稱：${shopName}\n` : ''}${address ? `舖頭地址：${address}\n` : ''}${ideaNote ? `Idea Brainstorm 想法 / 補充資料：${ideaNote}\n` : ''}Hook：${h.c}｜轉場：${t.c}｜Ending：${e.c}

請即刻輸出完整 script，唔好加前言。
【舖頭資料】要獨立列出舖頭名稱同地址；【背景 VO】要由你根據主題、舖頭資料同 Idea Brainstorm 想法重新總結 50-80 字背景資料，唔好照抄原文。
內容實測每一 part 一定要用「內容：」同「現場調整：」，唔好用「旁白：」。`

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 2600,
          system: buildSystem(learnedRules ? `你以往人手 QC 後沉澱出以下偏好規則，請盡量貼近：\n${learnedRules}` : ''),
          messages: [{ role: 'user', content: userMsg }]
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(getApiErrorMessage(data.error))
      const generated = data.content?.[0]?.text || ''
      if (!generated) throw new Error('AI 沒有回傳內容，請再試一次。')
      setGenerationProgress(100)
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

  const downloadQcScript = () => {
    const finalContent = qcScript || script
    if (!finalContent) return
    const safeTitle = `${brand || 'SOON'}-${topic || 'script'}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .slice(0, 80)
    const blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeTitle}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
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
          model: ANTHROPIC_MODEL,
          max_tokens: 1200,
          system: buildStyleAnalysisSystem(),
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(getApiErrorMessage(data.error))
      const text = data.content?.[0]?.text || ''
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      setEditSummary(parsed.editSummary || '')
      setStyleRulesPreview(Array.isArray(parsed.styleRules) ? parsed.styleRules : [])
      const nextEntry: StyleMemoryEntry = {
        id: `${Date.now()}`,
        fingerprint: makeFingerprint(topic, script, qcScript),
        topic,
        createdAt: new Date().toISOString(),
        editSummary: parsed.editSummary || '',
        styleRules: Array.isArray(parsed.styleRules) ? parsed.styleRules : [],
        bannedTone: Array.isArray(parsed.bannedTone) ? parsed.bannedTone : [],
        winningTouches: Array.isArray(parsed.winningTouches) ? parsed.winningTouches : [],
        aiDraft: script,
        qcFinal: qcScript,
      }
      const nextMemory = mergeStyleMemories([nextEntry, ...styleMemory])
      persistLocalMemory(nextMemory)

      try {
        await syncEntriesToSupabase([nextEntry, ...styleMemory])
        setStyleSyncMessage('✓ 新增嘅 Style Memory 已同步到 Supabase')
      } catch (err: any) {
        setStyleStorageMode('local')
        setStyleSyncMessage(`暫時只存本機：${err.message}`)
      }

      setStyleSaved(true)
    } catch (err: any) {
      setError('分析改稿規律失敗：' + err.message)
    }
    setAnalyzingEdits(false)
  }

  const getDocumentTitle = () => `${brand || shopName || '未命名'} — ${topic || 'Script'}${qcScript ? ' (QC)' : ''}`

  const uploadToDrive = async () => {
    const finalContent = qcScript || script
    if (!finalContent) return ''
    if (driveUrl) return driveUrl

    setUploading(true)
    setUploadDone(false)
    try {
      const res = await fetch('/api/upload-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: getDocumentTitle(), content: finalContent }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDriveUrl(data.url)
      setUploadDone(true)
      return data.url as string
    } catch (err: any) {
      setError('上傳失敗：' + err.message)
      return ''
    } finally {
      setUploading(false)
    }
  }

  const sendToStoryboard = async () => {
    const finalContent = qcScript || script
    if (!finalContent.trim()) return

    setSendingStoryboard(true)
    setError('')
    try {
      const url = await uploadToDrive()
      if (!url) throw new Error('未能建立 Google Doc，暫時未可以送去分鏡。')
      const params = new URLSearchParams({
        doc: url,
        project: getDocumentTitle(),
        autoImport: '1',
      })
      window.location.href = `https://soon-storyboard.vercel.app/storyboard?${params.toString()}`
    } catch (err: any) {
      setError(err.message)
      setSendingStoryboard(false)
    }
  }

  const StyleCard = ({ item, selected, onSelect }: { item: any, selected: boolean, onSelect: () => void }) => (
    <button type="button" onClick={onSelect} style={{
      cursor: 'pointer', padding: '15px 17px', borderRadius: css.radius, textAlign: 'left',
      border: `1px solid ${selected ? css.ink : css.border}`,
      backgroundColor: selected ? css.inputFocus : css.inputBg,
      transition: 'all .18s',
    }}>
      <div style={{ fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase' as const, color: css.ink3, marginBottom: '5px', fontWeight: 500 }}>{item.c}</div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: css.ink, marginBottom: '3px' }}>{item.n}</div>
      <div style={{ fontSize: '11px', color: css.ink3, lineHeight: 1.45 }}>{item.d}</div>
    </button>
  )

  const inputStyle = {
    width: '100%', background: css.inputBg, border: `1px solid ${css.border}`,
    borderRadius: css.radius, padding: '16px 20px', fontSize: '15px',
    fontFamily: "'DM Sans', sans-serif", color: css.ink, outline: 'none', boxSizing: 'border-box' as const,
  }

  const selectedHook = HOOKS.find(x => x.c === selH)
  const selectedTrans = TRANS.find(x => x.c === selT)
  const selectedEnd = ENDS.find(x => x.c === selE)
  const setupProgress = [brand.trim(), industry.trim(), topic.trim(), shopName.trim(), address.trim(), ideaNote.trim(), selH, selT, selE].filter(Boolean).length
  const readyItems = [
    ['主題', Boolean(topic.trim())],
    ['舖頭 / 地址', Boolean(shopName.trim() || address.trim())],
    ['Idea 筆記', Boolean(ideaNote.trim())],
    ['風格骨架', Boolean(selH && selT && selE)],
  ] as const
  const readyCount = readyItems.filter(([, done]) => done).length
  const briefItems = [
    ['類型', industry],
    ['主題', topic || '未填'],
    ['舖頭', shopName || '未提供'],
    ['地址', address || '未提供'],
  ]
  const railCard = {
    background: 'rgba(34, 38, 68, 0.88)',
    border: `1px solid ${css.border}`,
    borderRadius: '22px',
    padding: '20px',
    boxShadow: '0 18px 40px rgba(4, 6, 20, 0.26)',
  } as const

  return (
    <div style={{ backgroundColor: css.bg, color: css.ink, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
      <div className="workspace-shell">
        <aside className="workspace-sidebar">
          <div style={{ ...railCard, padding: '18px 16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '18px', border: `1px solid ${css.border2}`, background: 'rgba(255,255,255,0.05)' }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '999px', background: '#7b61ff', display: 'inline-block' }} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Script Generator</span>
            </div>
            <div style={{ marginTop: '18px', color: css.ink3, fontSize: '13px', lineHeight: 1.7 }}>
              SOON 內部劇本系統
            </div>
          </div>

          <div style={{ ...railCard }}>
            <div style={{ fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', color: css.ink3, marginBottom: '14px' }}>今日工作</div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {[
                `已填設定 ${setupProgress}/9`,
                `生成準備 ${readyCount}/4`,
                importedFromIdea ? '已接收題材與地址資料' : '可手動建立新劇本',
                script ? '已有生成結果' : '等待生成初稿',
                qcScript ? 'QC 區可直接修稿' : '生成後可開始 QC',
              ].map((item, index) => (
                <div key={item} style={{ padding: '12px 14px', borderRadius: '14px', background: index === 0 ? 'rgba(111,107,255,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${index === 0 ? css.border2 : css.border}`, fontSize: '13px', color: css.ink2 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...railCard }}>
            <div style={{ fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', color: css.ink3, marginBottom: '14px' }}>生成準備</div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {readyItems.map(([label, done]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '11px 12px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${done ? 'rgba(141,240,180,0.22)' : css.border}`, fontSize: '13px', color: done ? '#b8ffd2' : css.ink3 }}>
                  <span>{label}</span>
                  <span>{done ? '已填' : '待填'}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...railCard }}>
            <div style={{ fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', color: css.ink3, marginBottom: '14px' }}>寫作骨架</div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                ['Hook', selectedHook?.n, selectedHook?.d],
                ['轉場', selectedTrans?.n, selectedTrans?.d],
                ['Ending', selectedEnd?.n, selectedEnd?.d],
              ].map(([label, title, desc]) => (
                <div key={label} style={{ padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${css.border}` }}>
                  <div style={{ fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase', color: css.ink3, marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{title}</div>
                  <div style={{ fontSize: '12px', color: css.ink3, lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="workspace-main">
          <section style={{ ...railCard, padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '.16em', textTransform: 'uppercase', color: css.ink3, marginBottom: '12px' }}>SOON 創作工作台</div>
                <h1 style={{ fontSize: '50px', lineHeight: 1, margin: 0, fontWeight: 500 }}>IG Reel 劇本工作台</h1>
                <div style={{ marginTop: '16px', fontSize: '16px', color: css.ink2, maxWidth: '760px', lineHeight: 1.7 }}>
                  將題材想法、地址、Hook、轉場與結尾結構放進同一個內部 board，由 AI 先整理背景，再生成可直接進入 QC 的短片劇本。
                </div>
              </div>
              <div style={{ minWidth: '240px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '16px', background: importedFromIdea ? 'rgba(111,107,255,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${importedFromIdea ? css.border2 : css.border}`, fontSize: '13px', color: css.ink2 }}>
                  {importedFromIdea ? '已從題材工作台帶入主題、想法與舖頭資料，可直接由 AI 整理背景後生成。' : '可直接手動輸入內容需求，建立新一輪劇本。'}
                </div>
              </div>
            </div>
          </section>

          <section className="workspace-grid">
            <div style={{ ...railCard, padding: '26px' }}>
              <div style={{ fontSize: '12px', letterSpacing: '.14em', textTransform: 'uppercase', color: css.ink3, marginBottom: '18px' }}>劇本設定</div>
              <div style={{ display: 'grid', gap: '26px' }}>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>01</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>品牌 / 個人名稱</div>
                  <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="例：One Bite、丁丁、Hilary Travels" style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>02</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>行業 / 類型</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {INDUSTRIES.map(i => (
                      <button key={i} onClick={() => setIndustry(i)} style={{ cursor: 'pointer', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", padding: '9px 18px', borderRadius: '999px', border: `1px solid ${industry === i ? 'rgba(130,126,255,0.48)' : css.border}`, color: industry === i ? '#fff' : css.ink2, background: industry === i ? 'linear-gradient(135deg,#7b61ff,#5e8bff)' : 'rgba(255,255,255,0.04)' }}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>03</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>主題</div>
                  <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="例：最強宵夜滷肉飯？全世界最靚聖誕市集？" style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>04</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '10px' }}>舖頭資料</div>
                  <div style={{ fontSize: '13px', color: css.ink3, lineHeight: 1.7, marginBottom: '14px' }}>
                    呢欄係俾現場試拍用嘅基本資料，會放喺【背景 VO】上面獨立顯示。
                  </div>
                  <div className="shop-info-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.35fr)', gap: '12px' }}>
                    <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="舖頭 / 品牌名稱" style={inputStyle} />
                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="地址 / Google Maps 地址" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>05</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '10px' }}>Idea Brainstorm 想法</div>
                  <div style={{ fontSize: '13px', color: css.ink3, lineHeight: 1.7, marginBottom: '14px' }}>
                    呢度唔係最終背景稿。貼低題材想法、觀察、賣點或筆記，AI 會喺劇本入面總結成 50-80 字【背景 VO】。
                  </div>
                  <textarea value={ideaNote} onChange={e => setIdeaNote(e.target.value)} placeholder="例：呢間店最近多人討論，位置近地鐵，主打手工甜品；想測試係咪真係值得排隊…" style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' as const, lineHeight: 1.7 }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>06</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>Hook 風格</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
                    {HOOKS.map(h => <StyleCard key={h.c} item={h} selected={selH === h.c} onSelect={() => setSelH(h.c)} />)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>07</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>轉場風格</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
                    {TRANS.map(t => <StyleCard key={t.c} item={t} selected={selT === t.c} onSelect={() => setSelT(t.c)} />)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>08</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>Ending 風格</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
                    {ENDS.map(e => <StyleCard key={e.c} item={e} selected={selE === e.c} onSelect={() => setSelE(e.c)} />)}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <button type="button" onClick={generate} disabled={loading} style={{ cursor: loading ? 'not-allowed' : 'pointer', padding: '15px 18px', borderRadius: '16px', border: '1px solid rgba(130,126,255,0.48)', background: 'linear-gradient(135deg,#7b61ff,#5e8bff)', color: '#fff', fontSize: '15px', fontWeight: 700, boxShadow: '0 18px 36px rgba(93, 104, 255, 0.28)' }}>
                    {loading ? `生成中 ${generationProgress}%` : '生成劇本初稿'}
                  </button>
                  {loading && (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${generationProgress}%`,
                            height: '100%',
                            borderRadius: '999px',
                            background: 'linear-gradient(90deg,#7b61ff,#5e8bff)',
                            transition: 'width 0.35s ease',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '12px', color: css.ink3 }}>
                        正在生成中，完成後會自動顯示結果。
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: css.ink3, lineHeight: 1.7 }}>
                    填完以上設定之後，再生成初稿會最準確。
                  </div>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div style={{ ...railCard, border: '1px solid rgba(255,120,120,0.22)', background: 'rgba(88,26,34,0.55)', color: '#ffc0c0' }}>
              {error}
            </div>
          )}

          {script && (
            <section style={{ display: 'grid', gap: '18px' }}>
              <div style={{ fontSize: '12px', letterSpacing: '.14em', textTransform: 'uppercase', color: css.ink3 }}>
                {[brand, industry, topic].filter(Boolean).join('  ·  ')}
              </div>

              <div style={{ ...railCard, padding: '24px 26px', border: `1px solid ${css.border2}` }}>
                <div style={{ display: 'grid', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', letterSpacing: '.14em', textTransform: 'uppercase', color: css.ink3, marginBottom: '16px' }}>AI 初稿</div>
                    <div style={{ display: 'grid', gap: '14px' }}>
                      {splitScriptSections(script).map(section => (
                        <div key={section.title} style={{ borderBottom: `1px solid ${css.border}`, paddingBottom: '14px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: css.ink, marginBottom: '8px' }}>{section.title}</div>
                          {section.title === '【實測內容】' ? (
                            <div style={{ display: 'grid', gap: '10px' }}>
                              {splitTestContentItems(section.content).map((item, index) => (
                                <div key={`${section.title}-${index}`} style={{ padding: '13px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${css.border}` }}>
                                  <div style={{ fontSize: '14px', lineHeight: 1.9, color: css.ink2, whiteSpace: 'pre-wrap' as const }}>{item}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '14px', lineHeight: 1.9, color: css.ink2, whiteSpace: 'pre-wrap' as const }}>{section.content}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ height: '1px', background: css.border }} />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '12px', letterSpacing: '.14em', textTransform: 'uppercase', color: css.ink3, marginBottom: '6px' }}>QC 最終稿</div>
                        <div style={{ fontSize: '13px', color: css.ink2 }}>沿住上面初稿一路往下修，完成後可直接上傳到 Drive。</div>
                      </div>
                      <div style={{ fontSize: '12px', color: styleSaved ? '#8df0b4' : css.ink3 }}>
                        {styleSaved ? '✓ 已加入 Style Memory' : `${styleMemory.length} 條 Style Memory`} · {styleStorageMode === 'supabase' ? 'Supabase' : 'Local'}
                      </div>
                    </div>
                    <textarea value={qcScript} onChange={e => setQcScript(e.target.value)} style={{ ...inputStyle, minHeight: '340px', resize: 'vertical' as const, lineHeight: 1.8, background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                </div>
              </div>

              {(editSummary || styleRulesPreview.length > 0) && (
                <div style={{ ...railCard }}>
                  <div style={{ fontSize: '12px', letterSpacing: '.14em', textTransform: 'uppercase', color: css.ink3, marginBottom: '10px' }}>Style Memory</div>
                  {editSummary && <div style={{ fontSize: '14px', lineHeight: 1.8, color: css.ink2, marginBottom: '12px' }}>{editSummary}</div>}
                  {styleRulesPreview.length > 0 && (
                    <ul style={{ paddingLeft: '18px', color: css.ink, lineHeight: 1.8, fontSize: '14px', margin: 0 }}>
                      {styleRulesPreview.map(rule => <li key={rule}>{rule}</li>)}
                    </ul>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button type="button" onClick={copyScript} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: '1px solid rgba(130,126,255,0.48)', background: 'linear-gradient(135deg,#7b61ff,#5e8bff)', color: '#fff', cursor: 'pointer' }}>
                  {copied ? '已複製！' : '複製 Script'}
                </button>
                <button type="button" onClick={copyQcScript} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: `1px solid ${css.border}`, background: 'rgba(255,255,255,0.05)', color: css.ink2, cursor: 'pointer' }}>
                  {copiedQc ? '已複製 QC 稿！' : '複製 QC 稿'}
                </button>
                <button type="button" onClick={saveScriptToHistory} disabled={historySaving} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: '1px solid rgba(90,204,150,0.26)', background: historySaving ? 'rgba(255,255,255,0.04)' : 'rgba(74,138,92,0.16)', color: '#baf0cc', cursor: historySaving ? 'not-allowed' : 'pointer', opacity: historySaving ? 0.6 : 1 }}>
                  {historySaving ? '同步中…' : '儲存到歷史'}
                </button>
                <button type="button" onClick={analyzeEdits} disabled={analyzingEdits || !qcScript.trim()} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: `1px solid ${css.border}`, background: 'rgba(255,255,255,0.05)', color: css.ink2, cursor: analyzingEdits ? 'not-allowed' : 'pointer', opacity: analyzingEdits ? 0.6 : 1 }}>
                  {analyzingEdits ? '分析改稿中…' : '分析我改咗咩'}
                </button>
                <button type="button" onClick={downloadQcScript} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: `1px solid ${css.border}`, background: 'rgba(255,255,255,0.05)', color: css.ink2, cursor: 'pointer' }}>
                  {downloaded ? '已下載！' : '下載 QC .txt'}
                </button>
                <button type="button" onClick={uploadToDrive} disabled={uploading} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: '1px solid rgba(90,204,150,0.26)', background: uploadDone ? '#4a8a5c' : 'rgba(74,138,92,0.16)', color: uploadDone ? '#fff' : '#baf0cc', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? '上傳中…' : uploadDone ? '✓ 已上傳 QC 稿到 Drive' : '上傳 QC 稿去 Drive'}
                </button>
                <button type="button" onClick={sendToStoryboard} disabled={uploading || sendingStoryboard || !qcScript.trim()} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: '1px solid rgba(130,126,255,0.48)', background: 'linear-gradient(135deg,#7b61ff,#5e8bff)', color: '#fff', cursor: uploading || sendingStoryboard ? 'not-allowed' : 'pointer', opacity: uploading || sendingStoryboard ? 0.6 : 1 }}>
                  {sendingStoryboard ? '送去分鏡中…' : '確認劇本 → 去分鏡'}
                </button>
                <button type="button" onClick={generate} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: `1px solid ${css.border}`, background: 'rgba(255,255,255,0.05)', color: css.ink2, cursor: 'pointer' }}>
                  重新生成
                </button>
              </div>

              {driveUrl && (
                <a href={driveUrl} target="_blank" rel="noopener" style={{ display: 'inline-block', fontSize: '13px', color: '#89e0ad', textDecoration: 'none' }}>
                  → 喺 Google Drive 開啟
                </a>
              )}
            </section>
          )}
        </main>

        <aside className="workspace-rail">
          <div style={railCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', color: css.ink3 }}>劇本歷史</div>
              <button type="button" onClick={() => void loadScriptHistory()} disabled={historyLoading || !currentUserId} style={{ cursor: historyLoading || !currentUserId ? 'not-allowed' : 'pointer', border: `1px solid ${css.border}`, background: 'rgba(255,255,255,0.04)', color: css.ink2, borderRadius: '999px', padding: '7px 10px', fontSize: '12px' }}>
                {historyLoading ? '載入中' : '刷新'}
              </button>
            </div>
            {!currentUserId && (
              <div style={{ fontSize: '13px', color: css.ink3, lineHeight: 1.7 }}>
                未連接登入狀態。由 SOON Core 開啟時會自動同步。
              </div>
            )}
            {currentUserId && scriptHistory.length === 0 && !historyLoading && (
              <div style={{ fontSize: '13px', color: css.ink3, lineHeight: 1.7 }}>
                暫時未有同步劇本。儲存後會同 iOS 歷史共用。
              </div>
            )}
            {scriptHistory.length > 0 && (
              <div style={{ display: 'grid', gap: '10px' }}>
                {scriptHistory.slice(0, 6).map(item => (
                  <button key={item.id} type="button" onClick={() => loadHistoryItem(item)} style={{ cursor: 'pointer', textAlign: 'left', padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${css.border}`, color: css.ink2 }}>
                    <div style={{ color: css.ink, fontSize: '13px', fontWeight: 600, lineHeight: 1.45 }}>{item.title || item.topic || '未命名劇本'}</div>
                    <div style={{ marginTop: '5px', color: css.ink3, fontSize: '12px', lineHeight: 1.5 }}>
                      {[item.brand, item.industry, formatHistoryDate(item.created_at || item.generated_at)].filter(Boolean).join(' · ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {historyMessage && <div style={{ marginTop: '10px', fontSize: '12px', color: historyMessage.startsWith('✓') ? '#8df0b4' : css.ink3, lineHeight: 1.7 }}>{historyMessage}</div>}
          </div>

          <div style={railCard}>
            <div style={{ fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', color: css.ink3, marginBottom: '14px' }}>內容 Brief</div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {briefItems.map(([label, value]) => (
                <div key={label} style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${css.border}` }}>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '5px' }}>{label}</div>
                  <div style={{ fontSize: '13px', color: css.ink2, lineHeight: 1.5 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={railCard}>
            <div style={{ fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', color: css.ink3, marginBottom: '14px' }}>系統狀態</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                ['記憶條數', `${styleMemory.length}`],
                ['儲存模式', styleStorageMode === 'supabase' ? 'Supabase' : 'Local'],
                ['初稿狀態', script ? '已生成' : '未生成'],
                ['Drive', driveUrl ? '已連結' : '未上傳'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${css.border}` }}>
                  <div style={{ fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase', color: css.ink3, marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={railCard}>
            <div style={{ fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', color: css.ink3, marginBottom: '10px' }}>Style Memory</div>
            <div style={{ fontSize: '14px', lineHeight: 1.8, color: css.ink2, marginBottom: '14px' }}>
              當前儲存位置：<strong style={{ color: css.ink }}>{styleStorageMode === 'supabase' ? 'Supabase' : 'Local'}</strong>
            </div>
            <button onClick={syncLocalMemoryToSupabase} disabled={styleSyncing} style={{ width: '100%', cursor: styleSyncing ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '12px 14px', borderRadius: '14px', border: `1px solid ${css.border2}`, color: css.ink, background: 'rgba(111,107,255,0.14)', opacity: styleSyncing ? 0.5 : 1 }}>
              {styleSyncing ? '同步中…' : '同步到 Supabase'}
            </button>
            {styleSyncMessage && <div style={{ marginTop: '10px', fontSize: '12px', color: css.ink3, lineHeight: 1.7 }}>{styleSyncMessage}</div>}
          </div>

          <div style={railCard}>
            <div style={{ fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', color: css.ink3, marginBottom: '12px' }}>接力流程</div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {[
                ['題材工作台', '整理主題與背景'],
                ['劇本工作台', '生成初稿與 QC'],
                ['分鏡工作台', '將 QC 稿推進分鏡'],
              ].map(([title, desc], index) => (
                <div key={title} style={{ padding: '14px', borderRadius: '16px', background: index === 1 ? 'rgba(111,107,255,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${index === 1 ? css.border2 : css.border}` }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{title}</div>
                  <div style={{ fontSize: '12px', color: css.ink3, lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .workspace-shell {
          max-width: 1680px;
          margin: 0 auto;
          padding: 28px 20px 72px;
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr) 300px;
          gap: 20px;
        }
        .workspace-sidebar,
        .workspace-rail {
          position: sticky;
          top: 84px;
          align-self: start;
          display: grid;
          gap: 18px;
        }
        .workspace-main {
          display: grid;
          gap: 20px;
          min-width: 0;
        }
        .workspace-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 20px;
        }
        @media (max-width: 1280px) {
          .workspace-shell {
            grid-template-columns: 240px minmax(0, 1fr);
          }
          .workspace-rail {
            grid-column: 1 / -1;
            position: static;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 1024px) {
          .workspace-shell {
            grid-template-columns: 1fr;
          }
          .workspace-sidebar,
          .workspace-rail {
            position: static;
          }
          .workspace-grid,
          .workspace-rail {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .workspace-shell {
            padding: 18px 12px 48px;
          }
          .shop-info-grid {
            grid-template-columns: 1fr !important;
          }
          h1 {
            font-size: 34px !important;
          }
        }
      `}</style>
    </div>
  )
}
