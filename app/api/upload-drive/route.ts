/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL!
    const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!
    const token = await getAccessToken(clientEmail, privateKey)
    const fileName = `${title || 'Script'} — ${new Date().toLocaleDateString('zh-HK')}`
    const metadata = JSON.stringify({
      name: fileName,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId],
    })
    const body = `--boundary123\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--boundary123\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${content}\r\n--boundary123--`
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/related; boundary=boundary123',
      },
      body,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Upload failed')
    return NextResponse.json({ success: true, url: `https://docs.google.com/document/d/${data.id}/edit`, id: data.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const headerB64 = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payloadB64 = toBase64Url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }))
  const signingInput = `${headerB64}.${payloadB64}`
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )
  const sigArray = Array.from(new Uint8Array(signature))
  const sigB64 = toBase64Url(sigArray.map((b) => String.fromCharCode(b)).join(''), true)
  const jwt = `${signingInput}.${sigB64}`
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error('Cannot get access token')
  return tokenData.access_token
}

function toBase64Url(input: string, isBinary = false): string {
  const str = isBinary ? input : unescape(encodeURIComponent(input))
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
