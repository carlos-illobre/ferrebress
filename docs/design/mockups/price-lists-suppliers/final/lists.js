/* Catálogo → Listas · proveedores y subir lista (08 · etapa a), maqueta final.
   Los proveedores, la subida simulada (subir → leer, con la pregunta «¿Es de…?» en paralelo, R4.3),
   los permisos (R1.2, R1.3), sin conexión (R1.5), el teclado (00 · R2) y el panel «Casos».
   Nada consulta la red. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mqCelu = window.matchMedia("(max-width: 899px)");
  var mqQuieto = window.matchMedia("(prefers-reduced-motion: reduce)");
  var H = location.hash;
  var CAPTURA = /captura/.test(H);
  if (CAPTURA) document.body.classList.add("captura", "quieto");
  var POR_PAGINA = 7;

  /* ---------- Los datos de ejemplo (inventados) ---------- */
  var BASE = [
    { id: "abrasivos", nom: "Abrasivos Cuyo", vend: "Delia Roldán", tel: "+54 261 555-0164", mail: "ventas@abrasivoscuyo.com.ar", nota: "Entrega los martes", ult: "06/11/2026", dias: 8 },
    { id: "aceros", nom: "Aceros Litoral", vend: "Marcela Duarte", tel: "+54 341 555-0110", mail: "ventas@aceroslitoral.com.ar", nota: "Consultar por largos especiales", ult: "12/11/2026", dias: 2 },
    { id: "bulonera", nom: "Bulonera Centro", vend: "Sergio Ávalos", tel: "+54 11 5555-0142", mail: "listas@buloneracentro.com.ar", nota: "Entrega en 48 h", ult: "31/10/2026", dias: 14 },
    { id: "lumen", nom: "Casa Lumen Iluminación", vend: "Paula Sosa", tel: "+54 11 5555-0133", mail: "ventas@casalumen.com.ar", nota: "Pedir catálogo LED", ult: "24/10/2026", dias: 21,
      espera: { fecha: "11/11/2026" } },
    { id: "oeste", nom: "Distribuidora Oeste", vend: "Fabián Luna", tel: "+54 11 5555-0119", mail: "ventas@dist-oeste.com.ar", nota: "", ult: "15/09/2026", dias: 60,
      ilegible: { fecha: "09/11/2026", motivo: "Tiene dos columnas de precio y no se sabe cuál es la de lista." } },
    { id: "electro", nom: "Electro Norte", vend: "Iván Quiroga", tel: "+54 11 5555-0151", mail: "ventas@electronorte.com.ar", nota: "", ult: "", dias: null },
    { id: "sur", nom: "Ferretera del Sur", vend: "Mauro Giménez", tel: "+54 11 5555-0127", mail: "ventas@ferreteradelsur.com.ar", nota: "", ult: "08/11/2026", dias: 6 },
    { id: "herrajes", nom: "Herrajes San Martín", vend: "Noelia Cabral", tel: "+54 11 5555-0178", mail: "pedidos@herrajessm.com.ar", nota: "", ult: "12/11/2026", dias: 2 },
    { id: "maderas", nom: "Maderas Pampa", vend: "", tel: "+54 2954 555-0190", mail: "", nota: "Solo por WhatsApp", ult: "05/11/2026", dias: 9 },
    { id: "pinturas", nom: "Pinturas del Plata", vend: "Lorena Vera", tel: "+54 11 5555-0102", mail: "ventas@pinturasdelplata.com.ar", nota: "", ult: "04/10/2026", dias: 41 },
    { id: "sanitarios", nom: "Sanitarios Rivadavia", vend: "Gustavo Maidana", tel: "+54 11 5555-0186", mail: "ventas@sanitariosriv.com.ar", nota: "", ult: "21/10/2026", dias: 24 },
    { id: "tornilleria", nom: "Tornillería Belgrano", vend: "Rubén Coria", tel: "+54 11 5555-0195", mail: "ventas@tornilleriabelgrano.com.ar", nota: "", ult: "12/09/2026", dias: 63 }
  ];
  var RES = { nuevos: 4, cambian: 876, iguales: 6210, bajas: 12, salteadas: 6, vari: "+8,4 %" };
  var FILES = {
    formato: { nombre: "bulonera-centro-noviembre.xlsx", peso: "2,4 MB", deduce: "bulonera", como: "Lo reconoció por el formato de su planilla", filas: 7096, fecha: "13/11/2026", res: RES },
    nombre: { nombre: "electro-norte-precios.xlsx", peso: "860 KB", deduce: "electro", como: "Lo dedujo por el nombre del archivo", filas: 2203, fecha: "12/11/2026", lectorNuevo: true,
      res: { nuevos: 2203, cambian: 0, iguales: 0, bajas: 0, salteadas: 4, vari: "" } },
    ninguno: { nombre: "lista_precios_nov.xls", peso: "640 KB", deduce: null, filas: 1980, fecha: "10/11/2026", lectorNuevo: true,
      res: { nuevos: 36, cambian: 412, iguales: 1526, bajas: 9, salteadas: 6, vari: "+6,1 %" } },
    reemplaza: { nombre: "casa-lumen-noviembre.xlsx", peso: "1,2 MB", deduce: "lumen", como: "Lo reconoció por el formato de su planilla", filas: 1540, fecha: "13/11/2026",
      res: { nuevos: 18, cambian: 302, iguales: 1217, bajas: 3, salteadas: 0, vari: "+4,2 %" } },
    anterior: { nombre: "aceros-litoral-octubre.xlsx", peso: "780 KB", deduce: "aceros", como: "Lo reconoció por el formato de su planilla", filas: 1218, fecha: "01/11/2026", anterior: true,
      res: { nuevos: 0, cambian: 96, iguales: 1122, bajas: 0, salteadas: 0, vari: "−2,1 %" } },
    ilegible: { nombre: "distribuidora-oeste-nov.xlsx", peso: "3,1 MB", deduce: "oeste", como: "Lo dedujo por el nombre del archivo", filas: 5230, ilegible: true,
      motivo: "El archivo está dañado: no se puede abrir como planilla." },
    pdf: { nombre: "pinturas-del-plata-nov.pdf", peso: "1,1 MB", rechazada: true, motivo: "Es un PDF. Se suben planillas de Excel (.xlsx o .xls) o CSV." },
    grande: { nombre: "tornilleria-belgrano-anual.xlsx", peso: "31 MB", rechazada: true, motivo: "Pesa 31 MB y el máximo es 30 MB." }
  };

  var S = { caso: "formato", rol: "admin", offline: false, vacio: false, anim: true };
  var P = BASE.map(function (p) { return Object.assign({}, p); });
  var filtro = "todos", q = "", pagina = 1, marca = -1, job = null, nId = 0;
  var eligeQ = "", eligeMarca = 0, eligeNuevo = false;
  var lienzo = $("#lienzo"), barra = $("#barra-accion");

  function permisos() { return { costos: S.rol !== "ninguno", cargar: S.rol === "admin" || S.rol === "cargar", admin: S.rol === "admin" }; }
  function chico() { return mqCelu.matches; }
  function animando() { return S.anim && !mqQuieto.matches && !CAPTURA; }
  function prov(id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; }
  function miles(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function plano(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function fechaLarga(f) { var a = f.split("/"); return a[0] + " " + MES[+a[1] - 1] + " " + a[2]; }
  function fechaCorta(f) { var a = f.split("/"); return +a[0] + " " + MES[+a[1] - 1]; }
  function hace(p) { return p.dias === 0 ? "hoy" : p.dias === 1 ? "ayer" : "hace " + p.dias + " días"; }
  function estado(p) { return job && job.leeComo() === p.id && /subiendo|leyendo|leida|listo/.test(job.fase) ? "leyendo" : p.espera ? "espera" : p.ilegible ? "ilegible" : p.dias === null ? "nunca" : "aldia"; }
  function kbd(t) { return '<span class="kbd">Alt ' + t + "</span>"; }

  /* ---------- Tostadas ---------- */
  function tostada(txt, mal) {
    var c = $(".tostadas"); if (!c) { c = document.createElement("div"); c.className = "tostadas"; c.setAttribute("aria-live", "polite"); document.body.appendChild(c); }
    var t = document.createElement("div"); t.className = "tostada" + (mal ? " mal" : "");
    t.innerHTML = '<i class="i" data-i="' + (mal ? "triangle-alert" : "circle-check") + '"></i><span></span>'; t.lastChild.textContent = txt;
    c.appendChild(t); window.pintarIconos(t);
    setTimeout(function () { t.classList.add("se-va"); setTimeout(function () { t.remove(); }, 250); }, 3400);
  }

  /* =================== La pantalla =================== */
  function pintarPantalla() {
    var pm = permisos(), c = { todos: P.length, espera: 0, ilegible: 0 };
    P.forEach(function (p) { if (p.espera) c.espera++; if (p.ilegible) c.ilegible++; });
    $("[data-sub]").innerHTML = pm.costos
      ? '<span class="largo">' + c.todos + " proveedores · Precios actualizados desde sus planillas.</span><span class=\"corto\">" + c.todos + " proveedores</span>"
      : c.todos + " proveedores";
    var h = "";
    if (S.offline) h += '<div class="aviso urgente arriba"><i class="i" data-i="wifi-off"></i><span><b>Sin conexión.</b> <span class="largo">Se ve lo último que se vio; no se puede subir ni cambiar nada.</span><span class="corto">Es lo último que se vio.</span></span><button type="button" class="btn chico" data-reintentar data-tecla="r"><i class="i i-s" data-i="refresh-cw"></i>Reintentar' + kbd("R") + "</button></div>";
    if (!pm.costos) h += '<div class="aviso pino arriba"><i class="i" data-i="lock"></i><span><span class="largo">Ves los datos de contacto de los proveedores. Sus listas y sus costos necesitan el permiso «Ver costos».</span><span class="corto">Ves solo los datos de contacto.</span></span></div>';
    h += '<div class="herramientas">' +
      '<label class="campo buscar"><i class="i" data-i="search"></i><input id="q" type="search" placeholder="Buscar proveedor…" aria-label="Buscar proveedor" autocomplete="off" value="' + esc(q) + '"><span class="kbd">Alt B</span></label>' +
      '<div class="chips del-servidor" role="group" aria-label="Filtrar" data-c>' +
        chip("todos", "Todos", c.todos, "", "1") + chip("espera", "En espera", c.espera, "urgente", "2") + chip("ilegible", '<span class="largo">No se pudo leer</span><span class="corto">No leídas</span>', c.ilegible, "error", "3") + "</div>" +
      '<button type="button" class="soltar solo-compu" data-sube data-elegir-archivo><i class="i" data-i="cloud-upload"></i><span>Arrastrá un Excel o CSV · .xlsx, .xls, .csv · Hasta 30 MB</span></button></div>' +
      '<div class="tabla tarjeta del-servidor"><div class="cols" aria-hidden="true"><span>Proveedor / vendedor</span><span>Contacto</span><span data-c>Última lista aplicada</span><span data-c>Estado</span><span></span><span></span></div>' +
      '<div class="filas" id="filas" role="list"></div><div id="subida-compu"></div><div class="pie-tabla" id="pie"></div></div>';
    lienzo.innerHTML = h;
    var input = $("#q");
    input.addEventListener("input", function () { var v = this.value; clearTimeout(input._t); input._t = setTimeout(function () { q = v; pagina = 1; marca = -1; pintarFilas(); }, 150); });
    pintarFilas(); pintarBarraCelu(); pintarSubida();
    window.pintarIconos(lienzo); window.pintarIconos($(".cabecera"));
  }
  function chip(f, txt, n, tono, t) {
    return '<button type="button" class="chip' + (filtro === f ? " elegido" : "") + '" data-f="' + f + '" aria-pressed="' + (filtro === f) + '" data-tecla="' + t + '">' + txt + ' <span class="n ' + (n && filtro !== f ? tono : "") + '">' + n + "</span>" + kbd(t) + "</button>";
  }
  function visibles() {
    var qq = plano(q.trim());
    return P.filter(function (p) { return (!qq || plano(p.nom + " " + p.vend).indexOf(qq) >= 0) && (filtro === "todos" || estado(p) === filtro || (filtro === "espera" && p.espera) || (filtro === "ilegible" && p.ilegible)); })
      .sort(function (a, b) { return a.nom.localeCompare(b.nom, "es"); });
  }
  var PAST = {
    aldia: '<span class="pastilla logro"><i class="i i-s" data-i="check"></i>Al día</span>',
    espera: '<span class="pastilla urgente"><i class="i i-s" data-i="triangle-alert"></i>En espera</span><button type="button" class="ir" data-revisar>Revisar →</button>',
    ilegible: '<span class="pastilla error"><i class="i i-s" data-i="circle-x"></i>No se pudo leer</span><button type="button" class="ir" data-motivo>Ver motivo</button>',
    nunca: '<span class="pastilla contorno"><i class="i i-s" data-i="circle-minus"></i>Sin lista</span>',
    leyendo: '<span class="pastilla pino"><i class="i i-s gira" data-i="loader-circle"></i>Leyendo lista…</span>'
  };
  function pintarFilas() {
    var v = visibles(), todas = v.length, filas = $("#filas");
    if (!chico()) { var pags = Math.max(1, Math.ceil(todas / POR_PAGINA)); pagina = Math.min(pagina, pags); v = v.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA); }
    if (!P.length) {
      filas.innerHTML = '<div class="vacio"><span class="burbuja"><i class="i i-xl" data-i="building-2"></i></span><b class="t-renglon">Todavía no hay proveedores</b><span class="t-detalle"><span class="largo">Subí la primera lista: si no es de ningún proveedor, se da de alta al subirla. O creá uno con «Nuevo proveedor».</span><span class="corto">Subí su primera lista o creá un proveedor.</span></span></div>';
    } else if (!v.length) {
      filas.innerHTML = '<div class="vacio"><span class="burbuja"><i class="i i-xl" data-i="search"></i></span><b class="t-renglon">Ningún proveedor con «' + esc(q) + '»</b><span class="t-detalle">Probá con otra palabra.</span></div>';
    } else filas.innerHTML = v.map(function (p, i) {
      var e = estado(p);
      return '<div class="prov' + (i === marca ? " marcado" : "") + (e === "leyendo" ? " leyendo" : "") + (p.recien ? " recien" : "") + '" role="listitem" data-p="' + p.id + '">' +
        '<span class="p-ico"><i class="i" data-i="store"></i></span>' +
        '<div class="p-quien"><button type="button" class="p-nombre" data-abrir>' + esc(p.nom) + '</button><span class="p-vend">' + (p.vend ? esc(p.vend) : "Sin vendedor") + "</span>" + (p.nota ? '<span class="p-nota solo-compu">' + esc(p.nota) + "</span>" : "") + "</div>" +
        '<div class="p-contacto">' + (p.tel ? '<span class="linea"><i class="i i-s wa" data-i="message-circle"></i><span>' + p.tel + "</span></span>" : "") +
          (p.mail ? '<span class="linea"><i class="i i-s" data-i="mail"></i><span>' + p.mail + "</span></span>" : "") +
          (p.nota ? '<span class="linea nota solo-celu"><i class="i i-s" data-i="sticky-note"></i><span><i>' + esc(p.nota) + "</i></span></span>" : "") + "</div>" +
        '<div class="p-ultima" data-c>' + (p.dias === null ? '<span class="linea sin">— Sin listas aplicadas</span>'
          : '<span class="linea"><i class="i i-s" data-i="calendar"></i><span><span class="largo">' + fechaLarga(p.ult) + " · " + hace(p) + '</span><span class="corto">Última: ' + fechaCorta(p.ult) + " · " + hace(p) + "</span></span></span>") + "</div>" +
        '<div class="p-estado" data-c>' + PAST[e] + "</div>" +
        '<button type="button" class="btn btn-icono chico" data-c data-sube data-subir="' + p.id + '" aria-label="Subir la lista de ' + esc(p.nom) + '"><i class="i i-s" data-i="upload"></i>' + kbd("P") + "</button>" +
        '<i class="i flecha" data-i="chevron-right"></i></div>';
    }).join("");
    var pie = $("#pie");
    if (pie) pie.hidden = !P.length;
    if (pie && !chico() && P.length) {
      var pags2 = Math.max(1, Math.ceil(todas / POR_PAGINA)), desde = todas ? (pagina - 1) * POR_PAGINA + 1 : 0, hasta = Math.min(todas, pagina * POR_PAGINA);
      var nums = ""; for (var k = 1; k <= pags2; k++) nums += '<span class="pag' + (k === pagina ? " actual" : "") + '">' + k + "</span>";
      pie.innerHTML = '<span>Mostrando ' + desde + "–" + hasta + " de " + todas + '</span><div class="paginas"><button type="button" class="btn btn-icono chico" data-pag="-1" aria-label="Página anterior" data-tecla="a"' + (pagina === 1 ? " disabled" : "") + '><i class="i i-s" data-i="chevron-left"></i>' + kbd("A") + "</button>" + nums +
        '<button type="button" class="btn btn-icono chico" data-pag="1" aria-label="Página siguiente" data-tecla="g"' + (pagina === pags2 ? " disabled" : "") + '><i class="i i-s" data-i="chevron-right"></i>' + kbd("G") + "</button></div>";
    }
    window.pintarIconos(filas); if (pie) window.pintarIconos(pie);
  }
  function pintarBarraCelu() {
    var pm = permisos();
    var casa = $("#subida-celu");
    if (!barra.querySelector("#subir-celu")) {
      barra.innerHTML = '<div id="subida-celu"></div><button type="button" class="btn btn-accion grande" id="subir-celu" data-sube><i class="i" data-i="upload"></i>Subir lista</button>';
      window.pintarIconos(barra);
    }
    var b = $("#subir-celu"); b.hidden = !pm.cargar; b.disabled = !!(job && /subiendo|leyendo|leida|listo/.test(job.fase));
    $("#subir").disabled = b.disabled;
    barra.hidden = !pm.cargar && !job;
    void casa;
  }

  /* =================== La subida =================== */
  function Job(f, provId) {
    this.id = ++nId; this.f = f; this.prov = provId || null; this.deProveedor = !!provId; this.ded = null;
    this.resp = provId ? "listo" : "esperando"; this.fase = "subiendo"; this.p = 0; this.filas = 0; this.completa = true; this.vivo = true; this.leido = false;
  }
  Job.prototype.leeComo = function () { return this.prov || this.ded; };

  function tween(ms, paso, fin) {
    if (!animando()) ms = Math.min(ms, 600);
    var t0 = performance.now(), mine = job;
    function f(t) {
      if (!mine.vivo || job !== mine) return;
      var k = Math.min(1, (t - t0) / ms);
      if (paso(k) === false) return;
      if (k < 1) requestAnimationFrame(f); else if (fin) fin();
    }
    requestAnimationFrame(f);
  }
  function subir(provId) {
    var pm = permisos();
    if (S.offline) return tostada("Sin conexión: no se puede subir una lista.", true);
    if (!pm.cargar) return tostada("Te falta el permiso «Cargar listas».", true);
    if (job && /subiendo|leyendo|leida|listo/.test(job.fase)) return tostada("Esperá a que termine la lista que se está subiendo.", true);
    if (job) cerrar(true);
    var f = FILES[S.caso];
    job = new Job(f, provId);
    eligeQ = ""; eligeNuevo = false; eligeMarca = 0;
    if (f.rechazada) { job.fase = "rechazada"; return refrescar(); }
    refrescar();
    tween(1500, function (k) { job.p = k; tick(); }, function () {
      job.p = 1;
      if (!job.deProveedor) { job.ded = f.deduce || null; job.resp = f.deduce ? "pregunta" : "elegir"; }
      leer();
    });
  }
  function leer() {
    var f = job.f; job.fase = "leyendo"; job.filas = 0; job.leido = false; refrescar();
    tween(f.ilegible ? 700 : 4200, function (k) {
      var p = f.ilegible ? k * .03 : 1 - Math.pow(1 - k, 1.5);
      job.filas = Math.round(p * f.filas); tick();
    }, function () {
      if (f.ilegible) { job.fase = "ilegible"; var pr = prov(job.leeComo()); if (pr) pr.ilegible = { fecha: "14/11/2026", motivo: f.motivo }; return refrescar(); }
      job.leido = true; job.filas = f.filas;
      if (job.resp === "listo") terminar(); else { job.fase = "leida"; refrescar(); }
    });
  }
  function terminar() {
    job.fase = "listo"; refrescar();
    var mine = job;
    setTimeout(function () {
      if (job !== mine || !mine.vivo) return;
      var p = prov(job.prov);
      job.reemplazo = !!(p.espera);
      if (!job.f.anterior) { p.espera = { fecha: job.f.fecha }; p.recien = true; setTimeout(function () { p.recien = false; }, 1500); }
      job.fase = "espera";
      if (navigator.vibrate && chico()) try { navigator.vibrate([10, 40, 10]); } catch (e) {}
      refrescar();
    }, animando() ? 900 : 300);
  }
  function responder(id) {
    if (!job) return;
    var antes = job.leeComo();
    job.prov = id; job.resp = "listo"; eligeNuevo = false; cerrarHoja();
    var p = prov(id);
    if (antes && antes !== id && !job.leido) { tostada("Se vuelve a leer como de " + p.nom + "."); return leer(); }
    if (antes && antes !== id && job.leido) { tostada("Se vuelve a leer como de " + p.nom + "."); return leer(); }
    if (job.leido) return terminar();
    refrescar();
  }
  function cerrar(callado) {
    if (!job) return;
    var corre = /subiendo|leyendo|leida|listo/.test(job.fase);
    job.vivo = false; job = null; cerrarHoja();
    if (corre && !callado) tostada("Subida cancelada: no se guardó nada.");
    refrescar();
  }
  function refrescar() { pintarFilas(); pintarBarraCelu(); pintarSubida(); }

  function titulo(j) {
    var p = j.leeComo() && prov(j.leeComo()), n = p ? p.nom + " · " : "";
    switch (j.fase) {
      case "subiendo": return "Subiendo la lista";
      case "leyendo": return n + "Leyendo lista";
      case "leida": return n + "Lista leída";
      case "listo": return "Listo";
      case "espera": return prov(j.prov).nom + (j.f.anterior ? " · No se puede aplicar" : " · Lista en espera");
      case "ilegible": return (p ? p.nom + " · " : "") + "No se pudo leer";
      case "rechazada": return "No se subió";
    }
    return "";
  }
  function avance(j) { return j.fase === "subiendo" ? j.p : j.fase === "leyendo" ? j.filas / j.f.filas : /leida|listo|espera/.test(j.fase) ? 1 : 0; }
  function pintarSubida() {
    var casa = chico() ? $("#subida-celu") : $("#subida-compu"), otra = chico() ? $("#subida-compu") : $("#subida-celu");
    if (otra) otra.innerHTML = "";
    if (!casa) return;
    if (!job) { casa.innerHTML = ""; return; }
    var j = job, f = j.f, pm = permisos(), corre = /subiendo|leyendo|leida|listo/.test(j.fase), fin = /espera|ilegible|rechazada/.test(j.fase);
    var el = casa.firstElementChild;
    if (!el || +el.dataset.id !== j.id) { casa.innerHTML = ""; el = document.createElement("article"); el.className = "subida" + (animando() ? " entra" : ""); el.dataset.id = j.id; el.setAttribute("aria-live", "polite"); casa.appendChild(el); }
    el.dataset.fase = j.fase;
    var ico = j.fase === "espera" && !f.anterior ? "file-check" : /ilegible|rechazada/.test(j.fase) || f.anterior && j.fase === "espera" ? "file-x" : "file-spreadsheet";

    /* Izquierda: el archivo y de quién es */
    var izq = '<div class="s-izq"><div class="s-tit" data-tit>' + esc(titulo(j)) + '</div><div class="s-arch">' + esc(f.nombre) + " · " + f.peso + "</div>";
    izq += "</div>";
    var qn = f.rechazada ? "" : '<div class="s-quien">' + quien(j, pm) + "</div>";

    /* Derecha: completa o solo cambios, el espejo y los pasos */
    var der = '<div class="s-der">';
    if (!fin) der += '<div class="s-fila"><div class="segmentos" role="group" aria-label="Qué trae la lista"><button type="button" class="' + (j.completa ? "elegido" : "") + '" data-tipo="1" aria-pressed="' + j.completa + '" data-tecla="l">Lista completa' + kbd("L") + '</button><button type="button" class="' + (j.completa ? "" : "elegido") + '" data-tipo="0" aria-pressed="' + !j.completa + '" data-tecla="m">Solo cambios' + kbd("M") + "</button></div>" +
      '<div class="s-pasos solo-compu">' + paso(j.fase === "subiendo" ? "ahora" : "hecho", "Archivo subido", '<small data-pct-sub>' + Math.round((j.fase === "subiendo" ? j.p : 1) * 100) + " %</small>") +
        '<i class="i i-s s-flecha" data-i="arrow-right"></i>' + paso(j.fase === "leyendo" ? "ahora" : /leida|listo/.test(j.fase) ? "hecho" : "", "Lectura", "") +
        '<i class="i i-s s-flecha" data-i="arrow-right"></i>' + paso(j.fase === "listo" ? "hecho" : "", "Revisión", "") + "</div></div>" +
      '<div class="s-nota"><i class="i i-s" data-i="info"></i>Solo cambios nunca da de baja productos.</div>';
    else der += resultado(j);
    der += "</div>";

    /* Abajo: el avance y los botones */
    var ab = "";
    if (!f.rechazada && j.fase !== "ilegible") {
      var a = avance(j);
      ab = '<div class="s-avance"><div class="riel' + (/listo|espera/.test(j.fase) ? " ok" : "") + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(a * 100) + '"><b style="transform:scaleX(' + a + ')"></b><span data-pct>' + Math.round(a * 100) + ' %</span></div>' +
        '<div class="s-cuenta"><span data-cuenta>' + cuenta(j) + "</span><span>" + pie(j) + "</span></div></div>";
    }
    var acc = '<div class="s-acciones">';
    if (corre) acc += '<span class="pastilla logro espejo"><i class="i i-s" data-i="check"></i><span class="largo">Sincronizado con tu celular</span><span class="corto">Se ve en la computadora</span></span>';
    if (corre) acc += '<button type="button" class="btn" data-cerrar data-tecla="c">Cancelar' + kbd("C") + "</button>";
    else {
      acc += '<button type="button" class="btn' + (j.fase === "espera" && f.anterior ? "" : " btn-fantasma") + '" data-cerrar data-tecla="c">' + (j.fase === "espera" && f.anterior ? "Descartar" : "Cerrar") + kbd("C") + "</button>";
      if (j.fase === "espera" && !f.anterior) acc += '<button type="button" class="btn" data-revisar data-tecla="v"><i class="i i-s" data-i="list-checks"></i>Revisar' + kbd("V") + "</button>";
      if (j.fase === "ilegible") acc += '<button type="button" class="btn" data-bajar data-tecla="j"><i class="i i-s" data-i="download"></i>Bajar el archivo' + kbd("J") + "</button>";
      if (j.fase === "rechazada") acc += '<button type="button" class="btn" data-elegir-archivo data-tecla="o"><i class="i i-s" data-i="file-up"></i>Elegir otro' + kbd("O") + "</button>";
    }
    acc += "</div>";
    if (/ilegible|rechazada/.test(j.fase) || (j.fase === "espera" && f.anterior)) ab = '<div class="s-msg">' + mensaje(j) + "</div>";

    el.innerHTML = '<span class="s-ico"><i class="i i-l" data-i="' + ico + '"></i></span>' + izq + der + qn + ab + acc;
    window.pintarIconos(el);
    if (chico() && j.resp === "elegir" && !j.prov && !$(".capa")) abrirHoja();
    var fq = $("#elige-q", el); if (fq && document.activeElement !== fq && !chico() && eligeEnfocar) { fq.focus(); fq.setSelectionRange(fq.value.length, fq.value.length); eligeEnfocar = false; }
    var fn = $("#nuevo-nom", el); if (fn && eligeNuevo === "foco") { fn.focus(); eligeNuevo = true; }
  }
  var eligeEnfocar = false;
  function paso(c, t, extra) { return '<span class="s-paso ' + c + '"><span class="bola">' + (c === "hecho" ? '<i class="i i-s" data-i="check"></i>' : "") + "</span><span>" + t + (extra || "") + "</span></span>"; }
  function cuenta(j) {
    if (j.fase === "subiendo") return "Subiendo el archivo";
    return "<b>" + miles(j.filas) + "</b> de " + miles(j.f.filas) + " filas";
  }
  function pie(j) {
    if (j.fase === "leida") return '<span class="largo">Leída. Falta que digas de quién es para ver qué cambia.</span><span class="corto">Falta decir de quién es.</span>';
    if (j.fase === "listo") return "Listo";
    if (j.fase === "espera") return j.completa ? "Lista completa" : "Solo cambios";
    return '<span class="largo">Al terminar, vas a ver qué cambia.</span><span class="corto">Después, qué cambia.</span>';
  }
  function quien(j, pm) {
    if (j.deProveedor) return '<div class="confirmado"><i class="i i-s" data-i="check"></i>Subida desde ' + esc(prov(j.prov).nom) + "</div>";
    if (j.fase === "subiendo") return '<div class="s-arch">Al terminar de subir, dice de quién es.</div>';
    if (j.resp === "pregunta") {
      var d = prov(j.ded);
      return '<div class="pregunta" role="group" aria-label="De qué proveedor es"><b>¿Es de ' + esc(d.nom) + "?</b>" +
        '<small><span class="largo">' + j.f.como + '. La lectura sigue mientras tanto.</span><span class="corto">La lectura sigue mientras tanto.</span></small>' +
        '<button type="button" class="btn chico btn-oscuro" data-si data-tecla="s">Sí' + kbd("S") + '</button><button type="button" class="btn chico" data-no data-tecla="o">No, es de otro' + kbd("O") + "</button></div>";
    }
    if (j.resp === "elegir") {
      if (chico()) return '<div class="pregunta"><b>¿De qué proveedor es?</b><button type="button" class="btn chico btn-oscuro" data-abrir-hoja>Elegir proveedor</button></div>';
      return '<div class="pregunta"><b>¿De qué proveedor es?</b><small>' + (j.ded ? "Elegilo de la lista." : "No se pudo deducir: elegilo de la lista.") + " La lectura sigue mientras tanto.</small></div>" + elegir(j, pm);
    }
    var txt = j.prov === j.ded ? "Es de " + esc(prov(j.prov).nom) : "Elegiste " + esc(prov(j.prov).nom);
    var h = '<div class="confirmado"><i class="i i-s" data-i="check"></i>' + txt + "</div>";
    var p = prov(j.prov);
    if (p.espera && /subiendo|leyendo|leida|listo/.test(j.fase)) h += '<div class="aviso urgente" style="padding:6px 10px"><i class="i i-s" data-i="triangle-alert"></i><span>Tenía una lista en espera, del ' + p.espera.fecha + ": esta la reemplaza.</span></div>";
    return h;
  }
  function elegir(j, pm) {
    var qq = plano(eligeQ.trim());
    var ops = P.filter(function (p) { return !qq || plano(p.nom).indexOf(qq) >= 0; }).sort(function (a, b) { return a.nom.localeCompare(b.nom, "es"); });
    eligeMarca = Math.min(eligeMarca, Math.max(0, ops.length - 1));
    var h = '<div class="elegir" role="dialog" aria-label="De qué proveedor es"><div class="elegir-cab"><b>¿De qué proveedor es?</b>' +
      (j.ded ? '<button type="button" class="btn btn-icono chico btn-fantasma" data-volver-pregunta aria-label="Cerrar"><i class="i" data-i="x"></i></button>' : "") + "</div>" +
      '<label class="campo"><i class="i i-s" data-i="search"></i><input id="elige-q" type="search" placeholder="Buscar proveedor" aria-label="Buscar proveedor" autocomplete="off" value="' + esc(eligeQ) + '"></label>' +
      '<div class="opciones" role="listbox">' + (ops.length ? ops.map(function (p, i) {
        return '<button type="button" class="opcion' + (i === eligeMarca ? " marcado" : "") + '" role="option" data-elige="' + p.id + '">' + esc(p.nom) + "<small>" + (p.dias === null ? "Sin listas" : "Última " + fechaCorta(p.ult)) + "</small></button>";
      }).join("") : '<span class="t-detalle" style="padding:6px 10px">Ningún proveedor con «' + esc(eligeQ) + "».</span>") + "</div>";
    if (pm.admin) {
      if (!eligeNuevo) h += '<button type="button" class="linkish" data-nuevo-prov data-tecla="e"><i class="i i-s" data-i="plus"></i>Proveedor nuevo' + kbd("E") + "</button>";
      else h += '<div class="nuevo-prov"><label class="campo"><input id="nuevo-nom" placeholder="Nombre del proveedor" aria-label="Nombre del proveedor" autocomplete="off"></label><button type="button" class="btn btn-oscuro chico" data-continuar data-tecla="i">Continuar' + kbd("I") + '</button></div><div class="error-campo" data-error-nom></div>';
    }
    return h + "</div>";
  }
  function resultado(j) {
    var f = j.f, r = f.res || {};
    if (j.fase !== "espera") return "";
    var h = '<div class="s-nota"><i class="i i-s" data-i="calendar"></i>Lista del ' + f.fecha + " · " + (j.completa ? "completa" : "solo cambios") + "</div>";
    if (f.anterior) return h;
    h += '<div class="cuentas s-res chips" style="gap:6px"><span class="pastilla logro">' + miles(r.nuevos) + " nuevos</span>" +
      (r.cambian ? '<span class="pastilla urgente">' + miles(r.cambian) + " cambian de costo · " + r.vari + "</span>" : "") +
      (r.iguales ? '<span class="pastilla contorno">' + miles(r.iguales) + " igual</span>" : "") +
      (j.completa && r.bajas ? '<span class="pastilla contorno">' + r.bajas + " ya no vienen</span>" : "") +
      (r.salteadas ? '<span class="pastilla contorno">' + r.salteadas + " filas salteadas</span>" : "") +
      (f.lectorNuevo ? '<span class="pastilla pino"><i class="i i-s" data-i="sparkles"></i>Lector nuevo: revisala</span>' : "") + "</div>";
    if (j.reemplazo) h += '<div class="s-nota"><i class="i i-s" data-i="info"></i>Reemplazó a la lista que estaba en espera, que quedó descartada.</div>';
    return h;
  }
  function mensaje(j) {
    var f = j.f;
    if (j.fase === "rechazada") return '<div class="aviso error"><i class="i" data-i="circle-x"></i><span>' + f.motivo + " No se guardó.</span></div>";
    if (j.fase === "ilegible") return '<div class="aviso error"><i class="i" data-i="circle-x"></i><span>' + f.motivo + ' <span class="largo">Quedó como «No se pudo leer», con su archivo guardado, y anotada en Anomalías.</span></span></div>';
    var p = prov(j.prov);
    return '<div class="aviso urgente"><i class="i" data-i="triangle-alert"></i><span>Su fecha, ' + f.fecha + ", es anterior a la última lista aplicada de " + esc(p.nom) + " (" + p.ult + "): no se puede aplicar. Se puede descartar.</span></div>";
  }
  /* Lo que cambia con cada cuadro: solo el avance, sin volver a dibujar la tarjeta */
  function tick() {
    var el = $(".subida"); if (!el || !job) return;
    var a = avance(job), b = $(".riel b", el);
    if (b) b.style.transform = "scaleX(" + a + ")";
    var pc = $("[data-pct]", el); if (pc) pc.textContent = Math.round(a * 100) + " %";
    var r = $(".riel", el); if (r) r.setAttribute("aria-valuenow", Math.round(a * 100));
    var c = $("[data-cuenta]", el); if (c) c.innerHTML = cuenta(job);
    var ps = $("[data-pct-sub]", el); if (ps) ps.textContent = Math.round((job.fase === "subiendo" ? job.p : 1) * 100) + " %";
  }

  /* ---------- Elegir proveedor en el celular: una hoja que sube ---------- */
  function abrirHoja() {
    if ($(".capa")) return pintarHoja();
    var c = document.createElement("div"); c.className = "capa"; c.innerHTML = '<div class="hoja" role="dialog" aria-label="De qué proveedor es"></div>';
    document.body.appendChild(c); pintarHoja();
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add("abierta"); }); });
    c.addEventListener("click", function (e) { if (e.target === c && job && job.ded) { job.resp = "pregunta"; cerrarHoja(); refrescar(); } });
  }
  function pintarHoja() { var h = $(".hoja"); if (!h || !job) return; h.innerHTML = elegir(job, permisos()); window.pintarIconos(h); var fn = $("#nuevo-nom", h); if (fn && eligeNuevo === "foco") { fn.focus(); eligeNuevo = true; } }
  function cerrarHoja() { var c = $(".capa"); if (!c) return; c.classList.remove("abierta"); setTimeout(function () { c.remove(); }, animando() ? 320 : 0); }
  function repintarElegir() { if ($(".hoja")) pintarHoja(); else { pintarSubida(); } }

  /* =================== Clics =================== */
  document.addEventListener("click", function (e) {
    var t = e.target, b;
    if (t.closest(".casos, .casos-btn")) return;
    if (t.closest("#subir, #subir-celu, [data-elegir-archivo]")) return subir();
    if ((b = t.closest("[data-subir]"))) return subir(b.dataset.subir);
    if ((b = t.closest("[data-f]"))) { filtro = b.dataset.f; pagina = 1; marca = -1; return pintarPantalla(); }
    if ((b = t.closest("[data-pag]"))) { pagina += +b.dataset.pag; marca = -1; return pintarFilas(); }
    if (t.closest("[data-reintentar]")) { S.offline = false; sincronizarCasos(); aplicar(); return tostada("De nuevo en línea."); }
    if (t.closest("[data-si]")) return responder(job.ded);
    if (t.closest("[data-no]")) { job.resp = "elegir"; eligeQ = ""; eligeMarca = 0; eligeEnfocar = true; return refrescar(); }
    if (t.closest("[data-abrir-hoja]")) return abrirHoja();
    if (t.closest("[data-volver-pregunta]")) { job.resp = "pregunta"; return refrescar(); }
    if ((b = t.closest("[data-elige]"))) return responder(b.dataset.elige);
    if (t.closest("[data-nuevo-prov]")) { eligeNuevo = "foco"; return repintarElegir(); }
    if (t.closest("[data-continuar]")) return altaProveedor();
    if ((b = t.closest("[data-tipo]"))) { job.completa = b.dataset.tipo === "1"; return pintarSubida(); }
    if (t.closest("[data-cerrar]")) { if (job && job.fase === "espera" && job.f.anterior) { tostada("Lista descartada: no cambió nada."); } return cerrar(); }
    if (t.closest("[data-revisar]")) return tostada("Lo que cambia y aplicar es otra pantalla (R6).");
    if (t.closest("[data-bajar]")) return tostada("Se baja el archivo original, tal como se subió.");
    if ((b = t.closest("[data-motivo]"))) { var p = prov(b.closest("[data-p]").dataset.p); return tostada("No se pudo leer la del " + p.ilegible.fecha + ": " + p.ilegible.motivo, true); }
    if ((b = t.closest("[data-p]")) && !t.closest("button:not([data-abrir])")) return tostada("La pantalla de " + prov(b.dataset.p).nom + " es otra maqueta (R2.3).");
    if (t.closest("#nuevo")) return tostada("Dar de alta un proveedor: con solo el nombre (R2.2). Es otra maqueta.");
    if (t.closest("[data-indicador]")) return tostada("El detalle del vínculo está en su maqueta (03 · R4.2).");
    if (t.closest(".lado-plegar")) return tostada("Minimizar el menú: está en la maqueta del marco.");
  });
  document.addEventListener("input", function (e) {
    if (e.target.id === "elige-q") { var v = e.target.value; clearTimeout(e.target._t); e.target._t = setTimeout(function () { eligeQ = v; eligeMarca = 0; var opc = $(".opciones"); if (!opc) return; var pos = e.target.selectionStart; repintarElegir(); var n = $("#elige-q"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 150); }
  });
  function altaProveedor() {
    var i = $("#nuevo-nom"), nom = i ? i.value.trim() : "", err = $("[data-error-nom]");
    if (!nom) { err.textContent = "Escribí el nombre del proveedor."; return; }
    var ya = P.filter(function (p) { return plano(p.nom) === plano(nom); })[0];
    if (ya) { err.textContent = "Ya existe «" + ya.nom + "»."; return; }
    var id = "nuevo-" + nId; P.push({ id: id, nom: nom, vend: "", tel: "", mail: "", nota: "", ult: "", dias: null });
    tostada("Proveedor «" + nom + "» dado de alta.");
    responder(id);
  }

  /* =================== Teclado (computadora, 00 · R2) =================== */
  document.addEventListener("keydown", function (e) {
    if (chico()) return;
    if (e.key === "Alt") { document.body.classList.add("alt"); e.preventDefault(); return; }
    var enCampo = e.target.tagName === "INPUT";
    if (e.altKey && /^(Key[A-Z]|Digit[0-9])$/.test(e.code)) {
      var k = e.code.slice(-1).toLowerCase(); e.preventDefault();
      if (k === "b") { var qi = $("#q"); qi.focus(); return; }
      if (k === "u") return subir();
      if (k === "p") { var m = $(".prov.marcado [data-subir]"); if (m) m.click(); return; }
      var el = $$("[data-tecla='" + k + "']").filter(function (x) { return x.offsetParent !== null && !x.disabled; })[0];
      if (el) el.click();
      return;
    }
    if (e.target.id === "elige-q" && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
      var ops = $$(".opcion"); if (!ops.length) return; e.preventDefault();
      if (e.key === "Enter") return ops[eligeMarca] && ops[eligeMarca].click();
      ops[eligeMarca].classList.remove("marcado");
      eligeMarca = Math.max(0, Math.min(ops.length - 1, eligeMarca + (e.key === "ArrowDown" ? 1 : -1)));
      ops[eligeMarca].classList.add("marcado"); ops[eligeMarca].scrollIntoView({ block: "nearest" }); return;
    }
    if (e.target.id === "nuevo-nom" && e.key === "Enter") { e.preventDefault(); return altaProveedor(); }
    if (e.key === "Escape") {
      if (job && job.resp === "elegir" && job.ded) { job.resp = "pregunta"; return refrescar(); }
      if (marca >= 0) { marca = -1; return pintarFilas(); }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var rs = $$(".prov"); if (!rs.length) return; e.preventDefault();
      marca = marca < 0 ? (e.key === "ArrowDown" ? 0 : rs.length - 1) : Math.max(0, Math.min(rs.length - 1, marca + (e.key === "ArrowDown" ? 1 : -1)));
      rs.forEach(function (r, i) { r.classList.toggle("marcado", i === marca); }); rs[marca].scrollIntoView({ block: "nearest" }); return;
    }
    if (e.key === "Enter") {
      if (marca >= 0) { e.preventDefault(); var r = $$(".prov")[marca]; return tostada("La pantalla de " + prov(r.dataset.p).nom + " es otra maqueta (R2.3)."); }
      if (enCampo && e.target.id === "q") { e.preventDefault(); return subir(); }
    }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") document.body.classList.remove("alt"); });
  window.addEventListener("blur", function () { document.body.classList.remove("alt"); });
  document.addEventListener("mousemove", function () { if (marca >= 0) { marca = -1; $$(".prov.marcado").forEach(function (r) { r.classList.remove("marcado"); }); } });

  /* ---------- Soltar un archivo en cualquier lado (computadora) ---------- */
  var gota = document.createElement("div"); gota.className = "gota";
  gota.innerHTML = '<div class="gota-caja"><i class="i i-xl" data-i="file-spreadsheet"></i><b>Soltala acá</b><span>El sistema reconoce de quién es y la lee sola</span></div>';
  document.body.appendChild(gota);
  var dentro = 0;
  window.addEventListener("dragenter", function (e) { e.preventDefault(); if (!permisos().cargar || S.offline) return; dentro++; gota.classList.add("abierta"); });
  window.addEventListener("dragover", function (e) { e.preventDefault(); });
  window.addEventListener("dragleave", function () { if (--dentro <= 0) { dentro = 0; gota.classList.remove("abierta"); } });
  window.addEventListener("drop", function (e) { e.preventDefault(); dentro = 0; gota.classList.remove("abierta"); if (permisos().cargar && !S.offline) subir(); });

  /* =================== Permisos, conexión y vacío =================== */
  var ROL = { admin: "Administrador", cargar: "Compras", costos: "Encargado", ninguno: "Mostrador" };
  function aplicar() {
    var pm = permisos();
    document.body.classList.toggle("offline", S.offline);
    document.body.classList.toggle("sin-costos", !pm.costos);
    document.body.classList.toggle("sin-cargar", !pm.cargar);
    document.body.classList.toggle("sin-admin", !pm.admin);
    document.body.classList.toggle("quieto", !S.anim || CAPTURA);
    $$("[data-luz]").forEach(function (l) { l.innerHTML = '<span class="punto"></span><span>' + (S.offline ? "Sin conexión · 0 por enviar" : "En línea · todo enviado") + "</span>"; });
    $("[data-rol]").textContent = ROL[S.rol];
    $("#subir").hidden = !pm.cargar;
    if (!pm.cargar && job) { job.vivo = false; job = null; cerrarHoja(); }
    pintarPantalla();
  }

  /* =================== Panel «Casos» (no es parte de la pantalla) =================== */
  var casos = document.createElement("div");
  casos.innerHTML = '<button type="button" class="casos-btn" aria-expanded="false"><i class="i i-s" data-i="sliders-horizontal"></i>Casos</button>' +
    '<div class="casos"><h3>Casos de la maqueta</h3><p class="casos-nota">No es parte de la pantalla: elige qué archivo se sube con «Subir lista» y quién mira.</p>' +
    '<fieldset><legend>El archivo que se sube</legend>' +
    '<label><input type="radio" name="caso" value="formato" checked>Formato conocido: «¿Es de Bulonera Centro?»</label>' +
    '<label><input type="radio" name="caso" value="nombre">Formato nuevo, el nombre dice de quién es</label>' +
    '<label><input type="radio" name="caso" value="ninguno">No se sabe de quién es: elegirlo</label>' +
    '<label><input type="radio" name="caso" value="reemplaza">Reemplaza la lista en espera</label>' +
    '<label><input type="radio" name="caso" value="anterior">Fecha anterior a la última aplicada</label>' +
    '<label><input type="radio" name="caso" value="ilegible">Archivo dañado: no se puede leer</label>' +
    '<label><input type="radio" name="caso" value="pdf">Un PDF: se rechaza</label>' +
    '<label><input type="radio" name="caso" value="grande">31 MB: se rechaza</label></fieldset>' +
    '<fieldset><legend>Los permisos de quien mira</legend>' +
    '<label><input type="radio" name="rol" value="admin" checked>Los tres (Administrador)</label>' +
    '<label><input type="radio" name="rol" value="cargar">«Cargar listas», sin «Administrar proveedores»</label>' +
    '<label><input type="radio" name="rol" value="costos">Solo «Ver costos»</label>' +
    '<label><input type="radio" name="rol" value="ninguno">Ninguno: solo el contacto</label></fieldset>' +
    '<fieldset><legend>La pantalla</legend>' +
    '<label><input type="checkbox" data-s="offline">Sin conexión</label>' +
    '<label><input type="checkbox" data-s="vacio">Sin proveedores todavía</label>' +
    '<label><input type="checkbox" data-s="anim" checked>Animaciones</label></fieldset></div>';
  document.body.appendChild(casos);
  $(".casos-btn").addEventListener("click", function () { var c = $(".casos"); c.classList.toggle("abierto"); this.setAttribute("aria-expanded", c.classList.contains("abierto")); });
  casos.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "caso") S.caso = t.value;
    else if (t.name === "rol") S.rol = t.value;
    else if (t.dataset.s === "offline") S.offline = t.checked;
    else if (t.dataset.s === "anim") S.anim = t.checked;
    else if (t.dataset.s === "vacio") { S.vacio = t.checked; if (job) { job.vivo = false; job = null; } P = t.checked ? [] : BASE.map(function (p) { return Object.assign({}, p); }); filtro = "todos"; }
    aplicar();
  });
  function sincronizarCasos() { $$(".casos input").forEach(function (i) { if (i.name === "caso") i.checked = i.value === S.caso; else if (i.name === "rol") i.checked = i.value === S.rol; else if (i.dataset.s) i.checked = !!S[i.dataset.s]; }); }

  /* ---------- Estados quietos para las capturas: #captura&<estado> ---------- */
  function quieto(caso, fase, cfg) {
    var f = FILES[caso]; S.caso = caso; job = new Job(f, cfg.prov); Object.assign(job, cfg);
    job.fase = fase; if (fase === "leyendo") job.filas = Math.round((cfg.k || 0) * f.filas);
  }
  function preparar() {
    var m = /(leyendo|pregunta|elegir|nuevo|espera|ilegible|rechazada|anterior|reemplaza|offline|sinpermiso|vacio|costos|alt)/.exec(H), e = m && m[1];
    if (e === "leyendo") quieto("formato", "leyendo", { ded: "bulonera", prov: null, resp: "listo", k: 4120 / 7096, p: 1 });
    if (e === "leyendo") job.prov = "bulonera";
    if (e === "pregunta") quieto("formato", "leyendo", { ded: "bulonera", resp: "pregunta", k: 1880 / 7096, p: 1 });
    if (e === "elegir" || e === "nuevo") { quieto("ninguno", "leyendo", { ded: null, resp: "elegir", k: .41, p: 1 }); if (e === "nuevo") eligeNuevo = true; }
    if (e === "espera") { quieto("formato", "espera", { ded: "bulonera", resp: "listo", leido: true, p: 1 }); job.prov = "bulonera"; job.filas = 7096; prov("bulonera").espera = { fecha: "13/11/2026" }; }
    if (e === "reemplaza") { quieto("reemplaza", "leyendo", { ded: "lumen", resp: "listo", k: .62, p: 1 }); job.prov = "lumen"; }
    if (e === "anterior") { quieto("anterior", "espera", { ded: "aceros", resp: "listo", leido: true, p: 1 }); job.prov = "aceros"; }
    if (e === "ilegible") { quieto("ilegible", "ilegible", { ded: "oeste", resp: "pregunta", p: 1 }); }
    if (e === "rechazada") quieto("pdf", "rechazada", { p: 0 });
    if (e === "offline") S.offline = true;
    if (e === "sinpermiso") S.rol = "ninguno";
    if (e === "costos") S.rol = "costos";
    if (e === "vacio") { S.vacio = true; P = []; }
    if (e === "alt") document.body.classList.add("alt");
    sincronizarCasos();
  }

  window.pintarIconos(document.body);
  preparar();
  aplicar();
  if (!chico() && !CAPTURA) { var qi = $("#q"); if (qi) qi.focus(); }
  mqCelu.addEventListener("change", function () { cerrarHoja(); pintarPantalla(); });
})();
