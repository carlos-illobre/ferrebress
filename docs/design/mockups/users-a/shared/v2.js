/* Variante 2 · «Personas y aparatos». Dos miradas sobre lo mismo: las personas como pases
   (con sus aparatos a la vista) y los aparatos abiertos de todos, con el atajo «Se perdió un
   celular». Autorizar es escribir un correo arriba y Enter, sin diálogo. */
(function () {
  var CELU = document.body.classList.contains("es-celu");
  var P = window.PERSONAS, esc = UA.esc;
  var MIN = { s6: 0, s2: 5, s7: 12, s1: 20, s3: 60, s5: 120, s8: 900, s4: 13000 };
  var vista = "personas", abierta = CELU ? "gb" : null;
  var cont = document.getElementById("vista");

  function corto(d) { return d.replace("Chrome en ", "").replace("Edge en ", "").replace("Safari en ", ""); }
  function tile(p, it, huella) {
    return '<button class="tile' + (huella ? " huella" : "") + '" data-p="' + p.id + '" data-' + (huella ? "h" : "s") + '="' + it.id + '" title="' + it.disp + '">' +
      '<span class="ti"><i class="i" data-i="' + (huella ? "fingerprint" : it.tipo === "phone" ? "smartphone" : "monitor") + '"></i>' + (it.vivo ? '<b class="vivo"></b>' : "") + "</span>" +
      '<span class="tt"><b>' + corto(it.disp) + "</b><span>" + (huella ? "Con huella" : it.uso.replace("Usada ", "")) + "</span></span></button>";
  }
  function avatar(p, cls) {
    var baja = p.estado === "baja";
    return '<span class="avatar ' + (cls || "") + (baja ? " baja" : "") + '" style="' + UA.tono(p) + '">' + (baja ? '<i class="i i-s" data-i="ban"></i>' : UA.iniciales(p)) + "</span>";
  }
  function resumenCorto(p) {
    var a = [];
    if (p.sesiones.length) a.push(UA.plural(p.sesiones.length, "sesión", "sesiones"));
    if (p.huellas.length) a.push(UA.plural(p.huellas.length, "huella", "huellas"));
    return a.join(" · ");
  }

  function pase(p) {
    var vos = p.estado === "vos";
    var h = '<article class="pase' + (p.nunca ? " nunca" : "") + (abierta === p.id ? " abierto" : "") + '" data-p="' + p.id + '">' +
      '<header class="pase-cab" data-abrir="' + p.id + '">' + avatar(p, "a48") +
      '<div class="pq"><b>' + esc(UA.mostrar(p)) + (vos ? ' <span class="pastilla vos">Vos</span>' : "") + "</b><span>" + (p.nombre ? esc(p.correo) : "Sin nombre todavía") + "</span></div>" +
      (CELU ? '<span class="cuenta-c">' + resumenCorto(p) + "</span>" : "") +
      '<button class="btn btn-fantasma btn-icono chico" data-menu="' + p.id + '" aria-label="Más acciones"><i class="i" data-i="ellipsis-vertical"></i></button></header>' +
      '<div class="pase-linea"><span class="pastilla pino adm"><i class="i i-s" data-i="shield-check"></i>Administrador</span><span class="ult' + (p.nunca ? " nu" : "") + '">' + p.entro + "</span></div>";
    if (p.nunca) {
      h += '<div class="estrenar"><i class="i" data-i="mail"></i><span>Avisale que entre con Google con este correo. Hasta que entre, el correo se puede cambiar.</span></div>' +
        '<div class="pase-pie"><button class="btn chico btn-suave" data-acc="editar" data-p="' + p.id + '"><i class="i i-s" data-i="pencil"></i>Corregir</button><button class="btn chico btn-peligro" data-acc="borrar" data-p="' + p.id + '"><i class="i i-s" data-i="trash-2"></i>Borrar el alta</button></div>';
    } else {
      var tiles = p.sesiones.map(function (s) { return tile(p, s, false); }).join("") + p.huellas.map(function (x) { return tile(p, x, true); }).join("");
      h += '<div class="dock">' + (tiles || '<span class="sin">Sin sesiones abiertas en otros aparatos</span>') +
        (vos ? '<span class="sin nota-vos">Este aparato no figura: se cierra con «Salir». Tus huellas van en Configuración.</span>' : "") + "</div>";
    }
    return h + "</article>";
  }

  function pintarPersonas(nuevo) {
    UA.ordenar();
    var act = P.filter(function (p) { return p.estado !== "baja"; }), baja = P.filter(function (p) { return p.estado === "baja"; });
    var h = '<div class="pases">' + act.map(pase).join("") + "</div>";
    if (baja.length) h += '<section class="estante"><div class="est-cab"><i class="i i-s" data-i="ban"></i>Dadas de baja <span>' + baja.length + '</span><span class="t-detalle">No entran. Al darlas de alta entran con la misma cuenta.</span></div><div class="est-fila">' +
      baja.map(function (p) { return '<div class="ficha-baja" data-p="' + p.id + '">' + avatar(p, "a32") + '<span class="fb"><b>' + esc(UA.mostrar(p)) + "</b><span>" + esc(p.correo) + " · " + p.entro + '</span></span><button class="btn chico" data-acc="alta" data-p="' + p.id + '"><i class="i i-s" data-i="user-check"></i>Dar de alta</button></div>'; }).join("") + "</div></section>";
    cont.innerHTML = h;
    if (nuevo) { var n = cont.querySelector('.pase[data-p="' + nuevo + '"]'); if (n) { n.classList.add("entra", "recien"); n.scrollIntoView({ block: "nearest" }); } }
    window.pintarIconos(cont);
  }

  function todasLasSesiones() {
    var a = [];
    P.forEach(function (p) { p.sesiones.forEach(function (s) { a.push({ p: p, s: s, m: MIN[s.id] != null ? MIN[s.id] : 1 }); }); });
    return a.sort(function (x, y) { return x.m - y.m; });
  }
  function pintarAparatos() {
    var ses = todasLasSesiones(), grupo = "", h = '<div class="aparatos"><div class="ap-lista">';
    ses.forEach(function (o) {
      var g = o.m <= 60 ? "En la última hora" : o.m <= 600 ? "Hoy" : "Antes";
      if (g !== grupo) { grupo = g; h += '<div class="grupo">' + g + "</div>"; }
      h += '<div class="ap" data-s="' + o.s.id + '"><span class="ti"><i class="i" data-i="' + (o.s.tipo === "phone" ? "smartphone" : "monitor") + '"></i>' + (o.s.vivo ? '<b class="vivo"></b>' : "") + "</span>" +
        '<span class="apt"><b>' + o.s.disp + '</b><span>' + o.s.como + " · " + o.s.desde + "</span></span>" +
        '<span class="duenio">' + avatar(o.p, "a28") + "<span>" + esc(UA.mostrar(o.p)) + (o.p.estado === "vos" ? " (vos)" : "") + (CELU ? " · " + o.s.uso.replace("Usada ", "") : "") + "</span></span>" +
        '<span class="uso">' + o.s.uso.replace("Usada ", "") + "</span>" +
        '<button class="btn chico btn-suave" data-acc="cerrar" data-p="' + o.p.id + '" data-s="' + o.s.id + '">Cerrar</button></div>';
    });
    if (!ses.length) h += '<div class="sin">No hay sesiones abiertas en otros aparatos.</div>';
    h += '</div><aside class="ap-lado"><div class="perdido"><span class="ico-p"><i class="i i-l" data-i="smartphone"></i></span><div><b>¿Se perdió o le robaron un celular?</b><span>Elegís de quién era y lo cortás de una: deja de entrar, no aprueba entradas y no trabaja sin conexión.</span></div>' +
      '<button class="btn btn-oscuro" data-acc="perdido"><i class="i i-s" data-i="power"></i>Cortar un celular' + (CELU ? "" : ' <span class="kbd">Alt C</span>') + "</button></div>" +
      '<div class="hu"><div class="grupo">Celulares con huella</div>';
    var hs = []; P.forEach(function (p) { p.huellas.forEach(function (x) { hs.push({ p: p, x: x }); }); });
    h += hs.map(function (o) { return '<div class="ap chico-ap" data-h="' + o.x.id + '"><span class="ti"><i class="i" data-i="fingerprint"></i></span><span class="apt"><b>' + esc(UA.mostrar(o.p)) + "</b><span>" + o.x.disp + " · " + o.x.uso.replace("Usado ", "") + '</span></span><button class="btn chico btn-suave" data-acc="quitar" data-p="' + o.p.id + '" data-h="' + o.x.id + '">Quitar</button></div>'; }).join("") || '<div class="sin">Nadie tiene celulares con huella.</div>';
    h += "</div></aside></div>";
    cont.innerHTML = h;
    window.pintarIconos(cont);
  }

  function pintar(nuevo) {
    if (vista === "personas") pintarPersonas(nuevo); else pintarAparatos();
    var act = P.filter(function (p) { return p.estado !== "baja"; }), ses = 0, hu = 0;
    act.forEach(function (p) { ses += p.sesiones.length; hu += p.huellas.length; });
    document.querySelectorAll("[data-n=personas]").forEach(function (e) { e.textContent = act.length; });
    document.querySelectorAll("[data-n=aparatos]").forEach(function (e) { e.textContent = ses; });
  }

  function cambiarVista(v) {
    vista = v;
    document.querySelectorAll("[data-vista]").forEach(function (b) { b.classList.toggle("elegido", b.dataset.vista === v); });
    document.body.dataset.vista = v;
    cont.classList.remove("cambia"); void cont.offsetWidth; cont.classList.add("cambia");
    pintar();
  }
  document.querySelectorAll("[data-vista]").forEach(function (b) { b.addEventListener("click", function () { cambiarVista(b.dataset.vista); }); });

  /* ---- El detalle de un aparato (globo en la compu, hoja en el celular) ---- */
  var globo = document.getElementById("globo");
  function abrirAparato(btn) {
    var p = UA.buscar(btn.dataset.p), it, h;
    if (btn.dataset.s) {
      it = p.sesiones.filter(function (x) { return x.id === btn.dataset.s; })[0];
      h = '<div class="g-cab"><span class="ti"><i class="i" data-i="' + (it.tipo === "phone" ? "smartphone" : "monitor") + '"></i></span><div><b>' + it.disp + "</b><span>Sesión de " + esc(UA.mostrar(p)) + "</span></div></div>" +
        '<dl><dt>Cómo entró</dt><dd>' + it.como + "</dd><dt>Cuándo</dt><dd>" + it.desde.replace("Entró ", "") + "</dd><dt>Último uso</dt><dd>" + it.uso.replace("Usada ", "") + "</dd></dl>" +
        '<button class="btn btn-peligro" data-acc="cerrar" data-p="' + p.id + '" data-s="' + it.id + '"><i class="i i-s" data-i="log-out"></i>Cerrar esta sesión</button><span class="t-detalle">Ese aparato vuelve a la entrada con su próximo pedido.</span>';
    } else {
      it = p.huellas.filter(function (x) { return x.id === btn.dataset.h; })[0];
      h = '<div class="g-cab"><span class="ti"><i class="i" data-i="fingerprint"></i></span><div><b>' + it.disp + "</b><span>Celular con huella de " + esc(UA.mostrar(p)) + "</span></div></div>" +
        "<dl><dt>Vinculado</dt><dd>" + it.vinculo.replace("Vinculado ", "") + "</dd><dt>Último uso</dt><dd>" + it.uso.replace("Usado ", "") + "</dd></dl>" +
        '<button class="btn btn-peligro" data-acc="quitar" data-p="' + p.id + '" data-h="' + it.id + '"><i class="i i-s" data-i="unlink"></i>Quitar este celular</button><span class="t-detalle">Deja de entrar con la huella y sin conexión; se cierra su sesión. Se arregla vinculándolo de nuevo.</span>';
    }
    globo.querySelector(".g-in").innerHTML = h;
    window.pintarIconos(globo);
    if (CELU) { UI.abrir(globo); return; }
    var r = btn.getBoundingClientRect();
    globo.style.left = Math.min(r.left, window.innerWidth - 336) + "px";
    globo.style.top = (r.bottom + 8 + 300 > window.innerHeight ? r.top - 8 - globo.offsetHeight : r.bottom + 8) + "px";
    globo.classList.add("abierto");
  }
  function cerrarGlobo() { if (CELU) UI.cerrar(); else globo.classList.remove("abierto"); }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { cerrarGlobo(); cerrarMenu(); } });
  document.addEventListener("click", function (e) {
    if (!CELU && !e.target.closest("#globo, .tile")) globo.classList.remove("abierto");
    if (!e.target.closest("#menu, [data-menu]")) cerrarMenu();
  });

  /* ---- Menú de la persona ---- */
  var menu = document.getElementById("menu"), menuDe = null;
  function abrirMenu(btn) {
    var p = UA.buscar(btn.dataset.menu); menuDe = p;
    var it = [];
    it.push('<button data-acc="editar" data-p="' + p.id + '"><i class="i i-s" data-i="pencil"></i>' + (p.nunca ? "Cambiar el nombre o el correo" : "Cambiar el nombre") + "</button>");
    if (!p.nunca) it.push('<div class="m-nota"><i class="i i-s" data-i="lock-keyhole"></i>El correo quedó atado a su cuenta de Google</div>');
    if (p.sesiones.length) it.push('<button data-acc="todas" data-p="' + p.id + '"><i class="i i-s" data-i="log-out"></i>Cerrar todas sus sesiones</button>');
    if (p.estado === "vos") it.push('<div class="m-nota"><i class="i i-s" data-i="info"></i>Darte de baja lo hace otro Administrador</div>');
    else if (p.nunca) it.push('<button class="rojo" data-acc="borrar" data-p="' + p.id + '"><i class="i i-s" data-i="trash-2"></i>Borrar el alta</button>');
    else it.push('<button class="rojo" data-acc="baja" data-p="' + p.id + '"><i class="i i-s" data-i="user-x"></i>Dar de baja…</button>');
    menu.innerHTML = it.join("");
    window.pintarIconos(menu);
    if (CELU) { menu.classList.add("hoja"); UI.abrir(menu); return; }
    var r = btn.getBoundingClientRect();
    menu.style.left = (r.right - 300) + "px"; menu.style.top = (r.bottom + 4) + "px";
    menu.classList.add("abierto");
  }
  function cerrarMenu() { if (!CELU) menu.classList.remove("abierto"); }

  /* ---- Acciones ---- */
  document.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-menu]"))) { e.stopPropagation(); abrirMenu(t); return; }
    if ((t = e.target.closest(".tile"))) { abrirAparato(t); return; }
    if (CELU && (t = e.target.closest("[data-abrir]")) && !e.target.closest("button")) {
      abierta = abierta === t.dataset.abrir ? null : t.dataset.abrir;
      cont.querySelectorAll(".pase").forEach(function (x) { x.classList.toggle("abierto", x.dataset.p === abierta); });
      UA.vibrar(10); return;
    }
    if (!(t = e.target.closest("[data-acc]"))) return;
    var p = t.dataset.p ? UA.buscar(t.dataset.p) : null, a = t.dataset.acc;
    cerrarMenu();
    if (a === "cerrar") {
      var s = p.sesiones.filter(function (x) { return x.id === t.dataset.s; })[0];
      cerrarGlobo(); salir('[data-s="' + s.id + '"]', function () { p.sesiones.splice(p.sesiones.indexOf(s), 1); pintar(); UI.tostada("Sesión cerrada · " + s.disp + " de " + UA.mostrar(p)); UA.vibrar([10, 40, 10]); });
    }
    if (a === "quitar") {
      var x = p.huellas.filter(function (y) { return y.id === t.dataset.h; })[0];
      cerrarGlobo(); salir('[data-h="' + x.id + '"]', function () { p.huellas.splice(p.huellas.indexOf(x), 1); p.sesiones = p.sesiones.filter(function (s) { return !(s.tipo === "phone" && s.como === "Huella"); }); pintar(); UI.tostada("Celular quitado. Su sesión también se cerró", "unlink"); });
    }
    if (a === "alta") { p.estado = "activa"; p.autorizada = "Dada de alta hoy"; pintar(p.id); UI.tostada(UA.mostrar(p) + " puede entrar otra vez", "user-check"); }
    if (a === "borrar") { UI.cerrar(); salir('.pase[data-p="' + p.id + '"]', function () { P.splice(P.indexOf(p), 1); pintar(); UI.tostada("Se borró el alta de " + p.correo, "trash-2"); }); }
    if (a === "editar") editar(p);
    if (a === "todas") confirmar("todas", p);
    if (a === "baja") confirmar("baja", p);
    if (a === "perdido") perdido();
  });
  function salir(sel, despues) {
    var els = cont.querySelectorAll(sel);
    if (!els.length) return despues();
    els.forEach(function (el) { el.classList.add("sale"); });
    setTimeout(despues, 200);
  }

  /* ---- Autorizar en una línea ---- */
  var compo = document.getElementById("compo"), cCorreo = document.getElementById("c-correo"), cNombre = document.getElementById("c-nombre");
  compo.addEventListener("submit", function (e) {
    e.preventDefault();
    var c = cCorreo.value.trim(), err = compo.querySelector(".err span");
    if (!UA.esCorreo(c)) { err.textContent = "No tiene forma de correo: falta algo como «@gmail.com»."; compo.classList.add("mal"); cCorreo.focus(); return; }
    if (UA.yaEsta(c)) { err.textContent = "Ese correo ya está cargado (sin importar mayúsculas)."; compo.classList.add("mal"); cCorreo.focus(); return; }
    var id = "n" + Date.now();
    P.push({ id: id, nombre: cNombre.value.trim(), correo: c, estado: "activa", nunca: true, entro: "Todavía no entró", autorizada: "Autorizada recién", sesiones: [], huellas: [] });
    cCorreo.value = ""; cNombre.value = ""; compo.classList.remove("lleno", "mal");
    if (vista !== "personas") cambiarVista("personas");
    pintar(id); UI.tostada("Autorizada. Avisale que entre con Google", "user-check"); UA.vibrar(10);
    if (CELU) document.body.classList.remove("componiendo");
  });
  cCorreo.addEventListener("input", function () { compo.classList.remove("mal"); compo.classList.toggle("lleno", cCorreo.value.length > 0); });
  cCorreo.addEventListener("focus", function () { if (CELU) document.body.classList.add("componiendo"); });
  var cancelar = document.getElementById("c-cancelar");
  if (cancelar) cancelar.addEventListener("click", function () { cCorreo.value = ""; cNombre.value = ""; compo.classList.remove("lleno", "mal"); document.body.classList.remove("componiendo"); });

  /* ---- Editar (nombre y, si nunca entró, correo) ---- */
  var ed = document.getElementById("editar"), eNom = document.getElementById("e-nombre"), eCor = document.getElementById("e-correo"), editando;
  function editar(p) {
    editando = p; eNom.value = p.nombre; eCor.value = p.correo; eCor.disabled = !p.nunca;
    ed.querySelector(".campo-real.cor").classList.remove("mal");
    ed.querySelector(".cor .ayuda").textContent = p.nunca ? "Se puede cambiar porque todavía no entró." : "Ya entró: su cuenta de Google quedó atada. Para otra cuenta, autorizá el correo nuevo y dale de baja a este.";
    eNom.placeholder = p.nunca ? "Vacío: se ve su correo" : "Vacío: vuelve al nombre de Google";
    UI.abrir(ed);
  }
  ed.addEventListener("submit", function (e) {
    e.preventDefault();
    var p = editando, c = eCor.value.trim();
    if (p.nunca && (!UA.esCorreo(c) || (c.toLowerCase() !== p.correo.toLowerCase() && UA.yaEsta(c)))) {
      ed.querySelector(".cor .err span").textContent = !UA.esCorreo(c) ? "No tiene forma de correo." : "Ese correo ya está cargado.";
      ed.querySelector(".campo-real.cor").classList.add("mal"); return;
    }
    p.nombre = eNom.value.trim(); if (p.nunca) p.correo = c;
    UI.cerrar(); pintar(); UI.tostada("Guardado", "check");
  });

  /* ---- Confirmaciones ---- */
  var dlg = document.getElementById("confirmar"), pend;
  function confirmar(tipo, p) {
    pend = { tipo: tipo, p: p }; var n = UA.mostrar(p);
    if (tipo === "baja") {
      dlg.querySelector("h2").textContent = "¿Dar de baja a " + n + "?";
      dlg.querySelector(".lead").textContent = "Lo saca de todo. Sigue en el estante de abajo y lo podés dar de alta.";
      dlg.querySelector(".consecuencias").innerHTML = '<li><i class="i" data-i="log-out"></i><span>' + (p.sesiones.length ? "Se cierran sus <b>" + UA.plural(p.sesiones.length, "sesión", "sesiones") + "</b>." : "No tiene sesiones abiertas.") + "</span></li>" +
        '<li><i class="i" data-i="fingerprint"></i><span>' + (p.huellas.length ? "Se quita" + (p.huellas.length > 1 ? "n" : "") + " <b>" + UA.plural(p.huellas.length, "celular con huella", "celulares con huella") + "</b> y deja de trabajar sin conexión." : "No tiene celulares con huella.") + "</span></li>" +
        '<li><i class="i" data-i="ban"></i><span>Ya no entra: ve lo mismo que una cuenta no autorizada.</span></li>';
      dlg.querySelector(".btn-rojo").innerHTML = '<i class="i i-s" data-i="user-x"></i>Dar de baja';
    } else {
      dlg.querySelector("h2").textContent = p.sesiones.length === 1 ? "¿Cerrar la sesión de " + n + "?" : "¿Cerrar las " + p.sesiones.length + " sesiones de " + n + "?";
      dlg.querySelector(".lead").textContent = p.estado === "vos" ? "Todas menos la de este aparato." : "Para cuando no sabés cuál es la del celular robado.";
      dlg.querySelector(".consecuencias").innerHTML = p.sesiones.map(function (s) { return '<li><i class="i" data-i="' + (s.tipo === "phone" ? "smartphone" : "monitor") + '"></i><span><b>' + s.disp + "</b> · " + s.uso + "</span></li>"; }).join("");
      dlg.querySelector(".btn-rojo").innerHTML = '<i class="i i-s" data-i="log-out"></i>Cerrar todas';
    }
    window.pintarIconos(dlg); UI.abrir(dlg);
  }
  dlg.querySelector(".btn-rojo").addEventListener("click", function () {
    var p = pend.p;
    if (pend.tipo === "baja") { p.estado = "baja"; p.sesiones = []; p.huellas = []; UI.cerrar(); salir('.pase[data-p="' + p.id + '"]', function () { pintar(); var f = cont.querySelector('.ficha-baja[data-p="' + p.id + '"]'); if (f) f.classList.add("entra"); UI.tostada(UA.mostrar(p) + " quedó dada de baja", "user-x"); }); }
    else { var n = p.sesiones.length; p.sesiones = []; UI.cerrar(); pintar(); UI.tostada(n === 1 ? "Se cerró la sesión" : "Se cerraron las " + n + " sesiones", "log-out"); }
    UA.vibrar([10, 40, 10]);
  });

  /* ---- Se perdió un celular: de quién → cortar ---- */
  var per = document.getElementById("perdido");
  function perdido() {
    var con = P.filter(function (p) { return p.estado !== "baja" && (p.huellas.length || p.sesiones.some(function (s) { return s.tipo === "phone"; })); });
    per.querySelector(".paso").innerHTML = '<h2>¿De quién era el celular?</h2><p class="lead">Aparecen solo quienes tienen un celular abierto o con huella.</p><div class="quienes">' +
      con.map(function (p) { return '<button class="quien-b" data-de="' + p.id + '">' + avatar(p, "a48") + "<b>" + esc(UA.mostrar(p)) + "</b><span>" + resumenCorto(p) + "</span></button>"; }).join("") + '</div><div class="pie-d"><button class="btn btn-fantasma" data-cerrar>Cancelar</button></div>';
    window.pintarIconos(per); UI.abrir(per);
  }
  per.addEventListener("click", function (e) {
    var b = e.target.closest("[data-de]"), c = e.target.closest("[data-cortar]");
    if (b) {
      var p = UA.buscar(b.dataset.de), cel = p.sesiones.filter(function (s) { return s.tipo === "phone"; });
      var paso = per.querySelector(".paso");
      paso.classList.remove("entra"); void paso.offsetWidth;
      paso.innerHTML = '<h2>Los celulares de ' + esc(UA.mostrar(p)) + '</h2><p class="lead">Se cortan todos juntos. Si después aparece, lo vincula de nuevo.</p><ul class="consecuencias">' +
        cel.map(function (s) { return '<li><i class="i" data-i="smartphone"></i><span><b>' + s.disp + "</b> · sesión abierta · " + s.uso + "</span></li>"; }).join("") +
        p.huellas.map(function (x) { return '<li><i class="i" data-i="fingerprint"></i><span><b>' + x.disp + "</b> · con huella · " + x.uso + "</span></li>"; }).join("") +
        '</ul><div class="pie-d"><button class="btn btn-fantasma" data-cerrar>Cancelar</button><button class="btn btn-rojo grande" data-cortar="' + p.id + '"><i class="i" data-i="power"></i>Cortar sus celulares</button></div>';
      paso.classList.add("entra"); window.pintarIconos(paso);
    }
    if (c) {
      var q = UA.buscar(c.dataset.cortar), n = q.huellas.length + q.sesiones.filter(function (s) { return s.tipo === "phone"; }).length;
      q.huellas = []; q.sesiones = q.sesiones.filter(function (s) { return s.tipo !== "phone"; });
      UI.cerrar(); pintar(); UI.tostada("Cortado: " + UA.plural(n, "cosa menos", "cosas menos") + " de " + UA.mostrar(q), "power"); UA.vibrar([10, 40, 10]);
    }
  });

  /* ---- Teclado ---- */
  document.addEventListener("keydown", function (e) {
    if (CELU) return;
    if (e.altKey && e.key === "1") { e.preventDefault(); cambiarVista("personas"); }
    if (e.altKey && e.key === "2") { e.preventDefault(); cambiarVista("aparatos"); }
    if (e.altKey && e.key.toLowerCase() === "n") { e.preventDefault(); cCorreo.focus(); }
    if (e.altKey && e.key.toLowerCase() === "c") { e.preventDefault(); perdido(); }
  });

  UI.conexion("[data-luz]", CELU ? "En línea" : "En línea · todo enviado", CELU ? "Sin conexión" : "Sin conexión · nada por enviar");
  pintar();
})();
