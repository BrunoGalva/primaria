// Efeitos de imagem da PRIMARIA, feitos em canvas puro (rodam no navegador de quem usa).

export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

// recorte tipo "cover" com ponto de foco
export function coverCrop(img, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const c = mkCanvas(w, h);
  const ctx = c.getContext('2d');
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih) * Math.max(1, zoom);
  const dw = iw * s, dh = ih * s;
  const x = -(dw - w) * clamp(fx), y = -(dh - h) * clamp(fy);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, x, y, dw, dh);
  return c;
}

function readRGB(c) {
  return c.getContext('2d').getImageData(0, 0, c.width, c.height);
}
function toGray(id) {
  const d = id.data, n = d.length / 4, L = new Float32Array(n);
  for (let i = 0; i < n; i++) L[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
  return L;
}
function putGray(c, L, dark = [0, 0, 0], light = [255, 255, 255]) {
  const ctx = c.getContext('2d');
  const id = ctx.createImageData(c.width, c.height), d = id.data;
  for (let i = 0; i < L.length; i++) {
    const v = clamp(L[i]);
    d[i * 4] = dark[0] + (light[0] - dark[0]) * v;
    d[i * 4 + 1] = dark[1] + (light[1] - dark[1]) * v;
    d[i * 4 + 2] = dark[2] + (light[2] - dark[2]) * v;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
}
function levels(L, lo, hi, g = 1) {
  const o = new Float32Array(L.length);
  for (let i = 0; i < L.length; i++) o[i] = Math.pow(clamp((L[i] - lo) / (hi - lo)), g);
  return o;
}
function boxBlur(L, w, h, r) {
  r = Math.max(1, Math.round(r));
  const tmp = new Float32Array(L.length), out = new Float32Array(L.length);
  const k = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    let s = 0; const row = y * w;
    for (let x = -r; x <= r; x++) s += L[row + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = s * k;
      s += L[row + Math.min(w - 1, x + r + 1)] - L[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[clamp(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s * k;
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}
function gauss(L, w, h, r) { let o = L; for (let i = 0; i < 3; i++) o = boxBlur(o, w, h, r / 1.8); return o; }
function hblur(L, w, h, r) {
  r = Math.max(1, Math.round(r));
  const out = new Float32Array(L.length), k = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    let s = 0; const row = y * w;
    for (let x = -r; x <= r; x++) s += L[row + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      out[row + x] = s * k;
      s += L[row + Math.min(w - 1, x + r + 1)] - L[row + Math.max(0, x - r)];
    }
  }
  return out;
}
function grain(L, R, amt) {
  for (let i = 0; i < L.length; i++) L[i] = clamp(L[i] + (R() + R() + R() - 1.5) * amt);
  return L;
}
function dust(L, w, h, R, count, dark = true) {
  for (let i = 0; i < count; i++) {
    const x = (R() * w) | 0, y = (R() * h) | 0, r = R() < 0.9 ? 1 : 2;
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
      const X = x + xx, Y = y + yy;
      if (X >= 0 && Y >= 0 && X < w && Y < h) L[Y * w + X] = dark ? L[Y * w + X] * 0.25 : 1;
    }
  }
  const scratches = Math.max(1, (count / 90) | 0);
  for (let i = 0; i < scratches; i++) {
    const x = (R() * w) | 0, y0 = (R() * h) | 0, len = (h * (0.1 + R() * 0.4)) | 0, v = 0.3 + R() * 0.5;
    for (let y = y0; y < Math.min(h, y0 + len); y++) L[y * w + x] = dark ? L[y * w + x] * (1 - v) : clamp(L[y * w + x] + v);
  }
  return L;
}

// ---------------- efeitos ----------------
const FX = {
  grao(c, R, k) {
    const w = c.width, h = c.height;
    let L = levels(toGray(readRGB(c)), 0.06, 0.92, 1.1);
    L = grain(L, R, 0.06 + 0.06 * k);
    dust(L, w, h, R, (w * h) / 1400 * (0.5 + k));
    putGray(c, L, [8, 8, 9], [244, 244, 242]);
  },
  borrado(c, R, k) {
    const w = c.width, h = c.height;
    let L = toGray(readRGB(c));
    L = gauss(L, w, h, (w / 90) * (0.6 + k * 1.6));
    L = levels(L, 0.03, 0.95, 1.05);
    grain(L, R, 0.05);
    putGray(c, L, [10, 10, 11], [242, 242, 240]);
  },
  meio_tom(c, R, k) {
    const w = c.width, h = c.height;
    const cell = Math.max(5, Math.round((w / 110) * (0.7 + k * 1.3)));
    let L = levels(toGray(readRGB(c)), 0.04, 0.96);
    const B = gauss(L, w, h, cell * 0.6);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f5f5f3'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0b0b0b';
    const a = Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
    const diag = Math.hypot(w, h);
    for (let v = -diag; v < diag; v += cell) {
      for (let u = -diag; u < diag; u += cell) {
        const x = w / 2 + u * ca - v * sa, y = h / 2 + u * sa + v * ca;
        if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;
        const sx = clamp(x | 0, 0, w - 1), sy = clamp(y | 0, 0, h - 1);
        const r = Math.sqrt(1 - B[sy * w + sx]) * cell * 0.72;
        if (r > 0.4) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    const id = readRGB(c); let G = toGray(id); grain(G, R, 0.03); putGray(c, G, [0, 0, 0], [255, 255, 255]);
  },
  raio_x(c, R, k) {
    const w = c.width, h = c.height;
    let L = levels(toGray(readRGB(c)), 0.03, 0.97);
    for (let i = 0; i < L.length; i++) L[i] = 1 - L[i];
    L = levels(L, 0.16, 0.98, 1.5);
    const G = gauss(L, w, h, w / 70);
    for (let i = 0; i < L.length; i++) L[i] = clamp(L[i] + G[i] * (0.25 + 0.35 * k));
    L = levels(L, 0.05, 1, 1.2);
    grain(L, R, 0.04);
    putGray(c, L, [4, 5, 7], [246, 247, 248]);
  },
  fotocopia(c, R, k) {
    const w = c.width, h = c.height;
    let L = levels(toGray(readRGB(c)), 0.04, 0.85);
    const N = new Float32Array(L.length); for (let i = 0; i < N.length; i++) N[i] = R() - 0.5;
    const Nb = boxBlur(N, w, h, 1);
    const t = 0.42 + 0.08 * (k - 0.5);
    for (let i = 0; i < L.length; i++) L[i] = L[i] + Nb[i] * 0.35 > t ? 1 : 0;
    dust(L, w, h, R, (w * h) / 700);
    putGray(c, L, [6, 6, 6], [248, 248, 246]);
  },
  movimento(c, R, k) {
    const w = c.width, h = c.height;
    const L0 = levels(toGray(readRGB(c)), 0.02, 0.9);
    const dx = Math.round((w / 60) * (0.6 + k * 1.4));
    const smear = hblur(L0, w, h, dx * 1.6);
    const out = new Float32Array(L0.length);
    for (let i = 0; i < out.length; i++) out[i] = 0.5 * L0[i] + 0.5 * smear[i];
    for (const s of [-2, -1, 1, 2]) {
      const off = s * dx + Math.round((R() - 0.5) * 6);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const sx = clamp(x - off, 0, w - 1);
        out[y * w + x] = out[y * w + x] * 0.86 + L0[y * w + sx] * 0.14;
      }
    }
    for (let y = 0; y < h; y++) { const n = (R() - 0.5) * 0.06; for (let x = 0; x < w; x++) out[y * w + x] = clamp(out[y * w + x] + n); }
    grain(out, R, 0.035);
    putGray(c, out, [10, 10, 11], [240, 240, 238]);
  },
  sepia_papel(c, R, k) {
    const w = c.width, h = c.height;
    const pad = Math.round(Math.min(w, h) * 0.075);
    let L = toGray(readRGB(c));
    L = gauss(L, w, h, (w / 140) * (0.5 + k));
    L = levels(L, 0.02, 0.98, 1.05);
    const N = new Float32Array(L.length); for (let i = 0; i < N.length; i++) N[i] = R() - 0.5;
    const Ns = gauss(N, w, h, 3); let mx = 0; for (let i = 0; i < Ns.length; i++) mx = Math.max(mx, Math.abs(Ns[i]));
    const ctx = c.getContext('2d'); const id = ctx.createImageData(w, h), d = id.data;
    const dark = [38, 34, 30], light = [214, 200, 176], paper = [236, 230, 219];
    const x0 = pad, y0 = pad, x1 = w - pad, y1 = h - pad;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, n = Ns[i] / (mx || 1);
      const dist = Math.min(x - x0, x1 - x, y - y0, y1 - y) + n * 7;
      let r, g, b;
      if (dist < 0) { r = paper[0]; g = paper[1]; b = paper[2]; }
      else {
        const v = clamp(L[i]);
        r = dark[0] + (light[0] - dark[0]) * v; g = dark[1] + (light[1] - dark[1]) * v; b = dark[2] + (light[2] - dark[2]) * v;
        const band = clamp(1 - (dist - 2) / (w / 40)) * (0.75 + 0.25 * n);
        r *= 1 - band * 0.85; g *= 1 - band * 0.85; b *= 1 - band * 0.85;
      }
      const f = (R() - 0.5) * 14;
      d[i * 4] = clamp(r + f, 0, 255); d[i * 4 + 1] = clamp(g + f, 0, 255); d[i * 4 + 2] = clamp(b + f, 0, 255); d[i * 4 + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
  },
  vermelho_seletivo(c, R, k) {
    const w = c.width, h = c.height, id = readRGB(c), d = id.data;
    let L = levels(toGray(id), 0.02, 0.75);
    const M = new Float32Array(L.length);
    for (let i = 0; i < M.length; i++) {
      const r = d[i * 4] / 255, g = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255;
      M[i] = r > 0.35 && r > g * 1.7 && r > b * 1.7 ? 1 : 0;
    }
    const Mb = boxBlur(M, w, h, 1);
    grain(L, R, 0.07); dust(L, w, h, R, (w * h) / 2000);
    const ctx = c.getContext('2d'); const o = ctx.createImageData(w, h), od = o.data;
    for (let i = 0; i < L.length; i++) {
      const m = clamp(Mb[i] * 1.4), v = L[i] * 242 + 8;
      od[i * 4] = v * (1 - m) + 204 * m; od[i * 4 + 1] = v * (1 - m) + 20 * m; od[i * 4 + 2] = v * (1 - m) + 16 * m; od[i * 4 + 3] = 255;
    }
    ctx.putImageData(o, 0, 0);
  },
};

export const EFFECT_NAMES = Object.keys(FX);

export function applyEffect(canvas, effect, seed = 1, intensity = 0.5) {
  const f = FX[effect] || FX.grao;
  f(canvas, rng(seed), clamp(intensity));
  return canvas;
}

export function makeLayerImage(img, w, h, { effect = 'grao', focusX = 0.5, focusY = 0.4, zoom = 1, seed = 1, intensity = 0.5 } = {}) {
  // processa em resolução reduzida para ficar rápido e depois o render amplia
  const scale = Math.min(1, 900 / Math.max(w, h));
  const c = coverCrop(img, w * scale, h * scale, focusX, focusY, zoom);
  applyEffect(c, effect, seed, intensity);
  return c;
}
