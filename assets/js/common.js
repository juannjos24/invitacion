'use strict';
/* ============================================================
   common.js — Utilidades compartidas de la invitación
   - EVENT: todos los datos del evento (edita SOLO aquí)
   - Calendario (.ics), WhatsApp, Google Maps, lightbox del flyer
   - Sobre (createEnvelope), carta (renderLetter / revealLetter)
   - Partículas de luz, sonido con Web Audio, vibración, FLIP
   ============================================================ */

/* ---------- Configuración del sitio ---------- */
const SITE = {
  // Cambia esto por la URL real de GitHub Pages (con / al final).
  baseUrl: 'https://juannjos24.github.io/invitacion/',
};

/* ---------- Datos del evento (único lugar para editar) ---------- */
const EVENT = {
  tipo: 'Vigilia Juvenil y de Oración',
  titulo: 'DIOS NO DESISTE',
  lema: 'Cuando oramos, el cielo actúa',
  frases: [
    'Una generación que ora puede cambiarlo todo',
    'De la oscuridad… a Su luz',
    '¡Ven!',
  ],
  fechaISO: '2026-10-10',      // AAAA-MM-DD
  horaInicio: '17:00',
  horaFin: '23:00',
  fechaTexto: 'Sábado 10 de octubre de 2026',
  horarioTexto: '17:00 a 23:00 hrs',
  lugar: 'Iglesia Adventista del 7º Día Portales (IASD Portales)',
  lugarCorto: 'IASD Portales',
  direccion: 'DIRECCIÓN PENDIENTE',   // TODO: poner la dirección exacta
  organiza: 'Sociedad de Jóvenes IASD Portales, en conjunto con Bando de Oración',
  oradores: [
    { nombre: 'Pr. Octavio Rosas', iniciales: 'OR' },
    { nombre: 'Pr. Yolman Mendez', iniciales: 'YM' },
    { nombre: 'Pr. David Magaña', iniciales: 'DM' },
  ],
  programa: [
    { nombre: 'Música especial', detalle: 'El Sonar', icono: 'music' },
    { nombre: 'Testimonios', detalle: '', icono: 'chat' },
    { nombre: 'Oración', detalle: '', icono: 'hands' },
    { nombre: 'Mensajes poderosos', detalle: '', icono: 'flame' },
    { nombre: 'Renovación', detalle: '', icono: 'sun' },
  ],
  // Flyers originales del diseñador (respaldo y vista previa); el que se muestra lo genera Flyer.prepare
  flyers: { hombre: 'assets/flayer_hombre.jpeg', mujer: 'assets/flayer_mujer.jpeg' },
  flyer: 'assets/flayer_hombre.jpeg',      // se ajusta según el invitado (ver resolveGuest)
  flyerFallback: 'assets/flyer-placeholder.svg',
};

/* ---------- Invitado: nombre en la URL (?n=Nombre, ?nombre=Nombre o #Nombre) ---------- */
const slugify = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
/** Busca el nombre de la URL en NAMES (names.js). Si no está registrado, manda a la invitación genérica. */
function resolveGuest() {
  const params = new URLSearchParams(location.search);
  let raw = params.get('n') || params.get('nombre') || '';
  if (!raw && location.hash.length > 1) { try { raw = decodeURIComponent(location.hash.slice(1)); } catch (e) { raw = ''; } }
  if (!raw.trim()) return null;
  const slug = slugify(raw);
  const list = typeof NAMES !== 'undefined' ? NAMES : [];
  const found = list.find((n) => slugify(n.nombre) === slug);
  if (!found) { location.replace(location.pathname); return null; }   // no registrado → genérica
  return { nombre: found.nombre, genero: found.genero === 'mujer' ? 'mujer' : 'hombre', slug };
}
const GUEST = resolveGuest();
EVENT.flyer = EVENT.flyers[GUEST ? GUEST.genero : (typeof GENERIC !== 'undefined' && GENERIC.genero) || 'hombre'] || EVENT.flyer;

/* ---------- Helpers generales ---------- */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion ? Math.min(ms, 120) : ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Vibración ligera si el dispositivo lo soporta. */
function vibrate(pattern = 15) {
  // Los navegadores bloquean la vibración si el usuario aún no ha tocado la página
  const active = navigator.userActivation ? navigator.userActivation.hasBeenActive : true;
  if (navigator.vibrate && active) { try { navigator.vibrate(pattern); } catch (e) { /* ignorar */ } }
}

/** Texto alternativo del flyer (accesibilidad). */
const FLYER_ALT = `Flyer: ${EVENT.tipo} "${EVENT.titulo}". ${EVENT.fechaTexto}, ${EVENT.horarioTexto}. ${EVENT.lugar}.`;

/** Etiqueta <img> del flyer con respaldo si todavía no existe flyer.jpg. */
function flyerImgHTML(cls = '') {
  return `<img class="${cls}" src="${EVENT.flyer}" alt="${FLYER_ALT}" loading="eager"
    onerror="this.onerror=null;this.src='${EVENT.flyerFallback}'">`;
}

/* ---------- Íconos SVG (sin imágenes externas) ---------- */
const ICONS = {
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  hands: '<svg viewBox="0 0 64 66" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M32 4c-7 8-12 18-12 30v16h24V34c0-12-5-22-12-30z"/><path d="M32 7v43"/><path d="M26 14c-2 8-2 18-1 28"/><path d="M38 14c2 8 2 18 1 28"/><path d="M20 32c-7-2-10 4-8 10 1 4 5 6 8 6"/><path d="M44 32c7-2 10 4 8 10-1 4-5 6-8 6"/><rect x="18" y="50" width="28" height="9" rx="2"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.4 0 8-3.3 8-7.5 0-3.5-2-5.5-4-8.5-.5 2-1.5 3-3 3.5C13 6 12 3 9 2c.5 3-1 5-3 7.5S4 13 4 14.5C4 18.7 7.6 22 12 22z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2.1.6 2.8.5a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.5-.3z"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M23 9l-6 6M17 9l6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  flip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>',
};

/* ============================================================
   CALENDARIO (.ics), WHATSAPP y MAPA
   ============================================================ */
function buildICS() {
  const dt = (d, h) => d.replace(/-/g, '') + 'T' + h.replace(':', '') + '00';
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const desc = `${EVENT.lema}\n\nOradores: ${EVENT.oradores.map((o) => o.nombre).join(', ')}\n` +
    `Programa: ${EVENT.programa.map((p) => p.nombre + (p.detalle ? ' (' + p.detalle + ')' : '')).join(', ')}\n` +
    `Organiza: ${EVENT.organiza}`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//IASD Portales//Vigilia//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:vigilia-${EVENT.fechaISO}@iasdportales`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dt(EVENT.fechaISO, EVENT.horaInicio)}`, // hora local (flotante)
    `DTEND:${dt(EVENT.fechaISO, EVENT.horaFin)}`,
    `SUMMARY:${esc(EVENT.titulo + ' — ' + EVENT.tipo)}`,
    `DESCRIPTION:${esc(desc)}`,
    `LOCATION:${esc(EVENT.lugar + ', ' + EVENT.direccion)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${esc(EVENT.titulo)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

/** Descarga el archivo .ics (calendario). */
function downloadICS() {
  const blob = new Blob([buildICS()], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'vigilia-dios-no-desiste.ics' });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Abre WhatsApp con un mensaje listo para compartir. */
function shareWhatsApp() {
  const link = location.href;
  const text = (GUEST ? `${GUEST.nombre}, ` : '') + `🙏 *${EVENT.titulo}* — ${EVENT.tipo}\n"${EVENT.lema}"\n\n` +
    `📅 ${EVENT.fechaTexto} · ${EVENT.horarioTexto}\n📍 ${EVENT.lugarCorto}\n\n¡Ven! 👉 ${link}`;
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
}

/** Abre Google Maps con la dirección (o el nombre del lugar si falta). */
function openMaps() {
  const q = /PENDIENTE/i.test(EVENT.direccion) ? EVENT.lugar : `${EVENT.lugar}, ${EVENT.direccion}`;
  window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q), '_blank', 'noopener');
}

/* ---------- Lightbox del flyer ---------- */
function openFlyer() {
  let box = $('#lightbox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'lightbox'; box.className = 'lightbox'; box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Flyer del evento');
    box.innerHTML = `<button class="icon-btn close" aria-label="Cerrar">${ICONS.close}</button>${flyerImgHTML()}`;
    box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('.close')) closeFlyer(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFlyer(); });
    document.body.appendChild(box);
  }
  box.hidden = false;
  $('.close', box).focus();
}
function closeFlyer() { const box = $('#lightbox'); if (box) box.hidden = true; }

/** Barra de acciones al final de cada experiencia. */
function renderActionBar(container, { flyerBtn = true } = {}) {
  container.classList.add('actions');
  // Solo dos botones: "Ver" (flyer en grande) y "Cómo llegar". Calendario y WhatsApp siguen
  // disponibles en downloadICS() / shareWhatsApp() por si se quieren volver a mostrar.
  container.innerHTML = `
    ${flyerBtn ? `<button class="btn" data-act="flyer">${ICONS.image} Ver</button>` : ''}
    <button class="btn btn-ghost" data-act="map">${ICONS.map} Cómo llegar</button>`;
  container.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    vibrate(10);
    ({ cal: downloadICS, wa: shareWhatsApp, map: openMaps, flyer: openFlyer })[b.dataset.act]();
  });
  return container;
}

/* ============================================================
   SONIDO (Web Audio API, sin archivos). Apagado por defecto.
   ============================================================ */
const Sound = (() => {
  let ctx = null, enabled = false;
  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = 'sine', gain = .12, delay = 0) {
    const c = ensure(), t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + .02);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, gain = .2, freq = 1200, q = .8) {
    const c = ensure(), t = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(t);
  }
  return {
    get enabled() { return enabled; },
    /** Acorde suave y brillante al abrir. */
    chime() { if (!enabled) return; [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 1.4, 'sine', .09, i * .11)); tone(2093, 1.8, 'triangle', .03, .5); },
    /** Toque corto (al tocar el sobre). */
    tick() { if (!enabled) return; tone(220, .08, 'square', .04); noise(.06, .08, 2500, 1); },
    /** Papel rasgándose (rotura del sello). */
    tear() { if (!enabled) return; noise(.35, .25, 900, .5); noise(.2, .15, 3000, .7); },
    /** Suave "whoosh" para deslizar/girar. */
    whoosh() { if (!enabled) return; noise(.3, .08, 500, .3); },
    toggle() { enabled = !enabled; if (enabled) { ensure(); tone(880, .15, 'sine', .05); } return enabled; },
    /** Botón de sonido (aria-pressed). */
    renderToggle(container) {
      const b = document.createElement('button');
      b.className = 'icon-btn'; b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Activar sonido'); b.innerHTML = ICONS.soundOff;
      b.addEventListener('click', () => {
        const on = Sound.toggle();
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', on ? 'Desactivar sonido' : 'Activar sonido');
        b.innerHTML = on ? ICONS.soundOn : ICONS.soundOff;
      });
      container.appendChild(b); return b;
    },
  };
})();

/* ============================================================
   PARTÍCULAS DE LUZ (canvas + requestAnimationFrame)
   ============================================================ */
const Particles = (() => {
  let canvas, ctx, w = 0, h = 0, dpr = 1, raf = 0, ambient = [], bursts = [], running = false;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function spawnAmbient(n) {
    for (let i = 0; i < n; i++) ambient.push({
      x: Math.random() * w, y: Math.random() * h, r: .8 + Math.random() * 2.2,
      vy: -(6 + Math.random() * 18) / 60, vx: (Math.random() - .5) * 8 / 60,
      ph: Math.random() * Math.PI * 2, sp: .5 + Math.random() * 1.5,
    });
  }
  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    // Partículas ambientales (suben lentamente y titilan)
    for (const p of ambient) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      const a = .25 + .55 * (.5 + .5 * Math.sin(t / 1000 * p.sp + p.ph));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,217,90,${a})`; ctx.fill();
    }
    // Explosiones (confeti dorado)
    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i];
      p.x += p.vx; p.y += p.vy; p.vy += .12; p.vx *= .985; p.life -= 1 / 60; p.rot += p.vr;
      if (p.life <= 0) { bursts.splice(i, 1); continue; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.min(1, p.life);
      ctx.fillStyle = p.color;
      if (p.shape) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (ambient.length || bursts.length) raf = requestAnimationFrame(frame); else running = false;
  }
  function kick() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  return {
    /** Inicia las partículas ambientales en un <canvas>. */
    start(c, { count = 45, force = false } = {}) {
      canvas = c; ctx = c.getContext('2d'); resize();
      window.addEventListener('resize', resize);
      if (reducedMotion && !force) return;
      spawnAmbient(Math.round(count * Math.min(1, w / 600 + .5)));
      kick();
    },
    /** Explosión de luz dorada en coordenadas de pantalla. */
    burst(x, y, n = 90) {
      if (!ctx) return;
      const colors = ['#f5b800', '#ffd95a', '#ffffff', '#ffe9a3'];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 7;
        bursts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, r: 1.5 + Math.random() * 3,
          life: .9 + Math.random() * 1.2, color: colors[i % colors.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .3, shape: Math.random() > .5 });
      }
      kick();
    },
    /** Sube la densidad (p. ej. cuando "llega la luz"). */
    more(n = 40) { if (!ctx) return; spawnAmbient(n); kick(); },
  };
})();

/* ============================================================
   EL SOBRE
   ============================================================ */
/** SVG del sello de cera con manos en oración y grietas opcionales. */
function sealSVG() {
  return `
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <radialGradient id="waxg" cx="38%" cy="32%" r="72%">
        <stop offset="0" stop-color="#ffe9a3"/><stop offset=".45" stop-color="#e6b73a"/><stop offset="1" stop-color="#8a5e00"/>
      </radialGradient>
    </defs>
    <path class="wax" fill="url(#waxg)" d="M50 4c12-2 20 6 30 8 12 4 18 16 15 28-1 10 3 18-1 28-4 14-18 24-32 26-12 2-20-2-30 0C18 92 6 80 5 66c-1-10 3-18 1-28C2 24 14 12 28 8c8-2 16-4 22-4z"/>
    <circle cx="50" cy="50" r="33" fill="none" stroke="rgba(110,70,0,.55)" stroke-width="1.5" stroke-dasharray="3 2"/>
    <g transform="translate(50 51) scale(.78) translate(-32 -33)" fill="none" stroke="#5a3b00" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M32 4c-7 8-12 18-12 30v16h24V34c0-12-5-22-12-30z"/><path d="M32 7v43"/>
      <path d="M26 14c-2 8-2 18-1 28"/><path d="M38 14c2 8 2 18 1 28"/>
      <path d="M20 32c-7-2-10 4-8 10 1 4 5 6 8 6"/><path d="M44 32c7-2 10 4 8 10-1 4-5 6-8 6"/>
      <rect x="18" y="50" width="28" height="9" rx="2"/>
    </g>
    <g class="cracks" fill="none" stroke="#3b2600" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path class="crack" pathLength="100" d="M50 50l11-15 4-9 6-6"/>
      <path class="crack" pathLength="100" d="M50 50L36 62l-6 11-9 6"/>
      <path class="crack" pathLength="100" d="M50 50l15 10 12 3 8 8"/>
      <path class="crack" pathLength="100" d="M50 50L38 34l-8-5-7-9"/>
    </g>
  </svg>`;
}

/**
 * Crea el DOM del sobre.
 * @param {{inner:'flyer'|'letter'|'none'}} opts
 * @returns {{el, flap, seal, content, inner, cracks}}
 */
function createEnvelope({ inner = 'flyer' } = {}) {
  const el = document.createElement('div');
  el.className = 'envelope';
  const innerHTML = inner === 'flyer' ? flyerImgHTML()
    : inner === 'letter' ? `<div class="env-letter"><span class="env-letter-title">${EVENT.titulo}</span><span class="env-letter-sub">${EVENT.tipo}</span><i></i><i></i><i></i></div>`
    : '';
  el.innerHTML = `
    <div class="env-back"></div>
    <div class="env-content"><div class="env-inner">${innerHTML}</div></div>
    <div class="env-pocket"></div>
    <div class="env-flap"></div>
    <div class="env-seal">${sealSVG()}</div>`;
  return {
    el, flap: $('.env-flap', el), seal: $('.env-seal', el), content: $('.env-content', el),
    inner: $('.env-inner', el), cracks: $$('.crack', el),
  };
}

/** Centro del sello en coordenadas de pantalla (para explosiones). */
function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Transición FLIP: hace que `toEl` "crezca" desde la posición de `fromEl`.
 * `toEl` debe estar visible (no hidden) al llamar.
 */
function flipFrom(fromEl, toEl, { dur = 750, uniform = false } = {}) {
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  let sx = a.width / b.width, sy = a.height / b.height;
  if (uniform) sx = sy = Math.min(sx, sy);
  const dx = a.left + a.width / 2 - (b.left + b.width / 2);
  const dy = a.top + a.height / 2 - (b.top + b.height / 2);
  toEl.style.transformOrigin = 'center';
  toEl.style.transition = 'none';
  toEl.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  toEl.getBoundingClientRect(); // forzar reflow
  toEl.style.transition = `transform ${dur}ms var(--ease-out)`;
  toEl.style.transform = '';
  return wait(dur).then(() => { toEl.style.transition = ''; });
}

/** Muestra el flyer a pantalla completa saliendo desde `fromImg`. */
async function revealFlyer(fromImg, { stage, reveal, extraHTML = '', actions = true } = {}) {
  reveal.innerHTML = `${flyerImgHTML('flyer-full')}${actions ? '<div class="actions"></div>' : ''}${extraHTML}`;
  reveal.hidden = false;
  const img = $('.flyer-full', reveal);
  if (actions) renderActionBar($('.actions', reveal));
  window.scrollTo({ top: 0 });
  stage.classList.add('is-hidden');
  await flipFrom(fromImg, img, { dur: 800 });
  img.classList.add('glow');
  Particles.burst(innerWidth / 2, innerHeight * .4, 70);
  return reveal;
}

/* ============================================================
   LA CARTA (datos en texto real)
   ============================================================ */
function renderLetter(container, { withActions = true, flyerButton = true } = {}) {
  const prog = EVENT.programa.map((p) =>
    `<li class="l-prog"><span class="ico">${ICONS[p.icono]}</span><span>${p.nombre}${p.detalle ? `<br><small>${p.detalle}</small>` : ''}</span></li>`).join('');
  const orad = EVENT.oradores.map((o) =>
    `<li class="l-orador"><span class="avatar" aria-hidden="true">${o.iniciales}</span>${o.nombre}</li>`).join('');
  container.classList.add('letter');
  container.innerHTML = `
    <p class="l-item l-tipo">${EVENT.tipo}</p>
    <h1 class="l-titulo" aria-label="${EVENT.titulo}">${EVENT.titulo}</h1>
    <p class="l-item l-lema"><span class="type">${EVENT.lema}</span></p>

    <section class="l-item">
      <p class="l-when">${EVENT.fechaTexto}<br>${EVENT.horarioTexto}</p>
      <p class="l-where">${EVENT.lugar}</p>
      <p class="l-addr">${EVENT.direccion}</p>
    </section>
    <div class="l-item l-divider"></div>

    <section class="l-item">
      <h2 class="l-sec-title">Programa</h2>
      <ul class="l-programa" role="list" style="list-style:none;margin:0;padding:0">${prog}</ul>
    </section>
    <div class="l-item l-divider"></div>

    <section class="l-item">
      <h2 class="l-sec-title">Oradores</h2>
      <ul class="l-oradores" role="list" style="list-style:none;margin:0;padding:0">${orad}</ul>
    </section>
    <div class="l-item l-divider"></div>

    <section class="l-item">
      <h2 class="l-sec-title">Faltan</h2>
      <div class="countdown" aria-live="polite"></div>
    </section>
    <div class="l-item l-divider"></div>

    <p class="l-item l-frases">${EVENT.frases[0]}<br>${EVENT.frases[1]}<br><strong>${EVENT.frases[2]}</strong></p>
    <p class="l-item l-organiza">Organiza: ${EVENT.organiza}</p>
    ${withActions ? '<div class="l-item actions"></div>' : ''}`;
  if (withActions) renderActionBar($('.actions', container), { flyerBtn: flyerButton });
  return container;
}

/** Efecto máquina de escribir. */
async function typewriter(el, text, speed = 45) {
  if (reducedMotion) { el.textContent = text; return; }
  el.textContent = ''; el.classList.add('type-cursor');
  for (const ch of text) { el.textContent += ch; await wait(ch === ' ' ? speed / 2 : speed); }
  await wait(600); el.classList.remove('type-cursor');
}

/**
 * Anima la aparición escalonada del contenido de la carta.
 * @param {HTMLElement} letter  Elemento creado con renderLetter
 * @param {{speed:number}} opts speed = multiplicador (1 normal, .5 rápido)
 */
async function revealLetter(letter, { speed = 1 } = {}) {
  const d = (ms) => wait(ms * speed);
  const items = $$('.l-item', letter);
  const titulo = $('.l-titulo', letter), lema = $('.type', letter);
  const lemaText = lema.textContent; lema.textContent = '';
  let i = 0;
  const next = () => items[i++]?.classList.add('show');

  next(); await d(350);                       // tipo de evento
  titulo.classList.add('show'); await d(900); // título con trazo de brocha
  next(); await typewriter(lema, lemaText, 40 * speed); // lema escribiéndose
  next(); await d(300);                       // fecha / lugar
  next(); await d(200);                       // divisor
  next();                                     // programa (sección)
  for (const p of $$('.l-prog', letter)) { p.classList.add('show'); await d(160); }
  await d(200); next(); await d(150);
  next();                                     // oradores
  for (const o of $$('.l-orador', letter)) { o.classList.add('show'); await d(180); }
  await d(200); next(); await d(150);
  next(); startCountdown($('.countdown', letter)); await d(300);
  while (i < items.length) { next(); await d(220); }
}

/** Cuenta regresiva en vivo hasta el inicio del evento. */
function startCountdown(el) {
  const target = new Date(`${EVENT.fechaISO}T${EVENT.horaInicio}:00`);
  const end = new Date(`${EVENT.fechaISO}T${EVENT.horaFin}:00`);
  const labels = ['Días', 'Horas', 'Min', 'Seg'];
  el.innerHTML = labels.map((l) => `<div class="cd-box"><div class="cd-num">00</div><div class="cd-lbl">${l}</div></div>`).join('');
  const nums = $$('.cd-num', el);
  function tick() {
    const now = new Date(), diff = target - now;
    if (diff <= 0) {
      el.innerHTML = `<div class="cd-done">${now < end ? '¡Es hoy! Te esperamos 🙌' : '¡Gracias por acompañarnos!'}</div>`;
      clearInterval(id); return;
    }
    const s = Math.floor(diff / 1000);
    const v = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    v.forEach((n, i) => { nums[i].textContent = String(n).padStart(2, '0'); });
  }
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}

/* ---------- Inicialización común de cada página ---------- */
function initCommon() {
  const canvas = $('#particles');
  if (canvas) Particles.start(canvas);
  const slot = $('#sound-slot');
  if (slot) Sound.renderToggle(slot);
}
