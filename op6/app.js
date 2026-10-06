'use strict';
/* ============================================================
   op6 — "Sobre 3D"
   El sobre flota y gira suavemente (CSS 3D). Se puede girar
   arrastrando. Al tocarlo se abre y sale una tarjeta que se
   voltea: frente = flyer, reverso = datos del evento.
   ============================================================ */
initCommon();

const stage = $('#stage');
const scene = $('#scene');
const env3d = $('#env3d');
const hint = $('#hint');
const reveal = $('#reveal');
const card = $('#card');
const flipBtn = $('#flip-btn');

const env = createEnvelope({ inner: 'flyer' });
env.el.insertAdjacentHTML('afterbegin', '<div class="env-rear" aria-hidden="true"></div>');
env.el.setAttribute('role', 'button');
env.el.setAttribute('tabindex', '0');
env.el.setAttribute('aria-label', 'Sobre 3D. Arrastra para girar, toca para abrir la invitación');
env3d.appendChild(env.el);

/* ---------- Rotación: giro automático + arrastre con inercia ---------- */
let rx = -10, ry = 0, vx = 0, vy = 0;
let drag = null, opened = false, autoSpin = !reducedMotion;

function loop() {
  if (!opened) {
    if (!drag) {
      if (autoSpin) ry += .25;
      ry += vy; rx += vx; vy *= .95; vx *= .95;
      rx = clamp(rx, -60, 60);
    }
    env3d.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    requestAnimationFrame(loop);
  }
}
requestAnimationFrame(loop);

scene.addEventListener('pointerdown', (e) => {
  if (opened) return;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false };
  scene.setPointerCapture(e.pointerId);
  scene.classList.add('dragging');
  vx = vy = 0;
});
scene.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
  drag.lx = e.clientX; drag.ly = e.clientY;
  ry += dx * .5; rx = clamp(rx - dy * .5, -60, 60);
  vy = dx * .5; vx = -dy * .5;
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) { drag.moved = true; autoSpin = false; }
});
function endDrag(e) {
  if (!drag || (e && e.pointerId !== drag.id)) return;
  const tap = !drag.moved;
  drag = null;
  scene.classList.remove('dragging');
  if (tap) open(); else Sound.whoosh();
}
scene.addEventListener('pointerup', endDrag);
scene.addEventListener('pointercancel', endDrag);
env.el.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
});

/* ---------- Abrir: se endereza, se abre y sale la tarjeta ---------- */
async function open() {
  if (opened) return;
  opened = true;
  vibrate([20, 30, 60]);
  hint.classList.add('is-hidden');

  // Girar al frente por el camino más corto
  env3d.classList.add('settle');
  env3d.style.transform = `rotateX(0deg) rotateY(${Math.round(ry / 360) * 360}deg)`;
  await wait(800);

  const c = centerOf(env.seal);
  Sound.tear();
  Particles.burst(c.x, c.y, 90);
  env.el.classList.add('is-open');
  Sound.chime();
  await wait(650);
  env.el.classList.add('is-out');
  await wait(900);

  // La tarjeta crece desde el sobre (FLIP)
  $('#front').innerHTML = flyerImgHTML();
  renderLetter($('#letter'), { withActions: false });
  renderActionBar($('#actions'));
  setFlipLabel(false);
  reveal.hidden = false;
  window.scrollTo({ top: 0 });
  stage.classList.add('is-hidden');
  await flipFrom(env.inner, card, { dur: 800 });
  Particles.burst(innerWidth / 2, innerHeight * .4, 60);
}

/* ---------- Voltear la tarjeta ---------- */
let letterRevealed = false;
function setFlipLabel(flipped) {
  flipBtn.innerHTML = `${ICONS.flip} ${flipped ? 'Volver al flyer' : 'Voltear: ver los datos'}`;
  flipBtn.setAttribute('aria-pressed', String(flipped));
}
flipBtn.addEventListener('click', async () => {
  const flipped = card.classList.toggle('is-flipped');
  setFlipLabel(flipped);
  vibrate(12);
  Sound.whoosh();
  if (flipped && !letterRevealed) {
    letterRevealed = true;
    await wait(450);
    revealLetter($('#letter'), { speed: .5 });
  }
});
