'use strict';
/* ============================================================
   op2 — "Abre solo al llegar"
   Al cargar: el sobre cae con rebote, espera ~1 s, se abre solo y
   el flyer sale con brillo dorado. Botón "Ver de nuevo".
   ============================================================ */
initCommon();

const stage = $('#stage');
const hint = $('#hint');
const reveal = $('#reveal');

const env = createEnvelope({ inner: 'flyer' });
env.el.setAttribute('aria-label', 'Sobre con la invitación abriéndose');
$('#envelope-slot').appendChild(env.el);

let playing = false;

async function play() {
  if (playing) return;
  playing = true;

  // Reiniciar estado
  reveal.hidden = true; reveal.innerHTML = '';
  stage.classList.remove('is-hidden');
  hint.classList.remove('is-hidden');
  hint.textContent = 'Tu invitación está llegando…';
  env.el.classList.remove('is-open', 'is-out', 'seal-break', 'drop-in', 'shine');
  void env.el.offsetWidth;
  window.scrollTo({ top: 0 });

  // 1) Cae con rebote
  env.el.classList.add('drop-in');
  await wait(1200);
  vibrate(15);
  hint.textContent = 'Abriendo…';

  // 2) Espera ~1 s y se abre sola
  await wait(1000);
  const c = centerOf(env.seal);
  env.el.classList.add('seal-break');
  Sound.tear();
  Particles.burst(c.x, c.y, 90);
  await wait(400);

  env.el.classList.add('is-open');
  Sound.chime();
  hint.classList.add('is-hidden');
  await wait(600);

  // 3) El flyer sale con brillo dorado
  env.el.classList.add('is-out', 'shine');
  await wait(1100);

  // 4) Pantalla completa + botón "Ver de nuevo"
  await revealFlyer($('img', env.inner), {
    stage, reveal,
    extraHTML: `<button class="btn btn-ghost again" id="again">${ICONS.flip} Ver de nuevo</button>`,
  });
  $('#again').addEventListener('click', () => { playing = false; play(); });
  playing = false;
}

play();
