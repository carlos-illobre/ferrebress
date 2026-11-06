/* Configuración (device-settings-a): el estado de mentira y las ayudas de las tres variantes.
   DS.prefs son las preferencias de la persona; DS.casos, cómo es el dispositivo (para que Carlos
   vea cada caso de la regla desde el botón «Casos», abajo a la derecha). */
(function () {
  var phone = !!document.querySelector(".celu");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DS = window.DS = {
    phone: phone,
    prefs: { anim: true, hora: "sistema", offline: false },
    casos: { sistemaQuieto: reduce, instalar: "puede", huella: "con" },
    fns: []
  };
  if (/captura/.test(location.hash)) document.body.classList.add("captura");

  // ---------- La hora: arranca en 14:30 (la del ejemplo de la regla) y avanza de verdad ----------
  var base = new Date(); base.setHours(14, 30, 0, 0);
  var t0 = Date.now();
  DS.ahora = function () { return new Date(base.getTime() + (Date.now() - t0)); };
  DS.hora = function (fmt, d) {
    d = d || DS.ahora();
    var h = d.getHours(), m = ("0" + d.getMinutes()).slice(-2);
    if (fmt === "app") fmt = DS.prefs.hora;
    if (fmt === "12") return (h % 12 || 12) + ":" + m + "\u00a0" + (h < 12 ? "a.\u00a0m." : "p.\u00a0m.");
    return h + ":" + m; // «Como el sistema»: este dispositivo muestra 24 horas
  };
  DS.horaCon = function (fmt, hh, mm) { var d = new Date(base); d.setHours(hh, mm); return DS.hora(fmt, d); };
  DS.nombreHora = { sistema: "Como el sistema", "24": "24 horas", "12": "a. m./p. m." };
  function pintarHoras() {
    document.querySelectorAll("[data-hora]").forEach(function (el) {
      var f = el.getAttribute("data-hora"), a = el.getAttribute("data-a");
      var txt = a ? DS.horaCon(f, +a.split(":")[0], +a.split(":")[1]) : DS.hora(f);
      if (el.textContent !== txt) el.textContent = txt;
    });
  }
  setInterval(pintarHoras, 5000);

  // ---------- Animaciones: prendidas, apagadas o el sistema manda ----------
  DS.animando = function () { return DS.prefs.anim && !DS.casos.sistemaQuieto; };
  function aplicar() {
    document.body.classList.toggle("quieto", !DS.animando());
    DS.fns.forEach(function (f) { f(); });
    pintarHoras();
    if (window.pintarIconos) window.pintarIconos();
  }
  DS.on = function (f) { DS.fns.push(f); };
  DS.set = function (k, v) { DS.prefs[k] = v; aplicar(); };
  DS.caso = function (k, v) { DS.casos[k] = v; aplicar(); };
  DS.render = aplicar;

  DS.vibrar = function (p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

  // ---------- Tostadas ----------
  DS.toast = function (texto, icono) {
    var box = document.querySelector(".tostadas");
    if (!box) { box = document.createElement("div"); box.className = "tostadas"; (document.querySelector(".celu") || document.body).appendChild(box); }
    var t = document.createElement("div");
    t.className = "tostada";
    t.innerHTML = '<i class="i" data-i="' + (icono || "circle-check") + '"></i><span>' + texto + "</span>";
    box.appendChild(t);
    if (window.pintarIconos) window.pintarIconos(t);
    setTimeout(function () { t.classList.add("se-va"); setTimeout(function () { t.remove(); }, DS.animando() ? 220 : 0); }, 2600);
  };

  // ---------- Capas: se abren, se cierran con su botón, tocando afuera y con Escape ----------
  DS.abrir = function (id) { var c = document.getElementById(id); if (c) { c.classList.add("abierta"); var f = c.querySelector("[autofocus], .btn"); if (f) f.focus(); } };
  DS.cerrar = function () { document.querySelectorAll(".capa.abierta").forEach(function (c) { c.classList.remove("abierta"); }); };
  document.addEventListener("click", function (e) {
    if (e.target.classList && e.target.classList.contains("capa")) DS.cerrar();
    if (e.target.closest && e.target.closest("[data-cerrar]")) DS.cerrar();
  });

  // ---------- Instalar: el pedido del navegador, simulado ----------
  function armarPedido() {
    if (document.getElementById("pedido-instalar")) return;
    var c = document.createElement("div");
    c.className = "capa" + (phone ? " de-hoja" : "");
    c.id = "pedido-instalar";
    var logo = "../../../../common/brand/isotype.svg";
    c.innerHTML = '<div class="' + (phone ? "hoja" : "dialogo") + '" role="dialog" aria-label="Instalar la aplicación">' + (phone ? '<div class="asa"></div>' : "") +
      '<div class="pedido-nav"><span class="app-ico"><img src="' + logo + '" alt=""></span><h2 style="margin:0">¿Instalar la aplicación?</h2><span class="sitio">Ferrebress · ferrebress.com.ar</span></div>' +
      '<p class="t-detalle" style="margin:16px 0 0">Esto lo pregunta el navegador, no Ferrebress. Queda con su ícono, como cualquier otra aplicación.</p>' +
      '<div class="pie-dialogo"><button class="btn btn-fantasma" data-cerrar>Cancelar</button><button class="btn btn-oscuro" data-confirma-instalar>Instalar</button></div></div>';
    (document.querySelector(".celu") || document.body).appendChild(c);
    c.querySelector("[data-confirma-instalar]").addEventListener("click", function () {
      DS.cerrar();
      setTimeout(function () { DS.caso("instalar", "navegador"); DS.toast("Listo: Ferrebress quedó con su ícono", "circle-check"); DS.vibrar([10, 40, 10]); if (DS.alInstalar) DS.alInstalar(); }, 180);
    });
  }
  DS.instalar = function () { armarPedido(); DS.abrir("pedido-instalar"); };

  // ---------- Teclado: Alt muestra las teclas; Alt + letra cambia la preferencia ----------
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") DS.cerrar();
    if (e.key === "Alt") { document.body.classList.add("con-alt"); e.preventDefault(); return; }
    if (e.altKey && e.key && e.key.length === 1) {
      var el = document.querySelector('[data-alt="' + e.key.toLowerCase() + '"]');
      if (el && !el.disabled) { e.preventDefault(); el.click(); el.focus(); }
    }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") document.body.classList.remove("con-alt"); });
  window.addEventListener("blur", function () { document.body.classList.remove("con-alt"); });

  // ---------- Casos ----------
  function armarCasos() {
    var b = document.createElement("button");
    b.className = "casos-btn"; b.type = "button";
    b.innerHTML = '<i class="i i-s" data-i="sliders-horizontal"></i>Casos';
    var p = document.createElement("div");
    p.className = "casos"; p.setAttribute("role", "dialog");
    function radios(name, opts) {
      return opts.map(function (o) { return '<label><input type="radio" name="' + name + '" value="' + o[0] + '"' + (DS.casos[name] === o[0] ? " checked" : "") + ">" + o[1] + "</label>"; }).join("");
    }
    p.innerHTML = '<h3>Casos de la regla</h3><p class="nota">No es parte de la pantalla: cambia cómo es el dispositivo para ver cada caso.</p>' +
      '<fieldset><legend>El sistema</legend><label><input type="checkbox" name="sistemaQuieto"' + (DS.casos.sistemaQuieto ? " checked" : "") + '>Pide no animar (reducir movimiento)</label></fieldset>' +
      '<fieldset><legend>Instalar</legend>' + radios("instalar", [["puede", "El navegador sabe instalar"], ["navegador", "Ya instalada, abierta en el navegador"], ["icono", "Abierta desde su ícono"], ["iphone", "iPhone"], ["nosabe", "El navegador no sabe instalar"]]) + "</fieldset>" +
      (phone ? '<fieldset><legend>Trabajar sin conexión</legend>' + radios("huella", [["con", "Con el permiso y la huella"], ["sin", "Con el permiso, sin la huella"], ["sinred", "Con todo, pero ahora sin conexión"], ["permiso", "Sin el permiso"]]) + "</fieldset>" : "");
    p.addEventListener("change", function (e) {
      var t = e.target;
      DS.caso(t.name, t.type === "checkbox" ? t.checked : t.value);
    });
    b.addEventListener("click", function () { p.classList.toggle("abierto"); });
    document.body.appendChild(b); document.body.appendChild(p);
    if (window.pintarIconos) window.pintarIconos(b);
  }

  function init() { armarCasos(); aplicar(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
