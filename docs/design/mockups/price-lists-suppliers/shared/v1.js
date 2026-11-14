/* Variante 1 · La mesa de entrada: los proveedores en renglones y la subida en una tarjeta con sus
   tres pasos. En el celular, la tarjeta vive en la barra de abajo, bajo el pulgar. */
(function () {
  "use strict";
  var PL = window.PL, $ = PL.$, $$ = PL.$$, m = PL.miles;
  var lienzo = $("#lienzo"), barra = $("#barra-accion"), acciones = $("#acciones");
  var filtro = "todos", q = "";

  lienzo.innerHTML = '<div id="avisos"></div><div class="del-servidor"><div class="tiles" id="tiles" data-c></div><div id="subidas"></div>' +
    '<label class="campo buscar"><i class="i" data-i="search"></i><input id="q" type="search" placeholder="Buscar un proveedor" aria-label="Buscar un proveedor" autocomplete="off"><span class="kbd siempre solo-compu">/</span></label>' +
    '<div class="encabezado" data-c><span>Proveedor</span><span>Última lista aplicada</span><span></span><span></span></div><div class="lista" id="lista"></div></div>';
  acciones.innerHTML = '<button type="button" class="btn" data-c><i class="i" data-i="plus"></i>Proveedor nuevo <span class="kbd">Alt N</span></button>' +
    '<button type="button" class="btn btn-accion" id="subir" data-sube data-c><i class="i" data-i="upload"></i>Subir lista <span class="kbd siempre">Alt S</span></button>';
  window.pintarIconos(document.body);

  function tiles() {
    var c = PL.cuenta();
    var T = [["todos", "building-2", "Proveedores", c.todos, ""], ["espera", "hourglass", '<span class="largo">Listas en espera</span><span class="corto">En espera</span>', c.espera, c.espera ? "urgente" : ""],
      ["ilegible", "file-x", "No se pudieron leer", c.ilegible, c.ilegible ? "error" : ""], ["", "tags", "Productos en las listas", m(c.prods), ""]];
    $("#tiles").innerHTML = T.map(function (t) {
      return '<' + (t[0] ? 'button type="button" data-f="' + t[0] + '" aria-pressed="' + (filtro === t[0]) + '"' : "div") + ' class="resumen ' + t[4] + '"><span class="ico"><i class="i" data-i="' + t[1] + '"></i></span><span><span class="et">' + t[2] + '</span><span class="va">' + t[3] + "</span></span></" + (t[0] ? "button" : "div") + ">";
    }).join("");
  }
  var PAST = { espera: '<span class="pastilla accion"><i class="i i-s" data-i="hourglass"></i>Lista en espera</span>', ilegible: '<span class="pastilla error"><i class="i i-s" data-i="file-x"></i>No se pudo leer</span>',
    nunca: '<span class="pastilla contorno">Sin lista todavía</span>', leyendo: '<span class="pastilla pino late"><i class="i i-s" data-i="file-up"></i>Leyendo…</span>', vieja: "", aldia: "" };
  function lista() {
    var v = PL.P.filter(function (p) { return PL.coincide(p, q) && (filtro === "todos" || PL.estado(p) === filtro); })
      .sort(function (a, b) { return a.nom.localeCompare(b.nom, "es"); });
    $("#lista").innerHTML = v.map(function (p) {
      var e = PL.estado(p);
      return '<div class="renglon prov' + (p.espera && p.espera.nueva ? " recien" : "") + '" tabindex="0" data-p="' + p.id + '"><div class="foto-icono ini">' + p.ini + '</div>' +
        '<div class="quien"><div class="titulo">' + p.nom + '</div><div class="detalle d-contacto">' + (p.vend ? p.vend + " · " + p.tel : "Sin datos de contacto") + '</div>' +
        '<div class="detalle d-lista" data-c>' + (p.dias === null ? "Todavía no mandó ninguna lista" : "Última lista " + PL.corta(p.ult) + " · " + PL.hace(p)) + "</div></div>" +
        '<div class="p-estado" data-c>' + PAST[e] + "</div>" +
        '<div class="dato solo-compu" data-c><span class="et">Última lista</span><span class="va">' + (p.dias === null ? "—" : PL.corta(p.ult) + ' <small>' + PL.hace(p) + "</small>") + "</span></div>" +
        (e === "espera" ? '<button type="button" class="btn chico btn-suave ir" data-c>Ver qué cambia</button>' : '<button type="button" class="btn chico ir" data-sube data-subir="' + p.id + '" data-c aria-label="Subir la lista de ' + p.nom + '"><i class="i i-s" data-i="upload"></i><span class="solo-compu">Subir</span></button>') +
        '<i class="i flecha" data-i="chevron-right"></i></div>';
    }).join("") || '<div class="vacio"><span class="burbuja"><i class="i i-xl" data-i="search"></i></span><b>Ningún proveedor con «' + q + '»</b><span class="t-detalle">Probá con otra palabra, o subí su lista: se da de alta solo.</span></div>';
    window.pintarIconos($("#lista"));
  }
  PL.render = function () {
    $("#avisos").innerHTML = PL.avisos(); tiles(); lista(); window.pintarIconos(lienzo);
    var hay = PL.jobs.length > 0;
    $("#subir").classList.toggle("btn-accion", !hay);
    if (PL.chico()) { if (!hay) { barra.innerHTML = '<button type="button" class="btn btn-accion grande" id="subir-celu" data-sube data-c style="width:100%"><i class="i" data-i="upload"></i>Subir lista</button>'; window.pintarIconos(barra); } }
    else if (!hay) barra.innerHTML = "";
    PL.jobs.forEach(function (j) { if (j.el && j.el.parentNode !== casa()) casa().appendChild(j.el); });
  };
  function casa() { return PL.chico() ? barra : $("#subidas"); }

  /* ---------- La tarjeta de la subida ---------- */
  function pasos(j) {
    var a = j.fase === "subiendo" ? j.p : 1, b = j.fase === "subiendo" ? 0 : j.fase === "reconociendo" ? .5 : j.fase === "pregunta" ? .5 : 1, c = j.fase === "leyendo" ? j.p : j.fase === "espera" ? 1 : 0;
    return [a, b, c];
  }
  function num(j) {
    return j.fase === "subiendo" ? Math.round(j.p * 100) + '<small> %</small>' : j.fase === "leyendo" ? m(j.filas) + '<small> de ' + m(j.f.filas) + " filas</small>" : "";
  }
  function extra(j) {
    var f = j.f, r = f.res;
    if (j.fase === "pregunta") return '<div class="chips preg">' + f.sugeridos.map(function (id) { return '<button type="button" class="chip" data-resp="' + id + '">' + PL.prov(id).nom + "</button>"; }).join("") +
      '<button type="button" class="chip" data-resp="pinturas">Otro…</button><button type="button" class="chip" data-resp="nuevo"><i class="i i-s" data-i="plus"></i>Proveedor nuevo</button></div><div class="t-detalle">Es la única pregunta, y solo la primera vez de este formato.</div>';
    if (j.fase === "espera") return '<div class="cuentas"><span class="pastilla logro">' + r.nuevos + ' nuevos</span><span class="pastilla urgente">' + m(r.cambian) + " cambian de costo · " + r.vari + '</span><span class="pastilla contorno solo-compu">' + m(r.iguales) + ' igual</span><span class="pastilla contorno">' + r.bajas + ' ya no vienen</span><span class="pastilla contorno solo-compu">' + r.salteadas + " filas salteadas</span>" +
      (f.lectorNuevo ? '<span class="pastilla pino"><i class="i i-s" data-i="sparkle"></i>Lector nuevo: revisala</span>' : "") + "</div>" + (j.reemplazo ? '<div class="t-detalle">Reemplazó a la lista que estaba esperando.</div>' : "");
    if (j.fase === "ilegible") return '<div class="aviso error"><i class="i" data-i="circle-alert"></i><span>' + f.motivo + " El archivo quedó guardado y se lee sola cuando haya un lector que la entienda. Quedó anotada en Anomalías.</span></div>";
    if (j.fase === "rechazada") return '<div class="aviso error"><i class="i" data-i="circle-alert"></i><span>' + f.motivo + "</span></div>";
    return "";
  }
  function pinta(j, tick) {
    if (j.fase === "cerrada") { if (j.el) j.el.remove(); return; }
    if (!j.el) { j.el = document.createElement("article"); j.el.className = "subida tarjeta-2 entra"; casa().innerHTML = PL.chico() ? "" : casa().innerHTML; casa().appendChild(j.el); if (!PL.chico()) lienzo.scrollTop = 0; }
    var el = j.el, corre = /subiendo|reconociendo|leyendo/.test(j.fase);
    if (!tick || el.dataset.fase !== j.fase) {
      el.dataset.fase = j.fase;
      var ico = j.fase === "espera" ? "file-check" : j.fase === "ilegible" || j.fase === "rechazada" ? "file-x" : "file-spreadsheet";
      el.innerHTML = '<div class="foto-icono s-ico"><i class="i i-l" data-i="' + ico + '"></i></div>' +
        '<div class="s-cuerpo"><div class="s-tit"><b>' + j.f.nombre + '</b><span class="t-detalle">' + j.f.peso + '</span></div><div class="s-frase" data-frase></div>' +
        (j.fase === "rechazada" ? "" : '<div class="pasos"><div class="paso"><div class="riel"><b></b></div><span>1 · Subir</span></div><div class="paso"><div class="riel"><b></b></div><span>2 · Reconocer</span></div><div class="paso"><div class="riel"><b></b></div><span>3 · Leer</span></div></div>') +
        extra(j) + "</div>" +
        '<div class="s-der"><div class="s-num" data-num></div>' +
        (/espera|ilegible|rechazada/.test(j.fase) ? "" : '<div class="segmentos tipo" role="group" aria-label="Qué trae"><button type="button" class="' + (j.completa ? "elegido" : "") + '" data-tipo="1">Lista completa</button><button type="button" class="' + (j.completa ? "" : "elegido") + '" data-tipo="0">Solo cambios</button></div>') +
        (j.fase === "espera" ? '<button type="button" class="btn btn-accion">Ver qué cambia <span class="kbd siempre solo-compu">Enter</span></button>' : j.fase === "ilegible" ? '<button type="button" class="btn"><i class="i i-s" data-i="download"></i>Bajar el archivo</button>' : j.fase === "rechazada" ? '<button type="button" class="btn" data-otra>Elegir otro</button>' : "") +
        '</div><button type="button" class="btn btn-icono chico btn-fantasma s-x" aria-label="' + (corre ? "Cancelar" : "Cerrar") + '"><i class="i" data-i="x"></i></button>';
      el._j = j; window.pintarIconos(el);
      if (j.fase === "espera") el.classList.add("recien");
    }
    $("[data-frase]", el).textContent = j.fase === "leyendo" && !PL.chico() ? "Es de " + PL.prov(j.prov).nom + " · leyendo sus filas" : PL.frase(j);
    $("[data-num]", el).innerHTML = num(j);
    var ps = pasos(j); $$(".riel b", el).forEach(function (b, i) { b.style.transform = "scaleX(" + ps[i] + ")"; b.parentNode.classList.toggle("vivo", (i === 1 && j.fase === "reconociendo")); b.parentNode.classList.toggle("ok", j.fase === "espera"); });
  }
  PL.alJob = function (j, tick) { pinta(j, tick); if (!tick) { var hay = PL.jobs.length > 0; $("#subir").classList.toggle("btn-accion", !hay); if (!hay) PL.render(); } };

  function subir(prov) { PL.jobs.slice().forEach(PL.cerrar); PL.subir(null, prov); }
  PL.alSoltar = function () { subir(); };
  document.addEventListener("click", function (e) {
    var t = e.target, b;
    if (t.closest("#subir, #subir-celu, [data-otra]")) return subir();
    if ((b = t.closest("[data-subir]"))) return subir(b.dataset.subir);
    if ((b = t.closest("[data-f]"))) { filtro = b.dataset.f; return PL.render(); }
    if ((b = t.closest("[data-resp]"))) return PL.responder(b.closest(".subida")._j, b.dataset.resp);
    if ((b = t.closest("[data-tipo]"))) { var j = b.closest(".subida")._j; j.completa = b.dataset.tipo === "1"; $$("[data-tipo]", j.el).forEach(function (x) { x.classList.toggle("elegido", x === b); }); return; }
    if ((b = t.closest(".s-x"))) return PL.cerrar(b.closest(".subida")._j);
  });
  $("#q").addEventListener("input", function () { q = this.value; lista(); });
  document.addEventListener("keydown", function (e) {
    var enCampo = e.target.tagName === "INPUT";
    if (e.altKey && e.key.toLowerCase() === "s") { e.preventDefault(); subir(); }
    else if (e.key === "/" && !enCampo) { e.preventDefault(); $("#q").focus(); }
    else if (e.key === "Escape" && enCampo) { e.target.value = ""; q = ""; lista(); e.target.blur(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var rs = $$(".prov"), i = rs.indexOf(document.activeElement); if (!rs.length) return;
      e.preventDefault(); rs[Math.max(0, Math.min(rs.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))].focus();
    }
  });
  if (/leyendo/.test(location.hash)) { var j = PL.quieto("conocida", "leyendo", 4120 / 7096); document.addEventListener("DOMContentLoaded", function () { pinta(j); PL.render(); }); }
})();
