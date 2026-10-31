/* Variante 3 · Decilo: cada rol es una frase que se toca, y lo que se dice o se escribe se
   convierte en una propuesta que se confirma. Lo comparten la computadora y el celular.
   Entender es de mentira: busca palabras conocidas en la frase. */
(function () {
  var R = window.ROLES, S = window.SAY = {};

  var KEYS = [
    ["roles", /administrar roles|armar (los )?roles|\broles\b/],
    ["cortar", /cortar|sesi[oó]n|sesiones|huella|celular|perdi/],
    ["adm", /administrar personas|dar de baja|dar de alta|baja|cambiar (el )?(nombre|correo)|borrar personas|autorizar/],
    ["ver", /\bver\b|mir[ae]r?|mire|vea|ver a las personas|solo mira/]
  ];
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); }
  function permsIn(t) { var out = []; KEYS.forEach(function (k) { if (k[1].test(t)) out.push(k[0]); }); return out; }
  function personIn(t) { return Object.keys(R.PEOPLE).filter(function (p) { return t.indexOf(norm(R.first(p))) >= 0; })[0]; }
  function roleIn(t) { return R.roles.filter(function (r) { var w = norm(r.name.split(" ")[0]); return t.indexOf(norm(r.name)) >= 0 || (w.length >= 6 && t.indexOf(w) >= 0); })[0]; }
  function rolesOf(p) { return R.roles.filter(function (r) { return r.people.indexOf(p) >= 0; }); }
  S.can = function (p, pid) { return rolesOf(p).some(function (r) { return R.has(r, pid); }); };

  S.SUGGEST = [
    "Que Pedro también pueda cortar sesiones y huellas",
    "Un rol Cajero que solo mire a las personas",
    "¿Quién puede administrar roles?",
    "Que Oficina y personal no pueda dar de baja"
  ];

  /* Devuelve { kind: "answer"|"choose"|"confirm"|"none", ... } */
  S.understand = function (raw) {
    var t = norm(raw), perms = permsIn(t), p = personIn(t), role = roleIn(t);
    if (/^(quien|quienes|¿quien)/.test(t.replace("¿", "")) && perms.length) {
      var pid = perms[0], who = Object.keys(R.PEOPLE).filter(function (x) { return S.can(x, pid); });
      var by = R.roles.filter(function (r) { return R.has(r, pid) && r.people.length; }).map(function (r) { return "«" + r.name + "»"; });
      return { kind: "answer", text: "«" + R.perm(pid).name + "» lo pueden " + who.length + ": " + R.names(who) + ". Se lo da " + by.join(" y ") + "." };
    }
    var neg = /\bno\b|sacale|saca|quitale|ya no/.test(t);
    var mNew = t.match(/(?:un |nuevo )?rol (?:que se llame |llamado )?([a-zñ ]+?) que /);
    if (mNew && !role) {
      var name = mNew[1].trim().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      var ps = perms.length ? perms : ["ver"];
      var draft = { perms: [] }; ps.forEach(function (x) { if (!R.has(draft, x)) R.toggle(draft, x); });
      return { kind: "confirm", gives: true, title: "Crear el rol «" + name + "»", lines: ["Un rol nuevo que puede " + draft.perms.map(function (x) { return R.perm(x).short; }).join(" y ") + ".", "Nadie lo tiene todavía: después decí a quién dárselo."],
        apply: function () { var id = "r" + Date.now(); R.roles.push({ id: id, name: name, perms: draft.perms, people: [], last: "Lo creaste recién" }); return id; } };
    }
    if (role && perms.length && !p) {
      var pid2 = perms[0];
      if (neg) {
        var why = R.whyNotRemove(role, pid2);
        if (!R.has(role, pid2)) return { kind: "answer", text: "«" + role.name + "» ya no puede " + R.perm(pid2).short + "." };
        if (why) return { kind: "answer", bad: true, text: why };
        return { kind: "confirm", gives: false, title: "Sacarle «" + R.perm(pid2).name + "» a " + role.name, lines: [R.peopleCount(role) + (role.people.length ? ": " + R.names(role.people) + " dejan de poder " + R.perm(pid2).short + " desde su próximo pedido." : ".")],
          apply: function () { R.toggle(role, pid2); return role.id; } };
      }
      if (R.has(role, pid2)) return { kind: "answer", text: "«" + role.name + "» ya puede " + R.perm(pid2).short + "." };
      return { kind: "confirm", gives: true, title: "Sumarle «" + R.perm(pid2).name + "» a " + role.name, lines: [role.people.length ? "Vale para " + R.names(role.people) + " desde su próximo pedido." : "Nadie lo tiene todavía."],
        apply: function () { R.toggle(role, pid2); return role.id; } };
    }
    if (p && perms.length) {
      var pid3 = perms[0], name3 = R.PEOPLE[p].name;
      if (neg) return { kind: "answer", text: "Para que " + R.first(p) + " no pueda algo, hay que sacarle el rol que se lo da (" + rolesOf(p).filter(function (r) { return R.has(r, pid3); }).map(function (r) { return "«" + r.name + "»"; }).join(", ") + ") o cambiar ese rol. Tocá su nombre en la frase del rol." };
      if (S.can(p, pid3)) return { kind: "answer", text: name3 + " ya puede " + R.perm(pid3).short + ", por «" + rolesOf(p).filter(function (r) { return R.has(r, pid3); })[0].name + "»." };
      var giving = R.roles.filter(function (r) { return R.has(r, pid3) && !r.fixed; });
      var mine = rolesOf(p)[0];
      var opts = giving.slice(0, 1).map(function (r) {
        var extra = r.perms.filter(function (x) { return !S.can(p, x) && x !== pid3; });
        return { title: "Darle «" + r.name + "»", gives: true, lines: ["Lo tienen " + R.names(r.people) + "." + (extra.length ? " También le da " + extra.map(function (x) { return R.perm(x).short; }).join(" y ") + "." : " No le da nada más.")], tag: "Solo cambia " + R.first(p),
          apply: function () { r.people.push(p); return r.id; } };
      });
      if (mine) opts.push({ title: "Sumarle «" + R.perm(pid3).name + "» a " + mine.name, gives: true, tag: "Cambia a " + mine.people.length + (mine.people.length === 1 ? " persona" : " personas"),
        lines: (function () { var o = mine.people.filter(function (x) { return x !== p; }); return [o.length ? "También van a poder hacerlo " + R.names(o) + ", que " + (o.length > 1 ? "tienen" : "tiene") + " el mismo rol." : "Nadie más tiene ese rol."]; })(),
        apply: function () { R.toggle(mine, pid3); return mine.id; } });
      return { kind: "choose", title: "Para que " + R.first(p) + " pueda " + R.perm(pid3).short + ", hay dos caminos", options: opts };
    }
    return { kind: "none", text: "No lo entendí del todo. Probá nombrando a una persona o a un rol y lo que tiene que poder hacer." };
  };

  /* La frase de un rol, con sus fichas tocables */
  S.sentence = function (r, opts) {
    opts = opts || {};
    var perms = r.perms.map(function (pid) {
      var tied = R.tied(r, pid);
      return '<span class="ficha perm' + (tied ? " atada" : "") + '" data-perm="' + pid + '" data-role="' + r.id + '" tabindex="0" role="button" aria-label="' + R.perm(pid).name + (tied ? " (incluido)" : ", tocá para sacarlo") + '"><i class="i i-s" data-i="' + R.perm(pid).icon + '"></i>' + R.perm(pid).short + (tied ? '<i class="i i-s" data-i="lock"></i>' : '<i class="i i-s x" data-i="x"></i>') + "</span>";
    });
    // Cada ficha va pegada a su coma o su punto, para que la puntuación no quede sola en un renglón
    function list(items, last) {
      return items.map(function (it, i) {
        var sep = i < items.length - 2 ? "," : i === items.length - 2 ? "" : last;
        return '<span class="nw">' + it + sep + "</span>" + (i === items.length - 2 ? " y " : " ");
      }).join("");
    }
    var missing = R.PERMS.filter(function (p) { return !R.has(r, p.id); });
    var addPerm = missing.length ? '<span class="ficha mas" data-addperm="' + r.id + '" tabindex="0" role="button"><i class="i i-s" data-i="plus"></i>algo más</span>' : "";
    var people = r.people.map(function (p) { return '<span class="ficha gente" data-person="' + p + '" data-role="' + r.id + '" tabindex="0" role="button" aria-label="' + R.PEOPLE[p].name + ', tocá para sacarle el rol">' + R.cara(p) + R.first(p) + '<i class="i i-s x" data-i="x"></i></span>'; });
    var free = Object.keys(R.PEOPLE).filter(function (p) { return r.people.indexOf(p) < 0; });
    var addPerson = free.length ? '<span class="ficha mas" data-addperson="' + r.id + '" tabindex="0" role="button"><i class="i i-s" data-i="plus"></i>alguien</span>' : "";
    return '<span class="quien-rol" data-name="' + r.id + '" tabindex="0" role="button" title="Tocá para cambiar el nombre">' + R.esc(r.name) + "</span> puede " +
      list(perms, addPerm ? "" : ".") + (addPerm ? '<span class="nw">' + addPerm + ".</span> " : "") +
      (r.people.length ? (r.people.length === 1 ? "Lo tiene " : "Lo tienen ") + list(people, addPerson ? "" : ".") : '<span class="nadie-txt">Nadie lo tiene.</span> ') +
      (addPerson ? '<span class="nw">' + addPerson + ".</span>" : "");
  };

  /* Así lo ve: qué aparece y qué no para quien tiene solo este rol (R7.7) */
  S.sees = function (r) {
    var h = function (x) { return R.has(r, x); };
    return [
      ["Usuarios, en Más", h("ver")],
      ["La tarjeta de cada persona, con sus sesiones", h("ver")],
      ["Cambiar nombres, dar de baja y de alta", h("adm")],
      ["Autorizar a alguien", h("adm") && h("roles")],
      ["Cerrar sesiones, quitar huellas, «Se perdió un celular»", h("cortar")],
      ["La pestaña Roles", h("roles")]
    ];
  };
})();
