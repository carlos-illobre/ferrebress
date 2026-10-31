/* Sin permiso: los datos ficticios de las tres variantes.
   Matías Quiroga es vendedor. Abre Usuarios con un enlace que tenía guardado de cuando era
   encargado, o lo tenía abierto cuando Graciela le sacó «Encargado de turno». */
(function () {
  var D = window.NP = {};
  D.me = { id: "MQ", name: "Matías Quiroga", short: "Matías", roles: ["Vendedor"], before: ["Vendedor", "Encargado de turno"] };
  D.screen = "Usuarios";
  D.url = "ferrebress.com.ar/users";
  D.perm = { name: "Ver las personas", icon: "eye", exp: "Deja abrir Usuarios: la lista y la tarjeta de cada persona, con sus sesiones y sus celulares con huella." };
  D.first = { name: "Vender", icon: "shopping-cart", ir: "sales" };
  D.changedBy = { id: "GB", name: "Graciela Benítez", role: "Encargado de turno", when: "recién" };
  D.draft = { lines: 3, total: "48.000", what: "Tu venta en curso" };
  D.people = {
    RP: { name: "Rubén Paredes", tone: "p2" },
    GB: { name: "Graciela Benítez", tone: "" },
    LF: { name: "Lucía Fernández", tone: "p1" },
    MS: { name: "Martín Sosa", tone: "p1" },
    NO: { name: "Nahuel Ortiz", tone: "p3" },
    PG: { name: "Pedro Giménez", tone: "" },
    SL: { name: "Sofía Ledesma", tone: "p3" }
  };
  // Los roles que tienen «Ver las personas» (R7.7: «Lo tienen: <roles>»)
  D.holders = [
    { name: "Administrador", icon: "shield-check", people: ["RP", "GB"] },
    { name: "Encargado de turno", icon: "shield", people: ["GB", "LF", "MS", "SL"] },
    { name: "Oficina y personal", icon: "shield", people: ["NO", "PG"] }
  ];
  // Quién puede dárselo: los que tienen «Administrar roles» (fuera de la regla: es una ayuda)
  D.givers = ["RP", "GB"];
  // Lo que sí puede usar, en el orden del menú (la primera es a donde va)
  D.mine = [
    { name: "Vender", icon: "shopping-cart", ir: "sales", detail: "Tu venta: 3 renglones" },
    { name: "Ventas de hoy", icon: "receipt", ir: "today-sales", detail: "Las del mostrador" },
    { name: "Productos", icon: "tags", ir: "products", detail: "Buscar y ver precios" },
    { name: "Stock", icon: "package", ir: "stock", detail: "Cuánto hay y dónde" }
  ];

  D.roleNames = function () { return D.holders.map(function (h) { return h.name; }).join(", "); };
  D.uniquePeople = function () {
    var s = {}; D.holders.forEach(function (h) { h.people.forEach(function (p) { s[p] = 1; }); }); return Object.keys(s);
  };
  D.face = function (id, cls) { var p = D.people[id]; return '<span class="cara ' + (p.tone || "") + " " + (cls || "") + '" title="' + p.name + '">' + id + "</span>"; };
  D.pila = function (ids, max) {
    max = max || 4;
    var h = ids.slice(0, max).map(function (id) { return D.face(id); }).join("");
    if (ids.length > max) h += '<span class="mas">+' + (ids.length - max) + "</span>";
    return '<span class="pila">' + h + "</span>";
  };
  D.names = function (ids) {
    var n = ids.map(function (id) { return D.people[id].name; });
    return n.length > 1 ? n.slice(0, -1).join(", ") + " o " + n[n.length - 1] : n[0];
  };
  D.request = "Hola, soy " + D.me.name + ". Para abrir Usuarios en Ferrebress me falta «" + D.perm.name + "». ¿Me lo das?";
  D.copy = function (text) { try { navigator.clipboard && navigator.clipboard.writeText(text).catch(function () {}); } catch (e) {} };
})();
