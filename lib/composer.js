// Compositor local: cria composições novas a partir da ideia, sem depender da IA.
// Também é usado pelo botão "Variar" e como reserva quando a IA não responde.
import { IMAGES, EFFECTS, PHRASES, EVENT, COLORS, ARCHETYPES } from './brand.js';
import { rng } from './effects.js';

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function detectIntent(idea) {
  const t = norm(idea);
  if (/(falta|faltam|contagem|countdown|\bdias?\b|regressiva)/.test(t)) return 'contagem';
  if (/(line ?up|\bdj|musica|som\b|set\b)/.test(t)) return 'lineup';
  if (/(marca|closet|young generation|ygp|curadoria de marcas)/.test(t)) return 'marcas';
  if (/(save the date|endereco|local|onde|horario|info|informac|ingresso|quando)/.test(t)) return 'info';
  if (/(coming soon|em breve|teaser|lancamento|anuncio)/.test(t)) return 'coming';
  return 'conceito';
}

export function extractQuote(idea) {
  const m = (idea || '').match(/["“”'‘’](.+?)["“”'‘’]/);
  return m ? m[1].trim() : null;
}

function weighted(R, entries) {
  const tot = entries.reduce((s, [, w]) => s + w, 0);
  let r = R() * tot;
  for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
  return entries[entries.length - 1][0];
}

// aprendizagem simples: aprovações aumentam o peso, reprovações diminuem
export function learnedWeights(feedback = []) {
  const eff = Object.fromEntries(Object.entries(EFFECTS).map(([k, v]) => [k, v.weight]));
  const arch = Object.fromEntries(Object.keys(ARCHETYPES).map((k) => [k, 2]));
  for (const f of feedback) {
    const d = f.verdict === 'aprovado' ? 1.5 : -2;
    for (const e of f.effects || []) if (e in eff) eff[e] = Math.max(0.15, eff[e] + d);
    if (f.layout in arch) arch[f.layout] = Math.max(0.15, arch[f.layout] + d);
  }
  return { eff, arch };
}

const ARCH_BY_INTENT = {
  coming: ['grade', 'sangrado', 'papel', 'faixa'],
  contagem: ['zeros', 'sangrado', 'faixa', 'recorte'],
  lineup: ['faixa', 'recorte', 'sangrado'],
  marcas: ['recorte', 'painel', 'sangrado'],
  info: ['painel', 'papel', 'recorte'],
  conceito: ['sangrado', 'faixa', 'recorte', 'papel', 'grade', 'zeros'],
};
const KIND_BY_ARCH = { grade: ['rosto'], papel: ['rosto', 'corpo'], faixa: ['corpo'], zeros: ['textura'], painel: ['corpo', 'rosto'], sangrado: ['rosto', 'detalhe', 'corpo'], recorte: ['rosto', 'corpo', 'detalhe'] };
const EFF_BY_ARCH = {
  papel: ['sepia_papel'], zeros: ['grao'], faixa: ['movimento', 'borrado'], grade: ['meio_tom', 'grao'],
  painel: ['fotocopia', 'grao', 'meio_tom'], sangrado: ['raio_x', 'meio_tom', 'vermelho_seletivo', 'grao', 'borrado', 'movimento'],
  recorte: ['meio_tom', 'grao', 'fotocopia', 'raio_x', 'borrado'],
};

function pickImage(R, kinds, effect, chosen) {
  if (chosen) return chosen;
  let pool = IMAGES.filter((i) => kinds.includes(i.kind));
  if (effect === 'vermelho_seletivo') pool = IMAGES.filter((i) => i.red);
  if (!pool.length) pool = IMAGES;
  return pool[Math.floor(R() * pool.length)].id;
}

function content(intent, idea, R) {
  const q = extractQuote(idea);
  const n = (norm(idea).match(/(\d+)\s*dia/) || [])[1];
  switch (intent) {
    case 'coming': return { head: q || 'COMING SOON', sub: EVENT.dataCurta, red: true };
    case 'contagem': return { head: q || (n ? `FALTAM ${n} DIAS` : 'FALTAM 7 DIAS'), sub: `${EVENT.data} — ${EVENT.horario}`, red: true };
    case 'lineup': return { label: 'MÚSICA', list: EVENT.lineup, sub: EVENT.horario, red: true };
    case 'marcas': return { label: 'NA CURADORIA', list: EVENT.marcas, sub: q || 'O QUE É PRIMÁRIO SE RECONHECE.' };
    case 'info': return { info: true };
    default: return { head: q || PHRASES[Math.floor(R() * PHRASES.length)], sub: EVENT.dataCurta, red: R() < 0.5 };
  }
}

function textBlock(c, x, y, w, color, big = 56) {
  const out = [];
  if (c.label) out.push({ type: 'text', text: c.label, x, y, w, size: 18, weight: 700, tracking: 0.2, color });
  if (c.list) out.push({ type: 'text', text: c.list.join('\n'), x, y: y + (c.label ? 0.035 : 0), w, size: big * 0.8, weight: 700, tracking: 0.01, lineHeight: 1.05, color });
  if (c.head) out.push({ type: 'text', text: c.head, x, y, w, size: big, weight: 700, tracking: 0.01, lineHeight: 1.02, color });
  return out;
}
function infoRows(x, y, step) {
  const rows = [['DATA', EVENT.data, true], ['HORÁRIO', EVENT.horario, true], ['LOCAL', `${EVENT.endereco} — ${EVENT.bairro}`, false], ['MARCAS', EVENT.marcas.join(' / '), false], ['MÚSICA', EVENT.lineup.join(' / '), false]];
  const out = [];
  rows.forEach(([k, v, red], i) => {
    out.push({ type: 'text', text: k, x, y: y + i * step + 0.004, w: 0.22, size: 14, weight: 700, tracking: 0.2, color: COLORS.preto });
    out.push({ type: 'text', text: v, x: x + 0.24, y: y + i * step, w: 0.66, size: 22, weight: red ? 700 : 400, tracking: 0.08, color: red ? COLORS.vermelho : COLORS.preto });
  });
  return out;
}

export function composeLocal({ idea = '', format = 'feed', image = null, feedback = [], seed = Date.now() % 100000 }) {
  const R = rng(seed);
  const intent = detectIntent(idea);
  const { eff: we, arch: wa } = learnedWeights(feedback);
  const archs = ARCH_BY_INTENT[intent];
  const layout = weighted(R, archs.map((a) => [a, wa[a] ?? 1]));
  const effOptions = EFF_BY_ARCH[layout].filter((e) => e !== 'vermelho_seletivo' || !image || IMAGES.find((i) => i.id === image)?.red);
  const effect = weighted(R, effOptions.map((e) => [e, we[e] ?? 1]));
  const img = pickImage(R, KIND_BY_ARCH[layout], effect, image);
  const c = content(intent, idea, R);
  const story = format === 'story';
  const W = COLORS.branco, K = COLORS.preto, RED = COLORS.vermelho;
  const L = [];
  let bg = W;
  const jit = (v, a = 0.03) => v + (R() - 0.5) * a;

  if (layout === 'sangrado') {
    bg = K;
    L.push({ type: 'image', image: img, effect, x: 0, y: 0, w: 1, h: 1, focusY: 0.35, intensity: 0.4 + R() * 0.5 });
    const top = R() < 0.5;
    const ty = top ? 0.06 : (story ? 0.8 : 0.76);
    if (c.info) L.push(...infoRows(0.06, ty - (top ? 0 : 0.12), 0.05));
    else {
      L.push(...textBlock(c, 0.06, ty, 0.7, W, c.list ? 44 : 48));
      if (c.sub) L.push({ type: 'text', text: c.sub, x: 0.06, y: ty + (c.list ? 0.2 : 0.1), w: 0.6, size: 22, weight: 700, tracking: 0.12, color: c.red ? RED : W });
    }
    L.push({ type: 'logo', variant: 'degrau', tone: 'auto', x: top ? 0.62 : 0.06, y: top ? (story ? 0.93 : 0.91) : 0.05, w: 0.32 });
  } else if (layout === 'papel') {
    L.push({ type: 'image', image: img, effect: 'sepia_papel', x: 0, y: 0, w: 1, h: 1, focusY: 0.3, intensity: 0.5 + R() * 0.4 });
    L.push({ type: 'logo', variant: 'degrau', tone: 'branco', x: 0.2, y: story ? 0.18 : 0.16, w: 0.6 });
    const by = story ? 0.66 : 0.64;
    L.push({ type: 'text', text: `${EVENT.endereco}\n${EVENT.bairro}`, x: 0.16, y: by, w: 0.48, size: 17, weight: 700, tracking: 0.12, lineHeight: 1.6, color: W });
    L.push({ type: 'text', text: `${EVENT.dataCurta.replace('.', '/')}\n${EVENT.horario}`, x: 0.64, y: by, w: 0.22, size: 17, weight: 700, tracking: 0.12, lineHeight: 1.6, align: 'center', color: W });
    const phrase = c.head && c.head !== 'COMING SOON' ? c.head : EVENT.descritor;
    L.push({ type: 'text', text: phrase, x: 0.2, y: by + (story ? 0.08 : 0.1), w: 0.6, size: 15, weight: 700, tracking: 0.12, lineHeight: 1.6, align: 'center', color: W });
  } else if (layout === 'grade') {
    const cols = 4, rows = story ? 6 : 4;
    const empty = new Set();
    while (empty.size < (story ? 5 : 3)) empty.add(1 + Math.floor(R() * (cols * rows - 1)));
    const gy = story ? 0.1 : 0.09, gh = story ? 0.86 : 0.88;
    L.push({ type: 'grid', x: 0.04, y: gy, w: 0.92, h: gh, cols, rows, gap: 0.012, empty: [...empty], effects: ['meio_tom', 'grao', 'grao'], images: IMAGES.filter((i) => i.kind === 'rosto').map((i) => i.id).sort(() => R() - 0.5) });
    L.push({ type: 'logo', variant: 'degrau', tone: 'preto', x: 0.04, y: 0.02, w: 0.4 });
    const cells = [...empty].sort((a, b) => a - b);
    const cw = 0.92 / cols, ch = gh / rows;
    const put = (idx, t) => {
      const col = idx % cols, row = Math.floor(idx / cols);
      L.push({ ...t, x: 0.04 + col * cw + 0.015, y: gy + row * ch + ch * 0.35, w: cw - 0.03 });
    };
    put(cells[0], { type: 'text', text: c.head || c.label || 'COMING SOON', size: 22, weight: 700, tracking: 0.12, color: K });
    if (cells[1] !== undefined) put(cells[1], { type: 'text', text: c.sub || EVENT.dataCurta, size: 34, weight: 700, tracking: 0.04, color: RED });
    if (cells[2] !== undefined) put(cells[2], { type: 'text', text: EVENT.tagline, size: 13, weight: 400, tracking: 0.16, lineHeight: 1.5, color: K });
  } else if (layout === 'painel') {
    const ih = story ? 0.56 : 0.55;
    L.push({ type: 'image', image: img, effect, x: 0, y: 0, w: 1, h: ih, focusY: 0.25, intensity: 0.5 });
    L.push({ type: 'logo', variant: R() < 0.5 ? 'degrau' : 'linear_00000', tone: 'preto', x: 0.06, y: ih + 0.035, w: 0.62 });
    if (c.info || !c.list) L.push(...infoRows(0.06, ih + (story ? 0.12 : 0.16), story ? 0.045 : 0.052));
    else L.push(...textBlock(c, 0.06, ih + 0.17, 0.85, K, 40));
  } else if (layout === 'faixa') {
    L.push({ type: 'image', image: img, effect, x: 0, y: 0, w: 1, h: 1, focusY: 0.3, intensity: 0.5 + R() * 0.4 });
    const by = jit(story ? 0.42 : 0.4, 0.1);
    L.push({ type: 'rect', x: 0, y: by, w: 1, h: c.list ? 0.26 : 0.16, color: W, opacity: 0.92 });
    if (c.list) {
      L.push({ type: 'text', text: c.label, x: 0.06, y: by + 0.025, w: 0.5, size: 16, weight: 700, tracking: 0.2, color: K });
      L.push({ type: 'text', text: c.list.join('   '), x: 0.06, y: by + 0.07, w: 0.88, size: 40, weight: 700, tracking: 0.02, color: K });
      L.push({ type: 'text', text: c.sub || EVENT.horario, x: 0.06, y: by + 0.18, w: 0.6, size: 20, weight: 700, tracking: 0.12, color: RED });
    } else {
      L.push({ type: 'text', text: c.head, x: 0.06, y: by + 0.035, w: 0.88, size: 44, weight: 700, tracking: 0.01, align: 'center', color: K });
      L.push({ type: 'text', text: c.sub || EVENT.dataCurta, x: 0.06, y: by + (story ? 0.085 : 0.105), w: 0.88, size: 18, weight: 700, tracking: 0.2, align: 'center', color: RED });
    }
    L.push({ type: 'logo', variant: 'degrau', tone: 'auto', x: 0.33, y: story ? 0.92 : 0.9, w: 0.34 });
  } else if (layout === 'zeros') {
    bg = K;
    L.push({ type: 'image', image: IMAGES.find((i) => i.kind === 'textura' && !i.red)?.id || img, effect: 'grao', x: 0, y: 0, w: 1, h: 1, focusY: 0.6, intensity: 0.6 });
    L.push({ type: 'logo', variant: 'degrau', tone: 'branco', x: 0.06, y: 0.05, w: 0.34 });
    L.push({ type: 'zeros', x: 0.035, y: story ? 0.42 : 0.38, w: 0.96, size: 148, weight: 400, tracking: -0.02, color: W });
    L.push({ type: 'text', text: c.head || 'ANTES DA PRIMEIRA CÓPIA.', x: 0.045, y: 0.52, w: 0.9, size: intent === 'contagem' ? 64 : 26, weight: 700, tracking: intent === 'contagem' ? 0.01 : 0.12, color: W });
    L.push({ type: 'text', text: c.sub || EVENT.dataCurta, x: 0.045, y: story ? 0.9 : 0.9, w: 0.6, size: 20, weight: 700, tracking: 0.16, color: RED });
  } else { // recorte
    const vertical = R() < 0.5 || story;
    if (vertical) {
      const ih = story ? 0.62 : 0.6;
      L.push({ type: 'image', image: img, effect, x: 0, y: 0, w: 1, h: ih, focusY: 0.3, intensity: 0.5 });
      if (c.info) L.push(...infoRows(0.06, ih + 0.06, 0.05));
      else L.push(...textBlock(c, 0.06, ih + 0.05, 0.86, K, 52));
      if (c.sub) L.push({ type: 'text', text: c.sub, x: 0.06, y: story ? 0.88 : 0.9, w: 0.5, size: 20, weight: 700, tracking: 0.14, color: c.red ? RED : K });
      L.push({ type: 'logo', variant: 'degrau', tone: 'preto', x: 0.62, y: story ? 0.93 : 0.92, w: 0.32 });
    } else {
      L.push({ type: 'image', image: img, effect, x: 0.5, y: 0, w: 0.5, h: 1, focusX: 0.5, focusY: 0.3, intensity: 0.5 });
      L.push({ type: 'logo', variant: 'degrau', tone: 'preto', x: 0.05, y: 0.06, w: 0.4 });
      if (c.info) L.push(...infoRows(0.05, 0.5, 0.06).map((t) => ({ ...t, w: Math.min(t.w, 0.2) })));
      else L.push(...textBlock(c, 0.05, 0.62, 0.4, K, 40));
      if (c.sub) L.push({ type: 'text', text: c.sub, x: 0.05, y: 0.9, w: 0.4, size: 20, weight: 700, tracking: 0.14, color: c.red ? RED : K });
    }
  }
  return {
    format, layout, background: bg, seed, layers: L,
    caption: '',
    rationale: `Composição ${layout} com ${EFFECTS[effect]?.label?.toLowerCase() || effect} (modo local).`,
  };
}

export function summarize(spec) {
  const effects = [...new Set((spec.layers || []).flatMap((l) => (l.effect ? [l.effect] : l.effects || [])))];
  const logo = (spec.layers || []).find((l) => l.type === 'logo');
  const texts = (spec.layers || []).filter((l) => l.type === 'text').map((l) => l.text).join(' | ').slice(0, 160);
  return { layout: spec.layout, effects, logo: logo ? `${logo.variant}/${logo.tone}` : 'sem logo', format: spec.format, texts };
}
