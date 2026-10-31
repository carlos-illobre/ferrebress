/* Sin permiso: el selector de casos de la maqueta y piezas chicas comunes.
   Cada variante define window.ESCENAS = { direccion: fn, perdido: fn } antes de cargar este archivo.
   - «Por la dirección» (R7.7): abrió /users por un enlace guardado y no tiene «Ver las personas».
   - «Lo perdió usándola» (R7.8): estaba en Usuarios y le sacaron el rol que se lo daba.
   El caso se abre directo con #direccion o #perdido al final de la dirección. */
(function () {
  var S = window.STAGE = {};
  var celu = !!document.querySelector(".celu");
  S.reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  S.icons = function (root) { if (window.pintarIconos) window.pintarIconos(root); };

  S.toast = function (html) {
    var box = document.querySelector(".tostadas");
    if (!box) { box = document.createElement("div"); box.className = "tostadas"; (document.querySelector(".celu") || document.body).appendChild(box); }
    var t = document.createElement("div");
    t.className = "tostada"; t.innerHTML = '<i class="i" data-i="circle-check"></i><span>' + html + "</span>";
    t.style.cssText = "opacity:0;transform:translateY(12px);transition:opacity var(--t) var(--curva),transform var(--t-nav) var(--rebote)";
    box.appendChild(t); S.icons(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.style.opacity = 1; t.style.transform = "none"; }); });
    setTimeout(function () { t.style.opacity = 0; t.style.transform = "translateY(8px)"; setTimeout(function () { t.remove(); }, 300); }, 2600);
  };

  // Vibra solo después de que la persona tocó algo (el navegador lo exige)
  var touched = false;
  document.addEventListener("pointerdown", function () { touched = true; }, true);
  S.vibrate = function (p) { try { if (touched && navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

  // El selector (fuera del diseño)
  var bar = document.createElement("div");
  bar.className = "escenario" + (celu ? " celu-escenario" : "");
  bar.setAttribute("aria-label", "Caso de la maqueta (fuera del diseño)");
  bar.innerHTML =
    '<button data-esc="direccion"><i class="i" data-i="link"></i>Por la dirección</button>' +
    '<button data-esc="perdido"><i class="i" data-i="user-x"></i>Lo perdió usándola</button>' +
    '<button data-esc="repetir" title="Repetir el caso"><i class="i" data-i="refresh-cw"></i>' + (celu ? "" : "Repetir") + "</button>";
  document.body.appendChild(bar);
  S.icons(bar);

  var current = (location.hash || "").replace("#", "");
  if (!window.ESCENAS || !window.ESCENAS[current]) current = "direccion";

  S.run = function (name) {
    current = name;
    bar.querySelectorAll("[data-esc]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-esc") === name)); });
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
    if (window.ESCENAS && window.ESCENAS[name]) window.ESCENAS[name]();
  };
  bar.addEventListener("click", function (e) {
    var b = e.target.closest("[data-esc]"); if (!b) return;
    var n = b.getAttribute("data-esc");
    S.run(n === "repetir" ? current : n);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { S.run(current); });
  else S.run(current);
})();
