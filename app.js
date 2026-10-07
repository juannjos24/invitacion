'use strict';
/* ============================================================
   op1 — "Toca hasta abrir"
   El sobre requiere 5 toques. Cada toque: tiembla, el sello se
   agrieta y se actualiza el contador. Al 5º: se rompe el sello,
   se abre la solapa y el flyer sale a pantalla completa.
   La invitación se personaliza con el nombre de la URL (GUEST,
   ver common.js y names.js): el nombre se dibuja dentro del flyer.
   ============================================================ */
initCommon();

const NEEDED = 5;
const stage = $('#stage');
const hint = $('#hint');
const dots = $$('#taps i');
const reveal = $('#reveal');

if (GUEST) {
  $('#title').textContent = `${GUEST.nombre}, tienes una invitación`;
  document.title = `${GUEST.nombre}, tienes una invitación · ${EVENT.titulo}`;
}
const env = createEnvelope({ inner: 'flyer' });
// Dibuja el nombre dentro del flyer y actualiza la imagen del sobre
Flyer.prepare(GUEST ? GUEST.nombre : '', { genero: GUEST ? GUEST.genero : undefined }).then((url) => { if (url) $('img', env.inner).src = url; });

env.el.classList.add('pulse');
env.el.setAttribute('role', 'button');
env.el.setAttribute('tabindex', '0');
env.el.setAttribute('aria-label', `Sobre cerrado. Toca ${NEEDED} veces para abrir la invitación`);
$('#envelope-slot').appendChild(env.el);

let taps = 0, done = false;

function onTap() {
  if (done) return;
  taps++;
  vibrate(20);
  Sound.tick();

  // Temblor (reiniciar la animación)
  env.el.classList.remove('pulse', 'shake');
  void env.el.offsetWidth;
  env.el.classList.add('shake');

  // Grieta progresiva en el sello (4 grietas para los toques 1-4)
  env.cracks[taps - 1]?.classList.add('show');
  env.seal.classList.remove('hit'); void env.seal.offsetWidth; env.seal.classList.add('hit');

  dots[taps - 1]?.classList.add('on');
  const faltan = NEEDED - taps;
  hint.textContent = faltan > 0 ? `Sigue tocando… ${taps}/${NEEDED}` : '';
  env.el.setAttribute('aria-label', faltan > 0 ? `Faltan ${faltan} toques` : 'Abriendo invitación');

  if (taps >= NEEDED) open();
}

async function open() {
  done = true;
  env.el.classList.remove('shake');
  env.cracks.forEach((c) => c.classList.add('show'));

  // 1) El sello se rompe con explosión de luz
  const c = centerOf(env.seal);
  env.el.classList.add('seal-break');
  Sound.tear();
  vibrate([30, 40, 80]);
  Particles.burst(c.x, c.y, 110);
  await wait(450);

  // 2) La solapa se abre en 3D
  env.el.classList.add('is-open');
  Sound.chime();
  hint.classList.add('is-hidden');
  await wait(650);

  // 3) El flyer sale deslizándose hacia arriba
  env.el.classList.add('is-out');
  await wait(900);

  // 4) Se agranda a pantalla completa (FLIP)
  await revealFlyer($('img', env.inner), { stage, reveal, extraHTML: `<p class="after">${EVENT.frases[2]} ${EVENT.lema}</p>` });
}

env.el.addEventListener('click', onTap);
env.el.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); }
});
