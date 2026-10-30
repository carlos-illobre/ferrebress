/* Variante 3 · «El tablero». Usuarios como el tablero eléctrico del local: cada persona es un
   circuito, cada sesión una térmica que se baja de un toque, la general las baja todas (se
   mantiene apretada) y la llave da de baja o de alta (también se mantiene). Sin menú: la
   pantalla entera es el tablero. */
(function () {
  var CELU = document.body.classList.contains("es-celu");
  var P = window.PERSONAS, esc = UA.esc;
  var panel = document.getElementById("tablero");
  var nuevoId = null;

  function corto(d) { return d.replace("Chrome en ", "").replace("Edge en ", ""); }
  function termica(p, it, huella) {
    var uso = huella ? "Huella" : it.uso.replace("Usada ", "").replace("hace ", "");
    return '<button class="termica' + (huella ? " th" : "") + '" data-p="' + p.id + '" data-' + (huella ? "h" : "s") + '="' + it.id + '" title="' + it.disp + (huella ? " · celular con huella · " + it.vinculo : " · " + it.como + " · " + it.desde + " · " + it.uso) + '">' +
      '<span class="caja"><span class="ventana"></span><span class="palanca"></span></span>' +
      '<span class="rot"><i class="i i-s" data-i="' + (huella ? "fingerprint" : it.tipo === "phone" ? "smartphone" : "monitor") + '"></i>' + corto(it.disp) + '</span><span class="rot2">' + (huella ? "con huella" : it.como + " · " + uso) + "</span></button>";
  }

  function circuito(p) {
    var baja = p.estado === "baja", vos = p.estado === "vos";
    var h = '<div class="circuito' + (baja ? " baja" : "") + (p.nunca ? " nunca" : "") + (p.id === nuevoId ? " entra recien" : "") + '" data-p="' + p.id + '" tabindex="-1">';
    h += '<div class="placa"><button class="placa-btn" data-acc="editar" data-p="' + p.id + '" aria-label="Cambiar los datos">' +
      '<span class="avatar' + (baja ? " baja" : "") + '" style="' + UA.tono(p) + '">' + (baja ? '<i class="i i-s" data-i="ban"></i>' : UA.iniciales(p)) + "</span>" +
      '<span class="pl"><b>' + esc(UA.mostrar(p)) + (vos ? ' <span class="pastilla vos">Vos</span>' : "") + "</b><span>" + (p.nombre ? esc(p.correo) : "Sin nombre") + "</span>" +
      '<span class="pl-lin"><span class="pastilla pino adm"><i class="i i-s" data-i="shield-check"></i>Administrador</span><span class="ult' + (p.nunca ? " nu" : "") + '">' + p.entro + "</span></span></span></button></div>";
    /* La llave */
    h += '<div class="llave-z">' + (vos
      ? '<div class="llave fija" title="Tu llave la gira otro Administrador"><span class="cil"><span class="ranura"></span></span><span class="ll-t"><i class="i i-s" data-i="lock"></i>La tuya</span></div>'
      : '<button class="llave' + (baja ? " girada" : "") + '" data-hold="llave" data-p="' + p.id + '" aria-label="' + (baja ? "Dar de alta" : "Dar de baja") + ' (mantené)"><span class="cil"><span class="ranura"></span></span><span class="ll-t">' + (baja ? "De baja" : "Activa") + '</span><span class="carga"><b></b></span></button>') + "</div>";
    /* El riel */
    h += '<div class="riel">';
    if (baja) {
      h += '<div class="tarjeta-bloqueo"><span class="ojal"></span><b>DE BAJA</b><span>No entra. Mantené la llave para darle de alta: sus huellas no vuelven.</span></div>';
    } else if (p.nunca) {
      h += '<div class="sin-estrenar"><i class="i" data-i="hourglass"></i><span><b>Sin estrenar.</b> Avisale que entre con Google.</span><button class="btn chico btn-peligro" data-acc="borrar" data-p="' + p.id + '"><i class="i i-s" data-i="trash-2"></i>Desarmar</button></div>';
    } else {
      var n = p.sesiones.length;
      h += '<button class="general' + (n ? "" : " off") + '" data-hold="general" data-p="' + p.id + '"' + (n ? "" : " disabled") + ' aria-label="Cerrar todas (mantené)"><span class="caja"><span class="ventana"></span><span class="palanca"></span></span><span class="rot">General</span><span class="rot2">' + (n ? (n === 1 ? "cierra la sesión" : "cierra las " + n) : "nada abierto") + '</span><span class="carga"><b></b></span></button>';
      h += '<span class="sep"></span>';
      h += p.sesiones.map(function (s) { return termica(p, s, false); }).join("");
      if (p.huellas.length) h += '<span class="sep fina"></span>' + p.huellas.map(function (x) { return termica(p, x, true); }).join("");
      if (!n && !p.huellas.length) h += '<span class="vacio-r">Todo apagado</span>';
      if (vos) h += '<span class="vacio-r nota">Este aparato no está en el tablero: se apaga con «Salir». Tus huellas, en Configuración.</span>';
    }
    return h + "</div></div>";
  }

  function pintar() {
    UA.ordenar();
    var act = P.filter(function (p) { return p.estado !== "baja"; }), baja = P.filter(function (p) { return p.estado === "baja"; });
    var h = act.map(circuito).join("");
    h += '<form class="circuito vacio" id="nuevo" novalidate><div class="placa"><span class="mas"><i class="i" data-i="user-plus"></i></span><div class="campos"><input id="n-correo" placeholder="Circuito nuevo: correo de Google" autocomplete="off" aria-label="Correo de Google"><input id="n-nombre" placeholder="Nombre (opcional)" autocomplete="off" aria-label="Nombre"></div></div>' +
      '<div class="nuevo-pie"><span class="err"><i class="i i-s" data-i="circle-alert"></i><span></span></span><span class="ayuda">No le llega nada: avisale vos.</span><button class="btn btn-oscuro" type="submit"><i class="i i-s" data-i="plug-zap"></i>Conectar' + (CELU ? "" : ' <span class="kbd">Enter</span>') + "</button></div></form>";
    if (baja.length) h += '<div class="divisor"><span>Desconectadas · ' + baja.length + "</span></div>" + baja.map(circuito).join("");
    panel.innerHTML = h;
    window.pintarIconos(panel);
    var ses = 0, hu = 0; act.forEach(function (p) { ses += p.sesiones.length; hu += p.huellas.length; });
    document.querySelectorAll("[data-n]").forEach(function (e) { e.textContent = { act: act.length, ses: ses, hu: hu }[e.dataset.n]; });
    var f = document.getElementById("nuevo");
    f.addEventListener("submit", conectar);
    f.querySelector("#n-correo").addEventListener("input", function () { f.classList.remove("mal"); });
    if (nuevoId) { var r = panel.querySelector('[data-p="' + nuevoId + '"]'); if (r) r.scrollIntoView({ block: "nearest" }); nuevoId = null; }
  }

  function conectar(e) {
    e.preventDefault();
    var f = e.target, c = f.querySelector("#n-correo").value.trim(), err = f.querySelector(".err span");
    if (!UA.esCorreo(c)) { err.textContent = "No tiene forma de correo"; f.classList.add("mal"); return; }
    if (UA.yaEsta(c)) { err.textContent = "Ese correo ya está en el tablero"; f.classList.add("mal"); return; }
    nuevoId = "n" + Date.now();
    P.push({ id: nuevoId, nombre: f.querySelector("#n-nombre").value.trim(), correo: c, estado: "activa", nunca: true, entro: "Todavía no entró", autorizada: "Autorizada recién", sesiones: [], huellas: [] });
    pintar(); UI.tostada("Circuito conectado. Avisale que entre con Google", "user-check"); UA.vibrar(10);
  }

  /* ---- Bajar una térmica: un toque, sin confirmar ---- */
  function bajar(btn) {
    var p = UA.buscar(btn.dataset.p);
    btn.classList.add("abajo"); UA.vibrar(10);
    setTimeout(function () {
      btn.classList.add("sale");
      setTimeout(function () {
        if (btn.dataset.s) { var s = p.sesiones.filter(function (x) { return x.id === btn.dataset.s; })[0]; p.sesiones.splice(p.sesiones.indexOf(s), 1); UI.tostada("Sesión cerrada · " + s.disp + " de " + UA.mostrar(p), "power"); }
        else { var x = p.huellas.filter(function (y) { return y.id === btn.dataset.h; })[0]; p.huellas.splice(p.huellas.indexOf(x), 1); p.sesiones = p.sesiones.filter(function (s) { return !(s.tipo === "phone" && s.como === "Huella"); }); UI.tostada("Celular quitado: sin huella ni sesión", "unlink"); }
        pintar();
      }, 200);
    }, 260);
  }

  /* ---- Mantener apretado: la general (cerrar todas) y la llave (baja / alta) ---- */
  var hold = null;
  function empezar(el) {
    if (hold || el.disabled) return;
    el.classList.add("sosteniendo");
    hold = { el: el, t: setTimeout(function () { soltar(true); }, UA.quieto() ? 600 : 1100) };
  }
  function soltar(listo) {
    if (!hold) return;
    var el = hold.el; clearTimeout(hold.t); hold = null;
    el.classList.remove("sosteniendo");
    if (!listo) return;
    var p = UA.buscar(el.dataset.p);
    UA.vibrar([10, 40, 10]);
    if (el.dataset.hold === "general") {
      var row = panel.querySelector('.circuito[data-p="' + p.id + '"]');
      el.classList.add("abajo");
      row.querySelectorAll(".termica:not(.th)").forEach(function (t, i) { setTimeout(function () { t.classList.add("abajo"); }, 80 * (i + 1)); });
      var n = p.sesiones.length;
      setTimeout(function () { p.sesiones = []; pintar(); UI.tostada(n === 1 ? "Se cerró la sesión" : "Se cerraron las " + n + " sesiones", "power"); }, 80 * n + 450);
    } else if (p.estado === "baja") {
      el.classList.remove("girada"); p.estado = "activa";
      setTimeout(function () { nuevoId = p.id; pintar(); UI.tostada(UA.mostrar(p) + " puede entrar otra vez", "user-check"); }, 320);
    } else {
      el.classList.add("girada");
      var r = panel.querySelector('.circuito[data-p="' + p.id + '"]');
      r.querySelectorAll(".termica, .general").forEach(function (t, i) { setTimeout(function () { t.classList.add("abajo"); }, 60 * i); });
      setTimeout(function () { p.estado = "baja"; p.sesiones = []; p.huellas = []; pintar(); var b = panel.querySelector('.circuito[data-p="' + p.id + '"]'); if (b) { b.classList.add("cuelga"); b.scrollIntoView({ block: "nearest" }); } UI.tostada(UA.mostrar(p) + " quedó desconectada", "user-x"); }, 700);
    }
  }
  panel.addEventListener("pointerdown", function (e) { var h = e.target.closest("[data-hold]"); if (h) { e.preventDefault(); empezar(h); } });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { panel.addEventListener(ev, function () { if (hold) soltar(false); }, true); });
  document.addEventListener("keydown", function (e) {
    var h = document.activeElement && document.activeElement.closest && document.activeElement.closest("[data-hold]");
    if (h && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); if (!e.repeat) empezar(h); }
  });
  document.addEventListener("keyup", function (e) { if ((e.key === "Enter" || e.key === " ") && hold) soltar(false); });

  panel.addEventListener("click", function (e) {
    var t = e.target.closest(".termica"); if (t) { bajar(t); return; }
    var a = e.target.closest("[data-acc]"); if (!a) return;
    var p = UA.buscar(a.dataset.p);
    if (a.dataset.acc === "borrar") { var r = a.closest(".circuito"); r.classList.add("sale"); setTimeout(function () { P.splice(P.indexOf(p), 1); pintar(); UI.tostada("Se desarmó el alta de " + p.correo, "trash-2"); }, 200); }
    if (a.dataset.acc === "editar") editar(p);
  });

  /* ---- La placa: cambiar nombre (y correo si nunca entró) ---- */
  var ed = document.getElementById("editar"), eNom = document.getElementById("e-nombre"), eCor = document.getElementById("e-correo"), editando;
  function editar(p) {
    if (p.estado === "baja") return;
    editando = p; eNom.value = p.nombre; eCor.value = p.correo; eCor.disabled = !p.nunca;
    ed.querySelector(".cor").classList.remove("mal");
    ed.querySelector(".cor .ayuda").textContent = p.nunca ? "Se puede cambiar: todavía no entró." : "Atado a su cuenta de Google desde que entró.";
    eNom.placeholder = p.nunca ? "Vacío: se ve su correo" : "Vacío: vuelve al de Google";
    UI.abrir(ed);
  }
  ed.addEventListener("submit", function (e) {
    e.preventDefault();
    var p = editando, c = eCor.value.trim();
    if (p.nunca && (!UA.esCorreo(c) || (c.toLowerCase() !== p.correo.toLowerCase() && UA.yaEsta(c)))) { ed.querySelector(".cor .err span").textContent = !UA.esCorreo(c) ? "No tiene forma de correo" : "Ese correo ya está cargado"; ed.querySelector(".cor").classList.add("mal"); return; }
    p.nombre = eNom.value.trim(); if (p.nunca) p.correo = c;
    UI.cerrar(); pintar(); UI.tostada("Placa actualizada", "check");
  });

  /* ---- Teclado: flechas por el tablero ---- */
  document.addEventListener("keydown", function (e) {
    if (CELU || UI.estaAbierto()) return;
    if (/INPUT/.test(document.activeElement.tagName)) return;
    if (e.altKey && e.key.toLowerCase() === "n") { e.preventDefault(); document.getElementById("n-correo").focus(); return; }
    var rows = [].slice.call(panel.querySelectorAll(".circuito:not(.vacio)"));
    var cur = document.activeElement.closest ? document.activeElement.closest(".circuito") : null;
    var items = function (r) { return [].slice.call(r.querySelectorAll(".placa-btn, .llave:not(.fija), .general:not([disabled]), .termica, [data-acc=borrar]")); };
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      var i = Math.max(0, Math.min(rows.length - 1, rows.indexOf(cur) + (e.key === "ArrowDown" ? 1 : -1)));
      var it = items(rows[i]); var k = cur ? items(cur).indexOf(document.activeElement) : 0;
      (it[Math.min(Math.max(k, 0), it.length - 1)] || rows[i]).focus();
    }
    if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && cur) {
      e.preventDefault();
      var its = items(cur), j = its.indexOf(document.activeElement) + (e.key === "ArrowRight" ? 1 : -1);
      if (its[j]) its[j].focus();
    }
    if (e.key === "Escape" && !UI.estaAbierto()) window.irAMaqueta && window.irAMaqueta("business-overview");
  });

  UI.conexion("[data-luz]", "En línea", "Sin conexión");
  pintar();
  if (!CELU) { var first = panel.querySelector(".placa-btn"); if (first) first.focus({ preventScroll: true }); }
})();
