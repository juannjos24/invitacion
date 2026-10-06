'use strict';
/* ============================================================
   op4 — "De la oscuridad a Su luz"
   Pantalla oscura con una "linterna" que sigue el cursor/dedo.
   El sobre está escondido en una posición aleatoria. Al tocarlo:
   explosión de luz dorada, el sobre se abre y aparece la carta.
   ============================================================ */
initCommon();

const stage = $('#stage');
const slot = $('#envelope-slot');
const overlay = $('#overlay');
const flash = $('#flash');
const hint = $('#hint');
const help = $('#help');
const beacon = $('#beacon');
const reveal = $('#reveal');
const letter = renderLetter($('#letter'));

const env = createEnvelope({ inner: 'letter' });
env.el.setAttribute('role', 'button');
env.el.setAttribute('tabindex', '0');
env.el.setAttribute('aria-label', 'Sobre escondido en la oscuridad. Tócalo para abrir la invitación');
slot.appendChild(env.el);

/* ---------- Esconder el sobre en un lugar aleatorio ---------- */
function placeEnvelope() {
  const w = env.el.offsetWidth || 250, h = env.el.offsetHeight || 167;
  const margin = 16, top = 90, bottom = 120; // dejar libre la barra superior y la pista
  const x = margin + Math.random() * Math.max(1, innerWidth - w - margin * 2);
  const y = top + Math.random() * Math.max(1, innerHeight - h - top - bottom);
  slot.style.left = `${Math.round(x)}px`;
  slot.style.top = `${Math.round(y)}px`;
  beacon.style.left = `${Math.round(x + w / 2)}px`;
  beacon.style.top = `${Math.round(y + h / 2)}px`;
}
placeEnvelope();

/* ---------- Linterna: el círculo de luz sigue el puntero ---------- */
let found = false;
function setLight(x, y) {
  overlay.style.setProperty('--x', `${x}px`);
  overlay.style.setProperty('--y', `${y}px`);
}
setLight(innerWidth / 2, innerHeight * .55);
document.addEventListener('pointermove', (e) => { if (!found) setLight(e.clientX, e.clientY); }, { passive: true });
document.addEventListener('pointerdown', (e) => { if (!found) setLight(e.clientX, e.clientY); }, { passive: true });
// Con teclado: al enfocar el sobre, la luz lo ilumina
env.el.addEventListener('focus', () => { const c = centerOf(env.el); setLight(c.x, c.y); });

// Pista después de 15 s
const helpTimer = setTimeout(() => { if (!found) help.hidden = false; }, 15000);
help.addEventListener('click', () => { beacon.hidden = false; help.hidden = true; vibrate(10); });

/* ---------- ¡Encontrado! De la oscuridad a Su luz ---------- */
async function onFound() {
  if (found) return;
  found = true;
  clearTimeout(helpTimer);
  help.hidden = true; beacon.hidden = true;
  vibrate([20, 30, 80]);

  // Explosión de luz desde el sobre
  const c = centerOf(env.el);
  flash.style.left = `${c.x}px`; flash.style.top = `${c.y}px`;
  flash.classList.add('go');
  Sound.chime();
  Particles.burst(c.x, c.y, 140);
  Particles.more(40);
  hint.classList.add('is-hidden');
  document.body.classList.add('lit');
  document.body.classList.remove('hunting');
  await wait(700);

  // Reubicar el sobre al centro (la clase .lit lo vuelve relativo) y abrirlo
  await wait(300);
  env.el.classList.add('seal-break');
  Sound.tear();
  await wait(400);
  env.el.classList.add('is-open');
  await wait(600);
  env.el.classList.add('is-out');
  await wait(900);

  // La carta crece desde el sobre y se despliega
  reveal.hidden = false;
  window.scrollTo({ top: 0 });
  stage.classList.add('is-hidden');
  await flipFrom(env.inner, letter, { dur: 800, uniform: true });
  await revealLetter(letter, { speed: .7 });
}

env.el.addEventListener('click', onFound);
env.el.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFound(); }
});
window.addEventListener('resize', () => { if (!found) placeEnvelope(); });
