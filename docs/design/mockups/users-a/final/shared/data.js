/* Datos inventados para las tres variantes de Usuarios (etapa a). Nadie de acá existe.
   Orden de la lista (R3.1): la propia primero, después las activas y al final las dadas de baja,
   cada grupo por nombre. Quien se autorizó sin nombre se muestra con su correo (R3.4).
   Maqueta final: cada sesión de celular y cada huella dicen de qué celular son (cel), para que
   «Quitar» cierre la sesión de ese celular (R5.6) y «Se perdió un celular» corte uno solo (R5.7);
   «actual» marca la sesión del dispositivo que se está usando, que no figura (R5.2). */
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
  { id: "ms", nombre: "Martín Sosa", correo: "martin.sosa@example.com", estado: "activa", entro: "Entró hoy 7:58", autorizada: "Autorizada el 02/09/2026",
    sesiones: [
      { id: "s6", disp: "Chrome en Windows", tipo: "desktop", como: "Código QR", desde: "Entró hoy 7:58", uso: "Usada ahora", vivo: true },
      { id: "s7", disp: "Chrome en Android", tipo: "phone", cel: "c3", como: "Huella", desde: "Entró hoy 7:55", uso: "Usada hace 12 min", vivo: true },
      { id: "s9", disp: "Firefox en Android", tipo: "phone", cel: "c4", como: "Google", desde: "Entró el 20/10", uso: "Usada ayer 21:15" }
    ],
    huellas: [ { id: "h2", disp: "Chrome en Android", cel: "c3", vinculo: "Vinculado el 02/09/2026", uso: "Usado hoy 7:58" } ] },
  { id: "no", nombre: "Nahuel Ortiz", correo: "nahuel.ortiz@example.com", estado: "activa", entro: "Entró ayer", autorizada: "Autorizada el 10/09/2026",
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

window.UA = {
  mostrar: function (p) { return p.nombre || p.correo; },
  iniciales: function (p) {
    var n = p.nombre || p.correo;
    var w = n.split(/[ .@]/).filter(Boolean);
    return ((w[0] || "?")[0] + ((w[1] || "")[0] || "")).toUpperCase();
  },
  /* Un tono de avatar por persona, de los neutros y suaves del lenguaje (no compiten con las señales). */
  tono: function (p) {
    var t = ["#E3EEE8|#17614E", "#ECE9E1|#545955", "#FDEDE4|#B23E0E", "#E3DFD5|#1A1D1B", "#E2F4EA|#11764A"];
    var i = 0; for (var k = 0; k < p.id.length; k++) i += p.id.charCodeAt(k);
    var c = t[i % t.length].split("|"); return "background:" + c[0] + ";color:" + c[1];
  },
  esCorreo: function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim()); },
  yaEsta: function (s) { s = s.trim().toLowerCase(); return window.PERSONAS.some(function (p) { return p.correo.toLowerCase() === s; }); },
  ordenar: function () {
    var g = { vos: 0, activa: 1, baja: 2 };
    window.PERSONAS.sort(function (a, b) {
      return (g[a.estado] - g[b.estado]) || UA.mostrar(a).localeCompare(UA.mostrar(b), "es", { sensitivity: "base" });
    });
  },
  plural: function (n, uno, varios) { return n + " " + (n === 1 ? uno : varios); },
  buscar: function (id) { return window.PERSONAS.filter(function (p) { return p.id === id; })[0]; },
  quieto: function () { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; },
  vibrar: function (p) { try { if (navigator.vibrate && !UA.quieto()) navigator.vibrate(p); } catch (e) {} },
  esc: function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
};
