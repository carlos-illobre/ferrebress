/* El aviso para instalar · lo común a las tres variantes del celular.
   Arma el marco de fondo (Vender recién entrado, neutro), simula el pedido del navegador,
   la tostada, la vibración y la lengüeta de la maqueta. Datos ficticios, sin lógica de verdad. */
(function () {
  var COMUN = "../../../../common/";
  var ISO = COMUN + "brand/isotype.svg";
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var opciones = { navegador: "confirma" };
  var alReiniciar = function () { location.reload(); };

  if (/captura/.test(location.search)) document.documentElement.classList.add("captura");

  function marco() {
    var celu = document.createElement("div");
    celu.className = "celu";
    celu.id = "celu";
    celu.innerHTML =
      '<div class="barra-estado"><span>9:02</span><span class="se"><i class="i i-s" data-i="wifi"></i><svg width="26" height="13" viewBox="0 0 26 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="#1A1D1B" opacity=".4"/><rect x="2" y="2" width="16" height="9" rx="2" fill="#1A1D1B"/></svg></span></div>' +
      '<div class="marco-app">' +
      '<div class="celu-cabecera"><span class="t-titulo">Vender</span><span class="btn-vinculo gris"><i class="i i-s" data-i="monitor"></i>Desconectado</span></div>' +
      '<div class="celu-estado"><span class="punto"></span>En línea · todo enviado</div>' +
      '<nav class="celu-pestanas"><a class="activa" data-ir="sales">Vender</a><a data-ir="today-sales">Ventas de hoy</a></nav>' +
      '<div class="celu-pantalla"><div class="esqueleto">' +
      '<div class="esq-campo"><i class="i" data-i="search"></i>Lo que hay en Vender</div>' +
      '<div class="esq-renglon"><span class="f"></span><span class="l"><b></b><b></b></span></div>' +
      '<div class="esq-renglon"><span class="f"></span><span class="l"><b></b><b></b></span></div>' +
      '<div class="esq-renglon"><span class="f"></span><span class="l"><b></b><b></b></span></div>' +
      '</div></div>' +
      '<div class="barra-accion"><div class="esq-boton"></div></div>' +
      '</div>' +
      '<nav class="nav-inferior">' +
      '<a class="activo" data-ir="sales"><i class="i" data-i="shopping-cart"></i>Vender</a>' +
      '<a data-ir="products"><i class="i" data-i="tags"></i>Catálogo</a>' +
      '<a data-ir="stock"><i class="i" data-i="package"></i>Depósito</a>' +
      '<a data-ir="business-overview"><i class="i" data-i="chart-column"></i>Negocio</a>' +
      '<a data-ir="more"><i class="i" data-i="menu"></i>Más</a>' +
      '</nav>' +
      '<div class="tostada-lugar"><div class="tostada" id="tostada"></div></div>' +
      '<span class="home-ind"></span>';
    document.body.prepend(celu);
    lengueta();
    return celu;
  }

  function pintar(el) { if (window.pintarIconos) window.pintarIconos(el); }

  // El pedido del navegador: lo dibuja Chrome, no Ferrebress (E20, E26)
  function pedirAlNavegador(alConfirmar, alCancelar) {
    var celu = document.getElementById("celu");
    var p = document.createElement("div");
    p.className = "nav-pedido";
    p.setAttribute("role", "dialog");
    p.innerHTML = '<div class="dlg"><h3>¿Instalar app?</h3>' +
      '<div class="app"><span class="app-icono"><img src="' + ISO + '" alt=""></span><div><b>Ferrebress</b><span>ferrebress.com.ar</span></div></div>' +
      '<div class="bot"><button type="button" data-no>Cancelar</button><button type="button" class="lleno" data-si>Instalar</button></div></div>';
    celu.appendChild(p);
    requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.add("ver"); }); });
    function cerrar(fn) {
      p.classList.remove("ver");
      setTimeout(function () { p.remove(); fn && fn(); }, quieto ? 0 : 200);
    }
    p.querySelector("[data-si]").addEventListener("click", function () { cerrar(alConfirmar); });
    p.querySelector("[data-no]").addEventListener("click", function () { cerrar(alCancelar); });
    // En la maqueta se puede pedir que el navegador «cancele solo» para ver ese caso
    if (opciones.navegador === "cancela") setTimeout(function () { if (p.isConnected) cerrar(alCancelar); }, 1400);
  }

  var tt;
  function tostada(texto, icono) {
    var t = document.getElementById("tostada");
    t.innerHTML = '<i class="i" data-i="' + (icono || "circle-check") + '"></i>' + texto;
    pintar(t);
    t.classList.add("ver");
    clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove("ver"); }, 2800);
  }

  function vibrar(p) {
    // Solo después de que la persona tocó algo (si no, el navegador lo bloquea)
    var activo = navigator.userActivation ? navigator.userActivation.hasBeenActive : true;
    try { if (activo && navigator.vibrate) navigator.vibrate(p); } catch (e) {}
  }

  function lengueta() {
    var l = document.createElement("div");
    l.className = "lengueta";
    l.innerHTML = '<button type="button" aria-label="Opciones de la maqueta" data-no-ir><i class="i" data-i="rotate-ccw"></i></button>' +
      '<div class="menu-maqueta"><p>Maqueta (no es parte del diseño)</p>' +
      '<button type="button" data-m="reiniciar">Entrar de nuevo (ver el aviso)</button>' +
      '<button type="button" data-m="confirma">El navegador confirma</button>' +
      '<button type="button" data-m="cancela">El navegador cancela</button></div>';
    document.body.appendChild(l);
    function marcar() {
      l.querySelector('[data-m="confirma"]').classList.toggle("si", opciones.navegador === "confirma");
      l.querySelector('[data-m="cancela"]').classList.toggle("si", opciones.navegador === "cancela");
    }
    marcar();
    l.addEventListener("click", function (e) {
      if (e.target.closest("[aria-label]")) { l.classList.toggle("abierta"); return; }
      var b = e.target.closest("[data-m]");
      if (!b) return;
      var m = b.getAttribute("data-m");
      if (m === "reiniciar") { l.classList.remove("abierta"); alReiniciar(); return; }
      opciones.navegador = m;
      marcar();
    });
  }

  window.Aviso = {
    ISO: ISO,
    quieto: quieto,
    marco: marco,
    pintar: pintar,
    pedirAlNavegador: pedirAlNavegador,
    tostada: tostada,
    vibrar: vibrar,
    alReiniciar: function (fn) { alReiniciar = fn; },
    espera: function (ms) { return quieto ? 0 : ms; }
  };
})();
