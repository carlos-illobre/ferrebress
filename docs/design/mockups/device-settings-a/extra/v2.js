/* Variante 2 · Elegí lo que ves (computadora y celular). Las muestras se arman acá para que las dos
   pantallas muestren exactamente lo mismo. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var LOGO = "../../../../common/brand/isotype.svg";

  function op(o) {
    return '<button class="op" role="radio" aria-checked="' + (o.on ? "true" : "false") + '"' + (o.dis ? " disabled" : "") + ' data-op="' + o.id + '">' +
      o.lienzo + '<span class="pie-op"><span><span class="nom" style="display:block">' + o.nom + '</span><span class="det">' + o.det + '</span></span><span class="ok"><i class="i i-s" data-i="check"></i>Elegido</span></span>' +
      (o.candado ? '<span class="candado"><i class="i i-s" data-i="' + o.candadoIco + '"></i>' + o.candado + "</span>" : "") + "</button>";
  }
  var escena = function (cls) {
    return '<span class="lienzo ' + cls + '"><span class="mini-lat"></span><span class="mini-txt" style="top:14px;width:30%"></span><span class="mini-txt" style="top:28px;width:44%;background:var(--hundido)"></span><span class="mini-tostada"></span><span class="mini-hoja"></span></span>';
  };
  var lista = function (f) {
    var l = [["Lucía cobró una venta", "9:05"], ["Martín ingresó un pedido", "14:30"], ["Cerraste la caja", "19:45"]];
    l = l.slice(0, 2);
    return '<span class="lienzo mini-lista">' + l.map(function (x) { return '<span class="ln"><span class="pt"></span>' + x[0] + '<b data-hora="' + f + '" data-a="' + x[1] + '">' + DS.horaCon(f, +x[1].split(":")[0], +x[1].split(":")[1]) + "</b></span>"; }).join("") + "</span>";
  };
  var navegador = '<span class="lienzo paisaje"><span class="navegador"><span class="barra-url"><i></i><i></i><i></i><span>ferrebress.com.ar</span></span><span class="pag"></span></span></span>';
  var icono = DS.phone
    ? '<span class="lienzo paisaje"><span class="home"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><span class="f" style="width:26px;height:26px;border-radius:8px"><img src="' + LOGO + '" alt=""></span><i></i><i></i></span></span>'
    : '<span class="lienzo paisaje"><span class="dock"><i></i><i></i><span class="f" style="width:30px;height:30px;border-radius:8px"><img src="' + LOGO + '" alt=""></span><i></i><i></i></span></span>';
  var senal = function (ico, txt) { return '<span class="lienzo"><span class="senal"><span class="grande">' + ico + '<span class="t-detalle" style="font-weight:700">' + txt + "</span></span></span></span>"; };

  function render() {
    var c = DS.casos, p = DS.prefs, quiet = c.sistemaQuieto;
    // 1 · Animaciones
    $("[data-q=anim]").innerHTML =
      op({ id: "anim-si", on: p.anim && !quiet, dis: quiet, lienzo: escena("mueve"), nom: "Con movimiento", det: "Entra y sale suave, corto", candado: quiet ? "Este dispositivo ya pide no animar" : "", candadoIco: "accessibility" }) +
      op({ id: "anim-no", on: !p.anim || quiet, lienzo: escena("corta"), nom: "En el acto", det: "Aparece y se va, sin moverse" });
    // 2 · Hora
    $("[data-q=hora]").innerHTML = ["sistema", "24", "12"].map(function (f) {
      return op({ id: "hora-" + f, on: p.hora === f, lienzo: lista(f), nom: DS.nombreHora[f], det: f === "sistema" ? (DS.phone ? "Este celular usa 24 h" : "Acá se ve en 24 h") : f === "24" ? "De 0 a 23" : "De 1 a 12" });
    }).join("");
    // 3 · Instalar
    var ci = c.instalar; if (ci === "iphone" && !DS.phone) ci = "nosabe";
    $("[data-tarjeta=instalar]").hidden = ci === "icono" || ci === "nosabe";
    $("[data-q=instalar]").innerHTML =
      op({ id: "inst-nav", on: ci !== "navegador", lienzo: navegador, nom: "En el navegador", det: ci === "navegador" ? "Acá la abriste esta vez" : "Como la estás usando ahora" }) +
      op({ id: "inst-ico", on: ci === "navegador", lienzo: icono, nom: "Con su ícono", det: ci === "navegador" ? "Ya está instalada: abrila desde su ícono" : ci === "iphone" ? "Tocá Compartir y después Agregar a inicio" : "Como cualquier aplicación" });
    // 4 · Sin conexión (celular)
    var qo = $("[data-q=offline]");
    if (qo) {
      var h = c.huella;
      $("[data-tarjeta=offline]").hidden = h === "permiso";
      if (h === "sin") p.offline = false;
      qo.innerHTML =
        op({ id: "off-no", on: !p.offline, lienzo: senal('<i class="i i-xl" data-i="wifi"></i>', "Hace falta internet"), nom: "Solo con internet", det: "Como hasta ahora" }) +
        op({ id: "off-si", on: p.offline, dis: h === "sin", lienzo: senal('<i class="i i-xl" data-i="wifi-off"></i><i class="i i-xl" data-i="fingerprint"></i>', "Entrás igual"), nom: "También sin conexión", det: "Con tu huella, hasta 24 h", candado: h === "sin" ? "Para usarla, primero vinculá tu huella en este celular" : "", candadoIco: "fingerprint" });
    }
    if (DS.phone) $("[data-tarjeta=offline]") && syncPuntos();
    // Mi forma
    var fueraDeFabrica = !p.anim || p.hora !== "sistema";
    $("[data-mi-forma]").innerHTML =
      '<span class="pastilla" data-va="0"><i class="i i-s" data-i="sparkles"></i>' + (DS.animando() ? "Con movimiento" : "En el acto") + "</span>" +
      '<span class="pastilla" data-va="1"><i class="i i-s" data-i="clock"></i><span data-hora="app"></span>' + (DS.phone ? "" : " · " + DS.nombreHora[p.hora]) + "</span>" +
      (ci === "icono" || ci === "nosabe" ? "" : '<span class="pastilla" data-va="2"><i class="i i-s" data-i="app-window"></i>' + (ci === "navegador" ? "Instalada" : DS.phone ? "Navegador" : "En el navegador") + "</span>") +
      (fueraDeFabrica ? '<button class="btn btn-fantasma chico" data-reset><i class="i i-s" data-i="rotate-ccw"></i>Volver a como viene' + (DS.phone ? "" : ' <span class="kbd" data-tecla>Alt V</span>') + "</button>" : "");
  }

  document.addEventListener("click", function (e) {
    var va = e.target.closest("[data-va]");
    if (va && car) { var cs = Array.prototype.filter.call(car.children, function (x) { return !x.hidden; }); var k = cs[+va.getAttribute("data-va")]; if (k) car.scrollTo({ left: k.offsetLeft - 16, behavior: DS.animando() ? "smooth" : "auto" }); return; }
    var b = e.target.closest("[data-op]"), id = b && b.getAttribute("data-op");
    if (e.target.closest("[data-reset]")) { DS.prefs.anim = true; DS.set("hora", "sistema"); DS.toast("Volvió a como viene", "rotate-ccw"); return; }
    if (!id || b.disabled) return;
    DS.vibrar(10);
    if (id === "anim-si") DS.set("anim", true);
    else if (id === "anim-no") DS.set("anim", false);
    else if (id.indexOf("hora-") === 0) DS.set("hora", id.slice(5));
    else if (id === "inst-ico") {
      if (DS.casos.instalar === "puede") DS.instalar();
      else if (DS.casos.instalar === "iphone") DS.toast("Tocá Compartir y después Agregar a inicio", "share");
      else DS.toast("Ya está instalada: abrila desde su ícono", "app-window");
    } else if (id === "inst-nav" && DS.casos.instalar === "navegador") DS.toast("Para sacarla, desinstalala desde el sistema", "info");
    else if (id === "off-si") {
      if (DS.casos.huella === "sinred") { DS.toast("Para prenderla hace falta conexión", "wifi-off"); return; }
      DS.set("offline", true); DS.toast("Listo: este celular entra sin conexión", "circle-check"); DS.vibrar([10, 40, 10]);
    } else if (id === "off-no") DS.set("offline", false);
  });

  // Teclado de la computadora
  var alt = { a: function () { if (!DS.casos.sistemaQuieto) DS.set("anim", !DS.prefs.anim); },
    h: function () { var o = ["sistema", "24", "12"]; DS.set("hora", o[(o.indexOf(DS.prefs.hora) + 1) % 3]); },
    i: function () { var b = $('[data-op="inst-ico"]'); if (b && !$("[data-tarjeta=instalar]").hidden) b.click(); },
    v: function () { var b = $("[data-reset]"); if (b) b.click(); } };
  Object.keys(alt).forEach(function (k) {
    var b = document.createElement("button"); b.hidden = true; b.setAttribute("data-alt", k); b.addEventListener("click", alt[k]); document.body.appendChild(b);
  });

  // Celular: los puntos siguen al carrusel
  var car = $(".carrusel");
  function syncPuntos() {
    var pts = $(".puntos"); if (!car || !pts) return;
    var cards = Array.prototype.filter.call(car.children, function (x) { return !x.hidden; });
    if (pts.children.length !== cards.length) {
      pts.innerHTML = cards.map(function (_, i) { return '<button aria-label="Pregunta ' + (i + 1) + '"></button>'; }).join("");
      Array.prototype.forEach.call(pts.children, function (d, i) { d.addEventListener("click", function () { car.scrollTo({ left: cards[i].offsetLeft - 16, behavior: DS.animando() ? "smooth" : "auto" }); }); });
    }
    var i = Math.round(car.scrollLeft / 346);
    Array.prototype.forEach.call(pts.children, function (d, j) { d.classList.toggle("activo", j === i); });
  }
  if (car) car.addEventListener("scroll", syncPuntos, { passive: true });

  DS.on(render);
})();
