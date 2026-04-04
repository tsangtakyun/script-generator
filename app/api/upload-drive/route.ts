import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXeMeXgtA9rB3DyRG-3JaVEAC512Ls8Cje6h6DONyh3ADyJl5ClCzDHnnMTzD-clv59g/exec'
const SECRET = 'soon-bbo-2026'

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()

    const params = new URLSearchParams({
      title: title || 'Script',
      content: content || '',
      secret: SECRET,
    })

    const url = `${APPS_SCRIPT_URL}?${params.toString()}`

    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json',
      },
    })

    const text = await res.text()
    
    // Apps Script 可能返回 HTML redirect，搵 JSON 部分
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid response from Apps Script')
    
    const data = JSON.parse(jsonMatch[0])
    if (data.error) throw new Error(data.error)

    return NextResponse.json({ success: true, url: data.url, id: data.id })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
