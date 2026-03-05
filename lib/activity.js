import { getAdminClient } from './supabase'

export async function logActivity(userId, username, actionType, detail = {}) {
  try {
    const supabase = getAdminClient()
    await supabase.from('activity_log').insert({
      user_id: userId,
      username,
      action_type: actionType,
      detail: JSON.stringify(detail),
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('logActivity error:', e.message)
  }
}
