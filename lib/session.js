import { serialize, parse } from 'cookie'
import crypto from 'crypto'

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const COOKIE = 'ss_session'

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
}

export function setSession(res, user) {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64')
  const token = `${payload}.${sign(payload)}`
  res.setHeader('Set-Cookie', serialize(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  }))
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', serialize(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  }))
}

export function getSession(req) {
  const cookies = parse(req.headers.cookie || '')
  const token = cookies[COOKIE]
  if (!token) return null

  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  if (sign(payload) !== sig) return null

  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
  } catch {
    return null
  }
}
