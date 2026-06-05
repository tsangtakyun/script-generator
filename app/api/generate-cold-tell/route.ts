import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

type OptionRecord = Record<string, any>

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service role key 尚未設定')
  }

  return createClient(url, serviceRoleKey)
}

function getSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase anon key 尚未設定')
  }

  return createClient(url, anonKey)
}

async function getAuthenticatedUser(request: NextRequest) {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (bearer) {
    const supabase = getSupabaseAnon()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(bearer)
    if (!error && user) return user
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll() as any,
        setAll: (all: any) => {
          all.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

function asArray(value: unknown): OptionRecord[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : []
}

function optionId(option: OptionRecord) {
  return String(option.id ?? option.value ?? option.key ?? '')
}

function optionLabel(option?: OptionRecord | null) {
  return String(option?.label ?? option?.name ?? option?.title ?? optionId(option ?? {}) ?? '')
}

function findOption(options: OptionRecord[], id: string) {
  return options.find((option) => optionId(option) === id) ?? options[0] ?? null
}

function replaceAllTokens(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replaceAll(`{{${key}}}`, value),
    template
  )
}

function getOptionText(option: OptionRecord | null, keys: string[]) {
  if (!option) return ''
  for (const key of keys) {
    const value = option[key]
    if (typeof value === 'string') return value
  }
  return ''
}

function extractTextAndSources(content: any[]) {
  const textParts: string[] = []
  const sourcesByKey = new Map<string, Record<string, string>>()

  for (const block of content) {
    if (block?.type === 'text' && typeof block.text === 'string') {
      textParts.push(block.text)
      for (const citation of block.citations ?? []) {
        const url = citation.url || citation.uri || citation.source || ''
        const title = citation.title || citation.cited_text || url
        if (url || title) {
          sourcesByKey.set(url || title, { title: String(title || url), url: String(url || '') })
        }
      }
    }

    if (block?.type === 'web_search_tool_result') {
      const results = Array.isArray(block.content) ? block.content : []
      for (const result of results) {
        const url = result.url || result.uri || ''
        const title = result.title || url
        if (url || title) {
          sourcesByKey.set(url || title, { title: String(title || url), url: String(url || '') })
        }
      }
    }
  }

  return {
    text: textParts.join('\n\n').trim(),
    sources: Array.from(sourcesByKey.values()),
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Anthropic API key 尚未設定' }, { status: 500 })

    const user = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ error: '尚未登入或登入狀態已失效' }, { status: 401 })

    const body = await request.json()
    const profileId = String(body.profile_id || '')
    const sourceMaterial = String(body.source_material || '').trim()
    const topic = String(body.topic || '').trim()
    const sourceMode = sourceMaterial ? 'compress' : 'expand'

    if (!profileId) return NextResponse.json({ error: '缺少冷敘事設定 ID' }, { status: 400 })
    if (!sourceMaterial && !topic) return NextResponse.json({ error: '請填寫主題，或貼上來源內容' }, { status: 400 })

    const admin = getSupabaseAdmin()
    const { data: profile, error: profileError } = await admin
      .from('style_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('generator_type', 'cold_tell')
      .eq('is_active', true)
      .maybeSingle()

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
    if (!profile) return NextResponse.json({ error: '找不到已啟用的冷敘事設定' }, { status: 404 })

    const frameworkOptions = asArray(profile.framework_options)
    const tenseOptions = asArray(profile.tense_options)
    const endingOptions = asArray(profile.ending_options)
    const pluginOptions = asArray(profile.plugin_options)
    const hookOptions = asArray(profile.hook_options)

    const framework = findOption(frameworkOptions, String(body.framework || ''))
    const tense = findOption(tenseOptions, String(body.tense || ''))
    const ending = findOption(endingOptions, String(body.ending || ''))
    const hook = findOption(hookOptions.filter((option) => !option.toggle), String(body.hook || ''))
    const selectedPluginIds = Array.isArray(body.plugins) ? body.plugins.map(String) : []
    const selectedPlugins = pluginOptions.filter((option) => selectedPluginIds.includes(optionId(option)))
    const counterInstinct = Boolean(body.counter_instinct)
    const counterOption = hookOptions.find((option) => optionId(option) === 'counter_instinct' || option.toggle)

    const system = replaceAllTokens(String(profile.system_prompt || ''), {
      framework_label: optionLabel(framework),
      framework_skeleton: getOptionText(framework, ['skeleton', 'framework_skeleton', 'template', 'description']),
      tense_label: optionLabel(tense),
      tense_feel: getOptionText(tense, ['feel', 'tense_feel', 'description']),
      ending_label: optionLabel(ending),
      ending_note: getOptionText(ending, ['note', 'ending_note', 'description']),
      plugins_list: selectedPlugins.map(optionLabel).join(', ') || 'None',
      hook_label: optionLabel(hook),
      hook_template: getOptionText(hook, ['template', 'hook_template', 'description']),
      counter_instinct_note: counterInstinct
        ? getOptionText(counterOption ?? null, ['note', 'instruction', 'template', 'description'])
        : '',
    })

    const userMessage =
      sourceMode === 'compress'
        ? `Source material:\n${sourceMaterial}\n\nUse the configured Cold Tell style profile. Compress and transform the source into one finished script.`
        : `Topic:\n${topic}\n\nResearch real facts using web search, then write one finished Cold Tell script.`

    const anthropicBody: Record<string, unknown> = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }

    if (sourceMode === 'expand') {
      anthropicBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }]
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    })
    const data = await upstream.json()
    if (!upstream.ok) {
      return NextResponse.json({ error: data?.error?.message || 'Anthropic 請求失敗' }, { status: upstream.status })
    }

    const { text, sources } = extractTextAndSources(Array.isArray(data.content) ? data.content : [])
    if (!text) return NextResponse.json({ error: 'Claude 沒有回傳文字內容' }, { status: 502 })

    const profileSnapshot = {
      profile_id: profile.id,
      profile_name: profile.name,
      framework: framework ? { id: optionId(framework), label: optionLabel(framework) } : null,
      tense: tense ? { id: optionId(tense), label: optionLabel(tense) } : null,
      ending: ending ? { id: optionId(ending), label: optionLabel(ending) } : null,
      plugins: selectedPlugins.map((option) => ({ id: optionId(option), label: optionLabel(option) })),
      hook: hook ? { id: optionId(hook), label: optionLabel(hook) } : null,
      counter_instinct: counterInstinct,
    }

    const { data: scriptRow, error: saveError } = await admin
      .from('scripts')
      .insert({
        user_id: user.id,
        workspace_id: body.workspace_id || null,
        generator_type: 'cold_tell',
        profile_id: profile.id,
        profile_snapshot: profileSnapshot,
        framework: framework ? optionId(framework) : null,
        topic,
        source_material: sourceMaterial,
        source_mode: sourceMode,
        ai_draft: text,
        qc_final: text,
        research_sources: sourceMode === 'expand' ? sources : null,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })

    return NextResponse.json({
      script: text,
      sources: sourceMode === 'expand' ? sources : [],
      row: scriptRow,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '冷敘事生成失敗' }, { status: 500 })
  }
}
