/* Maqueta final, sobre la variante 2 · Probar antes de elegir. Pinta la lista (computadora), las
   tiras (celular) y el escenario del ajuste elegido con el estado de AS (settings.js). */
window.AS_VARIANTE = function () {
  "use strict";
  var AS = window.AS, S = AS.S, $ = AS.$, $$ = AS.$$;
  var lienzo = $("#lienzo");
  var ESC = ["redondeo", "margenes", "zona", "sesion", "vinculo"];
  var GRUPO = { redondeo: "Precios", margenes: "Precios", zona: "Negocio", sesion: "Acceso", vinculo: "Acceso" };
  var actual = "redondeo", dir = "", mira = null, diasMira = null;
  var MESES = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
  var COSTO = 4000;

  function fecha(dias) { var d = new Date(2026, 10, 7); d.setDate(d.getDate() + dias); return d.getDate() + " " + MESES[d.getMonth()] + (d.getFullYear() !== 2026 ? " " + d.getFullYear() : ""); }
  function nota(clave) {
    var n = AS.notas[clave]; if (!n) return "";
    return '<div class="nota ' + n.tipo + '" role="alert"><i class="i" data-i="' + (n.tipo === "otro" ? "users" : "triangle-alert") + '"></i><span>' + n.txt + "</span></div>";
  }
  function escDe(clave) { return clave === "sinUso" || clave === "tope" ? "sesion" : clave; }

  /* ---------- La lista (computadora) y las tiras (celular) ---------- */
  function item(clave, ico, nombre, valor, tecla) {
    var sel = escDe(clave) === actual;
    return '<button type="button" class="it" role="tab" aria-selected="' + sel + '" data-esc="' + escDe(clave) + '" data-foco="it-' + clave + '" data-ajuste="' + clave + '">' +
      '<span class="kbd">' + tecla + '</span><span class="it-ico"><i class="i" data-i="' + ico + '"></i></span><span class="it-nom">' + nombre + '</span><span class="it-val">' + valor + "</span></button>";
  }
  function lista() {
    return '<nav class="v2-lista" role="tablist" aria-label="Ajustes" aria-orientation="vertical">' +
      '<div class="v2-grupo"><h2>Precios</h2><div class="tarjeta">' + item("redondeo", "calculator", "Redondeo", AS.fmt("redondeo"), "R") + item("margenes", "percent", "Márgenes rápidos", S.margenes.length + " teclas", "M") + "</div></div>" +
      '<div class="v2-grupo"><h2>Negocio</h2><div class="tarjeta">' + item("zona", "globe", "Zona horaria", '<span data-hora>' + AS.hora() + "</span>", "Z") + "</div></div>" +
      '<div class="v2-grupo"><h2>Acceso</h2><div class="tarjeta">' + item("sinUso", "hourglass", "Sin uso", AS.fmt("sinUso"), "S") + item("tope", "timer", "Tope de la sesión", AS.fmt("tope"), "T") + item("vinculo", "link", "Días del vínculo", AS.fmt("vinculo"), "V") + "</div></div>" +
      (AS.puede() ? '<div class="v2-pista"><i class="i i-s" data-i="mouse-pointer-2"></i>Pasá por una opción para ver su efecto</div>' : "") +
      "</nav>";
  }
  function tiras() {
    var t = [["redondeo", "Redondeo", AS.fmt("redondeo"), "redondeo"], ["margenes", "Márgenes", S.margenes[0] + " a " + S.margenes[4] + " %", "margenes"], ["zona", "Hora", "<span data-hora>" + AS.hora() + "</span>", "zona"], ["sesion", "Sesión", S.sinUso + " min · " + S.tope + " h", "sinUso tope"], ["vinculo", "Vínculo", AS.fmt("vinculo"), "vinculo"]];
    return '<div class="v2-tiras" role="tablist" aria-label="Ajustes">' + t.map(function (x) { return '<button type="button" class="tira" role="tab" aria-selected="' + (x[0] === actual) + '" data-esc="' + x[0] + '" data-ajuste="' + x[3] + '"><span class="n">' + x[1] + '</span><span class="v">' + x[2] + "</span></button>"; }).join("") + "</div>";
  }

  /* ---------- Los escenarios ---------- */
  function cab(ico, titulo, sub, et, va, ver) {
    return '<div class="esc-grupo">' + GRUPO[actual] + '</div><div class="esc-cab"><div><div class="t-seccion"><i class="i" data-i="' + ico + '"></i>' + titulo + '<i class="i i-s candado" data-i="lock-keyhole"></i></div><p class="esc-sub">' + sub + '</p></div>' +
      (et ? '<div class="grande"><div class="et">' + et + '</div><div class="va' + (ver ? " ver" : "") + '">' + va + "</div></div>" : "") + "</div>";
  }
  function opciones(clave, ops, txt, efecto, clase) {
    return '<div class="opciones ' + (clase || "") + '" role="radiogroup" aria-label="' + AS.NOMBRE[clave] + '" data-grupo="' + clave + '" data-toca>' + ops.map(function (v) {
      var on = S[clave] === v, ef = efecto(v);
      return '<button type="button" class="op' + (mira && mira.clave === clave && mira.v === v ? " mirando" : "") + '" role="radio" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-v="' + v + '" data-foco="' + clave + "-" + v + '">' +
        (AS.ARRANQUE[clave] === v ? '<span class="arranque">de arranque</span>' : "") + '<span class="v">' + txt(v) + '</span><span class="e' + (ef.sube ? " sube" : "") + '">' + ef.t + "</span></button>";
    }).join("") + "</div>";
  }

  function escRedondeo() {
    var paso = mira && mira.clave === "redondeo" ? mira.v : S.redondeo, ver = paso !== S.redondeo, n = AS.cambian(paso);
    return cab("calculator", "Redondeo para arriba", AS.QUE.redondeo + ". Un precio escrito a mano no se toca.",
        ver ? "Si elegís " + AS.fmt("redondeo", paso) : "Con " + AS.fmt("redondeo"), ver ? (n ? "Cambian " + AS.miles(n) : "No cambia ninguno") : AS.miles(AS.TOTAL_PRECIOS) + " precios", ver) +
      "<h3>Elegí el paso · debajo, cuántos precios cambian</h3>" +
      opciones("redondeo", AS.OPC.redondeo, function (v) { return v ? '<span class="peso">$</span>' + AS.miles(v) : "Sin"; }, function (v) { return v === S.redondeo ? { t: "Ahora" } : { t: AS.miles(AS.cambian(v)), sube: true }; }, "siete") + nota("redondeo") +
      "<h3>Así quedan " + (ver ? "con " + AS.fmt("redondeo", paso) : "hoy") + "</h3>" +
      '<div class="vidriera">' + AS.PRODUCTOS.map(function (p) {
        var hoy = AS.redondear(p.calc, S.redondeo), a = AS.redondear(p.calc, paso), cambia = ver && a !== hoy;
        return '<div class="prod' + (cambia ? " cambia" : "") + '"><span class="foto"><img src="../../../common/photos/' + p.foto + '.webp" alt=""></span><div><div class="nom">' + p.nom + '</div><div class="calc">Calculado ' + AS.plata(p.calc) + '</div></div><div class="precio"><span class="' + (cambia ? "rueda" + (a < hoy ? " baja" : "") : "") + '">' + AS.plata(a, true) + "</span></div></div>";
      }).join("") + "</div>";
  }
  function escMargenes() {
    var err = AS.notas.margenes && AS.notas.margenes.tipo === "error" ? AS.notas.margenes.i : -1;
    return cab("percent", "Márgenes rápidos", "Las teclas 1 a 5 al elegir el margen de un producto. Se ordenan solos; cambiarlos no toca ningún producto.") +
      '<h3>Tocá un número para cambiarlo</h3><div class="teclas" data-toca>' + S.margenes.map(function (m, i) {
        return '<label class="tecla-m' + (err === i ? " mal" : "") + '" data-v="' + m + '"><span class="n">' + (i + 1) + '</span><span class="campo-m"><input inputmode="numeric" value="' + AS.miles(m) + '" style="--largo:' + AS.miles(m).length + '" data-i="' + i + '" data-foco="m' + i + '" aria-label="Margen de la tecla ' + (i + 1) + '"' + (AS.puede() ? "" : " readonly") + '><span class="pc">%</span></span><span class="da">Vende a <b>' + AS.plata(AS.redondear(COSTO * (1 + m / 100), S.redondeo)) + "</b></span></label>";
      }).join("") + "</div>" + nota("margenes") +
      '<h3>Con qué se calcula</h3><div class="costo"><span class="foto"><img src="../../../common/photos/wall-plugs.webp" alt=""></span><div><div class="t-renglon">Tarugos nylon S8 con tope × 100</div><div class="t-detalle">Costo ' + AS.plata(COSTO) + " · redondeo " + AS.fmt("redondeo") + "</div></div></div>";
  }
  function escZona() {
    return cab("globe", "Zona horaria del negocio", "Se fijó al instalar y es la misma para todos. Define el día de las ventas y el cierre de caja.") +
      '<div class="reloj-negocio"><div><div class="t-etiqueta">Ahora en el negocio</div><div class="hora" data-hora>' + AS.hora() + '</div></div><div><div class="t-renglon">Buenos Aires · UTC −3</div><p class="t-detalle reloj-dice">Las ventas de hoy van de 0:00 a 23:59 de esta hora, vea quien vea la pantalla desde donde sea.</p><span class="pastilla contorno"><i class="i i-s" data-i="lock-keyhole"></i>Se cambia solo al instalar</span></div></div>';
  }
  function pos(h) { return (h - 8) / 24 * 100; }
  function escSesion() {
    var su = mira && mira.clave === "sinUso" ? mira.v : S.sinUso, to = mira && mira.clave === "tope" ? mira.v : S.tope;
    var vuelve = 13.5, deja = 12 + 10 / 60, cierraOcio = deja + su / 60, cortaOcio = cierraOcio < vuelve;
    var fin = 8 + to;
    var dice = cortaOcio ? "Se fue a almorzar a las 12:10: la sesión se cierra a las <b>" + AS.hhmm(Math.round(cierraOcio * 60)) + "</b> y a las 13:30 entra de nuevo." : "Se fue a almorzar a las 12:10 y volvió a las 13:30: <b>sigue adentro</b>.";
    var dice2 = fin <= 19.5 ? "Entró a las 8:00: a las <b>" + AS.hhmm(Math.round(fin * 60) % 1440) + "</b> entra de nuevo, aunque la esté usando." : "Entró a las 8:00: el tope llega a las " + AS.hhmm(Math.round(fin * 60) % 1440) + ", <b>después de cerrar</b>.";
    return cab("timer", "Tiempos de la sesión", "Valen desde ese momento para todas las sesiones, también las abiertas, y para todos los roles.") +
      '<div class="dos"><div><h3><i class="i i-s" data-i="hourglass"></i>Sin uso <span class="kbd">S</span></h3><p class="que-cambia">' + AS.QUE.sinUso + '</p>' +
      opciones("sinUso", AS.OPC.sinUso, function (v) { return v + " min"; }, function (v) { return { t: v === S.sinUso ? "Ahora" : v < S.sinUso ? "Más corto" : "Más largo" }; }) + nota("sinUso") + "</div>" +
      '<div><h3><i class="i i-s" data-i="timer"></i>Tope desde que entró <span class="kbd">T</span></h3><p class="que-cambia">' + AS.QUE.tope + '</p>' +
      opciones("tope", AS.OPC.tope, function (v) { return v + " h"; }, function (v) { return { t: v === S.tope ? "Ahora" : "a las " + AS.hhmm(((8 + v) * 60) % 1440) }; }) + nota("tope") + "</div></div>" +
      "<h3>Un día en el mostrador</h3>" +
      '<div class="jornada"><div class="j-pista"><div class="j-eje">' +
        '<span class="j-tope" style="transform:scaleX(' + (to / 24) + ')"></span>' +
        '<span class="j-tramo" style="left:0;width:' + pos(deja) + '%"></span>' +
        '<span class="j-tramo" style="left:' + pos(vuelve) + "%;width:" + (pos(19.5) - pos(vuelve)) + '%"></span>' +
        '<span class="j-ocio" style="left:' + pos(deja) + '%;width:100%;transform:scaleX(' + ((Math.min(cierraOcio, vuelve) - deja) / 24) + ')"></span>' +
      "</div>" +
      '<span class="j-marca ocio" style="transform:translateX(' + pos(Math.min(cierraOcio, vuelve)) + '%);opacity:' + (cortaOcio ? 1 : 0) + '"><span>Se cierra</span></span>' +
      '<span class="j-marca fin" style="transform:translateX(' + Math.min(pos(fin), 100) + '%)"><span>Tope</span></span></div>' +
      '<div class="j-horas"><span>8:00</span><span>14:00</span><span>20:00</span><span>2:00</span><span>8:00</span></div>' +
      '<div class="j-dice"><div><span class="pt urgente"></span><span>' + dice + '</span></div><div><span class="pt error"></span><span>' + dice2 + "</span></div></div></div>";
  }
  function escVinculo() {
    var d = diasMira !== null ? diasMira : S.vinculo, semanas = 54, chico = AS.chico();
    var celdas = "";
    for (var i = 0; i < semanas; i++) { var cls = i === 0 ? "hoy" : i * 7 < d && (i + 1) * 7 <= d ? "vive" : i * 7 < d ? "vence" : ""; if (Math.floor(d / 7) === i && i) cls = "vence"; celdas += '<i class="' + cls + '"></i>'; }
    var mal = AS.notas.vinculo && AS.notas.vinculo.tipo === "error";
    return cab("link", "Días del vínculo", AS.QUE.vinculo + " (celular y computadora). Vale para todos los vínculos, también los que ya existen.", "Si hoy se espejan por última vez, vence el", fecha(d), d !== S.vinculo) +
      '<h3>Cuántos días</h3><div class="v2-dias" data-toca><span class="campo-dias' + (mal ? " mal" : "") + '"><input inputmode="numeric" value="' + d + '" data-foco="dias" aria-label="Días del vínculo"' + (AS.puede() ? "" : " readonly") + '><span class="t-etiqueta">días</span></span>' +
      '<div class="chips">' + [7, 15, 30, 90, 365].map(function (n) { return '<button type="button" class="chip' + (S.vinculo === n ? " elegido" : "") + '" data-dias="' + n + '">' + n + "</button>"; }).join("") + "</div></div>" + nota("vinculo") +
      '<input type="range" class="deslizador" min="1" max="365" value="' + d + '" aria-label="Días del vínculo" data-toca data-foco="rango"' + (AS.puede() ? "" : " disabled") + ">" +
      '<div class="cal" aria-hidden="true">' + celdas + '</div><div class="cal-pie"><span>Hoy, 7 nov.</span><span>Cada cuadrito, una semana</span><span>' + fecha(chico ? 182 : 378) + "</span></div>" +
      '<div class="j-dice"><div><span class="pt logro"></span><span>El celu del depósito y la compu del mostrador se espejaron hace 20 días: ' + (d > 20 ? "siguen vinculados hasta el <b>" + fecha(d - 20) + "</b>." : "<b>se desvinculan</b> en su próximo contacto, como si hubiera vencido.") + "</span></div></div>";
  }

  function escenario() {
    var f = { redondeo: escRedondeo, margenes: escMargenes, zona: escZona, sesion: escSesion, vinculo: escVinculo }[actual];
    var ix = ESC.indexOf(actual);
    return '<div class="escenario" role="tabpanel"><div class="esc ' + dir + '" data-esc-cont>' + f() + '</div><div class="v2-pie-celu" aria-hidden="true">' + ESC.map(function (e, i) { return '<i class="' + (i === ix ? "on" : "") + '"></i>'; }).join("") + "</div></div>";
  }

  function pintar() {
    var foco = document.activeElement && document.activeElement.getAttribute("data-foco");
    var antes = {};
    $$(".tecla-m[data-v]").forEach(function (m) { antes[m.getAttribute("data-v")] = m.getBoundingClientRect(); });
    lienzo.innerHTML =
      '<div class="aviso urgente sin-red"><i class="i" data-i="wifi-off"></i><span><span class="largo">Sin conexión: es lo último que se vio, hoy 10:41. Con conexión se puede cambiar.</span><span class="corto">Sin conexión · 10:41</span></span><button type="button" class="btn chico" data-reintentar data-tecla="r"><i class="i i-s" data-i="refresh-cw"></i>Reintentar<span class="kbd">R</span></button></div>' +
      '<div class="nunca"><span class="burbuja"><i class="i" data-i="cloud-off"></i></span><div class="t-seccion">Hace falta conexión</div><p class="t-detalle">Los ajustes están en el servidor y este dispositivo todavía no los vio.</p><button type="button" class="btn" data-reintentar data-tecla="r"><i class="i" data-i="refresh-cw"></i>Reintentar<span class="kbd">R</span></button></div>' +
      '<div class="del-servidor">' + lista() + tiras() + escenario() + "</div>";
    dir = "sin";
    window.pintarIconos(lienzo);
    var t = $('.tira[aria-selected="true"]', lienzo); if (t && t.parentNode.scrollTo) t.parentNode.scrollLeft = Math.max(0, t.offsetLeft - 16);
    if (AS.animando()) $$(".tecla-m[data-v]", lienzo).forEach(function (m) {
      var r0 = antes[m.getAttribute("data-v")]; if (!r0) return;
      var r1 = m.getBoundingClientRect(), dx = r0.left - r1.left, dy = r0.top - r1.top;
      if (!dx && !dy) return;
      m.style.transition = "none"; m.style.transform = "translate(" + dx + "px," + dy + "px)";
      requestAnimationFrame(function () { m.style.transition = "transform 320ms cubic-bezier(.34,1.4,.64,1)"; m.style.transform = ""; });
    });
    if (foco) { var f = $('[data-foco="' + foco + '"]', lienzo); if (f) f.focus(); }
  }
  AS.alPintar(pintar);
  var pintarBase = AS.pintar;

  function ir(esc, sentido) {
    if (esc === actual) return;
    dir = sentido || (ESC.indexOf(esc) > ESC.indexOf(actual) ? "desde-der" : "desde-izq");
    if (!AS.chico()) dir = "";
    actual = esc; mira = null; diasMira = null;
    pintarBase();
  }
  // Mirar una opción repinta solo el escenario
  function repintarEsc() {
    var c = $("[data-esc-cont]", lienzo); if (!c) return;
    var foco = document.activeElement && document.activeElement.getAttribute("data-foco");
    dir = "sin";
    c.innerHTML = { redondeo: escRedondeo, margenes: escMargenes, zona: escZona, sesion: escSesion, vinculo: escVinculo }[actual]();
    c.className = "esc sin";
    window.pintarIconos(c);
    if (foco) { var f = $('[data-foco="' + foco + '"]', lienzo); if (f) f.focus(); }
  }

  /* ---------- Lo que se toca ---------- */
  lienzo.addEventListener("click", function (e) {
    var s = e.target.closest("[data-esc]"); if (s) { ir(s.getAttribute("data-esc")); return; }
    var b = e.target.closest("[data-grupo] .op");
    if (b && AS.puede()) {
      var clave = b.parentNode.getAttribute("data-grupo"), v = +b.getAttribute("data-v"); mira = null;
      if (clave === "redondeo") AS.pedirRedondeo(v); else AS.guardar(clave, v);
      return;
    }
    var d = e.target.closest("[data-dias]"); if (d && AS.puede()) { diasMira = null; AS.cambiarDias(d.getAttribute("data-dias")); }
  });
  lienzo.addEventListener("mouseover", function (e) {
    var b = e.target.closest("[data-grupo] .op"); if (!b || AS.chico()) return;
    var m = { clave: b.parentNode.getAttribute("data-grupo"), v: +b.getAttribute("data-v") };
    if (mira && mira.clave === m.clave && mira.v === m.v) return;
    mira = m; repintarEsc();
  });
  lienzo.addEventListener("mouseout", function (e) {
    var g = e.target.closest("[data-grupo]"); if (!g || !mira || g.contains(e.relatedTarget)) return;
    var r = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest("[data-grupo] .op"); if (r) return;
    mira = null; repintarEsc();
  });
  lienzo.addEventListener("input", function (e) {
    if (e.target.matches(".tecla-m input")) e.target.style.setProperty("--largo", Math.max(1, e.target.value.length));
    if (e.target.matches("[data-foco=rango]")) {
      diasMira = +e.target.value;
      var c = $("[data-esc-cont]", lienzo), val = e.target.value;
      repintarEsc();
      var r = $("[data-foco=rango]", lienzo); if (r) { r.value = val; r.focus(); }
    }
  });
  lienzo.addEventListener("change", function (e) {
    if (e.target.matches("[data-foco=rango]") && AS.puede()) { var v = e.target.value; diasMira = null; AS.cambiarDias(v); }
  });
  lienzo.addEventListener("focusin", function (e) { if (e.target.matches(".tecla-m input, .campo-dias input")) e.target.select(); });
  lienzo.addEventListener("focusout", function (e) {
    var inp = e.target; if (inp.tagName !== "INPUT" || !AS.puede() || inp.type === "range") return;
    setTimeout(function () {
      if (inp.matches(".tecla-m input")) { if (AS.cambiarMargen(+inp.getAttribute("data-i"), inp.value)) AS.temblar($(".tecla-m.mal", lienzo)); }
      else if (inp.matches(".campo-dias input")) { diasMira = null; if (+inp.value !== S.vinculo || AS.validarDias(inp.value)) { if (AS.cambiarDias(inp.value)) AS.temblar($(".campo-dias", lienzo)); } }
    }, 0);
  });
  lienzo.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT" && e.key === "Enter") { e.preventDefault(); e.target.blur(); return; }
    var it = e.target.closest(".it");
    if (it && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault(); var its = $$(".it", lienzo), i = its.indexOf(it), n = its[(i + (e.key === "ArrowDown" ? 1 : -1) + its.length) % its.length];
      var foco = n.getAttribute("data-foco"); ir(n.getAttribute("data-esc")); var f = $('[data-foco="' + foco + '"]', lienzo); if (f) f.focus(); return;
    }
    if (it && e.key === "ArrowRight") { e.preventDefault(); var p = $('[data-esc-cont] [tabindex="0"], [data-esc-cont] input', lienzo); if (p) p.focus(); return; }
    var g = e.target.closest("[data-grupo]");
    if (g && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      var bs = $$(".op", g), k = bs.indexOf(e.target), nb = bs[(k + (e.key === "ArrowRight" ? 1 : -1) + bs.length) % bs.length];
      mira = { clave: g.getAttribute("data-grupo"), v: +nb.getAttribute("data-v") };
      var fo = nb.getAttribute("data-foco"); repintarEsc();
      var x = $('[data-foco="' + fo + '"]', lienzo); if (x) { $$(".op", x.parentNode).forEach(function (o) { o.tabIndex = -1; }); x.tabIndex = 0; x.focus(); }
    }
  });
  // Celular: deslizar el escenario pasa al ajuste de al lado
  var x0 = null, y0 = null;
  lienzo.addEventListener("touchstart", function (e) { if (!e.target.closest(".escenario") || e.target.closest("input")) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  lienzo.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    var i = ESC.indexOf(actual) + (dx < 0 ? 1 : -1); if (i < 0 || i >= ESC.length) return;
    ir(ESC[i], dx < 0 ? "desde-der" : "desde-izq"); AS.vibrar(8);
  }, { passive: true });

  function irYEnfocar(clave) { ir(escDe(clave)); var f = $('[data-foco="it-' + clave + '"]', lienzo); if (f) f.focus(); }
  AS.teclas({
    r: function () { irYEnfocar("redondeo"); }, m: function () { irYEnfocar("margenes"); }, z: function () { irYEnfocar("zona"); },
    s: function () { irYEnfocar("sinUso"); var f = $('[data-grupo="sinUso"] [tabindex="0"]', lienzo); if (f) f.focus(); },
    t: function () { irYEnfocar("tope"); var f = $('[data-grupo="tope"] [tabindex="0"]', lienzo); if (f) f.focus(); },
    v: function () { irYEnfocar("vinculo"); }
  });
  // Lo que cambia otro (R2.3) o un error se ve en su escenario
  var guardar = AS.guardar;
  AS.guardar = function (clave, v, op) { var r = guardar(clave, v, op); if (r === "otro" && escDe(clave) !== actual) ir(escDe(clave)); return r; };
};
