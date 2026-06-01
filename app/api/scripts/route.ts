import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin env not configured')
  }

  return createClient(url, serviceRoleKey)
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || ''
}

async function resolveScriptIdentity(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email?: string | null
) {
  const ids = new Set<string>()
  if (userId) ids.add(userId)

  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return { ids: Array.from(ids), primaryUserId: userId }

  const { data } = await supabase
    .from('user_credits')
    .select('user_id, egg_user_id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  const creditsRow = data as { user_id?: string | null; egg_user_id?: string | null } | null
  const linkedUserId = creditsRow?.user_id ? String(creditsRow.user_id) : ''
  const linkedEggUserId = creditsRow?.egg_user_id ? String(creditsRow.egg_user_id) : ''
  if (linkedUserId) ids.add(linkedUserId)
  if (linkedEggUserId) ids.add(linkedEggUserId)

  return {
    ids: Array.from(ids),
    primaryUserId: linkedEggUserId || linkedUserId || userId,
  }
}

export async function POST(req: NextRequest) {
  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const body = await req.json()
  const {
    user_id,
    user_email,
    email,
    brand,
    industry,
    topic,
    background,
    hook_code,
    trans_code,
    ending_code,
    ai_draft,
    qc_final,
  } = body

  if (!user_id) return NextResponse.json({ error: 'no user' }, { status: 401 })
  const identity = await resolveScriptIdentity(supabase, user_id, user_email || email)

  const payload = {
    user_id: identity.primaryUserId,
    brand,
    industry,
    topic,
    background,
    hook_code,
    trans_code,
    ending_code,
    ai_draft,
    qc_final,
    updated_at: new Date().toISOString(),
  }

  const { data: existing, error: findError } = await supabase
    .from('scripts')
    .select('id')
    .in('user_id', identity.ids)
    .eq('topic', topic || '')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findError) return NextResponse.json({ error: findError }, { status: 500 })

  const query = existing?.id
    ? supabase.from('scripts').update(payload).eq('id', existing.id)
    : supabase.from('scripts').insert(payload)

  const { data, error } = await query.select().single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ script: data })
}

export async function GET(req: NextRequest) {
  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const email = searchParams.get('email')

  if (!user_id) return NextResponse.json({ error: 'no user' }, { status: 401 })
  const identity = await resolveScriptIdentity(supabase, user_id, email)

  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .in('user_id', identity.ids)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ scripts: data })
}
