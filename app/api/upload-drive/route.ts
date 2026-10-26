import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSign } from 'crypto'

export const runtime = 'nodejs'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

async function getGoogleAccessToken() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive service account is not configured')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: DRIVE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }))
  const unsignedToken = `${header}.${claim}`
  const signature = createSign('RSA-SHA256').update(unsignedToken).sign(privateKey)
  const assertion = `${unsignedToken}.${base64Url(signature)}`

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Google auth failed')
  }
  return data.access_token as string
}

async function uploadWithDriveApi(title: string, content: string) {
  const accessToken = await getGoogleAccessToken()
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  const safeTitle = title.endsWith('.txt') ? title : `${title}.txt`
  const metadata = {
    name: safeTitle.replace(/\.txt$/i, ''),
    mimeType: 'application/vnd.google-apps.document',
    ...(folderId ? { parents: [folderId] } : {}),
  }
  const boundary = `soon_${Date.now()}`
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    content,
    `--${boundary}--`,
    '',
  ].join('\r\n')

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || data.error || 'Google Drive upload failed')
  }
  return { url: data.webViewLink, id: data.id }
}

export async function POST(request: NextRequest) {
  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL
  const appsScriptSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET || process.env.SOON_APPS_SCRIPT_SECRET

  try {
    const { title, content } = await request.json()
    const docTitle = title || 'Script'
    const docContent = content || ''

    if (!docContent.trim()) {
      return NextResponse.json({ error: 'No script content to upload' }, { status: 400 })
    }

    if (!appsScriptUrl || !appsScriptSecret) {
      const uploaded = await uploadWithDriveApi(docTitle, docContent)
      return NextResponse.json({ success: true, url: uploaded.url, id: uploaded.id })
    }

    const res = await fetch(appsScriptUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        title: docTitle,
        content: docContent,
        secret: appsScriptSecret,
      }).toString(),
    })

    const text = await res.text()
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
