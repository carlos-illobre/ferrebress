/* Variante 2 · La bandeja se sirve sola: el sistema encuentra las planillas que llegaron al
   dispositivo y las sube todas juntas; los proveedores se ordenan por lo que hay que hacer. */
(function () {
  "use strict";
  var PL = window.PL, $ = PL.$, $$ = PL.$$, m = PL.miles;
  var lienzo = $("#lienzo"), barra = $("#barra-accion"), q = "";
  var L = [{ caso: "conocida" }, { caso: "pregunta" }, { caso: "ilegible" }];

  lienzo.innerHTML = '<div id="avisos"></div><div class="dos del-servidor">' +
    '<section class="bandeja tarjeta-2" data-c aria-label="Planillas que llegaron"><header><div class="t-seccion" id="b-tit"></div><div class="t-detalle" id="b-sub"></div></header>' +
    '<div class="lineas" id="lineas"></div><div id="b-pie"></div>' +
    '<button type="button" class="soltar" id="otra" data-sube><i class="i" data-i="paperclip"></i><span><b>¿Es otra?</b> <span class="largo">Soltala acá, pegala con Ctrl V o elegí el archivo</span><span class="corto">Elegí el archivo</span></span></button></section>' +
    '<section class="tablero" aria-label="Proveedores"><label class="campo buscar"><i class="i" data-i="search"></i><input id="q" type="search" placeholder="Buscar un proveedor" aria-label="Buscar un proveedor" autocomplete="off"><span class="kbd siempre solo-compu">/</span></label><div id="grupos"></div></section></div>';

  function vaso(ico, cls, k) { return '<span class="vaso ' + cls + '"><b style="transform:scaleY(' + k + ')"></b><i class="i" data-i="' + ico + '"></i></span>'; }
  function linea(l, i) {
    var f = PL.FILES[l.caso], j = l.job, h;
    if (!j) return '<div class="linea" data-l="' + i + '">' + vaso("file-spreadsheet", "", 0) + '<div class="l-txt"><b>' + f.nombre + '</b><span class="t-detalle">' + f.origen + " · " + f.peso + '</span></div><button type="button" class="btn chico" data-una="' + i + '" data-sube><i class="i i-s" data-i="upload"></i><span class="solo-compu">Subir</span></button></div>';
    var fin = j.fase === "espera", mal = j.fase === "ilegible" || j.fase === "rechazada", r = f.res;
    h = '<div class="linea ' + j.fase + '" data-l="' + i + '">' + vaso(fin ? "check" : mal ? "file-x" : "file-spreadsheet", fin ? "ok" : mal ? "mal" : "", PL.total(j)) +
      '<div class="l-txt"><b>' + f.nombre + '</b><span class="t-detalle" data-frase>' + frase(j) + "</span></div>" +
      (fin ? '<button type="button" class="btn chico btn-suave">Revisar</button>' : mal ? '<button type="button" class="btn btn-icono chico btn-fantasma" data-quita="' + i + '" aria-label="Quitar"><i class="i" data-i="x"></i></button>' : '<span class="l-num" data-num>' + Math.round(PL.total(j) * 100) + " %</span>");
    if (j.fase === "pregunta") h += '<div class="l-mas"><b>¿De qué proveedor es?</b><div class="chips">' + f.sugeridos.map(function (id, n) { return '<button type="button" class="chip" data-resp="' + id + '" data-l="' + i + '">' + PL.prov(id).nom + ' <span class="kbd siempre solo-compu">' + (n + 1) + "</span></button>"; }).join("") + '<button type="button" class="chip" data-resp="pinturas" data-l="' + i + '">Otro…</button><button type="button" class="chip" data-resp="nuevo" data-l="' + i + '"><i class="i i-s" data-i="plus"></i>Nuevo</button></div></div>';
    if (fin) h += '<div class="l-mas cuentas"><span class="pastilla logro">' + r.nuevos + ' nuevos</span><span class="pastilla urgente">' + m(r.cambian) + " cambian · " + r.vari + '</span><span class="pastilla contorno">' + r.bajas + " ya no vienen</span>" + (f.lectorNuevo ? '<span class="pastilla pino"><i class="i i-s" data-i="sparkle"></i>Lector nuevo: revisala</span>' : "") + "</div>";
    if (mal) h += '<div class="l-mas t-detalle">' + f.motivo + (j.fase === "ilegible" ? " Quedó guardada: se lee sola cuando haya un lector, y está en Anomalías." : "") + "</div>";
    return h + "</div>";
  }
  function frase(j) {
    var p = j.prov && PL.prov(j.prov);
    switch (j.fase) {
      case "subiendo": return "Subiendo…";
      case "reconociendo": return "Reconociendo de quién es…";
      case "pregunta": return "Formato nuevo: falta saber de quién es";
      case "leyendo": return "→ " + p.nom + " · leyendo las filas";
      case "espera": return "→ " + p.nom + " · del " + PL.corta(j.f.fecha);
      case "ilegible": return "No se pudo leer · " + p.nom;
      case "rechazada": return "No se subió";
    }
  }
  function bandeja() {
    var pend = L.filter(function (l) { return !l.job; }).length, corre = L.filter(function (l) { return l.job && !/espera|ilegible|rechazada/.test(l.job.fase); }).length;
    var ok = L.filter(function (l) { return l.job && l.job.fase === "espera"; }).length, mal = L.filter(function (l) { return l.job && /ilegible|rechazada/.test(l.job.fase); }).length;
    $("#b-tit").textContent = pend === L.length ? "Llegaron " + L.length + " planillas" : corre ? "Subiendo " + L.length + " planillas" : !L.length ? "Nada por subir" : ok + (ok === 1 ? " lista para revisar" : " listas para revisar") + (mal ? " · " + mal + " sin leer" : "");
    $("#b-sub").textContent = pend === L.length ? "Las encontramos en Descargas, el correo y WhatsApp" : corre ? "Podés seguir trabajando: el avance queda acá" : L.length ? "Nada cambia hasta que las apliques" : "Cuando llegue una planilla, aparece acá sola";
    $("#lineas").innerHTML = L.map(linea).join("") || '<div class="vacio"><span class="burbuja"><i class="i i-xl" data-i="inbox"></i></span></div>';
    var boton = pend > 1 ? '<button type="button" class="btn btn-accion grande" id="todas" data-sube><i class="i" data-i="upload"></i>Subir las ' + pend + ' <span class="kbd siempre solo-compu">Alt S</span></button>' : "";
    $("#b-pie").innerHTML = PL.chico() ? "" : boton; barra.innerHTML = PL.chico() ? boton : "";
    window.pintarIconos($(".bandeja")); window.pintarIconos(barra);
  }
  function pips(p) { var d = p.dias, n = d === null ? 0 : d <= 7 ? 5 : d <= 14 ? 4 : d <= 21 ? 3 : d <= 30 ? 2 : 1, c = n >= 3 ? "ok" : "viejo", h = ""; for (var i = 0; i < 5; i++) h += "<i" + (i < n ? ' class="' + c + '"' : "") + "></i>"; return '<span class="pips" aria-hidden="true">' + h + "</span>"; }
  var G = [["espera", "Para revisar"], ["leyendo", "Leyendo ahora"], ["ilegible", "No se pudo leer"], ["vieja", "Hace más de 30 días que no mandan"], ["nunca", "Sin lista todavía"], ["aldia", "Al día"]];
  function grupos() {
    var h = "", cols = ["", ""];
    (PL.S.permiso ? G : [["", "Proveedores"]]).forEach(function (g) {
      h = "";
      var v = PL.P.filter(function (p) { return (!g[0] || PL.estado(p) === g[0]) && PL.coincide(p, q); }).sort(function (a, b) { return g[0] ? (a.dias || 0) - (b.dias || 0) : a.nom.localeCompare(b.nom, "es"); });
      if (!v.length) return;
      h += '<h2 class="g-tit ' + g[0] + '">' + g[1] + ' <span>' + v.length + '</span></h2><div class="g">' + v.map(function (p) {
        var e = g[0];
        return '<div class="ficha' + (p.espera && p.espera.nueva ? " recien" : "") + '" tabindex="0" data-p="' + p.id + '"><span class="ini">' + p.ini + '</span><div class="f-txt"><b>' + p.nom + '</b>' +
          '<span class="t-detalle" data-c>' + (e === "espera" ? PL.corta(p.espera.fecha) + " · " + m(p.espera.cambian) + " cambian" : e === "ilegible" ? "La del " + PL.corta(p.ilegible.fecha) + " espera un lector" : e === "leyendo" ? '<span data-ley>Leyendo…</span>' : p.dias === null ? "Subí la primera" : PL.corta(p.ult) + " · " + PL.hace(p)) + "</span>" +
          '<span class="t-detalle contacto">' + (p.vend ? p.vend + " · " + p.tel : "Sin datos de contacto") + "</span></div>" +
          (e === "espera" ? '<button type="button" class="btn chico btn-suave" data-c>Revisar</button>' : e === "leyendo" ? "" : '<span data-c>' + pips(p) + "</span>") +
          (e === "leyendo" ? '<div class="riel"><b></b></div>' : "") + "</div>";
      }).join("") + "</div>";
      cols[g[0] === "aldia" ? 1 : 0] += h;
    });
    h = cols[0] || cols[1] ? '<div class="col">' + cols[0] + '</div><div class="col">' + cols[1] + "</div>" : "";
    $("#grupos").innerHTML = h || '<div class="vacio"><span class="burbuja"><i class="i i-xl" data-i="search"></i></span><b>Ningún proveedor con «' + q + "»</b></div>";
    window.pintarIconos($("#grupos"));
    L.forEach(function (l) { if (l.job && l.job.fase === "leyendo") tick(l); });
  }
  PL.render = function () { $("#avisos").innerHTML = PL.avisos(); window.pintarIconos($("#avisos")); bandeja(); grupos(); };

  function tick(l) {
    var j = l.job, el = $('.linea[data-l="' + L.indexOf(l) + '"]'); if (!el) return;
    $(".vaso b", el).style.transform = "scaleY(" + PL.total(j) + ")";
    var n = $("[data-num]", el); if (n) n.textContent = Math.round(PL.total(j) * 100) + " %";
    $("[data-frase]", el).textContent = frase(j);
    if (j.fase === "leyendo") { var f = $('.ficha[data-p="' + j.prov + '"]'); if (f) { $(".riel b", f).style.transform = "scaleX(" + j.p + ")"; $("[data-ley]", f).textContent = "Leyendo · " + m(j.filas) + " de " + m(j.f.filas) + " filas"; } }
  }
  PL.alJob = function (j, t) {
    var l = L.filter(function (x) { return x.job === j; })[0]; if (!l) return;
    if (t) return tick(l);
    bandeja(); if (/leyendo|espera|ilegible/.test(j.fase)) grupos();
  };
  function una(i, demora) { var l = L[i]; if (l.job) return; var j = PL.subir(l.caso, null, demora); if (j) { l.job = j; bandeja(); } }
  function todas() { L.forEach(function (l, i) { una(i, i * 450); }); }
  function otra() { if (PL.S.offline || !PL.S.permiso) return PL.subir(); L.push({ caso: PL.S.caso }); una(L.length - 1); }
  PL.alSoltar = otra;
  document.addEventListener("click", function (e) {
    var t = e.target, b;
    if (t.closest("#todas")) return todas();
    if ((b = t.closest("[data-una]"))) return una(+b.dataset.una);
    if (t.closest("#otra")) return otra();
    if ((b = t.closest("[data-resp]"))) return PL.responder(L[+b.dataset.l].job, b.dataset.resp);
    if ((b = t.closest("[data-quita]"))) { var l = L[+b.dataset.quita]; PL.jobs.splice(PL.jobs.indexOf(l.job), 1); L.splice(+b.dataset.quita, 1); return PL.render(); }
  });
  $("#q").addEventListener("input", function () { q = this.value; grupos(); });
  document.addEventListener("paste", function (e) { if (e.target.tagName !== "INPUT") otra(); });
  document.addEventListener("keydown", function (e) {
    var enCampo = e.target.tagName === "INPUT";
    if (e.altKey && e.key.toLowerCase() === "s") { e.preventDefault(); L.some(function (l) { return !l.job; }) ? todas() : otra(); }
    else if (e.key === "/" && !enCampo) { e.preventDefault(); $("#q").focus(); }
    else if (e.key === "Escape" && enCampo) { e.target.value = ""; q = ""; grupos(); e.target.blur(); }
    else if (/^[123]$/.test(e.key) && !enCampo) { var c = $$(".linea.pregunta [data-resp]")[+e.key - 1]; if (c) c.click(); }
    else if (/^Arrow/.test(e.key) && !enCampo) {
      var fs = $$(".ficha"), i = fs.indexOf(document.activeElement); if (!fs.length) return; e.preventDefault();
      fs[Math.max(0, Math.min(fs.length - 1, i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1)))].focus();
    }
  });
  if (/leyendo/.test(location.hash)) { L[0].job = PL.quieto("conocida", "leyendo", 4120 / 7096); L[1].job = PL.quieto("pregunta", "pregunta"); L[2].job = PL.quieto("ilegible", "subiendo", .62); }
})();
