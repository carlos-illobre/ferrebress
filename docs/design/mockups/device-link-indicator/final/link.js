/* El indicador del vínculo · maqueta final. Una sola página: debajo de 900 px es el celular.
   Todo es simulado: los estados, el código QR, la cámara y la tira del día.
   Partes: los textos de cada estado, la ruta, la tira del día, el indicador, el detalle, el
   código, la cámara, desvincular, el teclado y el selector de la maqueta. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;
  var angosto = window.matchMedia("(max-width: 899px)");
  function celu() { return angosto.matches; }

  /* ---------- Los estados (R4.1), con su texto largo (computadora) y corto (celular) ---------- */
  function estados() {
    var c = celu();
    return {
      sin: { label: "Sin vincular", tone: "neutro",
        largo: "Esta computadora no está vinculada a ningún celular. Vinculalo para usarlo como control remoto: lo que toques en uno se ve en el otro.",
        corto: "En la computadora, tocá el indicador y leé el código." },
      directo: { label: "Directo", tone: "logro",
        largo: "Tu celular y esta computadora muestran lo mismo y se hablan directo por el Wi-Fi del local: no gastan internet y lo que tocás llega al instante.",
        corto: "Muestran lo mismo, directo por el Wi-Fi del local." },
      servidor: { label: "Por el servidor", tone: "urgente",
        largo: "Muestran lo mismo por el servidor, porque la red no deja la conexión directa. Gasta datos de internet, tarda un poco más y no se reintenta sola.",
        corto: "Muestran lo mismo por internet: la red no deja la directa." },
      desconectado: { label: "Desconectado", tone: "neutro",
        largo: "Siguen vinculados, pero cada uno trabaja por su lado. Sigue así hasta que alguien toque «Reconectar», aunque salgan y vuelvan a entrar.",
        corto: "Vinculados, cada uno por su lado hasta «Reconectar»." },
      esperando: { label: c ? "Esperando a la computadora" : "Esperando al celular", tone: "pino",
        largo: "El celular no tiene Ferrebress abierto (pantalla apagada u otra aplicación encima). Cuando vuelva, se encuentran solos y va a esta pantalla.",
        corto: "La computadora no tiene Ferrebress abierto. Cuando vuelva, se encuentran solos." },
      sininternet: { label: "Sin internet", tone: "error",
        largo: "Se cortó la conexión directa y no hay internet para volver a encontrarse. Cuando vuelva internet, se encuentran solos.",
        corto: "Se cortó la directa y no hay internet. Se encuentran solos al volver." }
    };
  }
  var ORDEN = ["sin", "directo", "servidor", "desconectado", "esperando", "sininternet"];
  /* En la pastilla del celular, la forma corta del estado (00 · R3.2) */
  var CORTO = { esperando: "Esperando", sininternet: "Sin internet", servidor: "Por el servidor" };

  /* Con qué está vinculado: el celular de esta computadora y la computadora de este celular */
  var con = { compu: "Chrome en Android", celu: "Chrome en Windows" };
  function otro() { return celu() ? con.celu : con.compu; }

  /* Los botones de cada estado (R4.2). tipo: principal (naranja), comun, peligro.
     La tecla va con Alt (00 · R2.8). */
  function acciones(s) {
    var vincular = celu() ? { id: "vincular", label: "Leer el código", icon: "scan-qr-code", key: "v" }
                          : { id: "vincular", label: "Vincular el celular", icon: "qr-code", key: "v" };
    if (s === "sin") { vincular.tipo = "principal"; return [vincular]; }
    var a = [];
    if (s === "servidor") a.push({ id: "probar", label: "Probar conexión directa", icon: "zap", key: "p", tipo: "principal" });
    if (s === "desconectado") a.push({ id: "reconectar", label: "Reconectar", icon: "plug-zap", key: "r", tipo: "principal" });
    else a.push({ id: "desconectar", label: "Desconectar", icon: "unplug", key: "d", tipo: "comun" });
    vincular.tipo = "comun"; a.push(vincular);
    a.push({ id: "desvincular", label: "Desvincular", icon: "unlink", key: "x", tipo: "peligro" });
    return a;
  }

  var estado = "directo", probando = false, esperaVisible = false, fallo = false, intentos = 0;
  var inicio = new URLSearchParams(location.search).get("estado");
  if (inicio && ORDEN.indexOf(inicio) >= 0) estado = inicio;
  function vinculado(s) { return (s || estado) !== "sin"; }

  /* ---------- La ruta dibujada ---------- */
  var MEDIO = { sin: "plus", directo: "wifi", servidor: "cloud", desconectado: "unplug", esperando: "clock", sininternet: "wifi-off" };
  var LATENCIA = { directo: 12, servidor: 180 };
  function ruta(s) {
    var c = celu();
    var yo = c ? { i: "smartphone", t: "Este celular" } : { i: "monitor", t: "Esta compu" };
    var el = c ? { i: "monitor", t: s === "sin" ? "Sin compu" : otro() } : { i: "smartphone", t: s === "sin" ? "Sin celular" : otro() };
    var lat = LATENCIA[s] ? '<span class="ruta-lat">' + LATENCIA[s] + " ms</span>" : "";
    return '<div class="ruta" data-s="' + s + '" aria-hidden="true">' +
      '<div class="ruta-nodo"><span class="ruta-ico"><i class="i i-l" data-i="' + yo.i + '"></i></span><small>' + yo.t + "</small></div>" +
      '<div class="ruta-tramo">' + lat + '<span class="ruta-cable"></span><span class="ruta-cable b"></span><span class="ruta-pulsos"><i></i><i></i><i></i></span><span class="ruta-medio"><i class="i" data-i="' + MEDIO[s] + '"></i></span></div>' +
      '<div class="ruta-nodo ruta-otro"><span class="ruta-ico"><i class="i i-l" data-i="' + el.i + '"></i></span><small>' + el.t + "</small></div>" +
      "</div>";
  }
  /* El largo del tramo, para que los toques lleguen justo a la otra punta */
  function medirRuta(raiz) {
    raiz.querySelectorAll(".ruta-tramo").forEach(function (t) { t.style.setProperty("--largo-tramo", (t.offsetWidth - 7) + "px"); });
  }

  /* ---------- La tira del día (R4.4) ----------
     Guardada solo en este dispositivo. De la primera conexión del día (8:00) a ahora (10:42), en
     minutos desde las 0:00. El último tramo es el estado de ahora. */
  var DIA = { desde: 480, ahora: 642, tramos: [[480, 552, "directo"], [552, 567, "esperando"], [567, 578, "servidor"], [578, 588, "desconectado"], [588, 630, "directo"], [630, 642, null]] };
  var HORAS = [480, 540, 600];
  function grupo(s) { return s === "directo" || s === "servidor" ? s : "aparte"; }
  function duracion(m) { var h = Math.floor(m / 60), r = m % 60; return h ? h + " h" + (r ? " " + r + " min" : "") : r + " min"; }
  function hora(m) { return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }
  function tira(s) {
    if (!vinculado(s)) return "";
    var total = DIA.ahora - DIA.desde, min = { directo: 0, servidor: 0, aparte: 0 }, tramos = "";
    function pct(m) { return (m / total * 100).toFixed(3) + "%"; }
    DIA.tramos.forEach(function (t) {
      var g = grupo(t[2] || s), largo = t[1] - t[0];
      min[g] += largo;
      tramos += '<span class="tira-tramo" data-g="' + g + '" style="--de:' + pct(t[0] - DIA.desde) + ";--largo:" + pct(largo) + '"></span>';
    });
    var juntos = min.directo + min.servidor, directo = Math.round(min.directo / juntos * 100);
    var horas = HORAS.map(function (m) { return '<span style="--en:' + pct(m - DIA.desde) + '">' + hora(m) + "</span>"; }).join("") + "<span>Ahora</span>";
    var resumen = "De " + hora(DIA.desde) + " a " + hora(DIA.ahora) + ": directo " + duracion(min.directo) + ", por el servidor " + duracion(min.servidor) + ", separados " + duracion(min.aparte) + ".";
    return '<section class="hoy" aria-label="Hoy">' +
      '<p class="hoy-cab"><span>Hoy juntos <b>' + duracion(juntos) + "</b></span><span>" + directo + " % directo</span></p>" +
      '<div class="tira" role="img" aria-label="' + resumen + '">' + tramos + "</div>" +
      '<div class="tira-horas" aria-hidden="true">' + horas + "</div>" +
      '<ul class="hoy-leyenda">' +
        '<li data-g="directo">Directo <b>' + duracion(min.directo) + "</b></li>" +
        '<li data-g="servidor">Por el servidor <b>' + duracion(min.servidor) + "</b></li>" +
        '<li data-g="aparte">Separados <b>' + duracion(min.aparte) + "</b></li>" +
      "</ul></section>";
  }

  /* ---------- El indicador (R4.1): el renglón del lateral y la pastilla del celular ---------- */
  function pintarIndicador(s) {
    var st = estados()[s];
    document.querySelectorAll("[data-indicador]").forEach(function (b) { b.setAttribute("data-tone", st.tone); });
    var compu = $("ind-compu"), pastilla = $("ind-celu");
    compu.querySelector("[data-ind-estado]").textContent = st.label;
    compu.querySelector("[data-ind-detalle]").textContent = s === "sin" ? "Tocalo para vincular" : con.compu;
    compu.setAttribute("aria-label", st.label + (s === "sin" ? "" : ", con " + con.compu) + ". Ver el vínculo");
    compu.setAttribute("data-key", "l");
    pastilla.querySelector("[data-ind-estado]").textContent = CORTO[s] || st.label;
    pastilla.setAttribute("aria-label", st.label + ". Ver el vínculo");
    [compu.querySelector(".indicador-txt"), pastilla.querySelector("[data-ind-estado]")].forEach(function (t) {
      t.classList.remove("cambia"); void t.offsetWidth; t.classList.add("cambia");
    });
  }

  /* ---------- El detalle (R4.2) ---------- */
  var ficha = $("ficha"), det = $("pag-detalle"), velo = $("velo"), conf = $("confirmar"), rem = $("reemplazar"), cam = $("camara");

  function boton(a) {
    var c = celu(), espera = a.id === "probar" && esperaVisible;
    var cont = espera ? '<span class="gira"><i class="i" data-i="refresh-cw"></i></span>' + (c ? "Probando…" : "Probando la conexión directa…")
                      : '<i class="i" data-i="' + a.icon + '"></i>' + a.label;
    var tecla = '<span class="kbd">' + a.key.toUpperCase() + "</span>";
    if (a.tipo === "principal") return '<button type="button" class="btn btn-accion grande" data-a="' + a.id + '" data-key="' + a.key + '"' + (espera ? " disabled" : "") + ">" + cont + " " + tecla + "</button>";
    return '<button type="button" class="accion-fila' + (a.tipo === "peligro" ? " peligro" : "") + '" data-a="' + a.id + '" data-key="' + a.key + '">' + cont + tecla + "</button>";
  }

  function pintarDetalle(s) {
    var c = celu(), st = estados()[s], h = "";
    var titulo = c ? (s === "sin" ? "Trabajar con la compu" : "Con la computadora") : (s === "sin" ? "Trabajar con el celular" : "El vínculo con tu celular");
    h += '<div class="ficha-cab"><h2 id="ficha-titulo">' + titulo + '</h2><button type="button" class="btn btn-fantasma chico btn-icono ficha-cerrar" data-a="cerrar" data-key="c" aria-label="Cerrar"><i class="i i-s" data-i="x"></i><span class="kbd">C</span></button></div>';
    h += '<div class="ruta-caja">' + ruta(s) + "</div>";
    var extra = c ? "" : s === "directo" ? " · por el Wi-Fi" : s === "servidor" ? " · por internet" : "";
    h += '<div class="frase"><span class="estado" data-tone="' + st.tone + '"><span class="dot"></span>' + st.label + extra + "</span><p>" + (c ? st.corto : st.largo) + "</p></div>";
    if (fallo && s === "servidor") h += '<div class="aviso urgente" id="fallo" role="status"><i class="i" data-i="triangle-alert"></i><span>' +
      (c ? "No se pudo: la red sigue sin dejar. Siguen por el servidor." : "No se pudo: la red sigue sin dejar la conexión directa.") + "</span></div>";
    if (!vinculado(s)) {
      if (!c) h += '<ol class="pasos"><li><span>Tocá <b>«Vincular el celular»</b>: aparece un código.</span></li><li><span>Leelo con el celular, con tu misma cuenta adentro.</span></li><li><span>Desde ahí, lo que toques en uno se ve en el otro. No pide permisos.</span></li></ol>';
    } else {
      h += tira(s);
      if (c) {
        h += '<dl class="datos">' +
          '<div class="datos-fila"><i class="i" data-i="monitor"></i><dt class="solo-lector">Vinculado con</dt><dd><b>' + otro() + "</b></dd></div>" +
          '<div class="datos-fila"><i class="i" data-i="calendar"></i><dt class="solo-lector">Desde</dt><dd>Desde ayer, 8:14</dd></div>' +
          '<div class="datos-fila"><i class="i" data-i="timer"></i><dt class="solo-lector">Cuánto dura</dt><dd>Dura hasta el 3 de diciembre sin usarse</dd></div></dl>';
      } else {
        h += '<dl class="datos">' +
          '<div class="datos-fila"><i class="i" data-i="smartphone"></i><dt>Vinculado con</dt><dd>' + otro() + ' <span class="datos-desde">· desde ayer, lunes 2 de noviembre, 8:14</span></dd></div>' +
          '<div class="datos-fila"><i class="i" data-i="timer"></i><dt>Dura sin usarse</dt><dd class="datos-dura">Hasta el jueves 3 de diciembre<span class="dura-barra"><span class="barra"><b></b></span><small>30 de 30 días</small></span></dd></div></dl>';
      }
    }
    var acc = acciones(s), principal = acc.filter(function (a) { return a.tipo === "principal"; }), resto = acc.filter(function (a) { return a.tipo !== "principal"; });
    h += '<div class="acciones">' + principal.map(boton).join("") + (resto.length ? '<div class="acciones-filas">' + resto.map(boton).join("") + "</div>" : "") + "</div>";
    det.innerHTML = h;
    window.pintarIconos(det);
    requestAnimationFrame(function () { medirRuta(det); });
  }

  function pintar() { pintarIndicador(estado); pintarDetalle(estado); syncDemo(); }
  function poner(s) {
    if (s === estado) return;
    estado = s; body.setAttribute("data-link", s);
    pintar();
  }

  /* ---------- Las capas: lo que está encima (00 · R2.7, R2.10) ---------- */
  var capas = [];
  function marcarArriba() {
    document.querySelectorAll(".capa-arriba").forEach(function (e) { e.classList.remove("capa-arriba"); });
    var top = capas[capas.length - 1];
    if (top) top.el().classList.add("capa-arriba");
    body.classList.toggle("con-capa", capas.length > 0);
  }
  function abrirCapa(c) { capas = capas.filter(function (x) { return x !== c; }); capas.push(c); marcarArriba(); }
  function cerrarCapa(c) { capas = capas.filter(function (x) { return x !== c; }); marcarArriba(); }

  /* ---------- Abrir y cerrar el detalle ---------- */
  var capaFicha = { el: function () { return ficha.classList.contains("codigo") ? $("pag-codigo") : det; }, cerrar: function () { cerrar(); } };
  function abierta() { return ficha.classList.contains("abierta"); }
  function abrir() {
    ficha.classList.add("abierta");
    document.querySelectorAll("[data-indicador]").forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    if (celu()) velo.classList.add("abierto");
    abrirCapa(capaFicha);
    requestAnimationFrame(function () { medirRuta(ficha); });
  }
  function cerrar() {
    ficha.classList.remove("abierta", "codigo");
    document.querySelectorAll("[data-indicador]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    velo.classList.remove("abierto");
    pararCodigo();
    cerrarCapa(capaFicha);
  }
  document.querySelectorAll("[data-indicador]").forEach(function (b) { b.addEventListener("click", function () { abierta() ? cerrar() : abrir(); }); });
  document.addEventListener("mousedown", function (e) {
    if (celu() || !abierta() || conf.classList.contains("abierto")) return;
    if (!ficha.contains(e.target) && !e.target.closest("[data-indicador]") && !e.target.closest(".demo")) cerrar();
  });
  velo.addEventListener("click", function () {
    if (conf.classList.contains("abierto")) return noConfirmar();
    if (rem.classList.contains("abierto")) return cerrarReemplazo();
    cerrar();
  });

  /* Celular: la hoja se cierra deslizándola hacia abajo */
  var y0 = null;
  ficha.addEventListener("pointerdown", function (e) { if (!celu() || e.target.closest("button") || ficha.scrollTop > 0) return; y0 = e.clientY; ficha.style.transition = "none"; });
  window.addEventListener("pointermove", function (e) { if (y0 === null) return; ficha.style.transform = "translateY(" + Math.max(0, e.clientY - y0) + "px)"; });
  window.addEventListener("pointerup", function (e) {
    if (y0 === null) return;
    var dy = e.clientY - y0; y0 = null; ficha.style.transition = ""; ficha.style.transform = "";
    if (dy > 90) cerrar();
  });

  /* ---------- El código para vincular (computadora, R1.3): se renueva cada 60 segundos ---------- */
  var semilla = 3, quedan = 60, reloj;
  function qr(seed) {
    var n = 29, x, y, s = (seed || 1) * 9301 + 49297, cells = [];
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    function finder(ox, oy) { for (y = 0; y < 7; y++) for (x = 0; x < 7; x++) { if (x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) cells.push([ox + x, oy + y]); } }
    function enEsquina(x, y) { return (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9); }
    function enCentro(x, y) { return x >= 10 && x <= 18 && y >= 10 && y <= 18; }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
      if (enEsquina(x, y) || enCentro(x, y)) continue;
      if (y === 6 || x === 6) { if ((x + y) % 2 === 0) cells.push([x, y]); continue; }
      if (rnd() < 0.48) cells.push([x, y]);
    }
    return '<svg viewBox="-2 -2 33 33" shape-rendering="crispEdges" fill="#1A1D1B" role="img" aria-label="Código para vincular">' +
      cells.map(function (c) { return '<rect x="' + c[0] + '" y="' + c[1] + '" width="1.04" height="1.04"/>'; }).join("") + "</svg>";
  }
  function dibujarCodigo() { $("qr-svg").innerHTML = qr(semilla); }
  function latir() {
    quedan--;
    if (quedan <= 0) {
      quedan = 60; semilla++;
      var q = $("qr"); q.classList.add("renueva");
      setTimeout(function () { dibujarCodigo(); q.classList.remove("renueva"); }, 200);
    }
    $("cuenta").textContent = "Se renueva en 0:" + String(quedan).padStart(2, "0");
    $("riel").style.transform = "scaleX(" + (quedan / 60) + ")";
  }
  function empezarCodigo() {
    quedan = 60; dibujarCodigo(); $("qr").classList.remove("listo");
    $("cuenta").textContent = "Se renueva en 1:00";
    $("riel").style.transform = "none";
    $("reemplaza").hidden = !vinculado();
    $("reemplaza").querySelector("[data-con]").textContent = con.compu;
    clearInterval(reloj); reloj = setInterval(latir, 1000);
  }
  function pararCodigo() { clearInterval(reloj); }
  function mostrarCodigo() { ficha.classList.add("codigo"); empezarCodigo(); marcarArriba(); setTimeout(function () { $("volver").focus(); }, 50); }
  function volverDelCodigo() { ficha.classList.remove("codigo"); pararCodigo(); marcarArriba(); }
  $("volver").addEventListener("click", volverDelCodigo);
  function leido() {
    pararCodigo();
    $("qr").classList.add("listo");
    setTimeout(function () {
      poner("directo");
      volverDelCodigo();
      toast("Vinculados: el celular vino a esta pantalla");
    }, 900);
  }
  $("simular").addEventListener("click", leido);
  $("qr").addEventListener("click", leido);

  /* ---------- La cámara (celular): lee el código; si ya hay vínculo, pregunta (R1.4) ---------- */
  var camT;
  function abrirCamara() {
    cerrar();
    $("cam-qr").innerHTML = qr(7);
    $("visor").classList.remove("leido");
    cam.classList.add("abierta");
    clearTimeout(camT);
    camT = setTimeout(function () {
      $("visor").classList.add("leido"); vibrar([10, 40, 10]);
      setTimeout(function () {
        cam.classList.remove("abierta");
        if (vinculado()) { rem.querySelector("[data-con]").textContent = con.celu; rem.classList.add("abierto"); velo.classList.add("abierto"); }
        else { poner("directo"); toast("Vinculados: fuiste a la pantalla de la compu"); }
      }, 700);
    }, 1900);
  }
  function cerrarCamara() { clearTimeout(camT); cam.classList.remove("abierta"); }
  $("cam-x").addEventListener("click", cerrarCamara);
  function cerrarReemplazo() { rem.classList.remove("abierto"); velo.classList.remove("abierto"); }
  $("rem-si").addEventListener("click", function () { con.celu = "Edge en Windows"; cerrarReemplazo(); estado = "sin"; poner("directo"); toast("Ahora estás vinculado a Edge en Windows"); });
  $("rem-no").addEventListener("click", cerrarReemplazo);

  /* ---------- Desvincular: pide confirmación (R5.3) ---------- */
  var capaConf = { el: function () { return conf; }, cerrar: function () { noConfirmar(); } };
  function confirmar() {
    var c = celu();
    $("conf-t").textContent = c ? "¿Desvincular la computadora?" : "¿Desvincular el celular?";
    $("conf-d").innerHTML = "<b>" + otro() + "</b> " + (c ? "deja de estar vinculada. Cada uno sigue en su pantalla; para volver a trabajar juntos, vinculá de nuevo."
      : "deja de estar vinculado. Cada uno sigue en la pantalla en la que está; para volver a trabajar juntos hay que vincular de nuevo.");
    if (c) ficha.classList.remove("abierta");
    velo.classList.add("abierto"); conf.classList.add("abierto");
    abrirCapa(capaConf);
    setTimeout(function () { $("conf-si").focus(); }, 50);
  }
  function noConfirmar() {
    conf.classList.remove("abierto"); cerrarCapa(capaConf);
    if (celu()) { ficha.classList.add("abierta"); } else velo.classList.remove("abierto");
  }
  $("conf-no").addEventListener("click", noConfirmar);
  $("conf-si").addEventListener("click", function () {
    conf.classList.remove("abierto"); cerrarCapa(capaConf); velo.classList.remove("abierto");
    if (celu()) cerrar();
    poner("sin");
    toast("Desvinculados: cada uno sigue en su pantalla", { icon: "unlink" });
  });

  /* ---------- Los botones del detalle ---------- */
  function hacer(id) {
    var c = celu();
    if (id === "cerrar") return cerrar();
    if (id === "vincular") return c ? abrirCamara() : mostrarCodigo();
    if (id === "desconectar") { poner("desconectado"); toast(c ? "Desconectados: cada uno por su lado" : "Desconectados: cada uno sigue por su lado", { icon: "unplug" }); return; }
    if (id === "reconectar") { poner("directo"); toast(c ? "Reconectados: fuiste a la pantalla de la compu" : "Reconectados: el celular vino a esta pantalla"); return; }
    if (id === "desvincular") return confirmar();
    if (id === "probar" && !probando) {
      /* La espera se ve recién a los 300 ms (00 · R7.1, R7.2) */
      probando = true; fallo = false;
      var marca = setTimeout(function () { esperaVisible = true; pintarDetalle(estado); }, 300);
      intentos++;
      var ok = intentos % 2 === 0; /* E19: la primera vez no se puede, la segunda sí */
      setTimeout(function () {
        clearTimeout(marca); probando = false; esperaVisible = false;
        if (ok) { poner("directo"); toast(c ? "Ahora van directo por el Wi-Fi" : "Ahora van directo por el Wi-Fi del local", { icon: "zap" }); vibrar([10, 40, 10]); }
        else { fallo = true; pintarDetalle(estado); var f = $("fallo"); if (f) f.classList.add("sacude"); vibrar(30); }
      }, 1600);
    }
  }
  det.addEventListener("click", function (e) { var b = e.target.closest("[data-a]"); if (b) hacer(b.getAttribute("data-a")); });

  /* ---------- El teclado (computadora): Alt muestra las teclas; Alt + letra; Esc cierra ---------- */
  function visible(el) { return el.offsetParent !== null || getComputedStyle(el).position === "fixed"; }
  document.addEventListener("keydown", function (e) {
    if (celu()) { if (e.key === "Escape") { cerrarCamara(); cerrar(); } return; }
    if (e.key === "Alt") { body.classList.add("alt"); e.preventDefault(); return; }
    if (e.altKey && e.key.length === 1) {
      var k = e.key.toLowerCase();
      /* Alt L abre y cierra el detalle, también con el detalle abierto */
      if (k === "l" && !conf.classList.contains("abierto")) {
        e.preventDefault();
        if (abierta()) cerrar(); else { abrir(); setTimeout(function () { var b = det.querySelector("[data-a]:not([data-a=cerrar])"); if (b) b.focus(); }, 60); }
        return;
      }
      var raiz = document.querySelector(".capa-arriba") || document;
      var el = Array.prototype.find.call(raiz.querySelectorAll('[data-key="' + k + '"]'), visible);
      if (el) { e.preventDefault(); el.click(); }
      return;
    }
    if (e.key === "Escape") {
      if (conf.classList.contains("abierto")) return noConfirmar();
      if (abierta()) return ficha.classList.contains("codigo") ? volverDelCodigo() : cerrar();
    }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") { body.classList.remove("alt"); e.preventDefault(); } });
  window.addEventListener("blur", function () { body.classList.remove("alt"); });

  /* ---------- Tostada y vibración ---------- */
  var caja;
  function toast(msg, opts) {
    opts = opts || {};
    if (!caja) { caja = document.createElement("div"); caja.className = "tostadas"; caja.setAttribute("role", "status"); body.appendChild(caja); }
    caja.innerHTML = "";
    var t = document.createElement("div");
    t.className = "tostada";
    t.innerHTML = '<i class="i" data-i="' + (opts.icon || "circle-check") + '"></i><span>' + msg + "</span>";
    caja.appendChild(t);
    window.pintarIconos(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add("ver"); }); });
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { t.classList.remove("ver"); }, 3200);
  }
  function vibrar(p) { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) { /* sin vibración */ } }

  /* ---------- Selector de la maqueta (fuera del diseño): cada estado sin esperar que pase ---------- */
  var demo;
  function armarDemo() {
    demo = document.createElement("div");
    demo.className = "demo";
    var h = '<button type="button" class="demo-asa" aria-label="Elegir el estado (solo en la maqueta)"><i class="i" data-i="sliders-horizontal"></i></button><div class="demo-panel"><p>Maqueta · estado</p>';
    ORDEN.forEach(function (k) { h += '<button type="button" data-s="' + k + '"></button>'; });
    demo.innerHTML = h + "</div>";
    body.appendChild(demo);
    window.pintarIconos(demo);
    demo.querySelector(".demo-asa").addEventListener("click", function () { demo.classList.toggle("abierta"); });
    demo.querySelectorAll("[data-s]").forEach(function (b) { b.addEventListener("click", function () { fallo = false; poner(b.getAttribute("data-s")); }); });
  }
  function syncDemo() {
    if (!demo) return;
    var st = estados();
    demo.querySelectorAll("[data-s]").forEach(function (b) { var k = b.getAttribute("data-s"); b.textContent = st[k].label; b.setAttribute("aria-pressed", String(k === estado)); });
  }

  /* Al cruzar el corte de 900 px cambian los textos (00 · R3.2) y la forma del detalle */
  angosto.addEventListener("change", function () {
    if (!celu()) velo.classList.toggle("abierto", conf.classList.contains("abierto"));
    else if (abierta()) velo.classList.add("abierto");
    pintar();
  });

  body.setAttribute("data-link", estado);
  armarDemo();
  window.pintarIconos(document);
  pintar();
  if (new URLSearchParams(location.search).get("abierto") !== "no") setTimeout(abrir, 350);
})();
