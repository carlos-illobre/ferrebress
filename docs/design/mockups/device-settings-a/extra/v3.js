/* Variante 3 · Los objetos (computadora y celular). */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var ORDEN = ["sistema", "24", "12"];

  // ---------- El reloj ----------
  var reloj = $(".reloj"), antes = "";
  function pintarReloj() {
    var s = DS.hora("app").split(" "), dig = s[0], suf = s.slice(1).join(" ");
    var html = "";
    for (var i = 0; i < dig.length; i++) {
      var ch = dig[i], nuevo = antes.length !== dig.length || antes[i] !== ch;
      html += '<span class="paleta' + (ch === ":" ? " dos-puntos" : "") + '"><span class="car' + (nuevo && antes ? " cae" : "") + '" style="animation-delay:' + (i * 40) + 'ms">' + ch + "</span></span>";
    }
    html += '<span class="paleta sufijo"' + (suf ? "" : " hidden") + '><span class="car' + (suf && antes.indexOf(suf) < 0 ? " cae" : "") + '">' + suf + "</span></span>";
    html += '<span class="desliza" aria-hidden="true"><i class="i i-s" data-i="chevron-up"></i><i class="i i-s" data-i="chevron-down"></i></span>';
    reloj.innerHTML = html;
    antes = dig + suf;
    $$("[data-fmt]").forEach(function (b) { b.setAttribute("aria-checked", b.getAttribute("data-fmt") === DS.prefs.hora ? "true" : "false"); });
  }
  function siguiente(d) { DS.set("hora", ORDEN[(ORDEN.indexOf(DS.prefs.hora) + (d || 1) + 3) % 3]); DS.vibrar(10); }
  var y0 = null, movio = false;
  reloj.addEventListener("pointerdown", function (e) { y0 = e.clientY; movio = false; reloj.setPointerCapture(e.pointerId); });
  reloj.addEventListener("pointermove", function (e) { if (y0 !== null && Math.abs(e.clientY - y0) > 28) { siguiente(e.clientY < y0 ? 1 : -1); y0 = e.clientY; movio = true; } });
  reloj.addEventListener("pointerup", function () { if (!movio) siguiente(1); y0 = null; });
  reloj.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp" || e.key === " " || e.key === "Enter") { e.preventDefault(); siguiente(1); }
    if (e.key === "ArrowDown") { e.preventDefault(); siguiente(-1); }
  });
  $$("[data-fmt]").forEach(function (b) { b.addEventListener("click", function () { DS.set("hora", b.getAttribute("data-fmt")); }); });
  var altH = $("[data-alt=h]"); if (altH) altH.addEventListener("click", function () { siguiente(1); reloj.focus(); });

  // ---------- La llave de luz ----------
  var tecla = $(".tecla");
  tecla.addEventListener("click", function () { DS.set("anim", !DS.prefs.anim); DS.vibrar(15); });

  // ---------- El ícono al dock ----------
  var ico = $(".icono-app"), dock = $(".dock-grande"), zona = $(".instalar-zona");
  var arr = null;
  function sobreDock(e) { var r = dock.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 20 && e.clientY < r.bottom; }
  ico.addEventListener("pointerdown", function (e) {
    if (DS.casos.instalar !== "puede") return;
    arr = { x: e.clientX, y: e.clientY, movio: false }; ico.setPointerCapture(e.pointerId); ico.classList.add("arrastrando");
  });
  ico.addEventListener("pointermove", function (e) {
    if (!arr) return;
    var dx = e.clientX - arr.x, dy = e.clientY - arr.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) arr.movio = true;
    ico.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.06)";
    dock.classList.toggle("encima", sobreDock(e));
  });
  ico.addEventListener("pointerup", function (e) {
    if (!arr) return;
    var listo = sobreDock(e) || !arr.movio;
    ico.classList.remove("arrastrando"); ico.style.transform = ""; dock.classList.remove("encima"); arr = null;
    if (listo) DS.instalar();
  });
  ico.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && DS.casos.instalar === "puede") { e.preventDefault(); DS.instalar(); } });

  // ---------- La huella (celular) ----------
  var hu = $(".huella"), tHu = null;
  function cambiarOffline() {
    if (!DS.prefs.offline && DS.casos.huella === "sinred") { DS.toast("Para prenderla hace falta conexión", "wifi-off"); return; }
    DS.set("offline", !DS.prefs.offline); DS.vibrar([10, 40, 10]);
    DS.toast(DS.prefs.offline ? "Listo: este celular entra sin conexión" : "Ahora necesitás internet para entrar", DS.prefs.offline ? "circle-check" : "wifi");
  }
  if (hu) {
    hu.addEventListener("pointerdown", function () {
      if (hu.disabled) return;
      hu.classList.add("apretando");
      tHu = setTimeout(function () { tHu = null; hu.classList.remove("apretando"); cambiarOffline(); }, 900);
    });
    var suelta = function () { if (tHu) { clearTimeout(tHu); tHu = null; hu.classList.remove("apretando"); DS.toast("Mantené el dedo apoyado", "fingerprint"); } };
    hu.addEventListener("pointerup", suelta); hu.addEventListener("pointerleave", function () { if (tHu) suelta(); });
    hu.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cambiarOffline(); } });
  }

  // ---------- La cajonera ----------
  $$(".cajon").forEach(function (c) {
    c.addEventListener("click", function () { c.classList.remove("sacude"); void c.offsetWidth; c.classList.add("sacude"); DS.toast(c.querySelector(".etiqueta").textContent + ": llega pronto", "package"); });
  });

  function render() {
    pintarReloj();
    var quiet = DS.casos.sistemaQuieto;
    tecla.setAttribute("aria-checked", DS.prefs.anim && !quiet ? "true" : "false");
    tecla.disabled = quiet;
    $("[data-estado-llave]").textContent = DS.animando() ? "Con movimiento" : "En el acto";
    $(".cartelito").hidden = !quiet;

    var ci = DS.casos.instalar; if (ci === "iphone" && !DS.phone) ci = "nosabe";
    $("[data-objeto=instalar]").hidden = ci === "icono" || ci === "nosabe";
    zona.classList.toggle("lista", ci !== "puede");
    ico.classList.toggle("en-dock", ci === "navegador");
    ico.setAttribute("aria-label", ci === "puede" ? "Instalar en este dispositivo" : "Ferrebress instalada");
    dock.hidden = ci === "iphone";
    $(".pasos-iphone").hidden = ci !== "iphone";
    $("[data-instalar-que]").textContent = ci === "navegador" ? "Ya está instalada: abrila desde su ícono."
      : ci === "iphone" ? "Tocá Compartir y después Agregar a inicio."
      : DS.phone ? "Llevalo al dock y queda con su ícono." : "Llevalo al dock (o Alt I) y queda con su ícono, como cualquier aplicación.";

    if (hu) {
      var h = DS.casos.huella;
      $("[data-objeto=offline]").hidden = h === "permiso";
      if (h === "sin") DS.prefs.offline = false;
      hu.disabled = h === "sin";
      hu.setAttribute("aria-checked", DS.prefs.offline ? "true" : "false");
      $("[data-offline-que]").textContent = h === "sin" ? "Para usarla, primero vinculá tu huella en este celular."
        : DS.prefs.offline ? "Prendida: entrás sin internet, hasta 24 h. Mantené el dedo para apagarla." : "Mantené el dedo para trabajar sin conexión.";
      $("[data-offline-estado]").textContent = DS.prefs.offline ? "Sin conexión, prendida" : "Sin conexión, apagada";
    }
  }
  DS.alInstalar = function () { ico.classList.add("en-dock"); };
  DS.on(render);
})();
