// Marco de la aplicación: lo que se mueve igual en las seis variantes.
// - Alt apretado muestra las teclas ([data-key]); Alt + tecla hace lo mismo que tocar el botón.
// - Las flechas mueven la marca entre [data-m="menu|tabs|main"]; Enter activa; Esc cierra o la saca.
// - [data-abre="id"] abre o cierra #id ([data-capa]); tocar afuera o Esc lo cierra.
// - Lo que dice «Pronto» ([data-pronto]) no hace nada.
(function () {
  var body = document.body;
  function teclas() {
    document.querySelectorAll("[data-key]").forEach(function (el) {
      if (el.querySelector(":scope > .tecla")) return;
      var t = document.createElement("span"); t.className = "tecla"; t.textContent = el.getAttribute("data-key");
      el.appendChild(t);
    });
  }
  function marcables(g) { return Array.prototype.filter.call(document.querySelectorAll(g ? '[data-m="' + g + '"]' : "[data-m]"), function (el) { return el.offsetParent !== null; }); }
  function actual() { return document.querySelector(".marcado"); }
  function marcar(el) { var a = actual(); if (a) a.classList.remove("marcado"); if (el) { el.classList.add("marcado"); el.scrollIntoView({ block: "nearest" }); } body.classList.remove("sin-marca"); }
  function activoDe(g) { var l = marcables(g); return l.filter(function (e) { return e.matches(".activo, .activa"); })[0] || l[0]; }
  function cerrarTodo() { var a = document.querySelectorAll("[data-capa].abierto"); a.forEach(function (c) { c.classList.remove("abierto"); }); return a.length > 0; }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Alt") { body.classList.add("alt"); e.preventDefault(); return; }
    if (e.altKey && e.key.length === 1) {
      var k = e.key.toUpperCase(), el = document.querySelector('[data-key="' + k + '"]');
      if (el) { e.preventDefault(); el.click(); }
      return;
    }
    var inp = document.activeElement && document.activeElement.tagName === "INPUT" ? document.activeElement : null;
    if (e.key === "Escape") { if (!cerrarTodo()) marcar(null); return; }
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) < 0) {
      if (e.key === "Enter" && actual()) { e.preventDefault(); actual().click(); }
      return;
    }
    if (inp && inp.value && (e.key === "ArrowLeft" && inp.selectionStart > 0 || e.key === "ArrowRight" && inp.selectionEnd < inp.value.length)) return;
    e.preventDefault();
    var m = actual();
    if (!m || body.classList.contains("sin-marca")) { marcar(m || activoDe("main") || activoDe("menu")); return; }
    var g = m.getAttribute("data-m"), l = marcables(g), i = l.indexOf(m);
    if (e.key === "ArrowDown") marcar(l[Math.min(i + 1, l.length - 1)]);
    else if (e.key === "ArrowUp") marcar(l[Math.max(i - 1, 0)]);
    else if (e.key === "ArrowLeft") {
      if (g === "tabs" && i > 0) marcar(l[i - 1]);
      else if (g === "tabs") marcar(activoDe("menu"));
      else if (g === "main") marcar(activoDe("tabs") || activoDe("menu"));
    } else {
      if (g === "menu") marcar(activoDe("tabs") || activoDe("main"));
      else if (g === "tabs" && i < l.length - 1) marcar(l[i + 1]);
      else if (g === "tabs") marcar(marcables("main")[0]);
    }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") body.classList.remove("alt"); });
  window.addEventListener("blur", function () { body.classList.remove("alt"); });
  document.addEventListener("mousemove", function () { if (actual()) body.classList.add("sin-marca"); });

  document.addEventListener("click", function (e) {
    var p = e.target.closest("[data-pronto]");
    if (p) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    var a = e.target.closest("[data-abre]");
    if (a) { var c = document.getElementById(a.getAttribute("data-abre")); if (c) { var ab = c.classList.contains("abierto"); cerrarTodo(); if (!ab) c.classList.add("abierto"); } e.stopPropagation(); return; }
    if (e.target.closest("[data-cierra]") || !e.target.closest("[data-capa]")) cerrarTodo();
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", teclas); else teclas();
})();
