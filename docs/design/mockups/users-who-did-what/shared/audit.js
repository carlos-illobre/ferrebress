/* Quién hizo qué: los datos ficticios y las piezas que comparten las tres variantes.
   Es el miércoles 4 de noviembre a las 10:42. 45 acciones, de la más nueva a la más vieja.
   Nada de esto es lógica de verdad: alcanza para que la maqueta se toque y se vea. */
(function () {
  var HOY = "2026-11-04";
  var DIAS = { "2026-11-04": "Hoy", "2026-11-03": "Ayer", "2026-11-02": "Lunes 2", "2026-10-31": "Sábado 31", "2026-10-30": "Viernes 30", "2026-10-29": "Jueves 29", "2026-10-28": "Miércoles 28" };
  var DIAS_LARGO = { "2026-11-04": "Hoy, miércoles 4 de noviembre", "2026-11-03": "Ayer, martes 3 de noviembre", "2026-11-02": "Lunes 2 de noviembre", "2026-10-31": "Sábado 31 de octubre", "2026-10-30": "Viernes 30 de octubre", "2026-10-29": "Jueves 29 de octubre", "2026-10-28": "Miércoles 28 de octubre" };
  var DIAS_CORTO = { "2026-11-03": "ayer", "2026-11-02": "lun 2", "2026-10-31": "sáb 31", "2026-10-30": "vie 30", "2026-10-29": "jue 29", "2026-10-28": "mié 28" };

  // Las personas, con el nombre de hoy. «baja» y «borrada» también figuran en los filtros (R4.5).
  var PERSONAS = [
    { id: "rp", nombre: "Rubén Paredes", corto: "Rubén", ini: "RP", rol: "Administrador", vos: true },
    { id: "gb", nombre: "Graciela Benítez", corto: "Graciela", ini: "GB", rol: "Encargado de turno" },
    { id: "ms", nombre: "Martín Sosa", corto: "Martín", ini: "MS", rol: "Encargado de turno" },
    { id: "sl", nombre: "Sofía Ledesma", corto: "Sofía", ini: "SL", rol: "Cajero" },
    { id: "no", nombre: "Nahuel Ortiz", corto: "Nahuel", ini: "NO", rol: "Cajero", nueva: true },
    { id: "pg", nombre: "Pedro Giménez", corto: "Pedro", ini: "PG", rol: "Oficina y personal" },
    { id: "lf", nombre: "Lucía Fernández", corto: "Lucía", ini: "LF", rol: "Oficina y personal", estado: "baja" },
    { id: "cr", nombre: "Camila Ruiz", corto: "Camila", ini: "CR", rol: "—", estado: "borrada" }
  ];
  var ESPECIALES = [
    { id: "sys", nombre: "El sistema", corto: "El sistema", especial: "sys" },
    { id: "anon", nombre: "Alguien sin entrar", corto: "Sin entrar", especial: "anon" }
  ];
  var P = {}; PERSONAS.concat(ESPECIALES).forEach(function (p) { P[p.id] = p; });

  // Grupos y tipos (R2.1). Color: rojo lo que borra o saca; ámbar, rechazos y sin confirmar (R4.4).
  var GRUPOS = [
    { id: "entrar", nombre: "Entrar", icono: "log-in", tipos: { "entro-google": "Entró con Google", "entro-huella": "Entró con la huella", "vinculo": "Vinculó un celular", "salio": "Salió", "sesion-vencida": "Cerró una sesión vencida" } },
    { id: "usuarios", nombre: "Usuarios", icono: "users", tipos: { "autorizo": "Autorizó a una persona", "nombre": "Cambió un nombre", "alta": "Dio de alta", "baja": "Dio de baja", "borro-persona": "Borró una persona", "cerro-sesiones": "Cerró las sesiones de otro", "quito-huella": "Quitó un celular con huella", "corto-perdido": "Cortó un celular perdido" } },
    { id: "roles", nombre: "Roles", icono: "shield", tipos: { "dio-rol": "Dio un rol", "saco-rol": "Sacó un rol", "permisos-rol": "Cambió los permisos de un rol", "creo-rol": "Creó un rol", "borro-rol": "Borró un rol" } },
    { id: "offline", nombre: "Sin conexión", icono: "wifi-off", tipos: { "sin-conexion": "Entró sin conexión" } },
    { id: "rechazos", nombre: "Rechazos", icono: "ban", tipos: { "correo-no-aut": "Correo no autorizado", "huella-desconocida": "Huella que no se conoce", "codigo-vencido": "Código vencido", "sin-permiso": "Pedido sin permiso", "limite": "Límite de intentos" } }
  ];
  var GRUPO_DE = {}, TIPO = {};
  GRUPOS.forEach(function (g) { Object.keys(g.tipos).forEach(function (t) { GRUPO_DE[t] = g.id; TIPO[t] = g.tipos[t]; }); });
  var ROJO = ["baja", "borro-persona", "borro-rol", "cerro-sesiones", "quito-huella", "corto-perdido", "saco-rol"];
  var AMBAR_G = ["rechazos", "offline"];

  // Desde dónde (R2.6)
  var DESDE = {
    mostrador: { disp: "compu", nav: "Chrome en Windows", ip: "192.168.0.10" },
    oficina: { disp: "compu", nav: "Edge en Windows", ip: "192.168.0.12" },
    gb: { disp: "celu", nav: "Chrome en Android", ip: "192.168.0.31" },
    ms: { disp: "celu", nav: "Chrome en Android", ip: "192.168.0.34" },
    sl: { disp: "celu", nav: "Chrome en Android", ip: "192.168.0.36" },
    no: { disp: "celu", nav: "Samsung Internet en Android", ip: "192.168.0.40" },
    pg: { disp: "celu", nav: "Chrome en Android", ip: "186.12.204.77" },
    afuera1: { disp: "celu", nav: "Chrome en Android", ip: "203.0.113.48" },
    afuera2: { disp: "compu", nav: "Firefox en Linux", ip: "198.51.100.7" },
    afuera3: { disp: "celu", nav: "Safari en iPhone", ip: "198.51.100.23" },
    sys: { disp: "server", nav: "—", ip: "—" }
  };

  // A(día, hora, quién, tipo, texto, opciones). En el texto: {p:id} o {p:id|nombre de entonces} es una
  // persona que recibió la acción; {r:Nombre} es un rol.
  var n = 0;
  function A(dia, hora, quien, tipo, texto, o) {
    o = o || {};
    n++;
    return { id: "a" + n, dia: dia, hora: hora, quien: quien, quienEntonces: o.entonces, correo: o.correo, tipo: tipo, grupo: GRUPO_DE[tipo], texto: texto, desde: DESDE[o.desde || "mostrador"], cambios: o.cambios || [], nota: o.nota, sinConfirmar: o.sinConfirmar };
  }
  var D = "2026-11-04", Y = "2026-11-03", L = "2026-11-02", S = "2026-10-31", V = "2026-10-30", J = "2026-10-29", M = "2026-10-28";
  var ACCIONES = [
    A(D, "10:38", "gb", "salio", "Salió", { desde: "gb" }),
    A(D, "10:35", "rp", "permisos-rol", "Cambió los permisos de {r:Encargado de turno}", { cambios: [["Ver quién hizo qué", "No", "Sí"]] }),
    A(D, "10:31", "rp", "creo-rol", "Creó el rol {r:Depósito}", { cambios: [["Nombre", "—", "Depósito"], ["Descripción", "—", "Recibe mercadería y cuenta estanterías"], ["Permisos", "—", "Ver las personas"]] }),
    A(D, "10:26", "gb", "saco-rol", "Le sacó el rol {r:Cajero} a {p:ms}", { desde: "gb", cambios: [["Roles de Martín Sosa", "Cajero, Encargado de turno", "Encargado de turno"]] }),
    A(D, "10:20", "pg", "codigo-vencido", "Quiso vincular un celular con un código vencido", { desde: "pg", nota: [["Código", "Venció a las 10:18, 2 minutos antes"]] }),
    A(D, "10:14", "rp", "borro-rol", "Borró el rol {r:Solo mirar}", { cambios: [["Rol", "Solo mirar", "—"], ["Permisos", "Ver las personas", "—"]], nota: [["Quiénes lo tenían", "Nadie"]] }),
    A(D, "10:05", "rp", "baja", "Dio de baja a {p:lf}", { cambios: [["Estado", "Activa", "Dada de baja"], ["Sesiones abiertas", "2", "0"], ["Celulares con huella", "Moto E13", "—"]] }),
    A(D, "09:58", "anon", "huella-desconocida", "Probó entrar con una huella que no se conoce", { desde: "afuera3", nota: [["Celular", "iPhone 12, no vinculado"]] }),
    A(D, "09:41", "sl", "vinculo", "Vinculó un celular con huella", { desde: "sl", cambios: [["Celulares con huella", "—", "Motorola Edge 40"]] }),
    A(D, "09:40", "sl", "entro-google", "Entró con Google", { desde: "oficina" }),
    A(D, "09:30", "gb", "corto-perdido", "Cortó el celular perdido de {p:sl}", { desde: "gb", cambios: [["Celular con huella", "Samsung Galaxy A15", "—"], ["Sesiones de ese celular", "1", "0"]] }),
    A(D, "09:12", "rp", "permisos-rol", "Cambió los permisos de {r:Cajero}", { cambios: [["Ver las personas", "No", "Sí"]] }),
    A(D, "09:05", "gb", "dio-rol", "Le dio el rol {r:Encargado de turno} a {p:ms}", { desde: "gb", cambios: [["Roles de Martín Sosa", "Cajero", "Cajero, Encargado de turno"]] }),
    A(D, "08:52", "no", "sin-permiso", "Quiso cerrar las sesiones de {p:sl}", { desde: "no", nota: [["Le faltó", "«Cortar sesiones y huellas»"]] }),
    A(D, "08:47", "no", "entro-google", "Entró con Google por primera vez", { desde: "no" }),
    A(D, "08:31", "rp", "autorizo", "Autorizó a {p:no} con el rol {r:Cajero}", { cambios: [["Nombre", "—", "Nahuel Ortiz"], ["Roles", "—", "Cajero"]] }),
    A(D, "08:20", "rp", "nombre", "Le cambió el nombre a {p:ms|Martín}", { cambios: [["Nombre", "Martín", "Martín Sosa"]] }),
    A(D, "08:05", "ms", "sin-conexion", "Entró sin conexión", { entonces: "Martín", desde: "ms", sinConfirmar: true, nota: [["Hora", "08:05 según el celular; el servidor no la pudo confirmar"]] }),
    A(D, "08:02", "gb", "entro-huella", "Entró con la huella", { desde: "gb" }),
    A(D, "07:58", "rp", "entro-google", "Entró con Google"),

    A(Y, "23:16", "anon", "limite", "Llegó al límite de intentos: 15 minutos sin poder probar", { correo: "ventas.mostrador@ejemplo.com", desde: "afuera1", nota: [["Intentos", "5 en 2 minutos"]] }),
    A(Y, "23:14", "anon", "correo-no-aut", "Quiso entrar con un correo no autorizado", { correo: "ventas.mostrador@ejemplo.com", desde: "afuera1" }),
    A(Y, "18:02", "gb", "salio", "Salió", { desde: "gb" }),
    A(Y, "12:40", "rp", "alta", "Dio de alta a {p:pg}", { cambios: [["Estado", "Dado de baja", "Activo"]] }),
    A(Y, "08:15", "gb", "entro-huella", "Entró con la huella", { desde: "gb" }),
    A(Y, "08:01", "rp", "entro-google", "Entró con Google"),

    A(L, "19:30", "ms", "salio", "Salió", { entonces: "Martín", desde: "ms" }),
    A(L, "16:45", "sys", "sesion-vencida", "Cerró la sesión vencida de {p:lf}", { desde: "sys", nota: [["Por qué", "30 días sin usarse"]] }),
    A(L, "11:22", "rp", "cerro-sesiones", "Cerró las sesiones de {p:pg}", { cambios: [["Sesiones abiertas", "3", "0"]] }),
    A(L, "11:20", "rp", "quito-huella", "Quitó el celular con huella de {p:pg}", { cambios: [["Celulares con huella", "Moto G54", "—"]] }),
    A(L, "09:00", "gb", "dio-rol", "Le dio el rol {r:Cajero} a {p:sl}", { desde: "gb", cambios: [["Roles de Sofía Ledesma", "—", "Cajero"]] }),
    A(L, "08:10", "ms", "entro-huella", "Entró con la huella", { entonces: "Martín", desde: "ms" }),
    A(L, "07:55", "rp", "entro-google", "Entró con Google"),

    A(S, "22:40", "anon", "correo-no-aut", "Quiso entrar con un correo no autorizado", { correo: "<b>jefe</b>@ejemplo.com", desde: "afuera2" }),
    A(S, "13:05", "gb", "permisos-rol", "Cambió los permisos de {r:Encargado de turno}", { desde: "gb", cambios: [["Cortar sesiones y huellas", "No", "Sí"]] }),
    A(S, "09:12", "sl", "entro-google", "Entró con Google", { desde: "sl" }),
    A(S, "08:30", "gb", "entro-huella", "Entró con la huella", { desde: "gb" }),

    A(V, "17:44", "lf", "sin-permiso", "Quiso cambiar los permisos de {r:Cajero}", { desde: "oficina", nota: [["Le faltó", "«Administrar roles»"]] }),
    A(V, "15:10", "lf", "entro-google", "Entró con Google", { desde: "oficina" }),
    A(V, "10:30", "rp", "borro-persona", "Borró a {p:cr}, que nunca había entrado", { cambios: [["Persona", "Camila Ruiz", "—"], ["Roles", "Cajero", "—"]] }),
    A(V, "10:00", "rp", "autorizo", "Autorizó a {p:cr} con el rol {r:Cajero}", { cambios: [["Nombre", "—", "Camila Ruiz"], ["Roles", "—", "Cajero"]] }),

    A(J, "18:20", "anon", "huella-desconocida", "Probó entrar con una huella que no se conoce", { desde: "afuera3" }),
    A(J, "09:05", "rp", "dio-rol", "Le dio el rol {r:Oficina y personal} a {p:lf}", { cambios: [["Roles de Lucía Fernández", "—", "Oficina y personal"]] }),
    A(J, "09:00", "rp", "creo-rol", "Creó el rol {r:Oficina y personal}", { cambios: [["Nombre", "—", "Oficina y personal"], ["Permisos", "—", "Ver las personas, Administrar personas"]] }),

    A(M, "08:00", "rp", "entro-google", "Entró con Google")
  ];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function color(a) { return ROJO.indexOf(a.tipo) >= 0 ? "rojo" : (AMBAR_G.indexOf(a.grupo) >= 0 ? "ambar" : ""); }
  function persona(id) { return P[id]; }
  // Quién, con el nombre de entonces y «(hoy: …)» (R2.3)
  function quienTexto(a) {
    if (a.quien === "anon" && a.correo) return a.correo;
    var p = P[a.quien];
    return a.quienEntonces ? a.quienEntonces : p.nombre;
  }
  function hoyDe(a) { return a.quienEntonces ? P[a.quien].nombre : ""; }
  // Los que recibieron la acción
  function aQuien(a) {
    var r = [], m, re = /\{p:([a-z]+)(?:\|([^}]+))?\}/g;
    while ((m = re.exec(a.texto))) r.push({ id: m[1], entonces: m[2] });
    return r;
  }
  function roles(a) { var r = [], m, re = /\{r:([^}]+)\}/g; while ((m = re.exec(a.texto))) r.push(m[1]); return r; }
  // El texto con las personas tocables (E33) y los roles en negrita. Todo pasa por esc (E38).
  function textoHTML(a, opt) {
    opt = opt || {};
    return esc(a.texto).replace(/\{p:([a-z]+)(?:\|([^}]+))?\}/g, function (_, id, ent) {
      var p = P[id], nom = ent || p.nombre;
      var hoy = ent ? ' <span class="hoy">(hoy: ' + esc(p.nombre) + ')</span>' : "";
      var marca = p.estado === "baja" ? ' <span class="hoy">· de baja</span>' : p.estado === "borrada" ? ' <span class="hoy">· borrada</span>' : "";
      return '<button class="quien-a" data-a="' + id + '" title="Ver todo lo que le hicieron a ' + esc(p.nombre) + '">' + esc(nom) + hoy + '</button>' + (opt.marcas && a.tipo !== "baja" && a.tipo !== "borro-persona" ? marca : "");
    }).replace(/\{r:([^}]+)\}/g, function (_, r) { return '<b class="rol">' + r + '</b>'; });
  }
  function textoPlano(a) {
    return a.texto.replace(/\{p:([a-z]+)(?:\|([^}]+))?\}/g, function (_, id, ent) { return ent || P[id].nombre; }).replace(/\{r:([^}]+)\}/g, "$1");
  }
  function cuando(a) { return a.dia === HOY ? a.hora : DIAS_CORTO[a.dia] + " · " + a.hora; }
  function avatar(id, cls) {
    var p = P[id];
    if (id === "sys") return '<span class="avatar av-sys ' + (cls || "") + '" title="El sistema"><i class="i i-s" data-i="settings"></i></span>';
    if (id === "anon") return '<span class="avatar av-anon ' + (cls || "") + '" title="Alguien sin entrar"><i class="i i-s" data-i="user-x"></i></span>';
    var extra = p.vos ? " av-vos" : p.estado ? " av-baja" : "";
    return '<span class="avatar av-' + id + extra + ' ' + (cls || "") + '">' + p.ini + '</span>';
  }
  function dispIcono(a) { return a.desde.disp === "celu" ? "smartphone" : a.desde.disp === "server" ? "database" : "monitor"; }
  function dispTexto(a) { return a.desde.disp === "celu" ? "Celular" : a.desde.disp === "server" ? "El servidor" : "Computadora"; }

  // Filtros (R4.5): por, a, desde, hasta, grupo, tipo. Se combinan.
  var ORDEN_DIAS = ["2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"];
  var ATAJOS = {
    todo: { nombre: "Todo", desde: null, hasta: null },
    hoy: { nombre: "Hoy", desde: HOY, hasta: HOY },
    ayer: { nombre: "Ayer", desde: "2026-11-03", hasta: "2026-11-03" },
    semana: { nombre: "Esta semana", desde: "2026-11-02", hasta: HOY },
    mes: { nombre: "Este mes", desde: "2026-11-01", hasta: HOY }
  };
  function filtrar(f) {
    f = f || {};
    return ACCIONES.filter(function (a) {
      if (f.por && a.quien !== f.por) return false;
      if (f.a && !aQuien(a).some(function (x) { return x.id === f.a; })) return false;
      if (f.desde && a.dia < f.desde) return false;
      if (f.hasta && a.dia > f.hasta) return false;
      if (f.grupo && a.grupo !== f.grupo) return false;
      if (f.tipo && a.tipo !== f.tipo) return false;
      if (f.color && color(a) !== f.color) return false;
      return true;
    });
  }
  // Lo nuevo que aparece con «Actualizar» (R4.6): una acción que pasó mientras se miraba
  var NUEVAS = [
    A(D, "10:44", "no", "entro-huella", "Entró con la huella", { desde: "no" }),
    A(D, "10:45", "rp", "dio-rol", "Le dio el rol {r:Depósito} a {p:pg}", { cambios: [["Roles de Pedro Giménez", "Oficina y personal", "Oficina y personal, Depósito"]] })
  ];
  function traerNueva() {
    var a = NUEVAS.shift();
    if (!a) return null;
    ACCIONES.unshift(a);
    return a;
  }

  function vibrar(p) { try { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; if (navigator.vibrate && !matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate(p); } catch (e) {} }

  // Tostada (lenguaje común)
  function tostada(texto, icono) {
    var cont = document.querySelector(".tostadas");
    if (!cont) { cont = document.createElement("div"); cont.className = "tostadas"; (document.querySelector(".celu") || document.body).appendChild(cont); }
    var t = document.createElement("div");
    t.className = "tostada";
    t.innerHTML = '<i class="i" data-i="' + (icono || "circle-check") + '"></i><span></span>';
    t.querySelector("span").textContent = texto;
    cont.appendChild(t);
    if (window.pintarIconos) window.pintarIconos(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add("ver"); }); });
    setTimeout(function () { t.classList.remove("ver"); setTimeout(function () { t.remove(); }, 400); }, 2600);
  }

  // Sin conexión (R5.1): la luz del marco lo simula
  function conLuz() {
    document.querySelectorAll("[data-luz]").forEach(function (b) {
      b.addEventListener("click", function () {
        var off = document.body.classList.toggle("offline");
        document.querySelectorAll("[data-luz-texto]").forEach(function (t) { t.textContent = off ? "Sin conexión" : "En línea · todo enviado"; });
        if (!off) tostada("Volvió la conexión", "wifi");
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", conLuz); else conLuz();

  window.AU = {
    HOY: HOY, DIAS: DIAS, DIAS_LARGO: DIAS_LARGO, ORDEN_DIAS: ORDEN_DIAS, ATAJOS: ATAJOS,
    PERSONAS: PERSONAS, ESPECIALES: ESPECIALES, P: P, GRUPOS: GRUPOS, TIPO: TIPO, GRUPO_DE: GRUPO_DE,
    ACCIONES: ACCIONES, esc: esc, color: color, persona: persona, quienTexto: quienTexto, hoyDe: hoyDe,
    aQuien: aQuien, roles: roles, textoHTML: textoHTML, textoPlano: textoPlano, cuando: cuando, avatar: avatar,
    dispIcono: dispIcono, dispTexto: dispTexto, filtrar: filtrar, traerNueva: traerNueva, vibrar: vibrar, tostada: tostada
  };
})();
