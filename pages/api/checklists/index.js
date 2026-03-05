import { getAdminClient } from '../../../lib/supabase'
import { getSession } from '../../../lib/session'
import { logActivity } from '../../../lib/activity'

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const supabase = getAdminClient()

  if (req.method === 'GET') {
    let query = supabase.from('checklists').select('*').order('updated_at', { ascending: false })
    if ((user.role !== 'admin' && user.role !== 'master_admin')) query = query.eq('user_id', user.id)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ checklists: data })
  }

  if (req.method === 'POST') {
    const { insured, policy, term, date, checkedby, am, lobs, notes } = req.body
    if (!insured) return res.status(400).json({ error: 'Insured name required' })

    const { data, error } = await supabase
      .from('checklists')
      .insert({
        user_id: user.id,
        username: user.username,
        insured, policy, term, date, checkedby, am, lobs,
        notes: notes || '',
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .select().single()

    if (error) return res.status(500).json({ error: error.message })
    await logActivity(user.id, user.username, 'checklist_created', { insured, policy, checklistId: data.id })
    return res.status(201).json({ checklist: data })
  }

  res.status(405).end()
}
