// Desenha uma composição (spec JSON) num canvas, aplicando as regras de marca automaticamente.
import { COLORS, FONT, FORMATS, LOGOS, IMAGES, EVENT } from './brand.js';
import { makeLayerImage } from './effects.js';

const cache = new Map();
export function loadImage(src) {
  if (!cache.has(src)) {
    cache.set(src, new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('Não consegui carregar ' + src));
      im.src = src;
    }));
  }
  return cache.get(src);
}

// imagens enviadas pela pessoa (upload) ficam aqui: id -> dataURL
export const USER_IMAGES = new Map();
export function imageSrc(id) {
  if (USER_IMAGES.has(id)) return USER_IMAGES.get(id);
  const im = IMAGES.find((i) => i.id === id) || IMAGES[0];
  return im.file;
}

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const relLum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => { const la = relLum(a), lb = relLum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
const BRAND_HEX = Object.values(COLORS);

function sampleMean(ctx, x, y, w, h) {
  x = Math.max(0, Math.round(x)); y = Math.max(0, Math.round(y));
  w = Math.max(1, Math.min(ctx.canvas.width - x, Math.round(w))); h = Math.max(1, Math.min(ctx.canvas.height - y, Math.round(h)));
  const d = ctx.getImageData(x, y, w, h).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  return [r / n, g / n, b / n];
}

function tracked(ctx, s, trackPx) {
  let w = 0; for (const ch of s) w += ctx.measureText(ch).width + trackPx;
  return w - trackPx;
}
function drawTracked(ctx, s, x, y, trackPx) {
  for (const ch of s) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + trackPx; }
}
function wrap(ctx, text, maxW, trackPx) {
  const out = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(/\s+/).filter(Boolean); let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (tracked(ctx, test, trackPx) > maxW && line) { out.push(line); line = w; } else line = test;
    }
    out.push(line);
  }
  return out;
}

function pickColor(requested, bg, size) {
  const want = BRAND_HEX.includes((requested || '').toLowerCase()) ? requested.toLowerCase() : COLORS.preto;
  const need = size >= 28 ? 3 : 4.5;
  if (contrast(hex(want), bg) >= need) return { color: want, fixed: false };
  const alt = contrast(hex(COLORS.branco), bg) >= contrast(hex(COLORS.preto), bg) ? COLORS.branco : COLORS.preto;
  return { color: alt, fixed: true };
}

export async function renderSpec(spec, canvas) {
  const fmt = FORMATS[spec.format] || FORMATS.feed;
  const W = fmt.w, H = fmt.h;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const notes = [];
  ctx.fillStyle = BRAND_HEX.includes((spec.background || '').toLowerCase()) ? spec.background : COLORS.branco;
  ctx.fillRect(0, 0, W, H);
  const seed0 = spec.seed || 7;
  let li = 0;
  for (const L of spec.layers || []) {
    li++;
    const x = (L.x ?? 0) * W, y = (L.y ?? 0) * H, w = (L.w ?? 1) * W, h = (L.h ?? 1) * H;
    ctx.save();
    ctx.globalAlpha = clamp(L.opacity ?? 1);
    if (L.type === 'rect') {
      ctx.fillStyle = BRAND_HEX.includes((L.color || '').toLowerCase()) ? L.color : COLORS.branco;
      ctx.fillRect(x, y, w, h);
    } else if (L.type === 'image') {
      const img = await loadImage(imageSrc(L.image));
      const polaroid = L.frame === 'polaroid';
      const b = polaroid ? Math.round(w * 0.035) : 0;
      if (polaroid) {
        ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h); ctx.shadowColor = 'transparent';
      }
      const lc = makeLayerImage(img, w - 2 * b, h - 2 * b - (polaroid ? b * 2 : 0), {
        effect: L.effect, focusX: L.focusX ?? 0.5, focusY: L.focusY ?? 0.4, zoom: L.zoom ?? 1, seed: seed0 + li * 13, intensity: L.intensity ?? 0.5,
      });
      ctx.drawImage(lc, x + b, y + b, w - 2 * b, h - 2 * b - (polaroid ? b * 2 : 0));
    } else if (L.type === 'grid') {
      const cols = L.cols || 3, rows = L.rows || 3, gap = (L.gap ?? 0.012) * W;
      const cw = (w - gap * (cols - 1)) / cols, ch = (h - gap * (rows - 1)) / rows;
      const ims = (L.images && L.images.length ? L.images : IMAGES.filter((i) => i.kind === 'rosto').map((i) => i.id));
      const empty = new Set(L.empty || []);
      const effects = L.effects && L.effects.length ? L.effects : [L.effect || 'meio_tom'];
      let k = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (empty.has(idx)) continue;
        const id = ims[k % ims.length]; const eff = effects[k % effects.length]; k++;
        const img = await loadImage(imageSrc(id));
        const lc = makeLayerImage(img, cw, ch, { effect: eff, focusY: 0.35, seed: seed0 + idx * 31, intensity: L.intensity ?? 0.5, zoom: 1 + ((idx * 7) % 3) * 0.15 });
        ctx.drawImage(lc, x + c * (cw + gap), y + r * (ch + gap), cw, ch);
      }
    } else if (L.type === 'text' || L.type === 'zeros') {
      const text = String(L.type === 'zeros' ? EVENT.zeros : L.text || '').toUpperCase();
      const size = (L.size || 24) * (W / 1080);
      const weight = L.weight >= 600 ? 700 : 400;
      ctx.font = `${weight} ${size}px ${FONT}`;
      ctx.textBaseline = 'top';
      const track = (L.tracking ?? (size < 30 ? 0.12 : 0.02)) * size;
      const lh = (L.lineHeight ?? 1.25) * size;
      const tx = clamp(x, W * 0.04, W * 0.96), ty = clamp(y, H * 0.03, H * 0.97);
      const maxW = Math.min(w, W - tx - W * 0.04);
      const lines = wrap(ctx, text, maxW, track);
      const blockH = lines.length * lh;
      let bg = L.label && BRAND_HEX.includes(L.label.toLowerCase()) ? hex(L.label) : sampleMean(ctx, tx, ty, maxW, blockH);
      const { color, fixed } = pickColor(L.color, bg, size);
      if (fixed) notes.push(`Cor do texto "${text.slice(0, 24)}…" ajustada para contraste.`);
      lines.forEach((line, i) => {
        const lw = tracked(ctx, line, track);
        const lx = L.align === 'center' ? tx + (maxW - lw) / 2 : L.align === 'right' ? tx + maxW - lw : tx;
        const ly = ty + i * lh;
        if (L.label) {
          const p = size * 0.35;
          ctx.fillStyle = L.label; ctx.fillRect(lx - p, ly - p * 0.7, lw + 2 * p, size + p * 1.4);
        }
        ctx.fillStyle = color;
        drawTracked(ctx, line, lx, ly, track);
      });
    } else if (L.type === 'logo') {
      const variant = L.variant || 'degrau';
      const lw = clamp(L.w ?? 0.5, 0.15, 0.92) * W;
      const probe = LOGOS.find((l) => l.variant === variant) || LOGOS[0];
      const lh = lw / probe.ratio;
      const lx = clamp(x, W * 0.04, W - lw - W * 0.04), ly = clamp(y, H * 0.03, H - lh - H * 0.03);
      const bgm = sampleMean(ctx, lx, ly, lw, lh);
      const lum = relLum(bgm);
      let tone = L.tone || 'auto';
      const autoTone = lum > 0.35 ? 'preto' : 'branco';
      if (tone === 'auto') tone = autoTone;
      else if (tone === 'preto' && lum < 0.35) { tone = 'branco'; notes.push('Logo trocado para branco: o fundo ali é escuro.'); }
      else if (tone === 'branco' && lum > 0.45) { tone = 'preto'; notes.push('Logo trocado para preto: o fundo ali é claro.'); }
      else if (tone === 'vermelho' && lum < 0.55) { tone = autoTone; notes.push('Logo vermelho só vai sobre fundo claro; troquei pela versão de contraste.'); }
      const logo = LOGOS.find((l) => l.variant === variant && l.tone === tone) || LOGOS[0];
      const im = await loadImage(logo.file);
      ctx.drawImage(im, lx, ly, lw, lw / logo.ratio);
    }
    ctx.restore();
  }
  return { notes };
}
