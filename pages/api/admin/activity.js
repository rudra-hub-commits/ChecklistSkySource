import { getAdminClient } from '../../../lib/supabase'
import { getSession } from '../../../lib/session'

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const supabase = getAdminClient()

  if (req.method === 'GET') {
    if ((user.role !== 'admin' && user.role !== 'master_admin')) return res.status(403).json({ error: 'Admin only' })

    const { from, to, username, action, page = 0 } = req.query
    const limit = 50
    let query = supabase
      .from('activity_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, page * limit + limit - 1)

    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to + 'T23:59:59Z')
    if (username) query = query.eq('username', username)
    if (action) query = query.eq('action', action)

    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ logs: data || [], total: count || 0 })
  }

  if (req.method === 'POST') {
    // Log an activity (called internally from other routes)
    const { action, detail, checklistId } = req.body
    await supabase.from('activity_log').insert({
      user_id: user.id,
      username: user.username,
      action,
      detail,
      checklist_id: checklistId || null,
      created_at: new Date().toISOString(),
    })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
