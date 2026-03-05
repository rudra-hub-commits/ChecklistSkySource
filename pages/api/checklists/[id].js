import { getAdminClient } from '../../../lib/supabase'
import { getSession } from '../../../lib/session'
import { logActivity } from '../../../lib/activity'

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const { id } = req.query
  const supabase = getAdminClient()

  const { data: cl, error: fetchErr } = await supabase.from('checklists').select('*').eq('id', id).single()
  if (fetchErr || !cl) return res.status(404).json({ error: 'Not found' })
  if ((user.role !== 'admin' && user.role !== 'master_admin') && cl.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const { data: entries } = await supabase.from('checklist_entries').select('*').eq('checklist_id', id)
    const { data: snapshots } = await supabase.from('snapshots').select('*').eq('checklist_id', id).order('position', { ascending: true })
    const entriesMap = {}
    ;(entries || []).forEach(e => {
      entriesMap[e.field_id] = { pg: e.pg||'', pol: e.pol||'', nex: e.nex||'', status: e.status||'N/A', skyComments: e.sky_comments||'', amComments: e.am_comments||'' }
    })
    return res.status(200).json({ checklist: cl, entries: entriesMap, snapshots: snapshots || [] })
  }

  if (req.method === 'PUT') {
    const { insured, policy, term, date, checkedby, am, lobs, notes, status, entries } = req.body

    const { error: updateErr } = await supabase.from('checklists').update({
      insured, policy, term, date, checkedby, am, lobs, notes, status,
      updated_at: new Date().toISOString(),
      ...(status === 'complete' ? { completed_at: new Date().toISOString() } : {}),
    }).eq('id', id)

    if (updateErr) return res.status(500).json({ error: updateErr.message })

    if (entries && typeof entries === 'object') {
      const rows = Object.entries(entries).map(([fieldId, e]) => ({
        checklist_id: id, field_id: fieldId,
        pg: e.pg||'', pol: e.pol||'', nex: e.nex||'', status: e.status||'N/A',
        sky_comments: e.skyComments||'', am_comments: e.amComments||'',
      }))
      if (rows.length > 0) {
        const { error: entryErr } = await supabase.from('checklist_entries').upsert(rows, { onConflict: 'checklist_id,field_id' })
        if (entryErr) return res.status(500).json({ error: entryErr.message })
      }
    }

    if (status === 'complete') await logActivity(user.id, user.username, 'checklist_completed', { insured: cl.insured, policy: cl.policy, checklistId: id })
    else await logActivity(user.id, user.username, 'checklist_updated', { insured: cl.insured, checklistId: id })

    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    await supabase.from('checklist_entries').delete().eq('checklist_id', id)
    await supabase.from('snapshots').delete().eq('checklist_id', id)
    await supabase.from('checklists').delete().eq('id', id)
    await logActivity(user.id, user.username, 'checklist_deleted', { insured: cl.insured, policy: cl.policy, checklistId: id })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
