/* Variante 3 · El tablero de llaves (la que nadie se animaría). Sin marco: cada dispositivo donde
   entrás es una llave colgada en un tablero de ferretería, con su rótulo de cinta. Se baja
   tirándola hacia abajo (o con Supr); un celular se baja con las computadoras que hizo entrar
   colgadas de él. Tocada, se da vuelta y muestra cada cosa por separado. La que tenés en la mano
   es este dispositivo: su nombre se escribe con la rotuladora, letra por letra. */
(function () {
  "use strict";
  var LT = window.LT, E = LT.estado, $ = LT.$, $$ = LT.$$;
  var girada = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- La cinta: letras en relieve, apenas desparejas, como las de una rotuladora ---------- */
  function letras(txt, nueva) {
    return Array.prototype.map.call(txt.toUpperCase(), function (ch, i) {
      var cls = ch === " " ? "esp" : (i % 3 === 1 ? "arriba" : i % 3 === 2 ? "abajo" : "");
      if (nueva && i === txt.length - 1) cls += " nueva";
      return '<span class="' + cls + '">' + (ch === " " ? "&nbsp;" : esc(ch)) + "</span>";
    }).join("");
  }
  function cinta(txt, cls) { return '<span class="cinta ' + (cls || "") + '">' + letras(txt) + "</span>"; }

  /* ---------- La que tenés en la mano: este dispositivo ---------- */
  function mano() {
    var d = LT.este(), celu = d.tipo === "celu", hijos = LT.hijos(d.id);
    var huella = !celu ? "" : E.huellaAca === "otra" ? '<div class="aviso pino"><i class="i" data-i="fingerprint"></i><span>Tiene la huella de otra persona.</span></div>'
      : d.huella ? '<div class="mano-huella"><span class="sello hue"><i class="i i-s" data-i="fingerprint"></i>Tu huella, desde ' + LT.h(d.huella.vinc) + '</span><button type="button" class="btn btn-fantasma chico" data-r-quitar="' + d.id + '">Quitar</button></div>'
      : '<button type="button" class="btn btn-oscuro mano-vincular" data-vincular><i class="i" data-i="fingerprint"></i>Vincular este celular con mi huella</button>';
    return '<div class="llavero-mano">' +
      '<div class="argolla" aria-hidden="true"></div>' +
      '<div class="mano-tag">' +
      '<span class="ojal" aria-hidden="true"></span>' +
      '<div class="mano-top"><span class="t-etiqueta">En tu mano</span><span class="pastilla logro chica"><span class="punto"></span>' + (celu ? "Este celular" : "Esta computadora") + "</span></div>" +
      '<div class="mano-cinta del-servidor"><span class="cinta grande" data-cinta>' + letras(d.nombre) + "</span>" + (d.nombre ? "" : '<span class="sin-rot" data-sin-rot>Sin rótulo: se ve como «' + esc(d.auto) + "»</span>") + "</div>" +
      '<form class="rotuladora del-servidor" data-nombre-form autocomplete="off">' +
      '<label class="rotu-campo"><i class="i" data-i="tag"></i><input data-nombre-in maxlength="' + LT.MAX + '" value="' + esc(d.nombre) + '" placeholder="Escribí el nombre" aria-label="Nombre de ' + (celu ? "este celular" : "esta computadora") + '"><span class="contador" data-cont></span><span class="kbd">D</span></label>' +
      '<button type="submit" class="btn btn-oscuro chico" data-rotular><i class="i i-s" data-i="scissors"></i>Cortar la cinta</button></form>' +
      '<div class="rotu-ideas del-servidor">' + LT.sugerencias().map(function (s) { return '<button type="button" class="chip rotu-chip" data-sug-v="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") +
      (d.nombre ? '<button type="button" class="btn btn-fantasma chico" data-borrar>Despegar</button>' : "") + "</div>" +
      '<div class="aviso urgente" data-dup hidden><i class="i" data-i="triangle-alert"></i><span>Ya hay otra llave con ese rótulo. Queda igual.</span></div>' +
      '<p class="t-detalle mano-nota">El rótulo es ' + (celu ? "del celular" : "de la computadora") + ": lo leen todos en sus sesiones, el vínculo y Quién hizo qué.</p>" +
      (celu ? '<div class="del-servidor">' + huella + "</div>" : "") +
      "</div>" +
      (hijos.length ? '<div class="mano-cadena del-servidor"><span class="cadena-tit">Colgadas de este, con su código</span>' + hijos.map(function (h) { return llave(h, true); }).join("") + "</div>" : "") +
      "</div>";
  }

  /* ---------- Una llave: frente con su rótulo y sus sellos; dorso con lo que se puede hacer ---------- */
  function llave(d, chica) {
    var s = d.sesion, h = d.huella, celu = d.tipo === "celu";
    var sellos = (s ? '<span class="sello ses"><span class="punto"></span>' + (s.uso === "ahora" ? "En uso" : LT.h(s.uso)) + "</span>" : "") +
      (h ? '<span class="sello hue"><i class="i i-s" data-i="fingerprint"></i>Huella</span>' : "");
    var acc = (s ? '<button type="button" class="btn chico" data-r-cerrar="' + d.id + '"><i class="i i-s" data-i="log-out"></i>Cerrar la sesión</button>' : "") +
      (h ? '<button type="button" class="btn chico" data-r-quitar="' + d.id + '"><i class="i i-s" data-i="fingerprint"></i>Quitar la huella</button>' : "") +
      (celu ? '<button type="button" class="btn btn-peligro chico" data-r-perdido="' + d.id + '"><i class="i i-s" data-i="scissors"></i>Se me perdió</button>' : "");
    var det = s ? esc(LT.comoEntro(s, false)) + " · " + LT.h(s.entro) : h ? "Huella desde " + LT.h(h.vinc) : "";
    return '<div class="llave3' + (chica ? " chica" : "") + (girada === d.id ? " girada" : "") + '" data-llave="' + d.id + '" tabindex="0" role="button" aria-label="' + esc(LT.nombre(d)) + '. Enter: ver qué hacer. Supr: bajarla.">' +
      (chica ? '<span class="eslabon" aria-hidden="true"></span>' : '<span class="gancho" aria-hidden="true"></span>') +
      '<div class="giro"><div class="faz frente"><span class="ojal" aria-hidden="true"></span>' +
      '<span class="llave-ico"><i class="i" data-i="' + LT.icono(d) + '"></i></span>' + cinta(LT.nombre(d), d.nombre ? "" : "gris") +
      '<span class="llave-det">' + det + "</span>" +
      '<div class="sellos">' + sellos + "</div></div>" +
      '<div class="faz dorso"><span class="ojal" aria-hidden="true"></span><b>' + esc(LT.nombre(d)) + "</b>" + acc + '<button type="button" class="btn btn-fantasma chico" data-volver>Dar vuelta</button></div></div>' +
      "</div>";
  }
  // En el tablero cuelga cada dispositivo propio; las computadoras que entraron con el código de un
  // celular cuelgan de él (y las de este celular, de la que tenés en la mano)
  function raices() {
    return E.disp.filter(function (d) {
      if (LT.esEste(d) || !(d.sesion || d.huella)) return false;
      var v = d.sesion && d.sesion.via, p = v && LT.d(v);
      return !(p && (LT.esEste(p) || p.sesion || p.huella));
    });
  }
  function tablero() {
    var r = raices(), cols = LT.chico() ? 2 : 4, libres = Math.max(0, (Math.ceil(r.length / cols) * cols || cols) - r.length);
    var html = r.map(function (d) {
      return '<div class="col3" data-col="' + d.id + '">' + llave(d, false) + LT.hijos(d.id).map(function (h) { return llave(h, true); }).join("") + "</div>";
    }).join("");
    for (var i = 0; i < libres; i++) html += '<div class="col3 libre" aria-hidden="true"><span class="gancho"></span><span class="libre-txt">' + (r.length || i ? "" : "Nada colgado: solo la que tenés en la mano") + "</span></div>";
    return '<div class="ganchera">' + html + "</div>";
  }

  function pintar() {
    $("[data-mano]").innerHTML = mano();
    $("[data-tablero]").innerHTML = tablero();
    var luz = $("[data-luz]"); luz.classList.toggle("sin", E.offline); $("[data-luz-txt]").textContent = E.offline ? "Sin conexión" : "En línea";
    $("[data-todas]").hidden = LT.sesiones().length < 2;
    contar(false);
  }
  LT.alPintar(pintar);

  /* ---------- La rotuladora ---------- */
  var antes = null;
  function contar(nueva) {
    var i = $("[data-nombre-in]"); if (!i) return;
    var v = i.value, c = $("[data-cont]");
    c.textContent = "Quedan " + (LT.MAX - v.length);
    c.classList.toggle("lleno", v.length >= LT.MAX);
    if (nueva) {
      $("[data-cinta]").innerHTML = letras(v, antes !== null && v.length > antes);
      var sr = $("[data-sin-rot]"); if (sr) sr.hidden = !!v;
    }
    antes = v.length;
    $("[data-dup]").hidden = !LT.repetido(v);
  }
  function rotular(v) {
    if (!v.trim()) { despegar(); return; }
    var r = LT.ponerNombre(v);
    var c = $("[data-cinta]"); if (c) { c.classList.add("cortada"); }
    LT.tostada("Rotulada: «" + esc(LT.nombre(LT.este())) + "». Así la leen todos" + (r.dup ? ". Ojo: hay otra igual" : ""), r.dup ? "triangle-alert" : "tag");
    LT.vibrar([10, 40, 10]);
  }
  function despegar() { var d = LT.este(); d.nombre = ""; LT.pintar(); LT.tostada("Despegada: vuelve a verse como «" + esc(d.auto) + "»", "rotate-ccw"); }
  document.addEventListener("input", function (e) { if (e.target.matches("[data-nombre-in]")) { contar(true); LT.vibrar(5); } });
  document.addEventListener("submit", function (e) { if (e.target.matches("[data-nombre-form]")) { e.preventDefault(); rotular($("[data-nombre-in]").value); } });

  /* ---------- Bajar una llave: cae, y con ella lo que cuelga ---------- */
  function recibo(titulo, lineas) {
    var box = $("[data-recibos]"), r = document.createElement("div");
    r.className = "recibo3"; r.setAttribute("role", "status");
    r.innerHTML = '<div class="recibo3-cab"><span>CORTADO</span><span>' + LT.h("14:31") + "</span></div><b>" + esc(titulo) + "</b><ul>" + lineas.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + '</ul><div class="recibo3-pie">Ya nadie entra con ' + (lineas.length > 1 ? "eso" : "ella") + "</div>";
    box.appendChild(r);
    r.addEventListener("click", function () { r.classList.add("se-va"); setTimeout(function () { r.remove(); }, 250); });
    setTimeout(function () { if (document.contains(r)) { r.classList.add("se-va"); setTimeout(function () { r.remove(); }, 250); } }, 6500);
  }
  function caer(el, despues) {
    if (!el) { despues(); return; }
    el.style.transform = ""; el.classList.add("cae");
    LT.vibrar(20);
    setTimeout(despues, LT.animando() ? 560 : 0);
  }
  function lineasDe(c) { return c.map(function (x) { return x.que === "sesion" ? "Se cerró su sesión" : x.que === "huella" ? "Se le quitó la huella" : "Se cerró " + LT.nombre(LT.d(x.id)) + " (entró con su código)"; }); }
  function bajar(id, que) {
    var d = LT.d(id), nombre = LT.nombre(d), raiz = $('[data-col="' + id + '"]'), el = raiz || $('[data-llave="' + id + '"]');
    girada = null;
    // Tirarla hacia abajo: un celular se corta entero («Se me perdió», R8.1); una computadora, se cierra su sesión
    que = que || (d.tipo === "celu" ? "perdido" : "cerrar");
    if (que === "cerrar") {
      var hijas = LT.hijos(id);
      caer(hijas.length ? $('[data-llave="' + id + '"]') : el, function () { LT.cerrar(id); recibo(nombre, ["Se cerró su sesión"]); LT.tostada("Bajaste " + esc(nombre) + ": sesión cerrada", "log-out"); });
      return;
    }
    caer(el, function () {
      var c = que === "perdido" ? LT.perdido(id) : LT.quitar(id);
      recibo(nombre, lineasDe(c)); LT.tostada((que === "perdido" ? "Cortaste " : "Sin huella: ") + esc(nombre) + ". " + LT.cortoTexto(c), "scissors"); LT.vibrar([10, 40, 10]);
    });
  }

  /* ---------- Tirar con el dedo o el mouse ---------- */
  var tiro = null;
  document.addEventListener("pointerdown", function (e) {
    var ll = e.target.closest(".llave3"); if (!ll || ll.classList.contains("girada") || e.target.closest("button")) return;
    var id = ll.getAttribute("data-llave"), col = ll.classList.contains("chica") ? ll : (ll.closest(".col3") || ll);
    tiro = { id: id, el: col, y0: e.clientY, x0: e.clientX, dy: 0, movio: false };
    col.classList.add("tirando");
  });
  document.addEventListener("pointermove", function (e) {
    if (!tiro) return;
    var dy = Math.max(0, e.clientY - tiro.y0), dx = e.clientX - tiro.x0;
    if (dy > 6 || Math.abs(dx) > 6) tiro.movio = true;
    tiro.dy = dy;
    var r = dy < 110 ? dy : 110 + (dy - 110) * .4;
    tiro.el.style.transform = "translateY(" + r + "px) rotate(" + Math.max(-8, Math.min(8, dx / 12)) + "deg)";
    tiro.el.classList.toggle("se-suelta", dy > 110);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener("pointerup", function () {
    if (!tiro) return;
    var t = tiro; tiro = null;
    t.el.classList.remove("tirando", "se-suelta");
    if (!t.movio) { t.el.style.transform = ""; girar(t.id); return; }
    if (t.dy > 110) { bajar(t.id); return; }
    t.el.style.transform = ""; // vuelve a su gancho con un rebote
  });
  function girar(id) { girada = girada === id ? null : id; LT.pintar(); var el = $('[data-llave="' + id + '"]'); if (el) { var b = el.querySelector(girada ? ".dorso .btn" : null); (b || el).focus(); } }

  document.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-sug-v]"))) { var i = $("[data-nombre-in]"); i.value = t.getAttribute("data-sug-v"); contar(true); rotular(i.value); return; }
    if (e.target.closest("[data-borrar]")) { despegar(); return; }
    if (e.target.closest("[data-todas]")) { LT.pedirCerrarTodas(); return; }
    if (e.target.closest("[data-vincular]")) { LT.pedirHuella(); return; }
    if (e.target.closest("[data-volver]")) { var g = girada; girada = null; LT.pintar(); var el = $('[data-llave="' + g + '"]'); if (el) el.focus(); return; }
    if ((t = e.target.closest("[data-r-cerrar]"))) { bajar(t.getAttribute("data-r-cerrar"), "cerrar"); return; }
    if ((t = e.target.closest("[data-r-perdido]"))) { bajar(t.getAttribute("data-r-perdido"), "perdido"); return; }
    if ((t = e.target.closest("[data-r-quitar]"))) {
      var q = t.getAttribute("data-r-quitar");
      if (LT.esEste(LT.d(q))) { LT.quitar(q); LT.tostada("Seguís adentro. Este celular ya no entra con tu huella", "fingerprint"); return; }
      bajar(q, "quitar");
    }
  });
  document.addEventListener("keydown", function (e) {
    var ll = e.target.closest && e.target.closest(".llave3"); if (!ll) return;
    var id = ll.getAttribute("data-llave");
    if ((e.key === "Enter" || e.key === " ") && e.target === ll) { e.preventDefault(); girar(id); }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); bajar(id); }
    if (e.key === "Escape" && girada) { girada = null; LT.pintar(); var el = $('[data-llave="' + id + '"]'); if (el) el.focus(); }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowUp") {
      var todas = $$(".llave3"), i = todas.indexOf(ll), n = todas[i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1)];
      if (n) { e.preventDefault(); n.focus(); }
    }
  });
  LT.teclas({ d: function () { var i = $("[data-nombre-in]"); if (i) { i.focus(); i.select(); } }, t: "[data-todas]" });
})();
