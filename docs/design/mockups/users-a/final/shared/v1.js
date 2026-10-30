/* Usuarios · maqueta final: la variante 1 «La lista y la tarjeta» del director, con lo que piden
   las reglas y Carlos (ver ../changes.md). Un solo guion para la computadora y el celular:
   cambia la disposición (lista + tarjeta al costado / lista + tarjeta que entra desde la derecha),
   no lo que se puede hacer. */
(function () {
  var CELU = document.body.classList.contains("es-celu");
  var P = window.PERSONAS, esc = UA.esc;
  var elegido = CELU ? null : "gb";
  var filtro = "todas", texto = "";
  var lista = document.getElementById("lista");
  var ficha = document.getElementById("ficha");
  var DISP = CELU ? "phone" : "desktop";
  // Lo que se ve de cada persona: la sesión del dispositivo que se está usando no figura (R5.2) y
  // los celulares con huella propios tampoco (R5.5).
  function sesiones(p) { return p.sesiones.filter(function (s) { return s.actual !== DISP; }); }
  function huellas(p) { return p.estado === "vos" ? [] : p.huellas; }

  function cuenta(p) {
    var a = [];
    var ns = sesiones(p).length, nh = huellas(p).length;
    if (ns) a.push('<span class="cta" title="Sesiones abiertas"><i class="i i-s" data-i="monitor"></i>' + ns + "</span>");
    if (nh) a.push('<span class="cta" title="Celulares con huella"><i class="i i-s" data-i="fingerprint"></i>' + nh + "</span>");
    return a.join("");
  }

  function pasa(p) {
    if (filtro === "activas" && p.estado === "baja") return false;
    if (filtro === "nunca" && !p.nunca) return false;
    if (filtro === "baja" && p.estado !== "baja") return false;
    if (texto && (UA.mostrar(p) + " " + p.correo).toLowerCase().indexOf(texto) < 0) return false;
    return true;
  }

  function renglon(p) {
    var baja = p.estado === "baja";
    var ultimo = '<span class="ult' + (p.nunca ? " nunca" : "") + '">' + (p.nunca ? '<i class="i i-s" data-i="hourglass"></i>' : "") + p.entro + "</span>";
    // R3.1: también las dadas de baja llevan «Administrador» (en gris); «Dada de baja» va junto al nombre.
    var past = '<span class="pastilla pino adm' + (baja ? " baja" : "") + '"><i class="i i-s" data-i="shield-check"></i>Administrador</span>';
    var dada = baja ? ' <span class="pastilla dada"><i class="i i-s" data-i="ban"></i>Dada de baja</span>' : "";
    if (CELU) {
      return '<button class="fila' + (baja ? " baja" : "") + '" data-p="' + p.id + '">' +
        '<span class="avatar p' + (baja ? " baja" : "") + '" style="' + UA.tono(p) + '">' + (baja ? '<i class="i i-s" data-i="ban"></i>' : UA.iniciales(p)) + "</span>" +
        '<span class="cuerpo"><span class="nom">' + esc(UA.mostrar(p)) + (p.estado === "vos" ? ' <span class="pastilla vos">Vos</span>' : "") + dada + "</span>" +
        '<span class="det">' + (p.nombre ? esc(p.correo) : "Sin nombre todavía") + "</span>" +
        ultimo + '<span class="lin">' + past + cuenta(p) + "</span></span>" +
        '<span class="der"><i class="i" data-i="chevron-right"></i></span></button>';
    }
    return '<button class="fila' + (baja ? " baja" : "") + (p.id === elegido ? " elegida" : "") + '" data-p="' + p.id + '">' +
      '<span class="avatar p' + (baja ? " baja" : "") + '" style="' + UA.tono(p) + '">' + (baja ? '<i class="i i-s" data-i="ban"></i>' : UA.iniciales(p)) + "</span>" +
      '<span class="cuerpo"><span class="nom">' + esc(UA.mostrar(p)) + (p.estado === "vos" ? ' <span class="pastilla vos">Vos</span>' : "") + dada + "</span>" +
      '<span class="det">' + (p.nombre ? esc(p.correo) : "Sin nombre: se ve su correo hasta que entre") + "</span></span>" +
      past + '<span class="acc">' + ultimo + '<span class="ctas">' + cuenta(p) + "</span></span>" +
      '<i class="i flecha" data-i="chevron-right"></i></button>';
  }

  function pintarLista(nuevo) {
    UA.ordenar();
    var h = "", grupo = "";
    var vis = P.filter(pasa);
    vis.forEach(function (p) {
      var g = p.estado === "baja" ? "baja" : "activas";
      if (g !== grupo) {
        grupo = g;
        var n = vis.filter(function (x) { return (x.estado === "baja") === (g === "baja"); }).length;
        h += '<div class="grupo">' + (g === "baja" ? "Dadas de baja" : "Pueden entrar") + ' <span>' + n + "</span></div>";
      }
      h += renglon(p);
    });
    if (!vis.length) h = '<div class="vacio"><i class="i i-xl" data-i="search"></i><b>Nadie con «' + esc(texto) + '»</b><span>Buscá por nombre o por correo.</span></div>';
    lista.innerHTML = h;
    if (nuevo) { var f = lista.querySelector('[data-p="' + nuevo + '"]'); if (f) { f.classList.add("entra", "recien"); f.scrollIntoView({ block: "nearest" }); } }
    window.pintarIconos(lista);
    resumen();
  }

  function resumen() {
    var act = P.filter(function (p) { return p.estado !== "baja"; });
    var ses = 0, hu = 0; act.forEach(function (p) { ses += sesiones(p).length; hu += huellas(p).length; });
    var nunca = act.filter(function (p) { return p.nunca; }).length;
    var set = function (k, v) { document.querySelectorAll('[data-n="' + k + '"]').forEach(function (e) { if (e.textContent != v) { e.textContent = v; e.classList.remove("rueda"); void e.offsetWidth; e.classList.add("rueda"); } }); };
    set("activas", act.length); set("sesiones", ses); set("huellas", hu); set("nunca", nunca);
    set("c-todas", P.length); set("c-activas", act.length); set("c-nunca", nunca); set("c-baja", P.length - act.length);
  }

  function sesionHTML(s) {
    return '<div class="item" data-s="' + s.id + '"><span class="ico"><i class="i" data-i="' + (s.tipo === "phone" ? "smartphone" : "monitor") + '"></i>' + (s.vivo ? '<b class="vivo"></b>' : "") + "</span>" +
      '<span class="txt"><b>' + s.disp + '</b><span>' + s.como + " · " + s.desde + "</span><span>" + s.uso + "</span></span>" +
      '<button class="btn chico btn-suave" data-acc="cerrar" data-s="' + s.id + '">Cerrar</button></div>';
  }
  function huellaHTML(h) {
    return '<div class="item" data-h="' + h.id + '"><span class="ico"><i class="i" data-i="fingerprint"></i></span>' +
      '<span class="txt"><b>' + h.disp + '</b><span>' + h.vinculo + "</span><span>" + h.uso + "</span></span>" +
      '<button class="btn chico btn-suave" data-acc="quitar" data-h="' + h.id + '">Quitar</button></div>';
  }

  function pintarFicha(anim) {
    var p = UA.buscar(elegido);
    if (!p) { ficha.innerHTML = '<div class="vacio"><i class="i i-xl" data-i="users"></i><b>Elegí a alguien</b><span>Su tarjeta aparece acá.</span></div>'; window.pintarIconos(ficha); return; }
    var baja = p.estado === "baja", vos = p.estado === "vos";
    var k = CELU ? "" : ' <span class="kbd">';
    var h = '<div class="cab-ficha">' +
      (CELU ? '<button class="btn btn-fantasma btn-icono volver" data-acc="volver" aria-label="Volver"><i class="i i-l" data-i="chevron-left"></i></button>' : "") +
      '<span class="avatar grande' + (baja ? " baja" : "") + '" style="' + UA.tono(p) + '">' + (baja ? '<i class="i i-l" data-i="ban"></i>' : UA.iniciales(p)) + "</span>" +
      '<div class="quien"><div class="nombre-ed" data-campo="nombre"><span class="t-seccion">' + esc(UA.mostrar(p)) + '</span>' +
      '<button class="btn btn-fantasma btn-icono chico" data-acc="editar" data-campo="nombre" aria-label="Cambiar el nombre"><i class="i i-s" data-i="pencil"></i></button>' + "</div>" +
      '<div class="correo-ed" data-campo="correo"><span class="t-detalle">' + esc(p.correo) + "</span>" +
      (p.nunca ? '<button class="btn btn-fantasma btn-icono chico" data-acc="editar" data-campo="correo" aria-label="Cambiar el correo"><i class="i i-s" data-i="pencil"></i></button>'
               : '<span class="atado" title="Ya entró: su cuenta de Google quedó atada a ella. Para otra cuenta, autorizá el correo nuevo y dale de baja a este."><i class="i i-s" data-i="lock-keyhole"></i></span>') + "</div></div></div>" +
      '<div class="pastillas">' + (vos ? '<span class="pastilla vos">Vos</span>' : "") +
      '<span class="pastilla pino adm' + (baja ? " baja" : "") + '"><i class="i i-s" data-i="shield-check"></i>Administrador</span>' +
      (baja ? '<span class="pastilla dada"><i class="i i-s" data-i="ban"></i>Dada de baja</span>' : "") +
      '<span class="t-detalle">' + (p.nunca ? '<i class="i i-s" data-i="hourglass"></i> ' : "") + p.entro + " · " + p.autorizada + "</span></div>";

    if (p.nunca) {
      h += '<div class="aviso urgente"><i class="i" data-i="info"></i><span>Todavía no entró. Avisale que entre con Google con <b>' + esc(p.correo) + "</b>: Ferrebress no le manda ningún correo.</span></div>";
    } else if (baja) {
      h += '<div class="aviso pino"><i class="i" data-i="info"></i><span>No puede entrar: ve el mismo mensaje que una cuenta no autorizada. Si le das de alta, entra con su misma cuenta de Google; sus celulares con huella los vincula de nuevo.</span></div>';
    } else {
      var ses = sesiones(p);
      h += '<div class="sec"><div class="sec-cab"><span class="t-renglon">Sesiones abiertas <span class="n">' + ses.length + "</span></span>" +
        (ses.length ? '<button class="btn chico" data-acc="todas"><i class="i i-s" data-i="log-out"></i>Cerrar todas' + (CELU ? "" : ' <span class="kbd">Alt T</span>') + "</button>" : "") + "</div>" +
        (ses.length ? ses.map(sesionHTML).join("") : '<div class="nada">Sin sesiones abiertas en otros dispositivos.</div>') +
        (vos ? '<div class="nota"><i class="i i-s" data-i="info"></i>La sesión de ' + (CELU ? "este celular" : "esta computadora") + " no figura: se cierra con «Salir».</div>" : "") + "</div>";
      h += '<div class="sec"><div class="sec-cab"><span class="t-renglon">Celulares con huella <span class="n">' + (vos ? "" : p.huellas.length) + "</span></span></div>" +
        (vos ? '<div class="nota"><i class="i i-s" data-i="info"></i>Los tuyos van en Configuración.</div>'
             : (p.huellas.length ? p.huellas.map(huellaHTML).join("") : '<div class="nada">No vinculó ningún celular con huella.</div>')) + "</div>";
    }

    h += '<div class="pie-ficha">';
    if (vos) h += '<div class="nota"><i class="i i-s" data-i="info"></i>No te podés dar de baja vos: lo tiene que hacer otro Administrador.</div>';
    else if (baja) h += '<button class="btn" data-acc="alta"><i class="i i-s" data-i="user-check"></i>Dar de alta' + (CELU ? "" : ' <span class="kbd">Alt A</span>') + "</button>";
    else if (p.nunca) h += '<button class="btn btn-peligro" data-acc="borrar"><i class="i i-s" data-i="trash-2"></i>Borrar el alta' + (CELU ? "" : ' <span class="kbd">Alt B</span>') + '</button><span class="t-detalle">Nunca entró: se borra del todo.</span>';
    else h += '<button class="btn btn-peligro" data-acc="baja"><i class="i i-s" data-i="user-x"></i>Dar de baja' + (CELU ? "" : ' <span class="kbd">Alt B</span>') + "</button>";
    h += "</div>";

    ficha.innerHTML = '<div class="ficha-in' + (anim ? " fundido" : "") + '">' + h + "</div>";
    window.pintarIconos(ficha);
  }

  function elegir(id) {
    elegido = id;
    if (CELU) { pintarFicha(false); document.body.classList.add("con-ficha"); return; }
    lista.querySelectorAll(".fila").forEach(function (f) { f.classList.toggle("elegida", f.dataset.p === id); });
    pintarFicha(true);
  }

  /* ---- Lista: tocar, filtros, buscador ---- */
  lista.addEventListener("click", function (e) { var f = e.target.closest(".fila"); if (f) elegir(f.dataset.p); });
  document.querySelectorAll("[data-filtro]").forEach(function (c) {
    c.addEventListener("click", function () {
      filtro = c.dataset.filtro;
      document.querySelectorAll("[data-filtro]").forEach(function (x) { x.classList.toggle("elegido", x === c); });
      pintarLista();
    });
  });
  var buscador = document.getElementById("buscar");
  buscador.addEventListener("input", function () { texto = buscador.value.trim().toLowerCase(); pintarLista(); });

  /* ---- Acciones de la tarjeta ---- */
  function quitarItem(sel, despues) {
    var it = ficha.querySelector(sel);
    if (!it) return despues();
    it.classList.add("sale");
    setTimeout(despues, 200);
  }
  ficha.addEventListener("click", function (e) {
    var b = e.target.closest("[data-acc]"); if (!b) return;
    var p = UA.buscar(elegido), a = b.dataset.acc;
    if (a === "volver") { document.body.classList.remove("con-ficha"); return; }
    if (a === "cerrar") {
      var s = p.sesiones.filter(function (x) { return x.id === b.dataset.s; })[0];
      quitarItem('[data-s="' + s.id + '"].item', function () { p.sesiones.splice(p.sesiones.indexOf(s), 1); pintarFicha(); pintarLista(); UI.tostada("Sesión cerrada · " + s.disp); UA.vibrar([10, 40, 10]); });
    }
    if (a === "quitar") {
      var hh = p.huellas.filter(function (x) { return x.id === b.dataset.h; })[0];
      quitarItem('[data-h="' + hh.id + '"].item', function () {
        // R5.6: quitar la huella también cierra la sesión abierta en ese celular, si hay.
        var antes = p.sesiones.length;
        p.huellas.splice(p.huellas.indexOf(hh), 1);
        p.sesiones = p.sesiones.filter(function (x) { return x.cel !== hh.cel; });
        pintarFicha(); pintarLista();
        UI.tostada("Celular quitado: ya no entra con la huella" + (p.sesiones.length < antes ? " y se cerró su sesión" : ""), "fingerprint");
      });
    }
    if (a === "todas") confirmar("todas", p);
    if (a === "baja") confirmar("baja", p);
    if (a === "alta") { p.estado = "activa"; p.entro = p.entro; p.autorizada = "Dada de alta de nuevo hoy"; pintarLista(); pintarFicha(true); UI.tostada(UA.mostrar(p) + " puede entrar otra vez", "user-check"); }
    if (a === "borrar") {
      var f = lista.querySelector('[data-p="' + p.id + '"]'); if (f) f.classList.add("sale");
      setTimeout(function () { P.splice(P.indexOf(p), 1); elegido = CELU ? null : P[1].id; document.body.classList.remove("con-ficha"); pintarLista(); pintarFicha(true); UI.tostada("Se borró el alta de " + p.correo, "trash-2"); }, 200);
    }
    if (a === "editar") editar(p, b.dataset.campo);
  });

  function editar(p, campo) {
    var cont = ficha.querySelector('[data-campo="' + campo + '"]');
    var val = campo === "nombre" ? p.nombre : p.correo;
    cont.innerHTML = '<input class="ed" value="' + esc(val) + '" placeholder="' + (campo === "nombre" ? (p.nunca ? "Vacío: se ve su correo" : "Vacío: vuelve al de Google") : "correo@gmail.com") + '" aria-label="' + campo + '">' +
      '<span class="t-detalle ayuda-ed">Enter guarda · Esc cancela</span>';
    var inp = cont.querySelector("input"); inp.focus(); inp.select();
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); pintarFicha(); }
      if (e.key === "Enter") {
        var v = inp.value.trim();
        if (campo === "correo" && (!UA.esCorreo(v) || (v.toLowerCase() !== p.correo.toLowerCase() && UA.yaEsta(v)))) { cont.classList.add("mal"); cont.querySelector(".ayuda-ed").textContent = !UA.esCorreo(v) ? "No tiene forma de correo" : "Ese correo ya está cargado"; return; }
        if (campo === "nombre") p.nombre = v; else p.correo = v;
        pintarFicha(); pintarLista(); UI.tostada(campo === "nombre" ? (v ? "Nombre guardado" : "Nombre borrado: se ve " + (p.nunca ? "su correo" : "el de Google")) : "Correo cambiado: entra con la cuenta nueva", "check");
      }
    });
    inp.addEventListener("blur", function () { setTimeout(function () { if (document.activeElement !== inp && ficha.contains(inp)) pintarFicha(); }, 150); });
  }

  /* ---- Confirmaciones: dar de baja y cerrar todas ---- */
  var dlg = document.getElementById("confirmar");
  var pendiente = null;
  function confirmar(tipo, p) {
    pendiente = { tipo: tipo, p: p };
    var n = UA.mostrar(p);
    if (tipo === "baja") {
      dlg.querySelector("h2").textContent = "¿Dar de baja a " + n + "?";
      dlg.querySelector(".lead").textContent = "Lo saca de todo. Sigue en la lista y lo podés dar de alta cuando quieras.";
      dlg.querySelector(".consecuencias").innerHTML =
        '<li><i class="i" data-i="log-out"></i><span>' + (p.sesiones.length ? "Se cierran sus <b>" + UA.plural(p.sesiones.length, "sesión", "sesiones") + "</b>: cada dispositivo vuelve a la entrada con «Tu sesión se cerró desde otro dispositivo»." : "No tiene sesiones abiertas.") + "</span></li>" +
        '<li><i class="i" data-i="fingerprint"></i><span>' + (p.huellas.length ? "Se quita" + (p.huellas.length > 1 ? "n" : "") + " su" + (p.huellas.length > 1 ? "s" : "") + " <b>" + UA.plural(p.huellas.length, "celular con huella", "celulares con huella") + "</b> y se le apaga «Trabajar sin conexión»." : "No tiene celulares con huella.") + "</span></li>" +
        '<li><i class="i" data-i="ban"></i><span>Ya no entra: ve lo mismo que una cuenta no autorizada.</span></li>';
      dlg.querySelector(".btn-rojo").innerHTML = '<i class="i i-s" data-i="user-x"></i>Dar de baja';
    } else {
      var vis = sesiones(p);
      dlg.querySelector("h2").textContent = (vis.length === 1 ? "¿Cerrar la sesión de " + n + "?" : "¿Cerrar las " + vis.length + " sesiones de " + n + "?");
      dlg.querySelector(".lead").textContent = p.estado === "vos" ? "Todas menos la de este dispositivo. Es lo que se hace si te roban el celular." : "Es lo que se hace si le roban el celular y no sabés cuál es la sesión.";
      dlg.querySelector(".consecuencias").innerHTML = vis.map(function (s) { return '<li><i class="i" data-i="' + (s.tipo === "phone" ? "smartphone" : "monitor") + '"></i><span><b>' + s.disp + "</b> · " + s.uso + "</span></li>"; }).join("");
      dlg.querySelector(".btn-rojo").innerHTML = '<i class="i i-s" data-i="log-out"></i>Cerrar todas';
    }
    window.pintarIconos(dlg);
    UI.abrir(dlg);
  }
  dlg.querySelector(".btn-rojo").addEventListener("click", function () {
    var p = pendiente.p;
    if (pendiente.tipo === "baja") {
      p.estado = "baja"; p.sesiones = []; p.huellas = []; p.autorizada = "Dada de baja hoy";
      UI.cerrar(); pintarLista(); pintarFicha(true);
      var f = lista.querySelector('[data-p="' + p.id + '"]'); if (f) { f.classList.add("entra"); f.scrollIntoView({ block: "nearest" }); }
      UI.tostada(UA.mostrar(p) + " quedó dada de baja", "user-x");
    } else {
      var n = sesiones(p).length; p.sesiones = p.sesiones.filter(function (x) { return x.actual === DISP; }); UI.cerrar(); pintarFicha(); pintarLista(); UI.tostada(n === 1 ? "Se cerró la sesión" : "Se cerraron las " + n + " sesiones", "log-out");
    }
    UA.vibrar([10, 40, 10]);
  });

  /* ---- Autorizar a alguien ---- */
  var alta = document.getElementById("autorizar");
  var fNombre = document.getElementById("a-nombre"), fCorreo = document.getElementById("a-correo");
  document.querySelectorAll("[data-autorizar]").forEach(function (b) { b.addEventListener("click", abrirAlta); });
  function abrirAlta() { fNombre.value = ""; fCorreo.value = ""; fCorreo.parentNode.classList.remove("mal"); UI.abrir(alta); setTimeout(function () { fNombre.focus({ preventScroll: true }); }, 80); }
  alta.addEventListener("submit", function (e) {
    e.preventDefault();
    var c = fCorreo.value.trim(), box = fCorreo.parentNode;
    if (!UA.esCorreo(c)) { box.querySelector(".err span").textContent = "Eso no tiene forma de correo. Revisalo: falta algo como «@gmail.com»."; box.classList.add("mal"); fCorreo.focus(); return; }
    if (UA.yaEsta(c)) { box.querySelector(".err span").textContent = "Ese correo ya está cargado (sin importar mayúsculas)."; box.classList.add("mal"); fCorreo.focus(); return; }
    var id = "n" + Date.now();
    P.push({ id: id, nombre: fNombre.value.trim(), correo: c, estado: "activa", nunca: true, entro: "Todavía no entró", autorizada: "Autorizada recién", sesiones: [], huellas: [] });
    UI.cerrar();
    filtro = "todas"; texto = ""; buscador.value = "";
    document.querySelectorAll("[data-filtro]").forEach(function (x) { x.classList.toggle("elegido", x.dataset.filtro === "todas"); });
    pintarLista(id);
    if (!CELU) { elegido = id; lista.querySelector('[data-p="' + id + '"]').classList.add("elegida"); pintarFicha(true); }
    UI.tostada("Autorizada. Avisale que entre con Google", "user-check"); UA.vibrar(10);
  });
  fCorreo.addEventListener("input", function () { fCorreo.parentNode.classList.remove("mal"); });

  /* ---- La marca del teclado en la tarjeta ---- */
  var marcado = null;
  function marcar(el) {
    if (marcado) marcado.classList.remove("marca-tecla");
    marcado = el;
    if (el) { el.classList.add("marca-tecla"); el.scrollIntoView({ block: "nearest" }); }
  }
  document.addEventListener("mousemove", function (e) { if (marcado && (e.movementX || e.movementY)) marcar(null); });

  /* ---- Se perdió un celular (R5.7): de quién → cuál → Cortar ---- */
  var per = document.getElementById("perdido"), perOpc = per.querySelector(".opciones"), perCortar = per.querySelector(".btn-rojo"), deQuien = null, cualCel = null;
  // Sus celulares: los que tienen una sesión abierta o una huella suya; también los propios, salvo
  // el que se está usando.
  function celulares(p) {
    var usado = p.sesiones.filter(function (s) { return s.actual === DISP && s.cel; }).map(function (s) { return s.cel; });
    var orden = [], por = {};
    function sumar(cel, disp) { if (!cel || usado.indexOf(cel) >= 0) return null; if (!por[cel]) { por[cel] = { cel: cel, disp: disp, ses: [], hu: null }; orden.push(por[cel]); } return por[cel]; }
    p.sesiones.forEach(function (s) { if (s.tipo === "phone") { var c = sumar(s.cel, s.disp); if (c) c.ses.push(s); } });
    p.huellas.forEach(function (h) { var c = sumar(h.cel, h.disp); if (c) c.hu = h; });
    return orden;
  }
  function pasoQuien() {
    deQuien = null; cualCel = null;
    var con = P.filter(function (p) { return p.estado !== "baja" && celulares(p).length; });
    per.querySelector("h2").textContent = "¿De quién es el celular?";
    per.querySelector(".lead").textContent = con.length ? "Aparecen solo quienes tienen un celular con una sesión abierta o con huella." : "Nadie tiene un celular con una sesión abierta ni con huella.";
    perOpc.innerHTML = con.map(function (p) {
      var n = celulares(p).length;
      return '<button class="opcion" data-de="' + p.id + '"><span class="avatar p" style="' + UA.tono(p) + '">' + UA.iniciales(p) + '</span><span class="txt"><b>' + esc(UA.mostrar(p)) + (p.estado === "vos" ? " (vos)" : "") + "</b><span>" + UA.plural(n, "celular", "celulares") + '</span></span><i class="i flecha" data-i="chevron-right"></i></button>';
    }).join("");
    perCortar.hidden = true;
    window.pintarIconos(per);
  }
  function pasoCual(p) {
    deQuien = p;
    var cels = celulares(p);
    cualCel = cels.length === 1 ? cels[0].cel : null; // si tiene uno solo, ya está elegido
    per.querySelector("h2").textContent = (cels.length === 1 ? "El celular de " : "¿Cuál celular de ") + UA.mostrar(p) + (cels.length === 1 ? "" : "?");
    per.querySelector(".lead").textContent = "«Cortar» cierra su sesión y le quita la huella, sin preguntar. Si aparece, lo vincula de nuevo.";
    perOpc.innerHTML = cels.map(function (c) {
      var d = [];
      if (c.ses.length) d.push(c.ses.length === 1 ? "sesión abierta" : c.ses.length + " sesiones abiertas");
      if (c.hu) d.push("con huella");
      d.push((c.ses.length ? c.ses[0].uso : c.hu.uso).replace(/^Usad[ao] /, "usado "));
      return '<button class="opcion" role="radio" aria-checked="' + (c.cel === cualCel) + '" data-cel="' + c.cel + '"><span class="ico"><i class="i" data-i="smartphone"></i></span><span class="txt"><b>' + c.disp + "</b><span>" + d.join(" · ") + '</span></span><span class="radio"></span></button>';
    }).join("");
    perCortar.hidden = false; perCortar.disabled = !cualCel;
    window.pintarIconos(per);
  }
  per.addEventListener("click", function (e) {
    var b = e.target.closest("[data-de]"), c = e.target.closest("[data-cel]");
    if (b) pasoCual(UA.buscar(b.dataset.de));
    if (c) {
      cualCel = c.dataset.cel; perCortar.disabled = false;
      perOpc.querySelectorAll("[data-cel]").forEach(function (x) { x.setAttribute("aria-checked", String(x === c)); });
      UA.vibrar(10);
    }
  });
  perCortar.addEventListener("click", function () {
    var p = deQuien, c = celulares(p).filter(function (x) { return x.cel === cualCel; })[0];
    var antesS = p.sesiones.length, antesH = p.huellas.length;
    p.sesiones = p.sesiones.filter(function (s) { return s.cel !== cualCel; });
    p.huellas = p.huellas.filter(function (h) { return h.cel !== cualCel; });
    var ses = antesS - p.sesiones.length, hu = antesH - p.huellas.length;
    UI.cerrar();
    if (!ses && !hu) { UI.tostada("Ese celular ya no tiene ni sesión ni huella: no había nada que cortar", "smartphone"); return; }
    pintarLista(); pintarFicha();
    var que = []; if (ses) que.push(ses === 1 ? "se cerró su sesión" : "se cerraron sus " + ses + " sesiones"); if (hu) que.push("se le quitó la huella");
    UI.tostada("Cortado: " + (c ? c.disp : "el celular") + " de " + esc(UA.mostrar(p)) + ". " + que.join(" y ").replace(/^./, function (x) { return x.toUpperCase(); }), "power");
    UA.vibrar([10, 40, 10]);
  });
  function abrirPerdido() { pasoQuien(); UI.abrir(per); }
  document.addEventListener("click", function (e) { if (e.target.closest("[data-perdido]")) abrirPerdido(); });

  /* ---- Teclado (computadora) ---- */
  document.addEventListener("keydown", function (e) {
    if (CELU) return;
    var enCampo = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.altKey && e.key.toLowerCase() === "n") { e.preventDefault(); abrirAlta(); return; }
    if (e.altKey && e.key.toLowerCase() === "p") { e.preventDefault(); abrirPerdido(); return; }
    if (UI.estaAbierto()) return;
    if (e.key === "/" && !enCampo) { e.preventDefault(); buscador.focus(); return; }
    if (e.altKey) {
      var k = e.key.toLowerCase(), m = { b: '[data-acc="baja"],[data-acc="borrar"]', t: '[data-acc="todas"]', a: '[data-acc="alta"]' }[k];
      if (m) { e.preventDefault(); var bt = ficha.querySelector(m); if (bt) bt.click(); }
      return;
    }
    // «Cerrar» y «Quitar» de la tarjeta: → entra, ↑ ↓ los recorren con la marca, Enter toca el
    // marcado y ← vuelve a la lista.
    var botones = [].slice.call(ficha.querySelectorAll(".item .btn")), j = botones.indexOf(marcado);
    if (j >= 0 && !enCampo) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); marcar(botones[Math.max(0, Math.min(botones.length - 1, j + (e.key === "ArrowDown" ? 1 : -1)))]); }
      else if (e.key === "ArrowLeft" || e.key === "Escape") { e.preventDefault(); marcar(null); }
      else if (e.key === "Enter") {
        e.preventDefault(); marcado.click();
        setTimeout(function () { var r = [].slice.call(ficha.querySelectorAll(".item .btn")); marcar(r.length ? r[Math.min(j, r.length - 1)] : null); }, 260);
      }
      return;
    }
    if (e.key === "ArrowRight" && !enCampo && botones.length) { e.preventDefault(); marcar(botones[0]); return; }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !enCampo) {
      e.preventDefault();
      var filas = [].slice.call(lista.querySelectorAll(".fila")), i = filas.findIndex(function (f) { return f.dataset.p === elegido; });
      i = Math.max(0, Math.min(filas.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
      elegir(filas[i].dataset.p); filas[i].scrollIntoView({ block: "nearest" });
    }
  });

  UI.conexion("[data-luz]", CELU ? "En línea" : "En línea · todo enviado", CELU ? "Sin conexión" : "Sin conexión · nada por enviar");
  pintarLista(); pintarFicha();
})();
