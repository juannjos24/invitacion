/* ============================================================
   sticker.js — Generador de stickers animados de WhatsApp
   Invitación "DIOS NO DESISTE"

   1. Dibuja la animación (sobre → toques → sello roto → solapa →
      flyer) en un canvas de 512×512, fotograma a fotograma.
   2. Codifica cada fotograma con canvas.toBlob('image/webp') y
      solo la zona que cambió respecto al anterior.
   3. Arma el contenedor WebP animado (RIFF/VP8X/ANIM/ANMF) a mano.
   Sin librerías. Necesita un navegador que codifique WebP (Chrome,
   Edge, Brave, Opera).
   ============================================================ */
'use strict';

/* ---------- Parámetros ---------- */
const SIZE = 512;                 // tamaño exigido por WhatsApp
const MAX_BYTES = 500 * 1000;     // límite de WhatsApp para stickers animados
const TOTAL = 4.4;                // duración en segundos (máximo permitido: 10)
const HOLD_QUALITY = 0.82;        // calidad del fotograma final (el que se queda en pantalla)
const HOLD_MS = 300;              // un fotograma que dura más que esto se considera "fijo"

const C = {
  gold: '#f5b800', gold2: '#ffd95a', gold3: '#9a6d00',
  paper: '#f4e7c9', paper2: '#e8d5a8', paper3: '#d6bd86', ink: '#2b1e07',
};

// Sobre (en px del canvas de 512)
const ENV = { w: 330, h: 220, cx: 256, cy: 300, flap: 128 };
const L = ENV.cx - ENV.w / 2, R = ENV.cx + ENV.w / 2;
const T = ENV.cy - ENV.h / 2, B = ENV.cy + ENV.h / 2;
const SEAL = { x: ENV.cx, y: T + ENV.flap - 22, r: 30 };
const FLYER_IN_W = 250;           // ancho del flyer dentro del sobre
const FLYER_FINAL_H = 500;        // alto final del flyer

// Línea de tiempo (segundos)
const TL = {
  taps: [0.25, 0.60, 0.95],
  shatter: 1.05,
  flap: [1.30, 1.85],
  rise: [1.85, 2.60],     // el flyer sube…
  grow: [2.05, 2.75],     // …y mientras tanto crece
  envOut: [2.25, 2.70],   // el sobre cae y se desvanece
};

/* ---------- Utilidades matemáticas ---------- */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (c1, c2, t) => {
  const a = hex(c1), b = hex(c2);
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
};

/* ---------- Dibujo del sobre ---------- */
function poly(ctx, pts, fill, stroke = C.gold3, width = 1.5) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.stroke(); }
}

function drawShadow(ctx) {
  ctx.save();
  ctx.filter = 'blur(10px)';
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath();
  ctx.ellipse(ENV.cx, B + 8, ENV.w / 2 - 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBack(ctx, flapCos) {
  poly(ctx, [[L, T], [R, T], [R, B], [L, B]], C.paper2);
  if (flapCos < 0) {                       // solapa abierta: queda detrás
    const apex = T + ENV.flap * flapCos;
    poly(ctx, [[L, T], [R, T], [ENV.cx, apex]], mix(C.paper3, C.paper2, Math.min(1, -flapCos)));
  }
}

function drawFront(ctx, flapCos) {
  const cy = T + ENV.h * 0.56;
  poly(ctx, [[L, T], [L, B], [ENV.cx, cy]], C.paper2);
  poly(ctx, [[R, T], [R, B], [ENV.cx, cy]], C.paper2);
  poly(ctx, [[L, B], [R, B], [ENV.cx, cy]], C.paper);
  if (flapCos >= 0) {                      // solapa cerrada o girando: delante
    const apex = T + ENV.flap * flapCos;
    poly(ctx, [[L, T], [R, T], [ENV.cx, apex]], mix(C.paper3, C.paper, flapCos));
  }
}

function drawSeal(ctx, cracks) {
  const { x, y, r } = SEAL;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = C.gold; ctx.fill(); ctx.strokeStyle = C.gold3; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, Math.PI * 2); ctx.lineWidth = 1.5; ctx.stroke();
  // corazón
  const hr = r * 0.26;
  ctx.fillStyle = C.gold3;
  ctx.beginPath();
  ctx.arc(x - hr * 0.55, y - hr * 0.35, hr * 0.6, 0, Math.PI * 2);
  ctx.arc(x + hr * 0.55, y - hr * 0.35, hr * 0.6, 0, Math.PI * 2);
  ctx.fill();
  poly(ctx, [[x - hr * 1.12, y - hr * 0.1], [x + hr * 1.12, y - hr * 0.1], [x, y + hr * 1.25]], C.gold3, null);
  // brillo
  ctx.beginPath(); ctx.arc(x - r * 0.45, y - r * 0.45, r * 0.13, 0, Math.PI * 2); ctx.fillStyle = C.gold2; ctx.fill();
  // grietas
  const angles = [205, 325, 80, 150, 20];
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < Math.min(cracks, angles.length); i++) {
    const a = angles[i] * Math.PI / 180;
    ctx.beginPath(); ctx.moveTo(x, y);
    [0.35, 0.7, 1.0].forEach((f, k) => {
      const wob = (k % 2 ? -0.12 : 0.12) * r;
      ctx.lineTo(x + Math.cos(a) * r * f - Math.sin(a) * wob, y + Math.sin(a) * r * f + Math.cos(a) * wob);
    });
    ctx.stroke();
  }
}

function drawRipple(ctx, p) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.strokeStyle = C.gold2; ctx.lineWidth = lerp(6, 2, p);
  ctx.beginPath(); ctx.arc(SEAL.x, SEAL.y, lerp(SEAL.r, SEAL.r + 70, easeOut(p)), 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawPieces(ctx, p) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.fillStyle = C.gold;
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 + 15) * Math.PI / 180;
    const dist = lerp(SEAL.r * 0.6, SEAL.r * 3.2, easeOut(p));
    const cx = SEAL.x + Math.cos(a) * dist;
    const cy = SEAL.y + Math.sin(a) * dist + 60 * p * p;      // un poco de gravedad
    const s = SEAL.r * 0.32 * (1 - p * 0.5);
    const rot = a + p * 4;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const px = cx + Math.cos(rot + k * 2.1) * s, py = cy + Math.sin(rot + k * 2.1) * s;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/** Flyer con esquinas redondeadas, borde dorado y sombra. */
function drawFlyer(ctx, img, cx, top, w, h) {
  const x = cx - w / 2, radius = 14, border = 3;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = C.gold;
  ctx.beginPath(); ctx.roundRect(x, top, w, h, radius); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x + border, top + border, w - 2 * border, h - 2 * border, radius - border); ctx.clip();
  ctx.drawImage(img, x + border, top + border, w - 2 * border, h - 2 * border);
  ctx.restore();
}

/* ---------- Un fotograma ---------- */
function renderFrame(ctx, scratch, t, flyer) {
  const ratio = flyer.width / flyer.height;
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Estado
  let scale = 1, cracks = 0, ripple = 0;
  TL.taps.forEach((tt, i) => {
    if (t >= tt) {
      cracks = i + 1;
      scale = Math.min(scale, 1 - 0.05 * Math.sin(Math.PI * prog(t, tt, tt + 0.14)));
      ripple = prog(t, tt, tt + 0.4);
    }
  });
  const shatter = prog(t, TL.shatter, TL.shatter + 0.4);
  const envOut = easeInOut(prog(t, TL.envOut[0], TL.envOut[1]));
  const envAlpha = 1 - envOut;
  const dy = 160 * envOut;
  const flapCos = Math.cos(Math.PI * easeInOut(prog(t, TL.flap[0], TL.flap[1])));   // 1 cerrada … -1 abierta
  const rise = easeOut(prog(t, TL.rise[0], TL.rise[1]));
  const grow = easeInOut(prog(t, TL.grow[0], TL.grow[1]));

  // Flyer: tamaño y posición (coordenadas absolutas, no se mueve con el sobre)
  const inW = FLYER_IN_W, inH = inW / ratio;
  const finH = FLYER_FINAL_H, finW = finH * ratio;
  const curW = lerp(inW, finW, grow), curH = lerp(inH, finH, grow);
  const topIn = lerp(T + 40, 40, rise);
  const curTop = lerp(topIn, (SIZE - finH) / 2, grow);

  const g = scratch.getContext('2d');
  const group = (draw) => {              // dibuja una parte del sobre con su escala/caída y la compone desvanecida
    g.clearRect(0, 0, SIZE, SIZE);
    g.save();
    g.translate(ENV.cx, ENV.cy + dy); g.scale(scale, scale); g.translate(-ENV.cx, -ENV.cy);
    draw(g);
    g.restore();
    ctx.globalAlpha = envAlpha; ctx.drawImage(scratch, 0, 0); ctx.globalAlpha = 1;
  };

  if (envAlpha > 0) {
    group((g) => { drawShadow(g); drawBack(g, flapCos); });
    ctx.save();                                   // el flyer no se ve por debajo del borde inferior del sobre
    ctx.beginPath(); ctx.rect(0, 0, SIZE, B - 6 + dy); ctx.clip();
    drawFlyer(ctx, flyer, ENV.cx, curTop, curW, curH);
    ctx.restore();
    group((g) => {
      drawFront(g, flapCos);
      if (t < TL.shatter) drawSeal(g, cracks);
      drawPieces(g, shatter);
      drawRipple(g, ripple);
    });
  } else {
    drawFlyer(ctx, flyer, ENV.cx, curTop, curW, curH);   // sobre ya desaparecido: flyer libre
  }
}

/* ---------- Preparar el flyer (recorte centrado a 2:3 aprox.) ---------- */
function prepareFlyer(img) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  let ratio = clamp(iw / ih, 0.55, 0.8);
  let sw = iw, sh = ih, sx = 0, sy = 0;
  if (sw / sh > ratio) { const nw = sh * ratio; sx = (sw - nw) / 2; sw = nw; }
  else { const nh = sw / ratio; sy = (sh - nh) / 2; sh = nh; }
  const h = FLYER_FINAL_H * 2, w = Math.round(h * ratio);     // 2x para que se vea nítido al escalar
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  return c;
}

/* ---------- Render completo → fotogramas con zona cambiada ---------- */
async function renderAll(flyer, fps, previewCtx, onProgress) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = SIZE;
  const scratch = document.createElement('canvas'); scratch.width = scratch.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const n = Math.round(TOTAL * fps);
  const dur = Math.round(1000 / fps);
  const frames = [];                 // { data: ImageData, rect: [x,y,w,h], duration }
  let prev = null;
  for (let i = 0; i < n; i++) {
    renderFrame(ctx, scratch, i / fps, flyer);
    const data = ctx.getImageData(0, 0, SIZE, SIZE);
    const rect = prev ? diffRect(prev, data) : [0, 0, SIZE, SIZE];
    if (!rect) frames[frames.length - 1].duration += dur;       // fotograma idéntico: alarga el anterior
    else frames.push({ data, rect, duration: dur });
    prev = data;
    if (previewCtx && i % 2 === 0) { previewCtx.clearRect(0, 0, SIZE, SIZE); previewCtx.drawImage(canvas, 0, 0); }
    onProgress?.(`Fotograma ${i + 1}/${n}`);
    if (i % 4 === 0) await new Promise(requestAnimationFrame);
  }
  return frames;
}

/** Rectángulo (x,y,w,h, con x,y pares) que contiene todos los píxeles distintos; null si no hay cambios. */
function diffRect(a, b) {
  const pa = new Uint32Array(a.data.buffer), pb = new Uint32Array(b.data.buffer);
  let x0 = SIZE, y0 = SIZE, x1 = -1, y1 = -1;
  for (let y = 0; y < SIZE; y++) {
    const row = y * SIZE;
    for (let x = 0; x < SIZE; x++) {
      if (pa[row + x] !== pb[row + x]) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  x0 &= ~1; y0 &= ~1;                                   // ANMF guarda x/2 e y/2
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}

/* ---------- Codificación WebP ---------- */
function encodeRegion(frame, quality) {
  const [x, y, w, h] = frame.rect;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').putImageData(frame.data, -x, -y);
  return new Promise((resolve, reject) => {
    c.toBlob((blob) => {
      if (!blob || blob.type !== 'image/webp') return reject(new Error('El navegador no codifica WebP'));
      blob.arrayBuffer().then(resolve, reject);
    }, 'image/webp', quality);
  });
}

const fourcc = (u8, o) => String.fromCharCode(u8[o], u8[o + 1], u8[o + 2], u8[o + 3]);
function u32(b, o, v) { b[o] = v & 255; b[o + 1] = (v >> 8) & 255; b[o + 2] = (v >> 16) & 255; b[o + 3] = (v >>> 24) & 255; }
function u24(b, o, v) { b[o] = v & 255; b[o + 1] = (v >> 8) & 255; b[o + 2] = (v >> 16) & 255; }
function u16(b, o, v) { b[o] = v & 255; b[o + 1] = (v >> 8) & 255; }
function tag(b, o, s) { for (let i = 0; i < 4; i++) b[o + i] = s.charCodeAt(i); }

/** Extrae los chunks de imagen (ALPH, VP8 / VP8L) de un WebP de un solo fotograma. */
function imageChunks(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  if (fourcc(u8, 0) !== 'RIFF' || fourcc(u8, 8) !== 'WEBP') throw new Error('WebP inválido');
  const out = []; let off = 12;
  while (off + 8 <= u8.length) {
    const id = fourcc(u8, off), size = dv.getUint32(off + 4, true);
    if (id === 'ALPH' || id === 'VP8 ' || id === 'VP8L') {
      const padded = size + (size & 1);
      const chunk = new Uint8Array(8 + padded);
      chunk.set(u8.subarray(off, off + 8 + Math.min(size, u8.length - off - 8)));
      out.push(chunk);
    }
    off += 8 + size + (size & 1);
  }
  if (!out.length) throw new Error('WebP sin datos de imagen');
  return out;
}

/** Arma el WebP animado: RIFF + VP8X + ANIM + ANMF por fotograma. */
function muxAnimated(encoded) {
  // encoded: [{ rect, duration, chunks: Uint8Array[] }]
  const anmfs = encoded.map((f) => {
    const payload = 16 + f.chunks.reduce((s, c) => s + c.length, 0);
    const b = new Uint8Array(8 + payload);
    tag(b, 0, 'ANMF'); u32(b, 4, payload);
    u24(b, 8, f.rect[0] / 2); u24(b, 11, f.rect[1] / 2);
    u24(b, 14, f.rect[2] - 1); u24(b, 17, f.rect[3] - 1);
    u24(b, 20, f.duration);
    b[23] = 0x02;                       // sin mezcla (reemplaza la zona), sin "dispose"
    let o = 24;
    f.chunks.forEach((c) => { b.set(c, o); o += c.length; });
    return b;
  });
  const bodyLen = 18 + 14 + anmfs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(12 + bodyLen);
  tag(out, 0, 'RIFF'); u32(out, 4, 4 + bodyLen); tag(out, 8, 'WEBP');
  let o = 12;
  tag(out, o, 'VP8X'); u32(out, o + 4, 10); out[o + 8] = 0x10 | 0x02;      // alpha + animación
  u24(out, o + 12, SIZE - 1); u24(out, o + 15, SIZE - 1); o += 18;
  tag(out, o, 'ANIM'); u32(out, o + 4, 6); u32(out, o + 8, 0); u16(out, o + 12, 0); o += 14;   // fondo transparente, bucle infinito
  anmfs.forEach((a) => { out.set(a, o); o += a.length; });
  return out;
}

async function encodeAll(frames, quality, onProgress) {
  const encoded = [];
  for (let i = 0; i < frames.length; i++) {
    const q = frames[i].duration >= HOLD_MS ? Math.max(quality, HOLD_QUALITY) : quality;
    const buf = await encodeRegion(frames[i], q);
    encoded.push({ rect: frames[i].rect, duration: frames[i].duration, chunks: imageChunks(buf) });
    onProgress?.(`Codificando ${i + 1}/${frames.length} (calidad ${Math.round(quality * 100)})`);
  }
  return muxAnimated(encoded);
}

/* ---------- Generar un sticker (ajusta calidad y fps hasta < 500 KB) ---------- */
async function makeSticker(flyer, { fps, quality }, previewCtx, onProgress) {
  const qualities = [0.65, 0.5, 0.4, 0.3].filter((q) => q <= quality + 1e-9);
  const fpsList = [fps, 12, 10].filter((v, i, a) => a.indexOf(v) === i && v <= fps);
  let best = null;
  for (const f of fpsList) {
    const frames = await renderAll(flyer, f, previewCtx, onProgress);
    for (const q of qualities) {
      const bytes = await encodeAll(frames, q, onProgress);
      if (!best || bytes.length < best.bytes.length) best = { bytes, fps: f, quality: q };
      if (bytes.length <= MAX_BYTES) return { ...best, ok: true };
    }
  }
  return { ...best, ok: false };
}

/* ---------- Interfaz ---------- */
const $ = (s) => document.querySelector(s);
const results = $('#results'), previewWrap = $('#previewWrap'), progress = $('#progress');
const previewCtx = $('#preview').getContext('2d');
const items = [];           // { name, blob, el }
let busy = false, queue = [];

function supportsWebP() {
  try { return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp'); }
  catch { return false; }
}
if (!supportsWebP()) $('#support').hidden = false;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

function addItem(name) {
  const el = document.createElement('article');
  el.className = 'item';
  el.innerHTML = `<div class="ph">En cola…</div><div class="name" title="${name}">${name}</div><div class="meta">Esperando</div>`;
  results.appendChild(el);
  const item = { name, el, blob: null };
  items.push(item);
  return item;
}

function finishItem(item, res) {
  const base = item.name.replace(/\.[^.]+$/, '');
  item.blob = new Blob([res.bytes], { type: 'image/webp' });
  item.file = `${base}.webp`;
  const kb = (res.bytes.length / 1024).toFixed(0);
  const img = document.createElement('img');
  img.src = URL.createObjectURL(item.blob); img.alt = `Sticker ${base}`;
  item.el.querySelector('.ph').replaceWith(img);
  const meta = item.el.querySelector('.meta');
  meta.textContent = `${kb} KB · ${res.fps} fps · calidad ${Math.round(res.quality * 100)}` + (res.ok ? '' : ' · ¡supera 500 KB!');
  meta.className = 'meta ' + (res.ok ? 'ok' : 'err');
  const btn = document.createElement('button');
  btn.className = 'btn btn-gold'; btn.type = 'button'; btn.textContent = 'Descargar';
  btn.onclick = () => download(item);
  item.el.appendChild(btn);
  $('#downloadAll').disabled = !items.some((i) => i.blob);
}

function download(item) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(item.blob); a.download = item.file;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function processQueue() {
  if (busy) return;
  busy = true;
  previewWrap.hidden = false;
  while (queue.length) {
    const { item, file, nombre } = queue.shift();
    previewWrap.querySelector('h2').textContent = `Renderizando ${item.name}`;
    item.el.querySelector('.meta').textContent = 'Procesando…';
    try {
      // Por nombre: se dibuja dentro del flyer base (flyer.js). Por archivo: se usa tal cual.
      const img = file ? await loadImage(file) : await Flyer.render(nombre, { base: '../assets/flyer-base.jpg' });
      const flyer = prepareFlyer(img);
      const opts = { fps: +$('#fps').value, quality: +$('#quality').value };
      const res = await makeSticker(flyer, opts, previewCtx, (msg) => (progress.textContent = msg));
      finishItem(item, res);
    } catch (e) {
      const meta = item.el.querySelector('.meta');
      meta.textContent = `Error: ${e.message}`; meta.className = 'meta err';
    }
  }
  previewWrap.querySelector('h2').textContent = 'Listo';
  progress.textContent = '';
  busy = false;
}

function enqueueFiles(files) {
  [...files].filter((f) => f.type.startsWith('image/')).forEach((file) => {
    queue.push({ item: addItem(file.name), file });
  });
  processQueue();
}

$('#files').addEventListener('change', (e) => { enqueueFiles(e.target.files); e.target.value = ''; });
const drop = $('#drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => enqueueFiles(e.dataTransfer.files));

const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
function enqueueNames(names) {
  names.map((n) => n.trim()).filter(Boolean).forEach((nombre) => {
    queue.push({ item: addItem(`${slug(nombre) || 'sticker'}.webp`), nombre });
  });
  processQueue();
}
$('#byNames').addEventListener('click', () => enqueueNames($('#names').value.split(/\n|,|;/)));
$('#generic').addEventListener('click', () => { queue.push({ item: addItem('invitacion.webp'), nombre: '' }); processQueue(); });

$('#downloadAll').addEventListener('click', async () => {
  for (const item of items.filter((i) => i.blob)) {
    download(item);
    await new Promise((r) => setTimeout(r, 400));
  }
});
