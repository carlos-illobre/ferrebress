/* El indicador del vínculo · lo que comparten las seis maquetas: los estados, sus textos, los
   botones de cada estado, el código QR de mentira, la tostada y el selector de la maqueta.
   Sin lógica de verdad: todo es simulado. */
(function () {
  var device = location.pathname.indexOf("/phone/") >= 0 ? "phone" : "desktop";
  var isPhone = device === "phone";

  var OTHER = isPhone ? "la computadora" : "el celular";
  var OTHER_NAME = isPhone ? "Chrome en Windows" : "Chrome en Android";

  var STATES = {
    sin: {
      label: "Sin vincular", tone: "neutro", icon: "unlink",
      long: "Esta computadora no está vinculada a ningún celular. Vinculalo para usarlo como control remoto: lo que toques en uno se ve en el otro.",
      short: "En la computadora, tocá el indicador y leé el código."
    },
    directo: {
      label: "Directo", tone: "logro", icon: "wifi",
      long: "Tu celular y esta computadora muestran lo mismo y se hablan directo por el Wi-Fi del local: no gastan internet y lo que tocás llega al instante.",
      short: "Muestran lo mismo, directo por el Wi-Fi del local."
    },
    servidor: {
      label: "Por el servidor", tone: "urgente", icon: "cloud",
      long: "Muestran lo mismo, pero se hablan por el servidor porque la red no deja la conexión directa. Gasta datos de internet y tarda un poco más. No se reintenta sola.",
      short: "Muestran lo mismo por internet: la red no deja la directa."
    },
    desconectado: {
      label: "Desconectado", tone: "neutro", icon: "unplug",
      long: "Siguen vinculados, pero cada uno trabaja por su lado. Sigue así hasta que alguien toque «Reconectar», aunque salgan y vuelvan a entrar.",
      short: "Vinculados, cada uno por su lado hasta «Reconectar»."
    },
    esperando: {
      label: isPhone ? "Esperando a la computadora" : "Esperando al celular", tone: "pino", icon: "clock",
      long: "El celular no tiene Ferrebress abierto: la pantalla está apagada u otra aplicación está encima. Cuando vuelva, se encuentran solos y va a la pantalla de esta computadora.",
      short: "La computadora no tiene Ferrebress abierto. Cuando vuelva, se encuentran solos."
    },
    sininternet: {
      label: "Sin internet", tone: "error", icon: "wifi-off",
      long: "Se cortó la conexión directa y no hay internet para volver a encontrarse. Cuando vuelva internet, se encuentran solos.",
      short: "Se cortó la directa y no hay internet. Se encuentran solos al volver."
    }
  };
  var ORDER = ["sin", "directo", "servidor", "desconectado", "esperando", "sininternet"];

  /* Los datos del vínculo (R4.2): con qué, desde cuándo, hasta cuándo dura si no se usa */
  var FACTS = {
    con: OTHER_NAME,
    desde: "Desde ayer, lunes 2 de noviembre, 8:14",
    desdeCorto: "Desde ayer, 8:14",
    dura: "Si no se usan juntos, dura hasta el jueves 3 de diciembre",
    duraCorto: "Dura hasta el 3 de diciembre sin usarse",
    diasQuedan: 30
  };
  var ROUTE = {
    directo: { text: "Por el Wi-Fi del local", ms: 12 },
    servidor: { text: "Por internet, a través del servidor", ms: 180 }
  };

  /* Los botones de cada estado (R4.2). kind: accion (la principal), comun, peligro */
  function actions(state) {
    var a = [];
    var link = isPhone ? { id: "vincular", label: "Leer el código", short: "Leer el código", icon: "scan-qr-code", key: "V" }
                       : { id: "vincular", label: "Vincular el celular", short: "Vincular", icon: "qr-code", key: "V" };
    if (state === "sin") { link.kind = "accion"; return [link]; }
    if (state === "servidor") a.push({ id: "probar", label: "Probar conexión directa", short: "Probar directa", icon: "zap", key: "P", kind: "accion" });
    if (state === "desconectado") a.push({ id: "reconectar", label: "Reconectar", short: "Reconectar", icon: "plug-zap", key: "R", kind: "accion" });
    else a.push({ id: "desconectar", label: "Desconectar", short: "Desconectar", icon: "unplug", key: "D", kind: "comun" });
    link.kind = "comun"; a.push(link);
    a.push({ id: "desvincular", label: "Desvincular", short: "Desvincular", icon: "unlink", key: "X", kind: "peligro" });
    return a;
  }

  var state = "directo", listeners = [], tries = 0;
  function set(s, why) {
    if (!STATES[s] || s === state) return;
    var prev = state; state = s;
    document.body.setAttribute("data-link", s);
    listeners.forEach(function (fn) { fn(s, prev, why); });
    syncDemo();
  }
  function on(fn) { listeners.push(fn); }

  /* «Probar conexión directa» (E19): la primera vez no se puede, la segunda sí */
  function probar() {
    tries++;
    var ok = tries % 2 === 0;
    return new Promise(function (res) { setTimeout(function () { res(ok); }, 1600); });
  }

  /* Un código QR de mentira, con sus tres esquinas, que cambia con cada semilla */
  function qr(seed, color) {
    var n = 29, x, y, s = (seed || 1) * 9301 + 49297;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    var cells = [];
    function finder(ox, oy) {
      for (y = 0; y < 7; y++) for (x = 0; x < 7; x++) {
        var edge = x === 0 || y === 0 || x === 6 || y === 6, core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (edge || core) cells.push([ox + x, oy + y]);
      }
    }
    function inFinder(x, y) { return (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9); }
    function inCenter(x, y) { return x >= 10 && x <= 18 && y >= 10 && y <= 18; }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
      if (inFinder(x, y) || inCenter(x, y)) continue;
      if (y === 6 || x === 6) { if ((x + y) % 2 === 0) cells.push([x, y]); continue; }
      if (rnd() < 0.48) cells.push([x, y]);
    }
    var r = cells.map(function (c) { return '<rect x="' + c[0] + '" y="' + c[1] + '" width="1.04" height="1.04"/>'; }).join("");
    return '<svg viewBox="-2 -2 33 33" shape-rendering="crispEdges" fill="' + (color || "#1A1D1B") + '" aria-label="Código para vincular">' + r + "</svg>";
  }

  /* Tostada: un aviso corto que se va solo; con «Deshacer» si se le pasa una función */
  var toastBox;
  function toast(msg, opts) {
    opts = opts || {};
    if (!toastBox) { toastBox = document.createElement("div"); toastBox.className = "tostadas"; (document.querySelector(".celu") || document.body).appendChild(toastBox); }
    toastBox.innerHTML = "";
    var t = document.createElement("div");
    t.className = "tostada";
    t.innerHTML = '<i class="i" data-i="' + (opts.icon || "circle-check") + '"></i><span>' + msg + "</span>" + (opts.undo ? '<button class="deshacer" type="button">Deshacer</button>' : "");
    toastBox.appendChild(t);
    if (window.pintarIconos) window.pintarIconos(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add("ver"); }); });
    if (opts.undo) t.querySelector(".deshacer").onclick = function () { opts.undo(); t.classList.remove("ver"); };
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("ver"); }, opts.ms || 3200);
  }

  function vibrate(p) { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) {} }
  function reduced() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }

  /* Selector de la maqueta (fuera del diseño): para ver cada estado sin esperar que pase */
  var demo;
  function buildDemo() {
    demo = document.createElement("div");
    demo.className = "demo";
    demo.setAttribute("data-no-ir", "");
    var html = '<button type="button" class="demo-asa" aria-label="Elegir el estado (solo en la maqueta)"><i class="i" data-i="sliders-horizontal"></i></button><div class="demo-panel"><p>Maqueta · estado</p>';
    ORDER.forEach(function (k) { html += '<button type="button" data-s="' + k + '">' + STATES[k].label + "</button>"; });
    html += "</div>";
    demo.innerHTML = html;
    document.body.appendChild(demo);
    if (window.pintarIconos) window.pintarIconos(demo);
    demo.querySelector(".demo-asa").onclick = function () { demo.classList.toggle("abierta"); };
    demo.querySelectorAll("[data-s]").forEach(function (b) { b.onclick = function () { set(b.getAttribute("data-s"), "demo"); }; });
    syncDemo();
  }
  function syncDemo() {
    if (!demo) return;
    demo.querySelectorAll("[data-s]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-s") === state)); });
  }

  /* Teclado: una letra sola cuando hay algo abierto encima (la capa decide qué letras valen) */
  function keys(fn) {
    document.addEventListener("keydown", function (e) {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      fn(e);
    });
  }

  var start = new URLSearchParams(location.search).get("estado");
  document.addEventListener("DOMContentLoaded", function () {
    if (start && STATES[start]) state = start;
    document.body.setAttribute("data-link", state);
    buildDemo();
    listeners.forEach(function (fn) { fn(state, null, "inicio"); });
  });

  window.V = {
    device: device, isPhone: isPhone, OTHER: OTHER, OTHER_NAME: OTHER_NAME,
    STATES: STATES, ORDER: ORDER, FACTS: FACTS, ROUTE: ROUTE,
    actions: actions, set: set, on: on, get: function () { return state; },
    probar: probar, qr: qr, toast: toast, vibrate: vibrate, reduced: reduced, keys: keys,
    linked: function (s) { return (s || state) !== "sin"; },
    text: function (s) { return isPhone ? STATES[s].short : STATES[s].long; }
  };
})();
