/* Movimiento que comparten las variantes: tostada, hoja, vibración y «Sin conexión».
   Solo transform y opacity; con «reducir movimiento», common.css apaga las transiciones. */
window.UI = (function () {
  var abierta = null;
  function tostada(texto, icono) {
    var cont = document.querySelector(".tostadas"); if (!cont) return;
    var t = document.createElement("div"); t.className = "tostada";
    t.innerHTML = '<i class="i" data-i="' + (icono || "circle-check") + '"></i><span>' + texto + "</span>";
    cont.appendChild(t); window.pintarIconos(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add("ver"); }); });
    setTimeout(function () { t.classList.remove("ver"); setTimeout(function () { t.remove(); }, 400); }, 2800);
  }
  function abrir(el) {
    cerrar(); abierta = el;
    document.querySelector(".velo").classList.add("abierto"); el.classList.add("abierta");
    var f = el.querySelector("[data-foco]"); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 340);
  }
  function cerrar() {
    if (!abierta) return;
    abierta.classList.remove("abierta"); document.querySelector(".velo").classList.remove("abierto"); abierta = null;
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
  document.addEventListener("click", function (e) {
    if (e.target.classList && e.target.classList.contains("velo")) cerrar();
    if (e.target.closest && e.target.closest("[data-cerrar]")) cerrar();
  });
  function vibrar(p) { try { if (navigator.vibrate && !UA.quieto()) navigator.vibrate(p); } catch (e) {} }
  /* Tocar la línea de conexión simula perderla y recuperarla (00 · R4.4) */
  document.addEventListener("click", function (e) {
    var luz = e.target.closest && e.target.closest(".celu-estado"); if (!luz) return;
    var off = document.body.classList.toggle("offline");
    luz.querySelector("[data-luz]").textContent = off ? "Sin conexión · tocá para volver" : "En línea · todo enviado";
    if (!off) tostada("Volvió la conexión", "wifi");
  });
  /* El marco no se corre aunque el foco caiga en algo escondido */
  document.querySelectorAll(".celu").forEach(function (c) { c.addEventListener("scroll", function () { c.scrollTop = 0; c.scrollLeft = 0; }); });
  /* Apretar: baja a 97 % (lo hace .btn); a los renglones propios también */
  return { tostada: tostada, abrir: abrir, cerrar: cerrar, vibrar: vibrar };
})();
