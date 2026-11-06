/* Variante 1 · La lista que se prueba (computadora y celular). */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  $("[data-pref=anim]").addEventListener("click", function () {
    DS.set("anim", !DS.prefs.anim);
    DS.vibrar(10);
  });
  $$("[data-formato]").forEach(function (b) {
    b.addEventListener("click", function () { DS.set("hora", b.getAttribute("data-formato")); DS.vibrar(10); });
  });
  var ciclo = $("[data-alt=h]");
  if (ciclo) ciclo.addEventListener("click", function () {
    var o = ["sistema", "24", "12"]; DS.set("hora", o[(o.indexOf(DS.prefs.hora) + 1) % 3]);
    var el = $('[data-formato="' + DS.prefs.hora + '"]'); if (el) el.focus();
  });
  var inst = $("[data-instalar]");
  if (inst) inst.addEventListener("click", DS.instalar);
  var off = $("[data-pref=offline]");
  if (off) off.addEventListener("click", function () {
    if (!DS.prefs.offline && DS.casos.huella === "sinred") { DS.toast("Para prenderla hace falta conexión", "wifi-off"); return; }
    DS.set("offline", !DS.prefs.offline);
    if (DS.prefs.offline) { DS.toast("Listo: este celular entra sin conexión", "circle-check"); DS.vibrar([10, 40, 10]); }
  });

  function render() {
    var anim = DS.animando(), quiet = DS.casos.sistemaQuieto;
    var ll = $("[data-pref=anim]");
    ll.setAttribute("aria-checked", DS.prefs.anim && !quiet ? "true" : "false");
    ll.disabled = quiet;
    $(".muestra").classList.toggle("en-el-acto", !anim);
    $("[data-leyenda]").innerHTML = anim ? "<b>Así se mueve ahora.</b> " + (DS.phone ? "Corto, nunca te hace esperar." : "Corto: nunca te hace esperar.")
      : "<b>Así, en el acto.</b> " + (DS.phone ? "Sin movimiento." : "Aparece y desaparece, sin moverse.");
    $("[data-aviso-sistema]").hidden = !quiet;

    $$("[data-formato]").forEach(function (b) { b.setAttribute("aria-checked", b.getAttribute("data-formato") === DS.prefs.hora ? "true" : "false"); });

    var row = $("[data-fila-instalar]"), c = DS.casos.instalar;
    if (c === "iphone" && !DS.phone) c = "nosabe";
    row.classList.toggle("oculto", c === "icono" || c === "nosabe");
    var t = { puede: [DS.phone ? "Instalar en este celular" : "Instalar en este dispositivo", DS.phone ? "Abrila desde un ícono" : "Queda con su ícono, para abrirla como cualquier otra aplicación."],
      navegador: ["Ya está instalada", "Abrila desde su ícono."],
      iphone: ["Instalar en este celular", "Tocá Compartir y después Agregar a inicio"] }[c] || ["", ""];
    $("[data-instalar-nombre]").textContent = t[0];
    $("[data-instalar-que]").textContent = t[1];
    $("[data-instalar-accion]").innerHTML = c === "puede"
      ? '<button class="btn btn-accion chico" data-instalar2><i class="i i-s" data-i="download"></i>Instalar' + (DS.phone ? "" : ' <span class="kbd" data-tecla>Alt I</span>') + "</button>"
      : c === "navegador" ? '<span class="pastilla logro"><i class="i i-s" data-i="check"></i>Instalada</span>'
      : '<span class="pastilla contorno"><i class="i i-s" data-i="share"></i>Compartir</span>';
    var b2 = $("[data-instalar2]"); if (b2) { b2.addEventListener("click", DS.instalar); b2.setAttribute("data-alt", "i"); }

    var fo = $("[data-fila-offline]");
    if (fo) {
      var h = DS.casos.huella;
      fo.classList.toggle("oculto", h === "permiso");
      var lo = $("[data-pref=offline]");
      if (h === "sin") DS.prefs.offline = false;
      lo.disabled = h === "sin";
      lo.setAttribute("aria-checked", DS.prefs.offline ? "true" : "false");
      fo.classList.toggle("apagado", h === "sin");
      $("[data-offline-que]").textContent = h === "sin" ? "Para usarla, primero vinculá tu huella en este celular"
        : h === "sinred" && !DS.prefs.offline ? "Para prenderla hace falta conexión" : DS.prefs.offline ? "Entrás con tu huella aunque no haya internet, hasta 24 h" : "Entrá con tu huella aunque no haya internet";
    }
  }
  DS.on(render);
})();
