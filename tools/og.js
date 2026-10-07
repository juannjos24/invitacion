'use strict';
/* ============================================================
   og.js — Genera en el navegador las imágenes de vista previa
   (assets/og/<slug>.jpg) a partir de NAMES. Se usa desde og.html.
   window.OG.renderAll() devuelve [{slug, dataUrl}] (lo usa la
   automatización para guardar los archivos sin clics).
   ============================================================ */
const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Lista de imágenes a generar: genéricas por género + un invitado por nombre. */
function targets() {
  const list = [
    { slug: 'hombre', nombre: '', genero: 'hombre' },
    { slug: 'mujer',  nombre: '', genero: 'mujer' },
  ];
  for (const n of NAMES) list.push({ slug: slugify(n.nombre), nombre: n.nombre, genero: n.genero });
  return list;
}

async function renderAll(onEach) {
  const out = [];
  for (const t of targets()) {
    const canvas = await Flyer.renderOG(t.nombre, { genero: t.genero, prefix: '../' });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    const item = { slug: t.slug, nombre: t.nombre || `(genérica ${t.genero})`, dataUrl };
    out.push(item);
    if (onEach) onEach(item);
  }
  return out;
}
window.OG = { targets, renderAll };

/* ---- Interfaz de og.html ---- */
const grid = document.getElementById('grid');
const status = document.getElementById('status');
const runBtn = document.getElementById('run');
const dlBtn = document.getElementById('download');
let results = [];

function addFigure(item) {
  const fig = document.createElement('figure');
  const kb = Math.round(item.dataUrl.length * 3 / 4 / 1024);
  fig.innerHTML = `<img src="${item.dataUrl}" alt="${item.nombre}">
    <figcaption><span>${item.nombre} · ${kb} KB</span><a download="${item.slug}.jpg" href="${item.dataUrl}">${item.slug}.jpg</a></figcaption>`;
  grid.appendChild(fig);
}

runBtn.addEventListener('click', async () => {
  runBtn.disabled = true; dlBtn.disabled = true; grid.innerHTML = ''; results = [];
  status.textContent = 'Generando…';
  results = await renderAll((item) => { addFigure(item); status.textContent = `Generadas ${results.length + 1}`; });
  status.textContent = `${results.length} imágenes listas`;
  runBtn.disabled = false; dlBtn.disabled = false;
});

// Descarga una por una (el navegador puede pedir permiso para varias descargas)
dlBtn.addEventListener('click', async () => {
  for (const item of results) {
    const a = Object.assign(document.createElement('a'), { href: item.dataUrl, download: `${item.slug}.jpg` });
    document.body.appendChild(a); a.click(); a.remove();
    await new Promise((r) => setTimeout(r, 250));
  }
});
