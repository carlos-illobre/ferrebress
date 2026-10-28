/* La espera del botón de Google, simulada. Pone en el lugar (#g-slot) el momento en que está:
   data-phase = empty (antes de 300 ms) · loading (pasados 300 ms) · slow (pasados 2 s) ·
   ready (Google lo dibujó) · failed (Google no cargó a los 8 s) · offline (sin conexión).
   El CSS dibuja cada momento. */
(function () {
  "use strict";
  var slot = document.getElementById("g-slot");
  var google = document.getElementById("google");
  var fail = document.getElementById("g-fail");
  var FAIL_AT = 8000;  // Si Google no dibujó el botón a los 8 s, se da por no cargado.

  var MOMENTS = [
    { id: "vivo-3", label: "En vivo · Google tarda 3 s", delay: 3000 },
    { id: "vivo-1", label: "En vivo · Google tarda 1,2 s", delay: 1200 },
    { id: "vivo-0", label: "En vivo · Google tarda 0,2 s", delay: 200 },
    { id: "vivo-no", label: "En vivo · Google no carga", delay: null },
    { id: "vacio", label: "Fijo · Vacío (antes de 300 ms)", phase: "empty" },
    { id: "cargando", label: "Fijo · Cargando", phase: "loading" },
    { id: "lento", label: "Fijo · Cargando, pasados 2 s", phase: "slow" },
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

  var timers = [], tick = null, t0 = 0, moment = null, googleReady = false, googleFailed = false;
  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function stop() { timers.forEach(clearTimeout); timers = []; clearInterval(tick); }
  function secs(ms) { return (ms / 1000).toFixed(1).replace(".", ",") + " s"; }
  function setClock(text) { clock.textContent = text; }

  // Solo se llega con Tab a lo que se ve: el botón de Google, o «Reintentar» si no cargó.
  function setPhase(p) {
    if (slot.dataset.phase === p) return;
    slot.dataset.phase = p;
    google.tabIndex = p === "ready" ? 0 : -1;
    fail.tabIndex = p === "failed" ? 0 : -1;
    fail.setAttribute("aria-hidden", String(p !== "failed"));
  }

  // ---------- En vivo ----------
  function play(m) {
    stop();
    googleReady = false; googleFailed = false;
    slot.classList.remove("arrived");
    setPhase("empty");
    void slot.offsetWidth;
    t0 = performance.now();
    tick = setInterval(function () {
      if (googleReady || googleFailed) return;
      setClock(secs(performance.now() - t0) + " · esperando a Google");
    }, 100);
    later(300, function () { if (!googleReady) setPhase("loading"); });
    later(2000, function () { if (!googleReady) setPhase("slow"); });
    if (m.delay !== null) later(m.delay, arrive);
    else later(FAIL_AT, giveUp);
  }
  function arrive() {
    googleReady = true;
    setClock("Google dibujó el botón a los " + secs(performance.now() - t0));
    slot.classList.add("arrived");
    setPhase("ready");
  }
  function giveUp() {
    googleFailed = true;
    stop();
    setClock("Google no cargó en " + secs(FAIL_AT));
    setPhase("failed");
  }

  // «Reintentar» (también con Alt R): vuelve a pedir el botón; en la maqueta, llega a 1,2 s.
  fail.addEventListener("click", function () {
    if (slot.dataset.phase !== "failed") return;
    play(MOMENTS[1]);
  });

  // ---------- Fijo ----------
  function freeze(m) {
    stop();
    googleReady = m.phase === "ready"; googleFailed = m.phase === "failed";
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
  function offline() { stop(); slot.classList.remove("arrived"); setPhase("offline"); setClock("sin conexión · Google no puede cargar"); }

  select.addEventListener("change", function () { run(select.value); select.blur(); });
  replay.addEventListener("click", function () { run(moment && !moment.phase ? moment.id : "vivo-3"); });

  // Sin conexión (el estado de la entrada): Google no puede cargar; al volver, se pide de nuevo solo.
  new MutationObserver(function () {
    if (document.body.dataset.state === "sin-conexion") offline();
    else if (slot.dataset.phase === "offline") run(moment.id);
  }).observe(document.body, { attributes: true, attributeFilter: ["data-state"] });

  run(new URLSearchParams(location.search).get("google") || "vivo-3");
})();
