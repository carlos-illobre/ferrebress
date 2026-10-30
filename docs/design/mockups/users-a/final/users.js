/* Más → Usuarios (02 · etapa a) · el guion de la pantalla. Un solo guion para la computadora y el
   celular: cambia la disposición (lista y tarjeta al costado / tarjeta que entra desde la derecha),
   no lo que se puede hacer. Usa el marco (window.Marco): la tostada, las capas, la marca del
   teclado y la conexión. */
(function () {
  var M = window.Marco, P = window.PERSONAS;
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;
  var lista = $("u-lista"), ficha = $("u-ficha"), buscador = $("u-buscar");
  var filtro = "todas", texto = "";
  var elegido = M.angosto() ? null : "gb";

  // ---------- Ayudas ----------
  function celu() { return M.angosto(); }
  function dispositivo() { return celu() ? "phone" : "desktop"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mostrar(p) { return p.nombre || p.correo; }
  function plural(n, uno, varios) { return n + " " + (n === 1 ? uno : varios); }
  function buscar(id) { return P.filter(function (p) { return p.id === id; })[0]; }
  function iniciales(p) { var w = mostrar(p).split(/[ .@]/).filter(Boolean); return ((w[0] || "?")[0] + ((w[1] || "")[0] || "")).toUpperCase(); }
  function tono(p) { var i = 0; for (var k = 0; k < p.id.length; k++) i += p.id.charCodeAt(k); return "u-tono-" + (i % 5); }
  function esCorreo(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }
  function yaEsta(s, salvo) { s = s.toLowerCase(); return P.some(function (p) { return p !== salvo && p.correo.toLowerCase() === s; }); }
  function quieto() { return M.reducido; }
  function vibrar(v) { try { if (navigator.vibrate && celu() && !quieto()) navigator.vibrate(v); } catch (e) {} }
  function kbd(k) { return ' <span class="kbd">' + k + "</span>"; }
  function largoCorto(l, c) { return '<span class="largo">' + l + '</span><span class="corto">' + c + "</span>"; }
  function ordenar() {
    var g = { vos: 0, activa: 1, baja: 2 };
    P.sort(function (a, b) { return (g[a.estado] - g[b.estado]) || mostrar(a).localeCompare(mostrar(b), "es", { sensitivity: "base" }); });
  }
  // Las sesiones que se ven: la del dispositivo que se está usando no figura (R5.2).
  function sesiones(p) { return p.sesiones.filter(function (s) { return s.actual !== dispositivo(); }); }
  // Los celulares con huella que se ven: los propios no figuran (R5.5).
  function huellas(p) { return p.estado === "vos" ? [] : p.huellas; }
  function avatar(p, extra) {
    var baja = p.estado === "baja";
    return '<span class="avatar u-av ' + tono(p) + (baja ? " baja" : "") + (extra ? " " + extra : "") + '" aria-hidden="true">' + (baja ? '<i class="i i-s" data-i="ban"></i>' : iniciales(p)) + "</span>";
  }
  function pastillaAdm(p) { return '<span class="pastilla pino u-adm' + (p.estado === "baja" ? " baja" : "") + '"><i class="i i-s" data-i="shield-check"></i>Administrador</span>'; }
  var DADA = '<span class="pastilla u-dada"><i class="i i-s" data-i="ban"></i>Dada de baja</span>';
  var VOS = '<span class="pastilla u-vos">Vos</span>';

  // ---------- La lista ----------
  function cuenta(p) {
    var a = [], s = sesiones(p).length, h = huellas(p).length;
    if (s) a.push('<span class="u-cta" title="Sesiones abiertas"><i class="i i-s" data-i="monitor"></i>' + s + '<span class="u-oculto"> ' + (s === 1 ? "sesión" : "sesiones") + "</span></span>");
    if (h) a.push('<span class="u-cta" title="Celulares con huella"><i class="i i-s" data-i="fingerprint"></i>' + h + '<span class="u-oculto"> ' + (h === 1 ? "celular con huella" : "celulares con huella") + "</span></span>");
    return a.join("");
  }
  function pasa(p) {
    if (filtro === "activas" && p.estado === "baja") return false;
    if (filtro === "nunca" && !(p.nunca && p.estado !== "baja")) return false;
    if (filtro === "baja" && p.estado !== "baja") return false;
    if (texto && (mostrar(p) + " " + p.correo).toLowerCase().indexOf(texto) < 0) return false;
    return true;
  }
  function renglon(p) {
    var baja = p.estado === "baja";
    return '<button type="button" class="u-fila' + (baja ? " baja" : "") + '" data-p="' + p.id + '"' + (p.id === elegido && !celu() ? ' aria-current="true"' : "") + ">" +
      avatar(p) +
      '<span class="u-cuerpo"><span class="u-nom"><span class="u-nom-texto">' + esc(mostrar(p)) + "</span>" + (p.estado === "vos" ? VOS : "") + (baja ? DADA : "") + "</span>" +
      '<span class="u-det">' + (p.nombre ? esc(p.correo) : largoCorto("Sin nombre: se ve su correo hasta que entre", "Sin nombre todavía")) + "</span></span>" +
      '<span class="u-fila-pastillas">' + pastillaAdm(p) + "</span>" +
      '<span class="u-ult' + (p.nunca ? " nunca" : "") + '">' + (p.nunca ? '<i class="i i-s" data-i="hourglass"></i>' : "") + p.entro + "</span>" +
      '<span class="u-ctas">' + cuenta(p) + "</span>" +
      '<i class="i u-flecha" data-i="chevron-right"></i></button>';
  }
  function pintarLista(nuevo) {
    ordenar();
    var vis = P.filter(pasa), h = "", grupo = "";
    vis.forEach(function (p) {
      var g = p.estado === "baja" ? "baja" : "activas";
      if (g !== grupo) {
        grupo = g;
        var n = vis.filter(function (x) { return (x.estado === "baja") === (g === "baja"); }).length;
        h += '<h2 class="u-grupo">' + (g === "baja" ? "Dadas de baja" : "Pueden entrar") + " <span>" + n + "</span></h2>";
      }
      h += renglon(p);
    });
    if (!vis.length) h = '<div class="u-vacio"><i class="i i-xl" data-i="search"></i><b>' + (texto ? "Nadie con «" + esc(texto) + "»" : "Nadie en este filtro") + "</b><span>Buscá por nombre o por correo.</span></div>";
    lista.innerHTML = h;
    if (nuevo) { var f = fila(nuevo); if (f) { f.classList.add("u-entra", "u-recien"); f.scrollIntoView({ block: "nearest" }); } }
    window.pintarIconos(lista);
    resumen();
  }
  function fila(id) { return lista.querySelector('.u-fila[data-p="' + id + '"]'); }

  function resumen() {
    var act = P.filter(function (p) { return p.estado !== "baja"; }), ses = 0, hu = 0;
    act.forEach(function (p) { ses += sesiones(p).length; hu += huellas(p).length; });
    var nunca = act.filter(function (p) { return p.nunca; }).length;
    function poner(k, v) {
      document.querySelectorAll('[data-n="' + k + '"]').forEach(function (e) {
        if (e.textContent === String(v)) return;
        var habia = e.textContent !== "0" || e.dataset.listo; e.textContent = v; e.dataset.listo = "1";
        if (habia) { e.classList.remove("u-rueda"); void e.offsetWidth; e.classList.add("u-rueda"); }
      });
    }
    poner("activas", act.length); poner("sesiones", ses); poner("huellas", hu); poner("nunca", nunca);
    poner("c-todas", P.length); poner("c-activas", act.length); poner("c-nunca", nunca); poner("c-baja", P.length - act.length);
  }

  // ---------- La tarjeta ----------
  function sesionHTML(s) {
    return '<li class="u-item" data-s="' + s.id + '"><span class="u-item-ico"><i class="i" data-i="' + (s.tipo === "phone" ? "smartphone" : "monitor") + '"></i>' + (s.vivo ? '<b class="u-vivo" title="Usada en la última media hora"></b>' : "") + "</span>" +
      '<span class="u-item-txt"><b>' + s.disp + "</b><span>" + s.como + " · " + s.desde + "</span><span>" + s.uso + "</span></span>" +
      '<button type="button" class="btn chico btn-suave" data-acc="cerrar" data-s="' + s.id + '">Cerrar</button></li>';
  }
  function huellaHTML(h) {
    return '<li class="u-item" data-h="' + h.id + '"><span class="u-item-ico huella"><i class="i" data-i="fingerprint"></i></span>' +
      '<span class="u-item-txt"><b>' + h.disp + "</b><span>" + h.vinculo + "</span><span>" + h.uso + "</span></span>" +
      '<button type="button" class="btn chico btn-suave" data-acc="quitar" data-h="' + h.id + '">Quitar</button></li>';
  }
  function pintarFicha(anim) {
    var p = buscar(elegido);
    if (!p) { ficha.innerHTML = '<div class="u-vacio"><i class="i i-xl" data-i="users"></i><b>Elegí a alguien</b><span>Su tarjeta aparece acá.</span></div>'; window.pintarIconos(ficha); return; }
    var baja = p.estado === "baja", vos = p.estado === "vos", ses = sesiones(p), hus = huellas(p);
    var h = '<button type="button" class="btn btn-fantasma chico u-volver" data-acc="volver"><i class="i" data-i="chevron-left"></i>Usuarios</button>' +
      '<div class="u-ficha-cab">' + avatar(p, "u-av-grande") +
      '<div class="u-quien"><div class="u-editable" data-campo="nombre"><h2 class="t-seccion">' + esc(mostrar(p)) + "</h2>" +
      '<button type="button" class="btn btn-fantasma btn-icono u-lapiz" data-acc="editar" data-campo="nombre" data-key="o" aria-label="Cambiar el nombre"><i class="i i-s" data-i="pencil"></i><span class="kbd">O</span></button></div>' +
      '<div class="u-editable" data-campo="correo"><span class="t-detalle">' + esc(p.correo) + "</span>" +
      (p.nunca ? '<button type="button" class="btn btn-fantasma btn-icono u-lapiz" data-acc="editar" data-campo="correo" data-key="r" aria-label="Cambiar el correo"><i class="i i-s" data-i="pencil"></i><span class="kbd">R</span></button>'
               : '<span class="u-atado" title="Ya entró: su cuenta de Google quedó atada a este correo. Para otra cuenta, autorizá el correo nuevo y dale de baja a este." aria-label="El correo no se puede cambiar porque ya entró"><i class="i i-s" data-i="lock-keyhole"></i></span>') +
      "</div></div></div>" +
      '<div class="u-ficha-pastillas">' + (vos ? VOS : "") + pastillaAdm(p) + (baja ? DADA : "") +
      '<span class="t-detalle">' + (p.nunca ? '<i class="i i-s" data-i="hourglass"></i>' : "") + p.entro + " · " + p.autorizada + "</span></div>";

    if (baja) {
      h += '<div class="aviso pino"><i class="i" data-i="info"></i><span>' + largoCorto("No puede entrar: ve el mismo mensaje que una cuenta no autorizada. Si le das de alta, entra con su misma cuenta de Google; sus celulares con huella los vincula de nuevo.", "No puede entrar. Si le das de alta, entra con su misma cuenta; la huella la vincula de nuevo.") + "</span></div>";
    } else if (p.nunca) {
      h += '<div class="aviso urgente"><i class="i" data-i="info"></i><span>Todavía no entró. Avisale que entre con Google con <b>' + esc(p.correo) + "</b>: Ferrebress no le manda ningún correo.</span></div>";
    } else {
      h += '<section class="u-sec"><div class="u-sec-cab"><h3>Sesiones abiertas<span class="u-sec-n">' + ses.length + "</span></h3>" +
        (ses.length ? '<button type="button" class="btn chico" data-acc="todas" data-key="t"><i class="i i-s" data-i="log-out"></i>Cerrar todas' + kbd("T") + "</button>" : "") + "</div>" +
        (ses.length ? '<ul class="u-items">' + ses.map(sesionHTML).join("") + "</ul>" : '<p class="u-nada">Sin sesiones abiertas en otros dispositivos.</p>') +
        (vos ? '<p class="u-nota"><i class="i i-s" data-i="info"></i>' + largoCorto("La sesión de esta computadora no figura: se cierra con «Salir».", "La de este celular no figura: se cierra con «Salir».") + "</p>" : "") + "</section>";
      h += '<section class="u-sec"><div class="u-sec-cab"><h3>Celulares con huella' + (vos ? "" : '<span class="u-sec-n">' + hus.length + "</span>") + "</h3></div>" +
        (vos ? '<p class="u-nota"><i class="i i-s" data-i="info"></i>Los tuyos van en Configuración.</p>'
             : (hus.length ? '<ul class="u-items">' + hus.map(huellaHTML).join("") + "</ul>" : '<p class="u-nada">No vinculó ningún celular con huella.</p>')) + "</section>";
    }

    h += '<div class="u-ficha-pie">';
    if (vos) h += '<p class="u-nota"><i class="i i-s" data-i="info"></i>No te podés dar de baja vos: lo tiene que hacer otro Administrador.</p>';
    else if (baja) h += '<button type="button" class="btn" data-acc="alta" data-key="l"><i class="i i-s" data-i="user-check"></i>Dar de alta' + kbd("L") + "</button>";
    else if (p.nunca) h += '<button type="button" class="btn btn-peligro" data-acc="borrar" data-key="b"><i class="i i-s" data-i="trash-2"></i>Borrar el alta' + kbd("B") + '</button><span class="t-detalle">Nunca entró: se borra del todo.</span>';
    else h += '<button type="button" class="btn btn-peligro" data-acc="baja" data-key="b"><i class="i i-s" data-i="user-x"></i>Dar de baja' + kbd("B") + "</button>";
    h += "</div>";

    ficha.innerHTML = '<div class="u-ficha-in' + (anim ? " u-fundido" : "") + '">' + h + "</div>";
    ficha.setAttribute("aria-label", "Tarjeta de " + mostrar(p));
    window.pintarIconos(ficha);
  }

  function elegir(id, conMarca) {
    elegido = id;
    if (celu()) { pintarFicha(false); ficha.scrollTop = 0; body.classList.add("u-con-ficha"); return; }
    lista.querySelectorAll(".u-fila").forEach(function (f) { if (f.dataset.p === id) f.setAttribute("aria-current", "true"); else f.removeAttribute("aria-current"); });
    pintarFicha(true);
    if (conMarca) M.marcar(fila(id));
  }
  function repintar() { pintarLista(); pintarFicha(); }

  // ---------- Lista: tocar, filtros, buscador ----------
  lista.addEventListener("click", function (e) { var f = e.target.closest(".u-fila"); if (f) elegir(f.dataset.p); });
  document.querySelectorAll("[data-filtro]").forEach(function (c) {
    c.addEventListener("click", function () {
      filtro = c.dataset.filtro;
      document.querySelectorAll("[data-filtro]").forEach(function (x) { x.classList.toggle("elegido", x === c); x.setAttribute("aria-pressed", String(x === c)); });
      pintarLista();
    });
  });
  buscador.addEventListener("input", function () { texto = buscador.value.trim().toLowerCase(); M.desmarcar(); pintarLista(); });

  // ---------- Acciones de la tarjeta ----------
  function irse(sel, despues) {
    var it = ficha.querySelector(sel);
    if (!it || quieto()) return despues();
    it.classList.add("u-sale");
    setTimeout(despues, 200);
  }
  ficha.addEventListener("click", function (e) {
    var b = e.target.closest("[data-acc]"); if (!b) return;
    var p = buscar(elegido), a = b.dataset.acc;
    if (a === "volver") { body.classList.remove("u-con-ficha"); return; }
    if (a === "cerrar") {
      var s = p.sesiones.filter(function (x) { return x.id === b.dataset.s; })[0];
      irse('.u-item[data-s="' + s.id + '"]', function () {
        p.sesiones.splice(p.sesiones.indexOf(s), 1); repintar();
        M.tostada("Sesión cerrada · " + s.disp + ". Vuelve a la entrada con su próximo pedido.", "log-out"); vibrar([10, 40, 10]);
      });
    }
    if (a === "quitar") {
      // R5.6: quitar la huella también cierra la sesión abierta en ese celular, si hay.
      var hh = p.huellas.filter(function (x) { return x.id === b.dataset.h; })[0];
      irse('.u-item[data-h="' + hh.id + '"]', function () {
        var antes = p.sesiones.length;
        p.huellas.splice(p.huellas.indexOf(hh), 1);
        p.sesiones = p.sesiones.filter(function (s) { return s.cel !== hh.cel; });
        repintar();
        M.tostada("Celular quitado: ya no entra con la huella ni sin conexión" + (p.sesiones.length < antes ? ", y se cerró su sesión" : "") + ".", "unlink"); vibrar([10, 40, 10]);
      });
    }
    if (a === "todas") confirmar("todas", p);
    if (a === "baja") confirmar("baja", p);
    if (a === "alta") {
      p.estado = "activa"; p.autorizada = "Dada de alta de nuevo hoy";
      repintar(); pintarFicha(true);
      M.tostada(esc(mostrar(p)) + " puede entrar otra vez.", "user-check");
    }
    if (a === "borrar") {
      // R3.7: nunca entró, así que se borra del todo, sin confirmación.
      var f = fila(p.id); if (f && !quieto()) f.classList.add("u-sale");
      setTimeout(function () {
        P.splice(P.indexOf(p), 1);
        elegido = celu() ? null : "gb";
        body.classList.remove("u-con-ficha"); repintar(); pintarFicha(true);
        M.tostada("Se borró el alta de " + esc(p.correo) + ".", "trash-2");
      }, quieto() ? 0 : 200);
    }
    if (a === "editar") editar(p, b.dataset.campo);
  });

  // Cambiar el nombre (siempre, R3.5) o el correo (solo si nunca entró, R3.6), en el lugar.
  function editar(p, campo) {
    var cont = ficha.querySelector('.u-editable[data-campo="' + campo + '"]');
    var val = campo === "nombre" ? p.nombre : p.correo;
    var ayuda = "Enter guarda · Esc deja como estaba";
    cont.classList.add("editando");
    cont.innerHTML = '<input class="u-ed" value="' + esc(val) + '" aria-label="' + (campo === "nombre" ? "Nombre" : "Correo de Google") + '"' +
      (campo === "nombre" ? ' placeholder="' + (p.nunca ? "Vacío: se ve su correo" : "Vacío: vuelve al de Google") + '"' : ' type="email" inputmode="email" placeholder="nombre@gmail.com"') + ">" +
      '<span class="u-ed-ayuda">' + (celu() ? "" : ayuda) + "</span>";
    var inp = cont.querySelector("input");
    inp.focus(); inp.select();
    function guardar() {
      var v = inp.value.trim();
      if (campo === "correo") {
        var mal = !esCorreo(v) ? "Eso no tiene forma de correo." : (yaEsta(v, p) ? "Ese correo ya está cargado (sin importar mayúsculas)." : "");
        if (mal) { cont.classList.add("mal"); cont.querySelector(".u-ed-ayuda").textContent = mal; inp.focus(); return; }
        if (v === p.correo) { pintarFicha(); return; }
        p.correo = v; repintar(); M.tostada("Correo cambiado: entra con la cuenta nueva y no con la vieja.", "check"); return;
      }
      if (v === p.nombre) { pintarFicha(); return; }
      p.nombre = v; repintar();
      M.tostada(v ? "Nombre guardado." : "Nombre borrado: se ve " + (p.nunca ? "su correo." : "el de Google."), "check");
    }
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); pintarFicha(); }
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); guardar(); }
    });
    inp.addEventListener("input", function () { cont.classList.remove("mal"); cont.querySelector(".u-ed-ayuda").textContent = celu() ? "" : ayuda; });
    // En el celular no hay Enter a la vista: al salir del campo se guarda (si está bien).
    inp.addEventListener("blur", function () {
      setTimeout(function () {
        if (!ficha.contains(inp)) return;
        if (celu()) guardar(); else if (document.activeElement !== inp) pintarFicha();
      }, 150);
    });
  }

  // ---------- Diálogos (hojas en el celular) ----------
  var velo = $("u-velo"), abierto = null;
  function abrir(el) {
    cerrar();
    abierto = el; el.hidden = false; velo.hidden = false; el.classList.add("capa-arriba");
    M.abrirCapa(cerrar); M.desmarcar();
    var f = el.querySelector(".u-btn-rojo:not([disabled]), button");
    if (f && !celu()) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
  }
  function cerrar() {
    if (!abierto) return;
    abierto.hidden = true; abierto.classList.remove("capa-arriba"); velo.hidden = true;
    abierto = null; M.cerrarCapa(cerrar);
  }
  velo.addEventListener("click", cerrar);
  document.addEventListener("click", function (e) { if (e.target.closest("[data-u-cerrar]")) cerrar(); });

  // Dar de baja (R4.1) y Cerrar todas (R5.4) piden confirmación y dicen lo que va a pasar.
  var dlg = $("u-confirmar"), dlgSi = $("u-confirmar-si"), pendiente = null;
  function confirmar(tipo, p) {
    pendiente = { tipo: tipo, p: p };
    var n = esc(mostrar(p)), ses = sesiones(p), cons;
    if (tipo === "baja") {
      $("u-confirmar-titulo").innerHTML = "¿Dar de baja a " + n + "?";
      $("u-confirmar-texto").textContent = "La saca de todo. Sigue en la lista y la podés dar de alta cuando quieras.";
      cons = '<li><i class="i" data-i="log-out"></i><span>' + (p.sesiones.length ? (p.sesiones.length === 1 ? "Se cierra su <b>sesión</b>" : "Se cierran sus <b>" + p.sesiones.length + " sesiones</b>") + ": cada dispositivo vuelve a la entrada con «Tu sesión se cerró desde otro dispositivo»." : "No tiene sesiones abiertas.") + "</span></li>" +
        '<li><i class="i" data-i="fingerprint"></i><span>' + (p.huellas.length ? (p.huellas.length === 1 ? "Se le quita su <b>celular con huella</b>" : "Se le quitan sus <b>" + p.huellas.length + " celulares con huella</b>") + " y se le apaga «Trabajar sin conexión»." : "No tiene celulares con huella.") + "</span></li>" +
        '<li><i class="i" data-i="ban"></i><span>Ya no entra: ve lo mismo que una cuenta no autorizada.</span></li>';
      dlgSi.innerHTML = '<i class="i i-s" data-i="user-x"></i>Dar de baja' + kbd("B");
      dlgSi.dataset.key = "b";
    } else {
      $("u-confirmar-titulo").innerHTML = ses.length === 1 ? "¿Cerrar la sesión de " + n + "?" : "¿Cerrar las " + ses.length + " sesiones de " + n + "?";
      $("u-confirmar-texto").textContent = p.estado === "vos" ? "Todas menos la de este dispositivo. Es lo que se hace si te roban el celular." : "Es lo que se hace si le roban el celular y no sabés cuál es la sesión.";
      cons = ses.map(function (s) { return '<li><i class="i" data-i="' + (s.tipo === "phone" ? "smartphone" : "monitor") + '"></i><span><b>' + s.disp + "</b> · " + s.uso + "</span></li>"; }).join("");
      dlgSi.innerHTML = '<i class="i i-s" data-i="log-out"></i>Cerrar todas' + kbd("T");
      dlgSi.dataset.key = "t";
    }
    dlg.querySelector(".u-consecuencias").innerHTML = cons;
    window.pintarIconos(dlg);
    abrir(dlg);
  }
  dlgSi.addEventListener("click", function () {
    var p = pendiente.p;
    cerrar();
    if (pendiente.tipo === "baja") {
      p.estado = "baja"; p.sesiones = []; p.huellas = []; p.autorizada = "Dada de baja hoy";
      repintar(); pintarFicha(true);
      var f = fila(p.id); if (f) { f.classList.add("u-entra"); f.scrollIntoView({ block: "nearest" }); }
      M.tostada(esc(mostrar(p)) + " quedó dada de baja.", "user-x");
    } else {
      var n = sesiones(p).length;
      p.sesiones = p.sesiones.filter(function (s) { return s.actual === dispositivo(); });
      repintar();
      M.tostada(n === 1 ? "Se cerró la sesión." : "Se cerraron las " + n + " sesiones.", "log-out");
    }
    vibrar([10, 40, 10]);
  });

  // ---------- Se perdió un celular (R5.7): de quién → cuál → Cortar → qué se cortó ----------
  var per = $("u-perdido-dialogo"), paso = $("u-paso"), deQuien = null, cualCel = null;
  // Los celulares de una persona: los que tienen una sesión abierta o una huella suya; también los
  // propios, salvo el que se está usando.
  function celulares(p) {
    var usado = p.sesiones.filter(function (s) { return s.actual === dispositivo() && s.cel; }).map(function (s) { return s.cel; });
    var orden = [], por = {};
    function sumar(cel, disp) { if (!cel || usado.indexOf(cel) >= 0) return; if (!por[cel]) { por[cel] = { cel: cel, disp: disp, ses: [], hu: null }; orden.push(por[cel]); } return por[cel]; }
    p.sesiones.forEach(function (s) { if (s.tipo === "phone") { var c = sumar(s.cel, s.disp); if (c) c.ses.push(s); } });
    p.huellas.forEach(function (h) { var c = sumar(h.cel, h.disp); if (c) c.hu = h; });
    return orden;
  }
  function detalleCel(c) {
    var a = [];
    if (c.ses.length) a.push(c.ses.length === 1 ? "sesión abierta" : c.ses.length + " sesiones abiertas");
    if (c.hu) a.push("con huella");
    var uso = c.ses.length ? c.ses[0].uso : c.hu.uso;
    return a.join(" · ") + " · " + uso.replace(/^Usad[ao] /, "usado ");
  }
  function pintarPaso(h) {
    paso.innerHTML = h;
    paso.classList.remove("u-entra-paso"); void paso.offsetWidth; paso.classList.add("u-entra-paso");
    window.pintarIconos(paso);
  }
  function resumenCorto(p) {
    var a = [], s = sesiones(p).length, h = p.huellas.length;
    if (s) a.push(plural(s, "sesión", "sesiones"));
    if (h) a.push(plural(h, "huella", "huellas"));
    return a.join(" · ");
  }
  // Paso 1, como en la variante 2: ¿de quién era? Solo quienes tienen algún celular para cortar.
  function pasoQuien() {
    deQuien = null; cualCel = null;
    var con = P.filter(function (p) { return p.estado !== "baja" && celulares(p).length; });
    pintarPaso('<h2 class="u-dialogo-titulo" id="u-perdido-titulo">¿De quién era el celular?</h2>' +
      '<p class="u-dialogo-texto">' + (con.length ? "Aparecen solo quienes tienen un celular abierto o con huella." : "Nadie tiene un celular abierto ni con huella: no hay nada que cortar.") + "</p>" +
      (con.length ? '<div class="u-quienes">' + con.map(function (p, i) {
        return '<button type="button" class="u-quien-b" data-de="' + p.id + '"' + (i < 9 ? ' data-key="' + (i + 1) + '"' : "") + ">" + avatar(p) +
          "<b>" + esc(mostrar(p)) + (p.estado === "vos" ? " (vos)" : "") + "</b><small>" + resumenCorto(p) + "</small>" + (i < 9 ? kbd(i + 1) : "") + "</button>";
      }).join("") + "</div>" : "") +
      '<div class="u-dialogo-pie"><button type="button" class="btn btn-fantasma" data-u-cerrar>Cancelar' + kbd("Esc") + "</button></div>");
  }
  // Paso 2: sus celulares. Ajuste por R5.7: se elige uno (si tiene uno solo, ya está elegido) y se
  // corta solo ese; en la variante 2 se cortaban todos juntos.
  function pasoCual(p) {
    deQuien = p;
    var cels = celulares(p), n = esc(mostrar(p));
    cualCel = cels.length === 1 ? cels[0].cel : null;
    pintarPaso('<h2 class="u-dialogo-titulo" id="u-perdido-titulo">Los celulares de ' + n + "</h2>" +
      '<p class="u-dialogo-texto">' + (cels.length === 1 ? "Tiene uno solo." : "Elegí cuál.") + " Se cierran sus sesiones y se le quita la huella. Si después aparece, lo vincula de nuevo.</p>" +
      '<div class="u-quienes u-cels" role="radiogroup" aria-label="Celulares de ' + n + '">' + cels.map(function (c, i) {
        return '<button type="button" class="u-quien-b" role="radio" aria-checked="' + (c.cel === cualCel) + '" data-cel="' + c.cel + '"' + (i < 9 ? ' data-key="' + (i + 1) + '"' : "") + '><span class="u-cel-ico"><i class="i" data-i="smartphone"></i></span>' +
          "<b>" + c.disp + "</b><small>" + detalleCel(c) + "</small>" + (i < 9 ? kbd(i + 1) : "") + "</button>";
      }).join("") + "</div>" +
      '<div class="u-dialogo-pie"><button type="button" class="btn btn-fantasma" data-u-cerrar>Cancelar' + kbd("Esc") + "</button>" +
      '<button type="button" class="btn u-btn-rojo grande" data-acc="cortar" data-key="c"' + (cualCel ? "" : " disabled") + '><i class="i" data-i="power"></i>Cortar este celular' + kbd("C") + "</button></div>");
  }
  // Cortar: como en la variante 2, se cierra y la tostada dice qué se cortó (R5.7, «muestra qué cortó»).
  function cortar() {
    var p = deQuien, c = celulares(p).filter(function (x) { return x.cel === cualCel; })[0];
    var disp = c ? c.disp : "Ese celular";
    var antesS = p.sesiones.length, antesH = p.huellas.length;
    p.sesiones = p.sesiones.filter(function (s) { return s.cel !== cualCel; });
    p.huellas = p.huellas.filter(function (h) { return h.cel !== cualCel; });
    var ses = antesS - p.sesiones.length, hu = antesH - p.huellas.length, n = esc(mostrar(p));
    cerrar();
    if (!ses && !hu) { M.tostada("Ese celular ya no tenía ni sesión ni huella: no había nada que cortar.", "smartphone"); return; }
    repintar();
    var que = [];
    if (ses) que.push(ses === 1 ? "se cerró su sesión" : "se cerraron sus " + ses + " sesiones");
    if (hu) que.push("se le quitó la huella");
    M.tostada("Cortado el " + disp + " de " + n + ": " + que.join(" y ") + ".", "power");
    vibrar([10, 40, 10]);
  }
  per.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-de]"))) { pasoCual(buscar(t.dataset.de)); return; }
    if ((t = e.target.closest("[data-cel]"))) {
      cualCel = t.dataset.cel;
      per.querySelectorAll("[data-cel]").forEach(function (b) { b.setAttribute("aria-checked", String(b === t)); });
      per.querySelector('[data-acc="cortar"]').disabled = false;
      vibrar(10); return;
    }
    if ((t = e.target.closest('[data-acc="cortar"]')) && !t.disabled) cortar();
  });
  $("u-perdido").addEventListener("click", function () { pasoQuien(); abrir(per); });

  // ---------- Autorizar en una línea (R3.3): correo, nombre opcional y Enter ----------
  var alta = $("u-alta"), aCorreo = $("u-alta-correo"), aNombre = $("u-alta-nombre"), aError = alta.querySelector(".u-alta-error span");
  function aviso(t) { aError.textContent = t; alta.classList.add("mal"); aCorreo.setAttribute("aria-invalid", "true"); aCorreo.focus(); }
  alta.addEventListener("submit", function (e) {
    e.preventDefault();
    var c = aCorreo.value.trim();
    if (!c) return aviso("Escribí su correo de Google.");
    if (!esCorreo(c)) return aviso("Eso no tiene forma de correo: falta algo como «@gmail.com».");
    if (yaEsta(c)) return aviso("Ese correo ya está cargado (sin importar mayúsculas).");
    var id = "n" + Date.now();
    P.push({ id: id, nombre: aNombre.value.trim(), correo: c, estado: "activa", nunca: true, entro: "Todavía no entró", autorizada: "Autorizada recién", sesiones: [], huellas: [] });
    aCorreo.value = ""; aNombre.value = ""; alta.classList.remove("mal", "lleno"); aCorreo.removeAttribute("aria-invalid");
    filtro = "todas"; texto = ""; buscador.value = "";
    document.querySelectorAll("[data-filtro]").forEach(function (x) { var si = x.dataset.filtro === "todas"; x.classList.toggle("elegido", si); x.setAttribute("aria-pressed", String(si)); });
    if (!celu()) elegido = id;
    pintarLista(id);
    if (!celu()) pintarFicha(true);
    else { body.classList.remove("u-componiendo"); aCorreo.blur(); }
    M.tostada("Autorizada. Avisale que entre con Google con ese correo.", "user-check"); vibrar(10);
  });
  // Como en la variante 2: el nombre se enciende al empezar a escribir el correo; en el celular, al
  // tocar la línea se abre para escribir, como un mensaje, y se cierra con «Cancelar» o al autorizar.
  aCorreo.addEventListener("input", function () { alta.classList.remove("mal"); aCorreo.removeAttribute("aria-invalid"); alta.classList.toggle("lleno", aCorreo.value.length > 0); M.desmarcar(); });
  aCorreo.addEventListener("focus", function () { if (celu()) body.classList.add("u-componiendo"); });
  $("u-alta-cancelar").addEventListener("click", function () {
    aCorreo.value = ""; aNombre.value = ""; alta.classList.remove("lleno", "mal"); body.classList.remove("u-componiendo"); document.activeElement.blur();
  });
  // El texto del campo, largo en la computadora y corto en el celular (00 · R3.2).
  function placeholder() { if (!aCorreo.dataset.largo) aCorreo.dataset.largo = aCorreo.placeholder; aCorreo.placeholder = celu() ? aCorreo.dataset.corto : aCorreo.dataset.largo; }
  placeholder(); window.addEventListener("resize", placeholder);

  // ---------- Teclado (computadora): ↑ ↓ recorren la lista y la tarjeta las sigue ----------
  function botonesFicha() { return [].slice.call(ficha.querySelectorAll(".u-item .btn")); }
  function enTexto(el) { return el && /^(INPUT|TEXTAREA)$/.test(el.tagName); }
  document.addEventListener("keydown", function (e) {
    if (celu() || e.altKey || e.ctrlKey || e.metaKey || M.hayCapa()) return;
    var lado = $("lado"), act = document.activeElement;
    if (act && act.classList.contains("u-ed")) return;
    var enLado = M.marcado && lado.contains(M.marcado);
    var enFicha = M.marcado && ficha.contains(M.marcado);
    if (enFicha) {
      // En la tarjeta, ↑ ↓ recorren «Cerrar» y «Quitar» de cada sesión y celular, Enter toca el
      // marcado y ← vuelve a la lista.
      var bots = botonesFicha(), j = bots.indexOf(M.marcado);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); M.marcar(bots[Math.max(0, Math.min(bots.length - 1, j + (e.key === "ArrowDown" ? 1 : -1)))]); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); M.marcar(fila(elegido)); }
      else if (e.key === "Enter") {
        e.preventDefault(); M.marcado.click();
        // Lo tocado se va: la marca pasa al que queda en su lugar (o vuelve a la lista).
        setTimeout(function () { var r = botonesFicha(); M.marcar(r.length ? r[Math.min(j, r.length - 1)] : fila(elegido)); }, quieto() ? 20 : 280);
      }
      return;
    }
    if (e.key === "ArrowRight" && M.marcado && lista.contains(M.marcado) && !(enTexto(act) && act.value && act.selectionEnd < act.value.length)) {
      var b0 = botonesFicha()[0];
      if (b0) { e.preventDefault(); M.marcar(b0); }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (enLado) return; // el menú lo recorre el marco
      e.preventDefault();
      var filas = [].slice.call(lista.querySelectorAll(".u-fila"));
      if (!filas.length) return;
      var i = filas.findIndex(function (f) { return f.dataset.p === elegido; });
      if (!M.marcado) i = i < 0 ? 0 : i; else i = Math.max(0, Math.min(filas.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
      elegir(filas[i].dataset.p, true);
    } else if (e.key === "ArrowLeft" && !enLado) {
      // ← sale de la lista hacia el menú; con texto en una caja, solo desde el principio del texto.
      if (enTexto(act) && act.value && act.selectionStart > 0) return;
      e.preventDefault(); M.marcar($("mas"));
    } else if (e.key === "ArrowRight" && enLado && !(M.marcado === $("mas") && $("sub").hidden)) {
      if ($("sub").contains(M.marcado)) return;
      e.preventDefault(); var f = fila(elegido); if (f) M.marcar(f);
    }
  });

  // Usuarios en el panel de Más: es la opción abierta; tocarla cierra el panel.
  $("sub-usuarios").addEventListener("click", function () { $("mas").click(); });

  // ---------- La conexión (R2.2): sin conexión se ve gris; al volver, anda sola ----------
  var antes = M.net;
  M.alCambiar(function (net) {
    if (antes === "offline" && net !== "offline") M.tostada("Volvió la conexión.", "wifi");
    if (net === "offline") { cerrar(); M.desmarcar(); }
    antes = net;
  });

  // Si cambia el ancho (de computadora a celular o al revés), se rearma la disposición.
  var eraCelu = celu();
  window.addEventListener("resize", function () {
    if (celu() === eraCelu) return;
    eraCelu = celu();
    body.classList.remove("u-con-ficha", "u-componiendo");
    if (!eraCelu && !elegido) elegido = "gb";
    repintar();
  });

  pintarLista(); pintarFicha();
  // Al abrir, el cursor está en la caja principal (00 · R2.2); en el celular, nunca (R2.12).
  if (!celu()) aCorreo.focus({ preventScroll: true });
})();
