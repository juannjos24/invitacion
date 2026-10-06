# DIOS NO DESISTE · Invitación animada en forma de sobre

Sitio estático (solo HTML, CSS y JavaScript vanilla, sin build ni dependencias) con **6 versiones**
de una invitación digital para la Vigilia Juvenil y de Oración de IASD Portales.

| Ruta    | Versión                       | Interacción                                              |
|---------|-------------------------------|----------------------------------------------------------|
| `/`     | Selector                      | Tarjetas que enlazan a las 6 opciones                    |
| `/op1/` | Toca hasta abrir              | 5 toques; el sello se agrieta y al final el flyer sale    |
| `/op2/` | Abre solo al llegar           | Cae con rebote, se abre solo, botón "Ver de nuevo"       |
| `/op3/` | Carta animada                 | Un toque y sale la carta con datos animados + cuenta regresiva |
| `/op4/` | De la oscuridad a Su luz      | Linterna que sigue el dedo; encuentra el sobre            |
| `/op5/` | Rompe el sello                | Desliza el sello hacia arriba; la carta se desenrolla     |
| `/op6/` | Sobre 3D                      | Gira arrastrando; se abre y sale una tarjeta que se voltea |

## Estructura

```
index.html                 → selector de opciones
assets/flyer.jpg           → FLYER OFICIAL (reemplaza el provisional)
assets/flyer-placeholder.svg → respaldo si falta flyer.jpg
assets/css/base.css        → variables, tipografías, sobre, carta, botones
assets/js/common.js        → EVENT (datos), .ics, WhatsApp, mapa, partículas, sonido, carta
op1/ … op6/                → index.html + style.css + app.js de cada versión
```

## Antes de publicar

1. **Flyer**: coloca el flyer oficial (sin la interfaz de Instagram) en `assets/flyer.jpg`.
   El JPG incluido es provisional y se generó automáticamente.
2. **Datos del evento**: edita el objeto `EVENT` en `assets/js/common.js`.
   En particular `direccion` (hoy dice `DIRECCIÓN PENDIENTE`) para que funcione "Cómo llegar".
3. **URL base**: ya está configurada como `https://juannjos24.github.io/invitacion/`
   (el remoto actual del repo). Si cambias de usuario o de nombre de repo, reemplázala en
   `SITE.baseUrl` (`assets/js/common.js`) y en las etiquetas `og:image` / `og:url` de cada
   `index.html`:
   ```bash
   grep -rl "juannjos24.github.io/invitacion" . | xargs sed -i 's#juannjos24.github.io/invitacion#TU_USUARIO.github.io/TU_REPO#g'
   ```

## Probar en local

Cualquier servidor estático sirve. Por ejemplo:

```bash
python3 -m http.server 8080
# abre http://localhost:8080/
```

## Publicar en GitHub Pages

El repo ya tiene el remoto `git@github.com:juannjos24/invitacion.git`, así que basta con:

```bash
git add .
git commit -m "Invitación animada DIOS NO DESISTE"
git push -u origin main
```

Luego en GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch →
Branch: `main` / `(root)` → Save**. En uno o dos minutos el sitio queda en
`https://juannjos24.github.io/invitacion/`, y cada opción en `.../op1/`, `.../op2/`, etc.

Para compartir por WhatsApp o Instagram, comparte directamente el link de la opción elegida
(por ejemplo `https://juannjos24.github.io/invitacion/op4/`). Las etiquetas Open Graph muestran el
flyer como vista previa del enlace.

## Notas técnicas

- Mobile-first, probado para 360 px de ancho; también se ve bien en escritorio.
- Animaciones solo con `transform`/`opacity` y `requestAnimationFrame`; sin librerías externas
  (solo Google Fonts).
- Respeta `prefers-reduced-motion`: las animaciones fuertes se desactivan.
- Vibración ligera con `navigator.vibrate` donde se soporta.
- Botón de sonido (apagado por defecto) con efectos generados con Web Audio API.
- El `.ics` se genera con hora local "flotante" (sin zona horaria), así se agrega a las 17:00 del
  calendario del usuario.
- Accesible: botones reales, `aria-label`, contenido de la carta en texto real.
