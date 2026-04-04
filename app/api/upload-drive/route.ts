import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXeMeXgtA9rB3DyRG-3JaVEAC512Ls8Cje6h6DONyh3ADyJl5ClCzDHnnMTzD-clv59g/exec'
const SECRET = 'soon-bbo-2026'

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, secret: SECRET }),
      redirect: 'follow',
    })

    const data = await res.json()
    if (data.error) throw new Error(data.error)

    return NextResponse.json({ success: true, url: data.url, id: data.id })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
