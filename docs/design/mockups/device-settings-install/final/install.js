/* El aviso para instalar (04 · R4.5, E25, E26, E36) · maqueta final, solo celular.
   Base: la variante 1 «La hoja» del director. Datos ficticios, sin red.
   La regla: el aviso aparece una sola vez después de entrar; cerrado de cualquier forma («Ahora
   no», bajar la hoja, tocar afuera, o «Instalar» y cancelar en el navegador) no vuelve en ese
   celular. En el código, el pedido del navegador es el `beforeinstallprompt` de Chrome. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  function espera(ms) { return reduce.matches ? 0 : ms; }
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }

  if (/captura/.test(location.search)) document.documentElement.classList.add("captura");

  var celu = $("#celu");
  var velo = $("[data-velo]");
  var hoja = $("[data-aviso]");
  var icono = $("[data-icono]", hoja);
  var fondo = document.querySelectorAll("[data-fondo]");
  var opciones = { navegador: "confirma" }; // lo que hace el navegador en la maqueta
  var abierta = false, pidiendo = false;

  // ---------- Abrir y cerrar ----------
  function abrir() {
    if (abierta) return;
    abierta = true; pidiendo = false;
    hoja.classList.remove("listo"); icono.classList.remove("listo");
    hoja.style.transform = ""; velo.style.opacity = "";
    velo.hidden = false; hoja.hidden = false;
    fondo.forEach(function (el) { el.inert = true; });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      velo.classList.add("ver"); hoja.classList.add("ver");
      hoja.focus({ preventScroll: true });
    }); });
  }

  // Cerrado de cualquier forma, queda anotado en este celular y no vuelve (R4.5)
  function cerrar(despues) {
    if (!abierta) return;
    abierta = false;
    hoja.style.transform = ""; velo.style.opacity = "";
    velo.classList.remove("ver"); hoja.classList.remove("ver");
    fondo.forEach(function (el) { el.inert = false; });
    setTimeout(function () {
      if (abierta) return;
      velo.hidden = true; hoja.hidden = true;
      if (despues) despues();
    }, espera(320));
  }

  function ahoraNo() {
    if (pidiendo) return;
    cerrar(function () { tostada("Si cambiás de idea, está en Más → Configuración", "info"); });
  }

  // «Instalar»: pide al navegador. Confirma: listo en la hoja y se va sola (E26).
  // Cancela: cuenta como cerrado, igual que «Ahora no» (E36).
  function instalar() {
    if (!abierta || pidiendo) return;
    pidiendo = true;
    pedirAlNavegador(function () {
      hoja.classList.add("listo"); icono.classList.add("listo");
      vibrar([10, 40, 10]);
      setTimeout(function () {
        pidiendo = false;
        cerrar(function () { tostada("Ferrebress quedó con su ícono", "circle-check"); });
      }, espera(1400));
    }, function () {
      pidiendo = false;
      ahoraNo();
    });
  }

  $("[data-instalar]", hoja).addEventListener("click", instalar);
  $("[data-ahora-no]", hoja).addEventListener("click", ahoraNo);
  velo.addEventListener("click", ahoraNo); // tocar afuera
  // En el código, el botón atrás de Android también es «Ahora no» (cerrado de cualquier forma)

  // ---------- Bajar la hoja con el dedo: pasados 90 px, es «Ahora no» ----------
  var y0 = null, dy = 0;
  hoja.addEventListener("pointerdown", function (e) {
    if (!abierta || pidiendo || e.target.closest("button")) return;
    y0 = e.clientY; dy = 0;
    hoja.classList.add("arrastrando");
    hoja.setPointerCapture(e.pointerId);
  });
  hoja.addEventListener("pointermove", function (e) {
    if (y0 === null) return;
    dy = Math.max(0, e.clientY - y0);
    hoja.style.transform = "translateY(" + dy + "px)";
    velo.style.opacity = String(Math.max(0, 1 - dy / 300));
  });
  function soltar() {
    if (y0 === null) return;
    y0 = null;
    hoja.classList.remove("arrastrando");
    if (dy > 90) { ahoraNo(); return; }
    hoja.style.transform = ""; velo.style.opacity = "";
  }
  hoja.addEventListener("pointerup", soltar);
  hoja.addEventListener("pointercancel", soltar);

  // ---------- El pedido del navegador, simulado: lo dibuja Chrome, no Ferrebress ----------
  function pedirAlNavegador(alConfirmar, alCancelar) {
    var p = document.createElement("div");
    p.className = "nav-pedido";
    p.innerHTML =
      '<div class="nav-pedido-dlg" role="dialog" aria-modal="true" aria-labelledby="nav-pedido-titulo">' +
      '<h3 class="nav-pedido-titulo" id="nav-pedido-titulo">¿Instalar app?</h3>' +
      '<div class="nav-pedido-app"><span class="app-icono"><img src="../../../common/brand/isotype.svg" alt=""></span><div><b>Ferrebress</b><span>ferrebress.com.ar</span></div></div>' +
      '<div class="nav-pedido-botones"><button type="button" data-no>Cancelar</button><button type="button" class="lleno" data-si>Instalar</button></div></div>';
    celu.appendChild(p);
    requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.add("ver"); }); });
    var hecho = false;
    function fin(fn) {
      if (hecho) return;
      hecho = true;
      p.classList.remove("ver");
      setTimeout(function () { p.remove(); fn(); }, espera(200));
    }
    $("[data-si]", p).addEventListener("click", function () { fin(alConfirmar); });
    $("[data-no]", p).addEventListener("click", function () { fin(alCancelar); });
    // En la maqueta se puede pedir que el navegador cancele solo, para ver ese caso
    if (opciones.navegador === "cancela") setTimeout(function () { fin(alCancelar); }, espera(1400) || 600);
  }

  // ---------- Tostada y vibración ----------
  var tt;
  function tostada(texto, nombreIcono) {
    var t = $("[data-tostada]");
    t.innerHTML = '<i class="i" data-i="' + nombreIcono + '"></i>' + texto;
    window.pintarIconos(t);
    t.classList.add("ver");
    clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove("ver"); }, 2800);
  }

  function vibrar(patron) {
    // Solo después de que la persona tocó algo (si no, el navegador lo bloquea)
    var activo = navigator.userActivation ? navigator.userActivation.hasBeenActive : true;
    try { if (activo && navigator.vibrate) navigator.vibrate(patron); } catch (e) { /* sin vibración */ }
  }

  // ---------- Lengüeta de la maqueta: fuera del diseño ----------
  var l = document.createElement("div");
  l.className = "lengueta";
  l.innerHTML =
    '<button type="button" class="lengueta-boton" aria-label="Opciones de la maqueta"><i class="i" data-i="rotate-ccw"></i></button>' +
    '<div class="lengueta-menu"><p>Maqueta (no es parte del diseño)</p>' +
    '<button type="button" data-m="ver">Ver el aviso de nuevo (en la aplicación no vuelve)</button>' +
    '<button type="button" data-m="confirma">El navegador confirma</button>' +
    '<button type="button" data-m="cancela">El navegador cancela</button></div>';
  celu.appendChild(l);
  window.pintarIconos(l);
  function marcar() {
    $('[data-m="confirma"]', l).classList.toggle("si", opciones.navegador === "confirma");
    $('[data-m="cancela"]', l).classList.toggle("si", opciones.navegador === "cancela");
  }
  marcar();
  l.addEventListener("click", function (e) {
    if (e.target.closest(".lengueta-boton")) { l.classList.toggle("abierta"); return; }
    var b = e.target.closest("[data-m]");
    if (!b) return;
    var m = b.getAttribute("data-m");
    if (m === "ver") { l.classList.remove("abierta"); abrir(); return; }
    opciones.navegador = m;
    marcar();
  });

  // Un instante después de entrar
  setTimeout(abrir, espera(700));
})();
