/* Variante 2 · La isla: comportamiento compartido por la computadora y el celular. */
(function () {
  var P = V.isPhone;
  var isla = document.getElementById("isla"), pill = document.getElementById("pill"), aviso = document.getElementById("aviso"), card = document.getElementById("card");
  var vista = "detalle", probando = false, fallo = false, seed = 11, left = 60, qrT, camT, avisoT;
  var CORTO = { esperando: "Esperando", sininternet: "Sin internet" };
  var AVISO = {
    directo: { t: "Directo", d: P ? "Fuiste a la pantalla de la compu" : "El celular vino a esta pantalla", i: "wifi" },
    servidor: { t: "Por el servidor", d: "La red no deja la directa", i: "cloud", a: "probar", al: "Probar" },
    desconectado: { t: "Desconectado", d: "Cada uno por su lado", i: "unplug", a: "reconectar", al: "Reconectar" },
    esperando: { t: V.STATES.esperando.label, d: "Se encuentran solos al volver", i: "clock" },
    sininternet: { t: "Sin internet", d: "Se encuentran cuando vuelva", i: "wifi-off" },
    sin: { t: "Sin vincular", d: "Cada uno sigue en su pantalla", i: "unlink", a: "vincular", al: P ? "Leer código" : "Vincular" }
  };

  function paintPill(s) {
    var st = V.STATES[s];
    pill.innerHTML = '<span class="dot" data-tone="' + st.tone + '"></span><span>' + (P ? (CORTO[s] || st.label) : st.label) + "</span>" +
      (V.ROUTE[s] && !P ? '<span class="sub">' + V.ROUTE[s].ms + " ms</span>" : "") +
      '<span class="dev"><i class="i i-s" data-i="' + (P ? "monitor" : "smartphone") + '"></i></span>' + (P ? "" : '<span class="kbd">Alt L</span>');
    pintarIconos(pill);
  }

  /* El día en una tira: de 8 a ahora (10:42), con el tramo de ahora en el color del estado */
  function hoy(s) {
    var col = { directo: "v", servidor: "a", desconectado: "g", esperando: "g", sininternet: "r", sin: "g" }[s];
    if (s === "sin") return "";
    return '<div class="hoy"><div class="et"><span>Hoy juntos <b>2 h 17 min</b></span><span>92 % directo</span></div>' +
      '<div class="tira"><i class="v" style="left:8%;width:46%"></i><i class="g" style="left:55%;width:6%"></i><i class="a" style="left:62%;width:10%"></i><i class="v" style="left:73%;width:15%"></i><i class="' + col + '" style="left:89%;width:11%"></i></div>' +
      '<div class="horas"><span>8:00</span><span>9:00</span><span>10:00</span><span>Ahora</span></div></div>';
  }

  function ctl(id, cls, icon, label, sub, key, dis) {
    return '<button class="ctl ' + cls + '" data-c="' + id + '"' + (dis ? " disabled" : "") + '><span class="llena"></span><span class="ctl-c"><i class="i i-l" data-i="' + icon + '"></i></span><b>' + label + "</b><small>" + sub + "</small>" + (P || dis ? "" : '<span class="kbd">' + key + "</span>") + "</button>";
  }

  function paintCard(s) {
    var st = V.STATES[s], h = "", linked = V.linked(s);
    var tit = vista === "codigo" ? (P ? "Leer el código" : "Vincular el celular") : vista === "reemplazar" ? "¿Reemplazar?" : st.label;
    h += '<div class="fila1">' + (vista === "detalle" ? '<span class="dot" data-tone="' + st.tone + '"></span>' : "") + '<span class="titulo">' + tit + "</span>" +
      '<button class="btn chico btn-icono" data-c="cerrar" aria-label="Cerrar"><i class="i i-s" data-i="x"></i></button>' + (P ? "" : '<span class="kbd">Esc</span>') + "</div>";
    if (vista === "detalle") h += '<p class="frase">' + V.text(s) + "</p>";
    if (vista === "codigo") { h += P ? camView() : codeView(); card.innerHTML = h; pintarIconos(card); return; }
    if (vista === "reemplazar") {
      h += '<div class="aviso-isla"><i class="i" data-i="triangle-alert"></i><span>Este celular está vinculado a ' + V.FACTS.con + ". ¿Reemplazar?</span></div>" +
        '<div class="pie-isla"><button class="btn btn-fantasma" data-c="no">Cancelar</button><button class="btn btn-accion" data-c="reemplazar">Reemplazar</button></div>';
      card.innerHTML = h; pintarIconos(card); return;
    }
    h += '<div class="ruta-caja">' + V.route(s) + "</div>";
    if (fallo && s === "servidor") h += '<div class="aviso-isla sacude"><i class="i" data-i="triangle-alert"></i><span>No se pudo: la red sigue sin dejar. Siguen por el servidor.</span></div>';
    var espejoOn = linked && s !== "desconectado";
    h += '<div class="ctls">' +
      ctl("espejo", espejoOn ? "on" : "", espejoOn ? "plug-zap" : "unplug", "Espejo", !linked ? "—" : espejoOn ? "Conectado" : "Desconectado", espejoOn ? "D" : "R", !linked) +
      ctl("directo", s === "directo" ? "on" : s === "servidor" ? "ambar" : "", probando ? "refresh-cw" : "zap", s === "servidor" ? (probando ? "Probando" : "Probar") : "Directo", s === "directo" ? "Por Wi-Fi" : s === "servidor" ? "conexión directa" : "—", "P", s !== "servidor" && s !== "directo") +
      ctl("vincular", s === "sin" ? "naranja" : "", P ? "scan-qr-code" : "qr-code", P ? "Leer" : "Vincular", P ? "el código" : "el celular", "V", false) +
      ctl("desvincular", "rojo", "unlink", "Desvincular", P ? "mantené apretado" : "mantené X", "X", !linked) +
      "</div>";
    h += '<div class="mantener" id="mantener">' + "" + "</div>";
    h += hoy(s);
    if (linked) h += '<div class="datos-l"><span><i class="i i-s" data-i="' + (P ? "monitor" : "smartphone") + '"></i><b>' + V.FACTS.con + '</b></span><span><i class="i i-s" data-i="calendar"></i>' + V.FACTS.desdeCorto + '</span><span><i class="i i-s" data-i="timer"></i>' + V.FACTS.duraCorto + "</span></div>";
    card.innerHTML = h;
    pintarIconos(card);
    if (probando) card.querySelector('[data-c="directo"] .ctl-c svg').classList.add("gira");
    requestAnimationFrame(function () { V.fitRoute(card); });
  }

  function codeView() {
    return '<div class="cod"><div class="qr" id="qr">' + V.qr(seed, "#121513") + '<span class="iso"><img src="../../../../common/brand/isotype.svg" alt=""></span><span class="ok"><i class="i i-xl" data-i="check"></i></span></div>' +
      "<div><ol><li>En el celular, con tu misma cuenta, tocá la isla de arriba.</li><li>Tocá «Leer» y apuntá acá.</li><li>Listo: el celular viene a esta pantalla.</li></ol>" +
      (V.linked() ? '<div class="aviso-isla"><i class="i" data-i="triangle-alert"></i><span>Si lo lee otro celular, reemplaza a ' + V.FACTS.con + ".</span></div>" : "") +
      '<div class="anillo"><span>Se renueva en <b id="cuenta">1:00</b></span><span class="riel"><b id="riel"></b></span></div>' +
      '<button class="simular" data-c="leido">Maqueta: el celular leyó el código</button></div></div>';
  }
  function camView() {
    return '<div class="visor-isla" id="visor"><div class="fondo"></div><div class="mon"><div>' + V.qr(5) + '</div></div><div class="esq"><i></i><i></i><i></i><i></i></div><div class="leyenda">Apuntá al código de la computadora</div></div>' +
      '<div class="pie-isla" style="grid-template-columns:1fr"><button class="btn btn-fantasma" data-c="volver">Cancelar</button></div>';
  }

  function render() { paintPill(V.get()); paintCard(V.get()); }

  function openIsla() { isla.classList.add("abierta"); aviso.classList.remove("ver"); requestAnimationFrame(function () { V.fitRoute(card); }); }
  function closeIsla() { isla.classList.remove("abierta"); setVista("detalle"); }
  function isOpen() { return isla.classList.contains("abierta"); }
  pill.onclick = openIsla;
  aviso.addEventListener("click", function (e) { if (!e.target.closest("[data-c]")) openIsla(); });
  document.addEventListener("mousedown", function (e) { if (isOpen() && !isla.contains(e.target) && !e.target.closest(".demo")) closeIsla(); });

  function setVista(v) {
    vista = v; clearInterval(qrT); clearTimeout(camT);
    paintCard(V.get());
    if (v === "codigo" && !P) {
      left = 60;
      qrT = setInterval(function () {
        left--; if (left <= 0) { left = 60; seed++; var q = document.getElementById("qr"); q.querySelector("svg").outerHTML = V.qr(seed, "#121513"); }
        document.getElementById("cuenta").textContent = "0:" + String(left).padStart(2, "0");
        document.getElementById("riel").style.transform = "scaleX(" + (left / 60) + ")";
      }, 1000);
    }
    if (v === "codigo" && P) {
      camT = setTimeout(function () {
        document.getElementById("visor").classList.add("leido"); V.vibrate([10, 40, 10]);
        camT = setTimeout(function () { if (V.linked()) setVista("reemplazar"); else linkOk(); }, 700);
      }, 1900);
    }
  }

  function linkOk(name) {
    if (name) V.FACTS.con = name;
    vista = "detalle"; clearInterval(qrT); clearTimeout(camT);
    isla.classList.remove("abierta");
    if (V.get() === "directo") V.set("sin", "x");
    V.set("directo", "vinculo");
  }

  /* El aviso vivo */
  function live(s) {
    var a = AVISO[s];
    aviso.innerHTML = '<span class="ic"><i class="i" data-i="' + a.i + '"></i></span><span class="txt"><b>' + a.t + "</b><small>" + a.d + "</small></span>" + (a.a ? '<button class="btn chico btn-accion" data-c="' + a.a + '">' + a.al + "</button>" : "");
    pintarIconos(aviso);
    aviso.classList.add("ver");
    clearTimeout(avisoT);
    avisoT = setTimeout(function () { aviso.classList.remove("ver"); }, 3200);
    V.vibrate(10);
  }

  V.on(function (s, prev, why) {
    if (s !== "servidor") fallo = false;
    render();
    if (why !== "inicio" && why !== "x" && !isOpen()) live(s);
  });

  /* Mantener apretado para desvincular: en vez de una pregunta */
  var holdT;
  function holdStart(el) {
    el.classList.add("manteniendo");
    document.getElementById("mantener").textContent = "Seguí apretando para desvincular…";
    holdT = setTimeout(function () { el.classList.remove("manteniendo"); V.vibrate([10, 40, 10]); V.set("sin", "x"); closeIsla(); live("sin"); }, 1200);
  }
  function holdEnd() {
    clearTimeout(holdT);
    var el = card.querySelector(".ctl.manteniendo");
    if (el) { el.classList.remove("manteniendo"); document.getElementById("mantener").textContent = "Mantené apretado para desvincular"; }
  }
  card.addEventListener("pointerdown", function (e) { var b = e.target.closest('[data-c="desvincular"]'); if (b && !b.disabled) holdStart(b); });
  window.addEventListener("pointerup", holdEnd);
  window.addEventListener("pointercancel", holdEnd);

  function act(c) {
    var s = V.get();
    if (c === "cerrar") return closeIsla();
    if (c === "espejo") { if (s === "desconectado") V.set("directo"); else V.set("desconectado"); return; }
    if (c === "reconectar") { V.set("directo"); return; }
    if (c === "vincular") { if (!isOpen()) openIsla(); return setVista("codigo"); }
    if (c === "volver" || c === "no") return setVista("detalle");
    if (c === "leido") { var q = document.getElementById("qr"); q.classList.add("listo"); clearInterval(qrT); setTimeout(function () { linkOk("Chrome en Android"); }, 800); return; }
    if (c === "reemplazar") return linkOk("Edge en Windows");
    if (c === "probar" || (c === "directo" && s === "servidor")) {
      if (probando) return;
      if (!isOpen()) openIsla();
      probando = true; fallo = false; paintCard(s);
      V.probar().then(function (ok) { probando = false; if (ok) { V.set("directo"); } else { fallo = true; paintCard(V.get()); V.vibrate(30); } });
    }
  }
  isla.addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (b && !b.disabled && b.getAttribute("data-c") !== "desvincular") act(b.getAttribute("data-c")); });

  /* Teclado (computadora): Alt L abre; adentro D/R espejo, P probar, V vincular, mantener X desvincular */
  var xDown = false;
  V.keys(function (e) {
    var k = e.key.toLowerCase();
    if (e.altKey && k === "l") { e.preventDefault(); isOpen() ? closeIsla() : openIsla(); return; }
    if (!isOpen()) return;
    if (k === "escape") { vista !== "detalle" ? setVista("detalle") : closeIsla(); return; }
    if (vista !== "detalle") return;
    if (k === "d" || k === "r") act("espejo");
    if (k === "p") act("probar");
    if (k === "v") act("vincular");
    if (k === "x" && !xDown && V.linked()) { xDown = true; holdStart(card.querySelector('[data-c="desvincular"]')); }
  });
  document.addEventListener("keyup", function (e) { if (e.key.toLowerCase() === "x") { xDown = false; holdEnd(); } });

  var q = new URLSearchParams(location.search);
  if (q.get("abierto") !== "no" && !q.get("aviso")) setTimeout(openIsla, 300);
  if (q.get("aviso")) setTimeout(function () { live(V.get()); }, 300);
})();
