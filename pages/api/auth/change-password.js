import { getAdminClient } from '../../../lib/supabase'
import { getSession } from '../../../lib/session'
import { logActivity } from '../../../lib/activity'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = getSession(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' })
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  const supabase = getAdminClient()
  const { data: dbUser } = await supabase.from('users').select('password_hash').eq('id', user.id).single()
  if (!dbUser || dbUser.password_hash !== currentPassword) return res.status(401).json({ error: 'Current password is incorrect' })
  await supabase.from('users').update({ password_hash: newPassword }).eq('id', user.id)
  await logActivity(user.id, user.username, 'password_changed', {})
  return res.status(200).json({ ok: true })
}
