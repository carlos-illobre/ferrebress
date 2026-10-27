/* La entrada, funcionando con datos inventados: los estados, el QR que se renueva, las hojas,
   Google y la huella simulados, y el teclado de la computadora. Sin servidor ni lógica de verdad. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var phoneMq = window.matchMedia("(max-width: 899px)");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var isPhone = function () { return phoneMq.matches; };
  var wait = function (ms) { return reduced.matches ? Math.min(ms, 400) : ms; };

  function icon(name, extra) {
    return '<svg class="i ' + (extra || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + window.ICONOS[name] + "</svg>";
  }

  // ---------- Los estados ----------
  var STATES = [
    { id: "normal", label: "Normal", on: "both" },
    { id: "bluetooth", label: "Con Bluetooth", on: "desktop" },
    { id: "no-autorizada", label: "Cuenta no autorizada", on: "both" },
    { id: "sin-conexion", label: "Sin conexión", on: "both" },
    { id: "intentos", label: "Demasiados intentos", on: "both" },
    { id: "sesion-cerrada", label: "Sesión cerrada desde otro dispositivo", on: "both" },
    { id: "ofrecer-huella", label: "¿Entrar con la huella la próxima vez?", on: "phone" },
    { id: "leer-codigo", label: "Leyó el QR de una computadora", on: "phone" },
    { id: "otra-red", label: "Leyó el QR desde otra red", on: "phone" }
  ];
  var DENIED_EMAIL = "cuenta.prueba@gmail.com";
  var state = "normal";
  var limitTimer = null;
  var select = $("#state-select");

  function available(s) { return s.on === "both" || s.on === (isPhone() ? "phone" : "desktop"); }

  function fillSelect() {
    select.textContent = "";
    STATES.filter(available).forEach(function (s) {
      var o = document.createElement("option"); o.value = s.id; o.textContent = s.label; select.appendChild(o);
    });
    select.value = state;
  }

  function setNotice(kind, iconName, html) {
    var n = $("#notice");
    n.className = "notice notice-main " + kind;
    n.innerHTML = icon(iconName) + "<p>" + html + "</p>";
  }

  function fmt(sec) { return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }

  function setState(id, fromUser) {
    var s = STATES.filter(function (x) { return x.id === id; })[0];
    if (!s || !available(s)) id = "normal";
    closeAll(true);
    clearInterval(limitTimer);
    state = id;
    var bodyState = (id === "ofrecer-huella" || id === "leer-codigo" || id === "otra-red") ? "normal" : id;
    document.body.dataset.state = bodyState;
    select.value = id;

    if (id === "no-autorizada") setNotice("error", "ban", "Esta cuenta (" + DENIED_EMAIL + ") no está autorizada. Pedile a un Administrador que agregue tu correo.");
    if (id === "sin-conexion") setNotice("warn", "wifi-off", "<strong>Para entrar hace falta internet</strong>Cuando vuelva la conexión, los botones se prenden solos.");
    if (id === "intentos") {
      var left = 45;
      var paint = function () { setNotice("warn", "clock", "<strong>Demasiados intentos seguidos</strong>Podés volver a probar en <b>" + fmt(left) + "</b>."); };
      paint();
      limitTimer = setInterval(function () { left -= 1; if (left <= 0) { setState("normal", true); } else paint(); }, 1000);
    }

    // Lo apagado: sin conexión, todo; con demasiados intentos, Google y la huella.
    var tokens = id === "sin-conexion" ? ["offline"] : id === "intentos" ? ["limit"] : [];
    $$("[data-off-when]").forEach(function (b) {
      var off = b.getAttribute("data-off-when").split(" ").some(function (t) { return tokens.indexOf(t) >= 0; });
      b.classList.toggle("off", off); b.disabled = off;
    });
    $("#net").textContent = id === "sin-conexion" ? "Sin conexión" : "En línea";
    if (id !== "sin-conexion") restartQr();

    var url = new URL(location.href);
    if (id === "normal") url.searchParams.delete("estado"); else url.searchParams.set("estado", id);
    history.replaceState(null, "", url);

    if (id === "ofrecer-huella") openOffer();
    if (id === "leer-codigo") openQrSheet();
    if (id === "otra-red") openQrSheet("other-network");
    clearMark();
  }

  select.addEventListener("change", function () { setState(select.value, true); select.blur(); });
  phoneMq.addEventListener("change", function () { fillSelect(); setState(available(STATES.filter(function (x) { return x.id === state; })[0]) ? state : "normal"); });

  // ---------- El QR: cambia cada 60 s y sirve una vez ----------
  var QR_N = 29, QR_SECONDS = 60, qrLeft = QR_SECONDS, qrTimer = null;
  function drawQr() {
    var seed = Math.floor(Math.random() * 1e9);
    var rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    var m = [], r, c;
    for (r = 0; r < QR_N; r++) { m.push([]); for (c = 0; c < QR_N; c++) m[r].push(null); }
    function finder(r0, c0) {
      for (var y = -1; y <= 7; y++) for (var x = -1; x <= 7; x++) {
        var rr = r0 + y, cc = c0 + x;
        if (rr < 0 || cc < 0 || rr >= QR_N || cc >= QR_N) continue;
        var ring = Math.max(Math.abs(y - 3), Math.abs(x - 3));
        m[rr][cc] = y >= 0 && y <= 6 && x >= 0 && x <= 6 && ring !== 2;
      }
    }
    finder(0, 0); finder(0, QR_N - 7); finder(QR_N - 7, 0);
    for (var i = 8; i < QR_N - 8; i++) { m[6][i] = i % 2 === 0; m[i][6] = i % 2 === 0; }
    for (var y = -2; y <= 2; y++) for (var x = -2; x <= 2; x++) { var ring = Math.max(Math.abs(y), Math.abs(x)); m[22 + y][22 + x] = ring !== 1; }
    var d = "";
    for (r = 0; r < QR_N; r++) for (c = 0; c < QR_N; c++) {
      if (m[r][c] === null) m[r][c] = rnd() < 0.5;
      if (m[r][c]) d += "M" + c + " " + r + "h1v1h-1z";
    }
    $("#qr-svg").innerHTML = '<path fill="#17312b" d="' + d + '"/>';
  }
  function paintCount() {
    $("#qr-time").textContent = fmt(qrLeft);
    $("#ring").style.setProperty("--parte", String(qrLeft / QR_SECONDS));
  }
  function swapQr() {
    var svg = $("#qr-svg");
    svg.classList.add("swap");
    setTimeout(function () { drawQr(); svg.classList.remove("swap"); }, wait(260));
  }
  function restartQr() {
    qrLeft = QR_SECONDS; paintCount();
    clearInterval(qrTimer);
    qrTimer = setInterval(function () {
      if (document.body.dataset.state === "sin-conexion") return;
      qrLeft -= 1;
      if (qrLeft <= 0) { qrLeft = QR_SECONDS; swapQr(); }
      paintCount();
    }, 1000);
  }

  // ---------- Lo que se abre encima ----------
  var stack = [];
  var scrim = $("#scrim");
  function open(el, opts) {
    opts = opts || {};
    if (stack.indexOf(el) >= 0) return;
    stack.push(el);
    if (opts.scrim !== false) { scrim.hidden = false; void scrim.offsetWidth; scrim.classList.add("open"); }
    el.hidden = false; void el.offsetWidth; el.classList.add("open");
    var first = $("[data-mark], button", el);
    if (first && !isPhone()) setTimeout(function () { first.focus({ preventScroll: true }); }, 30);
    clearMark();
  }
  function close(el, instant) {
    var i = stack.indexOf(el);
    if (i < 0) return;
    stack.splice(i, 1);
    el.classList.remove("open");
    var finish = function () { el.hidden = true; };
    if (instant) finish(); else setTimeout(finish, wait(220));
    var needScrim = stack.some(function (l) { return l.dataset.scrim !== "no"; });
    if (!needScrim) { scrim.classList.remove("open"); if (instant) scrim.hidden = true; else setTimeout(function () { if (!scrim.classList.contains("open")) scrim.hidden = true; }, wait(220)); }
    if (el.id === "sheet-offer" || el.id === "sheet-qr") { if (state === "ofrecer-huella" || state === "leer-codigo" || state === "otra-red") { state = "normal"; select.value = "normal"; var u = new URL(location.href); u.searchParams.delete("estado"); history.replaceState(null, "", u); } }
  }
  function closeAll(instant) { stack.slice().reverse().forEach(function (l) { close(l, instant); }); $("#qr").classList.remove("read"); }
  function top() { return stack[stack.length - 1] || null; }
  scrim.addEventListener("click", function () { var t = top(); if (t && t.id !== "done") close(t); });
  $$("[data-close]").forEach(function (b) { b.addEventListener("click", function () { close(b.closest(".layer")); }); });
  $("#camera").dataset.scrim = "no";
  $("#done").dataset.scrim = "no";

  function step(layer, name) { $$("[data-step]", layer).forEach(function (s) { s.classList.toggle("on", s.dataset.step === name); }); }

  // Entrando… → entró. En la aplicación se llega al marco; acá vuelve a la entrada.
  function signedIn(text, then) {
    var d = $("#done");
    d.classList.remove("ok"); $("#done-text").textContent = "Entrando…";
    open(d, { scrim: false });
    setTimeout(function () {
      d.classList.add("ok"); $("#done-text").textContent = text || "Entraste";
      setTimeout(function () { close(d); if (then) then(); }, wait(1400));
    }, wait(1000));
  }

  // ---------- Google ----------
  $("#google").addEventListener("click", function () { open($("#picker")); });
  $$("[data-account]").forEach(function (b) {
    b.addEventListener("click", function () {
      var ok = b.dataset.account === "ok";
      close($("#picker"));
      if (!ok) { setTimeout(function () { setState("no-autorizada", true); }, wait(240)); return; }
      if (state === "no-autorizada" || state === "sesion-cerrada") setState("normal", true);
      if (isPhone()) {
        // Primera vez con Google en este celular: se ofrece la huella, una sola vez (R2.2).
        var d = $("#done");
        d.classList.remove("ok"); $("#done-text").textContent = "Entrando…";
        open(d, { scrim: false });
        setTimeout(function () { close(d); setState("ofrecer-huella", true); }, wait(1000));
      } else signedIn("Entraste");
    });
  });

  // ---------- La huella (celular) ----------
  function touchReader(layer, after) {
    var t = $(".sheet-step.on [data-touch], :scope > [data-touch]", layer) || $("[data-touch]", layer);
    $$("[data-touch]", layer).forEach(function (b) {
      b.onclick = function () {
        b.classList.add("reading");
        setTimeout(function () { b.classList.remove("reading"); after(); }, wait(700));
      };
    });
    return t;
  }
  $("#finger").addEventListener("click", function () {
    var s = $("#sheet-finger");
    touchReader(s, function () { close(s); setTimeout(function () { signedIn("Entraste"); }, wait(220)); });
    open(s);
  });

  function openOffer() {
    var s = $("#sheet-offer");
    step(s, "ask");
    $("[data-yes]", s).onclick = function () { step(s, "touch"); };
    touchReader(s, function () { step(s, "done"); });
    open(s);
  }

  // ---------- Escanear el código de la computadora (celular) ----------
  // En otra red que la computadora, no hay huella: solo el aviso del Wi-Fi.
  function openQrSheet(name) {
    var s = $("#sheet-qr");
    step(s, name || "ask");
    touchReader(s, function () { step(s, "done"); });
    open(s);
  }
  $("#scan").addEventListener("click", function () {
    var cam = $("#camera");
    open(cam, { scrim: false });
    setTimeout(function () {
      if (stack.indexOf(cam) < 0) return;
      close(cam);
      state = "leer-codigo"; select.value = state;
      openQrSheet();
    }, wait(1800));
  });

  // ---------- Con Bluetooth: la ventana del navegador (computadora) ----------
  $("#bt-button").addEventListener("click", function () {
    var dlg = $("#bt-dialog");
    step(dlg, "choose");
    open(dlg);
  });
  $("#bt-phone").addEventListener("click", function () {
    var dlg = $("#bt-dialog");
    step(dlg, "wait");
    var f = $('[data-step="wait"] [data-close]', dlg); if (f && !isPhone()) f.focus();
    setTimeout(function () {
      if (stack.indexOf(dlg) < 0) return;
      close(dlg); signedIn("Entraste");
    }, wait(2400));
  });

  // ---------- Simular que el celular lee el QR (computadora) ----------
  $("#sim-read").addEventListener("click", function () {
    var st = document.body.dataset.state;
    if (st === "sin-conexion" || st === "bluetooth" || stack.length) return;
    var q = $("#qr");
    q.classList.add("read");
    setTimeout(function () {
      signedIn("Entraste", function () { q.classList.remove("read"); drawQr(); restartQr(); });
    }, wait(1800));
  });

  // ---------- Teclado (computadora): la marca, Enter, Esc y Alt ----------
  var marked = null;
  function scope() { return top() || $(".card"); }
  function visible(el) { return el.getClientRects().length > 0 && !el.disabled && !el.closest("[hidden]"); }
  function clearMark() { if (marked) marked.classList.remove("marked"); marked = null; }
  function mark(el) { clearMark(); marked = el; el.classList.add("marked"); el.focus({ preventScroll: true }); }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Alt") { document.body.classList.add("show-keys"); e.preventDefault(); return; }
    if (e.target === select) return;
    if (e.altKey && /^(Key|Digit)/.test(e.code)) {
      var k = e.code.replace(/^(Key|Digit)/, "").toLowerCase();
      var b = $$('[data-key="' + k + '"]', scope()).filter(visible)[0];
      if (b) { e.preventDefault(); b.click(); }
      return;
    }
    if (e.key === "Escape") {
      var t = top();
      if (t && t.id !== "done") close(t); else clearMark();
      return;
    }
    if (isPhone()) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var items = $$("[data-mark]", scope()).filter(visible);
      if (!items.length) return;
      e.preventDefault();
      var i = items.indexOf(marked);
      i = i < 0 ? 0 : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      mark(items[i]);
      return;
    }
    if (e.key === "Enter" && marked && visible(marked)) { e.preventDefault(); marked.click(); }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") { document.body.classList.remove("show-keys"); e.preventDefault(); } });
  window.addEventListener("blur", function () { document.body.classList.remove("show-keys"); });
  document.addEventListener("mousedown", clearMark);
  document.addEventListener("mousemove", function (e) { if (marked && (e.movementX || e.movementY)) clearMark(); });

  // ---------- Al abrir ----------
  drawQr();
  fillSelect();
  setState(new URLSearchParams(location.search).get("estado") || "normal");
})();
