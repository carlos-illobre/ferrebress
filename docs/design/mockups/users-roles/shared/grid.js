/* Variante 2 · La grilla: los cambios se juntan en un borrador y se guardan de una vez,
   viendo antes qué cambia (lo mismo que queda en la auditoría). Lo usan la computadora y el celular. */
(function () {
  var R = window.ROLES, G = window.GRID = {};
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  G.orig = clone(R.roles);
  G.origOf = function (id) { return G.orig.filter(function (r) { return r.id === id; })[0]; };

  // Lo que cambió, rol por rol: [{role, kind, pid?, from?, to?}]
  G.changes = function () {
    var out = [];
    R.roles.forEach(function (r) {
      var o = G.origOf(r.id);
      if (r.gone) { out.push({ role: r, kind: "del" }); return; }
      if (!o) { out.push({ role: r, kind: "new" }); return; }
      if (o.name !== r.name) out.push({ role: r, kind: "ren", from: o.name, to: r.name });
      r.perms.forEach(function (p) { if (o.perms.indexOf(p) < 0) out.push({ role: r, kind: "add", pid: p }); });
      o.perms.forEach(function (p) { if (r.perms.indexOf(p) < 0) out.push({ role: r, kind: "rem", pid: p }); });
    });
    return out;
  };
  G.cellState = function (r, pid) {
    var o = G.origOf(r.id); if (!o) return R.has(r, pid) ? "add" : "";
    var was = o.perms.indexOf(pid) >= 0, is = R.has(r, pid);
    return was === is ? "" : is ? "add" : "rem";
  };
  G.affected = function () {
    var s = {};
    G.changes().forEach(function (c) { c.role.people.forEach(function (p) { s[p] = 1; }); });
    return Object.keys(s).length;
  };
  G.needsReauth = function () { return G.changes().some(function (c) { return c.kind === "add" || c.kind === "new"; }); };
  G.problems = function () {
    var out = [];
    R.roles.forEach(function (r) {
      if (r.gone) return;
      var why = R.whyNotName(r.name, r); if (why) out.push({ role: r, msg: why });
      if (!r.perms.length) out.push({ role: r, msg: "«" + (r.name || "Rol nuevo") + "» necesita al menos un permiso." });
    });
    return out;
  };
  G.save = function () {
    R.roles = R.roles.filter(function (r) { return !r.gone; });
    R.roles.forEach(function (r) {
      var o = G.origOf(r.id);
      if (!o) r.last = "Rubén Paredes lo creó · recién";
      else if (JSON.stringify(o.perms) !== JSON.stringify(r.perms) || o.name !== r.name) r.last = "Rubén Paredes lo cambió · recién";
    });
    G.orig = clone(R.roles);
  };
  G.discard = function () { R.roles = clone(G.orig); };

  G.describe = function (c) {
    var n = R.esc(c.role.name || "Rol nuevo");
    if (c.kind === "add") return { sign: "mas", txt: "<b>" + n + "</b> ahora puede «" + R.perm(c.pid).name + "»" };
    if (c.kind === "rem") return { sign: "menos", txt: "<b>" + n + "</b> ya no puede «" + R.perm(c.pid).name + "»" };
    if (c.kind === "new") return { sign: "mas", txt: "Rol nuevo <b>" + n + "</b>: " + c.role.perms.map(function (p) { return "«" + R.perm(p).name + "»"; }).join(", ") };
    if (c.kind === "del") return { sign: "menos", txt: "Se borra <b>" + n + "</b>" };
    return { sign: "mas", txt: "«" + R.esc(c.from) + "» pasa a llamarse <b>" + n + "</b>" };
  };
  G.who = function (c) {
    var n = c.role.people.length;
    if (c.kind === "new" || c.kind === "del" || c.kind === "ren") return "";
    return n ? "Vale para " + R.names(c.role.people) + " desde su próximo pedido" : "Nadie lo tiene todavía";
  };
  G.listHTML = function () {
    return G.changes().map(function (c) {
      var d = G.describe(c), w = G.who(c);
      return '<li><span class="signo ' + d.sign + '"><i class="i i-s" data-i="' + (d.sign === "mas" ? "plus" : "minus") + '"></i></span><span>' + d.txt + (w ? "<small>" + w + "</small>" : "") + "</span></li>";
    }).join("");
  };
})();
