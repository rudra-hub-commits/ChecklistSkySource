import { getSession } from '../../../lib/session'

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
}

export default async function handler(req, res) {
  const user = getSession(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  
  // AI Review is only accessible to Rudra
  if (user.username !== 'Rudra') {
    return res.status(403).json({ error: 'AI Review is available to authorized users only' })
  }

  if (req.method !== 'POST') return res.status(405).end()

  const { documentB64, documentMime, fields, checklistInfo } = req.body

  if (!documentB64 || !fields) {
    return res.status(400).json({ error: 'Document and fields are required' })
  }

  const fieldsText = fields
    .filter(f => !f.isHeader)
    .map(f => `- ${f.label} (id: ${f.id})`)
    .join('\n')

  const systemPrompt = `You are an expert insurance policy analyst. You will analyze insurance policy documents and ACORD forms.
Your job is to extract specific field values from the document and determine if they match what is expected.

For each field, you must:
1. Find the value in the document
2. Note the page number where you found it (estimate page number from document position)
3. Return structured JSON

IMPORTANT: Return ONLY valid JSON, no explanation, no markdown, no backticks.`

  const userPrompt = `Analyze this insurance policy document for the checklist: "${checklistInfo?.insured || 'Unknown'}" (Policy: ${checklistInfo?.policy || 'Unknown'})

Extract values for these fields:
${fieldsText}

Return a JSON object with this exact structure:
{
  "entries": {
    "<field_id>": {
      "pol": "<extracted value from document, or empty string if not found>",
      "pg": "<page number as string, or empty>",
      "status": "<Match|Not Found|N/A>",
      "skyComments": "<brief note if something needs attention, otherwise empty>"
    }
  },
  "summary": "<2-3 sentence summary of what was found>",
  "confidence": "<high|medium|low>"
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: documentMime || 'application/pdf',
                  data: documentB64,
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(500).json({ error: err.error?.message || 'AI service error' })
    }

    const data = await response.json()
    const text = data.content?.map(b => b.text || '').join('').trim()

    // Parse JSON from response
    let parsed
    try {
      // Strip any accidental markdown fences
      const clean = text.replace(/```json\n?|```\n?/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.', raw: text.slice(0, 500) })
    }

    return res.status(200).json(parsed)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
