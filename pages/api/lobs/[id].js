import { getAdminClient } from '../../../lib/supabase'
import { getSession } from '../../../lib/session'

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user || (user.role !== 'admin' && user.role !== 'master_admin')) return res.status(403).json({ error: 'Admin only' })

  const { id } = req.query
  const supabase = getAdminClient()

  if (req.method === 'DELETE') {
    const { data: lob } = await supabase.from('lobs').select('locked').eq('id', id).single()
    if (lob?.locked) return res.status(400).json({ error: 'Cannot delete a locked LOB' })
    await supabase.from('lob_fields').delete().eq('lob_id', id)
    await supabase.from('lobs').delete().eq('id', id)
    return res.status(200).json({ ok: true })
  }

  // PUT — save fields for a LOB (by lob name passed as query param)
  if (req.method === 'PUT') {
    const { fields, lobName } = req.body
    if (!lobName || !Array.isArray(fields)) return res.status(400).json({ error: 'lobName and fields required' })

    // Delete existing fields for this LOB
    await supabase.from('lob_fields').delete().eq('lob_name', lobName)

    // Re-insert
    if (fields.length > 0) {
      const rows = fields.map((f, i) => ({
        lob_id: id,
        lob_name: lobName,
        field_id: f.id,
        label: f.label,
        is_header: f.isHeader || false,
        sort_order: i,
      }))
      const { error } = await supabase.from('lob_fields').insert(rows)
      if (error) return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
