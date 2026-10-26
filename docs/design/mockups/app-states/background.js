/* Relleno de fondo de las maquetas de estados: la pantalla Vender (contenido de sales/v2), quieta.
   Uso: <div id="fondo"></div><script>ponerFondo('desktop')</script>  (o 'phone').
   Los controles llevan data-ctl para que cada variante los apague o los marque. */
(function () {
  var F = '../../../../common/photos/';
  var desktop =
'<div class="app">' +
'  <nav class="lateral">' +
'    <div class="marca"><span class="logo"><i class="i" data-i="store"></i></span><b>Ferrebress</b></div>' +
'    <a class="nav-item activo" data-ir="sales" data-ctl><i class="i" data-i="shopping-cart"></i>Vender<span class="insignia">5</span></a>' +
'    <a class="nav-item" data-ir="products" data-ctl><i class="i" data-i="tags"></i>Catálogo</a>' +
'    <a class="nav-item" data-ir="stock" data-ctl><i class="i" data-i="package"></i>Depósito</a>' +
'    <a class="nav-item" data-ir="business-overview" data-ctl><i class="i" data-i="chart-column"></i>Negocio</a>' +
'    <a class="nav-item" data-ir="more" data-ctl><i class="i" data-i="ellipsis"></i>Más<span class="pastilla urgente" style="margin-left:auto;height:24px">3</span></a>' +
'    <div class="pie">' +
'      <div class="vinculo" data-ctl><i class="i" data-i="smartphone"></i><div>Celular en espejo<small>Moto G54 de Carlos</small></div></div>' +
'      <div class="pastilla logro luz" style="justify-self:start"><span class="punto"></span><span class="luz-txt">En línea · todo enviado</span></div>' +
'      <div class="usuario" data-usuario><span class="avatar">CI</span><div><div style="font-weight:750;font-size:15px">Carlos Illobre</div><div class="t-detalle">Administrador</div></div></div>' +
'    </div>' +
'  </nav>' +
'  <main class="contenido">' +
'    <header class="cabecera">' +
'      <div class="t-titulo">Vender</div>' +
'      <div class="acciones">' +
'        <span class="t-detalle">Lunes 26 de octubre · 10:42</span>' +
'        <button class="btn chico" data-ctl><i class="i i-s" data-i="clipboard-list"></i>Pedidos y presupuestos</button>' +
'      </div>' +
'    </header>' +
'    <nav class="pestanas"><a class="activa" data-ir="sales" data-ctl>Vender</a><a data-ir="today-sales" data-ctl>Ventas de hoy <span class="pastilla" style="height:24px">23</span></a></nav>' +
'    <section class="pantalla">' +
'      <div class="vender">' +
'        <div class="izq">' +
'          <div class="busqueda">' +
'            <div class="campo" data-ctl data-buscar><i class="i" data-i="search"></i><span class="ph">Buscá por nombre o código, o escaneá</span><span class="ayuda"><span class="kbd">Enter</span></span></div>' +
'            <button class="btn btn-oscuro" style="height:56px" data-ctl><i class="i" data-i="scan-barcode"></i>Escanear con el celular</button>' +
'          </div>' +
'          <div class="lista-cab"><span class="t-seccion">Esta venta</span><span class="pastilla">5 productos</span><button class="btn btn-fantasma chico" data-ctl><i class="i i-s" data-i="trash-2"></i>Vaciar</button></div>' +
'          <div class="lista">' +
             item('drill-bit', 'Mecha acero rápido HSS 8 mm', 'Ezeta · Bulonera Centro', '14 un.', '3', '21.000', '3 × $7.000', '$2.480', 2, '$7.000', true) +
             item('measuring-tape', 'Cinta métrica PowerLock 5 m', 'Stanley · Distribuidora Oeste', '6 un.', '1', '17.000', '1 × $17.000', '$9.350', 3, '$17.000') +
             item('nails', 'Clavos punta París 2" por kilo', 'Acindar · Bulonera Centro', '12,4 kg', '0,7<span class="u">kg</span>', '6.000', '0,7 × $8.000', '$2.900 el kg', 2, '$8.000 el kg') +
             item('wall-plugs', 'Tarugos nylon S8 con tope × 100', 'Fischer · Ferretera del Sur', '3 un.', '1', '1.500', '1 × $1.500', '$750', 2, '$1.500') +
'          </div>' +
'        </div>' +
'        <aside class="tarjeta-2 cobro">' +
'          <div><div class="total-linea"><span class="et">Total</span><span class="t-detalle">5 productos</span></div>' +
'            <div class="t-total num" style="margin-top:4px"><span class="peso">$</span>45.500</div></div>' +
'          <div class="ganas"><i class="i i-s" data-i="trending-up"></i>Ganás en esta venta<b>$21.200</b></div>' +
'          <div><div class="et" style="margin-bottom:8px">Cómo paga</div>' +
'            <div class="medios">' +
'              <button class="m medio efectivo elegido" data-ctl><span class="ic"><i class="i i-s" data-i="banknote"></i></span>Efectivo<span class="kbd">F5</span></button>' +
'              <button class="m medio mp" data-ctl><span class="ic"><i class="i i-s" data-i="qr-code"></i></span>Mercado Pago<span class="kbd">F6</span></button>' +
'              <button class="m medio tarjeta" data-ctl><span class="ic"><i class="i i-s" data-i="credit-card"></i></span>Tarjeta<span class="kbd">F7</span></button>' +
'              <button class="m medio cuenta" data-ctl><span class="ic"><i class="i i-s" data-i="notebook-pen"></i></span>Cuenta corriente<span class="kbd">F8</span></button>' +
'            </div></div>' +
'          <div class="campo cliente" data-ctl><i class="i i-s" data-i="user-round"></i>Cliente (opcional)<span class="kbd" style="margin-left:auto">F9</span></div>' +
'          <button class="btn btn-accion grande cobrar" data-ctl data-cobrar><span class="cobrar-txt">Cobrar <span class="num">$45.500</span></span><span class="kbd">F2</span></button>' +
'          <div class="otras">' +
'            <button class="btn btn-fantasma" data-ctl>No llevó <span class="kbd">Esc</span></button>' +
'            <button class="btn btn-fantasma" data-ctl>A pedido</button>' +
'            <button class="btn btn-fantasma" data-ctl>Presupuesto</button>' +
'          </div>' +
'        </aside>' +
'      </div>' +
'    </section>' +
'  </main>' +
'</div>';

  function item(foto, nombre, det, stock, cant, sub, cuenta, costo, margen, precio, foco) {
    var m = [300, 200, 100, 50, 25].map(function (x, i) { return '<button' + (i === margen ? ' class="elegido"' : '') + '>' + x + '</button>'; }).join('');
    return '<article class="item' + (foco ? ' foco' : '') + '" data-ctl>' +
      '<div class="foto"><img src="' + F + foto + '.webp" alt=""></div>' +
      '<div><div class="nombre">' + nombre + '</div><div class="det">' + det + ' · <span class="pastilla logro mini">' + stock + '</span></div></div>' +
      '<div class="cantidad"><button><i class="i i-s" data-i="minus"></i></button><span class="n">' + cant + '</span><button><i class="i i-s" data-i="plus"></i></button></div>' +
      '<div class="sub num"><span class="peso">$</span>' + sub + '<small>' + cuenta + '</small></div>' +
      '<i class="i menu" data-i="ellipsis"></i>' +
      '<div class="precio-fila">Costo <span class="valor">' + costo + '</span><span class="sep"></span>Margen <span class="segmentos margen">' + m + '</span>%<span class="sep"></span>Precio <span class="valor">' + precio + '</span></div>' +
      '</article>';
  }

  var phone =
'<div class="celu">' +
'  <div class="barra-estado"><span>10:42</span><span class="se"><i class="i i-s" data-i="wifi" data-wifi></i><svg width="26" height="13" viewBox="0 0 26 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="#1A1D1B" opacity=".4"/><rect x="2" y="2" width="16" height="9" rx="2" fill="#1A1D1B"/><rect x="23.5" y="4" width="2" height="5" rx="1" fill="#1A1D1B" opacity=".4"/></svg></span></div>' +
'  <div class="celu-cabecera"><span class="t-titulo">Vender</span><span class="btn-vinculo" data-ctl><i class="i i-s" data-i="monitor"></i>En espejo</span></div>' +
'  <div class="celu-estado luz"><span class="punto"></span><span class="luz-txt">En línea · todo enviado</span></div>' +
'  <nav class="celu-pestanas"><a class="activa" data-ir="sales" data-ctl>Vender</a><a data-ir="today-sales" data-ctl>Ventas de hoy</a></nav>' +
'  <div class="celu-pantalla">' +
'    <div class="buscar">' +
'      <div class="campo" data-ctl data-buscar><i class="i" data-i="search"></i><span class="ph">Producto, código o marca</span></div>' +
'      <button class="btn btn-oscuro" data-ctl aria-label="Escanear"><i class="i i-l" data-i="scan-barcode"></i></button>' +
'    </div>' +
'    <div class="cab-lista"><b>Esta venta</b><span class="pastilla">5</span><button class="btn btn-fantasma chico" data-ctl><i class="i i-s" data-i="trash-2"></i>Vaciar</button></div>' +
'    <div class="lista">' +
       card('drill-bit', 'Mecha acero rápido HSS 8 mm', 'Ezeta · 14 un.', '$7.000', 'cada una', '3', '100 %', '$21.000') +
       card('measuring-tape', 'Cinta métrica PowerLock 5 m', 'Stanley · 6 un.', '$17.000', 'cada una', '1', '50 %', '$17.000') +
       card('nails', 'Clavos punta París 2" por kilo', 'Acindar · 12,4 kg', '$8.000', 'el kg', '0,7<span class="u">kg</span>', '100 %', '$6.000') +
'    </div>' +
'  </div>' +
'  <div class="barra-accion">' +
'    <div class="medios-c">' +
'      <span class="mc medio efectivo elegido" data-ctl><span class="pt"></span>Efectivo</span>' +
'      <span class="mc medio mp" data-ctl><span class="pt"></span>M. Pago</span>' +
'      <span class="mc medio tarjeta" data-ctl><span class="pt"></span>Tarjeta</span>' +
'      <span class="mc medio cuenta" data-ctl><span class="pt"></span>Cta. cte.</span>' +
'    </div>' +
'    <button class="btn btn-accion cobrar" data-ctl data-cobrar><span class="cobrar-txt">Cobrar</span><span class="num">$45.500</span></button>' +
'  </div>' +
'  <nav class="nav-inferior">' +
'    <a class="activo" data-ir="sales" data-ctl><i class="i" data-i="shopping-cart"></i>Vender<span class="insignia">5</span></a>' +
'    <a data-ir="products" data-ctl><i class="i" data-i="tags"></i>Catálogo</a>' +
'    <a data-ir="stock" data-ctl><i class="i" data-i="package"></i>Depósito</a>' +
'    <a data-ir="business-overview" data-ctl><i class="i" data-i="chart-column"></i>Negocio</a>' +
'    <a data-ir="more" data-ctl><i class="i" data-i="menu"></i>Más</a>' +
'  </nav>' +
'  <span class="home-ind"></span>' +
'</div>';

  function card(foto, n, d, p, ps, cant, mg, sub) {
    return '<div class="card" data-ctl><div class="arriba"><div class="foto"><img src="' + F + foto + '.webp" alt=""></div><div><div class="n">' + n + '</div><div class="d">' + d + '</div></div><div class="precio-p"><b class="num">' + p + '</b><span>' + ps + '</span></div></div>' +
      '<div class="abajo"><span class="tacho"><i class="i" data-i="trash-2"></i></span><span class="cantidad"><button><i class="i i-s" data-i="minus"></i></button><span class="n">' + cant + '</span><button><i class="i i-s" data-i="plus"></i></button></span><span class="margen-p">' + mg + '<i class="i i-s" data-i="chevron-down"></i></span><span class="sub num">' + sub + '</span></div></div>';
  }

  window.ponerFondo = function (device) {
    var el = document.getElementById('fondo');
    el.innerHTML = device === 'phone' ? phone : desktop;
  };
})();
