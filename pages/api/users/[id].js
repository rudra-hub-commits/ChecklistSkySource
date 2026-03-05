import { getAdminClient } from '../../../lib/supabase'
import { getSession } from '../../../lib/session'

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  if (user.role !== 'admin' && user.role !== 'master_admin') return res.status(403).json({ error: 'Admin only' })

  const { id } = req.query
  const supabase = getAdminClient()

  if (req.method === 'PUT') {
    const { username, fullname, email, password, role } = req.body

    // Fetch target user
    const { data: target } = await supabase.from('users').select('*').eq('id', id).single()
    if (!target) return res.status(404).json({ error: 'User not found' })

    // No one can demote or edit a master_admin except themselves (the master_admin)
    if (target.role === 'master_admin' && user.id !== id) {
      return res.status(403).json({ error: 'Only the master admin can edit their own account' })
    }

    // Regular admin cannot promote someone to admin or master_admin
    const newRole = role || target.role
    if (newRole === 'master_admin' && user.role !== 'master_admin') {
      return res.status(403).json({ error: 'Only master admin can transfer that role' })
    }
    if (newRole === 'admin' && user.role !== 'master_admin') {
      return res.status(403).json({ error: 'Only master admin can assign admin role' })
    }

    // Master admin transferring their role: demote themselves
    let updateSelf = false
    if (newRole === 'master_admin' && user.role === 'master_admin' && user.id !== id) {
      // Transfer: new user becomes master_admin, current user becomes admin
      updateSelf = true
    }

    const update = { username, fullname, email, role: newRole }
    if (password) update.password_hash = password

    const { data, error } = await supabase
      .from('users')
      .update(update)
      .eq('id', id)
      .select('id, username, fullname, email, role, created_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Demote current master_admin to admin after transfer
    if (updateSelf) {
      await supabase.from('users').update({ role: 'admin' }).eq('id', user.id)
    }

    return res.status(200).json({ user: data, roleTranferred: updateSelf })
  }

  if (req.method === 'DELETE') {
    // Fetch target
    const { data: target } = await supabase.from('users').select('role').eq('id', id).single()

    // Cannot delete master_admin
    if (target?.role === 'master_admin') {
      return res.status(400).json({ error: 'Cannot delete the master admin account. Transfer the role first.' })
    }
    // Regular admin cannot delete another admin
    if (target?.role === 'admin' && user.role !== 'master_admin') {
      return res.status(403).json({ error: 'Only master admin can delete admin accounts' })
    }

    await supabase.from('users').delete().eq('id', id)
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
