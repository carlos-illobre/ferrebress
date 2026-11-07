/* Variante 3 · El ticket de la casa. Pinta el ticket con el estado de AS y entiende órdenes
   escritas o dichas («vínculo 15 días», «margen 100 por 150»). */
window.AS_VARIANTE = function () {
  "use strict";
  var AS = window.AS, S = AS.S, $ = AS.$, $$ = AS.$$;
  var lienzo = $("#lienzo");
  var abierto = null, respuesta = { txt: "", tipo: "" };

  /* ---------- El esqueleto (se arma una vez) ---------- */
  var barras = (function () { var x = 0, r = "", w = [2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 2, 1, 4, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 3, 2, 1, 1, 2, 1, 3, 1, 2, 2, 1, 1, 3, 1, 2]; w.forEach(function (n, i) { if (i % 2 === 0) r += '<rect x="' + x + '" y="0" width="' + n * 2 + '" height="40" fill="#1A1D1B"/>'; x += n * 2 + 1; }); return '<svg class="barras" viewBox="0 0 ' + x + ' 40" preserveAspectRatio="none" aria-hidden="true">' + r + "</svg>"; })();
  lienzo.innerHTML =
    '<div class="v3-celu-cab"><button type="button" class="volver" data-ir="more"><i class="i" data-i="chevron-left"></i>Más</button><span class="para-todos"><i class="i i-s" data-i="users"></i>Vale para todos</span></div>' +
    '<div class="nunca"><span class="burbuja"><i class="i" data-i="cloud-off"></i></span><div class="t-seccion">Hace falta conexión</div><p class="t-detalle" style="margin:0;max-width:360px">Las reglas de la casa están en el servidor y este dispositivo todavía no las vio.</p><button type="button" class="btn" data-reintentar><i class="i" data-i="refresh-cw"></i>Reintentar</button></div>' +
    '<div class="v3-izq">' +
      '<div class="titulo-izq"><nav class="migas t-detalle" aria-label="Dónde estoy"><button type="button" data-ir="more" style="padding:0;border:0;background:none;color:var(--pino-texto);font-weight:700;font-size:14px">Más</button><i class="i i-s" data-i="chevron-right"></i><span>Administración</span></nav>' +
      '<h1>Reglas de la casa</h1><p class="bajada">Lo que se fija acá lo cumplen todos los dispositivos. Tocá un valor del ticket, o decí qué cambiar.</p></div>' +
      '<div class="permiso" data-permiso hidden></div>' +
      '<div class="aviso urgente sin-red"><i class="i" data-i="wifi-off"></i><span>Sin conexión: el ticket es el de hoy 10:41.</span><button type="button" class="btn chico" data-reintentar><i class="i i-s" data-i="refresh-cw"></i>Reintentar</button></div>' +
      '<label class="orden"><i class="i" data-i="sparkles"></i><input data-orden placeholder="Decí qué cambiar" aria-label="Qué cambiar" autocomplete="off"><span class="ondas" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b></span><span class="oyendo-txt">Te escucho…</span><span class="kbd siempre solo-compu" data-kbd-orden>/</span><button type="button" class="mic" data-mic aria-label="Decirlo con la voz"><i class="i" data-i="mic"></i></button></label>' +
      '<div class="respuesta" data-respuesta role="status"></div>' +
      '<div class="ideas"><button type="button" class="idea" data-idea="sin uso 30 minutos">sin uso 30 min</button><button type="button" class="idea" data-idea="vínculo 15 días">vínculo 15 días</button><button type="button" class="idea" data-idea="margen 100 por 150">margen 100 por 150</button><button type="button" class="idea" data-idea="redondeo 500">redondeo 500</button><button type="button" class="idea" data-idea="deshacer">deshacer</button></div>' +
      '<div class="atajos"><span class="kbd">/</span><span>Escribir una orden</span><span class="kbd">Alt R · S · T · V</span><span>Abrir un valor del ticket</span><span class="kbd">Ctrl Z</span><span>Deshacer lo último, durante 5 segundos</span></div>' +
    "</div>" +
    '<div class="rollo"><div class="ticket del-servidor" data-ticket></div></div>';
  window.pintarIconos(lienzo);
  var ticket = $("[data-ticket]", lienzo), rollo = $(".rollo", lienzo);

  /* ---------- El ticket ---------- */
  function linea(clave, nom, valor, expl, tecla, elegir) {
    var abre = abierto === clave;
    var n = AS.notas[clave];
    return '<div class="linea' + (abre ? " abierta" : "") + '" data-ajuste="' + clave + '"><div class="linea-fila"><span class="nom">' + nom + '</span><span class="puntos"></span>' +
      (tecla ? '<span class="kbd">' + tecla + "</span>" : "") +
      (elegir ? '<button type="button" class="valor" data-abre="' + clave + '" aria-expanded="' + abre + '" data-foco="v-' + clave + '">' + valor + "</button>" : '<span class="valor">' + valor + "</span>") + "</div>" +
      '<div class="expl">' + expl + "</div>" +
      (n ? '<div class="nota ' + n.tipo + '" role="alert"><i class="i" data-i="' + (n.tipo === "otro" ? "users" : "triangle-alert") + '"></i><span>' + n.txt + "</span></div>" : "") +
      (elegir ? '<div class="abre"><div><div class="elegir">' + (abre ? elegir() : "") + "</div></div></div>" : "") + "</div>";
  }
  function chips(clave, ops, txt, extra) {
    return ops.map(function (v) { return '<button type="button" class="chip' + (S[clave] === v ? " elegido" : "") + '" data-elige="' + clave + '" data-v="' + v + '" data-foco="c-' + clave + "-" + v + '">' + txt(v) + (extra ? extra(v) : "") + "</button>"; }).join("");
  }
  function cinta() {
    return AS.historial.slice(0, 5).reverse().map(function (h) {
      var MES = { "ene.": 1, "feb.": 2, "mar.": 3, "abr.": 4, "may.": 5, "jun.": 6, "jul.": 7, "ago.": 8, "sep.": 9, "oct.": 10, "nov.": 11, "dic.": 12 };
      var pz = h.cuando.split(" "), hora = pz[0] === "hoy" ? pz[1] : pz[0] === "ayer" ? "ayer" : pz[0] + "/" + MES[pz[1]];
      var vivo = h.desh && Date.now() < h.hasta;
      return '<div class="imp' + (h.nuevo ? " nuevo" : "") + (h.quien === AS.otro.nombre && h.nuevo ? " otro" : "") + '"><span class="h">' + hora + '</span><span class="q"><b>' + AS.NOMBRE[h.clave] + "</b> <s>" + h.de + "</s> → " + h.a + "<small>" + h.quien + (h.extra ? " · " + h.extra : "") + "</small></span>" +
        (vivo ? '<button type="button" class="desh" data-desh><i class="i" data-i="undo-2"></i>Deshacer</button>' : "<span></span>") + "</div>";
    }).join("");
  }
  function pintar() {
    var foco = document.activeElement && document.activeElement.getAttribute("data-foco");
    var err = AS.notas.margenes && AS.notas.margenes.tipo === "error" ? AS.notas.margenes.i : -1;
    ticket.innerHTML =
      '<div class="sello">Solo para ver<br>Falta «Cambiar los ajustes»</div><div class="sello sello-red">Sin conexión<br>Visto 10:41</div>' +
      '<div class="t-cab"><img src="../../../../common/brand/logo-on-light.png" alt="Ferrebress"><div class="nombre">REGLAS DE LA CASA</div><div class="sub">Valen para todos · <span data-hora>' + AS.hora() + '</span> en Buenos Aires</div></div>' +
      '<hr class="corte"><div class="t-sec">PRECIOS</div>' +
      linea("redondeo", "Redondeo para arriba", AS.fmt("redondeo"), "Al múltiplo siguiente: " + AS.plata(15001) + " → " + AS.plata(AS.redondear(15001, S.redondeo)) + ". El precio a mano no se toca.", "R",
        function () { return chips("redondeo", AS.OPC.redondeo, function (v) { return v ? AS.plata(v) : "Sin"; }, function (v) { return v === S.redondeo ? "" : '<span class="e">' + AS.miles(AS.cambian(v)) + "</span>"; }) + '<div class="expl" style="width:100%">En naranja, cuántos precios cambian. Se confirma antes.</div>'; }) +
      '<div class="linea" data-ajuste="margenes"><div class="linea-fila"><span class="nom">Márgenes rápidos</span><span class="puntos"></span><span class="kbd">M</span><span class="valor">teclas 1 a 5</span></div>' +
        '<div class="teclas-t" data-toca>' + S.margenes.map(function (m, i) { return '<label class="tk' + (err === i ? " mal" : "") + '" data-v="' + m + '"><span class="n">' + (i + 1) + '</span><input inputmode="numeric" value="' + m + '" data-i="' + i + '" data-foco="m' + i + '" aria-label="Margen de la tecla ' + (i + 1) + ', en por ciento"' + (AS.puede() ? "" : " readonly") + "></label>"; }).join("") + "</div>" +
        '<div class="expl">En %, de mayor a menor. Cambiarlos no toca ningún producto.</div>' +
        (AS.notas.margenes ? '<div class="nota ' + AS.notas.margenes.tipo + '" role="alert"><i class="i" data-i="triangle-alert"></i><span>' + AS.notas.margenes.txt + "</span></div>" : "") + "</div>" +
      '<hr class="corte"><div class="t-sec">NEGOCIO</div>' +
      linea("zona", "Zona horaria", 'Buenos Aires <i class="i" data-i="lock-keyhole"></i>', "Se fijó al instalar: el día de las ventas y el cierre de caja.", "") +
      '<hr class="corte"><div class="t-sec">ACCESO</div>' +
      linea("sinUso", "Sin uso", AS.fmtLargo("sinUso"), "Sin usarla, la sesión se cierra.", "S", function () { return chips("sinUso", AS.OPC.sinUso, function (v) { return v + " min"; }); }) +
      linea("tope", "Tope de la sesión", AS.fmtLargo("tope"), "Desde que se entró, para todas las sesiones y todos los roles.", "T", function () { return chips("tope", AS.OPC.tope, function (v) { return v + " h"; }); }) +
      linea("vinculo", "Días del vínculo", AS.fmt("vinculo"), "Celular y computadora, sin estar en espejo.", "V", function () {
        var mal = AS.notas.vinculo && AS.notas.vinculo.tipo === "error";
        return '<input inputmode="numeric" value="' + S.vinculo + '" data-dias-t data-foco="dias"' + (mal ? ' class="mal"' : "") + ' aria-label="Días del vínculo, de 1 a 365">' + [7, 15, 30, 90, 365].map(function (n) { return '<button type="button" class="chip' + (S.vinculo === n ? " elegido" : "") + '" data-elige="vinculo" data-v="' + n + '">' + n + "</button>"; }).join("");
      }) +
      '<hr class="corte"><div class="t-sec">CAMBIOS</div><div class="cinta" data-cinta>' + cinta() + "</div>" +
      '<hr class="corte"><div class="pie-t">' + barras + '<span>Todo cambio queda en <button type="button" data-ir="audit-log" style="border:0;background:none;padding:0;color:var(--pino-texto);font-weight:750">Quién hizo qué</button></span></div>';
    AS.historial.forEach(function (h) { h.nuevo = false; });
    window.pintarIconos(ticket);
    var r = $("[data-respuesta]", lienzo); r.className = "respuesta " + respuesta.tipo; r.innerHTML = respuesta.txt; window.pintarIconos(r);
    if (foco) { var f = $('[data-foco="' + foco + '"]', lienzo); if (f) f.focus(); }
  }
  AS.alPintar(pintar);
  function alPie() { if (AS.chico()) return; rollo.scrollTo({ top: rollo.scrollHeight, behavior: AS.animando() ? "smooth" : "auto" }); }

  // El «Deshacer» va impreso en la línea del cambio (en la computadora); en el celular, abajo
  var tostadaBase = AS.tostada;
  AS.tostada = function (texto, op) {
    if (op && op.deshacer && !AS.chico()) {
      var h = AS.historial[0]; h.desh = op.deshacer; h.hasta = Date.now() + 5000;
      var c = $("[data-cinta]", lienzo); if (c) { c.innerHTML = cinta(); c.lastElementChild && c.lastElementChild.classList.add("nuevo"); window.pintarIconos(c); }
      alPie();
      setTimeout(function () { h.desh = null; var c2 = $("[data-cinta]", lienzo); if (c2) { c2.innerHTML = cinta(); window.pintarIconos(c2); } }, 5000);
      return;
    }
    tostadaBase(texto, op);
  };
  function deshacerUltimo() {
    var h = AS.historial.filter(function (x) { return x.desh && Date.now() < x.hasta; })[0];
    if (!h) return false;
    var f = h.desh; h.desh = null; f(); return true;
  }

  /* ---------- Las órdenes ---------- */
  var PALABRAS = [["ciento veinte", 120], ["ciento cincuenta", 150], ["cinco mil", 5000], ["veinticuatro", 24], ["quinientos", 500], ["cincuenta", 50], ["sesenta", 60], ["noventa", 90], ["treinta", 30], ["quince", 15], ["cien", 100], ["mil", 1000], ["doce", 12], ["diez", 10], ["ocho", 8], ["siete", 7], ["cuatro", 4], ["una hora", 60], ["dos horas", 120], ["un dia", 1]];
  function limpiar(t) {
    t = t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\$/g, " ").replace(/(\d)\.(\d{3})/g, "$1$2");
    PALABRAS.forEach(function (p) { t = t.replace(new RegExp("\\b" + p[0] + "\\b", "g"), " " + p[1] + " "); });
    return t.replace(/\s+/g, " ").trim();
  }
  function decir(txt, tipo) { respuesta = { txt: (tipo === "mal" ? '<i class="i i-s" data-i="triangle-alert"></i>' : tipo === "bien" ? '<i class="i i-s" data-i="circle-check"></i>' : "") + "<span>" + txt + "</span>", tipo: tipo || "" }; var r = $("[data-respuesta]", lienzo); r.className = "respuesta " + respuesta.tipo; r.innerHTML = respuesta.txt; window.pintarIconos(r); }
  function resultado(r, clave) {
    if (r === "ok") { decir("Listo: " + AS.NOMBRE[clave] + " en " + AS.fmtLargo(clave) + ".", "bien"); alPie(); }
    else if (r === "otro") decir(AS.notas[clave].txt, "mal");
    else if (r === "nada") decir(AS.NOMBRE[clave] + " ya vale " + AS.fmtLargo(clave) + ".");
  }
  function orden(texto) {
    if (!texto.trim()) return;
    if (!AS.puede()) { decir("Para cambiar hace falta «Cambiar los ajustes».", "mal"); return; }
    var t = limpiar(texto), nums = (t.match(/\d+/g) || []).map(Number), n = nums[0];
    if (/deshac/.test(t)) { if (!deshacerUltimo()) decir("No hay nada para deshacer.", "mal"); else decir("Deshecho.", "bien"); return; }
    if (/zona|horari/.test(t)) { decir("La zona horaria se fija al instalar: desde acá no se cambia.", "mal"); return; }
    if (/redonde|paso/.test(t)) {
      var p = /\bsin\b/.test(t.replace(/redonde\w*/, "")) ? 0 : n;
      if (AS.OPC.redondeo.indexOf(p) < 0) { decir("Redondeo: sin, 10, 50, 100, 500, 1.000 o 5.000.", "mal"); return; }
      if (p === S.redondeo) { decir("El redondeo ya está en " + AS.fmt("redondeo") + "."); return; }
      decir("Mirá cuántos precios cambian y confirmá.");
      AS.pedirRedondeo(p); return;
    }
    if (/margen/.test(t)) {
      var m = t.match(/(\d+)\s*(?:%|por ciento)?\s*(?:por|a|->)\s*(\d+)/);
      if (!m) { decir("Decí cuál cambiás: «margen 100 por 150».", "mal"); return; }
      var i = S.margenes.indexOf(+m[1]);
      if (i < 0) { decir("No hay un margen rápido de " + m[1] + " %. Hoy son " + S.margenes.join(", ") + ".", "mal"); return; }
      var err = AS.cambiarMargen(i, m[2]);
      if (err) decir(err + ".", "mal"); else { decir("Listo: el " + m[1] + " ahora es " + m[2] + " %, tecla " + (S.margenes.indexOf(+m[2]) + 1) + ".", "bien"); alPie(); }
      return;
    }
    if (/sin uso|sin usar|inactiv|minut/.test(t)) {
      if (AS.OPC.sinUso.indexOf(n) < 0) { decir("Sin uso: 15, 30, 60 o 120 minutos.", "mal"); return; }
      resultado(AS.guardar("sinUso", n), "sinUso"); return;
    }
    if (/tope|hora|maximo/.test(t)) {
      if (AS.OPC.tope.indexOf(n) < 0) { decir("Tope: 4, 8, 12 o 24 horas.", "mal"); return; }
      resultado(AS.guardar("tope", n), "tope"); return;
    }
    if (/vincul|dia/.test(t)) {
      var e = AS.validarDias(n === undefined ? "" : String(n));
      if (e) { decir("Días del vínculo: " + e.toLowerCase() + ".", "mal"); return; }
      resultado(AS.guardar("vinculo", n), "vinculo"); return;
    }
    decir("No lo entendí. Probá con «vínculo 15 días» o «sin uso 30 minutos».", "mal");
  }

  /* ---------- Lo que se toca ---------- */
  var FRASES = ["sin uso treinta minutos", "vínculo quince días", "margen cien por ciento cincuenta"], frase = 0;
  lienzo.addEventListener("click", function (e) {
    var a = e.target.closest("[data-abre]");
    if (a) { abierto = abierto === a.getAttribute("data-abre") ? null : a.getAttribute("data-abre"); pintar(); var c = $(".abierta .chip.elegido, .abierta input", ticket); if (c && abierto) c.focus(); return; }
    var c2 = e.target.closest("[data-elige]");
    if (c2 && AS.puede()) {
      var clave = c2.getAttribute("data-elige"), v = +c2.getAttribute("data-v");
      if (clave === "redondeo") { AS.pedirRedondeo(v, function () { abierto = null; AS.pintar(); alPie(); }); return; }
      var r = AS.guardar(clave, v); if (r === "ok") { abierto = null; AS.pintar(); alPie(); }
      return;
    }
    if (e.target.closest("[data-desh]")) { deshacerUltimo(); return; }
    var idea = e.target.closest("[data-idea]");
    if (idea) { var inp = $("[data-orden]", lienzo); inp.value = idea.getAttribute("data-idea"); orden(inp.value); return; }
    var mic = e.target.closest("[data-mic]");
    if (mic && AS.puede()) {
      e.preventDefault();
      var izq = $(".v3-izq", lienzo); izq.classList.add("oyendo"); mic.classList.add("oye"); AS.vibrar(10);
      setTimeout(function () {
        izq.classList.remove("oyendo"); mic.classList.remove("oye");
        var f = FRASES[frase++ % FRASES.length], i2 = $("[data-orden]", lienzo); i2.value = f; orden(f);
      }, AS.animando() ? 1600 : 400);
    }
  });
  lienzo.addEventListener("keydown", function (e) {
    if (e.target.matches("[data-orden]") && e.key === "Enter") { e.preventDefault(); orden(e.target.value); e.target.select(); return; }
    if (e.target.matches("[data-dias-t]") && e.key === "Enter") { e.preventDefault(); var r = AS.cambiarDias(e.target.value); if (!r && !AS.notas.vinculo) { abierto = null; AS.pintar(); alPie(); } else AS.temblar($("[data-dias-t]", lienzo)); return; }
    if (e.target.matches(".tk input") && e.key === "Enter") { e.preventDefault(); e.target.blur(); return; }
    if (e.key === "Escape" && abierto) { var k = abierto; abierto = null; pintar(); var b = $('[data-foco="v-' + k + '"]', lienzo); if (b) b.focus(); }
  });
  lienzo.addEventListener("focusin", function (e) { if (e.target.matches(".tk input, [data-dias-t]")) e.target.select(); });
  lienzo.addEventListener("focusout", function (e) {
    var inp = e.target; if (!inp.matches || !inp.matches(".tk input") || !AS.puede()) return;
    setTimeout(function () { if (AS.cambiarMargen(+inp.getAttribute("data-i"), inp.value)) AS.temblar($(".tk.mal", lienzo)); else alPie(); }, 0);
  });
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !/INPUT/.test(document.activeElement.tagName)) { if (deshacerUltimo()) e.preventDefault(); return; }
    if (e.key === "/" && !/INPUT/.test(document.activeElement.tagName) && !AS.chico()) { e.preventDefault(); $("[data-orden]", lienzo).focus(); }
  });
  function abrir(k) { return function () { abierto = k; pintar(); var c = $(".abierta .chip.elegido, .abierta input", ticket); if (c) c.focus(); var l = $('[data-ajuste="' + k + '"]', ticket); if (l) l.scrollIntoView({ block: "nearest" }); }; }
  AS.teclas({ r: abrir("redondeo"), s: abrir("sinUso"), t: abrir("tope"), v: abrir("vinculo"), m: function () { $("[data-foco=m0]", lienzo).focus(); } });
};
