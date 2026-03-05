import { clearSession } from '../../../lib/session'

export default function handler(req, res) {
  clearSession(res)
  res.status(200).json({ ok: true })
}
