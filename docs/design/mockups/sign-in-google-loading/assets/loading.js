/* La espera del botón de Google, simulada. Pone en el lugar (#g-slot) el momento en que está:
   data-phase = empty (antes de 300 ms) · loading (pasados 300 ms) · slow (pasados 2 s) ·
   ready (Google lo dibujó) · failed (Google no cargó) · offline (sin conexión).
   Con data-mode="facade" (variante 3), el lugar muestra un botón propio desde el principio y la
   espera empieza recién cuando se lo toca: rest · loading · slow · ready · failed · offline.
   Cada variante dibuja esos momentos con su CSS. */
(function () {
  "use strict";
  var slot = document.getElementById("g-slot");
  var google = document.getElementById("google");
  var facade = slot.dataset.mode === "facade";
  var FAIL_AT = 8000;  // Si Google no dibujó el botón a los 8 s, se da por no cargado.

  var MOMENTS = [
    { id: "vivo-3", label: "En vivo · Google tarda 3 s", delay: 3000 },
    { id: "vivo-1", label: "En vivo · Google tarda 1,2 s", delay: 1200 },
    { id: "vivo-0", label: "En vivo · Google tarda 0,2 s", delay: 200 },
    { id: "vivo-no", label: "En vivo · Google no carga", delay: null },
    { id: "vacio", label: facade ? "Fijo · El botón propio, quieto" : "Fijo · Vacío (antes de 300 ms)", phase: facade ? "rest" : "empty" },
    { id: "cargando", label: facade ? "Fijo · Tocado, esperando a Google" : "Fijo · Cargando", phase: "loading" },
    { id: "lento", label: facade ? "Fijo · Tocado, pasados 2 s" : "Fijo · Cargando, pasados 2 s", phase: "slow" },
    { id: "listo", label: "Fijo · El botón de Google", phase: "ready" },
    { id: "fallo", label: "Fijo · Google no cargó", phase: "failed" }
  ];

  // ---------- Las herramientas: el momento, «Repetir» y el reloj ----------
  var tools = document.querySelector(".mock-tools");
  var label = document.createElement("label");
  label.innerHTML = 'Google <select id="g-moment"></select>';
  var replay = document.createElement("button");
  replay.type = "button"; replay.id = "g-replay"; replay.textContent = "Repetir";
  var clock = document.createElement("span");
  clock.className = "g-clock"; clock.setAttribute("aria-live", "off");
  tools.insertBefore(clock, tools.firstChild);
  tools.insertBefore(replay, tools.firstChild);
  tools.insertBefore(label, tools.firstChild);
  var select = document.getElementById("g-moment");
  MOMENTS.forEach(function (m) { var o = document.createElement("option"); o.value = m.id; o.textContent = m.label; select.appendChild(o); });

  var timers = [], tick = null, t0 = 0, moment = null;
  var googleReady = false, googleFailed = false, tapped = false, tapT = 0;
  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function stop() { timers.forEach(clearTimeout); timers = []; clearInterval(tick); }
  function secs(ms) { return (ms / 1000).toFixed(1).replace(".", ",") + " s"; }
  function setClock(text) { clock.textContent = text; }

  function setPhase(p) {
    if (slot.dataset.phase === p) return;
    slot.dataset.phase = p;
    google.tabIndex = p === "ready" ? 0 : -1;
    document.dispatchEvent(new CustomEvent("g-phase", { detail: p }));
  }

  // ---------- En vivo ----------
  function play(m) {
    stop();
    googleReady = false; googleFailed = false; tapped = false;
    slot.classList.remove("arrived");
    setPhase(facade ? "rest" : "empty");
    void slot.offsetWidth;
    t0 = performance.now();
    tick = setInterval(function () {
      var t = performance.now() - t0;
      if (googleReady) return;
      setClock(secs(t) + (googleFailed ? " · Google no cargó" : " · esperando a Google"));
    }, 100);
    if (!facade) {
      later(300, function () { if (!googleReady) setPhase("loading"); });
      later(2000, function () { if (!googleReady) setPhase("slow"); });
    }
    if (m.delay !== null) later(m.delay, arrive);
    else later(FAIL_AT, giveUp);
  }
  function arrive() {
    googleReady = true;
    setClock("Google dibujó el botón a los " + secs(performance.now() - t0));
    slot.classList.add("arrived");
    setPhase("ready");
    // En la variante 3, si la persona ya lo había tocado, se abre Google solo.
    if (facade && tapped) setTimeout(function () { google.click(); }, 160);
  }
  function giveUp() {
    googleFailed = true;
    clearInterval(tick);
    setClock("Google no cargó en " + secs(FAIL_AT));
    if (!facade || tapped) setPhase("failed");
  }

  // Variante 3: tocar el botón propio antes de que llegue Google.
  if (facade) {
    var own = document.getElementById("g-facade");
    own.addEventListener("click", function () {
      var p = slot.dataset.phase;
      if (p === "offline" || p === "ready") return;
      if (p === "failed") { retry(); return; }
      if (googleFailed) { setPhase("failed"); return; }
      if (tapped) return;
      tapped = true; tapT = performance.now();
      setPhase("touched");
      later(300, function () { if (!googleReady) setPhase("loading"); });
      later(2000, function () { if (!googleReady && !googleFailed) setPhase("slow"); });
    });
  }

  // «Reintentar»: vuelve a pedir el botón; en la maqueta, esta vez llega a 1,2 s.
  function retry() {
    play(MOMENTS[1]);
    if (facade) { tapped = true; setPhase("loading"); later(2000, function () { if (!googleReady) setPhase("slow"); }); }
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-retry]"), function (b) { b.addEventListener("click", retry); });

  // ---------- Fijo ----------
  function freeze(m) {
    stop();
    googleReady = m.phase === "ready"; googleFailed = m.phase === "failed"; tapped = false;
    slot.classList.remove("arrived");
    setPhase(m.phase);
    setClock(m.phase === "ready" ? "quieto · el botón" : "quieto");
  }

  function run(id) {
    moment = MOMENTS.filter(function (m) { return m.id === id; })[0] || MOMENTS[0];
    select.value = moment.id;
    var url = new URL(location.href);
    if (moment.id === "vivo-3") url.searchParams.delete("google"); else url.searchParams.set("google", moment.id);
    history.replaceState(null, "", url);
    if (document.body.dataset.state === "sin-conexion") { offline(); return; }
    if (moment.phase) freeze(moment); else play(moment);
  }
  function offline() { stop(); setPhase("offline"); setClock("sin conexión · Google no puede cargar"); }

  select.addEventListener("change", function () { run(select.value); select.blur(); });
  replay.addEventListener("click", function () { run(moment && !moment.phase ? moment.id : "vivo-3"); });

  // Sin conexión (el estado de la entrada): Google no puede cargar; al volver, se pide de nuevo.
  new MutationObserver(function () {
    if (document.body.dataset.state === "sin-conexion") offline();
    else if (slot.dataset.phase === "offline") run(moment.id);
  }).observe(document.body, { attributes: true, attributeFilter: ["data-state"] });

  run(new URLSearchParams(location.search).get("google") || "vivo-3");
})();
