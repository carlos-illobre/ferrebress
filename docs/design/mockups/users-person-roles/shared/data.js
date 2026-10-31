/* Datos inventados para «Los roles de una persona». Nadie de acá existe.
   Quien mira es Rubén Paredes, con el rol Administrador. Entró hace 2 horas: darle un rol a
   alguien le pide Google o la huella (R3.8); quitarlo, no. */
window.PERMISOS = [
  { id: "ver", grupo: "Usuarios", nombre: "Ver las personas", corto: "Ver a las personas", frase: "ver quién está autorizado y sus sesiones", ico: "eye" },
  { id: "per", grupo: "Usuarios", nombre: "Administrar personas", corto: "Administrar personas", frase: "dar de alta y de baja, y cambiar nombres y correos", ico: "user-check", incluye: "ver" },
  { id: "cor", grupo: "Usuarios", nombre: "Cortar sesiones y huellas", corto: "Cortar sesiones", frase: "cerrar sesiones y cortar un celular perdido", ico: "fingerprint", incluye: "ver" },
  { id: "rol", grupo: "Usuarios", nombre: "Administrar roles", corto: "Administrar roles", frase: "armar roles y repartirlos", ico: "key-round" },
  { id: "sin", grupo: "Sin conexión", nombre: "Trabajar sin conexión", corto: "Sin conexión", frase: "seguir trabajando cuando se corta internet", ico: "wifi-off" }
];

window.ROLES = [
  { id: "adm", nombre: "Administrador", desc: "Todo, también repartir los permisos", permisos: ["ver", "per", "cor", "rol", "sin"], metal: "laton" },
  { id: "enc", nombre: "Encargado de turno", desc: "Abre y cierra el local; corta un celular perdido", permisos: ["ver", "cor", "sin"], metal: "cobre" },
  { id: "ofi", nombre: "Oficina y personal", desc: "Da de alta y de baja; no reparte roles", permisos: ["ver", "per"], metal: "acero" },
  { id: "mos", nombre: "Mostrador", desc: "Atiende el mostrador y cobra; sigue sin internet", permisos: ["sin"], metal: "niquel" },
  { id: "mir", nombre: "Solo mirar", desc: "", permisos: ["ver"], metal: "pavon" }
];

window.PERSONAS = [
  { id: "rp", nombre: "Rubén Paredes", correo: "ruben.paredes@example.com", estado: "vos", entro: "Entró hace 2 horas", roles: ["adm"] },
  { id: "gb", nombre: "Graciela Benítez", correo: "graciela.benitez@example.com", estado: "activa", entro: "Entró hace 3 días", roles: ["adm"] },
  { id: "lf", nombre: "Lucía Fernández", correo: "lucia.fernandez@example.com", estado: "activa", entro: "Entró hace 5 días", roles: ["enc", "ofi"] },
  { id: "ms", nombre: "Martín Sosa", correo: "martin.sosa@example.com", estado: "activa", entro: "Entró hoy 7:58", roles: ["mos"] },
  { id: "no", nombre: "Nahuel Ortiz", correo: "nahuel.ortiz@example.com", estado: "activa", entro: "Entró ayer", roles: ["mos", "mir"] },
  { id: "pg", nombre: "Pedro Giménez", correo: "pedro.gimenez@example.com", estado: "activa", entro: "Todavía no entró", nunca: true, roles: ["mos"] },
  { id: "sa", nombre: "", correo: "sofia.acosta@example.com", estado: "activa", entro: "Todavía no entró", nunca: true, roles: ["mos"] },
  { id: "cd", nombre: "Carla Domínguez", correo: "carla.dominguez@example.com", estado: "baja", entro: "Entró hace 2 meses", roles: ["enc"] }
];

window.R = {
  rol: function (id) { return window.ROLES.find(function (r) { return r.id === id; }); },
  permiso: function (id) { return window.PERMISOS.find(function (p) { return p.id === id; }); },
  persona: function (id) { return window.PERSONAS.find(function (p) { return p.id === id; }); },
  mostrar: function (p) { return p.nombre || p.correo; },
  primer: function (p) { return (p.nombre || p.correo).split(/[ @.]/)[0]; },
  iniciales: function (p) {
    var w = (p.nombre || p.correo).split(/[ .@]/).filter(Boolean);
    return ((w[0] || "?")[0] + ((w[1] || "")[0] || "")).toUpperCase();
  },
  tono: function (p) {
    var t = ["#E3EEE8|#17614E", "#ECE9E1|#545955", "#FDEDE4|#B23E0E", "#E3DFD5|#1A1D1B", "#E2F4EA|#11764A"];
    var i = 0; for (var k = 0; k < p.id.length; k++) i += p.id.charCodeAt(k);
    var c = t[i % t.length].split("|"); return "background:" + c[0] + ";color:" + c[1];
  },
  /* Lo que puede quien tiene estos roles: la suma de sus permisos (R7.5). */
  puede: function (roles) {
    var s = {}; roles.forEach(function (id) { var r = window.R.rol(id); if (r) r.permisos.forEach(function (p) { s[p] = 1; }); });
    return window.PERMISOS.map(function (p) { return p.id; }).filter(function (p) { return s[p]; });
  },
  cuantos: function (rolId) { return window.PERSONAS.filter(function (p) { return p.estado !== "baja" && p.roles.indexOf(rolId) >= 0; }).length; },
  /* Las reglas que frenan un cambio: devuelve el motivo o "" si se puede. */
  frena: function (persona, nuevos) {
    if (persona.estado !== "baja" && nuevos.length === 0)
      return "Le tiene que quedar al menos un rol. Para que no pueda hacer nada, dala de baja.";
    var antes = window.R.puede(persona.roles), despues = window.R.puede(nuevos);
    if (persona.estado === "vos") {
      if (antes.indexOf("rol") >= 0 && despues.indexOf("rol") < 0) return "No te podés sacar «Administrar roles»: lo tiene que hacer otra persona.";
      if (antes.indexOf("per") >= 0 && despues.indexOf("per") < 0) return "No te podés sacar «Administrar personas»: lo tiene que hacer otra persona.";
    }
    return "";
  },
  suma: function (persona, nuevos) { return nuevos.filter(function (r) { return persona.roles.indexOf(r) < 0; }); },
  saca: function (persona, nuevos) { return persona.roles.filter(function (r) { return nuevos.indexOf(r) < 0; }); },
  ordenadas: function () {
    var g = { vos: 0, activa: 1, baja: 2 };
    return window.PERSONAS.slice().sort(function (a, b) {
      return g[a.estado] - g[b.estado] || window.R.mostrar(a).localeCompare(window.R.mostrar(b));
    });
  }
};
