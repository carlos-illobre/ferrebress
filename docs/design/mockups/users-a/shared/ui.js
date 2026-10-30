/* Piezas de movimiento que comparten las variantes: tostada, diálogo/hoja y «Sin conexión».
   Solo transform y opacity; con «reducir movimiento», common.css apaga las transiciones. */
window.UI = (function () {
  var abierto = null;

  function tostada(texto, icono) {
    var cont = document.querySelector(".tostadas");
    if (!cont) return;
    var t = document.createElement("div");
    t.className = "tostada";
    t.innerHTML = '<i class="i" data-i="' + (icono || "circle-check") + '"></i>' + texto;
    cont.appendChild(t);
    window.pintarIconos(t.parentNode);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add("ver"); }); });
    setTimeout(function () { t.classList.remove("ver"); setTimeout(function () { t.remove(); }, 400); }, 2600);
  }

  function abrir(el) {
    cerrar();
    abierto = el;
    var velo = document.querySelector(".velo");
    if (velo) velo.classList.add("abierto");
    el.classList.add(el.classList.contains("hoja") ? "abierta" : "abierto");
    var f = el.querySelector("[autofocus], input, .btn-rojo, .btn-accion");
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
  }

  function cerrar() {
    if (!abierto) return;
    abierto.classList.remove("abierto", "abierta");
    var velo = document.querySelector(".velo");
    if (velo) velo.classList.remove("abierto");
    abierto = null;
  }

  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && abierto) { e.preventDefault(); cerrar(); } });
  document.addEventListener("click", function (e) {
    if (e.target.classList && e.target.classList.contains("velo")) cerrar();
    if (e.target.closest && e.target.closest("[data-cerrar]")) cerrar();
  });

  /* La luz de conexión simula perder y recuperar la conexión (00 · R4.4 y R4.6). */
  function conexion(sel, textoOn, textoOff) {
    document.querySelectorAll(sel).forEach(function (luz) {
      luz.addEventListener("click", function () {
        var off = document.body.classList.toggle("offline");
        document.querySelectorAll("[data-luz-texto]").forEach(function (t) { t.textContent = off ? textoOff : textoOn; });
        if (!off) tostada("Volvió la conexión", "wifi");
      });
    });
  }

  /* El marco del celular no se corre aunque el foco caiga en una hoja escondida. */
  document.querySelectorAll(".celu").forEach(function (c) { c.addEventListener("scroll", function () { c.scrollTop = 0; c.scrollLeft = 0; }); });

  return { tostada: tostada, abrir: abrir, cerrar: cerrar, conexion: conexion, estaAbierto: function () { return !!abierto; } };
})();
