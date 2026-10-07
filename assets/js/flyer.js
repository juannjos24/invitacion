'use strict';
/* ============================================================
   flyer.js — Dibuja el nombre DENTRO de la imagen del flyer.
   Usa el flyer sin nombre de cada género (assets/flyer-base-*.jpg)
   y escribe con canvas la línea grande bajo "Hola" y la franja
   "¡Te esperamos…!".
   Lo comparten la invitación (index) y el generador de stickers.
   ============================================================ */
const Flyer = (() => {
  const BASE_W = 853;                                   // ancho con el que se calibraron las posiciones
  const FONT = '"Kaushan Script", "Caveat", cursive';   // caligrafía parecida a la del flyer
  // Fondo sin nombre y color de tinta de cada versión (rutas relativas a la raíz del sitio)
  const VERSIONS = {
    hombre: { base: 'assets/flyer-base-hombre.jpg', ink: '#15171a' },
    mujer:  { base: 'assets/flyer-base-mujer.jpg',  ink: '#13203a' },
  };
  const POS = {
    nombre:    { x: 500, baseline: 322, size: 112, maxWidth: 282 },               // "Oscar," bajo "Hola"
    despedida: { cx: 452, baseline: 1168, size: 42, maxWidth: 320, angle: -2.5 }, // "¡Te esperamos, Oscar! ♡"
  };
  const bases = {};

  function loadBase(src) {
    if (!bases[src]) bases[src] = new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('No se pudo cargar ' + src));
      i.src = src;
    });
    return bases[src];
  }
  async function fontsReady() {
    try { await document.fonts.load(`${POS.nombre.size}px ${FONT}`); } catch (e) { /* usa la fuente de respaldo */ }
  }
  /** Reduce el tamaño hasta que el texto quepa en maxWidth. Devuelve el tamaño usado. */
  function fitText(ctx, text, size, maxWidth) {
    let s = size;
    ctx.font = `${s}px ${FONT}`;
    while (ctx.measureText(text).width > maxWidth && s > 18) { s -= 2; ctx.font = `${s}px ${FONT}`; }
    return s;
  }
  function heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * .3);
    ctx.bezierCurveTo(x, y - s * .1, x - s * .55, y - s * .1, x - s * .55, y + s * .25);
    ctx.bezierCurveTo(x - s * .55, y + s * .6, x, y + s * .8, x, y + s * 1.05);
    ctx.bezierCurveTo(x, y + s * .8, x + s * .55, y + s * .6, x + s * .55, y + s * .25);
    ctx.bezierCurveTo(x + s * .55, y - s * .1, x, y - s * .1, x, y + s * .3);
    ctx.closePath();
    ctx.lineWidth = s * .13; ctx.lineJoin = 'round'; ctx.stroke();
  }

  /**
   * Devuelve un <canvas> con el flyer y el nombre escrito.
   * @param {string} nombre  vacío → textos genéricos (GENERIC en names.js)
   * @param {{genero?:'hombre'|'mujer', prefix?:string}} opts
   *        prefix = ruta hasta la raíz del sitio ('' en index, '../' en sticker/)
   */
  async function render(nombre = '', { genero, prefix = '' } = {}) {
    const gen = typeof GENERIC !== 'undefined' ? GENERIC : { genero: 'hombre', nombres: { hombre: 'Amigo', mujer: 'Amiga' }, despedida: '¡Te esperamos!' };
    const g = VERSIONS[genero] ? genero : (VERSIONS[gen.genero] ? gen.genero : 'hombre');
    const v = VERSIONS[g];
    const genNombre = (gen.nombres && gen.nombres[g]) || gen.nombre || 'Amigo';
    const INK = v.ink;
    const [img] = await Promise.all([loadBase(prefix + v.base), fontsReady()]);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const k = c.width / BASE_W;                          // por si el fondo cambia de resolución
    const n = String(nombre || '').trim();

    ctx.save();
    ctx.scale(k, k);
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.textBaseline = 'alphabetic';

    // 1) Línea grande bajo "Hola"
    const big = `${n || genNombre},`;
    const bigSize = fitText(ctx, big, POS.nombre.size, POS.nombre.maxWidth);
    // si el nombre es largo y se encoge, se sube un poco para que quede centrado en la franja
    ctx.fillText(big, POS.nombre.x, POS.nombre.baseline - (POS.nombre.size - bigSize) * 0.4);

    // 2) Franja de despedida, centrada y un poco inclinada, con corazón
    const p = POS.despedida;
    const bye = n ? `¡Te esperamos, ${n}!` : gen.despedida;
    const size = fitText(ctx, bye, p.size, p.maxWidth);
    const w = ctx.measureText(bye).width, gap = size * .35, hs = size * .55;
    const total = w + gap + hs * 1.1;
    ctx.translate(p.cx, p.baseline); ctx.rotate(p.angle * Math.PI / 180);
    ctx.fillText(bye, -total / 2, 0);
    heart(ctx, -total / 2 + w + gap + hs * .55, -size * .62, hs);
    ctx.restore();
    return c;
  }

  function toBlobURL(canvas) {
    return new Promise((res) => canvas.toBlob((b) => res(URL.createObjectURL(b)), 'image/jpeg', .92));
  }

  /** Renderiza y deja el resultado en EVENT.flyer (lo usa la invitación). */
  async function prepare(nombre, opts) {
    try {
      const url = await toBlobURL(await render(nombre, opts));
      if (typeof EVENT !== 'undefined') EVENT.flyer = url;
      return url;
    } catch (e) {
      console.warn('Flyer personalizado no disponible, se usa el genérico:', e.message);
      return null;
    }
  }

  return { render, prepare, POS, VERSIONS };
})();
