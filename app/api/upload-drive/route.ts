import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwLViMowhYw5lgsHx8eG0wHnhs4HnRYDrYbdeYgekls7mArfDRHazs1Hn1klqDqMvPu7w/exec'
const SECRET = 'soon-bbo-2026'

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        title: title || 'Script',
        content: content || '',
        secret: SECRET,
      }).toString(),
    })

    const text = await res.text()
    console.log('Apps Script response:', text.substring(0, 500))
    
    let data
    try {
      data = JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Cannot parse response: ' + text.substring(0, 200))
      data = JSON.parse(jsonMatch[0])
    }

    if (data.error) throw new Error(data.error)
    return NextResponse.json({ success: true, url: data.url, id: data.id })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
