import { getSession, setSession } from '../../../lib/session'
import { getAdminClient } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = getSession(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  // Always re-fetch from DB — ensures role changes (e.g. admin→master_admin) are reflected immediately
  const supabase = getAdminClient()
  const { data: u } = await supabase
    .from('users')
    .select('id, username, fullname, email, role')
    .eq('id', session.id)
    .single()

  if (!u) return res.status(401).json({ error: 'User not found' })

  // Always rewrite cookie so role is always fresh
  setSession(res, { id: u.id, username: u.username, fullname: u.fullname, email: u.email, role: u.role })

  return res.status(200).json({
    user: { id: u.id, username: u.username, fullname: u.fullname, email: u.email, role: u.role }
  })
}
