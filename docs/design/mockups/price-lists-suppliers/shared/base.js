/* Catálogo → Listas · proveedores y subir lista (08 · etapa a). Lo que comparten las tres variantes:
   los proveedores de ejemplo, la subida simulada con su avance (R4), los casos, sin conexión, sin
   permiso, las tostadas y soltar un archivo. Nada consulta la red. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mqCelu = window.matchMedia("(max-width: 899px)");
  var mqQuieto = window.matchMedia("(prefers-reduced-motion: reduce)");
  var H = location.hash;
  if (/captura/.test(H)) document.body.classList.add("captura", "quieto");

  var P = [
    { id: "herrajes", nom: "Herrajes San Martín", ini: "HS", vend: "Noelia Cabral", tel: "11 4555-0178", prods: 842, ult: "12/11/2026", dias: 2 },
    { id: "bulonera", nom: "Bulonera Centro", ini: "BC", vend: "Sergio Ávalos", tel: "11 4555-0142", prods: 7096, ult: "10/11/2026", dias: 4 },
    { id: "aceros", nom: "Aceros Litoral", ini: "AL", vend: "Marcela Duarte", tel: "341 555-0110", prods: 1218, ult: "08/11/2026", dias: 6 },
    { id: "oeste", nom: "Distribuidora Oeste", ini: "DO", vend: "Fabián Luna", tel: "11 4555-0119", prods: 5230, ult: "07/11/2026", dias: 7 },
    { id: "abrasivos", nom: "Abrasivos Cuyo", ini: "AC", vend: "Delia Roldán", tel: "261 555-0164", prods: 611, ult: "05/11/2026", dias: 9 },
    { id: "sur", nom: "Ferretera del Sur", ini: "FS", vend: "Mauro Giménez", tel: "11 4555-0127", prods: 3412, ult: "02/11/2026", dias: 12,
      espera: { fecha: "13/11/2026", nuevos: 18, cambian: 302, bajas: 3, salteadas: 0 } },
    { id: "lumen", nom: "Casa Lumen Iluminación", ini: "CL", vend: "Paula Sosa", tel: "11 4555-0133", prods: 1540, ult: "31/10/2026", dias: 14 },
    { id: "electro", nom: "Electro Norte", ini: "EN", vend: "Iván Quiroga", tel: "11 4555-0151", prods: 2167, ult: "29/10/2026", dias: 16 },
    { id: "sanitarios", nom: "Sanitarios Rivadavia", ini: "SR", vend: "Gustavo Maidana", tel: "11 4555-0186", prods: 1905, ult: "21/10/2026", dias: 24 },
    { id: "pinturas", nom: "Pinturas del Plata", ini: "PP", vend: "Lorena Vera", tel: "11 4555-0102", prods: 1284, ult: "04/10/2026", dias: 41 },
    { id: "tornilleria", nom: "Tornillería Belgrano", ini: "TB", vend: "Rubén Coria", tel: "11 4555-0195", prods: 4378, ult: "12/09/2026", dias: 63,
      ilegible: { fecha: "09/11/2026", archivo: "tornilleria-belgrano-nov.xls" } },
    { id: "maderas", nom: "Maderas Pampa", ini: "MP", vend: "", tel: "", prods: 0, ult: "", dias: null }
  ];
  var FILES = {
    conocida: { nombre: "bulonera-centro-noviembre.xlsx", peso: "2,4 MB", origen: "WhatsApp · hoy 9:14", prov: "bulonera", filas: 7096, fecha: "13/11/2026",
      res: { nuevos: 4, cambian: 876, iguales: 6210, bajas: 12, salteadas: 6, vari: "+8,4 %" } },
    pregunta: { nombre: "lista_precios_nov.xls", peso: "860 KB", origen: "Descargas · ayer 18:40", prov: null, sugeridos: ["electro", "lumen", "sanitarios"], filas: 2203, fecha: "12/11/2026", lectorNuevo: true,
      res: { nuevos: 36, cambian: 412, iguales: 1749, bajas: 9, salteadas: 6, vari: "+6,1 %" } },
    ilegible: { nombre: "abrasivos-cuyo.csv", peso: "310 KB", origen: "Correo · hoy 8:02", prov: "abrasivos", filas: 640, fecha: "14/11/2026", ilegible: true,
      motivo: "Tiene dos columnas de precio y no se sabe cuál es la de lista." },
    rechazada: { nombre: "pinturas-del-plata-nov.pdf", peso: "1,1 MB", origen: "Descargas", rechazada: true,
      motivo: "Es un PDF. Se suben planillas de Excel (.xlsx o .xls) o CSV." }
  };

  var PL = window.PL = {
    $: $, $$: $$, P: P, FILES: FILES, jobs: [],
    S: { caso: "conocida", offline: false, permiso: true, anim: true },
    chico: function () { return mqCelu.matches; },
    animando: function () { return PL.S.anim && !mqQuieto.matches && !/captura/.test(H); },
    prov: function (id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; },
    miles: function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); },
    plano: function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); },
    coincide: function (p, q) { q = PL.plano(q.trim()); return !q || PL.plano(p.nom + " " + p.vend).indexOf(q) >= 0; },
    hace: function (p) { return p.dias === null ? "Sin lista todavía" : p.dias === 0 ? "hoy" : p.dias === 1 ? "ayer" : "hace " + p.dias + " días"; },
    corta: function (f) { return f ? f.slice(0, 5) : ""; },
    estado: function (p) { return p.leyendo ? "leyendo" : p.espera ? "espera" : p.ilegible ? "ilegible" : p.dias === null ? "nunca" : p.dias > 30 ? "vieja" : "aldia"; },
    cuenta: function () {
      var c = { todos: P.length, espera: 0, ilegible: 0, vieja: 0, aldia: 0, nunca: 0, prods: 0 };
      P.forEach(function (p) { var e = PL.estado(p); if (e === "leyendo") e = "aldia"; c[e]++; c.prods += p.prods; });
      return c;
    },
    render: function () {}, alJob: function () {}
  };

  /* ---------- La subida: subir → reconocer → (preguntar) → leer → en espera ---------- */
  var n = 0;
  function emit(j, tick) { PL.alJob(j, !!tick); }
  function tween(ms, paso, fin) {
    if (!PL.animando()) ms = Math.min(ms, 500);
    var t0 = performance.now();
    function f(t) {
      var k = Math.min(1, (t - t0) / ms);
      if (paso(k) === false) return;
      if (k < 1) requestAnimationFrame(f); else fin && fin();
    }
    requestAnimationFrame(f);
  }
  PL.subir = function (caso, provId, demora) {
    if (PL.S.offline) { PL.tostada("Sin conexión: no se puede subir una lista.", true); return null; }
    if (!PL.S.permiso) { PL.tostada("Te falta el permiso «Cargar listas».", true); return null; }
    var f = FILES[caso || PL.S.caso];
    var j = { id: ++n, f: f, prov: provId || null, deProveedor: !!provId, fase: "subiendo", p: 0, filas: 0, completa: true, vivo: true };
    PL.jobs.push(j); emit(j);
    if (f.rechazada) { j.fase = "rechazada"; emit(j); return j; }
    setTimeout(function () {
      tween(1500, function (k) { if (!j.vivo) return false; j.p = k; emit(j, true); }, function () {
        j.fase = "reconociendo"; j.p = 0; emit(j);
        setTimeout(function () {
          if (!j.vivo) return;
          if (j.prov) return leer(j);
          if (f.prov) { j.prov = f.prov; j.reconocida = true; return leer(j); }
          j.fase = "pregunta"; emit(j);
        }, PL.animando() ? 900 : 200);
      });
    }, demora || 0);
    return j;
  };
  function leer(j) {
    var f = j.f, p = PL.prov(j.prov);
    j.fase = "leyendo"; j.p = 0; j.filas = 0; p.leyendo = j; emit(j); PL.render();
    tween(f.ilegible ? 900 : 3600, function (k) {
      if (!j.vivo) return false;
      j.p = f.ilegible ? k * .12 : 1 - Math.pow(1 - k, 1.6); j.filas = Math.round(j.p * f.filas); emit(j, true);
    }, function () {
      p.leyendo = null;
      if (f.ilegible) { j.fase = "ilegible"; p.ilegible = { fecha: f.fecha, archivo: f.nombre }; }
      else {
        j.fase = "espera"; j.reemplazo = !!p.espera;
        p.espera = { fecha: f.fecha, nuevos: f.res.nuevos, cambian: f.res.cambian, bajas: f.res.bajas, salteadas: f.res.salteadas, nueva: true };
        if (navigator.vibrate) try { navigator.vibrate([10, 40, 10]); } catch (e) {}
        setTimeout(function () { if (p.espera) p.espera.nueva = false; }, 1500);
      }
      emit(j); PL.render();
    });
  }
  PL.responder = function (j, provId) {
    if (provId === "nuevo") { P.push({ id: "nuevo", nom: "Proveedor nuevo", ini: "PN", vend: "", tel: "", prods: 0, ult: "", dias: null }); }
    j.prov = provId; leer(j);
  };
  PL.cerrar = function (j) {
    j.vivo = false; var p = j.prov && PL.prov(j.prov); if (p && p.leyendo === j) p.leyendo = null;
    PL.jobs.splice(PL.jobs.indexOf(j), 1); j.fase = "cerrada"; emit(j); PL.render();
  };
  /* Para las capturas: un trabajo quieto en una etapa */
  PL.quieto = function (caso, fase, p) {
    var f = FILES[caso], j = { id: ++n, f: f, prov: fase === "pregunta" || fase === "subiendo" ? null : f.prov, fase: fase, p: p || 0, completa: true, vivo: true, reconocida: true };
    j.filas = Math.round(j.p * (f.filas || 0));
    if (fase === "leyendo") PL.prov(j.prov).leyendo = j;
    PL.jobs.push(j); return j;
  };
  PL.contando = function (j) { var r = j.f.res || {}, k = j.fase === "espera" ? 1 : j.p; return { nuevos: Math.round((r.nuevos || 0) * k), cambian: Math.round((r.cambian || 0) * k), iguales: Math.round((r.iguales || 0) * k) }; };
  PL.frase = function (j) {
    var f = j.f, p = j.prov && PL.prov(j.prov);
    switch (j.fase) {
      case "subiendo": return "Subiendo el archivo · " + Math.round(j.p * 100) + " %";
      case "reconociendo": return j.deProveedor ? "Buscando el lector de " + p.nom + "…" : "Reconociendo de quién es…";
      case "pregunta": return "¿De qué proveedor es?";
      case "leyendo": return p.nom + " · leyendo " + PL.miles(j.filas) + " de " + PL.miles(f.filas) + " filas";
      case "espera": return p.nom + " · lista del " + f.fecha + ", en espera";
      case "ilegible": return "No se pudo leer · " + p.nom;
      case "rechazada": return "No se subió";
    }
    return "";
  };
  /* Avance total de 0 a 1, para quien quiera un solo número */
  PL.total = function (j) { return j.fase === "subiendo" ? j.p * .3 : j.fase === "reconociendo" || j.fase === "pregunta" ? .34 : j.fase === "leyendo" ? .36 + j.p * .64 : 1; };

  /* ---------- Tostadas ---------- */
  PL.tostada = function (txt, mal) {
    var c = $(".tostadas"); if (!c) { c = document.createElement("div"); c.className = "tostadas"; c.setAttribute("aria-live", "polite"); document.body.appendChild(c); }
    var t = document.createElement("div"); t.className = "tostada" + (mal ? " mal" : "");
    t.innerHTML = '<i class="i" data-i="' + (mal ? "triangle-alert" : "circle-check") + '"></i><span></span>'; t.lastChild.textContent = txt;
    c.appendChild(t); window.pintarIconos(t);
    setTimeout(function () { t.classList.add("se-va"); setTimeout(function () { t.remove(); }, 250); }, 3600);
  };

  /* ---------- Avisos de arriba: sin conexión y sin permiso ---------- */
  PL.avisos = function () {
    var h = "";
    if (PL.S.offline) h += '<div class="aviso urgente arriba"><i class="i" data-i="wifi-off"></i><span><b>Sin conexión.</b> Esto es lo último que se vio; no se puede subir ni cambiar nada.</span><button type="button" class="btn chico" data-reintentar><i class="i i-s" data-i="refresh-cw"></i>Reintentar</button></div>';
    if (!PL.S.permiso) h += '<div class="aviso pino arriba"><i class="i" data-i="lock"></i><span><b>Ves los datos de contacto.</b> Para ver las listas y los costos hace falta «Ver costos»; para subir una, «Cargar listas».</span></div>';
    return h;
  };
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-reintentar]")) { PL.S.offline = false; aplicar(); PL.tostada("De nuevo en línea."); }
  });
  function aplicar() {
    document.body.classList.toggle("offline", PL.S.offline);
    document.body.classList.toggle("sin-permiso", !PL.S.permiso);
    document.body.classList.toggle("quieto", !PL.S.anim || /captura/.test(H));
    $$("[data-luz]").forEach(function (l) { l.innerHTML = '<span class="punto"></span><span>' + (PL.S.offline ? "Sin conexión" : "En línea · todo enviado") + "</span>"; });
    PL.render();
  }
  PL.aplicar = aplicar;

  /* ---------- Alt muestra las teclas ---------- */
  document.addEventListener("keydown", function (e) { if (e.key === "Alt") { document.body.classList.add("alt"); e.preventDefault(); } });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") document.body.classList.remove("alt"); });
  window.addEventListener("blur", function () { document.body.classList.remove("alt"); });

  /* ---------- Soltar un archivo en cualquier lado ---------- */
  var gota = document.createElement("div"); gota.className = "gota";
  gota.innerHTML = '<div class="gota-caja"><i class="i i-xl" data-i="file-spreadsheet"></i><b>Soltala acá</b><span>El sistema reconoce de quién es y la lee solo</span></div>';
  document.body.appendChild(gota);
  var dentro = 0;
  window.addEventListener("dragenter", function (e) { e.preventDefault(); dentro++; gota.classList.add("abierta"); });
  window.addEventListener("dragover", function (e) { e.preventDefault(); });
  window.addEventListener("dragleave", function () { if (--dentro <= 0) { dentro = 0; gota.classList.remove("abierta"); } });
  window.addEventListener("drop", function (e) { e.preventDefault(); dentro = 0; gota.classList.remove("abierta"); (PL.alSoltar || PL.subir)(); });

  /* ---------- Panel «Casos» (no es parte de la pantalla) ---------- */
  var casos = document.createElement("div");
  casos.innerHTML = '<button type="button" class="casos-btn" aria-expanded="false"><i class="i i-s" data-i="sliders-horizontal"></i>Casos</button>' +
    '<div class="casos"><h3>Casos de la maqueta</h3><p class="casos-nota">No es parte de la pantalla: elige qué pasa al subir.</p>' +
    '<fieldset><legend>El archivo que se sube</legend>' +
    '<label><input type="radio" name="caso" value="conocida" checked>Formato conocido: se reconoce sola</label>' +
    '<label><input type="radio" name="caso" value="pregunta">Formato nuevo: pregunta de quién es</label>' +
    '<label><input type="radio" name="caso" value="ilegible">No se puede leer</label>' +
    '<label><input type="radio" name="caso" value="rechazada">Un PDF: se rechaza</label></fieldset>' +
    '<fieldset><legend>La persona y la red</legend>' +
    '<label><input type="checkbox" data-s="offline">Sin conexión</label>' +
    '<label><input type="checkbox" data-s="sinpermiso">Sin permisos de Catálogo</label>' +
    '<label><input type="checkbox" data-s="anim" checked>Animaciones</label></fieldset></div>';
  document.body.appendChild(casos);
  $(".casos-btn").addEventListener("click", function () { $(".casos").classList.toggle("abierto"); });
  casos.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "caso") PL.S.caso = t.value;
    else if (t.dataset.s === "offline") PL.S.offline = t.checked;
    else if (t.dataset.s === "sinpermiso") PL.S.permiso = !t.checked;
    else if (t.dataset.s === "anim") PL.S.anim = t.checked;
    aplicar();
  });
  window.pintarIconos(document.body);
  document.addEventListener("DOMContentLoaded", function () { aplicar(); });
  mqCelu.addEventListener("change", function () { PL.render(); });
})();
