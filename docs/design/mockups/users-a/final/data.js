/* Usuarios · datos inventados (nadie de acá existe; todos los correos son @example.com).
   - Orden de la lista (02 · R3.1): la propia primero, después las activas y al final las dadas de
     baja, cada grupo por nombre. Sin nombre se muestra el correo (R3.4).
   - Cada sesión de un celular y cada huella dicen de qué celular son (cel): así «Quitar» cierra la
     sesión de ese celular (R5.6) y «Se perdió un celular» corta lo de uno solo (R5.7).
   - «actual» marca la sesión del dispositivo que se está usando: no figura en la tarjeta propia
     (R5.2) ni en «Se perdió un celular». En la computadora es la de Windows; en el celular, la de
     Android. Las huellas propias tampoco figuran en la tarjeta (R5.5). */
window.PERSONAS = [
  { id: "rp", nombre: "Rubén Paredes", correo: "ruben.paredes@example.com", estado: "vos", entro: "Entró hace 2 horas", autorizada: "Desde la instalación",
    sesiones: [
      { id: "s0", disp: "Chrome en Windows", tipo: "desktop", como: "Google", desde: "Entró hoy 8:30", uso: "Usada ahora", vivo: true, actual: "desktop" },
      { id: "s1", disp: "Chrome en Android", tipo: "phone", cel: "c0", como: "Huella", desde: "Entró ayer 19:40", uso: "Usada hace 20 min", vivo: true, actual: "phone" }
    ],
    huellas: [ { id: "h0", disp: "Chrome en Android", cel: "c0", vinculo: "Vinculado el 01/08/2026", uso: "Usado hace 20 min" } ] },
  { id: "gb", nombre: "Graciela Benítez", correo: "graciela.benitez@example.com", estado: "activa", entro: "Entró hace 3 días", autorizada: "Autorizada el 03/08/2026",
    sesiones: [
      { id: "s2", disp: "Chrome en Windows", tipo: "desktop", como: "Google", desde: "Entró hace 3 días", uso: "Usada hace 5 min", vivo: true },
      { id: "s3", disp: "Chrome en Android", tipo: "phone", cel: "c1", como: "Huella", desde: "Entró ayer 8:02", uso: "Usada hace 1 hora" },
      { id: "s4", disp: "Edge en Windows", tipo: "desktop", como: "Código QR", desde: "Entró el 12/10", uso: "Usada hace 9 días" }
    ],
    huellas: [ { id: "h1", disp: "Chrome en Android", cel: "c1", vinculo: "Vinculado el 14/08/2026", uso: "Usado hace 1 hora" } ] },
  { id: "lf", nombre: "Lucía Fernández", correo: "lucia.fernandez@example.com", estado: "activa", entro: "Entró hace 5 días", autorizada: "Autorizada el 21/08/2026",
    sesiones: [ { id: "s5", disp: "Chrome en Android", tipo: "phone", cel: "c2", como: "Google", desde: "Entró hace 5 días", uso: "Usada hace 2 horas" } ],
    huellas: [] },
  { id: "ms", nombre: "Martín Sosa", correo: "martin.sosa@example.com", estado: "activa", entro: "Entró hoy 7:58", autorizada: "Autorizado el 02/09/2026",
    sesiones: [
      { id: "s6", disp: "Chrome en Windows", tipo: "desktop", como: "Código QR", desde: "Entró hoy 7:58", uso: "Usada ahora", vivo: true },
      { id: "s7", disp: "Chrome en Android", tipo: "phone", cel: "c3", como: "Huella", desde: "Entró hoy 7:55", uso: "Usada hace 12 min", vivo: true },
      { id: "s9", disp: "Firefox en Android", tipo: "phone", cel: "c4", como: "Google", desde: "Entró el 20/10", uso: "Usada ayer 21:15" }
    ],
    huellas: [ { id: "h2", disp: "Chrome en Android", cel: "c3", vinculo: "Vinculado el 02/09/2026", uso: "Usado hoy 7:55" } ] },
  { id: "no", nombre: "Nahuel Ortiz", correo: "nahuel.ortiz@example.com", estado: "activa", entro: "Entró ayer", autorizada: "Autorizado el 10/09/2026",
    sesiones: [ { id: "s8", disp: "Chrome en Android", tipo: "phone", cel: "c5", como: "Sin conexión", desde: "Entró ayer 18:10", uso: "Usada ayer 20:45" } ],
    huellas: [ { id: "h3", disp: "Chrome en Android", cel: "c5", vinculo: "Vinculado el 10/09/2026", uso: "Usado ayer 18:10" } ] },
  { id: "pg", nombre: "Pedro Giménez", correo: "pedro.gimenez@example.com", estado: "activa", nunca: true, entro: "Todavía no entró", autorizada: "Autorizado ayer",
    sesiones: [], huellas: [] },
  { id: "sa", nombre: "", correo: "sofia.acosta@example.com", estado: "activa", nunca: true, entro: "Todavía no entró", autorizada: "Autorizada hoy 9:10",
    sesiones: [], huellas: [] },
  { id: "cd", nombre: "Carla Domínguez", correo: "carla.dominguez@example.com", estado: "baja", entro: "Entró hace 2 meses", autorizada: "Dada de baja el 01/09/2026",
    sesiones: [], huellas: [] },
  { id: "dp", nombre: "Diego Pereyra", correo: "diego.pereyra@example.com", estado: "baja", entro: "Entró hace 4 meses", autorizada: "Dado de baja el 30/06/2026",
    sesiones: [], huellas: [] }
];
