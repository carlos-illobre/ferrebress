/* Más → Administración · Ajustes para todos (06 · etapa a), maqueta final. El estado y lo común
   de la pantalla: guardar al cambiar con «Deshacer» 5 s (R2.1), el rango en el lugar (R2.2), «lo cambió
   otro» (R2.3), el redondeo con su confirmación (R3.4, R3.5), el permiso (R1.2, E05), sin conexión
   (R1.6, E06, E07), la hora del negocio (R5), las esperas (00 · R7) y los atajos con Alt (00 · R2).
   Nada consulta la red: los datos son de ejemplo. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mqCelu = window.matchMedia("(max-width: 899px)");
  var mqQuieto = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (/captura/.test(location.hash)) document.body.classList.add("captura");

  var PERSONAS = {
    admin: { nombre: "Rubén Paredes", corto: "Rubén", ini: "RP", rol: "Administrador" },
    vende: { nombre: "Marta Benítez", corto: "Marta", ini: "MB", rol: "Vendedora" }
  };
  var OTRO = { nombre: "Hugo Ferreyra", corto: "Hugo" }; // el otro Administrador (R2.3)

  function inicial() {
    return {
      redondeo: 1000, margenes: [300, 200, 100, 50, 25], sinUso: 60, tope: 8, vinculo: 30,
      quien: "admin", quitado: false, offline: false, nunca: false, conflicto: false, falla: false,
      hora: "24", anim: true
    };
  }
  function historialInicial() {
    return [
      { quien: "Hugo Ferreyra", clave: "vinculo", de: "15 días", a: "30 días", cuando: "ayer 18:20" },
      { quien: "Rubén Paredes", clave: "redondeo", de: "$ 500", a: "$ 1.000", cuando: "2 nov. 9:12", extra: "cambiaron 1.650 precios" },
      { quien: "Rubén Paredes", clave: "margenes", de: "300 · 200 · 100 · 50 · 30 %", a: "300 · 200 · 100 · 50 · 25 %", cuando: "28 oct. 11:47" }
    ];
  }

  var AS = window.AS = {
    $: $, $$: $$,
    S: inicial(),
    historial: historialInicial(),
    notas: {},
    OPC: { redondeo: [0, 10, 50, 100, 500, 1000, 5000], sinUso: [15, 30, 60, 120], tope: [4, 8, 12, 24] },
    ARRANQUE: { redondeo: 1000, margenes: [300, 200, 100, 50, 25], sinUso: 60, tope: 8, vinculo: 30 },
    NOMBRE: { redondeo: "Redondeo", margenes: "Márgenes rápidos", zona: "Zona horaria", sinUso: "Sin uso", tope: "Tope de la sesión", vinculo: "Días del vínculo" },
    QUE: {
      redondeo: "El precio que calcula el sistema sube al múltiplo siguiente",
      margenes: "Los cinco atajos para el margen de un producto, teclas 1 a 5",
      zona: "Se fijó al instalar: el día de las ventas y el cierre de caja",
      sinUso: "Sin usarla, la sesión se cierra pasado esto",
      tope: "Lo más que dura una sesión desde que se entró",
      vinculo: "Lo que dura el vínculo sin estar en espejo"
    },
    QUE_CORTO: {
      redondeo: "Al múltiplo siguiente", margenes: "Teclas 1 a 5", zona: "Se fija al instalar",
      sinUso: "Sin usarla, se cierra", tope: "Desde que se entró", vinculo: "Sin estar en espejo"
    },
    TOTAL_PRECIOS: 3486,
    // Cuántos precios cambian si se elige cada paso, desde el actual (los daría el servidor)
    CAMBIAN: { 0: 3412, 10: 3398, 50: 3120, 100: 2874, 500: 1650, 1000: 2210, 5000: 3077 },
    PRODUCTOS: [
      { foto: "hammer", nom: "Martillo carpintero 27 mm Bahco", calc: 15001 },
      { foto: "measuring-tape", nom: "Cinta métrica Stanley 5 m", calc: 8437 },
      { foto: "pliers", nom: "Pinza universal 8\" Bremen", calc: 12640 },
      { foto: "wall-plugs", nom: "Tarugos nylon S8 con tope × 100", calc: 3215 },
      { foto: "drill-bit", nom: "Mecha acero rápido HSS 8 mm", calc: 1201 }
    ],
    persona: function () { return PERSONAS[AS.S.quien]; },
    otro: OTRO,
    chico: function () { return mqCelu.matches; },
    animando: function () { return AS.S.anim && !mqQuieto.matches; }
  };
  var S = AS.S;

  /* ---------- Formatos ---------- */
  AS.miles = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
  AS.plata = function (n, html) { return (html ? '<span class="peso">$</span>' : "$\u00a0") + AS.miles(n); };
  AS.fmt = function (clave, v) {
    if (v === undefined) v = S[clave];
    switch (clave) {
      case "redondeo": return v === 0 ? "Sin redondeo" : "$\u00a0" + AS.miles(v);
      case "margenes": return v.join(" · ") + " %";
      case "sinUso": return v + " min";
      case "tope": return v + " h";
      case "vinculo": return v + (v === 1 ? " día" : " días");
    }
    return String(v);
  };
  AS.fmtLargo = function (clave, v) {
    if (v === undefined) v = S[clave];
    if (clave === "sinUso") return v + " minutos";
    if (clave === "tope") return v + " horas";
    return AS.fmt(clave, v);
  };
  AS.corto = function (paso) { return paso === 0 ? "Sin" : AS.miles(paso); };
  AS.redondear = function (x, paso) { return paso ? Math.ceil(x / paso) * paso : x; };
  AS.cambian = function (paso) { return paso === S.redondeo ? 0 : AS.CAMBIAN[paso]; };

  /* ---------- La hora del negocio (R5): Buenos Aires, en el formato de cada persona ---------- */
  var arranque = Date.now(), base = 14 * 60 + 32;
  AS.minutos = function () { return base + Math.floor((Date.now() - arranque) / 60000); };
  AS.hhmm = function (min) {
    var h = Math.floor(min / 60) % 24, m = min % 60, mm = (m < 10 ? "0" : "") + m;
    if (S.hora === "12") return (h % 12 || 12) + ":" + mm + " " + (h < 12 ? "a. m." : "p. m.");
    return h + ":" + mm;
  };
  AS.hora = function () { return AS.hhmm(AS.minutos()); };
  setInterval(function () { $$("[data-hora]").forEach(function (el) { el.textContent = AS.hora(); }); }, 15000);

  /* ---------- Permiso y conexión ---------- */
  AS.puede = function () { return S.quien === "admin" && !S.offline && !S.nunca; };

  /* ---------- Pintar ---------- */
  var pintores = [];
  AS.alPintar = function (f) { pintores.push(f); };
  AS.pintar = function () {
    var b = document.body;
    b.classList.toggle("quieto", !AS.animando());
    b.classList.toggle("offline", S.offline && !S.nunca);
    b.classList.toggle("nunca-vista", S.nunca);
    b.classList.toggle("solo-lectura", !AS.puede());
    pintarMarco();
    pintores.forEach(function (f) { f(); });
    window.pintarIconos();
  };
  function pintarMarco() {
    var p = AS.persona();
    $$("[data-persona-nombre]").forEach(function (el) { el.textContent = p.nombre; });
    $$("[data-persona-rol]").forEach(function (el) { el.textContent = p.rol; });
    $$("[data-persona-ini]").forEach(function (el) { el.textContent = p.ini; });
    $$("[data-luz]").forEach(function (el) { el.innerHTML = '<span class="punto"></span><span>' + (S.offline || S.nunca ? "Sin conexión" : "En línea · todo enviado") + "</span>"; });
    $$("[data-hora]").forEach(function (el) { el.textContent = AS.hora(); });
    $$("[data-permiso]").forEach(function (el) {
      if (S.quien === "admin" || S.offline || S.nunca) { el.hidden = true; el.innerHTML = ""; return; }
      el.hidden = false;
      el.innerHTML = '<div class="aviso pino"><i class="i" data-i="lock-keyhole"></i><span><span class="largo">Los ves para saber cómo trabaja el negocio. Para cambiarlos hace falta <b>«Cambiar los ajustes»</b>: lo tiene el rol Administrador (Rubén Paredes y Hugo Ferreyra).</span><span class="corto">Para cambiarlos hace falta <b>«Cambiar los ajustes»</b>, del rol Administrador.</span></span></div>';
    });
  }
  AS.marcar = function (sel) {
    if (!AS.animando()) return;
    $$(sel).forEach(function (el) { el.classList.remove("recien"); void el.offsetWidth; el.classList.add("recien"); });
  };
  AS.temblar = function (el) {
    if (!el || !AS.animando()) return;
    el.classList.remove("tiembla"); void el.offsetWidth; el.classList.add("tiembla");
  };
  AS.vibrar = function (p) { if (AS.chico()) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* sin vibración */ } } };

  /* ---------- Tostadas: lo que cambió, con «Deshacer» 5 s (R2.1) ---------- */
  var deshacerVivo = null;
  AS.tostada = function (texto, op) {
    op = op || {};
    var box = $(".tostadas");
    if (!box) { box = document.createElement("div"); box.className = "tostadas"; box.setAttribute("role", "status"); document.body.appendChild(box); }
    $$(".tostada", box).forEach(function (t) { t.remove(); });
    var t = document.createElement("div");
    t.className = "tostada" + (op.mal ? " mal" : "");
    t.innerHTML = '<i class="i" data-i="' + (op.icono || "circle-check") + '"></i><span>' + texto + "</span>" +
      (op.deshacer ? '<button type="button" class="deshacer" data-tecla="d"><i class="i i-s" data-i="undo-2"></i>Deshacer<span class="kbd">D</span></button><span class="reloj"></span>' : "");
    box.appendChild(t);
    window.pintarIconos(t);
    var vida = op.deshacer ? 5000 : 3200, se = false;
    function irse() { if (se) return; se = true; if (deshacerVivo && deshacerVivo.t === t) deshacerVivo = null; t.classList.add("se-va"); setTimeout(function () { t.remove(); }, AS.animando() ? 220 : 0); }
    if (op.deshacer) {
      deshacerVivo = { t: t, f: function () { irse(); op.deshacer(); } };
      $(".deshacer", t).addEventListener("click", function () { deshacerVivo && deshacerVivo.f(); });
    }
    setTimeout(irse, vida);
  };

  /* ---------- Diálogo (hoja en el celular) ---------- */
  var volverA = null;
  AS.cerrarCapa = function () {
    var c = $(".capa.abierta"); if (!c) return;
    c.classList.remove("abierta");
    setTimeout(function () { c.remove(); }, AS.animando() ? 320 : 0);
    if (volverA && document.contains(volverA)) volverA.focus();
  };
  AS.capa = function (html, alConfirmar, alCancelar) {
    volverA = document.activeElement;
    var c = document.createElement("div");
    c.className = "capa";
    c.innerHTML = '<div class="dialogo" role="dialog" aria-modal="true">' + (AS.chico() ? '<div class="asa"></div>' : "") + html + "</div>";
    document.body.appendChild(c);
    window.pintarIconos(c);
    c.addEventListener("click", function (e) {
      if (c.classList.contains("trabada")) return;
      if (e.target === c || e.target.closest("[data-cerrar]")) { AS.cerrarCapa(); alCancelar && alCancelar(); }
      if (e.target.closest("[data-confirma]")) { alConfirmar && alConfirmar(c); }
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add("abierta"); var f = $("[data-confirma]", c); if (f) f.focus(); }); });
    return c;
  };

  /* ---------- Guardar un ajuste ---------- */
  function anotar(clave, de, a, extra) {
    AS.historial.unshift({ quien: AS.persona().nombre, clave: clave, de: AS.fmt(clave, de), a: AS.fmt(clave, a), cuando: "hoy " + AS.hhmm(AS.minutos()), extra: extra, nuevo: true });
  }
  var DEL_OTRO = { vinculo: 15, sinUso: 30, tope: 12, redondeo: 500 };
  // Devuelve "ok", "otro" (lo cambió otro, R2.3), "permiso" (se lo quitaron, E05) o "nada"
  AS.guardar = function (clave, valor, op) {
    op = op || {};
    if (S.offline || S.nunca) return "nada";
    if (S.quien !== "admin") return "nada";
    if (S.quitado) {
      S.quien = "vende"; S.quitado = false; syncCasos();
      AS.pintar();
      AS.tostada("No se guardó: ya no tenés «Cambiar los ajustes»", { icono: "lock-keyhole", mal: true });
      return "permiso";
    }
    if (S.conflicto && DEL_OTRO[clave] !== undefined && !op.deshacer) {
      S.conflicto = false; syncCasos();
      var antes = S[clave];
      S[clave] = DEL_OTRO[clave];
      AS.historial.unshift({ quien: OTRO.nombre, clave: clave, de: AS.fmt(clave, antes), a: AS.fmt(clave, S[clave]), cuando: "hoy " + AS.hhmm(AS.minutos() - 0), nuevo: true });
      AS.notas[clave] = { tipo: "otro", txt: "Lo cambió " + OTRO.nombre + " recién: ahora vale " + AS.fmtLargo(clave) + ". Elegí de nuevo si querés otro." };
      AS.pintar(); AS.marcar('[data-ajuste~="' + clave + '"]');
      AS.vibrar([10, 40, 10]);
      return "otro";
    }
    var prev = S[clave];
    if (JSON.stringify(prev) === JSON.stringify(valor)) return "nada";
    S[clave] = valor;
    delete AS.notas[clave];
    anotar(clave, prev, valor, op.extra);
    AS.pintar();
    AS.marcar('[data-ajuste~="' + clave + '"]');
    AS.vibrar(10);
    if (op.sinTostada) return "ok";
    if (op.deshacer) { AS.tostada(AS.NOMBRE[clave] + ": volvió a " + AS.fmt(clave, valor), { icono: "undo-2" }); return "ok"; }
    AS.tostada("<b>" + AS.NOMBRE[clave] + "</b>: " + (op.detalle || AS.fmt(clave, prev) + " → " + AS.fmt(clave, valor)), {
      deshacer: function () { AS.guardar(clave, prev, { deshacer: true }); }
    });
    return "ok";
  };

  /* ---------- Los márgenes rápidos (R4) ---------- */
  AS.validarMargen = function (i, txt) {
    var t = String(txt).trim().replace(/\./g, "").replace("%", "").trim();
    if (!/^\d+$/.test(t)) return "Va un entero entre 1 y 10.000";
    var n = +t;
    if (n < 1 || n > 10000) return "Va un entero entre 1 y 10.000";
    if (S.margenes.some(function (m, j) { return j !== i && m === n; })) return "Ya hay un margen rápido de " + AS.miles(n) + " %";
    return null;
  };
  // Devuelve null si se guardó (o no cambió), o el texto del error
  AS.cambiarMargen = function (i, txt) {
    var err = AS.validarMargen(i, txt);
    if (err) { AS.notas.margenes = { tipo: "error", txt: err, i: i }; AS.pintar(); return err; }
    var n = +String(txt).trim().replace(/\./g, "").replace("%", "").trim();
    var viejo = S.margenes[i];
    if (n === viejo) { delete AS.notas.margenes; AS.pintar(); return null; }
    var arr = S.margenes.slice(); arr[i] = n; arr.sort(function (a, b) { return b - a; });
    AS.guardar("margenes", arr, { detalle: AS.miles(viejo) + " → " + AS.miles(n) + " % · tecla " + (arr.indexOf(n) + 1) });
    return null;
  };

  /* ---------- Los días del vínculo (R7) ---------- */
  AS.validarDias = function (txt) {
    var t = String(txt).trim();
    if (!/^\d+$/.test(t) || +t < 1 || +t > 365) return "Entre 1 y 365 días";
    return null;
  };
  AS.cambiarDias = function (txt) {
    var err = AS.validarDias(txt);
    if (err) { AS.notas.vinculo = { tipo: "error", txt: err }; AS.pintar(); return err; }
    return AS.guardar("vinculo", +String(txt).trim()) && null;
  };

  /* ---------- El redondeo (R3.4, R3.5): cuántos cambian, confirmar, todo o nada ---------- */
  AS.ejemplosHtml = function (paso, n) {
    var lista = AS.PRODUCTOS.filter(function (p) { return AS.redondear(p.calc, S.redondeo) !== AS.redondear(p.calc, paso); });
    if (lista.length < (n || 3)) lista = lista.concat(AS.PRODUCTOS.filter(function (p) { return lista.indexOf(p) < 0; }));
    return '<div class="ejemplos">' + lista.slice(0, n || 3).map(function (p) {
      var de = AS.redondear(p.calc, S.redondeo), a = AS.redondear(p.calc, paso);
      return '<div class="ejemplo"><span class="foto chica"><img src="../../../common/photos/' + p.foto + '.webp" alt=""></span><span class="nom">' + p.nom + '</span><span class="de-a">' + (de !== a ? "<s>" + AS.plata(de) + "</s>" : "") + AS.plata(a) + "</span></div>";
    }).join("") + "</div>";
  };
  AS.pedirRedondeo = function (paso, alTerminar) {
    if (!AS.puede() && !S.quitado) return;
    if (paso === S.redondeo) return;
    if (S.quitado) { AS.guardar("redondeo", paso); alTerminar && alTerminar(); return; }
    var n = AS.cambian(paso);
    if (!n) { guardarRedondeo(paso, 0); alTerminar && alTerminar(); return; }
    var c = AS.capa(
      '<h2>' + (paso === 0 ? "¿Dejar los precios sin redondeo?" : "¿Redondear para arriba a " + AS.fmt("redondeo", paso) + "?") + '</h2>' +
      '<p class="t-detalle">Se recalculan ahora todos los precios de venta guardados. El precio escrito a mano no se toca.</p>' +
      '<div class="cuantos"><span class="t-numero">' + AS.miles(n) + '</span><span class="t-cuerpo">de ' + AS.miles(AS.TOTAL_PRECIOS) + " precios cambian</span></div>" +
      AS.ejemplosHtml(paso, 3) +
      '<div class="barra-espera" role="status" hidden><div class="barra-dice"><span data-barra-que>Recalculando ' + AS.miles(n) + ' precios…</span><span data-barra-cuanto></span></div><div class="avance"><b></b></div></div>' +
      '<div class="pie-dialogo"><button type="button" class="btn btn-fantasma" data-cerrar data-tecla="c">Cancelar<span class="kbd">C</span></button><button type="button" class="btn btn-accion" data-confirma data-tecla="p"><i class="i i-s sin-espera" data-i="check"></i><i class="i i-s espera-ico" data-i="loader-circle"></i>Cambiar ' + AS.miles(n) + ' precios<span class="kbd">P</span></button></div>',
      function (capa) { recalcular(capa, paso, n, alTerminar); });
    return c;
  };
  // La espera del recálculo (00 · R7): el botón se traba; a los 300 ms, la marca de espera; a los
  // 2 s, la barra con lo que hace y cuánto falta; al terminar, «Listo» un instante. Si falla (R3.5),
  // no cambia nada y lo dice, con «Reintentar».
  var DURA = 3400;
  function recalcular(capa, paso, n, alTerminar) {
    if (S.conflicto) { AS.cerrarCapa(); AS.guardar("redondeo", paso); alTerminar && alTerminar(); return; }
    var btn = $("[data-confirma]", capa), cancelar = $("[data-cerrar]", capa);
    var barra = $(".barra-espera", capa), b = $(".avance b", capa), cuanto = $("[data-barra-cuanto]", barra), que = $("[data-barra-que]", barra);
    var falla = S.falla, tope = falla ? 0.62 : 1, t0 = Date.now(), reloj;
    btn.disabled = true; cancelar.disabled = true; capa.classList.add("trabada");
    setTimeout(function () { btn.classList.add("esperando"); }, 300);
    function avance() {
      var f = Math.min((Date.now() - t0) / DURA, tope);
      b.style.transform = "scaleX(" + f.toFixed(3) + ")";
      cuanto.textContent = AS.miles(Math.round(n * f)) + " de " + AS.miles(n);
    }
    setTimeout(function () { barra.hidden = false; avance(); reloj = setInterval(avance, 100); }, 2000);
    setTimeout(function () {
      clearInterval(reloj);
      if (falla) {
        AS.cerrarCapa();
        setTimeout(function () {
          AS.capa('<h2>No se pudo cambiar el redondeo</h2><p class="t-detalle">Se cortó a mitad del recálculo. No cambió nada: sigue en ' + AS.fmt("redondeo") + ' y todos los precios quedaron como estaban.</p>' +
            '<div class="pie-dialogo"><button type="button" class="btn btn-fantasma" data-cerrar data-tecla="a">Ahora no<span class="kbd">A</span></button><button type="button" class="btn btn-accion" data-confirma data-tecla="r"><i class="i i-s" data-i="refresh-cw"></i>Reintentar<span class="kbd">R</span></button></div>',
            function () { AS.cerrarCapa(); S.falla = false; syncCasos(); setTimeout(function () { AS.pedirRedondeo(paso, alTerminar); }, 340); });
        }, AS.animando() ? 320 : 0);
        return;
      }
      b.style.transform = "scaleX(1)"; cuanto.textContent = AS.miles(n) + " de " + AS.miles(n);
      que.textContent = "Listo"; que.parentNode.classList.add("listo");
      setTimeout(function () { AS.cerrarCapa(); guardarRedondeo(paso, n); alTerminar && alTerminar(); }, 700);
    }, falla ? Math.round(DURA * 0.62) + 200 : DURA);
  }
  function guardarRedondeo(paso, n) {
    var prev = S.redondeo;
    if (AS.guardar("redondeo", paso, { sinTostada: true, extra: n ? "cambiaron " + AS.miles(n) + " precios" : "no cambió ningún precio" }) !== "ok") return;
    // Sin «Deshacer» (R3.4): para volver se elige el paso anterior
    AS.tostada("<b>Redondeo</b>: " + AS.fmt("redondeo", prev) + " → " + AS.fmt("redondeo", paso) + (n ? " · cambiaron " + AS.miles(n) + " precios" : " · ningún precio cambió"), { icono: "circle-check" });
    AS.vibrar([10, 40, 10]);
  }

  /* ---------- Reintentar sin conexión ---------- */
  AS.reintentar = function (btn) {
    if (btn) { btn.disabled = true; setTimeout(function () { btn.classList.add("girando"); }, 300); }
    setTimeout(function () { S.offline = false; S.nunca = false; syncCasos(); AS.pintar(); AS.tostada("De nuevo en línea", { icono: "wifi" }); }, 900);
  };
  document.addEventListener("click", function (e) {
    var r = e.target.closest("[data-reintentar]"); if (r) AS.reintentar(r);
    if (e.target.closest("[data-indicador]")) AS.tostada("El detalle del vínculo está en su maqueta aprobada", { icono: "smartphone" });
  });

  /* ---------- Teclado: Alt muestra las teclas; Ctrl Z deshace ---------- */
  var teclas = {};
  AS.teclas = function (m) { Object.keys(m).forEach(function (k) { teclas[k] = m[k]; }); };
  // Alt más una letra (00 · R2.8): primero los botones a la vista que la llevan (data-tecla), en lo
  // que está encima si hay algo abierto (R2.10); después, los de la pantalla.
  function aLaVista(el) { return el.offsetParent !== null && !el.disabled; }
  document.addEventListener("keydown", function (e) {
    var capa = $(".capa.abierta");
    if (e.key === "Escape" && capa) { if (capa.classList.contains("trabada")) return; var c = $("[data-cerrar]", capa); if (c) c.click(); else AS.cerrarCapa(); return; }
    // Ctrl Z también deshace, fuera de una caja de texto (no pisa el de editar texto, R2.11)
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "z" && deshacerVivo && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); deshacerVivo.f(); return; }
    if (AS.chico()) return;
    if (e.key === "Alt") { document.body.classList.add("alt"); e.preventDefault(); return; }
    if (!e.altKey || e.ctrlKey || !e.key || e.key.length !== 1) return;
    var k = e.key.toLowerCase();
    var b = $$('[data-tecla="' + k + '"]', capa || document).filter(function (el) { return aLaVista(el) && (capa || !el.closest(".capa")); })[0];
    if (b) { e.preventDefault(); b.click(); return; }
    var t = teclas[k];
    if (!t || capa || S.offline || S.nunca) return;
    e.preventDefault();
    if (typeof t === "function") t(); else { var el = $(t); if (el) el.focus(); }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") document.body.classList.remove("alt"); });
  window.addEventListener("blur", function () { document.body.classList.remove("alt"); });

  /* ---------- Casos: no es parte de la pantalla ---------- */
  var casos;
  function syncCasos() {
    if (!casos) return;
    $$("input", casos).forEach(function (i) {
      if (i.name === "quien") i.checked = i.value === (S.quitado ? "quitado" : S.quien);
      if (i.name === "red") i.checked = i.value === (S.nunca ? "nunca" : S.offline ? "offline" : "linea");
      if (i.name === "conflicto") i.checked = S.conflicto;
      if (i.name === "falla") i.checked = S.falla;
      if (i.name === "hora") i.checked = i.value === S.hora;
      if (i.name === "anim") i.checked = S.anim;
    });
  }
  function armarCasos() {
    var b = document.createElement("button");
    b.className = "casos-btn"; b.type = "button";
    b.innerHTML = '<i class="i i-s" data-i="sliders-horizontal"></i>Casos';
    casos = document.createElement("div");
    casos.className = "casos"; casos.setAttribute("role", "dialog"); casos.setAttribute("aria-label", "Casos de la regla");
    casos.innerHTML = '<h3>Casos de la regla</h3><p class="casos-nota">No es parte de la pantalla: cambia quién la mira y cómo está el servidor.</p>' +
      '<fieldset><legend>Quién la mira</legend><label><input type="radio" name="quien" value="admin">Rubén, Administrador</label><label><input type="radio" name="quien" value="vende">Marta, Vendedora (sin el permiso)</label><label><input type="radio" name="quien" value="quitado">Rubén, y le quitan el permiso (E05)</label></fieldset>' +
      '<fieldset><legend>La conexión (R1.6)</legend><label><input type="radio" name="red" value="linea">En línea</label><label><input type="radio" name="red" value="offline">Sin conexión, ya la había visto</label><label><input type="radio" name="red" value="nunca">Sin conexión, nunca la abrió</label></fieldset>' +
      '<fieldset><legend>Lo que pasa en el servidor</legend><label><input type="checkbox" name="conflicto">Hugo cambia lo mismo antes (R2.3)</label><label><input type="checkbox" name="falla">El recálculo del redondeo falla (R3.5)</label></fieldset>' +
      '<fieldset><legend>Configuración de quien mira</legend><label><input type="radio" name="hora" value="24">Hora 14:32</label><label><input type="radio" name="hora" value="12">Hora 2:32 p. m.</label><label><input type="checkbox" name="anim">Animaciones</label></fieldset>' +
      '<button type="button" class="btn chico" data-reiniciar>Volver a empezar</button>';
    casos.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "quien") { S.quien = t.value === "vende" ? "vende" : "admin"; S.quitado = t.value === "quitado"; }
      if (t.name === "red") { S.offline = t.value === "offline"; S.nunca = t.value === "nunca"; }
      if (t.name === "conflicto") S.conflicto = t.checked;
      if (t.name === "falla") S.falla = t.checked;
      if (t.name === "hora") S.hora = t.value;
      if (t.name === "anim") S.anim = t.checked;
      AS.notas = {};
      AS.pintar();
    });
    casos.addEventListener("click", function (e) {
      if (e.target.closest("[data-reiniciar]")) {
        var n = inicial(); Object.keys(n).forEach(function (k) { S[k] = n[k]; });
        AS.historial = historialInicial(); AS.notas = {}; syncCasos(); AS.pintar();
      }
    });
    b.addEventListener("click", function () { casos.classList.toggle("abierto"); });
    document.body.appendChild(b); document.body.appendChild(casos);
    window.pintarIconos(b);
    syncCasos();
  }

  /* ---------- Arranque ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    armarCasos();
    if (window.AS_VARIANTE) window.AS_VARIANTE();
    AS.pintar();
    mqCelu.addEventListener("change", AS.pintar);
  });
})();
