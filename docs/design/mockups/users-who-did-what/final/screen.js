/* Usuarios · Quién hizo qué · maqueta final. Una sola página: debajo de 900 px es el celular.
   Partes: el estado de la pantalla, la lista, el detalle, el resumen y la tira, los filtros,
   «Actualizar solo» con su canal y sus medidores, la cinta, el teclado y el panel de la maqueta.
   Todo es simulado: el canal, los avisos y los KB son cuentas de la maqueta. */
(function () {
  var AU = window.AU;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var angosto = window.matchMedia("(max-width: 899px)");
  function celu() { return angosto.matches; }
  function porPag() { return celu() ? 10 : 20; }
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- El estado de la pantalla ---------- */
  function sinFiltros() { return { por: null, a: null, fecha: "todo", desde: null, hasta: null, grupo: null, tipo: null, color: null }; }
  var f = sinFiltros(), pag = 1, sel = null, vista = [];
  // Lo que la pantalla ya pidió: la lista se arma con esto. Lo que llega después no se ve hasta
  // ponerse al día (E34).
  var conocidas = {};
  function pedirLista() { AU.ACCIONES.forEach(function (a) { conocidas[a.id] = true; }); }
  pedirLista();
  function lasConocidas() { return AU.ACCIONES.filter(function (a) { return conocidas[a.id]; }); }
  function filtrarConocidas(g) { var c = AU.filtrar(g); return c.filter(function (a) { return conocidas[a.id]; }); }
  var recien = {};   // las que entraron solas, para marcarlas un momento (E50)

  /* ---------- El período del resumen (R4.9): el de las fechas; sin fecha, hoy ---------- */
  function periodo() {
    if (f.fecha === "todo") return { fecha: "hoy", desde: AU.HOY, hasta: AU.HOY, nombre: "Hoy" };
    var nombre = f.fecha === "rango" ? AU.DIAS[f.desde] + " a " + AU.DIAS[f.hasta] : AU.ATAJOS[f.fecha].nombre;
    return { fecha: f.fecha, desde: f.desde, hasta: f.hasta, nombre: nombre };
  }
  // «Actualizar solo» se ve solo si las fechas incluyen hoy (R4.6, E53)
  function incluyeHoy() { return (!f.desde || f.desde <= AU.HOY) && (!f.hasta || f.hasta >= AU.HOY); }

  /* =================== La lista (R4.2 a R4.4) =================== */
  function filaHTML(a, i, anim) {
    var c = AU.color(a);
    var quien = a.quien === "anon" && a.correo ? '<span class="nom anon-mail">' + AU.esc(a.correo) + '</span>' :
      '<span class="nom">' + AU.esc(AU.quienTexto(a)) + (AU.hoyDe(a) ? ' <span class="hoy">(hoy: ' + AU.esc(AU.hoyDe(a)) + ')</span>' : "") + '</span>';
    var fecha = a.dia !== AU.HOY ? '<small>' + (celu() ? AU.DIAS_CORTO[a.dia] + " · " : AU.DIAS_CORTO[a.dia]) + '</small>' : "";
    var hora = celu() ? '<i class="i i-s" data-i="' + AU.dispIcono(a) + '"></i>' + fecha + a.hora : a.hora + fecha;
    var nueva = recien[a.id];
    return '<div class="fila ' + c + (anim ? " fundido" : "") + (nueva ? " entra recien" : "") + '" role="option" tabindex="-1" data-id="' + a.id + '" style="' + (anim ? "animation-delay:" + Math.min(i, 12) * 16 + "ms" : "") + '">' +
      AU.iconoTipo(a) +
      '<div class="l1"><span class="hora">' + hora + (a.sinConfirmar && !celu() ? '<small style="color:var(--urgente-texto)">sin confirmar</small>' : "") + '</span>' +
      '<span class="por">' + AU.avatar(a.quien, "chico") + quien + '</span></div>' +
      '<div class="l2"><span class="que">' + AU.textoHTML(a) + (a.sinConfirmar && celu() ? ' <span class="sin-conf">· sin confirmar</span>' : "") + '</span></div>' +
      '<span class="disp solo-compu" title="' + AU.dispTexto(a) + '"><i class="i i-s" data-i="' + AU.dispIcono(a) + '"></i></span></div>';
  }

  function render(anim) {
    vista = filtrarConocidas(f);
    var paginas = Math.max(1, Math.ceil(vista.length / porPag()));
    if (pag > paginas) pag = paginas;
    var trozo = vista.slice((pag - 1) * porPag(), pag * porPag());
    var h = "", dia = null;
    if (!vista.length) {
      h = '<div class="vacio-lista"><span class="ilus"><i class="i i-xl" data-i="inbox"></i></span>' +
        (AU.ACCIONES.length ? '<b>No hay acciones con esos filtros</b><span>Probá con otra fecha o sacá los filtros.</span><button type="button" class="btn" data-sacar><i class="i i-s" data-i="x"></i>Sacar filtros</button>' : '<b>Todavía no hay nada anotado</b>') + '</div>';
    }
    trozo.forEach(function (a, i) {
      if (a.dia !== dia) {
        dia = a.dia;
        var cuantas = vista.filter(function (x) { return x.dia === dia; }).length;
        h += '<h2 class="dia"><span>' + AU.DIAS_LARGO[dia] + '</span><span>' + cuantas + (cuantas === 1 ? " acción" : " acciones") + '</span></h2>';
      }
      h += filaHTML(a, i, anim);
    });
    $("#lista").innerHTML = h;
    window.pintarIconos($("#lista"));
    $$("[data-total]").forEach(function (tot) {
      if (tot.textContent !== String(vista.length)) { tot.textContent = vista.length; tot.classList.remove("rueda"); void tot.offsetWidth; tot.classList.add("rueda"); }
    });
    $("#pagina").textContent = "página " + pag + " de " + paginas;
    $(".pg-c small").textContent = "de a " + porPag();
    $("#ant").disabled = pag <= 1; $("#sig").disabled = pag >= paginas;
    // En la computadora, el detalle muestra la elegida; al abrir, la primera (R4.7)
    if (!sel || !trozo.some(function (a) { return a.id === sel; })) sel = trozo.length ? trozo[0].id : null;
    marcar(false);
    pintarFiltros();
    pintarResumen();
    pintarVivo();
    // La marca de lo que entró solo dura un momento
    var ids = Object.keys(recien);
    if (ids.length) setTimeout(function () { ids.forEach(function (id) { delete recien[id]; var el = document.querySelector('.fila[data-id="' + id + '"]'); if (el) el.classList.remove("recien", "entra"); }); $$(".tic.recien").forEach(function (t) { t.classList.remove("recien"); }); }, 1600);
  }

  function marcar(scroll) {
    $$(".fila").forEach(function (el) { var on = el.dataset.id === sel && !celu(); el.classList.toggle("sel", on); el.setAttribute("aria-selected", on); });
    var el = document.querySelector('.fila[data-id="' + sel + '"]');
    if (el && scroll) el.scrollIntoView({ block: "nearest" });
    if (!celu()) detalle();
    $$(".tic").forEach(function (t) { t.classList.toggle("sel", t.dataset.id === sel); });
  }

  /* =================== El detalle (R4.7) =================== */
  function cambioHTML(c) {
    var antes = c[1] === "—" ? '<span class="antes vacio">nada</span>' : '<span class="antes">' + AU.esc(c[1]) + '</span>';
    var despues = c[2] === "—" ? '<span class="despues" style="color:var(--error-texto)">ya no está</span>' : '<span class="despues">' + AU.esc(c[2]) + '</span>';
    return '<div class="cambio"><span class="campo-n">' + AU.esc(c[0]) + '</span><span class="ad">' + antes + '<i class="i i-s flecha-ad" data-i="arrow-right"></i>' + despues + '</span></div>';
  }
  function persona(id, titulo, sub) { return '<div class="persona-c">' + AU.avatar(id) + '<div><b>' + AU.esc(titulo) + '</b>' + (sub ? '<small>' + AU.esc(sub) + '</small>' : "") + '</div></div>'; }
  function detalle(id) {
    var cuerpo = $("#det-cuerpo");
    var a = AU.ACCIONES.filter(function (x) { return x.id === (id || sel); })[0];
    if (!a) { cuerpo.innerHTML = '<div class="vacio-lista"><span class="ilus"><i class="i i-xl" data-i="mouse-pointer-click"></i></span><b>Elegí una acción</b><span>Acá se ve todo lo que se guardó de ella.</span></div>'; window.pintarIconos(cuerpo); return; }
    var g = AU.GRUPOS.filter(function (x) { return x.id === a.grupo; })[0], c = AU.color(a);
    var pill = c === "rojo" ? '<span class="pastilla error chica"><i class="i i-s" data-i="trash-2"></i>Borra o saca</span>' : c === "ambar" ? '<span class="pastilla urgente chica"><i class="i i-s" data-i="' + (a.grupo === "offline" ? "wifi-off" : "ban") + '"></i>' + (a.grupo === "offline" ? "Sin confirmar" : "Rechazado") + '</span>' : "";
    // Los nombres son solo texto: no filtran (E33). Para eso están «Hecho por» y «Hecho a».
    var quien = a.quien === "anon" ? persona("anon", a.correo || "Alguien sin entrar", a.correo ? "Alguien sin entrar, con ese correo" : "") :
      persona(a.quien, AU.quienTexto(a), AU.hoyDe(a) ? "hoy: " + AU.hoyDe(a) : a.quien === "sys" ? "Lo que hace solo" : AU.P[a.quien].rol);
    var aq = AU.aQuien(a), roles = AU.roles(a);
    var aQuienH = aq.length ? aq.map(function (x) { var p = AU.P[x.id]; return persona(x.id, x.entonces || p.nombre, x.entonces ? "hoy: " + p.nombre : p.estado === "baja" ? "Dada de baja" : p.estado === "borrada" ? "Borrada" : p.rol); }).join("") :
      roles.length ? '<div class="persona-c vacio"><span class="avatar" style="background:var(--hundido);color:var(--texto-2)"><i class="i i-s" data-i="shield"></i></span><div><b style="color:var(--tinta)">' + AU.esc(roles[0]) + '</b><small>Rol</small></div></div>' :
      '<div class="persona-c vacio"><span class="avatar" style="background:var(--hundido);color:var(--texto-3)"><i class="i i-s" data-i="minus"></i></span><div><b>A nadie</b><small>Fue sobre sí mismo</small></div></div>';
    var cambios = a.cambios.length ? '<div class="bloque"><h3>Qué cambió</h3>' + a.cambios.map(cambioHTML).join("") + '</div>' : "";
    var nota = a.nota ? '<div class="bloque"><h3>' + (a.grupo === "rechazos" ? "Por qué se rechazó" : "Más datos") + '</h3>' + a.nota.map(function (x) { return '<div class="cambio"><span class="campo-n">' + AU.esc(x[0]) + '</span><span class="ad">' + AU.esc(x[1]) + '</span></div>'; }).join("") + '</div>' : "";
    cuerpo.innerHTML =
      '<div class="det-cab">' + AU.iconoTipo(a) + '<span class="pastilla chica">' + g.nombre + ' · ' + AU.TIPO[a.tipo] + '</span>' + pill + '<button type="button" class="btn btn-fantasma btn-icono det-cerrar solo-celu" data-cerrar aria-label="Cerrar"><i class="i" data-i="x"></i></button></div>' +
      '<p class="det-frase">' + AU.textoHTML(a, { marcas: true }) + '</p>' +
      '<div class="det-cuando"><i class="i i-s" data-i="clock"></i>' + (a.dia === AU.HOY ? "Hoy" : AU.DIAS_LARGO[a.dia]) + ', ' + a.hora + (a.sinConfirmar ? ' · <span class="sin-conf">hora del celular, sin confirmar</span>' : " · hora del servidor") + '</div>' +
      '<div class="bloque"><div class="gente2"><div class="bloque"><h3>Quién</h3>' + quien + '</div><div class="bloque"><h3>A quién o a qué</h3>' + aQuienH + '</div></div></div>' +
      cambios + nota +
      '<div class="bloque"><h3>Desde dónde</h3><div class="desde"><div><span class="et"><i class="i i-s" data-i="' + AU.dispIcono(a) + '"></i>Dispositivo</span><span class="va">' + AU.dispTexto(a) + '</span></div><div><span class="et"><i class="i i-s" data-i="globe"></i>Navegador</span><span class="va" title="' + a.desde.nav + '">' + a.desde.nav + '</span></div><div><span class="et"><i class="i i-s" data-i="wifi"></i>Dirección</span><span class="va">' + a.desde.ip + '</span></div></div></div>' +
      '<div class="nota-fija"><i class="i i-s" data-i="lock"></i>Lo anotado no se cambia ni se borra.</div>';
    if (!celu()) { cuerpo.classList.remove("cambia"); void cuerpo.offsetWidth; cuerpo.classList.add("cambia"); }
    window.pintarIconos(cuerpo);
  }

  /* ---------- Las hojas del celular: el detalle y los filtros ---------- */
  var hoja = null;
  function abrirHoja(el) { hoja = el; el.scrollTop = 0; el.classList.add(el.id === "pop" ? "abierto" : "abierta"); $("#velo").classList.add("abierto"); AU.vibrar(10); }
  function cerrarHoja() { if (!hoja) return; hoja.classList.remove("abierta", "abierto"); $("#velo").classList.remove("abierto"); hoja = null; abierto = null; }
  $("#velo").addEventListener("click", cerrarHoja);
  [$("#detalle"), $("#pop")].forEach(function (el) {
    var y0 = null;
    el.addEventListener("pointerdown", function (e) { if (celu() && (e.target.closest(".asa") || el.scrollTop === 0)) y0 = e.clientY; });
    el.addEventListener("pointermove", function (e) { if (y0 == null) return; var d = Math.max(0, e.clientY - y0); if (d > 4) { el.style.transition = "none"; el.style.transform = "translateY(" + d + "px)"; } });
    function fin(e) { if (y0 == null) return; var d = e.clientY - y0; y0 = null; el.style.transition = ""; el.style.transform = ""; if (d > 90) cerrarHoja(); }
    el.addEventListener("pointerup", fin); el.addEventListener("pointercancel", fin);
  });

  /* =================== El resumen y la tira (R4.9) =================== */
  function pintarResumen() {
    var p = periodo(), del = filtrarConocidas({ desde: p.desde, hasta: p.hasta });
    var n = { todo: del.length, ambar: del.filter(function (a) { return AU.color(a) === "ambar"; }).length, rojo: del.filter(function (a) { return AU.color(a) === "rojo"; }).length };
    $$("[data-res-n]").forEach(function (el) {
      var v = String(n[el.dataset.resN]);
      if (el.textContent !== v) { el.textContent = v; el.classList.remove("rueda"); void el.offsetWidth; el.classList.add("rueda"); }
    });
    $("#res-periodo").textContent = p.nombre;
    $$("[data-res]").forEach(function (r) {
      var k = r.dataset.res, enPeriodo = f.fecha === p.fecha && !f.tipo && !f.grupo;
      r.classList.toggle("on", f.fecha !== "todo" && enPeriodo && (k === "todo" ? !f.color : f.color === k));
    });
    pintarTira();
  }
  // El día de la tira: el del período si es uno solo; si son varios, hoy
  function diaTira() { var p = periodo(); return p.desde === p.hasta ? p.desde : AU.HOY; }
  function pintarTira() {
    var d = diaTira(), del = lasConocidas().filter(function (a) { return a.dia === d; });
    var mins = del.map(function (a) { var hm = a.hora.split(":"); return +hm[0] * 60 + +hm[1]; });
    var h0 = Math.floor(Math.min.apply(null, mins.concat([24 * 60])) / 60), h1 = Math.min(24, Math.floor(Math.max.apply(null, mins.concat([0])) / 60) + 1);
    if (!del.length) { h0 = 8; h1 = 20; }
    if (h1 - h0 < 4) h1 = Math.min(24, h0 + 4);
    $("#tira-titulo").textContent = (d === AU.HOY ? "El día" : AU.DIAS[d]) + ", de " + h0 + " a " + h1;
    $("#riel").innerHTML = del.map(function (a, i) {
      var x = (mins[i] / 60 - h0) / (h1 - h0) * 100;
      return '<span class="tic ' + AU.color(a) + (recien[a.id] ? " recien" : "") + (a.id === sel ? " sel" : "") + '" data-id="' + a.id + '" style="left:' + Math.max(1, Math.min(99, x)) + '%"></span>';
    }).join("");
    var paso = h1 - h0 > 8 ? Math.ceil((h1 - h0) / 5) : 1, horas = "";
    for (var h = h0; h <= h1; h += paso) horas += "<span>" + h + "</span>";
    $("#tira-horas").innerHTML = horas;
  }

  /* =================== Los filtros (R4.5) =================== */
  var abierto = null;
  function pintarFiltros() {
    var c = celu();
    var nombres = {
      por: f.por ? (c ? AU.P[f.por].corto : AU.P[f.por].nombre) : (c ? "todos" : "Todos"),
      a: f.a ? (c ? AU.P[f.a].corto : AU.P[f.a].nombre) : (c ? "todos" : "Todos"),
      fecha: f.fecha === "rango" ? AU.DIAS[f.desde] + " a " + AU.DIAS[f.hasta] : AU.ATAJOS[f.fecha].nombre,
      tipo: f.tipo ? AU.TIPO[f.tipo] : f.grupo ? AU.GRUPOS.filter(function (g) { return g.id === f.grupo; })[0].nombre : f.color === "ambar" ? (c ? "rechazos" : "Rechazos y sin confirmar") : f.color === "rojo" ? (c ? "borra o saca" : "Lo que borra o saca") : (c ? "todos" : "Todos")
    };
    $$(".filtro").forEach(function (b) {
      var k = b.dataset.f;
      b.querySelector("b").textContent = nombres[k];
      b.classList.toggle("puesto", k === "fecha" ? f.fecha !== "todo" : k === "tipo" ? !!(f.tipo || f.grupo || f.color) : !!f[k]);
    });
    var alguno = !!(f.por || f.a || f.fecha !== "todo" || f.tipo || f.grupo || f.color);
    $$("[data-sacar]").forEach(function (s) { if (s.closest(".filtros, .cuenta")) s.hidden = !alguno; });
  }
  function opPersona(id, k) {
    var p = AU.P[id], marca = p.estado === "baja" ? "Dada de baja" : p.estado === "borrada" ? "Borrada" : p.especial === "sys" ? "Lo que hace solo" : p.especial === "anon" ? "Intentos de afuera" : p.rol;
    return '<button type="button" class="op' + (f[k] === id ? " elegida" : "") + '" data-v="' + id + '">' + AU.avatar(id) + '<span>' + AU.esc(p.nombre) + '<br><small>' + marca + '</small></span>' + (f[k] === id ? '<i class="i i-s" data-i="check"></i>' : "<span></span>") + '</button>';
  }
  function abrir(k) {
    var pop = $("#pop"), btn = document.querySelector('.filtro[data-f="' + k + '"]');
    if (abierto === k) return cerrar();
    abierto = k;
    var h = '<div class="asa solo-celu" aria-hidden="true"></div><div class="pop-cab"><span class="t-seccion">' + { por: "Hecho por", a: "Hecho a", fecha: "Fecha", tipo: "Tipo" }[k] + '</span><button type="button" class="btn btn-fantasma btn-icono" data-cerrar aria-label="Cerrar"><i class="i" data-i="x"></i></button></div>';
    if (k === "por" || k === "a") {
      h += '<button type="button" class="op' + (!f[k] ? " elegida" : "") + '" data-v=""><span class="ic"><i class="i i-s" data-i="users"></i></span><span>Todos</span><span></span></button>';
      h += '<div class="sep">Personas</div>' + AU.PERSONAS.filter(function (p) { return !p.estado; }).map(function (p) { return opPersona(p.id, k); }).join("");
      h += '<div class="sep">Dadas de baja y borradas</div>' + AU.PERSONAS.filter(function (p) { return p.estado; }).map(function (p) { return opPersona(p.id, k); }).join("");
      if (k === "por") h += '<div class="sep">Otros</div>' + opPersona("sys", k) + opPersona("anon", k);
    } else if (k === "fecha") {
      h += Object.keys(AU.ATAJOS).map(function (id) { return '<button type="button" class="op' + (f.fecha === id ? " elegida" : "") + '" data-v="' + id + '"><span class="ic"><i class="i i-s" data-i="' + (id === "todo" ? "calendar-range" : "calendar-days") + '"></i></span><span>' + AU.ATAJOS[id].nombre + (id === "semana" ? '<br><small>De lunes a hoy</small>' : "") + '</span>' + (f.fecha === id ? '<i class="i i-s" data-i="check"></i>' : "<span></span>") + '</button>'; }).join("");
      h += '<div class="sep">Desde y hasta, los dos incluidos</div><div style="display:flex;gap:8px;padding:4px 8px 8px;flex-wrap:wrap"><button type="button" class="btn chico" data-v="rango" data-d="2026-10-29" data-h="2026-10-31">jue 29 a sáb 31</button><button type="button" class="btn chico" data-v="rango" data-d="2026-11-02" data-h="2026-11-03">lun 2 a mar 3</button></div>';
    } else {
      h += '<button type="button" class="op' + (!f.tipo && !f.grupo && !f.color ? " elegida" : "") + '" data-v=""><span class="ic"><i class="i i-s" data-i="layout-grid"></i></span><span>Todos</span><span></span></button>';
      AU.GRUPOS.forEach(function (g) {
        h += '<button type="button" class="op' + (f.grupo === g.id && !f.tipo ? " elegida" : "") + '" data-g="' + g.id + '"><span class="ic"><i class="i i-s" data-i="' + g.icono + '"></i></span><span>' + g.nombre + '</span><small>todo el grupo</small></button>';
        Object.keys(g.tipos).forEach(function (t) { h += '<button type="button" class="op sub' + (f.tipo === t ? " elegida" : "") + '" data-g="' + g.id + '" data-t="' + t + '"><span class="ic"><i class="i i-s" data-i="' + AU.ICONO[t] + '"></i></span><span style="font-weight:600">' + g.tipos[t] + '</span>' + (f.tipo === t ? '<i class="i i-s" data-i="check"></i>' : "<span></span>") + '</button>'; });
      });
    }
    pop.innerHTML = h;
    window.pintarIconos(pop);
    if (celu()) { abrirHoja(pop); return; }
    pop.style.left = btn.offsetLeft + "px"; pop.style.top = (btn.offsetTop + 48) + "px";
    pop.classList.add("abierto");
    var primero = pop.querySelector(".elegida") || pop.querySelector(".op"); if (primero) primero.focus();
  }
  function cerrar() { if (celu()) return cerrarHoja(); abierto = null; $("#pop").classList.remove("abierto"); }
  // Cambiar un filtro vuelve a la página 1 y pide la lista con esos filtros (R4.5, E34)
  function aplicar() {
    pag = 1; sel = null; pedirLista(); pendientes = {}; render(true);
    $("#lista").scrollTop = 0; if (celu()) $("#pant").scrollTo({ top: 0 });
    canal();
  }

  $("#pop").addEventListener("click", function (e) {
    if (e.target.closest("[data-cerrar]")) return cerrar();
    var b = e.target.closest("[data-v], [data-g]"); if (!b) return;
    if (abierto === "por" || abierto === "a") f[abierto] = b.dataset.v || null;
    else if (abierto === "fecha") {
      f.fecha = b.dataset.v;
      if (f.fecha === "rango") { f.desde = b.dataset.d; f.hasta = b.dataset.h; } else { f.desde = AU.ATAJOS[f.fecha].desde; f.hasta = AU.ATAJOS[f.fecha].hasta; }
    } else { f.grupo = b.dataset.g || null; f.tipo = b.dataset.t || null; f.color = null; }
    cerrar(); aplicar();
  });
  $$(".filtro").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); abrir(b.dataset.f); }); });
  document.addEventListener("click", function (e) { if (abierto && !celu() && !e.target.closest("#pop")) cerrar(); });

  function sacar() { f = sinFiltros(); aplicar(); }

  // Los números del resumen filtran en su período; tocar el total saca los dos (R4.9, E35c)
  $$("[data-res]").forEach(function (r) {
    r.addEventListener("click", function () {
      var k = r.dataset.res, p = periodo();
      f.fecha = p.fecha; f.desde = p.desde; f.hasta = p.hasta; f.tipo = null; f.grupo = null;
      f.color = k === "todo" ? null : (f.color === k ? null : k);
      AU.vibrar(10);
      aplicar();
    });
  });

  // Tocar una acción la elige (computadora) o abre su detalle (celular). Los nombres son parte de la acción (E33).
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-sacar]")) return sacar();
    if (e.target.closest("#detalle [data-cerrar]")) return cerrarHoja();
    var fila = e.target.closest(".fila");
    if (fila) { sel = fila.dataset.id; if (celu()) { detalle(sel); abrirHoja($("#detalle")); } else marcar(false); }
    if (e.target.closest("[data-indicador]")) AU.tostada("El detalle del vínculo está en su maqueta aprobada", "smartphone");
  });

  function irA(p) { pag = p; sel = null; pedirLista(); render(true); $("#lista").scrollTop = 0; if (celu()) $("#pant").scrollTo({ top: 0 }); pendientes = {}; pintarVivo(); }
  $("#ant").addEventListener("click", function () { if (pag > 1) irA(pag - 1); });
  $("#sig").addEventListener("click", function () { irA(pag + 1); });

  /* =================== «Actualizar solo» (R4.6) y lo que gasta (R4.12, 03 · R4.5) ===================
     El canal está abierto solo con el selector prendido, las fechas con hoy, la pestaña a la vista y
     con conexión. El aviso no trae datos: si se está arriba de todo, se pide la lista; si no, cuántas
     hay nuevas. Como mucho una vez cada 5 segundos (E52). */
  var vivo = { on: !celu() };
  var oculta = false;
  function debeAbrir() { return vivo.on && incluyeHoy() && !oculta && !document.body.classList.contains("offline"); }

  // Los medidores: lo que viaja, con su momento. El latido del canal es parejo: 8 KB por hora de
  // bajada y 5 de subida (docs/technical/mobile-data.md), unos 0,22 KB por minuto.
  var LATIDO_KB_MIN = 13 / 60, PUESTA_KB = 2, AVISO_KB = 0.1, CUANTAS_KB = 0.3, ABRIR_KB = 0.6;
  var viajes = [], tramos = [], abiertoDesde = null;
  function anotar(kb) { viajes.push({ t: Date.now(), kb: kb }); pintarGasto(); }
  function abrirCanal(semilla) {
    if (abiertoDesde != null) return false;
    abiertoDesde = Date.now() - (semilla || 0);
    if (!semilla) anotar(ABRIR_KB);
    return true;
  }
  function cerrarCanal() { if (abiertoDesde == null) return; tramos.push([abiertoDesde, Date.now()]); abiertoDesde = null; }
  // Lo del último minuto
  function kbMin() {
    var ahora = Date.now(), desde = ahora - 60000, kb = 0, seg = 0;
    viajes = viajes.filter(function (v) { return v.t > desde - 1000; });
    viajes.forEach(function (v) { if (v.t > desde) kb += v.kb; });
    tramos.concat(abiertoDesde != null ? [[abiertoDesde, ahora]] : []).forEach(function (t) { seg += Math.max(0, Math.min(t[1], ahora) - Math.max(t[0], desde)) / 1000; });
    return kb + LATIDO_KB_MIN * seg / 60;
  }
  function kb(v) { return v < 0.05 ? "0 KB/min" : v.toFixed(1).replace(".", ",") + " KB/min"; }
  function pintarGasto() {
    var app = kbMin();
    // Esta pantalla: apagado, 0 (R4.12). La aplicación: lo que pasó por sus canales en el último
    // minuto, sin mirar el selector (03 · R4.5, E45).
    var pantalla = vivo.on && incluyeHoy() ? app : 0;
    $$("[data-gasto-pantalla]").forEach(function (el) { el.textContent = kb(pantalla); });
    $$("[data-gasto-app]").forEach(function (el) { el.textContent = kb(app); });
  }
  setInterval(pintarGasto, 1000);

  // Abre o cierra el canal según el estado; al abrirse por volver (a la vista, la conexión o el día)
  // se pone al día una vez (R4.6, E54).
  function canal(motivo) {
    if (debeAbrir()) { if (abrirCanal() && motivo === "volvio") ponerAlDia(true); }
    else cerrarCanal();
    pintarVivo();
  }

  function pintarVivo() {
    var ve = incluyeHoy();
    $("#vivo").hidden = !ve;
    $("#vivo-llave").setAttribute("aria-checked", vivo.on ? "true" : "false");
    var n = Object.keys(pendientes).length;
    $("#nuevas").hidden = !n;
    $("#nuevas-txt").textContent = n === 1 ? "1 nueva" : n + " nuevas";
    pintarGasto();
  }

  $("#vivo-llave").addEventListener("click", function () {
    vivo.on = !vivo.on;
    if (vivo.on) {
      // Prenderlo pone la lista al día en el momento (es un toque: ese pedido no cuenta, R4.12)
      canal();
      ponerAlDia(false);
    } else { canal(); }
    AU.vibrar(10);
    pintarVivo();
  });

  // Lo que llegó y todavía no se ve: las que cumplen los filtros (E51)
  var pendientes = {}, ultima = 0, espera = null, porProcesar = false;
  function arribaDeTodo() {
    if (pag !== 1 || cintaAbierta) return false;
    return celu() ? $("#pant").scrollTop < 8 : $("#lista").scrollTop < 8;
  }
  // El servidor avisa que hay acciones nuevas (sin datos de ellas)
  function aviso(cuantas) {
    if (abiertoDesde == null) return;            // sin canal no llega nada (E34, E53, E54)
    anotar(AVISO_KB * cuantas);
    porProcesar = true;
    var falta = ultima + 5000 - Date.now();
    if (falta <= 0) procesar();
    else if (!espera) espera = setTimeout(procesar, falta);
  }
  function procesar() {
    espera = null;
    if (!porProcesar || abiertoDesde == null) return;
    porProcesar = false; ultima = Date.now();
    ponerAlDia(true);
  }
  // auto: lo pide la pantalla sola (cuenta en los medidores). Arriba de todo, la lista, el resumen y la
  // tira se ponen al día y lo nuevo se marca (E50); si no, solo «N nuevas» (E51).
  function ponerAlDia(auto) {
    var nuevas = AU.ACCIONES.filter(function (a) { return !conocidas[a.id]; });
    if (arribaDeTodo() || !auto) {
      if (auto) anotar(PUESTA_KB);
      nuevas.forEach(function (a) { if (AU.cumple(a, f)) recien[a.id] = true; });
      pedirLista(); pendientes = {};
      var antes = sel; render(false); if (!celu() && antes) { sel = antes; marcar(false); }
      if (nuevas.length && celu()) AU.vibrar(10);
    } else {
      anotar(CUANTAS_KB);
      nuevas.forEach(function (a) { if (AU.cumple(a, f)) pendientes[a.id] = true; });
      var b = $("#nuevas"), estaba = !b.hidden;
      pintarVivo();
      if (!estaba && !b.hidden) { b.classList.remove("aparece"); void b.offsetWidth; b.classList.add("aparece"); }
    }
  }
  // «3 nuevas»: sube a la página 1 y las muestra (E51)
  $("#nuevas").addEventListener("click", function () {
    var ids = Object.keys(pendientes);
    pag = 1; $("#lista").scrollTop = 0; if (celu()) $("#pant").scrollTo({ top: 0 });
    AU.ACCIONES.forEach(function (a) { if (!conocidas[a.id] && AU.cumple(a, f)) recien[a.id] = true; });
    ids.forEach(function (id) { recien[id] = true; });
    pedirLista(); pendientes = {}; render(false);
  });

  // La pestaña oculta: sin canal; al volver, se pone al día una vez (E54)
  document.addEventListener("visibilitychange", function () { oculta = document.hidden; canal(oculta ? null : "volvio"); });

  /* =================== La cinta (R4.11): la maqueta aprobada, encima, sin desarmar la lista =================== */
  var cintaAbierta = false;
  function abrirCinta() {
    var cinta = $("#cinta"), marco = $("#cinta-marco");
    var src = celu() ? "../phone/variant-3-tape/index.html" : "../desktop/variant-3-tape/index.html";
    marco.onload = function () {
      try {
        var w = marco.contentWindow;
        // Su «volver» (la × o «Usuarios») cierra la cinta y vuelve a la lista como estaba (E42)
        w.document.addEventListener("click", function (e) { if (e.target.closest("[data-ir]")) { e.preventDefault(); e.stopImmediatePropagation(); cerrarCinta(); } }, true);
        w.focus();
      } catch (err) { /* abierta como archivo suelto: queda la tecla Escape */ }
    };
    if (marco.getAttribute("src") !== src) marco.setAttribute("src", src); else if (marco.onload) marco.onload();
    cinta.hidden = false; cintaAbierta = true;
    requestAnimationFrame(function () { requestAnimationFrame(function () { cinta.classList.add("abierta"); }); });
  }
  function cerrarCinta() {
    var cinta = $("#cinta");
    cinta.classList.remove("abierta"); cintaAbierta = false;
    setTimeout(function () { cinta.hidden = true; }, quieto.matches ? 0 : 220);
    $("#lista").focus && $("#lista").focus();
  }
  $("#tira").addEventListener("click", abrirCinta);
  $("#ver-dia").addEventListener("click", abrirCinta);

  /* =================== El teclado (R4.8; 00 · R2) =================== */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Alt") { document.body.classList.add("alt"); }
    if (celu()) { if (e.key === "Escape") cerrarHoja(); return; }
    if (e.key === "Escape") { if (cintaAbierta) return cerrarCinta(); cerrar(); return; }
    if (cintaAbierta) return;
    if (e.altKey) {
      var k = e.key.toLowerCase(), filtro = { p: "por", a: "a", f: "fecha", t: "tipo" }[k];
      if (filtro) { e.preventDefault(); abrir(filtro); return; }
      var boton = { r: "#vivo-llave", n: "#nuevas", h: '[data-res="todo"]', c: '[data-res="ambar"]', b: '[data-res="rojo"]', d: "#tira", x: ".filtros [data-sacar]", l: ".indicador" }[k];
      if (boton) { var el = $(boton); e.preventDefault(); if (el && !el.hidden && !el.closest("[hidden]")) el.click(); return; }
    }
    if (abierto) {
      var ops = $$("#pop .op, #pop [data-v]"), i = ops.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (ops[i + 1] || ops[0]).focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); (ops[i - 1] || ops[ops.length - 1]).focus(); }
      return;
    }
    var filas = $$(".fila").map(function (x) { return x.dataset.id; }), j = filas.indexOf(sel);
    if (e.key === "ArrowDown" && j < filas.length - 1) { e.preventDefault(); sel = filas[j + 1]; marcar(true); }
    if (e.key === "ArrowUp" && j > 0) { e.preventDefault(); sel = filas[j - 1]; marcar(true); }
    if (e.key === "PageDown") { e.preventDefault(); $("#sig").click(); }
    if (e.key === "PageUp") { e.preventDefault(); $("#ant").click(); }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") document.body.classList.remove("alt"); });
  window.addEventListener("blur", function () { document.body.classList.remove("alt"); });

  /* =================== El panel de la maqueta (fuera del diseño) =================== */
  function panel() {
    var d = document.createElement("div");
    d.className = "demo";
    d.innerHTML = '<button type="button" class="demo-asa" aria-label="La maqueta: simular lo que pasa"><i class="i" data-i="sliders-horizontal"></i></button>' +
      '<div class="demo-panel"><p>Maqueta · llega algo</p>' +
      '<button type="button" data-demo="una">Llega una acción nueva</button>' +
      '<button type="button" data-demo="tres">Llegan tres</button>' +
      '<button type="button" data-demo="diez">Autorizan a diez seguidas</button>' +
      '<div class="demo-grupo"><p>Maqueta · dónde está</p>' +
      '<button type="button" data-demo="pagina2">Ir a la página 2</button>' +
      '<button type="button" data-demo="bajar">Bajar la lista</button>' +
      '<button type="button" data-demo="ayer">Fecha: ayer</button>' +
      '<button type="button" data-demo="ocultar">Ocultar la pestaña 6 s</button>' +
      '<button type="button" data-demo="red" aria-pressed="false">Cortar la conexión</button></div>' +
      '<p class="demo-nota">Los avisos llegan solo con el canal abierto: «Actualizar solo» prendido, hoy en las fechas, a la vista y con conexión.</p></div>';
    document.body.appendChild(d);
    window.pintarIconos(d);
    d.querySelector(".demo-asa").addEventListener("click", function () { d.classList.toggle("abierta"); });
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-demo]"); if (!b) return;
      var q = b.dataset.demo;
      if (q === "una") { AU.llega(); aviso(1); }
      if (q === "tres") { AU.llega(); AU.llega(); AU.llega(); aviso(3); }
      if (q === "diez") { var i = 0; var t = setInterval(function () { AU.llegaAutorizo(); aviso(1); if (++i === 10) clearInterval(t); }, 600); }
      if (q === "pagina2") irA(2);
      if (q === "bajar") { if (celu()) $("#pant").scrollTo({ top: 520 }); else $("#lista").scrollTo({ top: 360 }); }
      if (q === "ayer") { f.fecha = "ayer"; f.desde = AU.ATAJOS.ayer.desde; f.hasta = AU.ATAJOS.ayer.hasta; aplicar(); }
      if (q === "ocultar") {
        oculta = true; canal();
        var c = document.createElement("div"); c.className = "oculta"; c.innerHTML = '<div>La pestaña está oculta<small>Sin canal abierto. En estos 6 s llegan dos acciones.</small></div>';
        document.body.appendChild(c);
        setTimeout(function () { AU.llega(); aviso(1); }, 1500);
        setTimeout(function () { AU.llega(); aviso(1); }, 3500);
        setTimeout(function () { c.remove(); oculta = false; canal("volvio"); }, 6000);
      }
      if (q === "red") {
        var off = document.body.classList.toggle("offline");
        b.setAttribute("aria-pressed", off ? "true" : "false");
        $$("[data-luz-texto]").forEach(function (t) { t.textContent = off ? "Sin conexión" : "En línea · todo enviado"; });
        if (!off) AU.tostada("Volvió la conexión", "wifi");
        canal(off ? null : "volvio");
      }
    });
  }

  /* =================== Al abrir =================== */
  // En la computadora arranca prendido (E49): se muestra como si el canal llevara un minuto abierto.
  if (vivo.on && incluyeHoy()) abrirCanal(60000);
  render(false);
  canal();
  panel();
  // Al cruzar el corte (girar la ventana), cambia la forma; el selector queda como estaba
  angosto.addEventListener("change", function () { cerrarHoja(); cerrar(); render(false); });
  // Para las capturas: ?demo=… deja la maqueta en un estado
  var q = new URLSearchParams(location.search).get("demo");
  if (q) setTimeout(function () { var b = document.querySelector('[data-demo="' + q.split(",")[0] + '"]'); q.split(",").forEach(function (x, i) { setTimeout(function () { var bb = document.querySelector('[data-demo="' + x + '"]'); if (bb) bb.click(); }, i * 400); }); }, 300);
})();
