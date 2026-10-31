/* Variante 3, «El llavero»: el comportamiento, igual en la computadora y en el celular. */
(function () {
  var D = window.NP, $ = function (id) { return document.getElementById(id); };
  var celu = !!document.querySelector(".celu");
  var timers = [], tick = null, state = "";

  // La tienen: cada persona una vez, con su rol; las que pueden darla, marcadas
  var seen = {}, faces = [];
  D.holders.forEach(function (h) { h.people.forEach(function (p) { if (!seen[p]) { seen[p] = h.name; faces.push(p); } }); });
  var show = celu ? faces.slice(0, 4) : faces;
  $("caras").innerHTML = show.map(function (id) {
    var p = D.people[id], gives = D.givers.indexOf(id) >= 0;
    return '<span class="cara-n' + (gives ? " da" : "") + '" title="' + p.name + " · " + seen[id] + '">' + D.face(id) + p.name.split(" ")[0] + (gives && !celu ? " <small>te la da</small>" : "") + "</span>";
  }).join("") + (celu && faces.length > 4 ? '<span class="cara-n" style="padding:0 12px">+' + (faces.length - 4) + "</span>" : "");

  $("puertas").innerHTML = D.mine.slice(0, celu ? 3 : 4).map(function (m, i) {
    return '<button class="puerta' + (i === 0 ? " primera" : "") + '" data-door="' + m.ir + '">' +
      '<span class="ic"><i class="i i-l" data-i="' + m.icon + '"></i></span>' +
      '<span style="min-width:0"><b>' + m.name + '</b><span class="d">' + m.detail + "</span></span>" +
      '<span class="der-p">' + (i === 0 ? '<span class="anillo" id="anillo"><svg viewBox="0 0 32 32"><circle class="f" cx="16" cy="16" r="13"/><circle class="v" cx="16" cy="16" r="13"/></svg><b id="seg">6</b></span>' : "") +
      (celu ? "" : '<span class="kbd">' + (i + 1) + "</span>") + '<i class="i" data-i="arrow-right"></i></span></button>';
  }).join("");
  $("mis-llaves").innerHTML = '<span>Tus llaves:</span>' + D.keys.map(function (k) { return '<span class="k"><i class="i" data-i="key-round"></i>' + k + "</span>"; }).join("");
  window.pintarIconos(document.body);

  function clear() { timers.forEach(clearTimeout); timers = []; clearInterval(tick); }
  function drawRing(lost) { $("llavero").innerHTML = D.keyring({ lost: lost }) + '<div class="tag-falta" style="transition:opacity 600ms var(--curva) 600ms' + (lost ? ';opacity:0' : '') + '"><span class="chip-llave"><i class="i i-s" data-i="key-round"></i>Falta: Ver las personas</span></div>'; window.pintarIconos($("llavero")); }
  function resetAsk() { $("pedir").hidden = false; $("pedir").classList.remove("cargando"); $("pedida").classList.remove("ver"); }
  function retext(t, lead) {
    $("t").innerHTML = t; $("lead").innerHTML = lead;
    [$("t"), $("lead")].forEach(function (el) { el.classList.remove("entra-t"); void el.offsetWidth; el.classList.add("entra-t"); });
  }
  function ring(on) {
    var a = $("anillo"); if (!a) return;
    a.classList.toggle("ver", on); a.classList.remove("corre");
    if (!on) return;
    void a.offsetWidth; a.classList.add("corre");
    var n = 6; $("seg").textContent = n;
    tick = setInterval(function () { n--; $("seg").textContent = Math.max(n, 0); if (n <= 0) { clearInterval(tick); enter(document.querySelector(".puerta.primera")); } }, 1000);
  }

  // Entrar por una puerta: la puerta crece, el llavero se va
  function enter(btn) {
    if (!btn || state === "entrando") return;
    clear(); state = "entrando";
    btn.classList.add("entrando"); $("escena").classList.add("saliendo");
    STAGE.vibrate(10);
    setTimeout(function () { if (window.irAMaqueta) window.irAMaqueta(btn.getAttribute("data-door")); }, 360);
  }

  window.ESCENAS = {
    direccion: function () {
      clear(); state = "sin"; resetAsk(); $("escena").classList.remove("saliendo"); ring(false);
      $("antes").hidden = true;
      $("pre").hidden = false;
      drawRing(false);
      retext("Te falta una llave", 'No tenés permiso para Usuarios: hace falta <span class="chip-llave">Ver las personas</span>.');
    },
    perdido: function () {
      clear(); state = "usando"; resetAsk(); $("escena").classList.remove("saliendo"); ring(false);
      $("pre").hidden = true;
      drawRing(true);
      retext("Tus llaves", "Estabas en Usuarios.");
      var a = $("antes"); a.hidden = false; a.classList.remove("se-hunde");
      timers.push(setTimeout(function () {
        state = "perdido";
        a.classList.add("se-hunde");                          // Usuarios se hunde y queda el llavero
        timers.push(setTimeout(function () { a.hidden = true; }, 440));
        timers.push(setTimeout(function () {
          document.querySelector(".llavero").classList.add("cayo");   // la llave se suelta y cae
          document.querySelector(".tag-falta").style.opacity = 1;
          STAGE.vibrate([10, 40, 10]);
          retext("Graciela se llevó una llave", 'Ya no tenés permiso para Usuarios: te sacó «Encargado de turno», que te daba <span class="chip-llave">Ver las personas</span>. Tu venta sigue como la dejaste.');
          ring(true);
        }, 700));
      }, 1400));
    }
  };

  // Mantener para pedirla (900 ms). Con el teclado: mantener P.
  var hold = null, btn = $("pedir");
  function start() {
    if (hold || state === "entrando") return;
    clearInterval(tick); var an = $("anillo"); if (an) an.classList.remove("ver");
    btn.classList.remove("cargando"); void btn.offsetWidth; btn.classList.add("cargando");
    hold = setTimeout(done, 900);
  }
  function stop() { if (!hold) return; clearTimeout(hold); hold = null; btn.classList.remove("cargando"); }
  function done() {
    hold = null; btn.hidden = true; $("pedida").classList.add("ver");
    STAGE.vibrate([10, 40, 10]);
    var llave = document.querySelector(".llave.hueco:not(.tarde), .llave.tarde");
    if (llave) llave.style.animationPlayState = "paused";
  }
  btn.addEventListener("pointerdown", function (e) { e.preventDefault(); start(); });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { btn.addEventListener(ev, stop); });
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    if (k === "p" && !e.repeat && !btn.hidden) { start(); }
    else if (/^[1-4]$/.test(k)) { var d = document.querySelectorAll(".puerta")[+k - 1]; if (d) enter(d); }
    else if (e.key === "Enter" || e.key === "Escape") { if (document.activeElement && document.activeElement.classList.contains("puerta")) return; e.preventDefault(); enter(document.querySelector(".puerta.primera")); }
  });
  document.addEventListener("keyup", function (e) { if ((e.key || "").toLowerCase() === "p") stop(); });
  $("puertas").addEventListener("click", function (e) { var d = e.target.closest(".puerta"); if (d) enter(d); });
})();
