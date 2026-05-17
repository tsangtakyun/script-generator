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
    brand,
    industry,
    topic,
    background,
    hook_code,
    trans_code,
    ending_code,
    ai_draft,
    qc_final,
    workspace_id,
  } = body

  if (!user_id) return NextResponse.json({ error: 'no user' }, { status: 401 })

  const payload = {
    user_id,
    brand,
    industry,
    topic,
    background,
    hook_code,
    trans_code,
    ending_code,
    ai_draft,
    qc_final,
    workspace_id: workspace_id || null,
    updated_at: new Date().toISOString(),
  }

  let findQuery = supabase
    .from('scripts')
    .select('id')
    .eq('user_id', user_id)
    .eq('topic', topic || '')

  if (workspace_id) findQuery = findQuery.eq('workspace_id', workspace_id)
  else findQuery = findQuery.is('workspace_id', null)

  const { data: existing, error: findError } = await findQuery
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
  const workspaceId = searchParams.get('workspace_id')

  if (!user_id) return NextResponse.json({ error: 'no user' }, { status: 401 })

  let query = supabase
    .from('scripts')
    .select('*')
    .eq('user_id', user_id)

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ scripts: data })
}
