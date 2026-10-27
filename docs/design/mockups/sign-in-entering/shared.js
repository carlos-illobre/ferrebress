// Entrando (01 · Entrar, R2.11), computadora: lo que comparten las tres variantes.
// - Cómo entra: ?estado=entrando-google (por defecto) o ?estado=entrando-celular, como en la entrada.
// - Las fases van en <body data-phase>: «arrive» (llega, se tilda lo hecho), «opening» (gira la F
//   mientras se abre la sesión) y «done» (aparece el marco; sin aviso de «Entraste»).
// - En la maqueta la sesión no se abre sola: se abre con Enter o con el botón del selector, para
//   poder mirar la espera. R repite; 1 y 2 cambian cómo entra.
(function () {
  var G = '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  function icon(name, sw) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + window.ICONOS[name] + '</svg>';
  }

  var WAYS = {
    google: {
      label: "Google",
      from: G,
      fromName: "Google",
      fromWhat: "Confirmó tu cuenta",
      title: "Conectando tu cuenta de Google",
      titleA: "Conectando tu cuenta", titleB: "de Google",
      sub: "Google confirmó tu cuenta. Ahora Ferrebress abre tu sesión; tarda unos segundos.",
      step: "Cuenta de Google verificada",
      stepSub: "Google confirmó que sos vos."
    },
    celular: {
      label: "El celular (QR)",
      from: icon("smartphone"),
      fromName: "Tu celular",
      fromWhat: "Confirmó tu huella",
      title: "Entrando con tu celular",
      titleA: "Entrando", titleB: "con tu celular",
      sub: "Tu celular confirmó tu huella. Ahora Ferrebress abre tu sesión en esta computadora.",
      step: "Huella confirmada en el celular",
      stepSub: "Tu celular confirmó que sos vos."
    }
  };
  var OPEN_STEP = "Abriendo tu sesión";
  var OPEN_SUB = "Ferrebress revisa que tu cuenta esté autorizada…";

  var params = new URLSearchParams(location.search);
  var way = (params.get("estado") || "").replace("entrando-", "") === "celular" ? "celular" : "google";
  var timer = null;
  var body = document.body;
  var hooks = window.ENTERING || {};

  function fill() {
    var w = WAYS[way];
    body.dataset.way = way;
    document.querySelectorAll("[data-t]").forEach(function (el) {
      var k = el.getAttribute("data-t");
      if (k === "from") el.innerHTML = w.from;
      else if (k === "open-step") el.textContent = OPEN_STEP;
      else if (k === "open-sub") el.textContent = OPEN_SUB;
      else if (w[k] != null) el.textContent = w[k];
    });
    document.querySelectorAll("[data-i-shop]").forEach(function (el) { el.innerHTML = icon("store"); });
    document.querySelectorAll("[data-i-check]").forEach(function (el) { el.innerHTML = icon("check", 3.2); });
    document.title = w.title + " · Ferrebress";
  }

  function start() {
    clearTimeout(timer);
    body.removeAttribute("data-phase");
    void body.offsetWidth;                       // reinicia las animaciones de llegada
    body.dataset.phase = "arrive";
    if (hooks.onStart) hooks.onStart(way);
    timer = setTimeout(function () {
      body.dataset.phase = "opening";
      if (hooks.onOpening) hooks.onOpening(way);
    }, 1100);
  }

  function finish() {
    if (body.dataset.phase === "done") return;
    clearTimeout(timer);
    body.dataset.phase = "done";
    if (hooks.onDone) hooks.onDone(way);
  }

  function setWay(w) {
    way = w;
    var url = new URL(location.href);
    url.searchParams.set("estado", "entrando-" + w);
    history.replaceState(null, "", url);
    select.value = w;
    fill();
    start();
  }

  // El selector de la maqueta.
  var tools = document.createElement("div");
  tools.className = "mock-tools";
  tools.setAttribute("aria-label", "Herramientas de la maqueta");
  tools.innerHTML =
    '<label>Entrando con <select id="way-select">' +
    '<option value="google">Google</option><option value="celular">El celular (QR)</option></select></label>' +
    '<button type="button" id="mock-finish">Abrir la sesión <span class="kbd">⏎</span></button>' +
    '<button type="button" id="mock-replay">Repetir <span class="kbd">R</span></button>';
  body.appendChild(tools);
  var select = tools.querySelector("#way-select");
  select.value = way;
  select.addEventListener("change", function () { setWay(select.value); });
  tools.querySelector("#mock-finish").addEventListener("click", finish);
  tools.querySelector("#mock-replay").addEventListener("click", start);

  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === "SELECT") return;
    if (e.key === "Enter") { e.preventDefault(); finish(); }
    else if (e.key === "r" || e.key === "R") start();
    else if (e.key === "1") setWay("google");
    else if (e.key === "2") setWay("celular");
  });

  window.Entering = { start: start, finish: finish, way: function () { return way; } };
  fill();
  start();
})();
