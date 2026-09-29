// Função de servidor (Vercel): recebe a ideia, chama o Claude e devolve a composição em JSON.
// A chave fica só aqui no servidor, na variável de ambiente ANTHROPIC_API_KEY.
import { systemPrompt, userPrompt } from '../lib/prompt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'Chave da IA não configurada no servidor.' });
  const { idea = '', format = 'feed', image = null, feedback = [] } = req.body || {};
  if (!idea.trim()) return res.status(400).json({ error: 'Escreva a ideia do post.' });
  if (process.env.STUDIO_PASSWORD && req.headers['x-studio-password'] !== process.env.STUDIO_PASSWORD) {
    return res.status(401).json({ error: 'Senha da equipe incorreta.' });
  }
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        max_tokens: 2500,
        system: systemPrompt(),
        messages: [{ role: 'user', content: userPrompt({ idea, format, image, feedback: feedback.slice(-30) }) }],
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'A IA não respondeu.' });
    const text = (data.content || []).map((c) => c.text || '').join('');
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const spec = JSON.parse(json);
    spec.format = format;
    spec.seed = Math.floor(Math.random() * 100000);
    return res.status(200).json({ spec });
  } catch (e) {
    return res.status(500).json({ error: 'Não consegui montar a peça: ' + e.message });
  }
}
