/* Variante 1 · «La lista y la tarjeta». Un solo guion para la computadora y el celular:
   cambia la disposición (lista + tarjeta al costado / lista + tarjeta que entra desde la derecha),
   no lo que se puede hacer. */
(function () {
  var CELU = document.body.classList.contains("es-celu");
  var P = window.PERSONAS, esc = UA.esc;
  var elegido = CELU ? null : "gb";
  var filtro = "todas", texto = "";
  var lista = document.getElementById("lista");
  var ficha = document.getElementById("ficha");

  function cuenta(p) {
    var a = [];
    if (p.sesiones.length) a.push('<span class="cta" title="Sesiones abiertas"><i class="i i-s" data-i="monitor"></i>' + p.sesiones.length + "</span>");
    if (p.huellas.length) a.push('<span class="cta" title="Celulares con huella"><i class="i i-s" data-i="fingerprint"></i>' + p.huellas.length + "</span>");
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
    var past = baja ? '<span class="pastilla dada"><i class="i i-s" data-i="ban"></i>Dada de baja</span>'
                    : '<span class="pastilla pino adm"><i class="i i-s" data-i="shield-check"></i>Administrador</span>';
    if (CELU) {
      return '<button class="fila' + (baja ? " baja" : "") + '" data-p="' + p.id + '">' +
        '<span class="avatar p' + (baja ? " baja" : "") + '" style="' + UA.tono(p) + '">' + (baja ? '<i class="i i-s" data-i="ban"></i>' : UA.iniciales(p)) + "</span>" +
        '<span class="cuerpo"><span class="nom">' + esc(UA.mostrar(p)) + (p.estado === "vos" ? ' <span class="pastilla vos">Vos</span>' : "") + "</span>" +
        '<span class="det">' + (p.nombre ? esc(p.correo) : "Sin nombre todavía") + "</span>" +
        ultimo + '<span class="lin">' + past + cuenta(p) + "</span></span>" +
        '<span class="der"><i class="i" data-i="chevron-right"></i></span></button>';
    }
    return '<button class="fila' + (baja ? " baja" : "") + (p.id === elegido ? " elegida" : "") + '" data-p="' + p.id + '">' +
      '<span class="avatar p' + (baja ? " baja" : "") + '" style="' + UA.tono(p) + '">' + (baja ? '<i class="i i-s" data-i="ban"></i>' : UA.iniciales(p)) + "</span>" +
      '<span class="cuerpo"><span class="nom">' + esc(UA.mostrar(p)) + (p.estado === "vos" ? ' <span class="pastilla vos">Vos</span>' : "") + "</span>" +
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
    var ses = 0, hu = 0; act.forEach(function (p) { ses += p.sesiones.length; hu += p.huellas.length; });
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
      (!baja ? '<button class="btn btn-fantasma btn-icono chico" data-acc="editar" data-campo="nombre" aria-label="Cambiar el nombre"><i class="i i-s" data-i="pencil"></i></button>' : "") + "</div>" +
      '<div class="correo-ed" data-campo="correo"><span class="t-detalle">' + esc(p.correo) + "</span>" +
      (p.nunca ? '<button class="btn btn-fantasma btn-icono chico" data-acc="editar" data-campo="correo" aria-label="Cambiar el correo"><i class="i i-s" data-i="pencil"></i></button>'
               : (!baja ? '<span class="atado" title="Ya entró: su cuenta de Google quedó atada a ella. Para otra cuenta, autorizá el correo nuevo y dale de baja a este."><i class="i i-s" data-i="lock-keyhole"></i></span>' : "")) + "</div></div></div>" +
      '<div class="pastillas">' + (vos ? '<span class="pastilla vos">Vos</span>' : "") +
      (baja ? '<span class="pastilla dada"><i class="i i-s" data-i="ban"></i>Dada de baja</span>' : '<span class="pastilla pino adm"><i class="i i-s" data-i="shield-check"></i>Administrador</span>') +
      '<span class="t-detalle">' + (p.nunca ? '<i class="i i-s" data-i="hourglass"></i> ' : "") + p.entro + " · " + p.autorizada + "</span></div>";

    if (p.nunca) {
      h += '<div class="aviso urgente"><i class="i" data-i="info"></i><span>Todavía no entró. Avisale que entre con Google con <b>' + esc(p.correo) + "</b>: Ferrebress no le manda ningún correo.</span></div>";
    } else if (baja) {
      h += '<div class="aviso pino"><i class="i" data-i="info"></i><span>No puede entrar: ve el mismo mensaje que una cuenta no autorizada. Si le das de alta, entra con su misma cuenta de Google; sus celulares con huella los vincula de nuevo.</span></div>';
    } else {
      h += '<div class="sec"><div class="sec-cab"><span class="t-renglon">Sesiones abiertas <span class="n">' + p.sesiones.length + "</span></span>" +
        (p.sesiones.length ? '<button class="btn chico" data-acc="todas"><i class="i i-s" data-i="log-out"></i>Cerrar todas' + (CELU ? "" : ' <span class="kbd">Alt T</span>') + "</button>" : "") + "</div>" +
        (p.sesiones.length ? p.sesiones.map(sesionHTML).join("") : '<div class="nada">Sin sesiones abiertas en otros dispositivos.</div>') +
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
      quitarItem('[data-h="' + hh.id + '"].item', function () { p.huellas.splice(p.huellas.indexOf(hh), 1); pintarFicha(); pintarLista(); UI.tostada("Celular quitado: ya no entra con la huella", "fingerprint"); });
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
      dlg.querySelector("h2").textContent = (p.sesiones.length === 1 ? "¿Cerrar la sesión de " + n + "?" : "¿Cerrar las " + p.sesiones.length + " sesiones de " + n + "?");
      dlg.querySelector(".lead").textContent = p.estado === "vos" ? "Todas menos la de este dispositivo. Es lo que se hace si te roban el celular." : "Es lo que se hace si le roban el celular y no sabés cuál es la sesión.";
      dlg.querySelector(".consecuencias").innerHTML = p.sesiones.map(function (s) { return '<li><i class="i" data-i="' + (s.tipo === "phone" ? "smartphone" : "monitor") + '"></i><span><b>' + s.disp + "</b> · " + s.uso + "</span></li>"; }).join("");
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
      var n = p.sesiones.length; p.sesiones = []; UI.cerrar(); pintarFicha(); pintarLista(); UI.tostada(n === 1 ? "Se cerró la sesión" : "Se cerraron las " + n + " sesiones", "log-out");
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

  /* ---- Teclado (computadora) ---- */
  document.addEventListener("keydown", function (e) {
    if (CELU) return;
    var enCampo = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.altKey && e.key.toLowerCase() === "n") { e.preventDefault(); abrirAlta(); return; }
    if (UI.estaAbierto()) return;
    if (e.key === "/" && !enCampo) { e.preventDefault(); buscador.focus(); return; }
    if (e.altKey) {
      var k = e.key.toLowerCase(), m = { b: '[data-acc="baja"],[data-acc="borrar"]', t: '[data-acc="todas"]', a: '[data-acc="alta"]' }[k];
      if (m) { e.preventDefault(); var bt = ficha.querySelector(m); if (bt) bt.click(); }
      return;
    }
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
