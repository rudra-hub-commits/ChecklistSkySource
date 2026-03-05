import { getAdminClient } from '../../lib/supabase'
import { getSession } from '../../lib/session'

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const supabase = getAdminClient()
  const { checklistId } = req.query

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('snapshots')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('position', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ snapshots: data })
  }

  if (req.method === 'POST') {
    const { position, policyImageB64, nexsureImageB64, notes, policyMime, nexsureMime } = req.body

    let policyUrl = null
    let nexsureUrl = null

    // Upload policy image to Supabase Storage if provided
    if (policyImageB64) {
      const buf = Buffer.from(policyImageB64, 'base64')
      const path = `snapshots/${checklistId}/${position}_policy_${Date.now()}.${(policyMime||'image/png').split('/')[1]}`
      const { error: upErr } = await supabase.storage.from('snapshots').upload(path, buf, { contentType: policyMime || 'image/png', upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('snapshots').getPublicUrl(path)
        policyUrl = urlData.publicUrl
      }
    }

    // Upload nexsure image
    if (nexsureImageB64) {
      const buf = Buffer.from(nexsureImageB64, 'base64')
      const path = `snapshots/${checklistId}/${position}_nexsure_${Date.now()}.${(nexsureMime||'image/png').split('/')[1]}`
      const { error: upErr } = await supabase.storage.from('snapshots').upload(path, buf, { contentType: nexsureMime || 'image/png', upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('snapshots').getPublicUrl(path)
        nexsureUrl = urlData.publicUrl
      }
    }

    const { data, error } = await supabase
      .from('snapshots')
      .upsert({
        checklist_id: checklistId,
        position,
        policy_image_url: policyUrl,
        nexsure_image_url: nexsureUrl,
        notes: notes || '',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'checklist_id,position' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ snapshot: data })
  }

  if (req.method === 'DELETE') {
    const { position } = req.body
    await supabase.from('snapshots').delete().eq('checklist_id', checklistId).eq('position', position)
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
