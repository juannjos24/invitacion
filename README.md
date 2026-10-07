# DIOS NO DESISTE · Invitación animada en forma de sobre

Sitio estático (solo HTML, CSS y JavaScript vanilla, sin build ni dependencias) con la invitación
digital de la Vigilia Juvenil y de Oración de IASD Portales: un sobre que se abre con cinco toques
y revela el flyer **con el nombre del invitado escrito dentro de la imagen**.

| Ruta        | Qué es                                                                 |
|-------------|------------------------------------------------------------------------|
| `/`         | La invitación (sobre "Toca hasta abrir"). Acepta `?n=Nombre`.          |
| `/sticker/` | Generador de stickers animados de WhatsApp (por nombres o por archivo) |

## Invitaciones personalizadas por URL

1. Registra los nombres **con su género** en `assets/js/names.js` (el género elige el flyer:
   oveja negra/amarillo para hombre, oveja con flores/rosa para mujer):
   ```js
   const NAMES = [
     { nombre: 'Oscar', genero: 'hombre' },
     { nombre: 'Noemí', genero: 'mujer' },
   ];
   ```
2. Comparte a cada persona su enlace: `https://juannjos24.github.io/invitacion/?n=Oscar`
   (también sirven `?nombre=Oscar` o `#Oscar`; no importan mayúsculas, acentos ni espacios:
   `?n=maria-jose` encuentra "María José").
3. El nombre se dibuja con canvas dentro del flyer, en dos lugares: la línea grande bajo "Hola"
   y la franja "¡Te esperamos, Nombre! ♡". Los nombres largos se encogen solos para caber.
4. Si el nombre de la URL **no está en la lista**, la página redirige a la invitación genérica
   (`/` sin parámetros), que dice "Hola Joven," y "¡Te esperamos!" sobre el flyer de hombre. Texto y
   flyer de la genérica se cambian en `GENERIC` dentro de `names.js`.

El título de la página y el mensaje de "Compartir por WhatsApp" también llevan el nombre.

## Estructura

```
index.html                 → la invitación (sobre + flyer a pantalla completa)
app.js / style.css         → lógica y estilos propios del sobre "Toca hasta abrir"
assets/flyer-base-hombre.jpg → FLYER SIN NOMBRE, versión hombre (fondo sobre el que se escribe)
assets/flyer-base-mujer.jpg  → FLYER SIN NOMBRE, versión mujer
assets/flayer_hombre.jpeg    → originales del diseñador ("Hola Amigo," / "Hola Amiga,"): respaldo
assets/flayer_mujer.jpeg       si falla el canvas y vista previa del enlace (og:image)
assets/js/names.js         → NOMBRES registrados y textos genéricos
assets/js/flyer.js         → dibuja el nombre dentro del flyer (canvas); posiciones en Flyer.POS
assets/js/common.js        → EVENT (datos), invitado (GUEST), .ics, WhatsApp, mapa, sobre, sonido
assets/css/base.css        → variables, tipografías, sobre, botones
sticker/                   → generador de stickers animados (index.html + sticker.js)
```

Si cambia el diseño del flyer: reemplaza `assets/flyer-base-hombre.jpg` / `-mujer.jpg` por la nueva
versión **sin nombre** (misma resolución, 853×1280, o ajusta `Flyer.POS` en `flyer.js`). Las rutas y el
color de tinta de cada versión están en `Flyer.VERSIONS`.

## Antes de publicar

1. **Nombres**: llena `NAMES` en `assets/js/names.js`.
2. **Datos del evento**: edita el objeto `EVENT` en `assets/js/common.js`.
   En particular `direccion` (hoy dice `DIRECCIÓN PENDIENTE`) para que funcione "Cómo llegar".
3. **URL base**: ya está configurada como `https://juannjos24.github.io/invitacion/`.
   Si cambias de usuario o de nombre de repo, reemplázala en `SITE.baseUrl` (`assets/js/common.js`)
   y en las etiquetas `og:image` / `og:url` de `index.html`:
   ```bash
   grep -rl "juannjos24.github.io/invitacion" . | xargs sed -i 's#juannjos24.github.io/invitacion#TU_USUARIO.github.io/TU_REPO#g'
   ```

## Probar en local

```bash
python3 -m http.server 8080
# abre http://localhost:8080/?n=Oscar
```
(Hace falta un servidor, aunque sea este, porque el flyer se dibuja en canvas y el navegador bloquea
imágenes locales abiertas con `file://`.)

## Publicar en GitHub Pages

```bash
git add .
git commit -m "Invitación personalizada por nombre"
git push
```
El sitio queda en `https://juannjos24.github.io/invitacion/` y el generador en `.../invitacion/sticker/`.

## Notas técnicas

- Mobile-first, probado para 360 px de ancho; también se ve bien en escritorio.
- Animaciones solo con `transform`/`opacity` y `requestAnimationFrame`; sin librerías externas
  (solo Google Fonts; la caligrafía del nombre es "Kaushan Script").
- Respeta `prefers-reduced-motion`, vibración ligera, botón de sonido (Web Audio API).
- El `.ics` se genera con hora local "flotante" (sin zona horaria).
- Accesible: botones reales, `aria-label`, contenido en texto real.

## Sticker animado de WhatsApp (masivo)

`sticker/` es una página (HTML + JS vanilla, sin dependencias) que convierte cada flyer en un
sticker animado de WhatsApp: el sobre recibe tres toques, el sello se agrieta y se rompe, la
solapa se abre y el flyer sale del sobre hasta llenar el sticker. Sale como **WebP animado
512×512, fondo transparente y menos de 500 KB**, que es lo que exige WhatsApp.

- Abre `sticker/` desde un servidor local (`python3 -m http.server 8080` → `http://localhost:8080/sticker/`)
  o desde GitHub Pages (`https://juannjos24.github.io/invitacion/sticker/`).
- "Cargar todos los registrados" llena la lista con `NAMES` (nombre y género) y "Generar stickers con
  estos nombres" produce uno por línea usando el mismo `flyer.js` de la invitación. Para un nombre no
  registrado escribe `Nombre, mujer` o `Nombre, hombre`. También puedes subir flyers ya hechos.
  Cada uno se descarga como `<nombre>.webp`; "Descargar todos" los baja seguidos.
- Todo ocurre en el navegador: dibuja la animación en un canvas, codifica cada fotograma con
  `canvas.toBlob('image/webp')` (solo la zona que cambió) y arma el contenedor WebP animado
  (RIFF/VP8X/ANIM/ANMF) a mano. Requiere Chrome, Edge, Brave u Opera (Firefox y Safari no codifican WebP).
- El flyer final (el fotograma que se queda en pantalla) siempre va en calidad alta; si el archivo
  pasa de 500 KB se baja la calidad de los fotogramas en movimiento y luego los fps.
- Para enviarlo: en WhatsApp Web/Escritorio arrastra el `.webp` al chat; en el teléfono impórtalo
  con una app de stickers (Sticker Maker, Sticker.ly…) que acepte WebP animado.
- Tiempos, colores y tamaño del sobre están en las constantes al inicio de `sticker/sticker.js`.
