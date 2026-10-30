/* El marco · el guion de la maqueta aprobada (app-frame/final), copiado tal cual salvo:
   - las flechas ↑ ↓ recorren el menú solo si la marca ya está en el menú (si no, recorren la lista
     de la pantalla, 00 · R2.4);
   - en el celular no se incluye la pantalla Más: la pantalla abierta es Usuarios. */
(function () {
  var M = window.Marco;
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body, lado = $("lado"), vista = $("vista");
  var mas = $("mas"), sub = $("sub"), globo = $("globo"), rotulo = $("rotulo"), pop = $("pop");
  var plegarBtn = $("plegar"), persona = $("persona"), personaMini = $("persona-mini");
  var DURA = 240;

  function plegado() { return body.classList.contains("plegado"); }
  // Lo que se abre al costado del lateral arranca a 8 px de lo tocado o del borde del lateral.
  function alCostado(el) { return Math.max(el.getBoundingClientRect().right, lado.getBoundingClientRect().right) + 8; }

  // ---------- El rótulo: el nombre del ícono, al pasar el mouse o con la marca ----------
  function textoRotulo(el) {
    if (el === plegarBtn) return el.getAttribute("aria-label");
    if (el.id === "luz") return el.querySelector("[data-luz] .largo").textContent;
    if (el === personaMini) return "<b>Rubén Paredes</b> · Administrador";
    var n = el.querySelector(".nombre");
    return "<b>" + n.textContent + "</b>" + (el.querySelector(".pronto") ? " · Pronto" : "");
  }
  function mostrarRotulo(el) {
    var r = el.getBoundingClientRect();
    rotulo.innerHTML = textoRotulo(el);
    rotulo.hidden = false;
    rotulo.style.left = alCostado(el) + "px";
    rotulo.style.top = (r.top + r.height / 2 - rotulo.offsetHeight / 2) + "px";
  }
  function ocultarRotulo() { rotulo.hidden = true; }
  function llevaRotulo(el) {
    if (!el || !lado.contains(el)) return false;
    if (el === plegarBtn) return true; // es un ícono solo: dice su nombre agrandado y minimizado
    return plegado() && !sub.contains(el) && !persona.contains(el);
  }
  lado.querySelectorAll("[data-nav]").forEach(function (el) {
    el.addEventListener("pointerenter", function (e) { if (e.pointerType !== "touch" && llevaRotulo(el)) mostrarRotulo(el); });
    el.addEventListener("pointerleave", ocultarRotulo);
  });
  M.alMarcar(function (el) { if (llevaRotulo(el)) mostrarRotulo(el); else ocultarRotulo(); });

  // ---------- Más: un panel al costado del lateral, agrandado o minimizado ----------
  function cerrarMasCapa() { abrirMas(false); }
  function abrirMas(abrir) {
    if (abrir === undefined) abrir = sub.hidden;
    if (abrir === !sub.hidden) return;
    sub.hidden = !abrir;
    mas.setAttribute("aria-expanded", String(abrir));
    if (abrir) {
      ocultarRotulo();
      sub.classList.add("panel-costado", "capa-arriba");
      sub.style.left = alCostado(mas) + "px";
      sub.style.top = mas.getBoundingClientRect().top + "px";
      M.abrirCapa(cerrarMasCapa);
    } else if (!abrir) {
      sub.classList.remove("panel-costado", "capa-arriba");
      sub.style.top = ""; sub.style.left = "";
      M.cerrarCapa(cerrarMasCapa);
      if (sub.contains(M.marcado)) M.marcar(mas);
    }
  }
  mas.addEventListener("click", function () { abrirMas(); });

  // ---------- La persona minimizada: las iniciales abren su tarjeta, con Salir ----------
  function cerrarPersona() {
    if (!persona.classList.contains("abierta")) return;
    persona.classList.remove("abierta", "panel-costado", "capa-arriba");
    personaMini.setAttribute("aria-expanded", "false");
    M.cerrarCapa(cerrarPersona);
    if (persona.contains(M.marcado)) M.marcar(personaMini);
  }
  personaMini.addEventListener("click", function () {
    if (persona.classList.contains("abierta")) { cerrarPersona(); return; }
    ocultarRotulo();
    persona.classList.add("abierta", "panel-costado", "capa-arriba");
    personaMini.setAttribute("aria-expanded", "true");
    M.abrirCapa(cerrarPersona);
  });

  // ---------- Lo que dice «Pronto»: se sacude y el globo lo explica ----------
  var gTimer;
  function pronto(el) {
    var r = el.getBoundingClientRect();
    ocultarRotulo();
    $("globo-txt").innerHTML = "<b>" + el.dataset.nombre + "</b> todavía no está. Cuando se sume, se abre desde acá y deja de decir «Pronto».";
    globo.style.left = alCostado(el) + "px";
    globo.style.top = (r.top + r.height / 2 - 22) + "px";
    globo.hidden = false;
    el.classList.remove("no-esta"); void el.offsetWidth; el.classList.add("no-esta");
    clearTimeout(gTimer);
    gTimer = setTimeout(function () { globo.hidden = true; }, 2600);
  }
  lado.querySelectorAll(".parte[data-nombre]").forEach(function (b) {
    b.addEventListener("click", function () { pronto(b); });
  });

  // ---------- La luz: lo pendiente ----------
  function cerrarPop() { if (pop.hidden) return; pop.hidden = true; pop.classList.remove("capa-arriba"); M.cerrarCapa(cerrarPop); }
  $("luz").addEventListener("click", function () {
    if (!pop.hidden) { cerrarPop(); return; }
    globo.hidden = true; ocultarRotulo();
    pop.style.left = alCostado($("luz")) + "px";
    pop.hidden = false; pop.classList.add("capa-arriba"); M.abrirCapa(cerrarPop);
  });
  $("pop-cerrar").addEventListener("click", cerrarPop);

  // Tocar afuera cierra lo que se abrió al costado.
  document.addEventListener("click", function (e) {
    if (e.target.closest(".demo")) return;
    if (!pop.hidden && !pop.contains(e.target) && !$("luz").contains(e.target)) cerrarPop();
    if (!sub.hidden && !sub.contains(e.target) && !mas.contains(e.target)) abrirMas(false);
    if (persona.classList.contains("abierta") && !persona.contains(e.target) && !personaMini.contains(e.target)) cerrarPersona();
  });

  $("salir").addEventListener("click", M.salir);

  // ---------- Minimizar y agrandar el menú (00 · R1.6). Siempre arranca agrandado: no se guarda. ----------
  var animando = false;
  function plegar(si) {
    if (animando) return;
    if (si === undefined) si = !plegado();
    abrirMas(false); cerrarPersona(); cerrarPop(); globo.hidden = true; ocultarRotulo();
    plegarBtn.setAttribute("aria-expanded", String(!si));
    plegarBtn.setAttribute("aria-label", si ? "Agrandar el menú" : "Minimizar el menú");
    function listo() {
      animando = false; vista.classList.remove("anima");
      if (M.marcado && llevaRotulo(M.marcado)) mostrarRotulo(M.marcado);
      if (plegarBtn.matches(":hover") && llevaRotulo(plegarBtn)) mostrarRotulo(plegarBtn);
    }
    if (M.reducido) { body.classList.toggle("plegado", si); listo(); return; }
    animando = true; vista.classList.add("anima");
    if (si) {
      body.classList.add("cierra");
      setTimeout(function () { body.classList.remove("cierra"); body.classList.add("plegado"); listo(); }, DURA);
    } else {
      body.classList.remove("plegado"); body.classList.add("abre");
      setTimeout(function () { body.classList.remove("abre"); listo(); }, DURA + 100);
    }
  }
  plegarBtn.addEventListener("click", function () { plegar(); });

  // ---------- Teclado: ↑ ↓ recorren el menú, → abre Más, ← vuelve, Enter activa ----------
  function recorrido() { return Array.prototype.filter.call(lado.querySelectorAll("[data-nav]"), function (el) { return el.offsetParent !== null; }); }
  document.addEventListener("keydown", function (e) {
    if (M.angosto() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (!M.marcado || !lado.contains(M.marcado)) return; // la marca está en la pantalla: la maneja ella
    var lista = recorrido(), i = lista.indexOf(M.marcado);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (i < 0) { M.marcar(lista[e.key === "ArrowDown" ? 0 : lista.length - 1]); return; }
      M.marcar(lista[(i + (e.key === "ArrowDown" ? 1 : -1) + lista.length) % lista.length]);
    } else if (e.key === "ArrowRight" && M.marcado === mas && sub.hidden) {
      e.preventDefault(); abrirMas(true);
      M.marcar(sub.querySelector("[data-nav]"));
    } else if (e.key === "ArrowLeft" && M.marcado) {
      e.preventDefault();
      if (sub.contains(M.marcado)) abrirMas(false);
      else if (M.marcado === mas && !sub.hidden) abrirMas(false);
      else if (persona.contains(M.marcado)) cerrarPersona();
    } else if (e.key === "Enter" && M.marcado) {
      e.preventDefault(); M.marcado.click();
    }
  });


  // ---------- Celular ----------
  // La hoja de lo pendiente, que sale de la luz.
  var fondo = $("fondo-hoja"), hojaLuz = $("hoja-luz"), abierta = null;
  function abrirHoja() {
    abierta = hojaLuz; hojaLuz.hidden = false; fondo.hidden = false; hojaLuz.classList.add("capa-arriba");
    M.abrirCapa(cerrarHoja);
  }
  function cerrarHoja() {
    if (!abierta) return;
    hojaLuz.hidden = true; hojaLuz.classList.remove("capa-arriba"); fondo.hidden = true;
    abierta = null; M.cerrarCapa(cerrarHoja);
  }
  fondo.addEventListener("click", cerrarHoja);
  $("p-luz").addEventListener("click", abrirHoja);
  // El menú de abajo: lo que todavía no está lo dice. Más es la parte abierta.
  document.querySelectorAll(".p-nav [data-p]").forEach(function (b) {
    b.addEventListener("click", function () { M.noEsta(b.querySelector(".ico-mov"), b.dataset.p, "· pronto. Todavía no está."); });
  });
  // Deslizar la hoja hacia abajo la cierra.
  (function () {
    var y0 = null;
    hojaLuz.addEventListener("pointerdown", function (e) { if (hojaLuz.scrollTop <= 0) y0 = e.clientY; });
    hojaLuz.addEventListener("pointerup", function (e) { if (y0 !== null && e.clientY - y0 > 60) cerrarHoja(); y0 = null; });
  })();
  window.addEventListener("resize", function () { cerrarHoja(); cerrarPop(); abrirMas(false); cerrarPersona(); globo.hidden = true; ocultarRotulo(); });
})();
