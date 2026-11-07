/* Más → Configuración · «Lo tuyo» (04 · etapa b). El estado y lo que comparten las tres variantes.
   LT.estado son los dispositivos de Rubén Paredes, como los tendría el servidor; cada variante los
   pinta a su manera con LT.alPintar(f). Nada consulta la red: los datos son de ejemplo.
   La computadora es «pc-oficina» (sin nombre: «Chrome en Windows»); el celular, «celu-ruben». */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mqCelu = window.matchMedia("(max-width: 899px)");
  var mqQuieto = window.matchMedia("(prefers-reduced-motion: reduce)");
  var enCelu = location.pathname.indexOf("/phone/") >= 0 || mqCelu.matches;
  if (/captura/.test(location.hash)) document.body.classList.add("captura");

  // Los nombres que ya usan otros dispositivos de la ferretería (para avisar si se repite, R9.3)
  var DE_OTROS = ["Compu del mostrador", "Celu de Juan", "Caja 2", "Tablet del depósito"];

  function inicial() {
    return [
      { id: "pc-oficina", tipo: "pc", nombre: "", auto: "Chrome en Windows", sesion: { como: "Google", entro: "hoy 8:05", uso: "ahora" } },
      { id: "celu-ruben", tipo: "celu", nombre: "Celu de Rubén", auto: "Chrome en Android", huella: { vinc: "12 sep.", uso: "hoy 10:15" }, sesion: { como: "Huella", entro: "hoy 8:12", uso: "hace 3 min" } },
      { id: "pc-mostrador", tipo: "pc", nombre: "Compu del mostrador", auto: "Chrome en Windows", sesion: { como: "qr", via: "celu-ruben", entro: "hoy 8:30", uso: "ahora" } },
      { id: "moto", tipo: "celu", nombre: "Motorola viejo", auto: "Chrome en Android", huella: { vinc: "3 mar.", uso: "4 nov. 19:20" }, sesion: { como: "Huella", entro: "4 nov. 19:20", uso: "4 nov. 19:48" } },
      { id: "notebook", tipo: "laptop", nombre: "", auto: "Chrome en macOS", sesion: { como: "qr", via: "moto", entro: "4 nov. 19:25", uso: "4 nov. 21:10" } }
    ];
  }

  var LT = window.LT = {
    $: $, $$: $$,
    enCelu: enCelu,
    chico: function () { return mqCelu.matches; },
    estado: { disp: inicial(), este: enCelu ? "celu-ruben" : "pc-oficina", offline: false, huellaAca: "mia", prefs: { anim: true, hora: "24" }, instalada: false }
  };
  var E = LT.estado;

  /* ---------- Lectura ---------- */
  LT.d = function (id) { return E.disp.filter(function (d) { return d.id === id; })[0]; };
  LT.este = function () { return LT.d(E.este); };
  LT.nombre = function (d) { return d.nombre || d.auto; };
  LT.icono = function (d) { return d.tipo === "celu" ? "smartphone" : d.tipo === "laptop" ? "laptop" : "monitor"; };
  LT.esEste = function (d) { return d.id === E.este; };
  // Mis celulares con huella (R6): los propios, el de la mano primero
  LT.celulares = function () { return E.disp.filter(function (d) { return d.tipo === "celu" && d.huella; }).sort(function (a, b) { return LT.esEste(b) - LT.esEste(a); }); };
  // Mis sesiones (R7.1): las de otros dispositivos; la de este no figura
  LT.sesiones = function () { return E.disp.filter(function (d) { return d.sesion && !LT.esEste(d); }); };
  // Los celulares que llevan «Se me perdió» (R8.1): con huella o sesión, salvo el de la mano
  LT.perdibles = function () { return E.disp.filter(function (d) { return d.tipo === "celu" && !LT.esEste(d) && (d.huella || d.sesion); }); };
  // Las computadoras que hizo entrar un celular con el código QR y siguen adentro
  LT.hijos = function (id) { return E.disp.filter(function (d) { return d.sesion && d.sesion.via === id; }); };
  LT.comoEntro = function (s, largo) {
    if (s.como === "qr") { var p = LT.d(s.via); return largo ? "Con el código de " + LT.nombre(p) : "Código de " + LT.nombre(p); }
    return largo ? "Con " + (s.como === "Huella" ? "la huella" : s.como) : s.como;
  };
  // Lo que corta «Se me perdió» en un celular, para mostrarlo antes y decirlo después (R8.1)
  LT.loQueCorta = function (id) {
    var d = LT.d(id), r = [];
    if (d.sesion) r.push({ que: "sesion", txt: "Su sesión" });
    LT.hijos(id).forEach(function (h) { r.push({ que: "hijo", id: h.id, txt: "La sesión de " + LT.nombre(h) + ", que entró con su código" }); });
    if (d.huella) r.push({ que: "huella", txt: "Su huella" });
    return r;
  };

  /* ---------- La hora (R3): 24 horas o a. m./p. m., en todo lo que la muestra ---------- */
  LT.h = function (txt) {
    if (E.prefs.hora !== "12") return txt;
    return String(txt).replace(/(\d{1,2}):(\d{2})/g, function (_, h, m) { h = +h; return (h % 12 || 12) + ":" + m + " " + (h < 12 ? "a. m." : "p. m."); });
  };
  LT.animando = function () { return E.prefs.anim && !mqQuieto.matches; };
  LT.vibrar = function (p) { if (LT.chico()) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* sin vibración */ } } };

  /* ---------- Acciones (las haría el servidor) ---------- */
  LT.cerrar = function (id) { var d = LT.d(id); d.sesion = null; LT.pintar(); };
  LT.cerrarTodas = function () { var n = 0; E.disp.forEach(function (d) { if (d.sesion && !LT.esEste(d)) { d.sesion = null; n++; } }); LT.pintar(); return n; };
  // Quitar (R6.2): el de la mano solo deja de entrar con la huella; otro, como 02 · R5.6
  LT.quitar = function (id) {
    var d = LT.d(id);
    if (LT.esEste(d)) { d.huella = null; E.huellaAca = "ninguna"; LT.pintar(); return []; }
    var c = LT.loQueCorta(id);
    LT.hijos(id).forEach(function (h) { h.sesion = null; });
    d.huella = null; d.sesion = null; LT.pintar(); return c;
  };
  // Se me perdió (R8.1): sus sesiones, las de las computadoras que hizo entrar y su huella
  LT.perdido = function (id) {
    var c = LT.loQueCorta(id), d = LT.d(id);
    LT.hijos(id).forEach(function (h) { h.sesion = null; });
    d.sesion = null; d.huella = null; LT.pintar(); return c;
  };
  LT.cortoTexto = function (c) {
    var t = c.map(function (x) { return x.que === "sesion" ? "se cerró su sesión" : x.que === "huella" ? "se le quitó la huella" : "se cerró " + LT.nombre(LT.d(x.id)); });
    if (!t.length) return "No tenía nada abierto";
    var s = t.length > 1 ? t.slice(0, -1).join(", ") + " y " + t[t.length - 1] : t[0];
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  LT.cortoMin = function (c) { var t = LT.cortoTexto(c); return t.charAt(0).toLowerCase() + t.slice(1); };
  // El nombre (R9): hasta 30 letras; si otro ya se llama igual, avisa y lo guarda igual
  LT.MAX = 30;
  LT.repetido = function (txt) {
    var t = txt.trim().toLowerCase(); if (!t) return false;
    var otros = DE_OTROS.concat(E.disp.filter(function (d) { return !LT.esEste(d) && d.nombre; }).map(function (d) { return d.nombre; }));
    return otros.some(function (n) { return n.toLowerCase() === t; });
  };
  LT.ponerNombre = function (txt) { var d = LT.este(), antes = LT.nombre(d); d.nombre = txt.trim().slice(0, LT.MAX); LT.pintar(); return { antes: antes, dup: LT.repetido(d.nombre) }; };
  LT.sugerencias = function () { return enCelu ? ["Celu de Rubén", "Celu del depósito", "Celu de Juan"] : ["Compu de la oficina", "Compu del mostrador", "Caja 2"]; };
  LT.vincular = function () { LT.este().huella = { vinc: "hoy", uso: "ahora" }; E.huellaAca = "mia"; LT.pintar(); };

  /* ---------- Pintar ---------- */
  var pintores = [], pintarPrefs = function () {};
  LT.alPintar = function (f) { pintores.push(f); };
  LT.pintar = function () {
    document.body.classList.toggle("quieto", !LT.animando());
    document.body.classList.toggle("offline", E.offline);
    pintores.forEach(function (f) { f(); });
    pintarPrefs();
    window.pintarIconos();
  };
  LT.reiniciar = function () { E.disp = inicial(); E.huellaAca = "mia"; LT.pintar(); };

  /* ---------- Tostadas ---------- */
  LT.tostada = function (texto, icono) {
    var box = $(".tostadas");
    if (!box) { box = document.createElement("div"); box.className = "tostadas"; box.setAttribute("role", "status"); document.body.appendChild(box); }
    var t = document.createElement("div");
    t.className = "tostada";
    t.innerHTML = '<i class="i" data-i="' + (icono || "circle-check") + '"></i><span>' + texto + "</span>";
    box.appendChild(t);
    window.pintarIconos(t);
    setTimeout(function () { t.classList.add("se-va"); setTimeout(function () { t.remove(); }, LT.animando() ? 220 : 0); }, 3200);
  };

  /* ---------- Capas: una hoja en el celular, un diálogo en la computadora ---------- */
  var volverA = null;
  LT.cerrarCapa = function () {
    var c = $(".capa.abierta"); if (!c) return;
    c.classList.remove("abierta");
    setTimeout(function () { c.remove(); }, LT.animando() ? 320 : 0);
    if (volverA && document.contains(volverA)) volverA.focus();
  };
  LT.capa = function (html, alConfirmar) {
    volverA = document.activeElement;
    var c = document.createElement("div");
    c.className = "capa";
    c.innerHTML = '<div class="dialogo" role="dialog" aria-modal="true">' + (LT.chico() ? '<div class="asa"></div>' : "") + html + "</div>";
    document.body.appendChild(c);
    window.pintarIconos(c);
    c.addEventListener("click", function (e) {
      if (e.target === c || e.target.closest("[data-cerrar]")) LT.cerrarCapa();
      if (e.target.closest("[data-confirma]")) { LT.cerrarCapa(); alConfirmar && alConfirmar(); }
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add("abierta"); var f = $("[data-confirma]", c); if (f) f.focus(); }); });
    return c;
  };
  // «Cerrar todas», con confirmación (R7.2)
  LT.pedirCerrarTodas = function () {
    var n = LT.sesiones().length; if (!n) return;
    LT.capa('<h2>¿Cerrar tus ' + n + ' sesiones en otros dispositivos?</h2><p class="t-detalle">Cada uno vuelve a la entrada con su próximo pedido. ' + (enCelu ? "Este celular" : "Esta computadora") + ' sigue adentro.</p>' +
      '<div class="pie-dialogo"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button><button type="button" class="btn btn-peligro" data-confirma>Cerrar las ' + n + "</button></div>",
      function () { LT.cerrarTodas(); LT.tostada("Se cerraron tus " + n + " sesiones. Seguís adentro acá", "log-out"); LT.vibrar([10, 40, 10]); });
  };
  // «Vincular este celular con mi huella» (R6.3): lo mismo que el ofrecimiento al entrar (01 · R2.2)
  LT.pedirHuella = function () {
    var c = LT.capa('<div class="huella-grande leyendo"><i class="i" data-i="fingerprint"></i></div><h2 style="text-align:center">Apoyá el dedo</h2><p class="t-detalle" style="text-align:center">Lo pide el sistema del celular. Desde ahora entrás con tu huella acá.</p>' +
      '<div class="pie-dialogo"><button type="button" class="btn btn-fantasma" data-cerrar>Ahora no</button></div>');
    setTimeout(function () { if (document.contains(c)) { LT.cerrarCapa(); LT.vincular(); LT.tostada("Listo: este celular entra con tu huella", "fingerprint"); LT.vibrar([10, 40, 10]); } }, 1600);
  };

  /* ---------- Teclado de la computadora: Alt muestra las teclas ---------- */
  var teclas = {};
  LT.teclas = function (m) { Object.keys(m).forEach(function (k) { teclas[k] = m[k]; }); };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { LT.cerrarCapa(); return; }
    if (LT.chico()) return;
    if (e.key === "Alt") { document.body.classList.add("alt"); e.preventDefault(); return; }
    if (!e.altKey || !e.key || e.key.length !== 1) return;
    var k = e.key.toLowerCase(), t = teclas[k];
    if (!t || $(".capa.abierta")) return;
    e.preventDefault();
    if (typeof t === "function") { t(); return; }
    var el = $(t);
    if (el && !el.disabled && !el.closest("[hidden]")) { el.click(); if (document.contains(el)) el.focus(); }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") document.body.classList.remove("alt"); });
  window.addEventListener("blur", function () { document.body.classList.remove("alt"); });

  LT.teclas({ a: "[data-pref=anim]", i: "[data-instalar]", h: function () { E.prefs.hora = E.prefs.hora === "24" ? "12" : "24"; LT.pintar(); var b = $('[data-hora-op="' + E.prefs.hora + '"]'); if (b) b.focus(); } });

  /* ---------- Casos: no es parte de la pantalla ---------- */
  function armarCasos() {
    var b = document.createElement("button");
    b.className = "casos-btn"; b.type = "button";
    b.innerHTML = '<i class="i i-s" data-i="sliders-horizontal"></i>Casos';
    var p = document.createElement("div");
    p.className = "casos"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Casos de la regla");
    p.innerHTML = '<h3>Casos de la regla</h3><p class="casos-nota">No es parte de la pantalla: cambia cómo está el dispositivo para ver cada caso.</p>' +
      '<fieldset><legend>La conexión (R10)</legend><label><input type="checkbox" name="offline">Sin conexión</label></fieldset>' +
      (enCelu ? '<fieldset><legend>La huella en este celular (R6.3)</legend><label><input type="radio" name="huellaAca" value="mia" checked>La mía</label><label><input type="radio" name="huellaAca" value="ninguna">Ninguna</label><label><input type="radio" name="huellaAca" value="otra">La de otra persona</label></fieldset>' : "") +
      '<button type="button" class="btn chico" data-reiniciar>Volver a empezar</button>';
    p.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "offline") E.offline = t.checked;
      if (t.name === "huellaAca") { E.huellaAca = t.value; LT.este().huella = t.value === "mia" ? { vinc: "12 sep.", uso: "hoy 10:15" } : null; }
      LT.pintar();
    });
    p.addEventListener("click", function (e) { if (e.target.closest("[data-reiniciar]")) { LT.reiniciar(); var r = $('input[value="mia"]', p); if (r) r.checked = true; } });
    b.addEventListener("click", function () { p.classList.toggle("abierto"); });
    document.body.appendChild(b); document.body.appendChild(p);
  }
  function alCambiar(mq, f) { if (mq.addEventListener) mq.addEventListener("change", f); else mq.addListener(f); }
  alCambiar(mqQuieto, function () { LT.pintar(); });
  alCambiar(mqCelu, function () { LT.pintar(); });
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-indicador]")) LT.tostada("El detalle del vínculo está en su maqueta aprobada", "smartphone");
    // Las preferencias de la etapa a (aprobadas): acá solo para que la pantalla esté entera
    var p = E.prefs;
    if (e.target.closest("[data-pref=anim]")) { p.anim = !p.anim; LT.vibrar(10); LT.pintar(); }
    var op = e.target.closest("[data-hora-op]");
    if (op) { p.hora = op.getAttribute("data-hora-op"); LT.vibrar(10); LT.pintar(); }
    var tg = e.target.closest("[data-asi-toggle]");
    if (tg) {
      var k = tg.getAttribute("data-asi-toggle");
      if (k === "anim") p.anim = !p.anim;
      if (k === "hora") p.hora = p.hora === "24" ? "12" : "24";
      if (k === "instalar" && !E.instalada) { E.instalada = true; LT.tostada("Listo: Ferrebress quedó con su ícono"); }
      LT.vibrar(10); LT.pintar();
    }
    if (e.target.closest("[data-instalar]")) { E.instalada = true; LT.tostada("Listo: Ferrebress quedó con su ícono"); LT.pintar(); }
  });

  /* ---------- «Así la tenés» y las preferencias (etapa a): se pintan después de cada variante ---------- */
  function horaAhora(fmt) { return fmt === "12" ? "2:30 p. m." : "14:30"; }
  pintarPrefs = (function () {
    var p = E.prefs, quieto = !LT.animando();
    $$("[data-pref=anim]").forEach(function (b) { b.setAttribute("aria-checked", p.anim ? "true" : "false"); });
    $$("[data-hora-op]").forEach(function (b) { b.classList.toggle("elegido", b.getAttribute("data-hora-op") === p.hora); b.setAttribute("aria-checked", b.getAttribute("data-hora-op") === p.hora ? "true" : "false"); });
    $$("[data-instalar-fila]").forEach(function (f) {
      f.querySelector("[data-instalar-estado]").innerHTML = E.instalada ? '<span class="pastilla logro"><i class="i i-s" data-i="check"></i>Instalada</span>'
        : '<button type="button" class="btn btn-suave chico" data-instalar><i class="i i-s" data-i="download"></i>Instalar<span class="kbd">I</span></button>';
    });
    $$("[data-asi]").forEach(function (box) {
      var tog = box.getAttribute("data-asi") === "toggle", tag = tog ? "button" : "span";
      function pill(k, ic, html) { return "<" + tag + (tog ? ' type="button" data-asi-toggle="' + k + '"' : "") + ' class="pastilla asi-pastilla"><i class="i i-s" data-i="' + ic + '"></i>' + html + "</" + tag + ">"; }
      box.innerHTML = pill("anim", "sparkles", quieto ? "En el acto" : "Con movimiento") + pill("hora", "clock", horaAhora(p.hora)) + pill("instalar", "app-window", E.instalada ? "Instalada" : "En el navegador");
    });
  });

  document.addEventListener("DOMContentLoaded", function () { armarCasos(); LT.pintar(); });
})();
