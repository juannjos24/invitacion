'use strict';
/* ============================================================
   Invitación — "Toca hasta que explote"
   El sobre tintinea solo. Cada toque lo hace vibrar más fuerte y
   agrieta el sello. Al 5º toque explota en luz, la solapa se abre
   y el flyer sale del sobre a pantalla completa.
   La invitación se personaliza con el nombre de la URL (GUEST,
   ver common.js y names.js): el nombre se dibuja dentro del flyer.
   ============================================================ */
initCommon();

const NEEDED = 5;
const stage = $('#stage');
const hint = $('#hint');
const reveal = $('#reveal');
const flash = $('#flash');

if (GUEST) {
  $('#title').textContent = `${GUEST.nombre}, tienes una invitación`;
  document.title = `${GUEST.nombre}, tienes una invitación · ${EVENT.titulo}`;
}
const env = createEnvelope({ inner: 'flyer' });
// Dibuja el nombre dentro del flyer y actualiza la imagen del sobre
Flyer.prepare(GUEST ? GUEST.nombre : '', { genero: GUEST ? GUEST.genero : undefined }).then((url) => { if (url) $('img', env.inner).src = url; });

env.el.classList.add('jitter');                 // tintineo en reposo
env.el.style.setProperty('--level', '0');
env.el.setAttribute('role', 'button');
env.el.setAttribute('tabindex', '0');
env.el.setAttribute('aria-label', 'Sobre cerrado. Tócalo varias veces para abrir la invitación');
$('#envelope-slot').appendChild(env.el);

let taps = 0, done = false;

function onTap() {
  if (done) return;
  taps++;
  vibrate(15 + taps * 10);
  Sound.tick();

  // Cada toque sube el nivel: vibra más fuerte y más rápido (ver --level en style.css)
  env.el.style.setProperty('--level', String(taps));
  env.el.classList.remove('kick'); void env.el.offsetWidth; env.el.classList.add('kick');

  // Grieta progresiva en el sello (4 grietas para los toques 1-4)
  env.cracks[taps - 1]?.classList.add('show');
  env.seal.classList.remove('hit'); void env.seal.offsetWidth; env.seal.classList.add('hit');

  hint.textContent = taps < NEEDED ? '¡Sigue tocando!' : '';
  if (taps >= NEEDED) explode();
}

async function explode() {
  done = true;
  env.cracks.forEach((c) => c.classList.add('show'));

  // 1) Vibración frenética un instante antes de explotar
  env.el.classList.add('frenzy');
  await wait(550);

  // 2) Explosión de luz: destello en toda la pantalla, lluvia de partículas y el sello se rompe
  const c = centerOf(env.seal);
  env.el.classList.remove('jitter', 'frenzy', 'kick');
  env.el.classList.add('seal-break', 'boom');
  flash.classList.add('on');
  Sound.tear(); Sound.chime();
  vibrate([40, 30, 120]);
  Particles.burst(c.x, c.y, 160);
  Particles.more(40);
  hint.classList.add('is-hidden');
  await wait(300);

  // 3) La solapa se abre y el flyer sale deslizándose del sobre
  env.el.classList.add('is-open');
  await wait(500);
  env.el.classList.add('is-out');
  await wait(850);

  // 4) Se agranda a pantalla completa (FLIP)
  await revealFlyer($('img', env.inner), { stage, reveal, extraHTML: `<p class="after">${EVENT.frases[2]} ${EVENT.lema}</p>` });
  flash.classList.remove('on');
}

env.el.addEventListener('click', onTap);
env.el.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); }
});
