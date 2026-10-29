/* El manual · maqueta final: el comportamiento. Parte del script de la variante 2 del director
   (computadora y celular), en un solo archivo para los dos anchos. */
(function () {
  var M = window.MANUAL;
  var phoneMq = window.matchMedia("(max-width: 899px)");
  /* Arranca en el dispositivo que se está usando (R6.3). En la maqueta lo dice el ancho; en la
     aplicación, el dispositivo. */
  var dev = phoneMq.matches ? "phone" : "desktop";
  var sec = null, step = 0, lastCap = null, marked = 0, leerDesde = null;

  function $(id) { return document.getElementById(id); }
  var lista = $("lista"), esc = $("esc"), q = $("q"), guia = $("guia"), leer = $("leer");
  function isPhone() { return phoneMq.matches; }
  function sections() { return M.entrar[dev].sections; }
  function sectionById(id) { return sections().filter(function (s) { return s.id === id; })[0]; }
  function paint(el) { window.pintarIconos(el); }

  /* ---------- Las tareas, el buscador y el índice ---------- */
  function placeholder() { q.placeholder = isPhone() ? q.dataset.corto : q.dataset.largo; }

  function renderList() {
    var v = q.value.trim(), html = "";
    if (v.length >= 2) {
      /* Solo lo del dispositivo elegido, agrupado por su capítulo (R6.6) */
      var r = M.search(dev, v);
      var found = r.filter(function (x) { return !x.pronto; });
      var pronto = r.filter(function (x) { return x.pronto; });
      if (found.length) {
        html += '<h2 class="grupo-t"><i class="i i-s" data-i="log-in"></i>Entrar · ' + found.length + (found.length === 1 ? " encontrada" : " encontradas") + '</h2>';
        html += '<ul class="tareas-lista">' + found.map(function (x) { return taskHTML(x.section, M.mark(x.snippet, v)); }).join("") + '</ul>';
      } else {
        html += '<p class="grupo-t">No encontré «' + M.escape(v) + '»</p>';
      }
      if (pronto.length) html += '<ul class="proximos">' + pronto.map(prontoHTML).join("") + '</ul>';
    } else {
      /* El índice: «Entrar» primero, con sus tareas y «Todos los pasos»; después, un capítulo por
         módulo en el orden del menú, con «Pronto» (R6.4) */
      html += '<h2 class="grupo-t"><i class="i i-s" data-i="log-in"></i>Entrar</h2>';
      html += '<ul class="tareas-lista">' + sections().map(function (s) { return taskHTML(s); }).join("") + leerTodoHTML() + '</ul>';
      html += '<h2 class="grupo-t aparte">Próximos capítulos</h2>';
      html += '<ul class="proximos">' + M.chapters.filter(function (c) { return !c.ready; }).map(function (c) { return prontoHTML({ chapter: c.name, icon: c.icon }); }).join("") + '</ul>';
    }
    lista.innerHTML = html; paint(lista);
    marked = 0; markRow();
  }
  function taskHTML(s, snippet) {
    var detail = snippet ? snippet :
      s.steps.length + " pasos" + (s.clip ? " · con clip" : "") + (s.tag ? ' <span class="pastilla accion tarea-rapida">La más rápida</span>' : "");
    return '<li><button type="button" class="tarea' + (sec === s && !isPhone() ? " activa" : "") + '" data-sec="' + s.id + '">' +
      '<span class="tarea-ico"><i class="i" data-i="' + s.icon + '"></i></span>' +
      '<span><span class="tarea-nombre">' + s.title + '</span><span class="tarea-detalle">' + detail + '</span></span>' +
      '<i class="i tarea-flecha" data-i="chevron-right"></i></button></li>';
  }
  function leerTodoHTML() {
    return '<li><button type="button" class="tarea leer-todo" data-leer>' +
      '<span class="tarea-ico"><i class="i" data-i="list-checks"></i></span>' +
      '<span><span class="tarea-nombre">Todos los pasos</span><span class="tarea-detalle">' + (isPhone() ? "El capítulo entero, de corrido" : "El capítulo entero, para leerlo de corrido") + '</span></span>' +
      '<i class="i tarea-flecha" data-i="chevron-right"></i></button></li>';
  }
  function prontoHTML(x) {
    return '<li class="proximo"><i class="i i-s" data-i="' + x.icon + '"></i>' + x.chapter + '<span class="pronto">Pronto</span></li>';
  }
  function rows() { return lista.querySelectorAll(".tarea"); }
  function markRow() {
    var searching = q.value.trim().length > 1;
    rows().forEach(function (el, i) { el.classList.toggle("marcada", searching && i === marked); });
  }

  /* ---------- El paso a paso ---------- */
  function hotHTML(st) {
    var cls = (st.hot[0] > 65 ? " der" : st.hot[0] < 35 ? " izq" : "") + (st.hot[1] > 80 ? " arriba" : "");
    return '<span class="punto-toque" style="left:' + st.hot[0] + '%;top:' + st.hot[1] + '%"></span>' +
      '<span class="punto-rotulo' + cls + '" style="left:' + st.hot[0] + '%;top:' + st.hot[1] + '%">' + st.label + '</span>';
  }
  function capClass(name) { return name.indexOf("phone") === 0 ? "celu-cap" : "compu"; }
  function layerHTML(st) {
    if (st.cap) {
      lastCap = st;
      return '<div class="captura ' + capClass(st.cap) + '"><img src="' + M.cap(st.cap) + '" alt="Captura: ' + M.escape(st.label) + '">' + hotHTML(st) + '</div>';
    }
    /* Paso sin captura propia: un ícono grande sobre la captura anterior velada */
    var bg = lastCap ? '<div class="captura ' + capClass(lastCap.cap) + '"><img src="' + M.cap(lastCap.cap) + '" alt=""></div>' : "";
    return bg + '<div class="velo' + (bg ? "" : " solo") + '"><span class="velo-ico"><i class="i" data-i="' + M.stepIcon(st, sec) + '"></i></span></div>';
  }
  function show(dir) {
    var st = sec.steps[step];
    var old = esc.querySelector(".capa");
    var layer = document.createElement("div");
    layer.className = "capa" + (dir ? " entra" : "") + (dir < 0 ? " atras" : "");
    layer.innerHTML = layerHTML(st);
    esc.innerHTML = ""; if (old) esc.appendChild(old);
    esc.appendChild(layer); paint(layer);
    if (old) { old.classList.add("sale"); if (dir < 0) old.classList.add("atras"); setTimeout(function () { old.remove(); }, 320); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { layer.classList.remove("entra", "atras"); }); });

    var all = sections(), i = all.indexOf(sec), next = all[i + 1], last = step === sec.steps.length - 1;
    $("num").textContent = step + 1;
    $("frase").textContent = st.t;
    $("sub").textContent = "Paso " + (step + 1) + " de " + sec.steps.length + (sec.lead && step === 0 ? " · " + sec.lead : "");
    $("avance").innerHTML = sec.steps.map(function (_, n) { return '<button type="button" class="avance-paso' + (n <= step ? " hecho" : "") + '" data-paso="' + n + '" aria-label="Paso ' + (n + 1) + '"></button>'; }).join("");
    guia.classList.toggle("ultimo", last);
    var sig = $("sig");
    if (!last) sig.innerHTML = 'Siguiente <span class="kbd kbd-alt">S</span>';
    else if (next) sig.innerHTML = '<span class="d-only">Siguiente: ' + next.title + '</span><span class="p-only">Seguir: ' + next.title + '</span> <span class="kbd kbd-alt">S</span>';
    else sig.innerHTML = '<span class="d-only">Terminado</span><span class="p-only">Terminé</span> <i class="i" data-i="check"></i><span class="kbd kbd-alt">S</span>';
    paint(sig);
    $("ant").disabled = step === 0 && i === 0;
    var tips = sec.tips || [];
    $("consejo").innerHTML = tips.length ? '<div class="aviso pino"><i class="i i-s" data-i="info"></i><span>' + tips[Math.min(step, tips.length - 1)] + '</span></div>' : "";
    paint($("consejo"));
  }
  function open(s, atEnd) {
    sec = s; step = atEnd ? s.steps.length - 1 : 0; lastCap = null;
    if (atEnd) s.steps.slice(0, step).forEach(function (x) { if (x.cap) lastCap = x; });
    $("g-tit").textContent = s.title;
    $("ver-clip").style.display = s.clip ? "" : "none";
    rows().forEach(function (t) { t.classList.toggle("activa", !isPhone() && t.dataset.sec === s.id); });
    esc.innerHTML = "";
    show(0);
  }
  function openSheet(s) { open(s); document.body.classList.add("en-guia"); guia.removeAttribute("aria-hidden"); }
  function closeSheet() { document.body.classList.remove("en-guia"); if (isPhone()) guia.setAttribute("aria-hidden", "true"); }
  function go(d) {
    var all = sections(), i = all.indexOf(sec);
    if (d > 0 && step < sec.steps.length - 1) { step++; show(1); }
    else if (d > 0) { if (all[i + 1]) open(all[i + 1]); else if (isPhone()) closeSheet(); }
    else if (d < 0 && step > 0) { step--; show(-1); }
    else if (d < 0 && all[i - 1]) { open(all[i - 1], true); }
  }

  /* El clip: una secuencia corta, sin sonido, que arranca solo cuando se la pide (R6.5).
     En la maqueta se arma con dos capturas; en la aplicación es un video mudo. */
  function playClip() {
    var html = '<div class="capa"><div class="clip" data-clip>' +
      '<div class="clip-escena">' +
        '<img class="clip-compu" src="' + M.cap("desktop-entrance") + '" alt="">' +
        '<div class="clip-celu"><img src="' + M.cap("phone-entrance") + '" alt=""><span class="clip-scan"></span></div>' +
        '<div class="clip-ok"><i class="i i-xl" data-i="circle-check"></i><b>La computadora entró</b></div>' +
      '</div>' +
      '<button type="button" class="clip-play" aria-label="Ver el clip"><span class="clip-boton"><i class="i i-l" data-i="zap"></i></span><span><b>Ver cómo se hace</b><small>Clip de 8 s · sin sonido</small></span></button>' +
      '<div class="clip-barra"><b></b></div>' +
    '</div></div>';
    esc.innerHTML = html; paint(esc);
    var el = esc.querySelector("[data-clip]");
    var run = function () {
      el.classList.remove("corriendo", "visto"); void el.offsetWidth; el.classList.add("corriendo");
      clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("corriendo"); el.classList.add("visto"); }, 8200);
    };
    el.querySelector(".clip-play").addEventListener("click", run);
    run();
  }

  /* ---------- Todos los pasos: el capítulo entero (R6.5) ---------- */
  function openRead(fromSec) {
    leerDesde = fromSec || null;
    var ch = M.entrar[dev];
    var html = '<p class="leer-intro">' + ch.lead + '</p>' + ch.sections.map(function (s) {
      return '<article class="leer-parte tarjeta" id="leer-' + s.id + '" aria-labelledby="leer-t-' + s.id + '">' +
        '<div class="leer-parte-cab"><span class="tarea-ico"><i class="i" data-i="' + s.icon + '"></i></span><h3 class="leer-parte-titulo" id="leer-t-' + s.id + '">' + s.title + '</h3>' +
        (s.tag ? '<span class="pastilla accion">' + s.tag + '</span>' : "") + '</div>' +
        (s.lead ? '<p class="leer-parte-lead">' + s.lead + '</p>' : "") +
        '<ol class="leer-pasos">' + s.steps.map(function (x) { return "<li>" + x.t + "</li>"; }).join("") + '</ol>' +
        ((s.tips || []).length ? '<ul class="leer-consejos">' + s.tips.map(function (t) { return '<li class="aviso pino"><i class="i i-s" data-i="info"></i><span>' + t + '</span></li>'; }).join("") + '</ul>' : "") +
      '</article>';
    }).join("");
    $("leer-cuerpo").innerHTML = html; paint($("leer-cuerpo"));
    leer.hidden = false;
    /* Si se vino desde una parte, se llega a ella y destella */
    var target = fromSec ? $("leer-" + fromSec.id) : null;
    var cuerpo = $("leer-cuerpo");
    cuerpo.scrollTop = 0;
    if (target) {
      if (ch.sections.indexOf(fromSec) > 0) cuerpo.scrollTop = target.getBoundingClientRect().top - cuerpo.getBoundingClientRect().top - 8;
      target.classList.remove("destella"); void target.offsetWidth; target.classList.add("destella");
    }
    $(isPhone() ? "leer-cerrar" : "leer-volver").focus({ preventScroll: true });
  }
  function closeRead() {
    leer.hidden = true;
    if (isPhone() && !leerDesde) closeSheet();
    leerDesde = null;
  }

  /* ---------- El dispositivo ---------- */
  function setDev(d) {
    dev = d;
    document.querySelectorAll("[data-dev]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.dev === d)); b.classList.toggle("elegido", b.dataset.dev === d); });
    leer.hidden = true; leerDesde = null;
    renderList(); open(sections()[0]);
    if (isPhone()) closeSheet();
  }

  /* «Volver» (R6.7): en la maqueta lo dice una tostada; en la aplicación vuelve de verdad */
  function back() { toast(isPhone() ? "Vuelve a Más, donde estabas" : "Vuelve a la entrada, donde estabas"); }
  function toast(text) {
    var t = document.querySelector(".m-tostada");
    if (!t) { t = document.createElement("div"); t.className = "m-tostada tostada"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.classList.remove("ver"); void t.offsetWidth; t.classList.add("ver");
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove("ver"); }, 2200);
  }

  /* ---------- Eventos ---------- */
  $("sig").addEventListener("click", function () { go(1); });
  $("ant").addEventListener("click", function () { go(-1); });
  $("avance").addEventListener("click", function (e) {
    var b = e.target.closest("[data-paso]"); if (!b) return;
    var n = +b.dataset.paso; if (n === step) return;
    var d = n > step ? 1 : -1; step = n;
    lastCap = null; sec.steps.slice(0, step).forEach(function (x) { if (x.cap) lastCap = x; });
    show(d);
  });
  $("ver-clip").addEventListener("click", playClip);
  $("todo").addEventListener("click", function () { openRead(sec); });
  $("leer-volver").addEventListener("click", closeRead);
  $("leer-cerrar").addEventListener("click", closeRead);
  $("cerrar").addEventListener("click", closeSheet);
  document.querySelectorAll("[data-volver]").forEach(function (b) { b.addEventListener("click", back); });
  document.querySelectorAll("[data-dev]").forEach(function (b) { b.addEventListener("click", function () { setDev(b.dataset.dev); }); });
  lista.addEventListener("click", function (e) {
    var t = e.target.closest("[data-sec]");
    if (t) { var s = sectionById(t.dataset.sec); if (isPhone()) openSheet(s); else open(s); return; }
    if (e.target.closest("[data-leer]")) openRead(null);
  });

  q.addEventListener("input", function () { clearTimeout(q._t); q._t = setTimeout(renderList, 150); });
  q.addEventListener("keydown", function (e) {
    var t = rows();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (t.length) { marked = (marked + (e.key === "ArrowDown" ? 1 : t.length - 1)) % t.length; markRow(); } }
    if (e.key === "Enter" && q.value.trim().length > 1 && t[marked]) { t[marked].click(); q.blur(); }
    if (e.key === "Escape" && q.value) { e.stopPropagation(); q.value = ""; renderList(); }
  });

  /* Deslizar sobre la captura cambia de paso (celular) */
  var sx = null;
  esc.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  esc.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); sx = null; });

  /* El teclado (solo en la computadora, 00 · R2): todo botón con Alt y una letra, que se ve solo
     mientras Alt está apretado; ← → pasan de paso; / busca; Esc cierra lo que está encima. */
  var KEYS = { c: function () { setDev("desktop"); }, l: function () { setDev("phone"); }, o: back,
    v: function () { if (sec.clip && leer.hidden) playClip(); }, t: function () { if (leer.hidden) openRead(sec); else closeRead(); },
    a: function () { if (leer.hidden && !$("ant").disabled) go(-1); }, s: function () { if (leer.hidden) go(1); } };
  document.addEventListener("keydown", function (e) {
    if (isPhone()) return;
    if (e.key === "Alt") { document.body.classList.add("alt"); e.preventDefault(); return; }
    if (e.altKey && !e.ctrlKey && !e.metaKey && KEYS[e.key.toLowerCase()]) { e.preventDefault(); KEYS[e.key.toLowerCase()](); return; }
    if (e.key === "Escape" && !leer.hidden) { closeRead(); return; }
    var inBox = document.activeElement === q;
    if (inBox && q.value) return;
    if (leer.hidden && e.key === "ArrowRight") go(1);
    if (leer.hidden && e.key === "ArrowLeft") go(-1);
    if (!inBox && e.key === "/") { e.preventDefault(); q.focus(); }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") document.body.classList.remove("alt"); });
  window.addEventListener("blur", function () { document.body.classList.remove("alt"); });

  phoneMq.addEventListener("change", function () { placeholder(); renderList(); if (!isPhone()) { document.body.classList.remove("en-guia"); guia.removeAttribute("aria-hidden"); } else closeSheet(); });

  /* ---------- Arranque ---------- */
  placeholder();
  setDev(dev);
  /* En la computadora, el cursor arranca en el buscador (00 · R2.2); en el celular, nunca (R2.12) */
  if (!isPhone()) q.focus();
  /* Para las capturas de la maqueta: ?paso=<parte> abre una parte; ?todo=<parte> abre «Todos los pasos» */
  var params = new URLSearchParams(location.search);
  if (params.get("dispositivo")) setDev(params.get("dispositivo") === "celular" ? "phone" : "desktop");
  if (params.get("paso") && sectionById(params.get("paso"))) { var ps = sectionById(params.get("paso")); if (isPhone()) openSheet(ps); else open(ps); }
  if (params.get("todo")) openRead(sectionById(params.get("todo")) || null);
})();
