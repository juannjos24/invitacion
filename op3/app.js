'use strict';
/* ============================================================
   op3 — "Carta animada"
   Un toque abre el sobre y sale una CARTA (texto real) que se
   despliega con animaciones escalonadas: título a brocha, lema a
   máquina, programa, oradores, fecha/lugar y cuenta regresiva.
   ============================================================ */
initCommon();

const stage = $('#stage');
const hint = $('#hint');
const reveal = $('#reveal');
const letter = renderLetter($('#letter'));

const env = createEnvelope({ inner: 'letter' });
env.el.classList.add('pulse');
env.el.setAttribute('role', 'button');
env.el.setAttribute('tabindex', '0');
env.el.setAttribute('aria-label', 'Sobre cerrado. Toca para leer la carta');
$('#envelope-slot').appendChild(env.el);

let opened = false;

async function open() {
  if (opened) return;
  opened = true;
  vibrate([20, 30, 50]);
  env.el.classList.remove('pulse');
  hint.classList.add('is-hidden');

  // Sello → solapa → carta sale del sobre
  const c = centerOf(env.seal);
  env.el.classList.add('seal-break');
  Sound.tear();
  Particles.burst(c.x, c.y, 80);
  await wait(400);
  env.el.classList.add('is-open');
  Sound.chime();
  await wait(600);
  env.el.classList.add('is-out');
  await wait(900);

  // La carta crece desde el sobre hasta su tamaño real (FLIP)
  reveal.hidden = false;
  window.scrollTo({ top: 0 });
  stage.classList.add('is-hidden');
  await flipFrom(env.inner, letter, { dur: 800, uniform: true });

  // Contenido escalonado
  await revealLetter(letter);
}

env.el.addEventListener('click', open);
env.el.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
});
