'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const INDUSTRIES = [
  '飲食', '旅遊', '美妝', '時裝穿搭', '健身體育',
  '親子', '寵物', '教育學習', '職場', '理財',
  '房間裝修', '手作 DIY', '夜生活', '書籍閱讀', '好物分享',
  '生活', '文化', '科技', '活動', '手機攝影'
]

const HOOKS = [
  { id: 'H1', c: 'H1', label: '極端行動質問', desc: '誇張行為/處境問觀眾', example: '「你試過喺香港搵到一碗低過$30嘅靚湯未？」' },
  { id: 'H2', c: 'H2', label: '真定假 — 直接挑戰', desc: '質疑廣泛聲稱，邀請驗證', example: '「成日話呢間係全港最好食，真定假呀？」' },
  { id: 'H3', c: 'H3', label: '聽講 — 半信半疑', desc: '借第三者放法引入懸念', example: '「我朋友話呢度嘅咖啡係全城最好，我唔信。」' },
  { id: 'H4', c: 'H4', label: '感官喚起 + 懸念', desc: '啟動感官記憶再加轉折', example: '「想像一下，第一口係焦糖，第二口係驚喜⋯⋯ 好想試呀」' },
  { id: 'H5', c: 'H5', label: '反差驚喜 — 竟然', desc: '意想不到對比，情緒跳躍', example: '「呢間藏係工廠大廈嘅餐廳，竟然係米芝蓮推介。」' },
  { id: 'H6', c: 'H6', label: '意外自我披露', desc: '個人誠洞拉近距離', example: '「我試過為咗呢碗麵坐一個鐘車，值唔值？」' },
  { id: 'H7', c: 'H7', label: '荒誕事實', desc: '真實但荒謬嘅事，引發驚訝', example: '「咩話？！香港有間咖啡店，閒日要排隊三個鐘。」' },
  { id: 'H8', c: 'H8', label: '代入感假設', desc: '「如果」句式引觀眾想像', example: '「如果你只有$100，你會點喺香港食到最好？」' },
]

const TRANS = [
  { id: 'T1', c: 'T1', label: '情緒代入 — 同行感', desc: '主持緊張，拉觀眾入狀態', example: '「好，我依家入去喇，你哋跟住我。」' },
  { id: 'T2', c: 'T2', label: '轉念 — 入去先信咗', desc: '懷疑被現實正面打臉', example: '「我本來唔信，但入到去就知我錯咗。」' },
  { id: 'T3', c: 'T3', label: '質疑名氣 — 實力存疑', desc: '對名氣打預防針', example: '「有名就一定好食？我嚟幫你哋試。」' },
  { id: 'T4', c: 'T4', label: '實測宣言 — 等我試下', desc: '宣佈「我幫你試」', example: '「唔講咁多，我親自試晒每一款。」' },
  { id: 'T5', c: 'T5', label: '場景切割 — 另有真相', desc: '意想不到角度重新定義', example: '「但係等等，我發現咗一樣你哋唔知嘅事。」' },
  { id: 'T6', c: 'T6', label: '第一印象反轉', desc: '坦白第一眼唔係咁吸引', example: '「老實講，第一眼我覺得好普通，但係⋯⋯」' },
  { id: 'T7', c: 'T7', label: '靈魂轉移 — 重點喺呢度', desc: '真正精華喺另一樣', example: '「啲人嚟係為咗咖啡，但係我係為咗呢個。」' },
  { id: 'T8', c: 'T8', label: '頓悟時刻', desc: '具體動作到情感領悟', example: '「食第一口嗰陣，我明白點解佢可以撐三十年。」' },
]

const ENDS = [
  { id: 'E1', c: 'E1', label: '留白式 Verdict', desc: '坦白收，短句，唔誇張', example: '「值唔值得去？你知我點諗。」' },
  { id: 'E2', c: 'E2', label: '值唔值得 — 親身作答', desc: '回應開場，直接給答案', example: '「三個鐘車程值唔值？我下個月仲會返嚟。」' },
  { id: 'E3', c: 'E3', label: '情懷翻轉 — 真材實料', desc: '老字號就算真實力', example: '「三十年，唔係靠宣傳，係靠呢碗湯。」' },
  { id: 'E4', c: 'E4', label: '自嘲收尾 — 解鎖', desc: '輕鬆收，帶幽默', example: '「好，我又解鎖咗一個令荷包縮水嘅地方。」' },
  { id: 'E5', c: 'E5', label: '詩意留白', desc: '短句節奏，情緒拉遠', example: '「有啲味道，係會記一世嘅。」' },
  { id: 'E6', c: 'E6', label: '個人感悟 — 超越食玩', desc: '升華到人生意義', example: '「呢度令我記起，簡單嘅嘢有時最難得。」' },
  { id: 'E7', c: 'E7', label: '哲學收結', desc: '帶哲學重量，適合文化題', example: '「一個地方能撐幾十年，從來唔係靠運氣。」' },
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

type GeneratorType = 'host_led' | 'cold_tell'

type ProfileOption = {
  id?: string
  value?: string
  key?: string
  label?: string
  name?: string
  title?: string
  desc?: string
  description?: string
  emoji?: string
  skeleton?: string
  feel?: string
  note?: string
  template?: string
  toggle?: boolean
  plugins?: string[]
  framework?: string
  framework_id?: string
  tense?: string
  tense_id?: string
  ending?: string
  ending_id?: string
  hook?: string
  hook_id?: string
  counter_instinct?: boolean
}

type ColdTellProfile = {
  id: string
  generator_type: 'cold_tell'
  name: string
  description?: string
  framework_options?: ProfileOption[]
  tense_options?: ProfileOption[]
  ending_options?: ProfileOption[]
  plugin_options?: ProfileOption[]
  hook_options?: ProfileOption[]
  presets?: ProfileOption[]
}

const STYLE_MEMORY_KEY = 'soon-script-style-memory-v1'

function profileOptionId(option: ProfileOption | null | undefined) {
  return String(option?.id ?? option?.value ?? option?.key ?? '')
}

function profileOptionLabel(option: ProfileOption | null | undefined) {
  return String(option?.label ?? option?.name ?? option?.title ?? profileOptionId(option) ?? '')
}

function profileOptionDesc(option: ProfileOption | null | undefined) {
  return String(option?.desc ?? option?.description ?? option?.skeleton ?? option?.feel ?? option?.note ?? option?.template ?? '')
}

function profileOptions(value: unknown): ProfileOption[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as ProfileOption[] : []
}

function coldPresetDisplay(preset: ProfileOption | null | undefined) {
  const id = profileOptionId(preset)
  const labels: Record<string, { emoji: string; label: string; desc: string }> = {
    dark_doom: { emoji: '🗡️', label: '黑暗宿命', desc: '適合沉重、崩壞、代價感強的故事。' },
    twist_justice: { emoji: '⚖️', label: '反轉公義', desc: '適合由誤解、揭露到報應式收束。' },
    mind_mechanism: { emoji: '🧠', label: '心理機制', desc: '適合拆解人性、慣性、群體反應。' },
    clever_loophole: { emoji: '🏛️', label: '聰明漏洞', desc: '適合制度漏洞、規則操作、灰色地帶。' },
    epic_awe: { emoji: '🌐', label: '宏大震撼', desc: '適合科技、歷史、規模感大的題材。' },
    creepy_loop: { emoji: '🔁', label: '詭異循環', desc: '適合重複、失控、越想越不安的故事。' },
  }
  return labels[id] || {
    emoji: String(preset?.emoji || ''),
    label: profileOptionLabel(preset),
    desc: profileOptionDesc(preset),
  }
}

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

const getIndustryGuide = (industry: string): string => {
  const guides: Record<string, string> = {
    '飲食': `探店型為主。重點係：第一口反應、食物視覺、價格感受、適合咩人去。避免純讚美，要有真實評價。拍攝提示要包含：食物特寫、環境氛圍、主持表情反應。`,
    '旅遊': `體驗型為主。重點係：地點獨特性、交通方式、隱藏景點、適合時段。要有實用資訊（價格、時間、地址）。拍攝提示要包含：地標全景、細節特寫、人在場景中。`,
    '美妝': `教學型或測評型。重點係：before/after 對比、產品質地、持妝效果、適合膚質。要有具體使用步驟。拍攝提示要包含：產品特寫、上妝過程、最終效果。`,
    '時裝穿搭': `視覺型為主。重點係：穿搭場合、單品來源（品牌/價格）、styling tips、身型適合度。要有 outfit breakdown。拍攝提示要包含：全身造型、單品特寫、不同角度。`,
    '健身體育': `教學型或挑戰型。重點係：動作正確示範、常見錯誤、訓練效果、適合程度。要有具體數字（組數、重量、時間）。拍攝提示要包含：動作示範、身體線條、運動環境。`,
    '親子': `溫情型或教育型。重點係：親子互動、孩子反應、家長心得、安全性。語氣溫暖真實。拍攝提示要包含：親子互動、孩子表情、活動過程。`,
    '寵物': `可愛型或教學型。重點係：寵物行為、主人互動、產品測試、日常護理。要有真實寵物反應。拍攝提示要包含：寵物特寫、主人互動、產品使用。`,
    '教育學習': `觀點型或教學型。重點係：實用知識點、學習方法、常見誤解、具體應用。要有清晰邏輯結構。拍攝提示要包含：講解畫面、圖表展示、實際示範。`,
    '職場': `觀點型或經驗分享型。重點係：職場現實、實用技巧、真實經歷、行業洞察。語氣要有 credibility。拍攝提示要包含：工作環境、主持講解、情境重演。`,
    '理財': `教學型或觀點型。重點係：具體數字、實際案例、風險提示、可行步驟。要負責任，唔誇大回報。拍攝提示要包含：數字圖表、主持解說、生活情境。`,
    '房間裝修': `改造型或教學型。重點係：before/after 對比、材料來源、費用預算、DIY 難度。要有實用採購資訊。拍攝提示要包含：改造過程、細節特寫、整體效果。`,
    '手作 DIY': `教學型為主。重點係：材料清單、步驟分解、難度評估、成品效果。要有清晰步驟。拍攝提示要包含：材料展示、製作過程、最終成品。`,
    '夜生活': `體驗型為主。重點係：氛圍感受、人流時段、消費水平、適合場合。要有真實現場感。拍攝提示要包含：環境氛圍、人群反應、特色元素。`,
    '書籍閱讀': `觀點型或推薦型。重點係：核心觀點、閱讀感受、適合讀者、改變思維之處。要有具體引用或例子。拍攝提示要包含：書本特寫、主持分享、金句展示。`,
    '好物分享': `測評型為主。重點係：使用場景、實際效果、性價比、與同類比較。要有真實使用體驗。拍攝提示要包含：產品開箱、使用示範、細節特寫。`,
    '生活': `日常記錄型或觀點型。重點係：生活細節、個人感受、共鳴點、真實性。語氣要自然親切。拍攝提示要包含：生活場景、日常動作、主持表情。`,
    '文化': `探索型或教育型。重點係：文化背景、獨特之處、現代連結、個人體驗。要有深度但易明。拍攝提示要包含：文化場景、細節展示、主持互動。`,
    '科技': `測評型或教學型。重點係：實際功能、使用體驗、適合用家、與舊版比較。要有具體測試。拍攝提示要包含：產品展示、功能示範、實際使用。`,
    '活動': `現場型為主。重點係：活動特色、現場氣氛、值唔值得去、實用資訊。要有真實現場感。拍攝提示要包含：現場環境、人群反應、特色亮點。`,
    '手機攝影': `教學型為主。重點係：拍攝技巧、手機設定、後製方法、before/after。要有具體可跟步驟。拍攝提示要包含：拍攝示範、設定畫面、成品對比。`
  }

  return guides[industry] || ''
}

function buildSystem(industry: string, styleMemoryText?: string) {
  const industryGuide = getIndustryGuide(industry)
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

${industryGuide ? `行業特定指引（${industry}）：
${industryGuide}
` : ''}
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
  bg: '#0a0a0f',
  surface: '#111118',
  card: '#16161f',
  ink: '#f0f0f5',
  ink2: '#9090a8',
  ink3: '#5a5a72',
  border: '#2a2a3a',
  border2: '#3a3a50',
  inputBg: '#111118',
  inputFocus: 'rgba(124,92,252,0.15)',
  accent: '#7c5cfc',
  radius: '18px',
}

export default function ScriptGenerator() {
  const supabase = createClient()
  const [brand, setBrand] = useState('')
  const [industry, setIndustry] = useState('飲食')
  const [topic, setTopic] = useState('')
  const [background, setBackground] = useState('')
  const [scriptLocation, setScriptLocation] = useState('')
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
  const [copied, setCopied] = useState(false)
  const [copiedQc, setCopiedQc] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [savingDoc, setSavingDoc] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [importedFromIdea, setImportedFromIdea] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyList, setHistoryList] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [brandFromSettings, setBrandFromSettings] = useState(false)
  const [workspaceId, setWorkspaceId] = useState('')
  const [generatorType, setGeneratorType] = useState<GeneratorType>('host_led')
  const [coldProfile, setColdProfile] = useState<ColdTellProfile | null>(null)
  const [coldProfileLoading, setColdProfileLoading] = useState(false)
  const [coldSource, setColdSource] = useState('')
  const [coldFramework, setColdFramework] = useState('')
  const [coldTense, setColdTense] = useState('')
  const [coldEnding, setColdEnding] = useState('')
  const [coldHook, setColdHook] = useState('')
  const [coldPlugins, setColdPlugins] = useState<string[]>([])
  const [coldCounterInstinct, setColdCounterInstinct] = useState(false)
  const [coldAdvancedOpen, setColdAdvancedOpen] = useState(false)
  const [coldSources, setColdSources] = useState<Array<string | { title?: string; url?: string }>>([])
  const [coldSourcesOpen, setColdSourcesOpen] = useState(false)
  const [coldPresetSelection, setColdPresetSelection] = useState('auto')
  const [coldAutoSuggestion, setColdAutoSuggestion] = useState<{
    preset_id: string
    reason: string
    label: string
    emoji: string
  } | null>(null)

  const coldFrameworkOptions = profileOptions(coldProfile?.framework_options)
  const coldTenseOptions = profileOptions(coldProfile?.tense_options)
  const coldEndingOptions = profileOptions(coldProfile?.ending_options)
  const coldPluginOptions = profileOptions(coldProfile?.plugin_options)
  const coldHookOptions = profileOptions(coldProfile?.hook_options)
  const coldMainHookOptions = coldHookOptions.filter((option) => !option.toggle)
  const coldCounterOption = coldHookOptions.find((option) => profileOptionId(option) === 'counter_instinct' || option.toggle)
  const coldPresetOptions = profileOptions(coldProfile?.presets).slice(0, 6)

  const loadBrandFromSettings = async (userId: string, metadata: any = {}) => {
    console.log('[Brand Debug] userId:', userId)
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('company_name, display_name')
        .eq('user_id', userId)
        .single()

      console.log('[Brand Debug] data:', data)
      console.log('[Brand Debug] error:', error)

      const brandName = (!error && data ? data.company_name || data.display_name : '')
        || metadata?.company_name
        || metadata?.display_name
        || metadata?.full_name
        || ''

      console.log('[Brand Debug] brandName:', brandName)
      if (brandName && !brand) {
        setBrand(brandName)
        setBrandFromSettings(true)
      }
    } catch (e) {
      console.log('[Brand Debug] catch:', e)
      const brandName = metadata?.company_name || metadata?.display_name || metadata?.full_name || ''
      console.log('[Brand Debug] fallback brandName:', brandName)
      if (brandName && !brand) {
        setBrand(brandName)
        setBrandFromSettings(true)
      }
    }
  }

  const loadColdTellProfile = async () => {
    if (coldProfile) return coldProfile
    if (coldProfileLoading) return null
    setColdProfileLoading(true)
    setError('')
    try {
      const res = await fetch('/api/cold-tell-profile')
      const data = await res.json()
      let profile = data.profile as ColdTellProfile | null

      if (!res.ok || data.error || !profile) {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()
        if (!currentSession?.access_token) throw new Error(data.error || '冷敘事設定載入失敗')

        const { data: fallbackProfile, error: fallbackError } = await supabase
          .from('style_profiles')
          .select('id,generator_type,name,description,framework_options,tense_options,ending_options,plugin_options,hook_options,presets')
          .eq('generator_type', 'cold_tell')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        if (fallbackError) throw fallbackError
        profile = fallbackProfile as ColdTellProfile | null
      }

      if (!profile) throw new Error('找不到已啟用的冷敘事設定')
      setColdProfile(profile)

      const frameworks = profileOptions(profile.framework_options)
      const tenses = profileOptions(profile.tense_options)
      const endings = profileOptions(profile.ending_options)
      const hooks = profileOptions(profile.hook_options).filter((option) => !option.toggle)
      setColdFramework((current) => current || profileOptionId(frameworks[0]))
      setColdTense((current) => current || profileOptionId(tenses[0]))
      setColdEnding((current) => current || profileOptionId(endings[0]))
      setColdHook((current) => current || profileOptionId(hooks[0]))

      return profile
    } catch (err: any) {
      setError('冷敘事設定載入失敗：' + err.message)
      return null
    } finally {
      setColdProfileLoading(false)
    }
  }

  const applyColdPreset = (preset: ProfileOption, nextSelection = profileOptionId(preset)) => {
    const framework = String(preset.framework ?? preset.framework_id ?? '')
    const tense = String(preset.tense ?? preset.tense_id ?? '')
    const ending = String(preset.ending ?? preset.ending_id ?? '')
    const hook = String(preset.hook ?? preset.hook_id ?? '')
    setColdPresetSelection(nextSelection)
    if (framework) setColdFramework(framework)
    if (tense) setColdTense(tense)
    if (ending) setColdEnding(ending)
    if (hook) setColdHook(hook)
    if (Array.isArray(preset.plugins)) setColdPlugins(preset.plugins.map(String))
    setColdCounterInstinct(Boolean(preset.counter_instinct))
  }

  const markColdCustom = () => setColdPresetSelection('custom')

  const findColdPreset = (profile: ColdTellProfile, presetId: string) =>
    profileOptions(profile.presets).find((preset) => profileOptionId(preset) === presetId) || null

  const toggleColdPlugin = (pluginId: string) => {
    setColdPlugins((current) =>
      current.includes(pluginId) ? current.filter((id) => id !== pluginId) : [...current, pluginId]
    )
  }

  const persistLocalMemory = (entries: StyleMemoryEntry[]) => {
    window.localStorage.setItem(STYLE_MEMORY_KEY, JSON.stringify(entries))
    setStyleMemory(entries)
  }

  const syncEntriesToSupabase = async (entries: StyleMemoryEntry[]) => {
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
    const params = new URLSearchParams(window.location.search)
    const topicParam = params.get('topic')
    const backgroundParam = params.get('background')
    const locationParam = params.get('location')
    const targetParam = params.get('target')
    const sourceParam = params.get('source') || params.get('source_material')
    if (topicParam) setTopic(topicParam)
    if (targetParam === 'cold_tell') {
      setGeneratorType('cold_tell')
      setColdPresetSelection('auto')
      setColdSource(sourceParam || backgroundParam || '')
      setBackground('')
    } else if (backgroundParam) {
      setBackground(backgroundParam)
    }
    if (locationParam) setScriptLocation(locationParam)
    if (topicParam || backgroundParam || locationParam || sourceParam || targetParam) setImportedFromIdea(true)
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    const applySoonAuth = async (payload: any) => {
      const accessToken = payload?.accessToken || payload?.token
      const refreshToken = payload?.refreshToken
      const nextWorkspaceId = payload?.workspaceId || ''
      if (nextWorkspaceId) setWorkspaceId(nextWorkspaceId)
      if (!accessToken || !refreshToken) return

      const { data } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (mounted) setSession(data.session)
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const encodedAuth = hashParams.get('soon_auth')
    if (encodedAuth) {
      try {
        void applySoonAuth(JSON.parse(window.atob(decodeURIComponent(encodedAuth))))
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      } catch {
        // Ignore malformed embedded auth payloads.
      }
    }

    const handleSoonAuth = (event: MessageEvent) => {
      if (event.data?.type !== 'SOON_AUTH') return
      const isAllowedOrigin =
        event.origin === 'https://soon-core.vercel.app' ||
        /^https:\/\/soon-core-[\w-]+\.vercel\.app$/.test(event.origin) ||
        event.origin === 'http://localhost:3000'
      if (!isAllowedOrigin) return
      void applySoonAuth(event.data)
    }

    const notifyParent = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'SOON_TOOL_READY', tool: 'script-generator' }, '*')
      }
    }
    notifyParent()
    const timers = [700, 1800, 3200].map((delay) => window.setTimeout(notifyParent, delay))
    window.addEventListener('message', handleSoonAuth)

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
      window.removeEventListener('message', handleSoonAuth)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  useEffect(() => {
    if (session?.user?.id && !brand) {
      loadBrandFromSettings(session.user.id, session.user.user_metadata)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (generatorType === 'cold_tell') {
      void loadColdTellProfile()
    }
  }, [generatorType])

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

  const generateHostLed = async () => {
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
請根據主題判斷係以下哪種類型，並對應調整劇本結構：
- 探店型：有具體地點／店舖
- 教學型：有步驟或技巧
- 觀點型：有立場或比較
- 挑戰型：有任務或測試
- 記錄型：日常或個人經歷
${background ? `背景資料：${background}\n` : ''}Hook：${h.c}｜轉場：${t.c}｜Ending：${e.c}

請即刻輸出完整 script，唔好加前言。`

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: buildSystem(industry, learnedRules ? `你以往人手 QC 後沉澱出以下偏好規則，請盡量貼近：\n${learnedRules}` : ''),
          messages: [{ role: 'user', content: userMsg }]
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      const generated = data.content?.[0]?.text || ''
      setScript(generated)
      setQcScript(generated)
      await saveScript(generated, generated)
    } catch (err: any) {
      setError('出現錯誤：' + err.message)
    }
    setLoading(false)
  }

  const generateColdTell = async (presetSelectionOverride?: string) => {
    const activeProfile = coldProfile || await loadColdTellProfile()
    if (!activeProfile) return
    if (!coldSource.trim() && !topic.trim()) {
      setError('請填寫 topic，或貼上 source。')
      return
    }

    setLoading(true)
    setScript('')
    setQcScript('')
    setError('')
    setUploadDone(false)
    setDriveUrl('')
    setEditSummary('')
    setStyleRulesPreview([])
    setStyleSaved(false)
    setColdSources([])
    setColdSourcesOpen(false)
    setColdAutoSuggestion(null)

    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()
      const activeSession = currentSession || session
      if (!activeSession?.access_token) {
        window.parent?.postMessage({ type: 'SOON_TOOL_READY', tool: 'script-generator' }, '*')
        throw new Error('未收到 SOON 登入狀態，請重新開啟工具或稍等數秒再試。')
      }

      const activeSelection = presetSelectionOverride || coldPresetSelection
      let selectedPreset: ProfileOption | null = null
      let autoSuggested = false
      let suggestReason = ''
      let framework = coldFramework
      let tense = coldTense
      let ending = coldEnding
      let hook = coldHook
      let plugins = coldPlugins
      let counterInstinct = coldCounterInstinct

      if (activeSelection === 'auto') {
        const analyzeRes = await fetch('/api/analyze-cold-tell', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeSession.access_token}`,
          },
          body: JSON.stringify({
            source_material: coldSource,
            topic,
          }),
        })
        const analyzeData = await analyzeRes.json()
        if (!analyzeRes.ok || analyzeData.error) throw new Error(analyzeData.error || '自動判斷套餐失敗')

        selectedPreset = findColdPreset(activeProfile, String(analyzeData.preset_id))
        if (!selectedPreset) throw new Error('AI 選出的套餐不存在')
        autoSuggested = true
        suggestReason = String(analyzeData.reason || '')
        framework = String(selectedPreset.framework ?? selectedPreset.framework_id ?? '')
        tense = String(selectedPreset.tense ?? selectedPreset.tense_id ?? '')
        ending = String(selectedPreset.ending ?? selectedPreset.ending_id ?? '')
        hook = String(selectedPreset.hook ?? selectedPreset.hook_id ?? '')
        plugins = Array.isArray(selectedPreset.plugins) ? selectedPreset.plugins.map(String) : []
        counterInstinct = Boolean(selectedPreset.counter_instinct)
        applyColdPreset(selectedPreset, 'auto')
        setColdAutoSuggestion({
          preset_id: profileOptionId(selectedPreset),
          reason: suggestReason,
          label: coldPresetDisplay(selectedPreset).label,
          emoji: coldPresetDisplay(selectedPreset).emoji,
        })
      } else if (activeSelection !== 'custom') {
        selectedPreset = findColdPreset(activeProfile, activeSelection)
        if (selectedPreset) {
          framework = String(selectedPreset.framework ?? selectedPreset.framework_id ?? '')
          tense = String(selectedPreset.tense ?? selectedPreset.tense_id ?? '')
          ending = String(selectedPreset.ending ?? selectedPreset.ending_id ?? '')
          hook = String(selectedPreset.hook ?? selectedPreset.hook_id ?? '')
          plugins = Array.isArray(selectedPreset.plugins) ? selectedPreset.plugins.map(String) : []
          counterInstinct = Boolean(selectedPreset.counter_instinct)
          applyColdPreset(selectedPreset, profileOptionId(selectedPreset))
        }
      }

      const res = await fetch('/api/generate-cold-tell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeSession.access_token}`,
        },
        body: JSON.stringify({
          profile_id: activeProfile.id,
          framework,
          tense,
          ending,
          plugins,
          hook,
          counter_instinct: counterInstinct,
          preset_id: selectedPreset ? profileOptionId(selectedPreset) : null,
          auto_suggested: autoSuggested,
          suggest_reason: suggestReason,
          source_material: coldSource,
          topic,
          workspace_id: workspaceId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || '冷敘事生成失敗')

      const generated = data.script || ''
      setScript(generated)
      setQcScript(generated)
      setColdSources(Array.isArray(data.sources) ? data.sources : [])
      setColdSourcesOpen(false)
    } catch (err: any) {
      setError('冷敘事生成失敗：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const generate = async () => {
    if (generatorType === 'cold_tell') {
      await generateColdTell()
      return
    }
    await generateHostLed()
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

  const saveScript = async (qcFinal: string, aiDraftOverride?: string) => {
    if (generatorType === 'cold_tell') return
    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user?.id) return

      await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email || '',
          brand,
          industry,
          topic,
          background,
          hook_code: selH,
          trans_code: selT,
          ending_code: selE,
          ai_draft: aiDraftOverride ?? script,
          qc_final: qcFinal,
        }),
      })
    } catch {
      // Auto-save should not block QC analysis or Drive upload.
    }
  }

  const loadHistory = async () => {
    if (!session?.user?.id) {
      console.log('[History Debug] 冇 session，唔讀歷史')
      setHistoryList([])
      return
    }
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams({
        user_id: session.user.id,
        email: session.user.email || '',
      })
      const res = await fetch(`/api/scripts?${params.toString()}`)
      const data = await res.json()
      console.log('[History Debug] 回傳:', data)
      setHistoryList(data.scripts || [])
    } catch(e) {
      console.log('[History Debug] 出錯:', e)
      setHistoryList([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const analyzeEdits = async () => {
    if (!script.trim() || !qcScript.trim()) return
    setAnalyzingEdits(true)
    setError('')
    try {
      await saveScript(qcScript)
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

  const uploadToDrive = async () => {
    const finalContent = qcScript || script
    if (!finalContent) return
    setUploading(true)
    setUploadDone(false)
    try {
      await saveScript(finalContent)
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

  const handlePushToStoryboard = async () => {
    if (!qcScript) return
    await saveScript(qcScript)
    const params = new URLSearchParams({
      script: qcScript,
      brand: generatorType === 'cold_tell' ? (coldProfile?.name || '冷敘事') : (brand || ''),
      topic: topic || '',
      industry: generatorType === 'cold_tell' ? 'cold_tell' : (industry || ''),
    })
    window.open(`https://soon-storyboard.vercel.app?${params.toString()}`, '_blank')
  }

  const saveToDocsCenter = async () => {
    const finalContent = qcScript || script
    if (!finalContent) return
    setSavingDoc(true)
    try {
      await saveScript(finalContent)
      window.parent.postMessage({
        type: 'SOON_CREATE_DOC',
        template_type: 'ig_script',
        generator_type: generatorType,
        qc_final: finalContent,
        ai_draft: script,
        topic: topic || '',
        brand: generatorType === 'cold_tell' ? (coldProfile?.name || '冷敘事') : (brand || ''),
        industry: generatorType === 'cold_tell' ? 'cold_tell' : (industry || ''),
        location: generatorType === 'cold_tell' ? '' : (scriptLocation || ''),
        hook_code: generatorType === 'host_led' ? (selH || '') : '',
        trans_code: generatorType === 'host_led' ? (selT || '') : '',
        ending_code: generatorType === 'host_led' ? (selE || '') : '',
        workspace_id: workspaceId || null,
      }, '*')
    } finally {
      setSavingDoc(false)
    }
  }

  const StyleCard = ({ item, selected, onSelect }: { item: any, selected: boolean, onSelect: () => void }) => (
    <div
      key={item.id}
      onClick={onSelect}
      style={{
        background: selected ? 'var(--accent)' : 'var(--bg-card)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-subtle)'}`,
        borderRadius: '10px',
        padding: '14px 16px',
        cursor: 'pointer',
        minHeight: '110px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        transition: 'all .18s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.6 }}>{item.id}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: selected ? 'white' : 'var(--text-primary)' }}>{item.label}</span>
      </div>
      <span style={{ fontSize: '11px', color: selected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{item.desc}</span>
      <span style={{
        fontSize: '12px',
        color: selected ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)',
        fontStyle: 'italic',
        marginTop: '4px',
        lineHeight: 1.5,
        borderTop: `1px solid ${selected ? 'rgba(255,255,255,0.2)' : 'var(--border-subtle)'}`,
        paddingTop: '6px',
      }}>{item.example}</span>
    </div>
  )

  const ColdOptionGroup = ({
    title,
    options,
    value,
    values,
    onSelect,
    multi = false,
  }: {
    title: string
    options: ProfileOption[]
    value?: string
    values?: string[]
    onSelect: (id: string) => void
    multi?: boolean
  }) => (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: css.ink2, marginBottom: '10px' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
        {options.map((option) => {
          const id = profileOptionId(option)
          const label = `${option.emoji ? `${option.emoji} ` : ''}${profileOptionLabel(option)}`
          const selected = multi ? Boolean(values?.includes(id)) : value === id
          return (
            <StyleCard
              key={id}
              item={{
                id,
                label,
                desc: profileOptionDesc(option),
                example: option.template || option.note || option.feel || option.skeleton || '',
              }}
              selected={selected}
              onSelect={() => onSelect(id)}
            />
          )
        })}
      </div>
    </div>
  )

  const PresetCard = ({
    id,
    emoji,
    label,
    desc,
    selected,
    onSelect,
  }: {
    id: string
    emoji?: string
    label: string
    desc: string
    selected: boolean
    onSelect: () => void
  }) => (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: 'left',
        background: selected ? 'var(--accent)' : 'var(--bg-card)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-subtle)'}`,
        borderRadius: '10px',
        padding: '14px 16px',
        cursor: 'pointer',
        minHeight: '126px',
        display: 'grid',
        alignContent: 'start',
        gap: '9px',
        color: selected ? '#fff' : 'var(--text-primary)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, lineHeight: 1.35 }}>
        {emoji && <span aria-hidden="true">{emoji}</span>}
        <span>{label}</span>
      </div>
      <div style={{ fontSize: '12px', lineHeight: 1.6, color: selected ? 'rgba(255,255,255,0.78)' : 'var(--text-secondary)' }}>
        {desc}
      </div>
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
  const setupProgress = [brand.trim(), industry.trim(), topic.trim(), background.trim(), selH, selT, selE].filter(Boolean).length
  const railCard = {
    background: css.card,
    border: `1px solid ${css.border}`,
    borderRadius: '22px',
    padding: '20px',
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.22)',
  } as const

  return (
    <div style={{
      backgroundColor: css.bg,
      color: css.ink,
      fontFamily: "'DM Sans', sans-serif",
      minHeight: '100vh',
      ['--accent' as any]: '#7c5cfc',
      ['--border-subtle' as any]: '#2a2a3a',
      ['--border-default' as any]: '#3a3a50',
      ['--bg-surface' as any]: '#111118',
      ['--bg-card' as any]: '#16161f',
      ['--text-primary' as any]: '#f0f0f5',
      ['--text-secondary' as any]: '#9090a8',
      ['--text-muted' as any]: '#5a5a72',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
      <div className="workspace-shell">
        <main className="workspace-main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 4px' }}>SOON 創作工作台</p>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>IG Reel 劇本工作台</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>填寫以下資料，AI 即時為你生成 IG Reel 劇本</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => {
                  setHistoryOpen(true)
                  loadHistory()
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #7c5cfc',
                  color: '#7c5cfc',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                📋 歷史記錄
              </button>
              <button
                onClick={handlePushToStoryboard}
                style={{
                  background: 'transparent',
                  border: '1px solid #0ea5e9',
                  color: '#0ea5e9',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                🎬 分鏡工作台
              </button>
            </div>
          </div>
          {/* 建議圖片尺寸：1920×280px */}
          <section className="workspace-grid">
            <div style={{ ...railCard, padding: '26px' }}>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em' }}>劇本設定</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '26px' }}>
                {[
                  { id: 'host_led' as GeneratorType, label: '主持敘事' },
                  { id: 'cold_tell' as GeneratorType, label: '冷敘事' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setGeneratorType(type.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '13px 14px',
                      borderRadius: '14px',
                      border: `1px solid ${generatorType === type.id ? 'var(--accent)' : 'var(--border-default)'}`,
                      background: generatorType === type.id ? 'var(--accent)' : 'transparent',
                      color: generatorType === type.id ? '#fff' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <div style={{ display: generatorType === 'host_led' ? 'grid' : 'none', gap: '26px' }}>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>01</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>品牌 / 個人名稱</div>
                  <input value={brand} onChange={e => { setBrand(e.target.value); setBrandFromSettings(false) }} placeholder="例：One Bite、丁丁、Hilary Travels" style={inputStyle} />
                  {brand && brandFromSettings && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      已從帳戶設定自動填入，可手動修改
                    </p>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>02</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>行業 / 類型</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {INDUSTRIES.map(i => (
                      <button key={i} onClick={() => setIndustry(i)} style={{ cursor: 'pointer', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", padding: '9px 18px', borderRadius: '999px', border: `1px solid ${industry === i ? 'var(--accent)' : 'var(--border-default)'}`, color: industry === i ? '#fff' : 'var(--text-secondary)', background: industry === i ? 'var(--accent)' : 'transparent' }}>
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
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>完整背景資料</div>
                  <textarea value={background} onChange={e => setBackground(e.target.value)} placeholder="例：係老字號，成立 1920 年，主打豬油糕同老婆餅…" style={{ ...inputStyle, minHeight: '180px', resize: 'vertical' as const, lineHeight: 1.7 }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>05</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>Hook 風格</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    {HOOKS.map(h => <StyleCard key={h.id} item={h} selected={selH === h.id} onSelect={() => setSelH(h.id)} />)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>06</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>轉場風格</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    {TRANS.map(t => <StyleCard key={t.id} item={t} selected={selT === t.id} onSelect={() => setSelT(t.id)} />)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3, marginBottom: '11px' }}>07</div>
                  <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>Ending 風格</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    {ENDS.map(e => <StyleCard key={e.id} item={e} selected={selE === e.id} onSelect={() => setSelE(e.id)} />)}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <button onClick={generate} disabled={loading} style={{ cursor: loading ? 'not-allowed' : 'pointer', padding: '15px 18px', borderRadius: '16px', border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff', fontSize: '15px', fontWeight: 700, boxShadow: '0 18px 36px rgba(124, 92, 252, 0.22)' }}>
                    {loading ? '正在生成初稿…' : '生成劇本初稿'}
                  </button>
                  <div style={{ fontSize: '13px', color: css.ink3, lineHeight: 1.7 }}>
                    填完以上設定之後，再生成初稿會最準確。
                  </div>
                </div>
              </div>
              {generatorType === 'cold_tell' && (
                <div style={{ display: 'grid', gap: '24px' }}>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3 }}>來源內容</div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>貼上來源內容（討論串／新聞／逐字稿，留空就由主題自己展開）</div>
                    <textarea
                      value={coldSource}
                      onChange={(e) => setColdSource(e.target.value)}
                      placeholder="貼上討論串、新聞、逐字稿或筆記..."
                      style={{ ...inputStyle, minHeight: '180px', resize: 'vertical' as const, lineHeight: 1.7 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '.1em', color: css.ink3 }}>主題</div>
                    <input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="來源內容留空時，用呢個主題自己展開"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: css.ink2, marginBottom: '10px' }}>預設組合</div>
                    {coldProfileLoading && <p style={{ color: css.ink3, fontSize: '13px', margin: 0 }}>正在載入冷敘事設定...</p>}
                    {!coldProfileLoading && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px' }}>
                        <PresetCard
                          id="auto"
                          emoji="✨"
                          label="自動（建議）"
                          desc="AI 先分析內容，再從 6 個套餐揀一個。"
                          selected={coldPresetSelection === 'auto'}
                          onSelect={() => setColdPresetSelection('auto')}
                        />
                        {coldPresetOptions.map((preset) => {
                          const id = profileOptionId(preset)
                          const display = coldPresetDisplay(preset)
                          return (
                            <PresetCard
                              key={id}
                              id={id}
                              emoji={display.emoji}
                              label={display.label}
                              desc={display.desc}
                              selected={coldPresetSelection === id}
                              onSelect={() => applyColdPreset(preset)}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setColdAdvancedOpen((open) => !open)}
                    style={{
                      justifySelf: 'flex-start',
                      cursor: 'pointer',
                      padding: '9px 14px',
                      borderRadius: '999px',
                      border: `1px solid ${css.border}`,
                      background: css.surface,
                      color: css.ink2,
                      fontSize: '13px',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {coldAdvancedOpen ? '收起進階' : '進階'}
                  </button>

                  {coldAdvancedOpen && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                      <ColdOptionGroup title="敘事框架" options={coldFrameworkOptions} value={coldFramework} onSelect={(id) => { markColdCustom(); setColdFramework(id) }} />
                      <ColdOptionGroup title="時態" options={coldTenseOptions} value={coldTense} onSelect={(id) => { markColdCustom(); setColdTense(id) }} />
                      <ColdOptionGroup title="結尾" options={coldEndingOptions} value={coldEnding} onSelect={(id) => { markColdCustom(); setColdEnding(id) }} />
                      <ColdOptionGroup title="插件" options={coldPluginOptions} values={coldPlugins} multi onSelect={(id) => { markColdCustom(); toggleColdPlugin(id) }} />
                      <ColdOptionGroup title="開場" options={coldMainHookOptions} value={coldHook} onSelect={(id) => { markColdCustom(); setColdHook(id) }} />
                      {coldCounterOption && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: css.ink2, fontSize: '14px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={coldCounterInstinct}
                            onChange={(e) => { markColdCustom(); setColdCounterInstinct(e.target.checked) }}
                          />
                          {`${coldCounterOption.emoji ? `${coldCounterOption.emoji} ` : ''}${profileOptionLabel(coldCounterOption)}`}
                        </label>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'grid', gap: '10px' }}>
                    <button onClick={generate} disabled={loading || coldProfileLoading} style={{ cursor: loading || coldProfileLoading ? 'not-allowed' : 'pointer', padding: '15px 18px', borderRadius: '16px', border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff', fontSize: '15px', fontWeight: 700, boxShadow: '0 18px 36px rgba(124, 92, 252, 0.22)' }}>
                      {loading ? '生成中...' : '生成冷敘事劇本'}
                    </button>
                    <div style={{ fontSize: '13px', color: css.ink3, lineHeight: 1.7 }}>
                      {coldSource.trim() ? '來源模式：壓縮' : '來源模式：展開'}
                    </div>
                  </div>
                </div>
              )}
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
                {generatorType === 'cold_tell'
                  ? ['冷敘事', coldSource.trim() ? '壓縮' : '展開', topic].filter(Boolean).join('  ·  ')
                  : [brand, industry, topic].filter(Boolean).join('  ·  ')}
              </div>

              {generatorType === 'cold_tell' && coldAutoSuggestion && (
                <div style={{ ...railCard, display: 'grid', gap: '14px', border: '1px solid rgba(124,92,252,0.45)' }}>
                  <div style={{ fontSize: '14px', color: css.ink, lineHeight: 1.7 }}>
                    ✨ AI 判斷：{coldAutoSuggestion.emoji ? `${coldAutoSuggestion.emoji} ` : ''}{coldAutoSuggestion.label} — {coldAutoSuggestion.reason}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px' }}>
                    {coldPresetOptions.map((preset) => {
                      const id = profileOptionId(preset)
                      const display = coldPresetDisplay(preset)
                      return (
                        <PresetCard
                          key={id}
                          id={id}
                          emoji={display.emoji}
                          label={display.label}
                          desc={display.desc}
                          selected={coldAutoSuggestion.preset_id === id}
                          onSelect={() => {
                            applyColdPreset(preset)
                            void generateColdTell(id)
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ ...railCard, padding: '24px 26px', border: `1px solid ${css.border2}` }}>
                <div style={{ display: 'grid', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', letterSpacing: '.14em', textTransform: 'uppercase', color: css.ink3, marginBottom: '16px' }}>AI 初稿</div>
                    <div style={{ display: 'grid', gap: '14px' }}>
                      {splitScriptSections(script).map(section => (
                        <div key={section.title} style={{ borderBottom: `1px solid ${css.border}`, paddingBottom: '14px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: css.ink, marginBottom: '8px' }}>{section.title}</div>
                          <div style={{ fontSize: '14px', lineHeight: 1.9, color: css.ink2, whiteSpace: 'pre-wrap' as const }}>{section.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {generatorType === 'cold_tell' && coldSources.length > 0 && (
                    <div style={{ border: `1px solid ${css.border}`, borderRadius: '12px', padding: '12px 14px', background: css.surface }}>
                      <button
                        type="button"
                        onClick={() => setColdSourcesOpen((open) => !open)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', border: 'none', background: 'transparent', color: css.ink, cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>📎 參考來源</span>
                        <span style={{ fontSize: '12px', color: css.ink3 }}>{coldSourcesOpen ? '收起' : `${coldSources.length} 項`}</span>
                      </button>
                      {coldSourcesOpen && (
                        <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                          {coldSources.map((source, index) => {
                            const text = typeof source === 'string' ? source : (source.title || source.url || '')
                            const url = typeof source === 'string' ? '' : (source.url || '')
                            return url ? (
                              <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#8ab4ff', fontSize: '13px', textDecoration: 'none', lineHeight: 1.5 }}>
                                {text || url}
                              </a>
                            ) : (
                              <div key={`${text}-${index}`} style={{ color: css.ink2, fontSize: '13px', lineHeight: 1.6 }}>{text}</div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

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
                    <textarea value={qcScript} onChange={e => setQcScript(e.target.value)} style={{ ...inputStyle, minHeight: '340px', resize: 'vertical' as const, lineHeight: 1.8, background: css.surface }} />
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                      ✓ QC 稿會自動儲存至你的帳戶
                    </p>
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
                <button onClick={copyScript} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
                  {copied ? '已複製！' : '複製 Script'}
                </button>
                <button onClick={copyQcScript} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: `1px solid ${css.border}`, background: css.surface, color: css.ink2, cursor: 'pointer' }}>
                  {copiedQc ? '已複製 QC 稿！' : '複製 QC 稿'}
                </button>
                <button onClick={analyzeEdits} disabled={analyzingEdits || !qcScript.trim()} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: `1px solid ${css.border}`, background: css.surface, color: css.ink2, cursor: analyzingEdits ? 'not-allowed' : 'pointer', opacity: analyzingEdits ? 0.6 : 1 }}>
                  {analyzingEdits ? '分析改稿中…' : '分析我改咗咩'}
                </button>
                <button onClick={saveToDocsCenter} disabled={savingDoc || !(qcScript || script)} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: '1px solid rgba(125,211,252,0.32)', background: 'rgba(14,165,233,0.14)', color: '#bae6fd', cursor: savingDoc ? 'not-allowed' : 'pointer', opacity: savingDoc ? 0.6 : 1 }}>
                  {savingDoc ? '儲存中…' : '儲存到文件中心'}
                </button>
                <button onClick={uploadToDrive} disabled={uploading} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: '1px solid rgba(90,204,150,0.26)', background: uploadDone ? '#4a8a5c' : 'rgba(74,138,92,0.16)', color: uploadDone ? '#fff' : '#baf0cc', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? '上傳中…' : uploadDone ? '✓ 已上傳 QC 稿到 Drive' : '上傳 QC 稿去 Drive'}
                </button>
                {qcScript && (
                  <button onClick={handlePushToStoryboard} style={{ background: '#7c5cfc', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    🎬 推去分鏡工作台
                  </button>
                )}
                <button onClick={generate} style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '11px 18px', borderRadius: '999px', border: `1px solid ${css.border}`, background: css.surface, color: css.ink2, cursor: 'pointer' }}>
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

      </div>

      {historyOpen && (
        <div
          onClick={() => setHistoryOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 49,
          }}
        />
      )}

      {historyOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '400px',
          height: '100vh',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          zIndex: 50,
          overflowY: 'auto',
          padding: '24px',
          boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>歷史記錄</span>
            <button onClick={() => setHistoryOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>

          {historyLoading && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>載入中…</p>
          )}

          {!historyLoading && historyList.map((s) => (
            <div
              key={s.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '12px',
                cursor: 'pointer',
              }}
              onClick={() => {
                const isColdTell = s.generator_type === 'cold_tell'
                setGeneratorType(isColdTell ? 'cold_tell' : 'host_led')
                setBrand(isColdTell ? '' : (s.brand || ''))
                setIndustry(isColdTell ? industry : (s.industry || ''))
                setTopic(s.topic || '')
                setBackground(isColdTell ? '' : (s.background || ''))
                setColdSource(s.source_material || '')
                setColdSources(Array.isArray(s.research_sources) ? s.research_sources : [])
                setColdSourcesOpen(false)
                if (isColdTell) {
                  const snapshot = s.profile_snapshot || {}
                  const snapshotId = (value: any) => typeof value === 'string' ? value : String(value?.id || '')
                  setColdFramework(snapshotId(snapshot.framework) || s.framework || '')
                  setColdTense(snapshotId(snapshot.tense))
                  setColdEnding(snapshotId(snapshot.ending))
                  setColdHook(snapshotId(snapshot.hook))
                  setColdPlugins(Array.isArray(snapshot.plugins) ? snapshot.plugins.map(snapshotId).filter(Boolean) : [])
                  setColdCounterInstinct(Boolean(snapshot.counter_instinct))
                } else {
                  setSelH(s.hook_code || 'H1')
                  setSelT(s.trans_code || 'T1')
                  setSelE(s.ending_code || 'E1')
                }
                setScript(s.ai_draft || '')
                setQcScript(s.qc_final || '')
                setHistoryOpen(false)
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                {s.topic || '（無題目）'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                {s.brand || '未命名'} · {s.industry || '未分類'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                {s.updated_at ? new Date(s.updated_at).toLocaleDateString('zh-HK', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) : ''}
              </p>
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  background: s.generator_type === 'cold_tell' ? 'rgba(14,165,233,0.14)' : 'rgba(124,92,252,0.14)',
                  color: s.generator_type === 'cold_tell' ? '#7dd3fc' : '#c4b5fd',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                }}>
                  {s.generator_type === 'cold_tell' ? '冷敘事' : '主持敘事'}
                </span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  background: s.qc_final ? 'rgba(52,211,153,0.15)' : 'var(--bg-surface)',
                  color: s.qc_final ? '#34d399' : 'var(--text-muted)',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                }}>
                  {s.qc_final ? '✓ 有 QC 稿' : '草稿'}
                </span>
              </div>
            </div>
          ))}

          {!historyLoading && historyList.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
              未有歷史記錄
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        .workspace-shell {
          width: 100%;
          max-width: none;
          margin: 0 auto;
          padding: 28px 20px 72px;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 20px;
          box-sizing: border-box;
        }
        .workspace-main {
          display: grid;
          gap: 20px;
          min-width: 0;
          width: 100%;
        }
        .workspace-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .workspace-shell {
            grid-template-columns: 1fr;
          }
          .workspace-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
