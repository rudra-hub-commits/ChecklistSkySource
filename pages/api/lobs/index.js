import { getAdminClient } from '../../../lib/supabase'
import { getSession } from '../../../lib/session'

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const supabase = getAdminClient()

  if (req.method === 'GET') {
    const { data: lobs, error: lobErr } = await supabase
      .from('lobs')
      .select('*')
      .order('sort_order', { ascending: true })
    if (lobErr) return res.status(500).json({ error: lobErr.message })

    const { data: fields } = await supabase
      .from('lob_fields')
      .select('*')
      .order('sort_order', { ascending: true })

    // Group fields by lob_name
    const fieldsByLob = {}
    ;(fields || []).forEach(f => {
      if (!fieldsByLob[f.lob_name]) fieldsByLob[f.lob_name] = []
      fieldsByLob[f.lob_name].push({ id: f.field_id, label: f.label, isHeader: f.is_header })
    })

    return res.status(200).json({ lobs, fields: fieldsByLob })
  }

  // Admin only below
  if ((user.role !== 'admin' && user.role !== 'master_admin')) return res.status(403).json({ error: 'Admin only' })

  if (req.method === 'POST') {
    const { name, code } = req.body
    if (!name || !code) return res.status(400).json({ error: 'Name and code required' })

    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { data: maxSort } = await supabase.from('lobs').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
    const sortOrder = (maxSort?.sort_order || 0) + 1

    const { data, error } = await supabase
      .from('lobs')
      .insert({ id, name, code, locked: false, sort_order: sortOrder })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ lob: data })
  }

  res.status(405).end()
}
