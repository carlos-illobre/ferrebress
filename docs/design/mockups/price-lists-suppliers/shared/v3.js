/* Variante 3 · El estante: sin menú. Cada proveedor es un bibliorato: el ancho es cuántos productos
   trae y el papel amarillea con los días. Subir es ver la planilla entrar y leerse fila por fila. */
(function () {
  "use strict";
  var PL = window.PL, $ = PL.$, $$ = PL.$$, m = PL.miles;
  var lienzo = $("#lienzo"), q = "", sel = "bulonera", J = null, MAX = 7096;

  lienzo.innerHTML = '<header class="e-cab"><button type="button" class="e-f" data-ir="products" aria-label="Volver a Catálogo"><img src="../../../../common/brand/isotype.svg" alt="" width="28" height="28"></button>' +
    '<div class="e-tit"><h1 class="t-titulo">Listas de precios</h1><div class="t-detalle" id="e-sub"></div></div>' +
    '<label class="e-busca"><i class="i" data-i="search"></i><input id="q" type="search" placeholder="Escribí para buscar" aria-label="Buscar un proveedor" autocomplete="off"></label>' +
    '<button type="button" class="btn btn-accion grande e-subir" id="subir" data-sube data-c><i class="i" data-i="upload"></i>Subir lista <span class="kbd siempre">Alt S</span></button></header>' +
    '<div id="avisos"></div><div class="e-zona del-servidor"><div class="e-estante" id="estante" role="listbox" aria-label="Proveedores, de la lista más nueva a la más vieja"></div><div class="e-tabla"></div>' +
    '<div class="e-leyenda" data-c><span>Lista recién aplicada</span><i></i><span>60 días o más</span><span class="sep">·</span><span>El ancho es cuántos productos trae</span><span class="sep solo-compu">·</span><span class="solo-compu"><span class="kbd siempre">←</span> <span class="kbd siempre">→</span> elegir</span></div>' +
    '<section class="e-ficha tarjeta-2" id="ficha" aria-live="polite"></section></div>' +
    '<div class="e-escena" id="escena" aria-live="polite"><div class="e-hoja-caja"><div class="e-hoja" id="hoja"><div class="h-cab"><i class="i i-s" data-i="file-spreadsheet"></i><span id="h-nom"></span></div><div class="h-filas" id="h-filas"></div><div class="laser" id="laser"></div></div><div class="sello" id="sello"></div></div><div class="e-info" id="info"></div></div>';
  var filas = ""; for (var i = 0; i < 13; i++) filas += '<div class="h-fila"><b style="width:' + [14, 12, 16, 13][i % 4] + '%"></b><b style="width:' + [44, 52, 38, 48, 41][i % 5] + '%"></b><b style="width:' + [16, 12, 14][i % 3] + '%"></b><i></i></div>';
  $("#h-filas").innerHTML = filas;
  var TIPO = ["t-c", "t-i", "t-i", "t-c", "t-n", "t-i", "t-c", "t-i", "t-i", "t-i", "t-c", "t-i", "t-n"];

  function orden() { return PL.P.slice().sort(function (a, b) { return PL.S.permiso ? (a.dias === null ? 999 : a.dias) - (b.dias === null ? 999 : b.dias) : a.nom.localeCompare(b.nom, "es"); }); }
  function estante() {
    var v = orden();
    $("#estante").innerHTML = v.map(function (p) {
      var e = PL.S.permiso ? PL.estado(p) : "aldia", edad = p.dias === null || !PL.S.permiso ? 0 : Math.min(1, p.dias / 60), w = PL.S.permiso ? p.prods / MAX : .3, ok = PL.coincide(p, q);
      return '<button type="button" role="option" aria-selected="' + (p.id === sel) + '" class="lomo ' + e + (ok ? "" : " apagado") + (p.espera && p.espera.nueva ? " recien" : "") + '" data-p="' + p.id + '" style="--w:' + w.toFixed(3) + ";--edad:" + edad.toFixed(2) + '">' +
        (e === "espera" ? '<span class="hojita" data-c><i class="i i-s" data-i="hourglass"></i></span>' : e === "ilegible" ? '<span class="hojita mal" data-c><i class="i i-s" data-i="file-x"></i></span>' : "") +
        '<span class="aro"></span><span class="rotulo"><span>' + p.nom + '</span></span>' +
        '<span class="dias" data-c>' + (p.dias === null ? '<b>—</b>' : "<b>" + p.dias + "</b><small>" + (p.dias === 1 ? "día" : "días") + "</small>") + "</span></button>";
    }).join("");
    window.pintarIconos($("#estante"));
    var c = PL.cuenta();
    $("#e-sub").textContent = c.todos + " proveedores" + (PL.S.permiso ? " · " + c.espera + (c.espera === 1 ? " lista espera revisión" : " listas esperan revisión") : "");
  }
  function ficha() {
    var p = PL.prov(sel), e = PL.estado(p);
    $("#ficha").innerHTML = '<div class="f-quien"><div class="f-nom">' + p.nom + '</div><div class="t-detalle">' + (p.vend ? '<i class="i i-s" data-i="phone"></i> ' + p.vend + " · " + p.tel : "Sin datos de contacto todavía") + "</div></div>" +
      '<div class="f-datos" data-c><div class="dato"><span class="et">Última lista aplicada</span><span class="va">' + (p.dias === null ? "Ninguna" : PL.corta(p.ult) + " <small>" + PL.hace(p) + "</small>") + '</span></div><div class="dato solo-compu"><span class="et">Productos</span><span class="va">' + m(p.prods) + "</span></div>" +
      (e === "espera" ? '<div class="dato espera"><span class="et">En espera, del ' + PL.corta(p.espera.fecha) + '</span><span class="va">' + m(p.espera.cambian) + " <small>cambian · " + p.espera.nuevos + " nuevos</small></span></div>" : e === "ilegible" ? '<div class="dato error"><span class="et">La del ' + PL.corta(p.ilegible.fecha) + '</span><span class="va"><small>No se pudo leer: espera un lector</small></span></div>' : "") + "</div>" +
      '<div class="f-bot" data-c>' + (e === "espera" ? '<button type="button" class="btn btn-suave">Ver qué cambia</button>' : "") +
      '<button type="button" class="btn f-sube" data-sube ' + (PL.chico() ? 'id="subir"' : 'data-subir="' + p.id + '"') + '><i class="i i-s" data-i="upload"></i><span class="largo">Subir la de ' + p.nom.split(" ")[0] + '</span><span class="corto">Subir lista</span></button><button type="button" class="btn btn-fantasma">Abrir <span class="kbd siempre solo-compu">Enter</span></button></div>';
    window.pintarIconos($("#ficha"));
  }
  PL.render = function () { $("#avisos").innerHTML = PL.avisos(); window.pintarIconos($("#avisos")); estante(); ficha(); };
  function elegir(id, foco) {
    sel = id; $$(".lomo").forEach(function (l) { var s = l.dataset.p === id; l.setAttribute("aria-selected", s); if (s) { if (foco) l.focus(); l.scrollIntoView({ block: "nearest", inline: "nearest" }); } }); ficha();
  }

  /* ---------- La escena: la planilla entra, se reconoce y se lee ---------- */
  function info(j) {
    var f = j.f, p = j.prov && PL.prov(j.prov), c = PL.contando(j), h = "";
    var tipo = '<div class="segmentos tipo" role="group" aria-label="Qué trae"><button type="button" class="' + (j.completa ? "elegido" : "") + '" data-tipo="1">Lista completa</button><button type="button" class="' + (j.completa ? "" : "elegido") + '" data-tipo="0">Solo cambios</button></div>';
    var sale = '<button type="button" class="btn e-claro" data-cierra>' + (/espera|ilegible/.test(j.fase) ? "Volver al estante" : "Cancelar") + ' <span class="kbd siempre solo-compu">Esc</span></button>';
    if (j.fase === "subiendo") h = '<div class="e-paso">Subiendo</div><div class="e-grande"><span data-n>' + Math.round(j.p * 100) + '</span><small> %</small></div><div class="e-bajo">' + f.nombre + " · " + f.peso + "</div>";
    else if (j.fase === "reconociendo") h = '<div class="e-paso">Reconociendo</div><div class="e-medio late">¿De quién es?</div><div class="e-bajo">Se compara con los formatos que ya se conocen</div>';
    else if (j.fase === "pregunta") h = '<div class="e-paso">Formato nuevo</div><div class="e-medio">¿De qué proveedor es?</div><div class="chips">' + f.sugeridos.map(function (id, n) { return '<button type="button" class="chip" data-resp="' + id + '">' + PL.prov(id).nom + ' <span class="kbd siempre solo-compu">' + (n + 1) + "</span></button>"; }).join("") + '<button type="button" class="chip" data-resp="pinturas">Otro…</button><button type="button" class="chip" data-resp="nuevo">Proveedor nuevo</button></div><div class="e-bajo">Es la única pregunta, y solo la primera vez de este formato</div>';
    else if (j.fase === "leyendo" || j.fase === "espera") h = '<div class="e-paso">' + (j.fase === "espera" ? "Leída · queda en espera" : "Leyendo") + '</div><div class="e-grande"><span data-n>' + m(j.fase === "espera" ? f.filas : j.filas) + "</span><small> de " + m(f.filas) + ' filas</small></div>' +
      '<div class="e-tres"><div><i class="t-n"></i><b data-c1>' + m(c.nuevos) + '</b><span>nuevos</span></div><div><i class="t-c"></i><b data-c2>' + m(c.cambian) + '</b><span>cambian de costo</span></div><div><i class="t-i"></i><b data-c3>' + m(c.iguales) + "</b><span>quedan igual</span></div></div>" +
      (j.fase === "espera" ? '<div class="e-bajo">' + f.res.bajas + " ya no vienen · " + f.res.salteadas + " filas salteadas · nada cambia hasta aplicar" + (f.lectorNuevo ? " · lector nuevo: revisala" : "") + "</div>" : "");
    else if (j.fase === "ilegible") h = '<div class="e-paso">No se pudo leer</div><div class="e-medio">' + f.motivo + '</div><div class="e-bajo">El archivo quedó guardado. Se lee sola cuando haya un lector que la entienda, y quedó anotada en Anomalías.</div>';
    $("#info").innerHTML = h + '<div class="e-pie">' + (j.fase === "espera" ? '<button type="button" class="btn btn-accion grande">Ver qué cambia <span class="kbd siempre solo-compu">Enter</span></button>' : /subiendo|reconociendo|leyendo/.test(j.fase) ? tipo : "") + sale + "</div>";
    $("#sello").className = "sello" + (p && /leyendo|espera|ilegible/.test(j.fase) ? " puesto" : "") + (j.fase === "ilegible" ? " mal" : "");
    $("#sello").textContent = p ? p.nom : "";
    $("#hoja").classList.toggle("tiembla", j.fase === "ilegible");
  }
  function mover(j) {
    var sube = j.fase === "subiendo" ? 1 - j.p : 0, k = j.fase === "leyendo" ? j.p : j.fase === "espera" ? 1 : 0;
    $("#hoja").style.transform = "translateY(" + (sube * 105) + "%)";
    $("#laser").style.transform = "translateY(" + (k * $("#h-filas").offsetHeight) + "px)";
    $("#laser").style.opacity = j.fase === "leyendo" ? 1 : 0;
    $$(".h-fila").forEach(function (f, i) { f.className = "h-fila" + (i < Math.round(k * 13) && !j.f.ilegible ? " " + TIPO[i] : ""); });
  }
  PL.alJob = function (j, tick) {
    if (j.fase === "rechazada") { PL.tostada(j.f.motivo, true); PL.jobs.splice(PL.jobs.indexOf(j), 1); return; }
    if (j.fase === "cerrada") return;
    J = j; $("#escena").classList.add("abierta"); $("#h-nom").textContent = j.f.nombre;
    mover(j);
    if (!tick) return info(j);
    var n = $("[data-n]"); if (n) n.textContent = j.fase === "subiendo" ? Math.round(j.p * 100) : m(j.filas);
    if (j.fase === "leyendo") { var c = PL.contando(j); $("[data-c1]").textContent = m(c.nuevos); $("[data-c2]").textContent = m(c.cambian); $("[data-c3]").textContent = m(c.iguales); }
  };
  function cerrar() {
    if (!J) return; var j = J, fin = j.fase === "espera" || j.fase === "ilegible"; J = null;
    $("#escena").classList.remove("abierta");
    if (fin) { PL.jobs.splice(PL.jobs.indexOf(j), 1); if (j.prov) sel = j.prov; PL.render(); elegir(sel, true); } else PL.cerrar(j);
  }
  function subir(prov) { if (J) return; PL.subir(null, prov); }
  PL.alSoltar = function () { subir(); };

  document.addEventListener("click", function (e) {
    var t = e.target, b;
    if ((b = t.closest("[data-subir]"))) return subir(b.dataset.subir);
    if (t.closest("#subir, .e-subir")) return subir();
    if ((b = t.closest(".lomo"))) return elegir(b.dataset.p);
    if ((b = t.closest("[data-resp]"))) return PL.responder(J, b.dataset.resp);
    if ((b = t.closest("[data-tipo]"))) { J.completa = b.dataset.tipo === "1"; $$("[data-tipo]").forEach(function (x) { x.classList.toggle("elegido", x === b); }); return; }
    if (t.closest("[data-cierra]")) return cerrar();
  });
  $("#q").addEventListener("input", function () {
    q = this.value; estante();
    var v = orden().filter(function (p) { return PL.coincide(p, q); }); if (v.length && q) elegir(v[0].id);
  });
  document.addEventListener("keydown", function (e) {
    var enCampo = e.target.tagName === "INPUT";
    if (J) {
      if (e.key === "Escape") cerrar();
      else if (/^[123]$/.test(e.key)) { var c = $$("#info [data-resp]")[+e.key - 1]; if (c) c.click(); }
      return;
    }
    if (e.altKey && e.key.toLowerCase() === "s") { e.preventDefault(); return subir(); }
    if (/^Arrow/.test(e.key)) {
      var v = orden().filter(function (p) { return PL.coincide(p, q); }), i = v.map(function (p) { return p.id; }).indexOf(sel); if (!v.length) return;
      e.preventDefault(); elegir(v[Math.max(0, Math.min(v.length - 1, i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1)))].id, !enCampo);
    } else if (e.key === "Escape" && enCampo) { e.target.value = ""; q = ""; estante(); e.target.blur(); }
    else if (!enCampo && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && /\S/.test(e.key)) $("#q").focus();
  });
  if (/leyendo/.test(location.hash)) document.addEventListener("DOMContentLoaded", function () { PL.alJob(PL.quieto("conocida", "leyendo", 4120 / 7096)); });
})();
