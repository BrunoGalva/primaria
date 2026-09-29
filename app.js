import { IMAGES, FORMATS, PHRASES } from './lib/brand.js';
import { renderSpec, USER_IMAGES } from './lib/render.js';
import { composeLocal, summarize } from './lib/composer.js';

const $ = (s) => document.querySelector(s);
const state = { format: 'feed', image: null, spec: null, idea: '', feedback: [], shared: false, aiOnline: null, busy: false };

// ---------- memória ----------
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
};
state.feedback = LS.get('primaria_feedback', []);
const password = () => LS.get('primaria_pwd', '');
const headers = () => ({ 'content-type': 'application/json', 'x-studio-password': password() });

async function loadSharedFeedback() {
  try {
    const r = await fetch('api/feedback', { headers: headers() });
    if (!r.ok) return;
    const { items } = await r.json();
    state.feedback = items; state.shared = true;
    LS.set('primaria_feedback', items.slice(-80));
    renderHistory();
  } catch { /* sem servidor: memória local */ }
}

// ---------- UI: formato, imagens ----------
function setFormat(f) {
  state.format = f;
  document.querySelectorAll('[data-format]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.format === f)));
  $('#canvas').style.aspectRatio = `${FORMATS[f].w} / ${FORMATS[f].h}`;
}
document.querySelectorAll('[data-format]').forEach((b) => b.addEventListener('click', () => setFormat(b.dataset.format)));

function renderThumbs() {
  const box = $('#thumbs'); box.innerHTML = '';
  const all = [...IMAGES.map((i) => ({ id: i.id, src: i.file, desc: i.desc })), ...[...USER_IMAGES].map(([id, src]) => ({ id, src, desc: 'foto enviada' }))];
  for (const im of all) {
    const b = document.createElement('button');
    b.className = 'thumb'; b.type = 'button'; b.title = im.desc; b.setAttribute('aria-pressed', String(state.image === im.id));
    b.setAttribute('aria-label', `Usar imagem: ${im.desc}`);
    b.innerHTML = `<img src="${im.src}" alt="">`;
    b.addEventListener('click', () => { state.image = state.image === im.id ? null : im.id; renderThumbs(); });
    box.appendChild(b);
  }
  $('#imgState').textContent = state.image ? 'Imagem escolhida' : 'Imagem automática';
}
$('#upload').addEventListener('change', (e) => {
  for (const f of e.target.files) {
    const rd = new FileReader();
    rd.onload = () => { const id = 'upload_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); USER_IMAGES.set(id, rd.result); state.image = id; renderThumbs(); };
    rd.readAsDataURL(f);
  }
  e.target.value = '';
});

// ---------- chat ----------
function msg(role, html) {
  const d = document.createElement('div');
  d.className = 'msg ' + role; d.innerHTML = html;
  $('#log').appendChild(d); $('#log').scrollTop = $('#log').scrollHeight;
  return d;
}
const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function askAI(idea) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const r = await fetch('api/compose', {
      method: 'POST', headers: headers(), signal: ctrl.signal,
      body: JSON.stringify({ idea, format: state.format, image: state.image && !state.image.startsWith('upload_') ? state.image : null, feedback: state.feedback.slice(-30) }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401) { $('#pwdRow').hidden = false; throw new Error(data.error || 'Senha incorreta.'); }
    if (!r.ok) throw new Error(data.error || 'Servidor indisponível.');
    return data.spec;
  } finally { clearTimeout(t); }
}

function setStatus(online) {
  state.aiOnline = online;
  const s = $('#status');
  s.textContent = online ? 'IA conectada' : 'Modo local';
  s.dataset.on = String(!!online);
}

async function generate(idea, { variar = false } = {}) {
  if (state.busy) return;
  state.busy = true; $('#go').disabled = true; $('#vary').disabled = true;
  if (!variar) msg('you', esc(idea));
  const wait = msg('studio', '<span class="dots">Compondo</span>');
  let spec = null, local = false, err = '';
  const wasOnline = state.aiOnline;
  if (!variar && state.aiOnline !== false) {
    try { spec = await askAI(idea); setStatus(true); } catch (e) { err = e.message; setStatus(false); }
  }
  if (!spec) {
    spec = composeLocal({ idea, format: state.format, image: state.image, feedback: state.feedback, seed: Math.floor(Math.random() * 99999) });
    local = true;
  }
  if (state.image && state.image.startsWith('upload_')) spec.layers.forEach((l) => { if (l.type === 'image') l.image = state.image; });
  spec.format = state.format;
  state.spec = spec; state.idea = idea;
  try {
    const { notes } = await renderSpec(spec, $('#canvas'));
    wait.innerHTML = `${esc(spec.rationale || 'Peça pronta.')}${local && !variar && err && wasOnline !== false ? `<small>IA indisponível (${esc(err)}). Criei no modo local.</small>` : ''}${notes.filter((n) => n.startsWith('Logo')).map((n) => `<small>${esc(n)}</small>`).join('')}${spec.caption ? `<div class="cap"><span>Legenda</span><p>${esc(spec.caption)}</p><button type="button" class="copy">Copiar legenda</button></div>` : ''}`;
    wait.querySelector('.copy')?.addEventListener('click', async (e) => {
      try { await navigator.clipboard.writeText(spec.caption); e.target.textContent = 'Copiada'; } catch { e.target.textContent = 'Selecione e copie'; }
    });
  } catch (e) {
    wait.innerHTML = `Não consegui desenhar a peça: ${esc(e.message)}`;
  }
  renderEditor();
  $('#empty').hidden = true; $('#actions').hidden = false;
  state.busy = false; $('#go').disabled = false; $('#vary').disabled = false;
}

$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const idea = $('#idea').value.trim();
  if (!idea) { $('#idea').focus(); return; }
  generate(idea); $('#idea').value = '';
});
$('#idea').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) $('#form').requestSubmit(); });
document.querySelectorAll('[data-idea]').forEach((b) => b.addEventListener('click', () => { $('#idea').value = b.dataset.idea; $('#idea').focus(); }));
$('#vary').addEventListener('click', () => generate(state.idea || PHRASES[0], { variar: true }));
$('#pwd').addEventListener('change', (e) => LS.set('primaria_pwd', e.target.value));

// ---------- editar textos ----------
function renderEditor() {
  const box = $('#editor'); box.innerHTML = '';
  const texts = (state.spec?.layers || []).map((l, i) => [l, i]).filter(([l]) => l.type === 'text');
  $('#editorWrap').hidden = !texts.length;
  texts.forEach(([l, i]) => {
    const id = 'txt' + i;
    const row = document.createElement('div'); row.className = 'field';
    row.innerHTML = `<label for="${id}">Texto ${texts.findIndex(([, j]) => j === i) + 1}</label><textarea id="${id}" rows="${Math.max(2, Math.ceil(String(l.text).length / 26), String(l.text).split('\n').length)}"></textarea>`;
    const ta = row.querySelector('textarea'); ta.value = l.text;
    let t; ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(async () => { l.text = ta.value; await renderSpec(state.spec, $('#canvas')); }, 350); });
    box.appendChild(row);
  });
}

// ---------- baixar ----------
$('#download').addEventListener('click', () => {
  $('#canvas').toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `primaria-${state.format}-${Date.now()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
});

// ---------- aprovar / reprovar ----------
let pending = null;
$('#approve').addEventListener('click', () => vote('aprovado'));
$('#reject').addEventListener('click', () => { pending = 'reprovado'; $('#reasonRow').hidden = false; $('#reason').focus(); });
$('#reasonOk').addEventListener('click', () => { vote(pending, $('#reason').value.trim()); $('#reason').value = ''; $('#reasonRow').hidden = true; });

async function vote(verdict, reason = '') {
  if (!state.spec) return;
  const thumb = (() => { const c = document.createElement('canvas'); const s = $('#canvas'); c.width = 180; c.height = Math.round(180 * s.height / s.width); c.getContext('2d').drawImage(s, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.7); })();
  const item = { verdict, reason, idea: state.idea, ...summarize(state.spec), ts: Date.now() };
  state.feedback.push(item);
  const thumbs = LS.get('primaria_thumbs', []); thumbs.push({ ts: item.ts, verdict, thumb }); LS.set('primaria_thumbs', thumbs.slice(-40));
  LS.set('primaria_feedback', state.feedback.slice(-80));
  msg('studio', verdict === 'aprovado' ? 'Aprovada. As próximas criações vão puxar para esse lado.' : `Reprovada${reason ? ` (${esc(reason)})` : ''}. Não vou repetir esse caminho.`);
  renderHistory();
  try { await fetch('api/feedback', { method: 'POST', headers: headers(), body: JSON.stringify(item) }); } catch { /* local */ }
}

function renderHistory() {
  const thumbs = LS.get('primaria_thumbs', []);
  const box = $('#history'); box.innerHTML = '';
  $('#histCount').textContent = `${state.feedback.filter((f) => f.verdict === 'aprovado').length} aprovadas · ${state.feedback.filter((f) => f.verdict === 'reprovado').length} reprovadas${state.shared ? ' · memória da equipe' : ''}`;
  thumbs.slice().reverse().forEach((t) => {
    const d = document.createElement('div'); d.className = 'hist'; d.dataset.v = t.verdict;
    d.innerHTML = `<img src="${t.thumb}" alt="Peça ${t.verdict}"><span>${t.verdict === 'aprovado' ? 'Aprovada' : 'Reprovada'}</span>`;
    box.appendChild(d);
  });
}

// ---------- início: abre com uma peça de exemplo ----------
setFormat('feed'); renderThumbs(); renderHistory(); loadSharedFeedback();
(async () => {
  const spec = composeLocal({ idea: '“PROTECT THE ORIGINAL ONE.”', format: 'feed', feedback: state.feedback, seed: 4242 });
  state.spec = spec; state.idea = '“PROTECT THE ORIGINAL ONE.”';
  try { await renderSpec(spec, $('#canvas')); $('#empty').hidden = true; $('#actions').hidden = false; renderEditor(); } catch { /* segue vazio */ }
  msg('studio', 'Escolha o formato, escreva a ideia e toque em <b>Gerar</b>. Exemplo ao lado. Para usar uma frase exata, coloque entre aspas.');
  try { const r = await fetch('api/compose', { method: 'OPTIONS' }); setStatus(r.status === 405 || r.status === 204 || r.ok ? true : false); } catch { setStatus(false); }
})();
