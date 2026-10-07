'use strict';
/* ============================================================
   names.js — NOMBRES REGISTRADOS para invitaciones personalizadas
   Cada nombre lleva su género para elegir el flyer:
     'hombre' → assets/flyer-base-hombre.jpg (oveja negra, amarillo)
     'mujer'  → assets/flyer-base-mujer.jpg  (oveja con flores, rosa)
   URL de cada persona:  https://…/invitacion/?n=Nombre
   (también ?nombre=Nombre o #Nombre; no importan mayúsculas,
   acentos ni espacios: "maria-jose" encuentra "María José").
   Si el nombre de la URL NO está aquí → invitación genérica.
   ============================================================ */
const NAMES = [
  { nombre: 'Oscar',    genero: 'hombre' },
  { nombre: 'Noemí',    genero: 'mujer' },
  { nombre: 'Zury',     genero: 'mujer' },   // revisar
  { nombre: 'Yeshua',   genero: 'hombre' },
  { nombre: 'Nancy',    genero: 'mujer' },
  { nombre: 'Yamileth', genero: 'mujer' },
  { nombre: 'Vania',    genero: 'mujer' },
  { nombre: 'Danna',    genero: 'mujer' },
  { nombre: 'Emanuel',  genero: 'hombre' },
  { nombre: 'Israel',   genero: 'hombre' },
  { nombre: 'Bul',      genero: 'hombre' },  // revisar
  { nombre: 'Isaac',    genero: 'hombre' },
  { nombre: 'Irving',   genero: 'hombre' },
  { nombre: 'Laila',    genero: 'mujer' },
  { nombre: 'Gemma',    genero: 'mujer' },
  { nombre: 'Heber',    genero: 'hombre' },
];

/* Invitación genérica (cuando no hay nombre o no está registrado).
   La raíz sola (o ?n=H) usa la de hombre; con ?n=M sale la de mujer. */
const GENERIC = {
  genero: 'hombre',                            // flyer por defecto cuando no se indica
  nombres: { hombre: 'Amigo', mujer: 'Amiga' }, // línea grande bajo "Hola" → "Hola Amigo," / "Hola Amiga,"
  despedida: '¡Te esperamos!',                 // franja de abajo
};
