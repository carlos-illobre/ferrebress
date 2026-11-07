/* Variante 2 · Por dispositivo (la reinvención). Nada de listas por tipo: cada dispositivo es una
   tarjeta con todo lo suyo (sesión, huella) y, colgadas, las computadoras que hizo entrar con su
   código. A la izquierda, este dispositivo dibujado, con su nombre en la pantalla y sus preferencias.
   «Se me perdió» marca en rojo lo que va a cortar antes de tocarlo. */
(function () {
  "use strict";
  var LT = window.LT, E = LT.estado, $ = LT.$, $$ = LT.$$;
  var editando = false, cortados = []; // cortados: tarjetas fantasma con lo que se cortó
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function x(attr, id, label) { return '<button type="button" class="ficha-x" ' + attr + '="' + id + '" aria-label="' + label + '" title="' + label + '"><i class="i i-s" data-i="x"></i></button>'; }

  /* ---------- Este dispositivo, dibujado ---------- */
  function dibujo(d) {
    var n = d.nombre;
    return '<div class="aparato ' + (d.tipo === "celu" ? "es-celu" : "es-pc") + '" aria-hidden="true"><div class="aparato-pantalla">' +
      '<span class="aparato-nombre' + (n ? "" : " sin") + '" data-dibujo-nombre>' + esc(n || "Sin nombre") + '</span>' +
      '<span class="aparato-auto">' + esc(d.auto) + "</span></div>" + (d.tipo === "celu" ? "" : '<span class="pie-monitor"></span>') + "</div>";
  }
  function hijosDe(id, enHero) {
    var h = LT.hijos(id); if (!h.length) return "";
    return '<div class="hijos"><div class="hijos-tit"><i class="i i-s" data-i="qr-code"></i>' + (enHero ? "Entraron con el código de este celular" : "Entró con su código") + "</div>" +
      h.map(function (c) {
        var vivo = c.sesion.uso === "ahora";
        return '<div class="hijo" data-cae="' + c.id + '"><span class="hijo-ico"><i class="i i-s" data-i="' + LT.icono(c) + '"></i></span><span class="hijo-txt"><b>' + esc(LT.nombre(c)) + "</b><span>Entró " + LT.h(c.sesion.entro) + " · " + (vivo ? '<em class="vivo">usada ahora</em>' : "usada " + LT.h(c.sesion.uso)) + "</span></span>" +
          '<span class="se-corta">Se cierra</span>' + x("data-cerrar-ses", c.id, "Cerrar la sesión de " + esc(LT.nombre(c))) + "</div>";
      }).join("") + "</div>";
  }
  function hero() {
    var d = LT.este(), celu = d.tipo === "celu";
    var huella = "";
    if (celu) {
      huella = E.huellaAca === "otra" ? '<div class="aviso pino"><i class="i" data-i="fingerprint"></i><span>Este celular tiene la huella de otra persona.</span></div>'
        : d.huella ? '<div class="ficha hue grande"><i class="i i-s" data-i="fingerprint"></i><span>Tu huella está acá desde ' + LT.h(d.huella.vinc) + '</span><button type="button" class="btn btn-fantasma chico" data-quitar="' + d.id + '">Quitar</button></div>'
        : '<button type="button" class="btn btn-oscuro vincular" data-vincular><i class="i" data-i="fingerprint"></i>Vincular este celular con mi huella</button>';
    }
    return '<article class="tarjeta hero">' +
      '<div class="hero-cab"><span class="t-etiqueta">' + (celu ? "Este celular" : "Esta computadora") + '</span><span class="pastilla logro chica"><span class="punto"></span>Lo estás usando</span></div>' +
      '<div class="hero-dibujo del-servidor">' + dibujo(d) + "</div>" +
      '<div class="hero-nombre del-servidor">' + (editando
        ? '<form class="nombre-edit" data-nombre-form autocomplete="off"><input data-nombre-in maxlength="' + LT.MAX + '" value="' + esc(d.nombre) + '" placeholder="Ej.: ' + esc(LT.sugerencias()[0]) + '" aria-label="Nombre de este dispositivo"><span class="contador" data-cont></span><button type="submit" class="btn btn-oscuro chico">Listo</button></form>' +
          '<div class="sugeridos">' + LT.sugerencias().map(function (s) { return '<button type="button" class="chip chico-chip" data-sug-v="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div>" +
          '<div class="aviso urgente" data-dup hidden><i class="i" data-i="triangle-alert"></i><span>Otro dispositivo ya se llama así. Se guarda igual.</span></div>'
        : '<button type="button" class="btn ' + (d.nombre ? "btn-suave" : "btn-accion") + ' chico" data-editar><i class="i i-s" data-i="pen-line"></i>' + (d.nombre ? "Cambiar el nombre" : "Ponele nombre") + '<span class="kbd">D</span></button>' +
          (d.nombre ? '<button type="button" class="btn btn-fantasma chico" data-borrar>Borrar</button>' : "") +
          '<p class="t-detalle hero-nota">Es ' + (celu ? "del celular" : "de la computadora") + ", no tuyo: lo ven todos en las sesiones, el vínculo y Quién hizo qué.</p>") +
      "</div>" +
      (celu ? '<div class="del-servidor hero-huella">' + huella + hijosDe(d.id, true) + "</div>" : "") +
      '<div class="hero-prefs"><div class="hero-sub">Cómo ' + (celu ? "lo" : "la") + ' usás vos acá</div><div class="prefs">' +
      '<div class="pref"><span class="pref-ico"><i class="i" data-i="sparkles"></i></span><div><div class="pref-nombre" id="n-anim">Animaciones</div></div><span class="pref-der"><span class="kbd">A</span><button type="button" class="llave" role="switch" aria-labelledby="n-anim" data-pref="anim"></button></span></div>' +
      '<div class="pref"><span class="pref-ico"><i class="i" data-i="clock"></i></span><div><div class="pref-nombre" id="n-hora">Hora</div></div><span class="pref-der"><span class="kbd">H</span><span class="segmentos hora" role="radiogroup" aria-labelledby="n-hora"><button type="button" role="radio" data-hora-op="24">14:30</button><button type="button" role="radio" data-hora-op="12">2:30 p. m.</button></span></span></div>' +
      '<div class="pref" data-instalar-fila><span class="pref-ico"><i class="i" data-i="app-window"></i></span><div><div class="pref-nombre">Con su ícono</div></div><span class="pref-der" data-instalar-estado></span></div>' +
      "</div></div></article>";
  }

  /* ---------- Los otros: una tarjeta por dispositivo, con lo que hizo entrar colgado ---------- */
  function raices() {
    return E.disp.filter(function (d) {
      if (LT.esEste(d) || !(d.sesion || d.huella)) return false;
      var v = d.sesion && d.sesion.via; if (!v) return true;
      var p = LT.d(v); return !(p && (p.sesion || p.huella)); // si el que lo hizo entrar ya no está, va suelto
    });
  }
  function familia(d) {
    var celu = d.tipo === "celu", s = d.sesion, h = d.huella;
    var fichas = (s ? '<span class="ficha ses" data-cae="' + d.id + '-s"><span class="punto"></span><span>' + (s.uso === "ahora" ? "Usada ahora" : "Sesión abierta · " + LT.h(s.uso)) + '</span><span class="ficha-det">' + esc(LT.comoEntro(s, true)) + " · " + LT.h(s.entro) + '</span><span class="se-corta">Se cierra</span>' + x("data-cerrar-ses", d.id, "Cerrar la sesión") + "</span>" : "") +
      (h ? '<span class="ficha hue" data-cae="' + d.id + '-h"><i class="i i-s" data-i="fingerprint"></i><span>Huella desde ' + LT.h(h.vinc) + '</span><span class="se-corta">Se quita</span>' + x("data-quitar", d.id, "Quitar la huella") + "</span>" : "");
    return '<article class="tarjeta fam" data-fam="' + d.id + '">' +
      '<div class="fam-cab"><span class="fam-ico"><i class="i" data-i="' + LT.icono(d) + '"></i></span><div class="fam-txt"><h3>' + esc(LT.nombre(d)) + "</h3><span>" + (d.nombre ? esc(d.auto) : "Sin nombre") + "</span></div>" +
      (celu ? '<button type="button" class="btn btn-peligro chico" data-perdido="' + d.id + '"><i class="i i-s" data-i="scissors"></i>Se me perdió</button>' : "") + "</div>" +
      '<div class="fichas">' + fichas + "</div>" + hijosDe(d.id, false) + "</article>";
  }
  function fantasma(c) {
    return '<article class="fam cortado" role="status"><div class="fam-cab"><span class="fam-ico"><i class="i" data-i="scissors"></i></span><div class="fam-txt"><h3>' + esc(c.nombre) + "</h3><span>" + esc(c.txt) + '</span></div><button type="button" class="btn btn-fantasma chico" data-fantasma-ok="' + c.k + '">Listo</button></div></article>';
  }
  function otros() {
    var r = raices(), ses = LT.sesiones().length, hue = LT.celulares().filter(function (d) { return !LT.esEste(d); }).length;
    return '<div class="cuentas"><div class="resumen"><span class="ico"><i class="i" data-i="monitor-smartphone"></i></span><div><div class="et">Sesiones abiertas</div><div class="va">' + ses + '</div></div></div>' +
      '<div class="resumen"><span class="ico"><i class="i" data-i="fingerprint"></i></span><div><div class="et">Con tu huella</div><div class="va">' + hue + "</div></div></div>" +
      (ses > 1 ? '<button type="button" class="btn todas" data-todas><i class="i i-s" data-i="log-out"></i>Cerrar todas<span class="kbd">T</span></button>' : "") + "</div>" +
      cortados.map(fantasma).join("") +
      (r.length ? '<div class="familias">' + r.map(familia).join("") + "</div>" : '<p class="vacio"><i class="i" data-i="circle-check"></i>No tenés nada abierto en otro dispositivo. Solo ' + (LT.enCelu ? "este celular" : "esta computadora") + ".</p>");
  }

  function pintar() {
    $("[data-este]").innerHTML = hero();
    $("[data-otros]").innerHTML = otros();
    $$("[data-nombre-de]").forEach(function (el) { el.textContent = LT.nombre(LT.d(el.getAttribute("data-nombre-de"))); });
    var luz = $("[data-luz]"); if (luz) { luz.classList.toggle("sin", E.offline); $("[data-luz-txt]").textContent = E.offline ? "Sin conexión" : "En línea · todo enviado"; }
    if (editando) { var i = $("[data-nombre-in]"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); contar(); } }
  }
  LT.alPintar(pintar);

  /* ---------- El nombre: se escribe en la pantalla del dibujo, letra por letra ---------- */
  function contar() {
    var i = $("[data-nombre-in]"); if (!i) return;
    var v = i.value, t = $("[data-dibujo-nombre]");
    t.textContent = v || "Sin nombre"; t.classList.toggle("sin", !v);
    t.classList.remove("late"); void t.offsetWidth; t.classList.add("late");
    var c = $("[data-cont]"); c.textContent = v.length + "/" + LT.MAX; c.classList.toggle("lleno", v.length >= LT.MAX);
    $("[data-dup]").hidden = !LT.repetido(v);
  }
  function guardar(v) {
    editando = false;
    if (!v.trim()) { LT.este().nombre = ""; LT.pintar(); LT.tostada("Sin nombre: vuelve a ser «" + esc(LT.este().auto) + "»", "rotate-ccw"); return; }
    var r = LT.ponerNombre(v);
    LT.tostada("Ahora todos " + (LT.enCelu ? "lo" : "la") + " ven como «" + esc(LT.nombre(LT.este())) + "»" + (r.dup ? ". Ojo: hay otro igual" : ""), r.dup ? "triangle-alert" : "circle-check");
    var a = $(".aparato"); if (a) { a.classList.add("brilla"); }
    LT.vibrar([10, 40, 10]);
  }
  document.addEventListener("input", function (e) { if (e.target.matches("[data-nombre-in]")) contar(); });
  document.addEventListener("submit", function (e) { if (e.target.matches("[data-nombre-form]")) { e.preventDefault(); guardar($("[data-nombre-in]").value); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && editando) { editando = false; LT.pintar(); } });

  /* ---------- Antes de cortar: lo que se va se pone rojo ---------- */
  function apuntar(id, si) {
    var f = $('[data-fam="' + id + '"]'); if (f) f.classList.toggle("apuntado", si);
  }
  ["pointerover", "focusin"].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var b = e.target.closest && e.target.closest("[data-perdido], .fam [data-quitar]");
      if (b) apuntar(b.getAttribute("data-perdido") || b.getAttribute("data-quitar"), true);
    });
  });
  ["pointerout", "focusout"].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var b = e.target.closest && e.target.closest("[data-perdido], .fam [data-quitar]");
      if (b) apuntar(b.getAttribute("data-perdido") || b.getAttribute("data-quitar"), false);
    });
  });
  function caer(sel, despues) {
    var els = $$(sel);
    els.forEach(function (el, i) { el.style.transitionDelay = (i * 60) + "ms"; el.classList.add("cae"); });
    setTimeout(despues, LT.animando() && els.length ? 300 + els.length * 60 : 0);
  }

  document.addEventListener("click", function (e) {
    var t;
    if (e.target.closest("[data-editar]")) { editando = true; LT.pintar(); return; }
    if (e.target.closest("[data-borrar]")) { LT.este().nombre = ""; LT.pintar(); LT.tostada("Sin nombre: vuelve a ser «" + esc(LT.este().auto) + "»", "rotate-ccw"); return; }
    if ((t = e.target.closest("[data-sug-v]"))) { var i = $("[data-nombre-in]"); i.value = t.getAttribute("data-sug-v"); contar(); setTimeout(function () { guardar(i.value); }, LT.animando() ? 250 : 0); return; }
    if (e.target.closest("[data-todas]")) { LT.pedirCerrarTodas(); return; }
    if (e.target.closest("[data-vincular]")) { LT.pedirHuella(); return; }
    if ((t = e.target.closest("[data-fantasma-ok]"))) { var k = t.getAttribute("data-fantasma-ok"); cortados = cortados.filter(function (c) { return c.k !== k; }); LT.pintar(); return; }
    if ((t = e.target.closest("[data-cerrar-ses]"))) {
      var id = t.getAttribute("data-cerrar-ses"), n = LT.nombre(LT.d(id));
      caer('[data-cae="' + id + '"], [data-cae="' + id + '-s"]', function () { LT.cerrar(id); LT.tostada("Se cerró la sesión de " + esc(n), "log-out"); });
      return;
    }
    if ((t = e.target.closest("[data-perdido], .fam [data-quitar]"))) {
      var pid = t.getAttribute("data-perdido") || t.getAttribute("data-quitar"), perdido = t.hasAttribute("data-perdido"), nombre = LT.nombre(LT.d(pid));
      caer('[data-fam="' + pid + '"] .ficha, [data-fam="' + pid + '"] .hijo', function () {
        var c = perdido ? LT.perdido(pid) : LT.quitar(pid);
        cortados.unshift({ k: pid + Date.now(), nombre: (perdido ? "Cortaste " : "Quitaste la huella de ") + nombre, txt: LT.cortoTexto(c) });
        LT.pintar(); LT.tostada((perdido ? "Cortaste " : "Sin huella: ") + esc(nombre) + ". Nadie entra con él", "scissors"); LT.vibrar([10, 40, 10]);
      });
      return;
    }
    if ((t = e.target.closest(".hero [data-quitar]"))) { LT.quitar(t.getAttribute("data-quitar")); LT.tostada("Seguís adentro. Este celular ya no entra con tu huella", "fingerprint"); }
  });
  LT.teclas({ d: "[data-editar]", t: "[data-todas]" });
})();
