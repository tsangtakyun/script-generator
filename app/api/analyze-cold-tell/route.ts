import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

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

function optionLabel(option: OptionRecord) {
  return String(option.label ?? option.name ?? option.title ?? optionId(option))
}

function stripJsonFences(text: string) {
  return text.replace(/```json|```/gi, '').trim()
}

function fallbackResult(validIds: Set<string>) {
  const fallbackId = validIds.has('twist_justice') ? 'twist_justice' : Array.from(validIds)[0]
  return {
    preset_id: fallbackId,
    reason: '預設套餐（自動判斷失敗）',
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Anthropic API key 尚未設定' }, { status: 500 })

    const user = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ error: '尚未登入或登入狀態已失效' }, { status: 401 })

    const body = await request.json()
    const sourceMaterial = String(body.source_material || '').trim()
    const topic = String(body.topic || '').trim()
    const material = sourceMaterial || topic
    if (!material) return NextResponse.json({ error: '請填寫主題，或貼上來源內容' }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { data: profile, error } = await supabase
      .from('style_profiles')
      .select('presets')
      .eq('generator_type', 'cold_tell')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const presets = asArray(profile?.presets).slice(0, 6)
    const validIds = new Set(presets.map(optionId).filter(Boolean))
    if (presets.length === 0 || validIds.size === 0) {
      return NextResponse.json({ error: '找不到可用的冷敘事套餐' }, { status: 404 })
    }

    const choices = presets.map((preset) => ({
      id: optionId(preset),
      label: optionLabel(preset),
      framework: String(preset.framework ?? preset.framework_id ?? ''),
      ending: String(preset.ending ?? preset.ending_id ?? ''),
    }))

    const system = `你是一個冷敘事短片套餐分類器。你只可以從提供的 allowed_choices 選一個 preset id。
回覆必須是嚴格 JSON，不能有 prose，不能有 markdown fences。
格式：{"preset_id":"<one of the ids>","reason":"<一句簡短廣東話書面語原因>"}`

    const userMessage = JSON.stringify({
      allowed_choices: choices,
      material,
      task: '請根據素材的敘事框架與結尾需要，選出最適合的一個 preset_id。',
    })

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    const data = await upstream.json()
    if (!upstream.ok) {
      return NextResponse.json({ error: data?.error?.message || 'Anthropic 請求失敗' }, { status: upstream.status })
    }

    const text = Array.isArray(data.content)
      ? data.content.filter((block: any) => block?.type === 'text').map((block: any) => block.text).join('\n').trim()
      : ''

    try {
      const parsed = JSON.parse(stripJsonFences(text))
      const presetId = String(parsed.preset_id || '')
      if (!validIds.has(presetId)) return NextResponse.json(fallbackResult(validIds))
      return NextResponse.json({
        preset_id: presetId,
        reason: String(parsed.reason || 'AI 已選出最適合的套餐。').slice(0, 120),
      })
    } catch {
      return NextResponse.json(fallbackResult(validIds))
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '自動判斷套餐失敗' }, { status: 500 })
  }
}
