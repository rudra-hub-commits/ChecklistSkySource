import { getAdminClient } from '../../lib/supabase'
import { getSession } from '../../lib/session'

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user || (user.role !== 'admin' && user.role !== 'master_admin')) {
    return res.status(403).json({ error: 'Admin only' })
  }
  if (req.method !== 'GET') return res.status(405).end()

  const supabase = getAdminClient()
  const { from, to, userId, type } = req.query

  let query = supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  if (from) query = query.gte('created_at', from)
  if (to)   query = query.lte('created_at', to + 'T23:59:59Z')
  if (userId && userId !== 'all') query = query.eq('user_id', userId)
  if (type   && type   !== 'all') query = query.eq('action_type', type)  // correct column name

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ logs: data || [] })
}
