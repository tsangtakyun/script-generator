import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service role key 尚未設定')
  }

  return createClient(url, serviceRoleKey)
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('style_profiles')
      .select('id,generator_type,name,description,framework_options,tense_options,ending_options,plugin_options,hook_options,presets')
      .eq('generator_type', 'cold_tell')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: '找不到已啟用的冷敘事設定' }, { status: 404 })

    return NextResponse.json({ profile: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '冷敘事設定載入失敗' }, { status: 500 })
  }
}
