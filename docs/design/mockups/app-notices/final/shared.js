/* Los avisos del marco · maqueta final: lo común (copia propia, sin librerías ni internet).
   - Arma la escena: el marco aprobado (../../app-frame/final/, tal cual, en un iframe) y, en su
     área de trabajo, algo neutro con un botón «Guardar» que tarda (para ver la espera).
   - El selector de la maqueta (fuera del diseño): Nada · Espera (se sabe / no se sabe cuánto
     falta) · Versión nueva · Hay que actualizar · Algo salió mal. También se elige con #estado.
   - La espera simulada: a los 300 ms la marca del botón (00 · R7.2), a los 2 s el aviso (R7.3).
   - Las teclas: Alt muestra los atajos, Alt + letra los toca, Esc cierra lo de encima, Enter
     toca lo principal de lo de encima.
   - La tostada y la recarga simulada al actualizar.
   - Con un diálogo abierto, lo de atrás queda inerte (A.modal): ni el mouse ni Tab llegan.
   Cada variante pone sus funciones en Avisos.variante = { espera: {mostrar, avanzar, terminar},
   version, bloqueo, error, limpiar }. */
(function () {
  var A = window.Avisos = {};
  var body = document.body;
  A.reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  A.angosto = function () { return window.matchMedia("(max-width: 899px)").matches; };
  A.variante = {};
  A.estado = "nada";

  // Lo que el aviso de «Algo salió mal» guarda: qué se tocó y en qué pantalla, sin lo escrito,
  // sin datos de clientes ni la sesión (00 · R9.4).
  A.PASOS = [
    { hora: "10:41:07", que: "Tocó «Guardar»", donde: "Vender", ic: "mouse-pointer-click", fallo: true },
    { hora: "10:40:52", que: "Escribió en «Buscar» (lo escrito no se manda)", donde: "Vender", ic: "pencil" },
    { hora: "10:40:31", que: "Tocó «Sumar»", donde: "Vender", ic: "mouse-pointer-click" },
    { hora: "10:39:58", que: "Abrió Vender", donde: "El menú", ic: "shopping-cart" }
  ];
  A.CODIGO = "F-4821";

  // ---------- La escena ----------
  var escena = document.createElement("div");
  escena.className = "escena";
  escena.innerHTML =
    '<iframe class="marco" src="../../app-frame/final/index.html" title="El marco de la aplicación (aprobado)" tabindex="-1"></iframe>' +
    '<section class="atras" aria-label="Lo que se estaba haciendo (neutro)">' +
      '<div class="atras-cab"><span class="t-seccion">Lo que estabas haciendo</span><span class="pastilla contorno">3 renglones</span></div>' +
      '<div class="atras-fila"><span class="cuadro"></span><span class="lineas"><span class="hueso"></span><span class="hueso"></span></span><span class="hueso"></span></div>' +
      '<div class="atras-fila"><span class="cuadro"></span><span class="lineas"><span class="hueso"></span><span class="hueso"></span></span><span class="hueso"></span></div>' +
      '<div class="atras-fila"><span class="cuadro"></span><span class="lineas"><span class="hueso"></span><span class="hueso"></span></span><span class="hueso"></span></div>' +
      '<div class="atras-pie"><p class="t-detalle">Neutro: es la pantalla de cualquier módulo.</p>' +
      '<button type="button" class="btn btn-oscuro" id="guardar" data-key="g"><i class="i ic-normal" data-i="check"></i><span class="gira-ic"><i class="i" data-i="refresh-cw"></i></span>Guardar<span class="kbd">G</span></button></div>' +
    "</section>";
  body.insertBefore(escena, body.firstChild);
  A.escena = escena;
  A.atras = escena.querySelector(".atras");
  A.guardar = escena.querySelector("#guardar");

  var prueba = document.createElement("div");
  prueba.className = "prueba-arriba";
  prueba.setAttribute("aria-hidden", "true");
  prueba.innerHTML = '<div class="borde"></div><div class="cartel">Ambiente de prueba<span> · nada de esto es real</span></div>';
  body.appendChild(prueba);

  var recarga = document.createElement("div");
  recarga.className = "recarga";
  body.appendChild(recarga);

  // ---------- La espera simulada (00 · R7.1 a R7.3) ----------
  var timers = [];
  function despues(ms, fn) { timers.push(setTimeout(fn, ms)); }
  A.cancelarEspera = function () {
    timers.forEach(clearTimeout); timers = [];
    A.guardar.classList.remove("esperando"); A.guardar.removeAttribute("aria-busy");
    A.esperando = false;
  };
  A.esperar = function (sabe) {
    if (A.esperando) return;
    A.esperando = true;
    var total = sabe ? 7000 : 6000;
    var info = { sabe: sabe, que: "Guardando los cambios", queCorto: "Guardando", total: total };
    despues(300, function () { A.guardar.classList.add("esperando"); A.guardar.setAttribute("aria-busy", "true"); });
    despues(2000, function () {
      var v = A.variante.espera; if (v && v.mostrar) v.mostrar(info);
      var t0 = Date.now();
      (function tic() {
        var pasado = 2000 + (Date.now() - t0);
        var frac = Math.min(1, pasado / total);
        if (v && v.avanzar) v.avanzar(frac, Math.max(1, Math.ceil((total - pasado) / 1000)), info);
        if (frac < 1) despues(250, tic);
        else {
          A.guardar.classList.remove("esperando"); A.guardar.removeAttribute("aria-busy");
          A.esperando = false;
          if (v && v.terminar) v.terminar(info);
        }
      })();
    });
  };
  A.guardar.addEventListener("click", function () { A.esperar(A.estado !== "espera-sin"); });

  // ---------- Lo que está encima: Esc lo cierra, Enter toca lo principal ----------
  var capas = [];
  A.abrirCapa = function (el, cerrar) {
    capas.push({ el: el, cerrar: cerrar });
    el.classList.add("capa-arriba"); body.classList.add("con-capa");
  };
  A.cerrarCapa = function (el) {
    capas = capas.filter(function (c) { return c.el !== el; });
    el.classList.remove("capa-arriba"); body.classList.toggle("con-capa", capas.length > 0);
  };
  A.sacudir = function (el) {
    if (!el || A.reducido) return;
    el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-2px)" }, { transform: "translateX(0)" }], { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)" });
  };
  // Un diálogo deja inerte lo de atrás (el marco y lo que se estaba haciendo), sin tocarlo.
  A.modal = function (si) { escena.inert = !!si; };
  function visible(el) { return el.offsetParent !== null || getComputedStyle(el).position === "fixed"; }

  document.addEventListener("keydown", function (e) {
    // El teclado vale solo en la computadora (00 · R2): en el celular no hay atajos.
    if (A.angosto()) return;
    if (e.key === "Alt") { body.classList.add("alt"); e.preventDefault(); return; }
    var arriba = capas.length ? capas[capas.length - 1] : null;
    if (e.altKey && e.key.length === 1) {
      var raiz = arriba ? arriba.el : document;
      var el = Array.prototype.find.call(raiz.querySelectorAll('[data-key="' + e.key.toLowerCase() + '"]'), visible);
      if (el) { e.preventDefault(); el.click(); }
      return;
    }
    if (e.key === "Escape") {
      if (demo.classList.contains("abierta")) { demo.classList.remove("abierta"); return; }
      if (arriba) { if (arriba.cerrar) arriba.cerrar(); else A.sacudir(arriba.el.querySelector("[data-sacude]") || arriba.el); }
      return;
    }
    if (e.key === "Enter" && arriba && !(document.activeElement && document.activeElement.tagName === "BUTTON")) {
      var principal = arriba.el.querySelector("[data-enter]");
      if (principal && visible(principal)) { e.preventDefault(); principal.click(); }
    }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") body.classList.remove("alt"); });
  window.addEventListener("blur", function () { body.classList.remove("alt"); });

  // ---------- Aparecer y salir: la clase .entra o .sale arranca la animación de cada variante ----------
  A.mostrar = function (el) {
    if (!el) return;
    clearTimeout(el._sale);
    el.hidden = false; el.classList.remove("sale", "entra"); void el.offsetWidth; el.classList.add("entra");
  };
  A.ocultar = function (el, despuesDe) {
    if (!el || el.hidden) { if (despuesDe) despuesDe(); return; }
    el.classList.remove("entra"); el.classList.add("sale");
    el._sale = setTimeout(function () { el.hidden = true; el.classList.remove("sale"); if (despuesDe) despuesDe(); }, A.reducido ? 0 : 220);
  };
  A.MINI = '<div class="mini-captura" aria-hidden="true"><div class="mc-tarjeta"><i></i><i></i><i></i><i></i></div><span class="mc-boton"></span><span class="mc-toque"></span></div>';

  // ---------- La tostada ----------
  var tost = null, tTimer = null;
  A.tostada = function (html, icono) {
    if (tost) tost.remove();
    clearTimeout(tTimer);
    var t = document.createElement("div");
    t.className = "a-tostada"; t.setAttribute("role", "status");
    t.innerHTML = '<div class="tostada"><i class="i" data-i="' + (icono || "check") + '"></i><span>' + html + "</span></div>";
    body.appendChild(t); window.pintarIconos(t); tost = t;
    tTimer = setTimeout(function () { t.classList.add("sale"); setTimeout(function () { t.remove(); }, A.reducido ? 0 : 200); }, 2800);
  };

  // ---------- Actualizar: la aplicación se recarga y vuelve a la misma parte (00 · E30) ----------
  A.recargar = function (alTerminar) {
    recarga.classList.add("si");
    setTimeout(function () {
      if (alTerminar) alTerminar();
      A.poner("nada", true);
      setTimeout(function () {
        recarga.classList.remove("si");
        A.tostada('<b>Versión nueva.</b> <span class="largo">Seguís en Vender, como estabas.</span><span class="corto">Seguís en Vender.</span>', "sparkles");
      }, 250);
    }, A.reducido ? 300 : 900);
  };

  // ---------- El selector de la maqueta (no es parte del diseño) ----------
  var ESTADOS = [
    ["nada", "Nada"],
    ["espera", "1 · Espera (se sabe cuánto falta)"],
    ["espera-sin", "1 · Espera (no se sabe)"],
    ["version", "2 · Hay una versión nueva"],
    ["bloqueo", "3 · Hay que actualizar"],
    ["error", "4 · Algo salió mal"]
  ];
  var demo = document.createElement("div");
  demo.className = "demo";
  demo.innerHTML = '<div class="demo-panel" role="group" aria-label="Qué aviso se ve (maqueta)"><p>Maqueta · aviso</p>' +
    ESTADOS.map(function (s) { return '<button type="button" data-estado="' + s[0] + '">' + s[1] + "</button>"; }).join("") +
    '</div><button type="button" class="demo-asa" aria-label="Qué aviso se ve (maqueta)"><i class="i" data-i="bell"></i></button>';
  body.appendChild(demo);
  demo.querySelector(".demo-asa").addEventListener("click", function () { demo.classList.toggle("abierta"); });
  demo.querySelectorAll(".demo-panel button").forEach(function (b) {
    b.addEventListener("click", function () { A.poner(b.dataset.estado); });
  });

  A.poner = function (estado, sinLimpiarHash) {
    A.cancelarEspera();
    capas.slice().forEach(function (c) { A.cerrarCapa(c.el); });
    body.classList.remove("tapa-todo"); A.modal(false);
    if (A.variante.limpiar) A.variante.limpiar();
    A.estado = estado;
    body.setAttribute("data-aviso", estado);
    demo.querySelectorAll(".demo-panel button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.estado === estado)); });
    try { history.replaceState(null, "", "#" + estado); } catch (e) {}
    if (estado === "espera" || estado === "espera-sin") { A.guardar.click(); }
    else if (A.variante[estado]) A.variante[estado]();
  };

  A.empezar = function () {
    window.pintarIconos(document.body);
    var h = (location.hash || "").slice(1);
    var ok = ESTADOS.some(function (s) { return s[0] === h; });
    A.poner(ok ? h : "espera");
  };
})();
