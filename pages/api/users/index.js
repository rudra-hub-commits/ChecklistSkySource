import { getAdminClient } from '../../../lib/supabase'
import { getSession } from '../../../lib/session'

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  if (user.role !== 'admin' && user.role !== 'master_admin') return res.status(403).json({ error: 'Admin only' })

  const supabase = getAdminClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, fullname, email, role, created_at')
      .order('created_at', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ users: data })
  }

  if (req.method === 'POST') {
    // Only master_admin can create admins; regular admin can only create users
    const { username, fullname, email, password, role } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

    const requestedRole = role || 'user'
    if (requestedRole === 'master_admin') {
      return res.status(403).json({ error: 'Cannot create another master_admin. Transfer the role instead.' })
    }
    if (requestedRole === 'admin' && user.role !== 'master_admin') {
      return res.status(403).json({ error: 'Only master admin can create admin accounts' })
    }

    const { data, error } = await supabase
      .from('users')
      .insert({ username, fullname, email, password_hash: password, role: requestedRole })
      .select('id, username, fullname, email, role, created_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ user: data })
  }

  res.status(405).end()
}
