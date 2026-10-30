/* Variante 3 · El tablero de llaves: lo que hace la pantalla, igual en la computadora y el celular.
   Cada persona es un llavero colgado de su gancho; cada aparato donde está adentro, una llave.
   Se corta una llave arrastrándola al cajón (o con su menú, o con Supr); un llavero arrastrado al
   cajón se da de baja (con confirmación). La voz es simulada. */
(function () {
  var P = U.people, celu = !!document.querySelector(".celu");
  var $ = function (s) { return document.querySelector(s); };
  var root = celu ? document.querySelector(".celu") : document.body;
  function persona(id) { return P.filter(function (p) { return p.id === id; })[0]; }
  var HOJA = '<svg class="hoja-l" viewBox="0 0 22 42" aria-hidden="true"><path d="M6 0h7v37l-3.5 4L6 37z" fill="var(--laton)" stroke="var(--laton-2)" stroke-width="1.5" stroke-linejoin="round"/><path d="M13 16h5v4h-5M13 25h7v4h-7" fill="var(--laton)" stroke="var(--laton-2)" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  var GANCHO = '<svg class="gancho" viewBox="0 0 28 36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true"><path d="M14 0v20a6 6 0 0 0 6 6"/></svg>';
  var giros = [-2.5, 1.8, -1.2, 2.4, -1.8, 1.2, -2, 2];

  function llave(a) {
    var viejo = a.usoMin >= 43200;
    var uso = a.usoMin === 0 ? '<span class="ya">ahora</span>' : a.usoMin < 15 ? '<span class="ya">' + a.uso.toLowerCase() + "</span>" : viejo ? '<span class="vieja">' + a.uso.toLowerCase() + "</span>" : a.uso.toLowerCase();
    return '<div class="llave' + (viejo ? " oxidada" : "") + '" tabindex="0" role="button" data-dev="' + a.dev + '" aria-label="' + a.disp + ' de ' + U.nombre(a.persona) + '">' +
      '<div class="metal"><span class="cabeza"><i class="i i-s" data-i="' + U.icoDisp(a.tipo) + '"></i></span>' + HOJA + (a.huella ? '<span class="huella-b" title="Con huella"><i class="i i-s" data-i="fingerprint"></i></span>' : "") + "</div>" +
      '<div class="rot"><b>' + a.disp + "</b><span>" + (a.sesion ? U.M[a.sesion.como][0] : "Solo huella") + " · " + uso + "</span></div></div>";
  }
  function tag(p, i) {
    return '<div class="tag" tabindex="0" role="button" data-id="' + p.id + '" style="transform: rotate(' + giros[i % giros.length] + 'deg)">' + (p.vos ? '<span class="vos-p">Vos</span>' : "") +
      U.cara(p, celu ? "" : "g") + '<div class="tn">' + U.nombre(p) + '</div><div class="tc">' + (p.nombre ? p.correo : "sin nombre") + '</div><div class="te' + (p.nunca ? " nunca" : "") + '">' + p.entroCorto + "</div></div>";
  }
  function pintar() {
    var o = U.orden(P), ap = U.aparatos(P), h = "";
    o.vos.concat(o.activas).forEach(function (p, i) {
      var ks = ap.filter(function (a) { return a.persona === p; });
      h += '<div class="llavero" data-id="' + p.id + '">' + GANCHO + tag(p, i) + (ks.length ? '<div class="argolla"></div><div class="llaves">' + ks.map(llave).join("") + "</div>" : "") + "</div>";
    });
    h += '<div class="llavero">' + GANCHO + '<div class="tag nuevo" tabindex="0" role="button" id="nuevo"><i class="i i-l" data-i="plus"></i>Colgar un llavero<span class="kbd">N</span></div></div>';
    $("#tablero").innerHTML = h;
    $("#bajas").innerHTML = o.bajas.length ? o.bajas.map(function (p) { return '<button class="vuelta-t" data-alta="' + p.id + '" title="Dar de alta">' + U.cara(p) + U.nombre(p) + "</button>"; }).join("") : '<span class="t-detalle">Nadie.</span>';
    var cuenta = $("#cuenta"); if (cuenta) { var s = 0, hh = 0; ap.forEach(function (a) { if (a.sesion) s++; if (a.huella) hh++; }); cuenta.textContent = (o.vos.length + o.activas.length) + " llaveros · " + ap.length + " llaves"; }
    U.pintar($("#tablero")); U.pintar($("#bajas"));
  }

  // ---------- Acciones ----------
  function aparato(dev) { return U.aparatos(P).filter(function (a) { return a.dev === dev; })[0]; }
  function cortar(dev, que) {
    var a = aparato(dev); if (!a) return; var p = a.persona, hizo = [];
    if (a.sesion && que !== "h") { p.sesiones = p.sesiones.filter(function (s) { return s.dev !== dev; }); hizo.push("sesión cerrada"); }
    if (a.huella && que !== "s") { p.huellas = p.huellas.filter(function (x) { return x.dev !== dev; }); if (a.sesion && que === "h") { p.sesiones = p.sesiones.filter(function (s) { return s.dev !== dev; }); hizo.push("sesión cerrada"); } hizo.unshift("huella quitada"); }
    var el = document.querySelector('.llave[data-dev="' + dev + '"]'); if (el) el.classList.add("cae");
    U.vibrar([10, 40, 10]);
    setTimeout(function () { pintar(); U.tostada(a.disp + " de " + (p.vos ? "vos" : U.nombre(p)) + ": " + hizo.join(" y ") + "."); }, U.quieto() ? 0 : 400);
  }
  function baja(p) {
    if (p.vos) { U.tostada("A vos te tiene que dar de baja otro Administrador."); return; }
    if (p.nunca) { borrar(p); return; }
    var c = $("#capa-baja"); c.querySelector("[data-q=nombre]").textContent = U.nombre(p);
    var ks = U.aparatos(P).filter(function (a) { return a.persona === p; }).length;
    $("#baja-lista").innerHTML = (ks ? '<li><i class="i" data-i="key-round"></i>Se le cortan sus ' + ks + (ks > 1 ? " llaves" : " llave") + ": sesiones cerradas y huellas quitadas.</li>" : "") + '<li><i class="i" data-i="ban"></i>Ya no entra. Su llavero queda dado vuelta, abajo.</li>';
    U.pintar(c); U.abrir("capa-baja");
    $("#baja-ok").onclick = function () { p.baja = true; p.bajaDesde = "30 de octubre"; p.sesiones = []; p.huellas = []; U.cerrar(c); U.vibrar([10, 40, 10]); pintar(); U.tostada(U.nombre(p) + " quedó dada de baja."); };
  }
  function borrar(p) { P.splice(P.indexOf(p), 1); pintar(); U.tostada("Borrado: nunca había entrado, no había nada que perder."); }
  function alta(id) {
    var p = persona(id), b = document.querySelector('[data-alta="' + id + '"]'); if (b) b.classList.add("da-vuelta");
    setTimeout(function () { p.baja = false; pintar(); var t = document.querySelector('.tag[data-id="' + id + '"]'); if (t) { t.classList.add("balancea"); t.scrollIntoView({ block: "nearest", inline: "nearest" }); } U.tostada(U.nombre(p) + " puede entrar de nuevo. La huella la vincula otra vez."); }, U.quieto() ? 0 : 260);
  }

  // ---------- Menú chico ----------
  var menu = $("#menu");
  function abrirMenu(el) {
    var h = "";
    if (el.classList.contains("llave")) {
      var a = aparato(el.dataset.dev);
      h = '<div class="mc-t">' + a.disp + '</div><div class="mc-d">' + (a.persona.vos ? "Tuyo" : "De " + U.nombre(a.persona)) + (a.sesion ? " · entró " + a.sesion.desde.toLowerCase() : "") + (a.huella ? " · huella del " + a.huella.vinc : "") + "</div>" +
        '<button class="peligro" data-m="cortar"><i class="i" data-i="scissors"></i>Cortar la llave<span class="kbd">Supr</span></button>' +
        (a.sesion && a.huella ? '<button data-m="s"><i class="i" data-i="log-out"></i>Solo cerrar la sesión</button>' : "");
    } else {
      var p = persona(el.dataset.id), n = U.aparatos(P).filter(function (x) { return x.persona === p; }).length;
      h = '<div class="mc-t">' + U.nombre(p) + '</div><div class="mc-d">' + p.correo + " · Administrador</div>" +
        '<button data-m="nombre"><i class="i" data-i="pencil"></i>Cambiar el nombre<span class="kbd">E</span></button>' +
        (p.nunca ? '<button data-m="correo"><i class="i" data-i="mail"></i>Cambiar el correo</button>' : "") +
        (p.sesiones.length > 1 ? '<button data-m="todas"><i class="i" data-i="log-out"></i>Cerrar sus ' + p.sesiones.length + " sesiones</button>" : "") +
        (p.vos ? "" : p.nunca ? '<button class="peligro" data-m="borrar"><i class="i" data-i="trash-2"></i>Borrar<span class="kbd">Supr</span></button>' : '<button class="peligro" data-m="baja"><i class="i" data-i="user-x"></i>Dar de baja<span class="kbd">B</span></button>');
      if (!n && !p.nunca && !p.vos) h += '<div class="mc-d" style="padding-top:8px">No tiene llaves colgadas.</div>';
    }
    menu.innerHTML = h; U.pintar(menu); menu.dueno = el;
    var r = el.getBoundingClientRect(), base = celu ? root.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    var x = Math.min(r.left - base.left, base.width - 272), y = r.bottom - base.top + 6;
    if (y + 220 > base.height) y = Math.max(8, r.top - base.top - 230);
    menu.style.left = Math.max(8, x) + "px"; menu.style.top = y + "px";
    menu.classList.add("abierto"); var f = menu.querySelector("button"); f && f.focus({ preventScroll: true });
  }
  function cerrarMenu() { menu.classList.remove("abierto"); }
  menu.addEventListener("click", function (e) {
    var b = e.target.closest("[data-m]"); if (!b) return; var el = menu.dueno, m = b.dataset.m;
    if (el.classList.contains("llave")) { cerrarMenu(); cortar(el.dataset.dev, m === "s" ? "s" : "todo"); return; }
    var p = persona(el.dataset.id);
    if (m === "nombre" || m === "correo") {
      var campo = m === "nombre";
      menu.innerHTML = '<div class="mc-t">' + (campo ? "Cambiar el nombre" : "Cambiar el correo") + '</div><form><label class="entrada" style="height:44px"><input value="' + (campo ? p.nombre || "" : p.correo) + '" placeholder="' + (p.google || p.correo) + '"></label><div class="error-campo" hidden><i class="i i-s" data-i="triangle-alert"></i><span></span></div><span class="t-detalle">' + (campo ? "Vacío: el de Google (o el correo, si nunca entró)." : "Solo mientras nunca entró.") + "</span></form>";
      U.pintar(menu); var f = menu.querySelector("form"), i = f.querySelector("input"); i.focus(); i.select();
      f.onsubmit = function (ev) { ev.preventDefault(); if (!campo) { var mal = U.correoMal(i.value, P, p); if (mal) { var er = f.querySelector(".error-campo"); er.hidden = false; er.querySelector("span").textContent = mal; return; } p.correo = i.value.trim(); } else p.nombre = i.value.trim() || p.google || ""; cerrarMenu(); pintar(); U.tostada("Guardado."); };
      return;
    }
    cerrarMenu();
    if (m === "todas") { U.abrir("capa-todas"); $("#capa-todas [data-q=n]").textContent = p.sesiones.length; $("#todas-ok").onclick = function () { p.sesiones = []; U.cerrar($("#capa-todas")); pintar(); U.tostada("Sesiones cerradas. Las huellas quedan."); }; }
    if (m === "baja") baja(p);
    if (m === "borrar") borrar(p);
  });
  document.addEventListener("pointerdown", function (e) { if (menu.classList.contains("abierto") && !menu.contains(e.target) && e.target.closest(".llave, .tag") !== menu.dueno) cerrarMenu(); }, true);

  // ---------- Arrastrar al cajón ----------
  var cajon = $("#cajon"), arr = null;
  root.addEventListener("pointerdown", function (e) {
    var el = e.target.closest(".llave, .tag[data-id]"); if (!el || e.target.closest("form, input, button")) return;
    arr = { el: el, x: e.clientX, y: e.clientY, mov: false, id: e.pointerId };
  });
  document.addEventListener("pointermove", function (e) {
    if (!arr) return;
    var dx = e.clientX - arr.x, dy = e.clientY - arr.y;
    if (!arr.mov) {
      if (Math.abs(dx) + Math.abs(dy) < 8) return;
      arr.mov = true; cerrarMenu();
      var r = arr.el.getBoundingClientRect(), base = celu ? root.getBoundingClientRect() : { left: 0, top: 0 };
      arr.r = r; arr.base = base;
      var g = document.createElement("div"); g.className = "fantasma"; g.style.width = r.width + "px"; g.appendChild(arr.el.cloneNode(true)); g.firstChild.style.transform = ""; (celu ? root : document.body).appendChild(g); arr.g = g;
      if (celu) g.style.position = "absolute";
      arr.el.classList.add("arrastrando");
      var esLlave = arr.el.classList.contains("llave"), p = esLlave ? null : persona(arr.el.dataset.id);
      cajon.innerHTML = esLlave ? '<i class="i i-l" data-i="scissors"></i>Soltala acá para cortarla' : p && p.nunca ? '<i class="i i-l" data-i="trash-2"></i>Soltalo acá para borrarlo' : p && p.vos ? '<i class="i i-l" data-i="ban"></i>A vos no te podés dar de baja' : '<i class="i i-l" data-i="user-x"></i>Soltalo acá para dar de baja';
      U.pintar(cajon); cajon.classList.add("ver"); U.vibrar(8);
    }
    arr.g.style.transform = "translate(" + (arr.r.left - arr.base.left + dx) + "px," + (arr.r.top - arr.base.top + dy) + "px)";
    var c = cajon.getBoundingClientRect(), dentro = e.clientX > c.left && e.clientX < c.right && e.clientY > c.top - 20 && e.clientY < c.bottom;
    if (dentro !== arr.dentro) { arr.dentro = dentro; cajon.classList.toggle("encima", dentro); if (dentro) U.vibrar(6); }
  });
  document.addEventListener("pointerup", function () {
    if (!arr) return; var a = arr; arr = null;
    if (!a.mov) { abrirMenu(a.el); return; }
    cajon.classList.remove("ver", "encima");
    if (a.dentro) {
      a.g.remove(); a.el.classList.remove("arrastrando");
      if (a.el.classList.contains("llave")) { a.el.classList.add("cae"); cortar(a.el.dataset.dev, "todo"); } else baja(persona(a.el.dataset.id));
    } else {
      a.g.classList.add("vuelve"); a.g.style.transform = "translate(" + (a.r.left - a.base.left) + "px," + (a.r.top - a.base.top) + "px)";
      setTimeout(function () { a.g.remove(); a.el.classList.remove("arrastrando"); }, 260);
    }
  });

  // ---------- Colgar un llavero nuevo ----------
  function nuevo() {
    var t = $("#nuevo"); if (!t || t.querySelector("form")) return;
    t.classList.remove("nuevo"); t.style.cursor = "default";
    t.innerHTML = '<form novalidate autocomplete="off"><input type="email" inputmode="email" placeholder="Correo de Google" aria-label="Correo de Google"><div class="error-campo" hidden><i class="i i-s" data-i="triangle-alert"></i><span></span></div><input placeholder="Nombre (opcional)" aria-label="Nombre"><button class="btn btn-accion chico" type="submit">Colgar <span class="kbd">↵</span></button></form>';
    U.pintar(t); t.classList.add("balancea"); var f = t.querySelector("form"), ins = f.querySelectorAll("input"); setTimeout(function () { ins[0].focus({ preventScroll: true }); }, 60);
    t.scrollIntoView({ block: "nearest", inline: "nearest" });
    ins[0].oninput = function () { f.querySelector(".error-campo").hidden = true; };
    f.onsubmit = function (e) {
      e.preventDefault(); var m = U.correoMal(ins[0].value, P);
      if (m) { var er = f.querySelector(".error-campo"); er.hidden = false; er.querySelector("span").textContent = m; ins[0].focus(); return; }
      var p = { id: "n" + Date.now(), nombre: ins[1].value.trim(), correo: ins[0].value.trim(), nunca: true, entro: "Todavía no entró", entroCorto: "Todavía no entró", sesiones: [], huellas: [] };
      P.push(p); pintar(); var nt = document.querySelector('.tag[data-id="' + p.id + '"]'); if (nt) nt.classList.add("balancea"); U.vibrar(10);
      U.tostada("Colgado el llavero de " + U.nombre(p) + ". No le llega ningún correo: avisale vos.");
    };
    f.onkeydown = function (e) { if (e.key === "Escape") { e.stopPropagation(); pintar(); } };
  }
  root.addEventListener("click", function (e) {
    if (e.target.closest("#nuevo")) nuevo();
    var b = e.target.closest("[data-alta]"); if (b) alta(b.dataset.alta);
  });

  // ---------- La voz (simulada) ----------
  var voz = $("#voz"), frases = 0, vt = [];
  function limpiar() { vt.forEach(clearTimeout); vt = []; }
  function escuchar() {
    limpiar(); cerrarMenu();
    var frase = frases++ % 2 === 0 ? "Se perdió el celular de Nahuel" : "Autorizá a walter punto ibarra arroba example punto com";
    voz.innerHTML = '<div style="display:flex;align-items:center;gap:12px"><div class="onda">' + new Array(15).join("<i></i>") + '</div><span style="font-weight:700">Te escucho…</span><button class="btn btn-fantasma chico" style="margin-left:auto;color:#fff" data-v="cerrar">Cancelar <span class="kbd">Esc</span></button></div><div class="dice" id="dice"></div><div class="entiende" id="entiende"></div><div id="v-acc"></div>';
    voz.classList.add("ver");
    var dice = $("#dice"), i = 0;
    vt.push(setTimeout(function tipea() { dice.textContent = "«" + frase.slice(0, ++i) + (i < frase.length ? "" : "»"); if (i < frase.length) vt.push(setTimeout(tipea, 38)); else vt.push(setTimeout(function () { entender(frase); }, 350)); }, 700));
  }
  function entender(frase) {
    var acc = $("#v-acc"), ent = $("#entiende");
    voz.querySelector(".onda").style.display = "none";
    if (/perdió/.test(frase)) {
      var p = persona("nahuel"); if (!p || p.baja) { ent.textContent = "Nahuel no tiene celulares colgados."; return; }
      var cel = U.aparatos(P).filter(function (a) { return a.persona === p && a.tipo === "phone"; });
      if (!cel.length) { ent.textContent = "Nahuel no tiene celulares con sesión ni huella. No hay nada que cortar."; return; }
      ent.textContent = cel.length > 1 ? "Nahuel tiene " + cel.length + " celulares. ¿Cuál se perdió?" : "Es este. ¿Lo corto?";
      cel.forEach(function (a) { var k = document.querySelector('.llave[data-dev="' + a.dev + '"]'); if (k) { k.classList.add("tiembla"); k.scrollIntoView({ block: "nearest", inline: "nearest" }); } });
      var t = document.querySelector('.tag[data-id="nahuel"]'); t && t.classList.add("luz");
      var elegido = cel.length === 1 ? cel[0].dev : null;
      acc.innerHTML = '<div class="opciones-v">' + cel.map(function (a) { return '<button data-dev="' + a.dev + '"' + (elegido === a.dev ? ' class="elegida"' : "") + '><i class="i" data-i="smartphone"></i>' + a.disp + "<small>" + (a.sesion ? "con sesión · " : "") + "usado " + a.uso.toLowerCase() + "</small></button>"; }).join("") + '</div><div class="acc-v"><button class="btn btn-cortar" data-v="cortar"' + (elegido ? "" : " disabled") + '><i class="i" data-i="scissors"></i>Cortar <span class="kbd">↵</span></button></div>';
      U.pintar(acc);
      acc.onclick = function (e) {
        var b = e.target.closest("[data-dev]"); if (b) { elegido = b.dataset.dev; acc.querySelectorAll("[data-dev]").forEach(function (x) { x.classList.toggle("elegida", x === b); }); acc.querySelector("[data-v=cortar]").disabled = false; }
        if (e.target.closest("[data-v=cortar]") && elegido) { cerrarVoz(); cortar(elegido, "todo"); }
      };
    } else {
      ent.textContent = "Entendí: autorizar a walter.ibarra@example.com. ¿Lo cuelgo?";
      acc.innerHTML = '<div class="acc-v"><button class="btn btn-accion" data-v="colgar"><i class="i" data-i="key-round"></i>Colgar su llavero <span class="kbd">↵</span></button></div>'; U.pintar(acc);
      acc.onclick = function (e) { if (!e.target.closest("[data-v=colgar]")) return; cerrarVoz(); var m = U.correoMal("walter.ibarra@example.com", P); if (m) { U.tostada(m); return; } var p = { id: "w" + Date.now(), nombre: "", correo: "walter.ibarra@example.com", nunca: true, entro: "Todavía no entró", entroCorto: "Todavía no entró", sesiones: [], huellas: [] }; P.push(p); pintar(); var nt = document.querySelector('.tag[data-id="' + p.id + '"]'); if (nt) { nt.classList.add("balancea"); nt.scrollIntoView({ block: "nearest", inline: "nearest" }); } U.tostada("Colgado. Avisale que ya puede entrar."); };
    }
  }
  function cerrarVoz() { limpiar(); voz.classList.remove("ver"); document.querySelectorAll(".tiembla, .tag.luz").forEach(function (x) { x.classList.remove("tiembla", "luz"); }); }
  voz.addEventListener("click", function (e) { if (e.target.closest("[data-v=cerrar]")) cerrarVoz(); });
  var bv = $("#btn-voz"); if (bv) bv.addEventListener("click", function () { voz.classList.contains("ver") ? cerrarVoz() : escuchar(); });

  // ---------- Teclado ----------
  document.addEventListener("keydown", function (e) {
    var a = document.activeElement, enCampo = /INPUT|TEXTAREA/.test(a.tagName);
    if (e.key === "Escape") { if (voz.classList.contains("ver")) { cerrarVoz(); return; } if (menu.classList.contains("abierto")) { cerrarMenu(); menu.dueno && menu.dueno.focus(); return; } }
    if (document.querySelector(".capa.abierta")) { if (e.key === "Enter" && !enCampo && a.tagName !== "BUTTON") { var ok = document.querySelector(".capa.abierta .btn-cortar"); if (ok) { e.preventDefault(); ok.click(); } } return; }
    if (voz.classList.contains("ver") && e.key === "Enter") { var b = voz.querySelector("[data-v=cortar]:not([disabled]), [data-v=colgar]"); if (b) { e.preventDefault(); b.click(); } return; }
    if (enCampo || menu.contains(a)) return;
    if (e.key === " " && !e.repeat) { e.preventDefault(); escuchar(); return; }
    if (e.key.toLowerCase() === "n") { e.preventDefault(); nuevo(); return; }
    var esLlave = a.classList && a.classList.contains("llave"), esTag = a.classList && a.classList.contains("tag") && a.id !== "nuevo";
    if (esLlave && (e.key === "Delete" || e.key === "Backspace" || e.key.toLowerCase() === "x")) { e.preventDefault(); cortar(a.dataset.dev, "todo"); }
    else if (esTag && e.key.toLowerCase() === "b") { e.preventDefault(); baja(persona(a.dataset.id)); }
    else if (esTag && e.key === "Delete") { var pp = persona(a.dataset.id); if (pp.nunca) borrar(pp); }
    else if (esTag && e.key.toLowerCase() === "e") { e.preventDefault(); abrirMenu(a); menu.querySelector('[data-m="nombre"]').click(); }
    else if ((esLlave || esTag) && e.key === "Enter") { e.preventDefault(); abrirMenu(a); }
    else if (/^Arrow/.test(e.key) && (esLlave || esTag || a.id === "nuevo")) {
      e.preventDefault();
      var cols = [].slice.call(document.querySelectorAll(".llavero")), col = a.closest(".llavero"), ci = cols.indexOf(col);
      var items = [].slice.call(col.querySelectorAll(".tag, .llave")), ii = items.indexOf(a);
      var horiz = celu ? (e.key === "ArrowUp" || e.key === "ArrowDown") : (e.key === "ArrowLeft" || e.key === "ArrowRight");
      var mas = e.key === "ArrowRight" || e.key === "ArrowDown";
      if (horiz) { var nc = cols[Math.max(0, Math.min(cols.length - 1, ci + (mas ? 1 : -1)))]; var t2 = nc.querySelectorAll(".tag, .llave"); (t2[Math.min(ii, t2.length - 1)] || t2[0]).focus(); }
      else { var nx = items[Math.max(0, Math.min(items.length - 1, ii + (mas ? 1 : -1)))]; nx && nx.focus(); }
    }
  });

  document.addEventListener("keydown", function (e) { if (e.altKey && e.key.toLowerCase() === "x") { e.preventDefault(); if (window.irAMaqueta) window.irAMaqueta("more"); } });
  window.KR = { pintar: pintar, escuchar: escuchar, nuevo: nuevo };
  pintar();
})();
