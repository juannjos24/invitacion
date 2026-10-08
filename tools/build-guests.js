#!/usr/bin/env node
'use strict';
/*
                    /\
                   /  \
                   |  |
                   |JM|
                  /|  |\
                 / |  | \
                /  |  |  \
       ________/   |  |   \________
      /            |  |            \
      '────────────|  |────────────'
                   |  |
                   |  |
                  /    \
                 /______\

        Desarrollado por Juan José Moreno Miguel
                 Stones Solutions · 2026
*/
/* ============================================================
   build-guests.js — Genera una página por invitado (/<slug>/index.html)
   con sus propias etiquetas Open Graph, para que la vista previa del
   enlace en WhatsApp lleve el nombre y el flyer de esa persona.
   (WhatsApp no ejecuta JavaScript: lee las etiquetas del HTML tal cual,
   por eso ?n=Nombre siempre mostraba la vista previa genérica.)

   Uso:   node tools/build-guests.js
   Lee:   assets/js/names.js (NAMES), index.html (plantilla), assets/og/*.jpg
   Crea:  <slug>/index.html por cada nombre y enlaces.md con la lista de links.
   Sin dependencias. Antes genera las imágenes con tools/og.html.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE_URL = 'https://juannjos24.github.io/invitacion/';
const TITULO = 'DIOS NO DESISTE';

const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// NAMES está en un archivo de navegador (const global): se evalúa y se devuelve.
const namesSrc = fs.readFileSync(path.join(ROOT, 'assets/js/names.js'), 'utf8');
const NAMES = new Function(namesSrc + ';return NAMES;')();

const template = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function pageFor(guest) {
  const slug = slugify(guest.nombre);
  const genero = guest.genero === 'mujer' ? 'mujer' : 'hombre';
  const ogImg = fs.existsSync(path.join(ROOT, 'assets/og', `${slug}.jpg`)) ? `assets/og/${slug}.jpg` : `assets/og/${genero}.jpg`;
  const title = `${guest.nombre}, tienes una invitación`;
  let html = template;
  const replaceOnce = (re, value) => {
    if (!re.test(html)) throw new Error(`No se encontró en index.html: ${re}`);
    html = html.replace(re, value);
  };
  replaceOnce(/<head>\n/, `<head>\n  <!-- GENERADO por tools/build-guests.js a partir de index.html: no editar a mano -->\n  <base href="../">\n`);
  replaceOnce(/<title>[^<]*<\/title>/, `<title>${esc(title)} · ${TITULO}</title>`);
  replaceOnce(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)} · ${TITULO}$2`);
  replaceOnce(/(<meta property="og:image" content=")[^"]*(")/, `$1${BASE_URL}${ogImg}$2`);
  replaceOnce(/(<meta property="og:url" content=")[^"]*(")/, `$1${BASE_URL}${slug}/$2`);
  replaceOnce(/(\n\s*)<script src="assets\/js\/names\.js"><\/script>/,
    `$1<script>window.GUEST_SLUG = ${JSON.stringify(slug)};</script>$1<script src="assets/js/names.js"></script>`);
  return { slug, html, url: `${BASE_URL}${slug}/`, ogImg };
}

const rows = [];
for (const guest of NAMES) {
  const page = pageFor(guest);
  const dir = path.join(ROOT, page.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page.html);
  const aviso = page.ogImg.endsWith(`${page.slug}.jpg`) ? '' : '  (sin imagen propia: usa la genérica; genera assets/og con tools/og.html)';
  rows.push({ nombre: guest.nombre, genero: guest.genero, url: page.url, aviso });
}

const md = ['# Enlaces personalizados', '', 'Generado por `node tools/build-guests.js`. Cada enlace tiene su propia vista previa en WhatsApp.', '',
  '| Nombre | Enlace | Flyer |', '|---|---|---|',
  ...rows.map((r) => `| ${r.nombre} | ${r.url} | ${r.genero} |`), ''].join('\n');
fs.writeFileSync(path.join(ROOT, 'enlaces.md'), md);

for (const r of rows) console.log(`${r.nombre.padEnd(12)} ${r.url}${r.aviso}`);
console.log(`\n${rows.length} páginas generadas. Lista en enlaces.md`);
