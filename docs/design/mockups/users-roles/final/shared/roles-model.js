/* Roles · maqueta final: los datos inventados y las reglas que comparten la computadora y el
   celular (en la aplicación, esto va en negocio/; las pantallas solo muestran).
   Nadie de acá existe. Quien mira es Rubén Paredes, con el rol Administrador.
   Los grupos Vender, Catálogo y Depósito son de EJEMPLO, para ver cómo crece la lista cuando
   otros capítulos sumen sus permisos: hoy existen solo Usuarios y Sin conexión (R7.1). */
window.RolesModel = (function () {
  var ME = "rp";

  var PEOPLE = [
    { id: "rp", name: "Rubén Paredes", email: "ruben.paredes@example.com", active: true, tone: 0 },
    { id: "gb", name: "Graciela Benítez", email: "graciela.benitez@example.com", active: true, tone: 1 },
    { id: "lf", name: "Lucía Fernández", email: "lucia.fernandez@example.com", active: true, tone: 2 },
    { id: "ms", name: "Martín Sosa", email: "martin.sosa@example.com", active: true, tone: 3 },
    { id: "no", name: "Nahuel Ortiz", email: "nahuel.ortiz@example.com", active: true, tone: 4 },
    { id: "pg", name: "Pedro Giménez", email: "pedro.gimenez@example.com", active: true, tone: 1 },
    { id: "sa", name: "", email: "sofia.acosta@example.com", active: true, tone: 2 },
    { id: "cd", name: "Carla Domínguez", email: "carla.dominguez@example.com", active: false, tone: 0 }
  ];

  /* Un grupo por parte de la aplicación, en el orden del menú. */
  var GROUPS = [
    { id: "sales", name: "Vender", icon: "shopping-cart", detail: "Cobrar, descuentos y anulaciones", example: true, perms: [
      { id: "sell", icon: "banknote", name: "Vender", short: "Vender", exp: "Armar una venta y cobrarla." },
      { id: "discount", icon: "percent", name: "Hacer descuentos", exp: "Bajar el precio de un renglón o de toda la venta." },
      { id: "void", icon: "ban", name: "Anular una venta", exp: "Anular una venta ya cobrada, con su motivo." },
      { id: "all-sales", icon: "receipt", name: "Ver las ventas de todos", exp: "Ver las ventas de hoy de cualquier persona, no solo las propias." }
    ] },
    { id: "catalog", name: "Catálogo", icon: "tags", detail: "Productos, precios y costos", example: true, perms: [
      { id: "products", icon: "package-plus", name: "Cargar productos", exp: "Crear y cambiar productos, sus fotos y sus códigos." },
      { id: "prices", icon: "badge-dollar-sign", name: "Cambiar precios", exp: "Cambiar los precios y las listas de precios." },
      { id: "costs", icon: "coins", name: "Ver los costos", exp: "Ver lo que costó cada producto y su margen." }
    ] },
    { id: "stock", name: "Depósito", icon: "package", detail: "Stock, compras y conteos", example: true, perms: [
      { id: "see-stock", icon: "boxes", name: "Ver el stock", exp: "Ver cuánto hay de cada producto y dónde está." },
      { id: "purchases", icon: "truck", name: "Cargar compras", exp: "Recibir mercadería y cargar la factura del proveedor." },
      { id: "count", icon: "clipboard-list", name: "Contar", exp: "Contar una estantería y corregir el stock." }
    ] },
    { id: "users", name: "Usuarios", icon: "users", detail: "Personas, sesiones y roles", perms: [
      { id: "see-people", icon: "eye", name: "Ver las personas", exp: "Abrir Usuarios: la lista y la tarjeta de cada persona, con sus sesiones y sus celulares con huella." },
      { id: "manage-people", icon: "user-cog", name: "Administrar personas", includes: "see-people", exp: "Cambiar el nombre y el correo, borrar, dar de baja y de alta; autorizar, junto con «Administrar roles»." },
      { id: "cut-sessions", icon: "scissors", name: "Cortar sesiones y huellas", includes: "see-people", exp: "Cerrar una sesión o todas, quitar un celular con huella y «Se perdió un celular» de cualquier persona." },
      { id: "manage-roles", icon: "shield", name: "Administrar roles", includes: "see-people", exp: "Abrir la pestaña Roles, armar los roles y darles o quitarles roles a las personas." }
    ] },
    { id: "offline", name: "Sin conexión", icon: "wifi-off", detail: "Entrar con la huella cuando se corta internet", perms: [
      { id: "work-offline", icon: "wifi-off", name: "Trabajar sin conexión", exp: "Prender en su celular la entrada con la huella sin conexión." }
    ] }
  ];

  var ALL_PERMS = [];
  GROUPS.forEach(function (g) { g.perms.forEach(function (p) { p.group = g.id; ALL_PERMS.push(p); }); });

  var roles = [
    { id: "admin", name: "Administrador", description: "Todo: lo de cada parte, las personas y los roles.", icon: "shield-check", fixed: true,
      perms: ALL_PERMS.map(function (p) { return p.id; }), people: ["rp", "gb"] },
    { id: "cashier", name: "Cajero", description: "Atiende el mostrador y cobra; no ve costos.", icon: "users",
      perms: ["sell", "discount", "see-stock", "work-offline"], people: ["lf", "sa"] },
    { id: "shift", name: "Encargado de turno", description: "Abre y cierra el local; corta el celular de quien lo pierde.", icon: "users",
      perms: ["sell", "discount", "void", "all-sales", "see-stock", "count", "see-people", "cut-sessions", "work-offline"], people: ["gb", "lf", "ms", "cd"] },
    { id: "office", name: "Oficina y personal", description: "Altas, bajas y datos de las personas; precios y compras.", icon: "users",
      perms: ["products", "prices", "costs", "purchases", "see-people", "manage-people"], people: ["no", "pg"] },
    { id: "viewer", name: "Solo mirar", description: "", icon: "users", perms: ["see-stock", "see-people"], people: [] }
  ];

  function person(id) { return PEOPLE.filter(function (p) { return p.id === id; })[0]; }
  function perm(id) { return ALL_PERMS.filter(function (p) { return p.id === id; })[0]; }
  function role(id) { return roles.filter(function (r) { return r.id === id; })[0]; }
  function display(p) { return p.name || p.email; }
  function firstName(p) { return p.name ? p.name.split(" ")[0] : p.email; }
  function initials(p) {
    var w = (p.name || p.email).split(/[ .@]/).filter(Boolean);
    return ((w[0] || "?")[0] + ((w[1] || "")[0] || "")).toUpperCase();
  }
  /* Sin distinguir mayúsculas ni acentos (R7.12, R7.3). */
  function fold(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function list(names) { return names.length <= 1 ? names.join("") : names.slice(0, -1).join(", ") + " y " + names[names.length - 1]; }

  /* «Lo tienen» cuenta solo a las personas activas (R4.3). */
  function holders(r) { return r.people.filter(function (id) { return person(id).active; }); }
  function inactiveHolders(r) { return r.people.filter(function (id) { return !person(id).active; }); }
  function sortedRoles() {
    return roles.slice().sort(function (a, b) { return (b.fixed ? 1 : 0) - (a.fixed ? 1 : 0) || a.name.localeCompare(b.name, "es"); });
  }

  /* R7.12: nombre o descripción del rol, nombre de un permiso, nombre o correo de alguien que lo tiene. */
  function search(text) {
    var q = fold(text);
    if (!q) return sortedRoles();
    return sortedRoles().filter(function (r) {
      if (fold(r.name).indexOf(q) >= 0 || fold(r.description).indexOf(q) >= 0) return true;
      if (r.perms.some(function (id) { return fold(perm(id).name).indexOf(q) >= 0; })) return true;
      return holders(r).some(function (id) { var p = person(id); return fold(p.name).indexOf(q) >= 0 || fold(p.email).indexOf(q) >= 0; });
    });
  }

  /* ---------- El borrador: nada se guarda hasta «Guardar rol» (R7.13) ---------- */
  function draftFrom(r) {
    if (!r) return { id: null, name: "", description: "", icon: "users", perms: [], people: [], original: { name: "", description: "", perms: [], people: [] } };
    return { id: r.id, name: r.name, description: r.description, icon: r.icon, fixed: !!r.fixed, perms: r.perms.slice(), people: r.people.slice(),
      original: { name: r.name, description: r.description, perms: r.perms.slice(), people: r.people.slice() } };
  }
  /* Duplicar (E38): un rol nuevo con los mismos permisos y un nombre para cambiar, sin personas. */
  function duplicateDraft(d) {
    var n = draftFrom(null);
    n.name = "Copia de " + d.name.trim();
    n.description = d.description;
    n.perms = d.perms.slice();
    return n;
  }
  function sameSet(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; }); }
  function isDirty(d) {
    var o = d.original;
    return d.name !== o.name || d.description !== o.description || !sameSet(d.perms, o.perms) || !sameSet(d.people, o.people);
  }
  /* «Ver las personas» va incluido en los otros tres de Usuarios (R7.1, E36). */
  function tiedBy(d, pid) {
    return ALL_PERMS.filter(function (p) { return p.includes === pid && d.perms.indexOf(p.id) >= 0; });
  }
  function togglePerm(d, pid) {
    var i = d.perms.indexOf(pid);
    if (i >= 0) { if (tiedBy(d, pid).length) return false; d.perms.splice(i, 1); }
    else {
      d.perms.push(pid);
      var p = perm(pid);
      if (p.includes && d.perms.indexOf(p.includes) < 0) d.perms.push(p.includes);
    }
    return true;
  }
  function groupCount(d, g) { return g.perms.filter(function (p) { return d.perms.indexOf(p.id) >= 0; }).length; }
  function added(d) { return d.people.filter(function (id) { return d.original.people.indexOf(id) < 0; }); }
  function removed(d) { return d.original.people.filter(function (id) { return d.people.indexOf(id) < 0; }); }
  function addedPerms(d) { return d.perms.filter(function (id) { return d.original.perms.indexOf(id) < 0; }); }
  /* Lo que da acceso pide Google o la huella (R3.8): crear un rol, darlo o sumarle un permiso. */
  function givesAccess(d) { return !d.id || added(d).length > 0 || addedPerms(d).length > 0; }

  /* Lo que tendría una persona si se guardara el borrador. */
  function permsAfter(pid, d) {
    var out = [];
    roles.forEach(function (r) {
      var mine = r.id === d.id ? d.people.indexOf(pid) >= 0 : r.people.indexOf(pid) >= 0;
      var perms = r.id === d.id ? d.perms : r.perms;
      if (mine) perms.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
    });
    if (!d.id && d.people.indexOf(pid) >= 0) d.perms.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
    return out;
  }
  function rolesOf(pid, exceptId) { return roles.filter(function (r) { return r.id !== exceptId && r.people.indexOf(pid) >= 0; }); }

  /* Todo lo que no deja guardar (R7.3, R7.5, E56, R1.3): cuál y por qué, para decirlo en su lugar. */
  function validate(d) {
    var e = { name: null, perms: null, perm: {}, people: {}, count: 0 };
    var name = d.name.trim();
    if (!name) e.name = "Ponele un nombre al rol.";
    else {
      /* R7.3: sin distinguir mayúsculas (los acentos sí cuentan) */
      var dup = roles.filter(function (r) { return r.id !== d.id && r.name.trim().toLowerCase() === name.toLowerCase(); })[0];
      if (dup) e.name = "Ya hay un rol que se llama «" + dup.name + "»: elegí otro nombre.";
    }
    if (!d.perms.length) e.perms = "Tildá al menos un permiso: un rol sin permisos no se guarda.";
    ["manage-people", "manage-roles"].forEach(function (pid) {
      var hadIt = rolesOf(ME).some(function (r) { return r.perms.indexOf(pid) >= 0; });
      if (!hadIt || permsAfter(ME, d).indexOf(pid) >= 0) return;
      if (removed(d).indexOf(ME) >= 0) e.people[ME] = "No te podés sacar este rol: te da «" + perm(pid).name + "». Lo tiene que hacer otra persona.";
      else e.perm[pid] = "No te podés quitar «" + perm(pid).name + "» a vos: lo tiene que hacer otra persona.";
    });
    removed(d).forEach(function (id) {
      var p = person(id);
      if (!p.active || e.people[id]) return;
      if (!rolesOf(id, d.id).length) e.people[id] = display(p) + " se quedaría sin ningún rol, y cada persona activa tiene al menos uno. Para que no pueda hacer nada, se la da de baja.";
    });
    e.count = (e.name ? 1 : 0) + (e.perms ? 1 : 0) + Object.keys(e.perm).length + Object.keys(e.people).length;
    return e;
  }

  /* Guarda todo junto (E62, E63). */
  function save(d) {
    var r = d.id ? role(d.id) : null;
    if (!r) { r = { id: "r" + Date.now(), icon: "users" }; roles.push(r); d.id = r.id; }
    r.name = d.name.trim(); r.description = d.description.trim(); r.perms = d.perms.slice(); r.people = d.people.slice();
    return r;
  }
  /* R7.3, R7.4, R4.3: Administrador no se borra; un rol que alguien tiene, tampoco. */
  function whyNotDelete(r) {
    if (r.fixed) return "Administrador no se borra: se puede renombrar y cambiarle los permisos.";
    if (!r.people.length) return null;
    var act = holders(r).map(function (id) { return firstName(person(id)); });
    var off = inactiveHolders(r).map(function (id) { return display(person(id)) + " (dada de baja)"; });
    return "No se puede borrar: lo tiene" + (act.length + off.length > 1 ? "n " : " ") + list(act.concat(off)) + ". Primero hay que sacárselo.";
  }
  function remove(r) { roles.splice(roles.indexOf(r), 1); }
  /* «Darle este rol a…»: las personas activas que todavía no lo tienen en el borrador. */
  function candidates(d, text) {
    var q = fold(text);
    return PEOPLE.filter(function (p) {
      return p.active && d.people.indexOf(p.id) < 0 && (!q || fold(p.name).indexOf(q) >= 0 || fold(p.email).indexOf(q) >= 0);
    });
  }

  return {
    ME: ME, PEOPLE: PEOPLE, GROUPS: GROUPS, roles: roles,
    person: person, perm: perm, role: role, display: display, firstName: firstName, initials: initials, esc: esc, plural: plural, list: list,
    holders: holders, inactiveHolders: inactiveHolders, sortedRoles: sortedRoles, search: search,
    draftFrom: draftFrom, duplicateDraft: duplicateDraft, isDirty: isDirty, tiedBy: tiedBy, togglePerm: togglePerm, groupCount: groupCount,
    added: added, removed: removed, givesAccess: givesAccess, validate: validate, save: save, whyNotDelete: whyNotDelete, remove: remove,
    candidates: candidates,
    quiet: function () { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  };
})();
/* El ui.js del celular usa UA.quieto para no vibrar con «reducir movimiento». */
window.UA = window.UA || { quieto: function () { return window.RolesModel.quiet(); } };
