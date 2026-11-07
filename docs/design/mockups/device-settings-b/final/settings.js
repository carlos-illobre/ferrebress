/* Más → Configuración · Lo tuyo (04 · etapa b) · maqueta final (computadora y celular, una sola página).
   Base: ../shared/base.js y ../shared/v2.js del director (la variante 2 «Por dispositivo»), con el
   recibo de lo cortado de ../shared/v1.js. Las preferencias son las de la final aprobada de la etapa
   a (../../device-settings-a/final/settings.js).
   LT.estado son los dispositivos de Rubén Paredes, como los tendría el servidor; LT.casos, cómo es
   este dispositivo, para ver cada caso de la regla desde «Casos» (no es parte del diseño).
   Nada consulta la red: los datos son de ejemplo y la hora corre con un temporizador local.
   La computadora es «pc-oficina» (sin nombre: «Chrome en Windows»); el celular, «celu-ruben». */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mqCelu = window.matchMedia("(max-width: 899px)");
  var mqQuieto = window.matchMedia("(prefers-reduced-motion: reduce)");
  var celu = function () { return mqCelu.matches; };
  if (/captura/.test(location.hash)) document.body.classList.add("captura");
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // Los nombres que ya usan otros dispositivos de la ferretería (para avisar si se repite, R9.3)
  var DE_OTROS = ["Compu del mostrador", "Celu de Juan", "Caja 2", "Tablet del depósito"];
  var MAX = 30;
  var COMO_VIENE = { anim: true, hora: "24" }; // R1.11, R2.1, R3.1

  function inicial() {
    return [
      { id: "pc-oficina", tipo: "pc", nombre: "", auto: "Chrome en Windows", sesion: { como: "Google", entro: "hoy 8:05", uso: "ahora" } },
      { id: "celu-ruben", tipo: "celu", nombre: "Celu de Rubén", auto: "Chrome en Android", huella: { vinc: "12 sep.", uso: "hoy 10:15" }, sesion: { como: "Huella", entro: "hoy 8:12", uso: "hace 3 min" } },
      { id: "pc-mostrador", tipo: "pc", nombre: "Compu del mostrador", auto: "Chrome en Windows", sesion: { como: "qr", via: "celu-ruben", entro: "hoy 8:30", uso: "ahora" } },
      { id: "moto", tipo: "celu", nombre: "Motorola viejo", auto: "Chrome en Android", huella: { vinc: "3 mar.", uso: "4 nov. 19:20" }, sesion: { como: "Huella", entro: "4 nov. 19:20", uso: "4 nov. 19:48" } },
      { id: "notebook", tipo: "laptop", nombre: "", auto: "Chrome en macOS", sesion: { como: "qr", via: "moto", entro: "4 nov. 19:25", uso: "4 nov. 21:10" } }
    ];
  }

  var E = {
    disp: inicial(),
    prefs: { anim: true, hora: "24", offline: false },
    casos: { sistemaQuieto: mqQuieto.matches, instalar: "puede", huellaAca: "mia", permisoOffline: true, sinRed: false }
  };
  // Este dispositivo: en el código lo decide el tipo de dispositivo; acá, el ancho
  function esteId() { return celu() ? "celu-ruben" : "pc-oficina"; }

  /* ---------- Lectura ---------- */
  function d(id) { return E.disp.filter(function (x) { return x.id === id; })[0]; }
  function este() { return d(esteId()); }
  function nombre(x) { return x.nombre || x.auto; }
  function icono(x) { return x.tipo === "celu" ? "smartphone" : x.tipo === "laptop" ? "laptop" : "monitor"; }
  function esEste(x) { return x.id === esteId(); }
  function sesiones() { return E.disp.filter(function (x) { return x.sesion && !esEste(x); }); } // R7.1
  function celularesOtros() { return E.disp.filter(function (x) { return x.tipo === "celu" && x.huella && !esEste(x); }); }
  function hijos(id) { return E.disp.filter(function (x) { return x.sesion && x.sesion.via === id; }); }
  function comoEntro(s) { return s.como === "qr" ? "Con el código de " + nombre(d(s.via)) : "Con " + (s.como === "Huella" ? "la huella" : s.como); }
  // Lo que corta «Se me perdió» o «Quitar» en un celular, para mostrarlo antes y decirlo después (R8.1)
  function loQueCorta(id) {
    var x = d(id), r = [];
    if (x.sesion) r.push({ que: "sesion", txt: "Su sesión" });
    hijos(id).forEach(function (h) { r.push({ que: "hijo", txt: "La sesión de " + nombre(h) + ", que entró con su código" }); });
    if (x.huella) r.push({ que: "huella", txt: "Su huella" });
    return r;
  }
  function repetido(txt) {
    var t = txt.trim().toLowerCase(); if (!t) return false;
    var otros = DE_OTROS.concat(E.disp.filter(function (x) { return !esEste(x) && x.nombre; }).map(function (x) { return x.nombre; }));
    return otros.some(function (n) { return n.toLowerCase() === t; });
  }
  function sugerencias() { return celu() ? ["Celu de Rubén", "Celu del depósito", "Celu de Juan"] : ["Compu de la oficina", "Compu del mostrador", "Caja 2"]; }

  /* ---------- La hora (R3): arranca en 14:30 y avanza de verdad; 24 horas o a. m./p. m. en todo ---------- */
  var base = new Date(); base.setHours(14, 30, 0, 0);
  var t0 = Date.now();
  var NOMBRE_HORA = { "24": "24 horas", "12": "a. m./p. m." };
  function ahora() { return new Date(base.getTime() + (Date.now() - t0)); }
  function fmtHora(h, m, fmt) { return fmt === "12" ? (h % 12 || 12) + ":" + m + " " + (h < 12 ? "a. m." : "p. m.") : h + ":" + m; }
  function hora(fmt, fecha) {
    fecha = fecha || ahora();
    return fmtHora(fecha.getHours(), ("0" + fecha.getMinutes()).slice(-2), fmt === "app" ? E.prefs.hora : fmt);
  }
  // Las horas de los datos («hoy 8:30») se escriben en el formato elegido
  function h(txt) { return String(txt).replace(/(\d{1,2}):(\d{2})/g, function (_, hh, mm) { return fmtHora(+hh, mm, E.prefs.hora); }); }
  function pintarHoras() {
    $$("[data-hora]").forEach(function (el) {
      var f = el.getAttribute("data-hora"), a = el.getAttribute("data-a"), fe;
      if (a) { fe = new Date(base); fe.setHours(+a.split(":")[0], +a.split(":")[1]); }
      var txt = hora(f, fe);
      if (el.textContent !== txt) el.textContent = txt;
    });
  }
  setInterval(pintarHoras, 5000);

  function animando() { return E.prefs.anim && !E.casos.sistemaQuieto; } // R2.3
  function comoViene() { return E.prefs.anim === COMO_VIENE.anim && E.prefs.hora === COMO_VIENE.hora; }
  function vibrar(p) { if (celu()) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* sin vibración */ } } }

  /* ---------- Acciones (las haría el servidor) ---------- */
  function cerrar(id) { d(id).sesion = null; }
  function cerrarTodas() { var n = 0; E.disp.forEach(function (x) { if (x.sesion && !esEste(x)) { x.sesion = null; n++; } }); return n; }
  // Quitar (R6.2): el de la mano solo deja de entrar con la huella y se le apaga «Trabajar sin
  // conexión»; otro, como 02 · R5.6 (su sesión y las computadoras que hizo entrar)
  function quitar(id) {
    var x = d(id);
    if (esEste(x)) { x.huella = null; E.casos.huellaAca = "ninguna"; E.prefs.offline = false; return []; }
    var c = loQueCorta(id);
    hijos(id).forEach(function (hh) { hh.sesion = null; });
    x.huella = null; x.sesion = null; return c;
  }
  // Se me perdió (R8.1): sus sesiones, las de las computadoras que hizo entrar y su huella
  function perdido(id) {
    var c = loQueCorta(id), x = d(id);
    hijos(id).forEach(function (hh) { hh.sesion = null; });
    x.sesion = null; x.huella = null; return c;
  }
  function ponerNombre(txt) { var x = este(); x.nombre = txt.trim().slice(0, MAX); return { dup: repetido(x.nombre) }; }

  /* ---------- Tostadas ---------- */
  function tostada(texto, ic) {
    var box = $(".tostadas");
    if (!box) { box = document.createElement("div"); box.className = "tostadas"; box.setAttribute("role", "status"); document.body.appendChild(box); }
    var t = document.createElement("div");
    t.className = "tostada";
    t.innerHTML = '<i class="i" data-i="' + (ic || "circle-check") + '"></i><span>' + texto + "</span>";
    box.appendChild(t);
    window.pintarIconos(t);
    setTimeout(function () { t.classList.add("se-va"); setTimeout(function () { t.remove(); }, animando() ? 220 : 0); }, 3200);
  }

  /* ---------- Capas: una hoja en el celular, un diálogo en la computadora ---------- */
  var volverA = null;
  function cerrarCapa() {
    var c = $(".capa.abierta"); if (!c) return false;
    c.classList.remove("abierta");
    setTimeout(function () { c.remove(); }, animando() ? 320 : 0);
    if (volverA && document.contains(volverA)) volverA.focus();
    return true;
  }
  function capa(html, alConfirmar, etiqueta) {
    volverA = document.activeElement;
    var c = document.createElement("div");
    c.className = "capa";
    c.innerHTML = '<div class="dialogo" role="dialog" aria-modal="true" aria-labelledby="' + etiqueta + '">' + (celu() ? '<div class="asa"></div>' : "") + html + "</div>";
    document.body.appendChild(c);
    window.pintarIconos(c);
    c.addEventListener("click", function (e) {
      if (e.target === c || e.target.closest("[data-cerrar]")) cerrarCapa();
      if (e.target.closest("[data-confirma]")) { cerrarCapa(); if (alConfirmar) alConfirmar(); }
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add("abierta"); var f = $("[data-confirma]", c) || $("[data-cerrar]", c); if (f) f.focus(); }); });
    return c;
  }
  // «Cerrar todas», con confirmación (R7.2): este dispositivo sigue adentro
  function pedirCerrarTodas() {
    var n = sesiones().length; if (!n) return;
    capa('<h2 id="capa-t">¿Cerrar tus ' + n + ' sesiones en otros dispositivos?</h2><p class="t-detalle">Cada uno vuelve a la entrada con su próximo pedido. ' + (celu() ? "Este celular" : "Esta computadora") + " sigue adentro.</p>" +
      '<div class="pie-dialogo"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button><button type="button" class="btn btn-peligro" data-confirma>Cerrar las ' + n + "</button></div>",
      function () { cerrarTodas(); pintar(); tostada("Se cerraron tus " + n + " sesiones. Seguís adentro acá", "log-out"); vibrar([10, 40, 10]); }, "capa-t");
  }
  // «Vincular este celular con mi huella» (R6.3): lo mismo que el ofrecimiento al entrar (01 · R2.2)
  function pedirHuella() {
    var c = capa('<div class="huella-grande leyendo"><i class="i" data-i="fingerprint"></i></div><h2 class="centrado" id="capa-t">Apoyá el dedo</h2><p class="t-detalle centrado">Lo pide el sistema del celular. Desde ahora entrás con tu huella acá.</p>' +
      '<div class="pie-dialogo"><button type="button" class="btn btn-fantasma" data-cerrar>Ahora no</button></div>', null, "capa-t");
    setTimeout(function () {
      if (document.contains(c) && c.classList.contains("abierta")) {
        cerrarCapa(); este().huella = { vinc: "hoy", uso: "ahora" }; E.casos.huellaAca = "mia"; pintar();
        tostada("Listo: este celular entra con tu huella", "fingerprint"); vibrar([10, 40, 10]);
      }
    }, 1600);
  }
  // Instalar: el pedido del navegador, simulado (R4.1, E20)
  function instalar() {
    capa('<div class="pedido-nav"><span class="pedido-ico"><img src="../../../common/brand/isotype.svg" alt=""></span><h2 id="capa-t">¿Instalar la aplicación?</h2><span class="pedido-sitio">Ferrebress · ferrebress.com.ar</span></div>' +
      '<p class="t-detalle pedido-nota">Esto lo pregunta el navegador, no Ferrebress. Queda con su ícono, como cualquier otra aplicación.</p>' +
      '<div class="pie-dialogo"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button><button type="button" class="btn btn-oscuro" data-confirma>Instalar</button></div>',
      function () { setTimeout(function () { E.casos.instalar = "navegador"; pintar(); tostada("Listo: Ferrebress quedó con su ícono", "circle-check"); vibrar([10, 40, 10]); }, 180); }, "capa-t");
  }

  /* =================== Este dispositivo, dibujado, con su nombre y sus preferencias =================== */
  var editando = false;
  var recibos = []; // { k, titulo, cortes }: lo que se cortó, hasta que se toca «Listo»

  function dibujo(x) {
    return '<div class="aparato ' + (x.tipo === "celu" ? "es-celu" : "es-pc") + '" aria-hidden="true"><div class="aparato-pantalla">' +
      '<span class="aparato-nombre' + (x.nombre ? "" : " sin") + '" data-dibujo-nombre>' + esc(x.nombre || "Sin nombre") + "</span>" +
      '<span class="aparato-auto">' + esc(x.auto) + "</span></div>" + (x.tipo === "celu" ? "" : '<span class="pie-monitor"></span>') + "</div>";
  }
  function x(attr, id, label) { return '<button type="button" class="ficha-x" data-fila ' + attr + '="' + id + '" aria-label="' + label + '" title="' + label + '"><i class="i i-s" data-i="x"></i></button>'; }
  function hijosDe(id, enHero) {
    var hs = hijos(id); if (!hs.length) return "";
    return '<div class="hijos"><div class="hijos-tit"><i class="i i-s" data-i="qr-code"></i>' + (enHero ? "Entraron con el código de este celular" : "Entró con su código") + "</div>" +
      hs.map(function (c) {
        var vivo = c.sesion.uso === "ahora";
        return '<div class="hijo" data-cae="' + c.id + '"><span class="hijo-ico"><i class="i i-s" data-i="' + icono(c) + '"></i></span><span class="hijo-txt"><b>' + esc(nombre(c)) + "</b><span>Entró " + h(c.sesion.entro) + " · " + (vivo ? '<em class="vivo">usada ahora</em>' : "usada " + h(c.sesion.uso)) + "</span></span>" +
          '<span class="se-corta">Se cierra</span>' + x("data-cerrar-ses", c.id, "Cerrar la sesión de " + esc(nombre(c))) + "</div>";
      }).join("") + "</div>";
  }

  function bloqueNombre(x0, esCelu) {
    if (editando) {
      return '<form class="nombre-edit" data-nombre-form autocomplete="off"><input data-nombre-in maxlength="' + MAX + '" value="' + esc(x0.nombre) + '" placeholder="Ej.: ' + esc(sugerencias()[0]) + '" aria-label="Nombre de ' + (esCelu ? "este celular" : "esta computadora") + '"><span class="contador" data-cont></span><button type="submit" class="btn btn-accion chico">Listo</button></form>' +
        '<div class="sugeridos">' + sugerencias().map(function (s, i) { return '<button type="button" class="chip chico-chip" data-sug-v="' + esc(s) + '">' + esc(s) + '<span class="kbd">' + (i + 1) + "</span></button>"; }).join("") + "</div>" +
        '<div class="aviso urgente" data-dup hidden><i class="i" data-i="triangle-alert"></i><span>Otro dispositivo ya se llama así. Se guarda igual.</span></div>';
    }
    return '<button type="button" class="btn ' + (x0.nombre ? "btn-suave" : "btn-accion") + ' chico" data-editar><i class="i i-s" data-i="pen-line"></i>' + (x0.nombre ? "Cambiar el nombre" : "Ponele nombre") + '<span class="kbd">D</span></button>' +
      (x0.nombre ? '<button type="button" class="btn btn-fantasma chico" data-borrar>Borrar<span class="kbd">B</span></button>' : "") +
      '<p class="t-detalle hero-nota"><span class="largo">Es ' + (esCelu ? "del celular" : "de la computadora") + ", no tuyo: lo ven todos en las sesiones, el vínculo, Quién hizo qué y al entrar.</span><span class=\"corto\">Es " + (esCelu ? "del celular" : "de la computadora") + ": lo ven todos</span></p>";
  }

  function bloqueHuella(x0) {
    var hc = E.casos.huellaAca, hu;
    if (hc === "otra") hu = '<div class="aviso pino"><i class="i" data-i="fingerprint"></i><span>Este celular tiene la huella de otra persona.</span></div>';
    else if (x0.huella) hu = '<div class="ficha hue grande"><i class="i i-s" data-i="fingerprint"></i><span class="ficha-txt"><span>Tu huella está acá desde ' + h(x0.huella.vinc).replace(/ /g, "&nbsp;") + '</span><span class="ficha-det">Último uso ' + h(x0.huella.uso) + '</span></span><button type="button" class="btn btn-fantasma chico" data-quitar-esta="' + x0.id + '">Quitar</button></div>';
    else hu = '<button type="button" class="btn btn-oscuro vincular" data-vincular><i class="i" data-i="fingerprint"></i>Vincular este celular con mi huella</button>';
    return '<div class="del-servidor hero-huella">' + hu + hijosDe(x0.id, true) + "</div>";
  }

  // Las preferencias: los renglones de la etapa a (aprobada), con su línea de qué cambia (R1.2)
  function bloquePrefs(esCelu) {
    var p = E.prefs, c = E.casos, quiet = c.sistemaQuieto;
    var ci = c.instalar;
    if (ci === "iphone" && !esCelu) ci = "nosabe";
    var inst = { puede: [esCelu ? "Instalar en este celular" : "Instalar en este dispositivo", esCelu ? "Abrila desde un ícono" : "Queda con su ícono, para abrirla como cualquier otra aplicación."],
      navegador: ["Ya está instalada", "Abrila desde su ícono."],
      iphone: ["Instalar en este celular", "Tocá Compartir y después Agregar a inicio"] }[ci];
    var instAcc = ci === "puede" ? '<button type="button" class="btn btn-accion chico" data-instalar><i class="i i-s" data-i="download"></i>Instalar<span class="kbd">I</span></button>'
      : ci === "navegador" ? '<span class="pastilla logro"><i class="i i-s" data-i="check"></i>Instalada</span>'
      : '<span class="pastilla contorno"><i class="i i-s" data-i="share"></i>Compartir</span>';

    // Trabajar sin conexión, solo en el celular (R5)
    var off = "";
    if (esCelu && c.permisoOffline) {
      var sinHuella = c.huellaAca !== "mia";
      if (sinHuella) p.offline = false;
      var que = c.huellaAca === "otra" ? "Este celular tiene la huella de otra persona: solo ella puede trabajar sin conexión acá."
        : c.huellaAca === "ninguna" ? "Para usarla, primero vinculá tu huella en este celular"
        : c.sinRed && !p.offline ? "Para prenderla hace falta conexión"
        : p.offline ? "Entrás con tu huella aunque no haya internet, hasta 24 h" : "Entrá con tu huella aunque no haya internet";
      off = '<div class="ajuste' + (sinHuella ? " apagado" : "") + '" id="ajuste-offline"><div class="ajuste-cab"><span class="ajuste-ico"><i class="i" data-i="wifi-off"></i></span>' +
        '<div><div class="ajuste-nombre" id="n-off">Trabajar sin conexión</div><div class="ajuste-que">' + que + "</div></div>" +
        '<button type="button" class="llave" role="switch" aria-checked="' + (p.offline ? "true" : "false") + '" aria-labelledby="n-off" data-pref="offline"' + (sinHuella ? " disabled" : "") + "></button></div></div>";
    }

    return '<div class="hero-prefs"><div class="hero-sub">Cómo ' + (esCelu ? "lo" : "la") + ' usás vos acá</div>' +
      // Animaciones (R2)
      '<div class="ajuste" id="ajuste-anim"><div class="ajuste-cab"><span class="ajuste-ico"><i class="i" data-i="sparkles"></i></span>' +
      '<div><div class="ajuste-nombre" id="n-anim">Animaciones</div><div class="ajuste-que"><span class="largo">Las ventanas, las hojas y los avisos aparecen con un movimiento corto. Apagadas, todo aparece en el acto.</span><span class="corto">Pantallas y avisos con un movimiento corto</span></div></div>' +
      '<span class="kbd">A</span><button type="button" class="llave" role="switch" aria-checked="' + (p.anim ? "true" : "false") + '" aria-labelledby="n-anim" data-pref="anim"></button></div>' +
      '<div class="ajuste-cuerpo"><div class="muestra' + (!p.anim && !quiet ? " en-el-acto" : "") + (quiet ? " quieta" : "") + '"><div class="escena" aria-hidden="true"><span class="ventana"></span><span class="aviso-mini"></span></div>' +
      '<div class="muestra-leyenda">' + (animando() ? "<b>Así se mueve ahora.</b> " + (esCelu ? "Corto, nunca te hace esperar." : "Corto: nunca te hace esperar.") : "<b>Así, en el acto.</b> " + (esCelu ? "Sin movimiento." : "Aparece y desaparece, sin moverse.")) + "</div>" +
      '<span class="espera-ej solo-compu"><span class="espera"></span>La espera gira siempre</span></div>' +
      (quiet ? '<div class="aviso pino aviso-sistema"><i class="i" data-i="accessibility"></i><span><span class="largo">Este dispositivo ya pide no animar. Manda el sistema: para cambiarlo, andá a sus ajustes de accesibilidad.</span><span class="corto">Este dispositivo ya pide no animar</span></span></div>' : "") +
      "</div></div>" +
      // El formato de la hora (R3)
      '<div class="ajuste" id="ajuste-hora"><div class="ajuste-cab"><span class="ajuste-ico"><i class="i" data-i="clock"></i></span>' +
      '<div><div class="ajuste-nombre" id="n-hora">Formato de la hora</div><div class="ajuste-que"><span class="largo">Cambia solo cómo se escribe la hora en toda la aplicación. La hora es la del negocio, la misma para todos.</span><span class="corto">Solo cómo se escribe; la hora es la del negocio</span></div></div>' +
      '<span class="kbd">H</span></div><div class="ajuste-cuerpo"><div class="formatos" role="radiogroup" aria-labelledby="n-hora">' +
      ["24", "12"].map(function (f) { return '<button type="button" class="formato" role="radio" aria-checked="' + (p.hora === f ? "true" : "false") + '" data-formato="' + f + '"><span class="formato-hora" data-hora="' + f + '"></span><span class="formato-nombre">' + NOMBRE_HORA[f] + '</span><span class="formato-ok"><i class="i i-s" data-i="check"></i></span></button>'; }).join("") +
      '</div><div class="donde-se-ve solo-compu">Se ve así en <span class="pastilla contorno"><i class="i i-s" data-i="history"></i>Quién hizo qué · <span data-hora="app" data-a="9:05"></span></span></div></div></div>' +
      // Instalar (R4)
      (inst ? '<div class="ajuste" id="ajuste-instalar"><div class="ajuste-cab"><span class="ajuste-ico"><i class="i" data-i="app-window"></i></span><div><div class="ajuste-nombre">' + inst[0] + '</div><div class="ajuste-que">' + inst[1] + "</div></div>" + instAcc + "</div></div>" : "") +
      off + "</div>";
  }

  function hero() {
    var x0 = este(), esCelu = x0.tipo === "celu";
    return '<article class="tarjeta hero" aria-label="' + (esCelu ? "Este celular" : "Esta computadora") + '">' +
      '<div class="hero-cab"><span class="t-etiqueta">' + (esCelu ? "Este celular" : "Esta computadora") + '</span><span class="pastilla logro chica"><span class="punto"></span>Lo estás usando</span></div>' +
      '<div class="hero-dibujo del-servidor">' + dibujo(x0) + "</div>" +
      '<div class="hero-nombre del-servidor">' + bloqueNombre(x0, esCelu) + "</div>" +
      (esCelu ? bloqueHuella(x0) : "") +
      bloquePrefs(esCelu) + "</article>";
  }

  /* =================== Los otros: una tarjeta por dispositivo, con lo que hizo entrar colgado =================== */
  function raices() {
    return E.disp.filter(function (x0) {
      if (esEste(x0) || !(x0.sesion || x0.huella)) return false;
      var v = x0.sesion && x0.sesion.via; if (!v) return true;
      var p = d(v); return !(p && (p.sesion || p.huella)); // si el que lo hizo entrar ya no está, va suelto
    });
  }
  function familia(x0) {
    var esCelu = x0.tipo === "celu", s = x0.sesion, hu = x0.huella;
    var fichas = (s ? '<span class="ficha ses" data-cae="' + x0.id + '-s"><span class="punto"></span><span>' + (s.uso === "ahora" ? "Usada ahora" : "Sesión abierta · " + h(s.uso)) + '</span><span class="ficha-det">' + esc(comoEntro(s)) + " · entró " + h(s.entro) + '</span><span class="se-corta">Se cierra</span>' + x("data-cerrar-ses", x0.id, "Cerrar la sesión") + "</span>" : "") +
      (hu ? '<span class="ficha hue" data-cae="' + x0.id + '-h"><i class="i i-s" data-i="fingerprint"></i><span>Huella desde ' + h(hu.vinc) + '</span><span class="ficha-det">Último uso ' + h(hu.uso) + '</span><span class="se-corta">Se quita</span>' + x("data-quitar", x0.id, "Quitar la huella") + "</span>" : "");
    return '<article class="tarjeta fam" data-fam="' + x0.id + '">' +
      '<div class="fam-cab"><span class="fam-ico"><i class="i" data-i="' + icono(x0) + '"></i></span><div class="fam-txt"><h3>' + esc(nombre(x0)) + "</h3><span>" + (x0.nombre ? esc(x0.auto) : "Sin nombre") + "</span></div>" +
      (esCelu ? '<button type="button" class="btn btn-peligro chico" data-fila data-perdido="' + x0.id + '"><i class="i i-s" data-i="scissors"></i>Se me perdió</button>' : "") + "</div>" +
      '<div class="fichas">' + fichas + "</div>" + hijosDe(x0.id, false) + "</article>";
  }
  function recibo(r) {
    return '<div class="recibo" role="status"><div class="recibo-cab"><span class="recibo-ico"><i class="i" data-i="scissors"></i></span><div><b>' + esc(r.titulo) + '</b><div class="t-detalle">Nadie puede entrar con él.</div></div>' +
      '<button type="button" class="btn btn-fantasma chico" data-fila data-recibo-ok="' + r.k + '">Listo</button></div><ul>' +
      (r.cortes.length ? r.cortes : [{ txt: "No tenía nada abierto" }]).map(function (c) { return '<li><i class="i i-s" data-i="check"></i>' + esc(c.txt) + "</li>"; }).join("") + "</ul></div>";
  }
  function otros() {
    var r = raices(), ses = sesiones().length, hue = celularesOtros().length;
    return '<div class="cuentas"><div class="resumen"><span class="ico"><i class="i" data-i="monitor-smartphone"></i></span><div><div class="et">Sesiones abiertas</div><div class="va">' + ses + '</div></div></div>' +
      '<div class="resumen"><span class="ico"><i class="i" data-i="fingerprint"></i></span><div><div class="et">Con tu huella</div><div class="va">' + hue + "</div></div></div>" +
      (ses > 1 ? '<button type="button" class="btn todas" data-todas><i class="i i-s" data-i="log-out"></i>Cerrar todas<span class="kbd">T</span></button>' : "") + "</div>" +
      (recibos.length ? '<div class="recibos">' + recibos.map(recibo).join("") + "</div>" : "") +
      (r.length ? '<div class="familias">' + r.map(familia).join("") + "</div>" : '<p class="vacio"><i class="i" data-i="circle-check"></i>No tenés nada abierto en otro dispositivo. Solo ' + (celu() ? "este celular" : "esta computadora") + ".</p>");
  }

  /* =================== «Así la tenés» (R1.10) y «Volver a como viene» (R1.11) =================== */
  function pintarAsi() {
    var p = E.prefs, chico = celu(), tag = chico ? "button" : "span";
    function pastilla(va, ic, html) {
      return "<" + tag + (chico ? ' type="button" data-va="' + va + '"' : "") + ' class="pastilla asi-pastilla"><i class="i i-s" data-i="' + ic + '"></i>' + html + "</" + tag + ">";
    }
    var ci = E.casos.instalar; if (ci === "iphone" && !chico) ci = "nosabe";
    var conInst = ci !== "icono" && ci !== "nosabe";
    var conOff = chico && E.casos.permisoOffline;
    $("[data-asi]").innerHTML =
      pastilla("anim", "sparkles", animando() ? "Con movimiento" : "En el acto") +
      pastilla("hora", "clock", '<span data-hora="app"></span>' + (chico ? "" : '<span class="tipo">· ' + NOMBRE_HORA[p.hora] + "</span>")) +
      (conInst ? pastilla("instalar", "app-window", ci === "navegador" ? "Instalada" : chico ? "Navegador" : "En el navegador") : "") +
      (conOff ? pastilla("offline", "wifi-off", p.offline ? "También sin conexión" : "Solo con internet") : "");
    $("[data-reset]").hidden = comoViene();
  }

  /* =================== Pintar =================== */
  var marcarEn = null; // después de tocar con Enter, la marca vuelve al botón que quedó en su lugar
  function pintar() {
    document.body.classList.toggle("quieto", !animando());
    document.body.classList.toggle("offline", E.casos.sinRed);
    $("[data-este]").innerHTML = hero();
    $("[data-otros]").innerHTML = otros();
    $$("[data-nombre-de]").forEach(function (el) { el.textContent = nombre(d(el.getAttribute("data-nombre-de"))); });
    var luz = $("[data-luz]");
    luz.classList.toggle("sin", E.casos.sinRed);
    $("[data-luz-txt]").textContent = E.casos.sinRed ? "Sin conexión · 0 por enviar" : "En línea · todo enviado";
    pintarAsi();
    pintarHoras();
    window.pintarIconos();
    if (editando) { var i = $("[data-nombre-in]"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); contar(false); } }
    if (marcarEn !== null) { var fs = filas(); marcar(fs[Math.min(marcarEn, fs.length - 1)] || null); marcarEn = null; }
  }

  /* ---------- El nombre: se escribe en la pantalla del dibujo, letra por letra (R9) ---------- */
  function contar(latir) {
    var i = $("[data-nombre-in]"); if (!i) return;
    var v = i.value, t = $("[data-dibujo-nombre]");
    t.textContent = v || "Sin nombre"; t.classList.toggle("sin", !v);
    if (latir) { t.classList.remove("late"); void t.offsetWidth; t.classList.add("late"); }
    var c = $("[data-cont]"); c.textContent = v.length + "/" + MAX; c.classList.toggle("lleno", v.length >= MAX);
    $("[data-dup]").hidden = !repetido(v);
  }
  function borrarNombre() {
    editando = false; var x0 = este(); x0.nombre = ""; pintar();
    tostada("Sin nombre: vuelve a ser «" + esc(x0.auto) + "»", "rotate-ccw");
  }
  function guardar(v) {
    if (!v.trim()) { borrarNombre(); return; }
    editando = false;
    var r = ponerNombre(v); pintar();
    tostada("Ahora todos " + (celu() ? "lo" : "la") + " ven como «" + esc(nombre(este())) + "»" + (r.dup ? ". Ojo: hay otro igual" : ""), r.dup ? "triangle-alert" : "circle-check");
    var a = $(".aparato"); if (a) a.classList.add("brilla");
    vibrar([10, 40, 10]);
    var b = $("[data-editar]"); if (b) b.focus();
  }
  document.addEventListener("input", function (e) { if (e.target.matches("[data-nombre-in]")) contar(true); });
  document.addEventListener("submit", function (e) { if (e.target.matches("[data-nombre-form]")) { e.preventDefault(); guardar($("[data-nombre-in]").value); } });

  /* ---------- Antes de cortar: lo que se va se pone rojo (R1.8). Con el mouse, al apuntar; con el
     teclado, al llegar con la marca; en el celular, mientras el dedo está apoyado ---------- */
  var SEL_CORTA = "[data-perdido], .fam [data-quitar]";
  function apuntar(id, si) { var f = $('[data-fam="' + id + '"]'); if (f) f.classList.toggle("apuntado", si); }
  ["pointerover", "focusin"].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var b = e.target.closest && e.target.closest(SEL_CORTA);
      if (b) apuntar(b.getAttribute("data-perdido") || b.getAttribute("data-quitar"), true);
    });
  });
  ["pointerout", "focusout", "pointercancel"].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var b = e.target.closest && e.target.closest(SEL_CORTA);
      if (b) apuntar(b.getAttribute("data-perdido") || b.getAttribute("data-quitar"), false);
    });
  });
  function caer(sel, despues) {
    var els = $$(sel);
    els.forEach(function (el, i) { el.style.transitionDelay = (i * 60) + "ms"; el.classList.add("cae"); });
    setTimeout(despues, animando() && els.length ? 300 + els.length * 60 : 0);
  }

  /* ---------- Clics ---------- */
  document.addEventListener("click", function (e) {
    var t, p = E.prefs;
    if (e.target.closest("[data-editar]")) { editando = true; pintar(); return; }
    if (e.target.closest("[data-borrar]")) { borrarNombre(); return; }
    if ((t = e.target.closest("[data-sug-v]"))) { var i = $("[data-nombre-in]"); i.value = t.getAttribute("data-sug-v"); contar(true); setTimeout(function () { guardar(i.value); }, animando() ? 250 : 0); return; }
    if (e.target.closest("[data-todas]")) { pedirCerrarTodas(); return; }
    if (e.target.closest("[data-vincular]")) { pedirHuella(); return; }
    if (e.target.closest("[data-instalar]")) { instalar(); return; }
    if (e.target.closest("[data-indicador]")) { tostada("El detalle del vínculo está en su maqueta aprobada", "smartphone"); return; }
    if ((t = e.target.closest("[data-recibo-ok]"))) { var k = t.getAttribute("data-recibo-ok"); recibos = recibos.filter(function (r) { return r.k !== k; }); pintar(); return; }
    if ((t = e.target.closest("[data-cerrar-ses]"))) {
      var id = t.getAttribute("data-cerrar-ses"), n = nombre(d(id));
      caer('[data-cae="' + id + '"], [data-cae="' + id + '-s"]', function () { cerrar(id); pintar(); tostada("Se cerró la sesión de " + esc(n), "log-out"); });
      return;
    }
    if ((t = e.target.closest(SEL_CORTA))) {
      var pid = t.getAttribute("data-perdido") || t.getAttribute("data-quitar"), esPerdido = t.hasAttribute("data-perdido"), nom = nombre(d(pid));
      apuntar(pid, true);
      caer('[data-fam="' + pid + '"] .ficha, [data-fam="' + pid + '"] .hijo', function () {
        var c = esPerdido ? perdido(pid) : quitar(pid);
        recibos.unshift({ k: pid + Date.now(), titulo: (esPerdido ? "Cortaste " : "Quitaste la huella de ") + nom, cortes: c });
        pintar(); tostada((esPerdido ? "Cortaste " : "Sin huella: ") + esc(nom) + ". Nadie entra con él", "scissors"); vibrar([10, 40, 10]);
      });
      return;
    }
    if ((t = e.target.closest("[data-quitar-esta]"))) { quitar(t.getAttribute("data-quitar-esta")); pintar(); tostada("Seguís adentro. Este celular ya no entra con tu huella", "fingerprint"); return; }
    // Las preferencias (etapa a)
    if (e.target.closest("[data-pref=anim]")) { p.anim = !p.anim; vibrar(10); pintar(); $("[data-pref=anim]").focus(); return; }
    if ((t = e.target.closest("[data-formato]"))) { p.hora = t.getAttribute("data-formato"); vibrar(10); pintar(); $('[data-formato="' + p.hora + '"]').focus(); return; }
    if ((t = e.target.closest("[data-pref=offline]"))) {
      if (!p.offline && E.casos.sinRed) { tostada("Para prenderla hace falta conexión", "wifi-off"); return; }
      p.offline = !p.offline; pintar();
      if (p.offline) { tostada("Listo: este celular entra sin conexión", "circle-check"); vibrar([10, 40, 10]); }
      return;
    }
    if (e.target.closest("[data-reset]")) { p.anim = COMO_VIENE.anim; p.hora = COMO_VIENE.hora; pintar(); tostada("Volvió a como viene", "rotate-ccw"); $("[data-pref=anim]").focus(); return; }
    // Celular: cada pastilla de «Así la tenés» lleva a su preferencia
    if ((t = e.target.closest("[data-va]"))) {
      var fila = document.getElementById("ajuste-" + t.getAttribute("data-va"));
      if (fila) fila.scrollIntoView({ behavior: animando() ? "smooth" : "auto", block: "center" });
    }
  });

  /* ---------- Teclado de la computadora (R1.9; 00 · R2) ---------- */
  // La marca: ↑ ↓ recorren los botones de cada dispositivo (Se me perdió, las ×, «Listo» del recibo),
  // que no llevan tecla con Alt, como en la tarjeta de Usuarios (02 · R5.8); Enter toca el marcado
  var marcado = null;
  // Las × de un dispositivo marcado en rojo se esconden, pero siguen en el recorrido
  function filas() { return $$("[data-fila]").filter(function (b) { return !b.closest("[hidden]") && !b.closest(".offline .del-servidor"); }); }
  function marcar(el) {
    // Al dejar «Se me perdió», sale el rojo y vuelven las × (por eso primero se suelta el foco)
    if (marcado) { marcado.classList.remove("marca-tecla"); if (document.activeElement === marcado) marcado.blur(); }
    marcado = el;
    if (el) { el.classList.add("marca-tecla"); el.focus({ preventScroll: true }); el.scrollIntoView({ block: "nearest" }); }
  }
  document.addEventListener("mousemove", function (e) { if (marcado && (e.movementX || e.movementY)) marcar(null); });

  var ALT = {
    a: "[data-pref=anim]", i: "[data-instalar]", o: "[data-reset]", l: ".indicador",
    d: "[data-editar]", b: "[data-borrar]", t: "[data-todas]"
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (cerrarCapa()) return;
      if (editando) { editando = false; pintar(); var be = $("[data-editar]"); if (be) be.focus(); return; }
      marcar(null); return;
    }
    if (celu()) return;
    if (e.key === "Alt") { document.body.classList.add("alt"); e.preventDefault(); return; }
    var enCampo = e.target.matches && e.target.matches("input");
    if (!e.altKey && !enCampo && !$(".capa.abierta") && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      var fs = filas(); if (!fs.length) return;
      e.preventDefault();
      var i = fs.indexOf(marcado);
      i = i < 0 ? (e.key === "ArrowDown" ? 0 : fs.length - 1) : Math.max(0, Math.min(fs.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
      marcar(fs[i]); return;
    }
    if (e.key === "Enter" && marcado && document.activeElement === marcado) {
      e.preventDefault(); marcarEn = filas().indexOf(marcado); var m = marcado; marcar(null); m.click(); return;
    }
    if (!e.altKey || !e.key || e.key.length !== 1 || $(".capa.abierta")) return;
    var k = e.key.toLowerCase();
    if (k === "h") { e.preventDefault(); E.prefs.hora = E.prefs.hora === "24" ? "12" : "24"; pintar(); $('[data-formato="' + E.prefs.hora + '"]').focus(); return; }
    if (/^[123]$/.test(k) && editando) { e.preventDefault(); var sg = $$("[data-sug-v]")[+k - 1]; if (sg) sg.click(); return; }
    if (!(k in ALT)) return;
    e.preventDefault();
    var el = $(ALT[k]);
    if (el && !el.disabled && !el.closest("[hidden]") && !el.closest(".offline .del-servidor")) { el.click(); var el2 = $(ALT[k]); if (el2) el2.focus(); }
  });
  document.addEventListener("keyup", function (e) { if (e.key === "Alt") document.body.classList.remove("alt"); });
  window.addEventListener("blur", function () { document.body.classList.remove("alt"); });

  /* ---------- Casos: no es parte de la pantalla ---------- */
  function armarCasos() {
    var b = document.createElement("button");
    b.className = "casos-btn"; b.type = "button";
    b.innerHTML = '<i class="i i-s" data-i="sliders-horizontal"></i>Casos';
    var p = document.createElement("div");
    p.className = "casos"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Casos de la regla");
    function radios(name, opts) {
      return opts.map(function (o) { return '<label><input type="radio" name="' + name + '" value="' + o[0] + '"' + (E.casos[name] === o[0] ? " checked" : "") + ">" + o[1] + "</label>"; }).join("");
    }
    p.innerHTML = '<h3>Casos de la regla</h3><p class="casos-nota">No es parte de la pantalla: cambia cómo está el dispositivo para ver cada caso.</p>' +
      '<fieldset><legend>La conexión (R10)</legend><label><input type="checkbox" name="sinRed">Sin conexión</label></fieldset>' +
      '<fieldset><legend>El sistema (R2.3)</legend><label><input type="checkbox" name="sistemaQuieto"' + (E.casos.sistemaQuieto ? " checked" : "") + ">Pide no animar (reducir movimiento)</label></fieldset>" +
      "<fieldset><legend>Instalar (R4)</legend>" + radios("instalar", [["puede", "El navegador sabe instalar"], ["navegador", "Ya instalada, abierta en el navegador"], ["icono", "Abierta desde su ícono"], ["iphone", "iPhone (solo celular)"], ["nosabe", "El navegador no sabe instalar"]]) + "</fieldset>" +
      '<fieldset class="solo-celu"><legend>La huella en este celular (R6.3)</legend>' + radios("huellaAca", [["mia", "La mía"], ["ninguna", "Ninguna"], ["otra", "La de otra persona"]]) + "</fieldset>" +
      '<fieldset class="solo-celu"><legend>Trabajar sin conexión (R5)</legend><label><input type="checkbox" name="permisoOffline" checked>Con el permiso</label></fieldset>' +
      '<button type="button" class="btn chico" data-reiniciar>Volver a empezar</button>';
    p.addEventListener("change", function (e) {
      var t = e.target;
      E.casos[t.name] = t.type === "checkbox" ? t.checked : t.value;
      if (t.name === "huellaAca") este().huella = t.value === "mia" ? { vinc: "12 sep.", uso: "hoy 10:15" } : null;
      pintar();
    });
    p.addEventListener("click", function (e) {
      if (!e.target.closest("[data-reiniciar]")) return;
      E.disp = inicial(); recibos = []; editando = false;
      E.casos.huellaAca = "mia"; var r = $('input[value="mia"]', p); if (r) r.checked = true;
      pintar();
    });
    b.addEventListener("click", function () { p.classList.toggle("abierto"); });
    document.body.appendChild(b); document.body.appendChild(p);
    window.pintarIconos(b);
  }

  function alCambiar(mq, f) { if (mq.addEventListener) mq.addEventListener("change", f); else mq.addListener(f); }
  // Si el sistema cambia «reducir movimiento» con la pantalla abierta, manda al momento (R2.3)
  alCambiar(mqQuieto, function () { E.casos.sistemaQuieto = mqQuieto.matches; var cb = $('.casos input[name="sistemaQuieto"]'); if (cb) cb.checked = mqQuieto.matches; pintar(); });
  alCambiar(mqCelu, function () { editando = false; marcar(null); pintar(); });

  armarCasos();
  pintar();
})();
