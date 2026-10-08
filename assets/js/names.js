'use strict';
/*
                    /\
                   /  \
                   |  |
                   |JM|
                  /|  |\
                 / |  | \
                /  |  |  \
       ________/   |  |   \________
      /            |  |            \
      '────────────|  |────────────'
                   |  |
                   |  |
                  /    \
                 /______\

        Desarrollado por Juan José Moreno Miguel
                 Stones Solutions · 2026
*/
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
  { nombre: 'Joey',     genero: 'hombre' },  // revisar
  { nombre: 'Yared',    genero: 'hombre' },
  { nombre: 'Lore',     genero: 'mujer' },
  { nombre: 'Andrea',   genero: 'mujer' },
  { nombre: 'Zuri',     genero: 'mujer' },
  { nombre: 'Rubi',     genero: 'mujer' },
  { nombre: 'Anahí',    genero: 'mujer' },
  { nombre: 'Yessica',  genero: 'mujer' },
  { nombre: 'Alejandra',genero: 'mujer' },
  { nombre: 'Brayan',   genero: 'hombre' },
  { nombre: 'Emmanuel', genero: 'hombre' },  // distinto de "Emanuel" (una m)
  { nombre: 'Cheché',   genero: 'hombre' },  // revisar
  { nombre: 'Paula',    genero: 'mujer' },
  { nombre: 'Sofia',    genero: 'mujer' },
  { nombre: 'John',     genero: 'hombre' },
  { nombre: 'Ivan',     genero: 'hombre' },
  { nombre: 'Brenda',   genero: 'mujer' },
  { nombre: 'Margarito',genero: 'hombre' },
  { nombre: 'Jafet',    genero: 'hombre' },
  { nombre: 'Dany',     genero: 'hombre' },  // revisar
  { nombre: 'Sonia',    genero: 'mujer' },
  { nombre: 'Laura',    genero: 'mujer' },
  { nombre: 'Angie',    genero: 'mujer' },
  { nombre: 'Miguel',   genero: 'hombre' },
];

/* Invitación genérica (cuando no hay nombre o no está registrado).
   La raíz sola (o ?n=H) usa la de hombre; con ?n=M sale la de mujer. */
const GENERIC = {
  genero: 'hombre',                            // flyer por defecto cuando no se indica
  nombres: { hombre: 'Amigo', mujer: 'Amiga' }, // línea grande bajo "Hola" → "Hola Amigo," / "Hola Amiga,"
  despedida: '¡Te esperamos!',                 // franja de abajo
};
