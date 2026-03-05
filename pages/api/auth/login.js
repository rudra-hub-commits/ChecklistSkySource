import { getAdminClient } from '../../../lib/supabase'
import { setSession } from '../../../lib/session'
import { logActivity } from '../../../lib/activity'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

  const supabase = getAdminClient()

  // Support login with username OR email
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .or(`username.eq.${username},email.eq.${username}`)

  const u = users?.[0]
  if (!u || u.password_hash !== password) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  setSession(res, { id: u.id, username: u.username, fullname: u.fullname, email: u.email, role: u.role })
  await logActivity(u.id, u.username, 'login', {})
  return res.status(200).json({
    user: { id: u.id, username: u.username, fullname: u.fullname, email: u.email, role: u.role },
  })
}
