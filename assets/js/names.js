'use strict';
/* ============================================================
   names.js — NOMBRES REGISTRADOS para invitaciones personalizadas
   Cada nombre se usa con la URL:  https://…/invitacion/?n=Nombre
   (también sirve ?nombre=Nombre o #Nombre). No importan mayúsculas,
   acentos ni espacios: "maria-jose" encuentra "María José".
   Si el nombre de la URL NO está en esta lista, se muestra la
   invitación genérica.
   ============================================================ */
const NAMES = [
  'Oscar',
  // 'María José',
  // 'Pedro',
];

/* Textos cuando no hay nombre (invitación genérica) */
const GENERIC = {
  nombre: 'Joven',             // línea grande debajo de "Hola" → "Hola Joven,"
  despedida: '¡Te esperamos!', // franja amarilla de abajo
};
