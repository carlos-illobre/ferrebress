/* Roles: datos ficticios y piezas de comportamiento que comparten las tres variantes.
   Sin lógica de verdad: lo justo para que la maqueta se toque y se vea lo que pasaría. */
(function () {
  var R = window.ROLES = {};

  // Los permisos que existen hoy (R7.1), agrupados por parte de la aplicación: los cuatro de
  // Usuarios (capítulo 02) y «Trabajar sin conexión» (capítulo 15, R1.2). Cada capítulo nuevo suma
  // su grupo.
  R.GROUPS = [
    { id: "users", name: "Usuarios", icon: "users", sub: "Las personas, sus roles, sesiones y huellas" },
    { id: "offline", name: "Sin conexión", icon: "wifi-off", sub: "Entrar con la huella sin internet" }
  ];
  R.PERMS = [
    { id: "ver", group: "users", name: "Ver las personas", short: "ver a las personas", icon: "eye",
      exp: "Abrir Usuarios: la lista y la tarjeta de cada persona, con sus sesiones y celulares con huella." },
    { id: "adm", group: "users", name: "Administrar personas", short: "administrar personas", icon: "user-cog", incl: "ver",
      exp: "Cambiar el nombre y el correo, borrar, dar de baja y de alta. Con «Administrar roles», autorizar." },
    { id: "cortar", group: "users", name: "Cortar sesiones y huellas", short: "cortar sesiones y huellas", icon: "scissors", incl: "ver",
      exp: "Cerrar una sesión o todas, quitar un celular con huella y «Se perdió un celular»." },
    { id: "roles", group: "users", name: "Administrar roles", short: "administrar roles", icon: "shield",
      exp: "Abrir Roles, armar los roles y darles o quitarles roles a las personas." },
    { id: "offline", group: "offline", name: "Trabajar sin conexión", short: "trabajar sin conexión", icon: "fingerprint",
      exp: "Prender en su celular la entrada con la huella sin internet, desde Más." }
  ];
  R.group = function (id) { return R.GROUPS.filter(function (g) { return g.id === id; })[0]; };
  R.permsOf = function (gid) { return R.PERMS.filter(function (p) { return p.group === gid; }); };
  R.countIn = function (role, gid) { return R.permsOf(gid).filter(function (p) { return R.has(role, p.id); }).length; };
  // La descripción del rol es optativa y de hasta 200 letras (R7.3)
  R.DESC_MAX = 200;

  R.PEOPLE = {
    RP: { name: "Rubén Paredes", tone: "p2", me: true },
    GB: { name: "Graciela Benítez", tone: "" },
    LF: { name: "Lucía Fernández", tone: "p1" },
    MS: { name: "Martín Sosa", tone: "p1" },
    NO: { name: "Nahuel Ortiz", tone: "p3" },
    PG: { name: "Pedro Giménez", tone: "" },
    SL: { name: "Sofía Ledesma", tone: "p3" }
  };

  R.roles = [
    { id: "admin", name: "Administrador", desc: "Los dueños: pueden todo y reparten los permisos.",
      perms: ["ver", "adm", "cortar", "roles", "offline"], people: ["RP", "GB"], fixed: true,
      last: "Lo creó la instalación" },
    { id: "enc", name: "Encargado de turno", desc: "Abre y cierra el local; corta el celular de quien lo pierde.",
      perms: ["ver", "cortar", "offline"], people: ["GB", "LF", "MS", "SL"],
      last: "Graciela Benítez le sumó «Cortar sesiones y huellas» · 12/10" },
    { id: "ofi", name: "Oficina y personal", desc: "Da de alta y de baja al personal y corrige sus datos.",
      perms: ["ver", "adm"], people: ["NO", "PG"],
      last: "Rubén Paredes lo creó · 03/09" },
    { id: "mira", name: "Solo mirar", desc: "", perms: ["ver"], people: [],
      last: "Rubén Paredes lo duplicó de «Oficina y personal» · ayer" }
  ];

  R.perm = function (id) { return R.PERMS.filter(function (p) { return p.id === id; })[0]; };
  R.role = function (id) { return R.roles.filter(function (r) { return r.id === id; })[0]; };
  R.has = function (role, pid) { return role.perms.indexOf(pid) >= 0; };
  // «Ver las personas» queda atado mientras esté «Administrar personas» o «Cortar sesiones y huellas»
  R.tied = function (role, pid) { return pid === "ver" && (R.has(role, "adm") || R.has(role, "cortar")); };
  R.tiedBy = function (role) {
    return R.PERMS.filter(function (p) { return p.incl === "ver" && R.has(role, p.id); }).map(function (p) { return "«" + p.name + "»"; }).join(" y ");
  };

  // ¿Se puede quitar este permiso? Devuelve el porqué si no (R1.3, R7.1).
  R.whyNotRemove = function (role, pid) {
    if (R.tied(role, pid)) return "Va incluido en " + R.tiedBy(role) + ": se destilda solo si sacás esos.";
    if ((pid === "adm" || pid === "roles") && role.people.indexOf("RP") >= 0) {
      var other = R.roles.some(function (r) { return r !== role && r.people.indexOf("RP") >= 0 && R.has(r, pid); });
      if (!other) return "No te podés sacar «" + R.perm(pid).name + "» a vos mismo: lo tiene que hacer otra persona.";
    }
    if (role.perms.length === 1) return "Un rol necesita al menos un permiso.";
    return null;
  };
  R.whyNotDelete = function (role) {
    if (role.fixed) return "Administrador no se borra: se puede renombrar y cambiar.";
    if (role.people.length) return "Lo tienen " + R.names(role.people) + ": primero hay que sacárselo.";
    return null;
  };
  R.whyNotName = function (name, except) {
    name = (name || "").trim();
    if (!name) return "Ponele un nombre.";
    var dup = R.roles.filter(function (r) { return r !== except && r.name.toLowerCase() === name.toLowerCase(); })[0];
    if (dup) return "Ya hay un rol que se llama «" + dup.name + "».";
    return null;
  };
  // Darle a una persona su único rol no se puede quitar (R7.5)
  R.whyNotUnassign = function (role, pid) {
    var count = R.roles.filter(function (r) { return r.people.indexOf(pid) >= 0; }).length;
    if (count <= 1) return R.PEOPLE[pid].name + " tiene solo este rol: tiene que quedar con uno. Para que no pueda nada, se la da de baja.";
    if (pid === "RP" && ["adm", "roles"].some(function (k) {
      return R.has(role, k) && !R.roles.some(function (r) { return r !== role && r.people.indexOf("RP") >= 0 && R.has(r, k); });
    })) return "No te podés sacar este rol a vos mismo: lo tiene que hacer otra persona.";
    return null;
  };

  R.toggle = function (role, pid) {
    var i = role.perms.indexOf(pid);
    if (i >= 0) role.perms.splice(i, 1);
    else {
      role.perms.push(pid);
      var p = R.perm(pid);
      if (p.incl && !R.has(role, p.incl)) role.perms.push(p.incl);
    }
    role.perms.sort(function (a, b) { return R.PERMS.indexOf(R.perm(a)) - R.PERMS.indexOf(R.perm(b)); });
  };

  R.first = function (pid) { return R.PEOPLE[pid].name.split(" ")[0]; };
  R.names = function (ids) {
    var n = ids.map(R.first);
    if (n.length <= 1) return n.join("");
    return n.slice(0, -1).join(", ") + " y " + n[n.length - 1];
  };
  R.cara = function (pid, cls) {
    var p = R.PEOPLE[pid];
    return '<span class="cara ' + (p.tone || "") + " " + (cls || "") + '" title="' + p.name + '">' + pid + "</span>";
  };
  R.pila = function (ids, max) {
    max = max || 4;
    if (!ids.length) return '<span class="nadie">Nadie</span>';
    var h = ids.slice(0, max).map(function (id) { return R.cara(id); }).join("");
    if (ids.length > max) h += '<span class="mas">+' + (ids.length - max) + "</span>";
    return '<span class="pila">' + h + "</span>";
  };
  R.permsCount = function (role) { return role.perms.length === 1 ? "1 permiso" : role.perms.length + " permisos"; };
  R.peopleCount = function (role) { var n = role.people.length; return n === 0 ? "Nadie lo tiene" : n === 1 ? "Lo tiene 1 persona" : "Lo tienen " + n + " personas"; };
  R.icons = function (root) { if (window.pintarIconos) window.pintarIconos(root); };
  R.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  var phone = function () { return !!document.querySelector(".celu"); };

  /* ---------- Diálogos y hojas: se cierran con su botón, tocando afuera y con Escape ---------- */
  var stack = [];
  function velo() {
    var v = document.querySelector(".velo");
    if (!v) {
      v = document.createElement("div"); v.className = "velo";
      (document.querySelector(".celu") || document.body).appendChild(v);
      v.addEventListener("click", function () { R.close(); });
    }
    return v;
  }
  R.open = function (el) {
    velo().classList.add("abierto");
    el.classList.add(el.classList.contains("hoja") ? "abierta" : "abierto");
    stack.push(el);
    var f = el.querySelector(phone() ? ".btn-accion, .btn" : "[autofocus], input, .btn-accion, .btn");
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
  };
  R.close = function () {
    var el = stack.pop();
    if (!el) return;
    el.classList.remove("abierta", "abierto");
    if (!stack.length) velo().classList.remove("abierto");
    if (el._onclose) { var f = el._onclose; el._onclose = null; f(); }
  };
  R.isOpen = function () { return stack.length > 0; };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && stack.length) { e.preventDefault(); R.close(); } });
  document.addEventListener("click", function (e) { if (e.target.closest("[data-cerrar]")) R.close(); });

  /* ---------- Tostada (con «Deshacer» opcional) ---------- */
  R.toast = function (msg, undo) {
    var box = document.querySelector(".tostadas");
    if (!box) { box = document.createElement("div"); box.className = "tostadas"; (document.querySelector(".celu") || document.body).appendChild(box); }
    var t = document.createElement("div"); t.className = "tostada"; t.setAttribute("role", "status");
    t.innerHTML = '<i class="i" data-i="circle-check"></i><span>' + msg + "</span>" + (undo ? '<button class="deshacer">Deshacer</button>' : "");
    box.appendChild(t); R.icons(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add("ver"); }); });
    if (undo) t.querySelector(".deshacer").addEventListener("click", function () { undo(); bye(); });
    if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
    var tm = setTimeout(bye, 4200);
    function bye() { clearTimeout(tm); t.classList.remove("ver"); setTimeout(function () { t.remove(); }, 320); }
  };

  /* ---------- Confirmar que sos vos (R3.8): lo que da acceso pide Google o la huella de hace menos de 5 min ---------- */
  var fresh = false;
  var GOOGLE = '<svg class="g" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>';
  R.reauth = function (what, then) {
    if (fresh) { then(); return; }
    var el = document.getElementById("reauth");
    if (!el) {
      el = document.createElement(phone() ? "section" : "div");
      el.id = "reauth"; el.className = (phone() ? "hoja" : "dialogo") + " reauth";
      el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
      (document.querySelector(".celu") || document.body).appendChild(el);
    }
    el.classList.remove("mirando", "listo");
    el.innerHTML = (phone() ? '<div class="asa"></div>' : "") +
      '<div class="sello"><i class="i" data-i="' + (phone() ? "fingerprint" : "shield-check") + '"></i></div>' +
      "<h2>Confirmá que sos vos</h2>" +
      "<p>Esto da acceso, y entraste hace 2 horas. " + (phone() ? "Poné la huella" : "Entrá con Google") + " y sigue solo.</p>" +
      '<div class="que"><i class="i" data-i="shield-plus"></i><span>' + what + "</span></div>" +
      '<div class="pie-d">' +
      '<button class="btn" data-cerrar>Cancelar</button>' +
      (phone()
        ? '<button class="btn btn-oscuro" data-ok><i class="i" data-i="fingerprint"></i>Poner la huella</button>'
        : '<button class="btn btn-oscuro btn-google" data-ok>' + GOOGLE + 'Continuar con Google</button>') +
      "</div>";
    R.icons(el);
    el.querySelector("[data-ok]").addEventListener("click", function () {
      el.classList.add("mirando");
      setTimeout(function () {
        el.classList.remove("mirando"); el.classList.add("listo");
        var s = el.querySelector(".sello"); s.innerHTML = '<i class="i" data-i="check"></i>'; R.icons(s);
        if (navigator.vibrate) try { navigator.vibrate([10, 40, 10]); } catch (e) {}
        setTimeout(function () { fresh = true; R.close(); then(); setTimeout(function () { fresh = false; }, 5 * 60 * 1000); }, 450);
      }, 900);
    });
    R.open(el);
  };

  /* ---------- Sin conexión (R2.2): la luz del marco simula el corte ---------- */
  document.addEventListener("click", function (e) {
    var l = e.target.closest("[data-luz], .celu-estado");
    if (!l) return;
    var off = document.body.classList.toggle("offline");
    document.querySelectorAll("[data-luz-texto], .celu-estado [data-luz]").forEach(function (t) { t.textContent = off ? "Sin conexión · 2 por enviar" : "En línea · todo enviado"; });
  });

  /* ---------- Apretar: el botón baja a 97 % (ya lo hace .btn); los atajos con Alt ---------- */
  // Las teclas se ven solo mientras Alt está apretado (00 · R2.9)
  document.addEventListener("keydown", function (e) { if (e.key === "Alt") { document.body.classList.add("alt"); e.preventDefault(); } });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") { document.body.classList.remove("alt"); e.preventDefault(); } });
  window.addEventListener("blur", function () { document.body.classList.remove("alt"); });
  R.keys = {};
  document.addEventListener("keydown", function (e) {
    if (!e.altKey || R.isOpen()) return;
    var f = R.keys[e.key.toLowerCase()];
    if (f) { e.preventDefault(); f(); }
  });
})();
