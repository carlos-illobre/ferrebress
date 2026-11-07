/* Variante 1 · Los renglones. Pinta la pantalla con el estado de AS (base.js). */
window.AS_VARIANTE = function () {
  "use strict";
  var AS = window.AS, S = AS.S, $ = AS.$, $$ = AS.$$;
  var lienzo = $("#lienzo");
  var vistaPaso = null; // el paso que se está mirando con el mouse (no se guarda)
  var diasPend = null, diasTimer = null;

  function iniciales(n) { return n.split(" ").map(function (p) { return p[0]; }).join("").slice(0, 2); }
  function nota(clave, i) {
    var n = AS.notas[clave]; if (!n || (i !== undefined && n.i !== undefined && n.i !== i)) return "";
    return '<div class="nota ' + n.tipo + '" role="alert"><i class="i" data-i="' + (n.tipo === "otro" ? "users" : "triangle-alert") + '"></i><span>' + n.txt + "</span></div>";
  }
  function candado() { return '<i class="i i-s candado" data-i="lock-keyhole"></i>'; }
  function radios(clave, ops, etiqueta, clase) {
    return '<div class="' + clase + '" role="radiogroup" aria-label="' + AS.NOMBRE[clave] + '" data-grupo="' + clave + '" data-toca><span class="ficha" aria-hidden="true"></span>' +
      ops.map(function (v) {
        var on = S[clave] === v;
        return '<button type="button" role="radio" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-v="' + v + '" data-foco="' + clave + "-" + v + '">' + etiqueta(v) + "</button>";
      }).join("") + "</div>";
  }
  function asi(paso) {
    var ver = paso !== undefined && paso !== null && paso !== S.redondeo;
    if (paso === null || paso === undefined) paso = S.redondeo;
    var ej = [AS.PRODUCTOS[0], AS.PRODUCTOS[4]].map(function (p) {
      var a = AS.redondear(p.calc, paso);
      return '<span class="ej"><img src="../../../../common/photos/' + p.foto + '.webp" alt=""><s>' + AS.plata(p.calc) + '</s><i class="i" data-i="arrow-right"></i>' + AS.plata(a) + "</span>";
    }).join("");
    var n = AS.cambian(paso);
    return '<span class="largo">Así:</span>' + ej + '<span class="cuanto' + (ver ? " ver" : "") + '">' + (ver ? (n ? "Cambiarían " + AS.miles(n) + " precios" : "No cambiaría ningún precio") : AS.miles(AS.TOTAL_PRECIOS) + " precios con este paso") + "</span>";
  }

  function pintar() {
    var foco = document.activeElement && document.activeElement.getAttribute("data-foco");
    var antes = {};
    $$(".margen[data-v]").forEach(function (m) { antes[m.getAttribute("data-v")] = m.getBoundingClientRect(); });
    var chico = AS.chico();

    var redondeo =
      '<div class="aj" data-ajuste="redondeo">' +
        '<span class="aj-ico"><i class="i" data-i="calculator"></i></span>' +
        '<div><div class="aj-nom">Redondeo para arriba <span class="kbd">R</span>' + candado() + '</div><div class="aj-que"><span class="largo">' + AS.QUE.redondeo + '</span><span class="corto">' + AS.QUE_CORTO.redondeo + '</span></div></div>' +
        '<div class="aj-der"><span class="aj-valor">' + AS.fmt("redondeo") + "</span></div>" +
        '<div class="aj-abajo">' + radios("redondeo", AS.OPC.redondeo, function (v) { return v === 0 ? "Sin" : "<small>$</small>" + AS.miles(v); }, "pasos") +
        '<div class="asi" data-asi>' + asi(vistaPaso) + "</div></div>" + nota("redondeo") +
      "</div>";

    var margenes =
      '<div class="aj" data-ajuste="margenes">' +
        '<span class="aj-ico"><i class="i" data-i="percent"></i></span>' +
        '<div><div class="aj-nom">Márgenes rápidos <span class="kbd">M</span>' + candado() + '</div><div class="aj-que"><span class="largo">' + AS.QUE.margenes + '</span><span class="corto">Teclas 1 a 5 al elegir un margen</span></div></div><span></span>' +
        '<div class="aj-abajo"><div class="margenes" data-toca>' +
          S.margenes.map(function (m, i) {
            var mal = AS.notas.margenes && AS.notas.margenes.tipo === "error" && AS.notas.margenes.i === i;
            return '<label class="margen' + (mal ? " mal" : "") + '" data-v="' + m + '"><span class="tecla">' + (i + 1) + '</span><input inputmode="numeric" aria-label="Margen de la tecla ' + (i + 1) + '" value="' + AS.miles(m) + '" data-i="' + i + '" data-foco="m' + i + '"' + (AS.puede() ? "" : " readonly") + '><span class="pc">%</span></label>';
          }).join("") +
        '</div><div class="margen-pie"><span>Se ordenan solos, de mayor a menor</span><span class="largo">No cambia ningún producto</span></div></div>' + nota("margenes") +
      "</div>";

    var zona =
      '<div class="aj" data-ajuste="zona">' +
        '<span class="aj-ico"><i class="i" data-i="globe"></i></span>' +
        '<div><div class="aj-nom">Zona horaria del negocio</div><div class="aj-que"><span class="largo">' + AS.QUE.zona + '</span><span class="corto">' + AS.QUE_CORTO.zona + '</span></div></div>' +
        '<div class="aj-der zona"><span><span class="aj-valor">Buenos Aires</span> · <b data-hora class="reloj-grande">' + AS.hora() + '</b></span></div>' +
      "</div>";

    var sinUso =
      '<div class="aj" data-ajuste="sinUso">' +
        '<span class="aj-ico"><i class="i" data-i="hourglass"></i></span>' +
        '<div><div class="aj-nom">Sin uso <span class="kbd">S</span>' + candado() + '</div><div class="aj-que"><span class="largo">' + AS.QUE.sinUso + '</span><span class="corto">' + AS.QUE_CORTO.sinUso + '</span></div></div>' +
        (chico ? '<span class="aj-valor">' + AS.fmt("sinUso") + '</span><div class="aj-abajo">' : '<div class="aj-der">') + radios("sinUso", AS.OPC.sinUso, function (v) { return v + "<small> min</small>"; }, "seg") + "</div>" + nota("sinUso") +
      "</div>";
    var tope =
      '<div class="aj" data-ajuste="tope">' +
        '<span class="aj-ico"><i class="i" data-i="timer"></i></span>' +
        '<div><div class="aj-nom">Tope de la sesión <span class="kbd">T</span>' + candado() + '</div><div class="aj-que"><span class="largo">' + AS.QUE.tope + '</span><span class="corto">' + AS.QUE_CORTO.tope + '</span></div></div>' +
        (chico ? '<span class="aj-valor">' + AS.fmt("tope") + '</span><div class="aj-abajo">' : '<div class="aj-der">') + radios("tope", AS.OPC.tope, function (v) { return v + "<small> h</small>"; }, "seg") + "</div>" + nota("tope") +
      "</div>";
    var dv = diasPend !== null ? diasPend : S.vinculo;
    var vinculo =
      '<div class="aj" data-ajuste="vinculo">' +
        '<span class="aj-ico"><i class="i" data-i="link"></i></span>' +
        '<div><div class="aj-nom">Días del vínculo <span class="kbd">V</span>' + candado() + '</div><div class="aj-que"><span class="largo">' + AS.QUE.vinculo + '</span><span class="corto">' + AS.QUE_CORTO.vinculo + '</span></div></div>' +
        '<div class="aj-der"><span class="dias' + (AS.notas.vinculo && AS.notas.vinculo.tipo === "error" ? " mal" : "") + '" data-toca><button type="button" data-dias="-1" aria-label="Un día menos"><i class="i" data-i="minus"></i></button><input inputmode="numeric" aria-label="Días del vínculo" value="' + dv + '" data-foco="dias"' + (AS.puede() ? "" : " readonly") + '><span class="u">días</span><button type="button" data-dias="1" aria-label="Un día más"><i class="i" data-i="plus"></i></button></span></div>' + nota("vinculo") +
      "</div>";

    var cambios = AS.historial.slice(0, 3).map(function (h) {
      return '<div class="cambio' + (h.nuevo ? " nuevo" : "") + '"><span class="ava">' + iniciales(h.quien) + '</span><div class="que">' + AS.NOMBRE[h.clave] + ": <s>" + h.de + "</s> → " + h.a + '</div><div class="cuando">' + h.quien + " · " + h.cuando + (h.extra ? " · " + h.extra : "") + "</div></div>";
    }).join("");
    AS.historial.forEach(function (h) { h.nuevo = false; });
    var ultimos = '<section class="grupo"><h2 class="grupo-titulo">Últimos cambios</h2><div class="tarjeta cambios">' + cambios + '<button type="button" class="ver-todo" data-ir="audit-log">Ver todos en Quién hizo qué<i class="i i-s" data-i="chevron-right"></i></button></div></section>';

    lienzo.innerHTML =
      '<div class="aviso urgente sin-red" style="margin-bottom:16px"><i class="i" data-i="wifi-off"></i><span><span class="largo">Sin conexión: es lo último que se vio, hoy 10:41. Con conexión se puede cambiar.</span><span class="corto">Sin conexión: lo último que se vio, 10:41</span></span><button type="button" class="btn chico" data-reintentar><i class="i i-s" data-i="refresh-cw"></i>Reintentar</button></div>' +
      '<div class="nunca"><span class="burbuja"><i class="i" data-i="cloud-off"></i></span><div class="t-seccion">Hace falta conexión</div><p class="t-detalle" style="margin:0;max-width:360px">Los ajustes están en el servidor y este dispositivo todavía no los vio.</p><button type="button" class="btn" data-reintentar><i class="i" data-i="refresh-cw"></i>Reintentar</button></div>' +
      '<div class="cols del-servidor">' +
        '<div class="col"><section class="grupo"><h2 class="grupo-titulo">Precios</h2><div class="tarjeta">' + redondeo + margenes + "</div></section>" + (chico ? "" : ultimos) + "</div>" +
        '<div class="col">' +
          '<section class="grupo"><h2 class="grupo-titulo">Negocio</h2><div class="tarjeta">' + zona + "</div></section>" +
          '<section class="grupo"><h2 class="grupo-titulo">Acceso</h2><div class="tarjeta">' + sinUso + tope + vinculo + "</div></section>" +
          (chico ? ultimos : "") +
        "</div>" +
      "</div>";

    window.pintarIconos(lienzo);
    // La ficha blanca de cada grupo se desliza al elegido (transform)
    $$("[data-grupo]", lienzo).forEach(function (g) {
      var on = $('[aria-checked="true"]', g), f = $(".ficha", g);
      if (!on || !f) return;
      f.style.width = on.offsetWidth + "px";
      var x = on.offsetLeft;
      var prev = g.getAttribute("data-grupo") + "-x";
      var px = fichas[prev];
      if (px !== undefined && px !== x && AS.animando()) {
        f.style.transition = "none"; f.style.transform = "translateX(" + px + "px)";
        void f.offsetWidth; f.style.transition = "";
      }
      f.style.transform = "translateX(" + x + "px)";
      fichas[prev] = x;
    });
    // Los márgenes se reordenan solos: cada caja vuela a su lugar nuevo (FLIP)
    if (AS.animando()) $$(".margen[data-v]", lienzo).forEach(function (m) {
      var r0 = antes[m.getAttribute("data-v")]; if (!r0) return;
      var r1 = m.getBoundingClientRect(), dx = r0.left - r1.left;
      if (!dx) return;
      m.style.transition = "none"; m.style.transform = "translateX(" + dx + "px)";
      requestAnimationFrame(function () { m.style.transition = "transform 320ms cubic-bezier(.34,1.4,.64,1)"; m.style.transform = ""; });
    });
    if (foco) { var f = $('[data-foco="' + foco + '"]', lienzo); if (f) f.focus(); }
  }
  var fichas = {};
  AS.alPintar(pintar);

  /* ---------- Lo que se toca ---------- */
  lienzo.addEventListener("click", function (e) {
    var b = e.target.closest("[data-grupo] button");
    if (b && AS.puede()) {
      var clave = b.parentNode.getAttribute("data-grupo"), v = +b.getAttribute("data-v");
      if (clave === "redondeo") { vistaPaso = null; AS.pedirRedondeo(v); }
      else AS.guardar(clave, v);
      return;
    }
    var d = e.target.closest("[data-dias]");
    if (d && AS.puede()) {
      var base = diasPend !== null ? diasPend : S.vinculo;
      diasPend = Math.max(1, Math.min(365, base + +d.getAttribute("data-dias")));
      var inp = $("[data-foco=dias]", lienzo); inp.value = diasPend;
      inp.classList.remove("rueda", "baja"); void inp.offsetWidth; inp.classList.add("rueda"); if (+d.getAttribute("data-dias") < 0) inp.classList.add("baja");
      clearTimeout(diasTimer);
      diasTimer = setTimeout(function () { var v = diasPend; diasPend = null; AS.cambiarDias(String(v)); }, 700);
    }
  });
  // Mirar un paso con el mouse muestra cómo quedarían los precios, sin guardar
  lienzo.addEventListener("mouseover", function (e) {
    var b = e.target.closest('[data-grupo="redondeo"] button'); if (!b || AS.chico()) return;
    var v = +b.getAttribute("data-v"); if (v === vistaPaso) return;
    vistaPaso = v; var a = $("[data-asi]", lienzo); a.innerHTML = asi(v); window.pintarIconos(a);
  });
  lienzo.addEventListener("mouseout", function (e) {
    var g = e.target.closest('[data-grupo="redondeo"]'); if (!g || g.contains(e.relatedTarget)) return;
    vistaPaso = null; var a = $("[data-asi]", lienzo); if (a) { a.innerHTML = asi(null); window.pintarIconos(a); }
  });
  lienzo.addEventListener("focusin", function (e) {
    if (e.target.matches(".margen input")) { e.target.select(); }
  });
  function guardarCampo(inp) {
    if (!AS.puede()) return;
    if (inp.matches(".margen input")) {
      var i = +inp.getAttribute("data-i");
      var err = AS.cambiarMargen(i, inp.value);
      if (err) { var c = $(".margen.mal", lienzo); AS.temblar(c); }
    }
    if (inp.matches("[data-foco=dias]")) { clearTimeout(diasTimer); diasPend = null; var e2 = AS.validarDias(inp.value); if (e2) { AS.cambiarDias(inp.value); AS.temblar($(".dias", lienzo)); } else if (+inp.value !== S.vinculo) AS.cambiarDias(inp.value); }
  }
  lienzo.addEventListener("keydown", function (e) {
    var g = e.target.closest("[data-grupo]");
    if (g && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      var bs = $$("button", g), i = bs.indexOf(e.target), n = bs[(i + (e.key === "ArrowRight" ? 1 : -1) + bs.length) % bs.length];
      bs.forEach(function (b) { b.tabIndex = -1; }); n.tabIndex = 0; n.focus();
      if (g.getAttribute("data-grupo") === "redondeo") { vistaPaso = +n.getAttribute("data-v"); var a = $("[data-asi]", lienzo); a.innerHTML = asi(vistaPaso); window.pintarIconos(a); }
    }
    if (e.target.tagName === "INPUT" && e.key === "Enter") { e.preventDefault(); e.target.blur(); }
    if (e.target.tagName === "INPUT" && e.key === "Escape") { delete AS.notas.margenes; delete AS.notas.vinculo; e.target.blur(); }
    if (e.target.matches("[data-foco=dias]") && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); $('[data-dias="' + (e.key === "ArrowUp" ? 1 : -1) + '"]', lienzo).click(); }
  });
  lienzo.addEventListener("focusout", function (e) {
    if (e.target.tagName !== "INPUT") return;
    var inp = e.target;
    setTimeout(function () { if (document.contains(inp)) guardarCampo(inp); else guardarCampo(inp); }, 0);
  });

  AS.teclas({
    r: '[data-grupo="redondeo"] [tabindex="0"]',
    m: "[data-foco=m0]",
    s: '[data-grupo="sinUso"] [tabindex="0"]',
    t: '[data-grupo="tope"] [tabindex="0"]',
    v: "[data-foco=dias]"
  });
};
