const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

exports.suggest = async (req, res) => {
  try {
    const { type, items } = req.body

    if (!type || !['books', 'movies'].includes(type)) {
      return res.status(400).json({ error: 'type must be "books" or "movies"' })
    }

    const isBooks = type === 'books'

    let listText = ''
    if (!items || items.length === 0) {
      listText = `The user has not logged any ${type} yet.`
    } else if (isBooks) {
      listText = items
        .map(b => `- "${b.title}" by ${b.author} (${b.genre}, ${b.rating}/5 stars)`)
        .join('\n')
    } else {
      listText = items
        .map(m => `- "${m.title}" directed by ${m.director} (${m.genre}, ${m.rating}/5 stars)`)
        .join('\n')
    }

    const prompt = isBooks
      ? `Based on the books this person has read and rated, suggest 5 books they would love next. Be specific about why each fits their taste.

Books they have read:
${listText}

Reply with exactly 5 suggestions in this JSON format (no markdown, just raw JSON):
{"suggestions":[{"title":"...","author":"...","genre":"...","reason":"One sentence on why they will love it based on their taste."}]}`
      : `Based on the movies this person has watched and rated, suggest 5 movies they would love next. Be specific about why each fits their taste.

Movies they have watched:
${listText}

Reply with exactly 5 suggestions in this JSON format (no markdown, just raw JSON):
{"suggestions":[{"title":"...","director":"...","genre":"...","reason":"One sentence on why they will love it based on their taste."}]}`

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content.find(b => b.type === 'text')?.text || ''
    const parsed = JSON.parse(text)

    res.json(parsed)
  } catch (err) {
    console.error('AI suggest error:', err)
    res.status(500).json({ error: 'Failed to get suggestions' })
  }
}
