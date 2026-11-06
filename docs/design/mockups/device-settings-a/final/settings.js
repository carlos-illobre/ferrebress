/* Más → Configuración · maqueta final (computadora y celular, una sola página).
   Base: ../extra/shared.js y ../extra/v1.js del director; «Así la tenés» y «Volver a como viene»
   salen de ../extra/v2.js.
   DS.prefs son las preferencias de la persona en este dispositivo (R1.3); DS.casos, cómo es el
   dispositivo, para ver cada caso de la regla desde el botón «Casos» (no es parte del diseño).
   No consulta la red: la hora corre con un temporizador local. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mqCelu = window.matchMedia("(max-width: 899px)");
  var mqQuieto = window.matchMedia("(prefers-reduced-motion: reduce)");
  var celu = function () { return mqCelu.matches; };

  var COMO_VIENE = { anim: true, hora: "sistema" }; // R1.11, R2.1, R3.1
  var DS = window.DS = {
    prefs: { anim: true, hora: "sistema", offline: false },
    casos: { sistemaQuieto: mqQuieto.matches, instalar: "puede", huella: "con" }
  };
  if (/captura/.test(location.hash)) document.body.classList.add("captura");

  /* ---------- La hora: arranca en 14:30 (la del ejemplo de la regla) y avanza de verdad ---------- */
  var base = new Date(); base.setHours(14, 30, 0, 0);
  var t0 = Date.now();
  var NOMBRE_HORA = { sistema: "Como el sistema", "24": "24 horas", "12": "a. m./p. m." };
  function ahora() { return new Date(base.getTime() + (Date.now() - t0)); }
  function hora(fmt, d) {
    d = d || ahora();
    var h = d.getHours(), m = ("0" + d.getMinutes()).slice(-2);
    if (fmt === "app") fmt = DS.prefs.hora;
    if (fmt === "12") return (h % 12 || 12) + ":" + m + " " + (h < 12 ? "a. m." : "p. m.");
    return h + ":" + m; // «Como el sistema»: este dispositivo muestra 24 horas
  }
  function pintarHoras() {
    $$("[data-hora]").forEach(function (el) {
      var f = el.getAttribute("data-hora"), a = el.getAttribute("data-a"), d;
      if (a) { d = new Date(base); d.setHours(+a.split(":")[0], +a.split(":")[1]); }
      var txt = hora(f, d);
      if (el.textContent !== txt) el.textContent = txt;
    });
  }
  setInterval(pintarHoras, 5000);

  /* ---------- Animaciones: prendidas, apagadas o el sistema manda (R2.3) ---------- */
  function animando() { return DS.prefs.anim && !DS.casos.sistemaQuieto; }
  function comoViene() { return DS.prefs.anim === COMO_VIENE.anim && DS.prefs.hora === COMO_VIENE.hora; }
  function vibrar(p) { if (celu()) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* sin vibración */ } } }

  /* ---------- Tostadas ---------- */
  function tostada(texto, icono) {
    var box = $(".tostadas");
    if (!box) { box = document.createElement("div"); box.className = "tostadas"; box.setAttribute("role", "status"); document.body.appendChild(box); }
    var t = document.createElement("div");
    t.className = "tostada";
    t.innerHTML = '<i class="i" data-i="' + (icono || "circle-check") + '"></i><span>' + texto + "</span>";
    box.appendChild(t);
    window.pintarIconos(t);
    setTimeout(function () { t.classList.add("se-va"); setTimeout(function () { t.remove(); }, animando() ? 220 : 0); }, 2600);
  }

  /* ---------- Instalar: el pedido del navegador, simulado (R4.1, E20) ---------- */
  var volverA = null;
  function cerrarCapa() {
    var c = $(".capa.abierta"); if (!c) return;
    c.classList.remove("abierta");
    setTimeout(function () { c.remove(); }, animando() ? 320 : 0);
    if (volverA && document.contains(volverA)) volverA.focus();
  }
  function instalar() {
    volverA = document.activeElement;
    var c = document.createElement("div");
    c.className = "capa";
    c.innerHTML = '<div class="dialogo" role="dialog" aria-modal="true" aria-labelledby="pedido-titulo">' + (celu() ? '<div class="asa"></div>' : "") +
      '<div class="pedido-nav"><span class="pedido-ico"><img src="../../../common/brand/isotype.svg" alt=""></span><h2 id="pedido-titulo">¿Instalar la aplicación?</h2><span class="pedido-sitio">Ferrebress · ferrebress.com.ar</span></div>' +
      '<p class="t-detalle pedido-nota">Esto lo pregunta el navegador, no Ferrebress. Queda con su ícono, como cualquier otra aplicación.</p>' +
      '<div class="pie-dialogo"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button><button type="button" class="btn btn-oscuro" data-confirma>Instalar</button></div></div>';
    document.body.appendChild(c);
    c.addEventListener("click", function (e) {
      if (e.target === c || e.target.closest("[data-cerrar]")) cerrarCapa();
      if (e.target.closest("[data-confirma]")) {
        cerrarCapa();
        setTimeout(function () { caso("instalar", "navegador"); tostada("Listo: Ferrebress quedó con su ícono", "circle-check"); vibrar([10, 40, 10]); }, 180);
      }
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add("abierta"); $("[data-confirma]", c).focus(); }); });
  }

  /* ---------- Cambiar ---------- */
  function set(k, v) { DS.prefs[k] = v; render(); }
  function caso(k, v) { DS.casos[k] = v; render(); }

  $("[data-pref=anim]").addEventListener("click", function () { set("anim", !DS.prefs.anim); vibrar(10); });
  $$("[data-formato]").forEach(function (b) {
    b.addEventListener("click", function () { set("hora", b.getAttribute("data-formato")); vibrar(10); });
  });
  $("[data-pref=offline]").addEventListener("click", function () {
    if (!DS.prefs.offline && DS.casos.huella === "sinred") { tostada("Para prenderla hace falta conexión", "wifi-off"); return; }
    set("offline", !DS.prefs.offline);
    if (DS.prefs.offline) { tostada("Listo: este celular entra sin conexión", "circle-check"); vibrar([10, 40, 10]); }
  });
  // «Volver a como viene» (R1.11, E33): sin confirmación; no toca sin conexión ni instalar
  $("[data-reset]").addEventListener("click", function () {
    DS.prefs.anim = COMO_VIENE.anim; DS.prefs.hora = COMO_VIENE.hora;
    render();
    tostada("Volvió a como viene", "rotate-ccw");
    $("[data-pref=anim]").focus();
  });
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-instalar]")) instalar();
    if (e.target.closest("[data-indicador]")) tostada("El detalle del vínculo está en su maqueta aprobada", "smartphone");
    // Celular: cada pastilla de «Así la tenés» lleva a su preferencia
    var va = e.target.closest("[data-va]");
    if (va) {
      var fila = document.getElementById("ajuste-" + va.getAttribute("data-va"));
      if (fila) fila.scrollIntoView({ behavior: animando() ? "smooth" : "auto", block: "center" });
    }
  });

  /* ---------- Pintar ---------- */
  function render() {
    var p = DS.prefs, c = DS.casos, quiet = c.sistemaQuieto, chico = celu();
    document.body.classList.toggle("quieto", !animando());

    // Animaciones: la llave dice lo elegido; si el sistema pide no animar, no se toca y lo dice (R2.3)
    var ll = $("[data-pref=anim]");
    ll.setAttribute("aria-checked", p.anim ? "true" : "false");
    ll.disabled = quiet;
    var mu = $("[data-muestra]");
    mu.classList.toggle("en-el-acto", !p.anim && !quiet);
    mu.classList.toggle("quieta", quiet);
    $("[data-leyenda]").innerHTML = animando()
      ? "<b>Así se mueve ahora.</b> " + (chico ? "Corto, nunca te hace esperar." : "Corto: nunca te hace esperar.")
      : "<b>Así, en el acto.</b> " + (chico ? "Sin movimiento." : "Aparece y desaparece, sin moverse.");
    $("[data-aviso-sistema]").hidden = !quiet;

    // Formato de la hora
    $$("[data-formato]").forEach(function (b) { b.setAttribute("aria-checked", b.getAttribute("data-formato") === p.hora ? "true" : "false"); });

    // Instalar (R4): el renglón cambia según el navegador
    var ci = c.instalar;
    if (ci === "iphone" && !chico) ci = "nosabe";
    var filaInst = $("[data-fila-instalar]");
    filaInst.hidden = ci === "icono" || ci === "nosabe";
    var t = { puede: [chico ? "Instalar en este celular" : "Instalar en este dispositivo", chico ? "Abrila desde un ícono" : "Queda con su ícono, para abrirla como cualquier otra aplicación."],
      navegador: ["Ya está instalada", "Abrila desde su ícono."],
      iphone: ["Instalar en este celular", "Tocá Compartir y después Agregar a inicio"] }[ci] || ["", ""];
    $("[data-instalar-nombre]").textContent = t[0];
    $("[data-instalar-que]").textContent = t[1];
    $("[data-instalar-accion]").innerHTML = ci === "puede"
      ? '<button type="button" class="btn btn-accion chico" data-instalar><i class="i i-s" data-i="download"></i>Instalar <span class="kbd">I</span></button>'
      : ci === "navegador" ? '<span class="pastilla logro"><i class="i i-s" data-i="check"></i>Instalada</span>'
      : '<span class="pastilla contorno"><i class="i i-s" data-i="share"></i>Compartir</span>';

    // Trabajar sin conexión, solo en el celular (R5)
    var h = c.huella, filaOff = $("[data-fila-offline]"), lo = $("[data-pref=offline]");
    filaOff.hidden = h === "permiso";
    if (h === "sin") p.offline = false;
    lo.disabled = h === "sin";
    lo.setAttribute("aria-checked", p.offline ? "true" : "false");
    filaOff.classList.toggle("apagado", h === "sin");
    $("[data-offline-que]").textContent = h === "sin" ? "Para usarla, primero vinculá tu huella en este celular"
      : h === "sinred" && !p.offline ? "Para prenderla hace falta conexión"
      : p.offline ? "Entrás con tu huella aunque no haya internet, hasta 24 h" : "Entrá con tu huella aunque no haya internet";
    var conOff = chico && !filaOff.hidden;
    $("[data-grupo-final]").hidden = filaInst.hidden && !conOff;

    // «Así la tenés» (R1.10): lo elegido en cada preferencia de este dispositivo
    var tag = chico ? "button" : "span";
    function pastilla(va, icono, html) {
      return "<" + tag + (chico ? ' type="button" data-va="' + va + '"' : "") + ' class="pastilla asi-pastilla"><i class="i i-s" data-i="' + icono + '"></i>' + html + "</" + tag + ">";
    }
    $("[data-asi]").innerHTML =
      pastilla("anim", "sparkles", p.anim ? "Con movimiento" : "En el acto") +
      pastilla("hora", "clock", '<span data-hora="app"></span>' + (chico ? "" : '<span class="tipo">· ' + NOMBRE_HORA[p.hora] + "</span>")) +
      (filaInst.hidden ? "" : pastilla("instalar", "app-window", ci === "navegador" ? "Instalada" : chico ? "Navegador" : "En el navegador")) +
      (conOff ? pastilla("offline", "wifi-off", p.offline ? "También sin conexión" : "Solo con internet") : "");

    // «Volver a como viene» (R1.11, E34): ya como viene, no aparece
    $("[data-reset]").hidden = comoViene();

    pintarHoras();
    window.pintarIconos();
  }

  /* ---------- Teclado de la computadora (R1.9; 00 · R2): Alt muestra las teclas ---------- */
  var ALT = {
    a: "[data-pref=anim]",
    h: null, // recorre los tres formatos
    i: "[data-instalar]",
    o: "[data-reset]",
    l: ".indicador"
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { cerrarCapa(); return; }
    if (celu()) return;
    if (e.key === "Alt") { document.body.classList.add("alt"); e.preventDefault(); return; }
    if (!e.altKey || !e.key || e.key.length !== 1) return;
    var k = e.key.toLowerCase();
    if (!(k in ALT) || $(".capa.abierta")) return;
    e.preventDefault();
    if (k === "h") {
      var o = ["sistema", "24", "12"];
      set("hora", o[(o.indexOf(DS.prefs.hora) + 1) % 3]);
      $('[data-formato="' + DS.prefs.hora + '"]').focus();
      return;
    }
    var el = $(ALT[k]);
    if (el && !el.disabled && !el.closest("[hidden]")) { el.click(); if (document.contains(el)) el.focus(); }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") document.body.classList.remove("alt"); });
  window.addEventListener("blur", function () { document.body.classList.remove("alt"); });

  /* ---------- Casos: no es parte de la pantalla ---------- */
  function armarCasos() {
    var b = document.createElement("button");
    b.className = "casos-btn"; b.type = "button";
    b.innerHTML = '<i class="i i-s" data-i="sliders-horizontal"></i>Casos';
    var p = document.createElement("div");
    p.className = "casos"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Casos de la regla");
    function radios(name, opts) {
      return opts.map(function (o) { return '<label><input type="radio" name="' + name + '" value="' + o[0] + '"' + (DS.casos[name] === o[0] ? " checked" : "") + ">" + o[1] + "</label>"; }).join("");
    }
    p.innerHTML = '<h3>Casos de la regla</h3><p class="casos-nota">No es parte de la pantalla: cambia cómo es el dispositivo para ver cada caso.</p>' +
      '<fieldset><legend>El sistema</legend><label><input type="checkbox" name="sistemaQuieto"' + (DS.casos.sistemaQuieto ? " checked" : "") + ">Pide no animar (reducir movimiento)</label></fieldset>" +
      "<fieldset><legend>Instalar</legend>" + radios("instalar", [["puede", "El navegador sabe instalar"], ["navegador", "Ya instalada, abierta en el navegador"], ["icono", "Abierta desde su ícono"], ["iphone", "iPhone (solo celular)"], ["nosabe", "El navegador no sabe instalar"]]) + "</fieldset>" +
      '<fieldset class="solo-celu"><legend>Trabajar sin conexión (celular)</legend>' + radios("huella", [["con", "Con el permiso y la huella"], ["sin", "Con el permiso, sin la huella"], ["sinred", "Con todo, pero ahora sin conexión"], ["permiso", "Sin el permiso"]]) + "</fieldset>";
    p.addEventListener("change", function (e) {
      var t = e.target;
      caso(t.name, t.type === "checkbox" ? t.checked : t.value);
    });
    b.addEventListener("click", function () { p.classList.toggle("abierto"); });
    document.body.appendChild(b); document.body.appendChild(p);
    window.pintarIconos(b);
  }

  // Si el sistema cambia «reducir movimiento» con la pantalla abierta, manda al momento (R1.4, R2.3)
  function alCambiar(mq, f) { if (mq.addEventListener) mq.addEventListener("change", f); else mq.addListener(f); }
  alCambiar(mqQuieto, function () { caso("sistemaQuieto", mqQuieto.matches); var cb = $('.casos input[name="sistemaQuieto"]'); if (cb) cb.checked = mqQuieto.matches; });
  alCambiar(mqCelu, render);

  armarCasos();
  render();
})();
