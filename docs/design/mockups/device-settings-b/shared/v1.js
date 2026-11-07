/* Variante 1 · La lista (la evolución). «Lo tuyo» como tres tarjetas con la misma pieza de renglón
   que la tarjeta propia de Usuarios: el nombre de este dispositivo, mis celulares con huella y mis
   sesiones. «Se me perdió» va en el renglón de cada celular y deja un recibo con lo que cortó. */
(function () {
  "use strict";
  var LT = window.LT, E = LT.estado, $ = LT.$, $$ = LT.$$;
  var recibo = null;        // { titulo, cortes } después de cortar un celular
  var sugAbierta = false;   // las ideas de nombre, mientras el campo tiene el foco
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var ESTE = function () { return LT.chico() || LT.enCelu ? "este celular" : "esta computadora"; };

  /* ---------- Las piezas ---------- */
  function icono(d, vivo) {
    return '<span class="disp-ico"><i class="i" data-i="' + LT.icono(d) + '"></i>' + (vivo ? '<span class="dot"></span>' : "") + "</span>";
  }
  function filaCelu(d) {
    var este = LT.esEste(d), h = d.huella;
    var acc = este
      ? '<button type="button" class="btn chico" data-quitar="' + d.id + '">Quitar mi huella</button>'
      : '<button type="button" class="btn btn-peligro chico" data-perdido="' + d.id + '"><i class="i i-s" data-i="scissors"></i>Se me perdió</button><button type="button" class="btn chico" data-quitar="' + d.id + '">Quitar</button>';
    return '<div class="disp" data-id="' + d.id + '">' + icono(d, h.uso === "ahora" || este) +
      '<div class="disp-txt"><div class="disp-nombre">' + esc(LT.nombre(d)) + (este ? ' <span class="pastilla pino chica">Este</span>' : "") + "</div>" +
      '<div class="disp-det">Con huella desde ' + LT.h(h.vinc) + " · " + (este ? "Lo tenés en la mano" : "Último uso " + LT.h(h.uso)) + "</div></div>" +
      '<div class="disp-acc">' + acc + "</div></div>";
  }
  function filaSesion(d) {
    var s = d.sesion, vivo = s.uso === "ahora";
    var perdible = d.tipo === "celu" && !d.huella; // con huella, «Se me perdió» ya está en su renglón de arriba
    return '<div class="disp" data-id="' + d.id + '">' + icono(d, vivo) +
      '<div class="disp-txt"><div class="disp-nombre">' + esc(LT.nombre(d)) + (d.nombre ? "" : ' <span class="sin-nombre">sin nombre</span>') + "</div>" +
      '<div class="disp-det">' + esc(LT.comoEntro(s, true)) + " · Entró " + LT.h(s.entro) + '<span class="largo"> · ' + (vivo ? '<b class="vivo">Usada ahora</b>' : "Usada " + LT.h(s.uso)) + "</span></div>" +
      '<div class="disp-det corto">' + (vivo ? '<b class="vivo">Usada ahora</b>' : "Usada " + LT.h(s.uso)) + "</div></div>" +
      '<div class="disp-acc">' + (perdible ? '<button type="button" class="btn btn-peligro chico" data-perdido="' + d.id + '"><i class="i i-s" data-i="scissors"></i>Se me perdió</button>' : "") +
      '<button type="button" class="btn chico" data-cerrar-ses="' + d.id + '">Cerrar</button></div></div>';
  }

  function bloqueNombre() {
    var d = LT.este(), celu = d.tipo === "celu";
    return '<div class="tarjeta bloque b-nombre">' +
      '<div class="bloque-cab"><span class="b-ico"><i class="i" data-i="' + LT.icono(d) + '"></i></span><div><h3 class="b-tit">Nombre de ' + (celu ? "este celular" : "esta computadora") + '</h3><p class="b-que"><span class="largo">Es de ' + (celu ? "este celular" : "esta computadora") + ', no tuyo: lo ven todos en las sesiones, el vínculo, Quién hizo qué y al entrar.</span><span class="corto">Lo ven todos los que lo usan</span></p></div></div>' +
      '<form class="nombre-form" data-nombre-form autocomplete="off">' +
      '<label class="campo-n"><i class="i" data-i="pen-line"></i><input data-nombre-in maxlength="' + LT.MAX + '" placeholder="' + esc(d.auto) + '" value="' + esc(d.nombre) + '" aria-label="Nombre de ' + ESTE() + '"><span class="contador" data-cont></span><span class="kbd">D</span>' + (d.nombre ? '<button type="button" class="borrar-x" data-borrar aria-label="Borrar el nombre" title="Borrar el nombre"><i class="i" data-i="circle-x"></i></button>' : "") + '</label>' +
      '<button type="submit" class="btn btn-oscuro chico" data-guardar hidden>Guardar</button>' +
      '</form>' +
      '<div class="sugeridos" data-sug' + (sugAbierta || !d.nombre ? "" : " hidden") + '><span class="t-detalle">Ideas:</span>' + LT.sugerencias().map(function (s) { return '<button type="button" class="chip chico-chip" data-sug-v="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div>" +
      '<div class="aviso urgente" data-dup hidden><i class="i" data-i="triangle-alert"></i><span>Ya hay otro dispositivo que se llama así. Se guarda igual; para no confundirlos, sumale algo.</span></div>' +
      "</div>";
  }

  function bloqueCelulares() {
    var lista = LT.celulares(), aca = "";
    if (LT.enCelu && E.huellaAca === "ninguna") {
      aca = '<div class="disp vincular"><span class="disp-ico pino"><i class="i" data-i="fingerprint"></i></span><div class="disp-txt"><div class="disp-nombre">Este celular no tiene huella</div><div class="disp-det">Entrá sin Google y aprobá la computadora</div></div><div class="disp-acc"><button type="button" class="btn btn-oscuro chico" data-vincular><i class="i i-s" data-i="fingerprint"></i>Vincular <span class="largo">este celular con mi huella</span></button></div></div>';
    } else if (LT.enCelu && E.huellaAca === "otra") {
      aca = '<div class="aviso pino aca-otra"><i class="i" data-i="fingerprint"></i><span>Este celular tiene la huella de otra persona.</span></div>';
    }
    var rec = recibo ? '<div class="recibo" role="status"><div class="recibo-cab"><span class="b-ico rojo"><i class="i" data-i="scissors"></i></span><div><b>' + esc(recibo.titulo) + '</b><div class="t-detalle">Nadie puede entrar con él.</div></div><button type="button" class="btn btn-fantasma chico" data-recibo-ok>Listo</button></div><ul>' +
      recibo.cortes.map(function (c) { return '<li><i class="i i-s" data-i="check"></i>' + esc(c.txt) + "</li>"; }).join("") + "</ul></div>" : "";
    return '<div class="tarjeta bloque">' +
      '<div class="bloque-cab"><span class="b-ico"><i class="i" data-i="fingerprint"></i></span><div><h3 class="b-tit">Mis celulares con huella <span class="cuenta">' + lista.length + '</span></h3><p class="b-que largo">Donde entrás con tu huella y aprobás la entrada de una computadora</p></div></div>' +
      rec + aca + (lista.length ? '<div class="filas">' + lista.map(filaCelu).join("") + "</div>" : (aca ? "" : '<p class="vacio">No tenés celulares con huella. Se vinculan desde el celular, al entrar.</p>')) +
      "</div>";
  }

  function bloqueSesiones() {
    var lista = LT.sesiones();
    return '<div class="tarjeta bloque">' +
      '<div class="bloque-cab"><span class="b-ico"><i class="i" data-i="monitor-smartphone"></i></span><div><h3 class="b-tit">Mis sesiones <span class="cuenta">' + lista.length + '</span></h3><p class="b-que"><span class="largo">En otros dispositivos. La de ' + ESTE() + ' se cierra con «Salir».</span><span class="corto">En otros dispositivos</span></p></div>' +
      (lista.length > 1 ? '<button type="button" class="btn chico cerrar-todas" data-todas>Cerrar todas<span class="kbd">T</span></button>' : "") + "</div>" +
      (lista.length ? '<div class="filas">' + lista.map(filaSesion).join("") + "</div>" : '<p class="vacio"><i class="i i-s" data-i="circle-check"></i> No tenés sesiones abiertas en otros dispositivos.</p>') +
      "</div>";
  }

  /* ---------- Pintar ---------- */
  function pintar() {
    var box = $("[data-tuyo]"); if (!box) return;
    box.innerHTML = bloqueNombre() + bloqueCelulares() + bloqueSesiones();
    $$("[data-nombre-de]").forEach(function (el) { el.textContent = LT.nombre(LT.d(el.getAttribute("data-nombre-de"))); });
    var luz = $("[data-luz]"); if (luz) { luz.classList.toggle("sin", E.offline); $("[data-luz-txt]").textContent = E.offline ? "Sin conexión" : "En línea · todo enviado"; }
    contar();
  }
  LT.alPintar(pintar);

  /* ---------- El nombre: cuenta las letras y avisa si se repite, sin repintar ---------- */
  function contar() {
    var inp = $("[data-nombre-in]"); if (!inp) return;
    var v = inp.value, d = LT.este(), cambio = v.trim() !== d.nombre;
    var c = $("[data-cont]"); c.textContent = v.length + "/" + LT.MAX; c.classList.toggle("lleno", v.length >= LT.MAX);
    $("[data-guardar]").hidden = !cambio || (!v.trim() && !d.nombre);
    $("[data-dup]").hidden = !LT.repetido(v);
  }
  document.addEventListener("input", function (e) { if (e.target.matches("[data-nombre-in]")) contar(); });
  document.addEventListener("keydown", function (e) {
    // Hasta 30 letras (R9.3, E53): no deja escribir más y lo dice
    if (e.target.matches && e.target.matches("[data-nombre-in]") && e.target.value.length >= LT.MAX && e.key.length === 1 && e.target.selectionStart === e.target.selectionEnd) {
      var c = $("[data-cont]"); c.textContent = "Hasta " + LT.MAX + " letras"; c.classList.remove("sacude"); void c.offsetWidth; c.classList.add("sacude");
    }
    if (e.key === "Escape" && e.target.matches && e.target.matches("[data-nombre-in]")) { e.target.value = LT.este().nombre; contar(); e.target.blur(); }
  });
  document.addEventListener("focusin", function (e) { if (e.target.matches("[data-nombre-in]")) { sugAbierta = true; var s = $("[data-sug]"); if (s) s.hidden = false; } });
  document.addEventListener("submit", function (e) {
    if (!e.target.matches("[data-nombre-form]")) return;
    e.preventDefault();
    guardar($("[data-nombre-in]").value);
  });
  function guardar(v) {
    if (!v.trim()) { borrar(); return; }
    sugAbierta = false;
    var r = LT.ponerNombre(v);
    LT.tostada((LT.enCelu ? "Este celular" : "Esta computadora") + " se llama «" + esc(LT.nombre(LT.este())) + "»" + (r.dup ? ", como otro" : ""), r.dup ? "triangle-alert" : "circle-check");
    if (r.dup) { var a = $("[data-dup]"); if (a) a.hidden = false; }
    var b = $(".b-nombre"); if (b) { b.classList.remove("guardado-ok"); void b.offsetWidth; b.classList.add("guardado-ok"); }
    LT.vibrar([10, 40, 10]);
  }
  function borrar() {
    var d = LT.este(); d.nombre = ""; sugAbierta = false; LT.pintar();
    LT.tostada("Sin nombre: vuelve a ser «" + esc(d.auto) + "»", "rotate-ccw");
  }

  /* ---------- Acciones: lo que sale, sale con un fundido; después cambia la lista ---------- */
  function salen(ids, despues) {
    var filas = $$(".disp").filter(function (f) { return ids.indexOf(f.getAttribute("data-id")) >= 0; });
    filas.forEach(function (f, i) { f.style.transitionDelay = (i * 40) + "ms"; f.classList.add("se-va"); });
    setTimeout(despues, LT.animando() && filas.length ? 260 + filas.length * 40 : 0);
  }
  document.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-sug-v]"))) { var inp = $("[data-nombre-in]"); inp.value = t.getAttribute("data-sug-v"); contar(); guardar(inp.value); return; }
    if (e.target.closest("[data-borrar]")) { borrar(); return; }
    if (e.target.closest("[data-recibo-ok]")) { recibo = null; LT.pintar(); return; }
    if (e.target.closest("[data-todas]")) { LT.pedirCerrarTodas(); return; }
    if (e.target.closest("[data-vincular]")) { LT.pedirHuella(); return; }
    if ((t = e.target.closest("[data-cerrar-ses]"))) {
      var id = t.getAttribute("data-cerrar-ses"), n = LT.nombre(LT.d(id));
      salen([id], function () { LT.cerrar(id); LT.tostada("Se cerró la sesión de " + esc(n), "log-out"); });
      return;
    }
    if ((t = e.target.closest("[data-perdido]"))) {
      var pid = t.getAttribute("data-perdido"), d = LT.d(pid), nombre = LT.nombre(d);
      var ids = [pid].concat(LT.hijos(pid).map(function (h) { return h.id; }));
      salen(ids, function () {
        var c = LT.perdido(pid); recibo = { titulo: "Cortaste " + nombre, cortes: c }; LT.pintar();
        LT.tostada("Cortaste " + esc(nombre) + ": " + LT.cortoMin(c), "scissors"); LT.vibrar([10, 40, 10]);
      });
      return;
    }
    if ((t = e.target.closest("[data-quitar]"))) {
      var qid = t.getAttribute("data-quitar"), qd = LT.d(qid), qn = LT.nombre(qd);
      if (LT.esEste(qd)) { LT.quitar(qid); LT.tostada("Seguís adentro. Este celular ya no entra con tu huella", "fingerprint"); return; }
      salen([qid].concat(LT.hijos(qid).map(function (h) { return h.id; })), function () {
        var c = LT.quitar(qid); recibo = { titulo: "Quitaste la huella de " + qn, cortes: c }; LT.pintar();
        LT.tostada("Se quitó la huella de " + esc(qn), "fingerprint");
      });
    }
  });
  LT.teclas({ d: function () { var i = $("[data-nombre-in]"); if (i) { i.focus(); i.select(); } }, t: "[data-todas]" });
})();
