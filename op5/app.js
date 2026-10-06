'use strict';
/* ============================================================
   op5 — "Rompe el sello"
   Gesto: arrastra el sello (o desliza hacia arriba sobre el sobre).
   La solapa sigue el dedo en tiempo real (pointer events). Si se
   suelta antes de la mitad regresa; al completar, la carta sale
   como un pergamino que se desenrolla.
   ============================================================ */
initCommon();

const THRESHOLD = 150; // píxeles de arrastre para abrir por completo
const stage = $('#stage');
const hint = $('#hint');
const bar = $('#bar');
const reveal = $('#reveal');
const scrollWrap = $('#scroll-wrap');
const rollBottom = $('#roll-bottom');
const letter = renderLetter($('#letter'));

const env = createEnvelope({ inner: 'letter' });
env.el.setAttribute('role', 'button');
env.el.setAttribute('tabindex', '0');
env.el.setAttribute('aria-label', 'Sobre sellado. Desliza hacia arriba (o presiona Enter) para romper el sello');
$('#envelope-slot').appendChild(env.el);

let drag = null, progress = 0, opened = false, lastCrack = -1;

/** Aplica el progreso del gesto (0..1) a la solapa y al sello. */
function setProgress(p) {
  progress = p;
  env.flap.style.transform = `rotateX(${p * 180}deg)`;
  env.el.classList.toggle('past-half', p > .5);
  env.seal.style.transform = `translate(-50%, -50%) translateY(${-p * 70}px) rotate(${p * 35}deg) scale(${1 - p * .45})`;
  env.seal.style.opacity = String(1 - p * .95);
  bar.style.transform = `scaleX(${p})`;
  // Grietas progresivas y vibración por cada etapa
  const crack = Math.min(3, Math.floor(p * 4)) ;
  env.cracks.forEach((c, i) => c.classList.toggle('show', p > 0 && i <= crack));
  if (crack !== lastCrack && p > 0) { vibrate(8); Sound.tick(); lastCrack = crack; }
}

/* ---------- Pointer events ---------- */
env.el.addEventListener('pointerdown', (e) => {
  if (opened) return;
  drag = { id: e.pointerId, y: e.clientY };
  env.el.setPointerCapture(e.pointerId);
  env.el.classList.add('dragging');
  hint.classList.add('is-hidden');
});
env.el.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  setProgress(clamp((drag.y - e.clientY) / THRESHOLD, 0, 1));
});
function endDrag(e) {
  if (!drag || (e && e.pointerId !== drag.id)) return;
  drag = null;
  env.el.classList.remove('dragging');
  if (progress >= .5) complete();
  else { setProgress(0); lastCrack = -1; hint.classList.remove('is-hidden'); Sound.whoosh(); }
}
env.el.addEventListener('pointerup', endDrag);
env.el.addEventListener('pointercancel', endDrag);
env.el.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!opened) complete(); }
});

/* ---------- Sello roto: sale el pergamino ---------- */
async function complete() {
  opened = true;
  hint.classList.add('is-hidden');
  setProgress(1);
  const c = centerOf(env.el);
  Sound.tear();
  vibrate([20, 30, 70]);
  Particles.burst(c.x, c.y - 40, 100);
  env.el.classList.add('is-open');
  await wait(500);
  env.el.classList.add('is-out');
  Sound.chime();
  await wait(900);

  // Mostrar el pergamino enrollado y desenrollarlo
  reveal.hidden = false;
  window.scrollTo({ top: 0 });
  stage.classList.add('is-hidden');
  await wait(50);
  scrollWrap.classList.add('in');
  await wait(600);
  rollBottom.style.transform = `translateY(${letter.offsetHeight}px)`;
  scrollWrap.classList.add('unrolled');
  Sound.whoosh();
  await wait(400);
  await revealLetter(letter, { speed: .6 });
}
