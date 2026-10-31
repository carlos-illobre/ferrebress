/* El marco de Usuarios y las piezas comunes a las tres variantes. Cada variante llama a
   M.compu() o M.celu() y pone lo suyo en la tarjeta de la persona y en «Autorizar a alguien». */
(function () {
  var C = "../../../../common/";
  var M = window.M = {};
  M.confirmado = false; /* Google o la huella de los últimos 5 minutos (R3.8) */

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  M.el = el;
  M.iconos = function (root) { if (window.pintarIconos) window.pintarIconos(root); };

  M.av = function (p, cls) { return '<span class="av ' + (cls || "") + '" style="' + R.tono(p) + '">' + R.iniciales(p) + "</span>"; };
  M.pills = function (roles) {
    return roles.map(function (id) { var r = R.rol(id); return '<span class="pastilla rol"><i class="i i-s" data-i="shield-check"></i>' + r.nombre + "</span>"; }).join("");
  };

  /* ---------- Computadora ---------- */
  M.compu = function (o) {
    o = o || {};
    document.body.insertAdjacentHTML("afterbegin",
      '<div class="app">' +
      '<nav class="lateral">' +
      '<div class="marca"><img src="' + C + 'brand/logo-on-light.png" alt="Ferrebress"></div>' +
      '<a class="nav-item" data-ir="sales"><i class="i" data-i="shopping-cart"></i><span class="txt">Vender</span></a>' +
      '<a class="nav-item" data-ir="products"><i class="i" data-i="tags"></i><span class="txt">Catálogo</span></a>' +
      '<a class="nav-item" data-ir="stock"><i class="i" data-i="package"></i><span class="txt">Depósito</span></a>' +
      '<a class="nav-item" data-ir="business-overview"><i class="i" data-i="chart-column"></i><span class="txt">Negocio</span></a>' +
      '<a class="nav-item activo" data-ir="more"><i class="i" data-i="ellipsis"></i><span class="txt">Más</span></a>' +
      '<div class="pie"><div class="pastilla logro" style="justify-self:start"><span class="punto"></span>En línea · todo enviado</div>' +
      '<div class="usuario"><span class="avatar">RP</span><div class="txt"><div style="font-weight:750;font-size:15px">Rubén Paredes</div><div class="t-detalle">Administrador</div></div></div></div>' +
      "</nav>" +
      '<main class="contenido">' +
      '<header class="cabecera"><div class="t-titulo">Usuarios</div><div class="acciones">' +
      '<button class="btn"><i class="i" data-i="smartphone"></i>Se perdió un celular</button>' +
      '<button class="btn btn-accion" id="btn-autorizar"><i class="i" data-i="user-plus"></i>Autorizar a alguien <span class="kbd">Alt A</span></button></div></header>' +
      '<nav class="pestanas"><a class="activa">Usuarios</a><a data-ir="users-roles">Roles</a><a data-ir="audit-log">Auditoría</a></nav>' +
      '<section class="pantalla" id="pantalla"></section></main></div><div class="tostadas"></div>');
    var b = document.getElementById("btn-autorizar");
    if (o.alAutorizar) b.addEventListener("click", o.alAutorizar);
    document.addEventListener("keydown", function (e) {
      if (e.altKey && (e.key === "a" || e.key === "A") && o.alAutorizar) { e.preventDefault(); o.alAutorizar(); }
    });
    return document.getElementById("pantalla");
  };

  /* ---------- Celular ---------- */
  M.celu = function (o) {
    o = o || {};
    document.body.classList.add("celu-body");
    document.body.insertAdjacentHTML("afterbegin",
      '<div class="celu" id="celu">' +
      '<div class="barra-estado"><span>10:42</span><span class="se"><i class="i i-s" data-i="wifi"></i><svg width="26" height="13" viewBox="0 0 26 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="#1A1D1B" opacity=".4"/><rect x="2" y="2" width="16" height="9" rx="2" fill="#1A1D1B"/></svg></span></div>' +
      '<div class="celu-cabecera"><span class="t-titulo">Usuarios</span><button class="btn btn-icono" aria-label="Buscar usuario"><i class="i" data-i="search"></i></button></div>' +
      '<div class="celu-estado"><span class="punto"></span>En línea · todo enviado</div>' +
      '<nav class="celu-pestanas"><a class="activa">Usuarios</a><a data-ir="users-roles">Roles</a><a data-ir="audit-log">Auditoría</a></nav>' +
      '<div class="celu-pantalla" id="pantalla"></div>' +
      '<div class="barra-accion" id="barra-accion"><button class="btn btn-accion grande" style="width:100%" id="btn-autorizar"><i class="i i-l" data-i="user-plus"></i>Autorizar a alguien</button></div>' +
      '<nav class="nav-inferior">' +
      '<a data-ir="sales"><i class="i" data-i="shopping-cart"></i>Vender</a><a data-ir="products"><i class="i" data-i="tags"></i>Catálogo</a>' +
      '<a data-ir="stock"><i class="i" data-i="package"></i>Depósito</a><a data-ir="business-overview"><i class="i" data-i="chart-column"></i>Negocio</a>' +
      '<a class="activo" data-ir="more"><i class="i" data-i="menu"></i>Más</a></nav>' +
      '<span class="home-ind"></span><div class="tostadas"></div></div>');
    var b = document.getElementById("btn-autorizar");
    if (o.alAutorizar) b.addEventListener("click", o.alAutorizar);
    return document.getElementById("pantalla");
  };

  /* ---------- Lista de personas (R3.1) ---------- */
  M.lista = function (cont, o) {
    var celu = !!document.getElementById("celu") || o.rolesAbajo;
    var html = "", grupo = "";
    R.ordenadas().forEach(function (p) {
      var g = p.estado === "baja" ? "Dadas de baja" : "Pueden entrar";
      if (g !== grupo) { grupo = g; html += '<div class="grupo-tit">' + g + "</div>"; }
      html += '<button class="pers ' + (p.estado === "baja" ? "baja " : "") + (o.elegida === p.id ? "elegida" : "") + '" data-p="' + p.id + '">' +
        M.av(p) + '<span style="min-width:0"><span class="nom">' + R.mostrar(p) + (p.estado === "vos" ? ' <span class="vos">Vos</span>' : "") + "</span>" +
        '<span class="cor">' + p.entro + "</span>" + (celu ? '<span class="roles">' + M.pills(p.roles) + "</span>" : "") + "</span>" +
        (celu ? "" : '<span class="roles">' + M.pills(p.roles) + "</span>") +
        '<i class="i chev" data-i="chevron-right"></i></button>';
    });
    cont.innerHTML = html;
    M.iconos(cont);
    cont.querySelectorAll(".pers").forEach(function (b) {
      b.addEventListener("click", function () { o.alElegir(b.getAttribute("data-p")); });
    });
  };

  /* ---------- Tostada ---------- */
  M.tostada = function (txt, deshacer) {
    var host = document.querySelector(".tostadas");
    var t = el('<div class="tostada"><i class="i" data-i="circle-check"></i><span>' + txt + "</span>" + (deshacer ? "<button>Deshacer</button>" : "") + "</div>");
    host.appendChild(t); M.iconos(t);
    if (deshacer) t.querySelector("button").addEventListener("click", function () { deshacer(); quitar(); });
    if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
    var tm = setTimeout(quitar, 4200);
    function quitar() { clearTimeout(tm); t.classList.add("fuera"); setTimeout(function () { t.remove(); }, 260); }
  };

  /* ---------- Velo, diálogo (compu) y hoja (celu) ---------- */
  var pila = [];
  M.abrir = function (html, o) {
    o = o || {};
    var celu = document.getElementById("celu");
    var host = celu || document.body;
    var velo = el('<div class="velo"></div>');
    var caja = celu ? el('<div class="hoja" role="dialog"><div class="asa"></div>' + html + "</div>") : el('<div class="dialogo" role="dialog">' + html + "</div>");
    if (o.ancho && !celu) caja.style.width = o.ancho + "px";
    host.appendChild(velo); host.appendChild(caja); M.iconos(caja);
    requestAnimationFrame(function () { requestAnimationFrame(function () { velo.classList.add("abierto"); caja.classList.add(celu ? "abierta" : "abierto"); }); });
    var h = { el: caja, cerrar: function () {
      velo.classList.remove("abierto"); caja.classList.remove("abierta", "abierto");
      setTimeout(function () { velo.remove(); caja.remove(); }, 330);
      pila = pila.filter(function (x) { return x !== h; });
      if (o.alCerrar) o.alCerrar();
    } };
    velo.addEventListener("click", h.cerrar);
    pila.push(h);
    return h;
  };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pila.length) pila[pila.length - 1].cerrar(); });

  /* ---------- Página que entra desde la derecha (celu) ---------- */
  M.pagina = function (titulo, html) {
    var celu = document.getElementById("celu");
    var p = el('<section class="pagina"><div class="barra-estado"><span>10:42</span><span></span></div><button class="volver"><i class="i i-l" data-i="chevron-left"></i>' + titulo + '</button><div class="cuerpo">' + html + "</div></section>");
    celu.insertBefore(p, celu.querySelector(".barra-accion"));
    M.iconos(p);
    requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.add("abierta"); }); });
    var h = { el: p, cuerpo: p.querySelector(".cuerpo"), cerrar: function () { p.classList.remove("abierta"); setTimeout(function () { p.remove(); }, 330); } };
    p.querySelector(".volver").addEventListener("click", h.cerrar);
    return h;
  };

  /* ---------- Confirmá que sos vos (R3.8): Google en la compu, la huella en el celular ---------- */
  var G = '<svg class="g" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>';
  M.confirmar = function (motivo, seguir) {
    if (M.confirmado) { seguir(); return; }
    var celu = !!document.getElementById("celu");
    var h = M.abrir('<div class="' + (celu ? "hc " : "") + 'reauth"><div class="sello"><i class="i" data-i="' + (celu ? "fingerprint" : "lock-keyhole") + '"></i></div>' +
      '<h2 style="margin:0 0 6px;font-size:22px;font-weight:800">Confirmá que sos vos</h2>' +
      '<p class="t-detalle" style="margin:0 auto 20px;max-width:380px">' + motivo + ' da acceso. Entraste hace 2 horas en este dispositivo: confirmalo y sigue solo.</p>' +
      (celu ? '<button class="btn btn-oscuro grande" style="width:100%" data-ok><i class="i i-l" data-i="fingerprint"></i>Poner la huella</button><button class="btn btn-fantasma" style="width:100%;margin-top:8px" data-ok>Continuar con Google</button>'
            : '<button class="btn grande btn-google" data-ok>' + G + 'Continuar con Google</button><div style="margin-top:12px"><button class="btn btn-fantasma" data-no>Cancelar <span class="kbd">Esc</span></button></div>') +
      "</div>", { ancho: 460 });
    h.el.querySelectorAll("[data-ok]").forEach(function (b) {
      b.addEventListener("click", function () {
        var s = h.el.querySelector(".sello"); s.classList.add("leyendo");
        setTimeout(function () {
          s.classList.remove("leyendo"); s.classList.add("ok"); s.innerHTML = '<i class="i" data-i="check"></i>'; M.iconos(s);
          M.confirmado = true;
          setTimeout(function () { h.cerrar(); seguir(); }, 420);
        }, 800);
      });
    });
    var no = h.el.querySelector("[data-no]"); if (no) no.addEventListener("click", h.cerrar);
  };
})();
