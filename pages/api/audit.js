import { getAdminClient } from '../../lib/supabase'
import { getSession } from '../../lib/session'

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const supabase = getAdminClient()

  if (req.method === 'GET') {
    const { checklistId } = req.query
    if (!checklistId) return res.status(400).json({ error: 'checklistId required' })

    const { data, error } = await supabase
      .from('audit_trail')
      .select('*')
      .eq('checklist_id', parseInt(checklistId))   // cast to int — matches bigint column
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      // Table might not exist yet — return empty instead of crashing
      if (error.code === '42P01') return res.status(200).json({ trail: [] })
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json({ trail: data || [] })
  }

  if (req.method === 'POST') {
    const { checklistId, fieldId, fieldLabel, section, changeType, oldValue, newValue } = req.body
    const { error } = await supabase.from('audit_trail').insert({
      checklist_id: parseInt(checklistId),         // cast to int
      user_id: user.id,
      username: user.username,
      field_id: fieldId || null,
      field_label: fieldLabel || null,
      section: section || null,
      change_type: changeType,
      old_value: oldValue != null ? String(oldValue) : null,
      new_value: newValue != null ? String(newValue) : null,
      created_at: new Date().toISOString(),
    })
    if (error) {
      if (error.code === '42P01') return res.status(200).json({ ok: true }) // table missing, fail silently
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
