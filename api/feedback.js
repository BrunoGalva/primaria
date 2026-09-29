// Memória compartilhada de aprovações (opcional). Usa Upstash Redis (plano grátis) se configurado:
// UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN. Sem isso, cada navegador guarda a própria memória.
const KEY = 'primaria:feedback';

async function redis(cmd) {
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(cmd) });
  return r.json();
}

export default async function handler(req, res) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return res.status(501).json({ error: 'Memória compartilhada não configurada.' });
  if (process.env.STUDIO_PASSWORD && req.headers['x-studio-password'] !== process.env.STUDIO_PASSWORD) {
    return res.status(401).json({ error: 'Senha da equipe incorreta.' });
  }
  try {
    if (req.method === 'GET') {
      const out = await redis(['LRANGE', KEY, '-200', '-1']);
      return res.status(200).json({ items: (out.result || []).map((s) => JSON.parse(s)) });
    }
    if (req.method === 'POST') {
      const item = req.body || {};
      if (!['aprovado', 'reprovado'].includes(item.verdict)) return res.status(400).json({ error: 'verdict inválido' });
      await redis(['RPUSH', KEY, JSON.stringify({ ...item, ts: Date.now() })]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Use GET ou POST' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
