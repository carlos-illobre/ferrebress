// Maquetas del manual: ubica las marcas sobre las capturas y elige el estado con el #.
// Una .captura lleva data-size="ancho,alto" (en píxeles de la imagen); cada marca adentro,
// data-box="x1,y1,x2,y2" en esos mismos píxeles. Así las marcas siguen a la imagen a cualquier escala.
(function () {
  function place() {
    document.querySelectorAll(".captura[data-size]").forEach(function (cap) {
      var s = cap.getAttribute("data-size").split(",").map(Number);
      cap.querySelectorAll("[data-box]").forEach(function (m) {
        var b = m.getAttribute("data-box").split(",").map(Number);
        m.style.left = (b[0] / s[0] * 100) + "%";
        m.style.top = (b[1] / s[1] * 100) + "%";
        m.style.width = ((b[2] - b[0]) / s[0] * 100) + "%";
        m.style.height = ((b[3] - b[1]) / s[1] * 100) + "%";
      });
      cap.querySelectorAll("[data-at]").forEach(function (m) {
        var p = m.getAttribute("data-at").split(",").map(Number);
        m.style.left = (p[0] / s[0] * 100) + "%";
        m.style.top = (p[1] / s[1] * 100) + "%";
      });
    });
  }
  function state() { document.body.setAttribute("data-estado", location.hash.slice(1) || "inicio"); }
  window.addEventListener("hashchange", state);
  document.addEventListener("DOMContentLoaded", function () { place(); state(); });
})();
