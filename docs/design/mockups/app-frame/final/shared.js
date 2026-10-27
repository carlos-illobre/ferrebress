/* El marco · copia de ../shared.js para la maqueta final (con alMarcar) (sin librerías ni internet).
   - La conexión: body[data-net] = online | offline | sending, y los textos de la luz.
   - Lo pendiente: se pinta en cada [data-pendiente].
   - El selector de la maqueta (fuera del diseño) para ver la luz en cada estado.
   - Las teclas: Alt muestra los atajos (data-key), Esc cierra lo de encima, la marca.
   - La tostada y Salir (vuelve a la entrada). */
(function () {
  var F = window.Marco = {};
  var body = document.body;
  F.reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  F.angosto = function () { return window.matchMedia("(max-width: 899px)").matches; };
  F.ENTRADA = "../../sign-in/adapted/index.html";

  // ---------- La conexión ----------
  var LUZ = {
    online:  { largo: "En línea · todo enviado", corto: "En línea" },
    offline: { largo: "Sin conexión · 3 por enviar", corto: "Sin conexión · 3" },
    sending: { largo: "Enviando…", corto: "Enviando…" }
  };
  // Lo que queda en el dispositivo. No hay ningún módulo todavía: solo lo que guarda el propio marco.
  var PENDIENTE = [
    { ic: "bug", que: "Aviso de «Algo salió mal»", cuando: "hoy 10:41", quien: "Rubén Paredes" },
    { ic: "log-out", que: "Salida de la sesión", cuando: "hoy 9:58", quien: "Marta Quiroga" },
    { ic: "bug", que: "Aviso de «Algo salió mal»", cuando: "ayer 19:12", quien: "Marta Quiroga" }
  ];
  var oyentes = [];
  F.net = "online";
  F.alCambiar = function (fn) { oyentes.push(fn); };
  F.textoLuz = function (estado) { var t = LUZ[estado || F.net]; return '<span class="largo">' + t.largo + '</span><span class="corto">' + t.corto + "</span>"; };

  function pintarPendiente(el) {
    var n = F.net, h;
    if (n === "online") {
      h = '<div class="pend-cab"><span class="ico"><i class="i" data-i="check"></i></span><div><b>Todo enviado</b>' +
          '<small><span class="largo">No queda nada guardado en este dispositivo: el servidor tiene todo.</span><span class="corto">No queda nada por mandar.</span></small></div></div>' +
          '<div class="pend-vacio">Último envío: hoy 10:44 · Aviso de «Algo salió mal» de Rubén Paredes.</div>';
    } else {
      var envia = n === "sending";
      h = '<div class="pend-cab"><span class="ico"><i class="i" data-i="' + (envia ? "cloud-upload" : "wifi-off") + '"></i></span><div><b>' +
          (envia ? "Enviando 3 cosas" : "3 cosas por enviar") + "</b><small>" +
          (envia ? '<span class="largo">Volvió la conexión: se están mandando al servidor, una por una.</span><span class="corto">Se están mandando.</span>'
                 : '<span class="largo">Se mandan solas cuando vuelva la conexión. Mientras tanto quedan guardadas acá.</span><span class="corto">Se mandan solas al volver.</span>') +
          '</small></div></div><ul class="pend-lista">';
      PENDIENTE.forEach(function (p) {
        h += '<li class="pend-item"><span class="ic"><i class="i" data-i="' + p.ic + '"></i></span><div><b>' + p.que + "</b><small>" + p.cuando + " · " + p.quien + "</small></div>" +
             (envia ? '<span class="pastilla pino"><span class="gira"><i class="i i-s" data-i="refresh-cw"></i></span>Enviando</span>'
                    : '<span class="pastilla urgente">Por enviar</span>') + "</li>";
      });
      h += "</ul>";
    }
    el.innerHTML = h;
    window.pintarIconos(el);
  }

  F.ponerNet = function (estado) {
    F.net = estado;
    body.setAttribute("data-net", estado);
    document.querySelectorAll("[data-luz]").forEach(function (el) { el.innerHTML = F.textoLuz(estado); });
    document.querySelectorAll("[data-pendiente]").forEach(pintarPendiente);
    document.querySelectorAll(".demo-panel button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.net === estado)); });
    oyentes.forEach(function (fn) { fn(estado); });
  };

  // ---------- El selector de la maqueta (no es parte del diseño) ----------
  var demo = document.createElement("div");
  demo.className = "demo";
  demo.innerHTML = '<div class="demo-panel" role="group" aria-label="Estado de la conexión (maqueta)"><p>Maqueta · conexión</p>' +
    '<button type="button" data-net="online">En línea</button>' +
    '<button type="button" data-net="offline">Sin conexión, 3 por enviar</button>' +
    '<button type="button" data-net="sending">Enviando…</button></div>' +
    '<button type="button" class="demo-asa" aria-label="Estado de la conexión (maqueta)"><i class="i" data-i="sliders-horizontal"></i></button>';
  body.appendChild(demo);
  window.pintarIconos(demo);
  demo.querySelector(".demo-asa").addEventListener("click", function () { demo.classList.toggle("abierta"); });
  demo.querySelectorAll(".demo-panel button").forEach(function (b) {
    b.addEventListener("click", function () { F.ponerNet(b.dataset.net); });
  });

  // ---------- La tostada ----------
  var tostadaVieja = null, tTimer = null;
  F.tostada = function (html, icono) {
    if (tostadaVieja) tostadaVieja.remove();
    clearTimeout(tTimer);
    var t = document.createElement("div");
    t.className = "f-tostada";
    t.setAttribute("role", "status");
    t.innerHTML = '<div class="tostada"><i class="i" data-i="' + (icono || "clock") + '"></i><span>' + html + "</span></div>";
    body.appendChild(t);
    window.pintarIconos(t);
    tostadaVieja = t;
    tTimer = setTimeout(function () {
      t.classList.add("sale");
      setTimeout(function () { t.remove(); }, F.reducido ? 0 : 200);
    }, 2400);
  };
  // Lo que todavía no está: se sacude y lo dice.
  F.noEsta = function (el, nombre, donde) {
    if (el) { el.classList.remove("no-esta"); void el.offsetWidth; el.classList.add("no-esta"); }
    if (navigator.vibrate && F.angosto()) { try { navigator.vibrate(10); } catch (e) {} }
    F.tostada("<b>" + nombre + "</b> " + (donde || "todavía no está. Aparece cuando se sume."), "clock");
  };

  // ---------- Salir ----------
  F.salir = function () {
    body.classList.add("saliendo");
    setTimeout(function () { location.href = F.ENTRADA; }, F.reducido ? 0 : 260);
  };

  // ---------- La marca del teclado (las flechas no mueven el cursor) ----------
  // alMarcar(fn): fn(el) cada vez que la marca cambia (el = null cuando se esconde).
  F.marcado = null;
  var oyentesMarca = [];
  F.alMarcar = function (fn) { oyentesMarca.push(fn); };
  F.marcar = function (el) {
    F.desmarcar();
    if (!el) return;
    F.marcado = el;
    el.classList.add("marca-tecla");
    if (el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    oyentesMarca.forEach(function (fn) { fn(el); });
  };
  F.desmarcar = function () {
    if (!F.marcado) return;
    F.marcado.classList.remove("marca-tecla"); F.marcado = null;
    oyentesMarca.forEach(function (fn) { fn(null); });
  };
  document.addEventListener("mousemove", function (e) { if (F.marcado && (e.movementX || e.movementY)) F.desmarcar(); });

  // ---------- Lo que está encima: Esc lo cierra ----------
  var capas = [];
  // body.con-capa: con algo abierto encima, Alt muestra solo las teclas de eso (00 · R2.10).
  F.abrirCapa = function (cerrar) { capas.push(cerrar); body.classList.add("con-capa"); };
  F.cerrarCapa = function (cerrar) { var i = capas.indexOf(cerrar); if (i >= 0) capas.splice(i, 1); body.classList.toggle("con-capa", capas.length > 0); };
  F.hayCapa = function () { return capas.length > 0; };
  F.cerrarArriba = function () { var c = capas.pop(); if (c) c(); return !!c; };

  function visible(el) { return el.offsetParent !== null || getComputedStyle(el).position === "fixed"; }

  // ---------- Alt: las teclas a la vista y los atajos ----------
  document.addEventListener("keydown", function (e) {
    if (e.key === "Alt") { body.classList.add("alt"); e.preventDefault(); return; }
    if (e.altKey && e.key.length === 1) {
      var k = e.key.toLowerCase();
      var raiz = document.querySelector(".capa-arriba") || document;
      var el = Array.prototype.find.call(raiz.querySelectorAll('[data-key="' + k + '"]'), visible);
      if (el) { e.preventDefault(); el.click(); }
      return;
    }
    if (e.key === "Escape") {
      if (demo.classList.contains("abierta")) { demo.classList.remove("abierta"); return; }
      if (!F.cerrarArriba()) F.desmarcar();
    }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") { body.classList.remove("alt"); e.preventDefault(); } });
  window.addEventListener("blur", function () { body.classList.remove("alt"); });

  F.ponerNet("online");
})();
