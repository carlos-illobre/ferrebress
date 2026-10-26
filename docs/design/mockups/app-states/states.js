/* Estados de la maqueta: el selector de abajo (no es parte del diseño) y lo que hace cada botón.
   - body[data-estado] = normal | offline | version | block | wait | error. Cada variante dibuja con CSS.
   - ?estado=<k> abre en ese estado; &captura oculta el selector y deja la espera quieta en su punto final.
   - Teclas 1–6 eligen el estado. Esc cierra el aviso de versión y «Algo salió mal» (el bloqueo no).
   - Botones: data-actualizar, data-cerrar, data-avisar, data-reintentar, data-salir, data-cobrar.
   - Sin conexión o bloqueada, solo responde lo que está dentro de [data-sigue]; lo demás sacude [data-senal="<estado>"].
   - Cada capa de un estado lleva data-capa="<estado>" (para cerrarla con su movimiento). */
(function () {
  var ESTADOS = [['normal', 'Normal'], ['offline', 'Sin conexión'], ['version', 'Versión nueva'], ['block', 'Hay que actualizar'], ['wait', 'Esperas'], ['error', 'Algo salió mal']];
  var q = new URLSearchParams(location.search), captura = q.has('captura'), timers = [], body = document.body;
  var mover = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (captura) body.classList.add('captura');

  function t(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function poner(k) {
    timers.forEach(clearTimeout); timers = [];
    body.classList.remove('e-marca', 'e-barra', 'e-listo', 'actualizando');
    body.dataset.estado = k;
    sel.querySelectorAll('button').forEach(function (b) { b.classList.toggle('elegido', b.dataset.k === k); });
    if (k === 'wait') esperar();
    if (window.alEstado) window.alEstado(k);
  }
  window.ponerEstado = poner;

  // La espera: nada antes de 300 ms; la marca en lo tocado; pasados 2 s, la barra que dice qué hace.
  function esperar() {
    if (captura) { body.classList.add('e-marca', 'e-barra'); return; }
    t(300, function () { body.classList.add('e-marca'); });
    t(2000, function () { body.classList.add('e-barra'); });
    t(5200, function () { body.classList.remove('e-marca', 'e-barra'); body.classList.add('e-listo'); });
    t(6400, function () { poner('normal'); tostada('Venta registrada · $45.500 en efectivo', 'circle-check'); });
  }

  var sel = document.createElement('div');
  sel.className = 'selector';
  sel.innerHTML = '<span class="rot">Estado</span>' + ESTADOS.map(function (e, i) { return '<button data-k="' + e[0] + '" title="Tecla ' + (i + 1) + '">' + e[1] + '</button>'; }).join('');
  body.appendChild(sel);
  sel.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { e.stopPropagation(); poner(b.dataset.k); } }, true);

  var lugarTostada = null;
  function tostada(texto, icono) {
    var t0 = document.createElement('div');
    t0.className = 'tostada tostada-flota';
    t0.innerHTML = '<i class="i" data-i="' + (icono || 'check') + '"></i>' + texto;
    (document.querySelector('[data-tostadas]') || body).appendChild(t0);
    if (window.pintarIconos) window.pintarIconos(t0.parentNode);
    if (mover) t0.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
    setTimeout(function () {
      if (mover) t0.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = function () { t0.remove(); };
      else t0.remove();
    }, 2600);
  }
  window.tostada = tostada;

  function sacudir(el) {
    if (!el || !mover) return;
    el.animate([{ transform: 'none' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], { duration: 320 });
    if (navigator.vibrate) try { navigator.vibrate(20); } catch (e) {}
  }
  window.sacudir = sacudir;

  function salir(capa, fn) {
    if (!capa || !mover) { fn(); return; }
    capa.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px) scale(.98)' }], { duration: 160, easing: 'cubic-bezier(.4,0,1,1)' }).onfinish = fn;
  }

  // Sin conexión y bloqueada: solo responde lo de [data-sigue].
  window.addEventListener('click', function (e) {
    var k = body.dataset.estado;
    if (e.target.closest('.selector')) return;
    if ((k === 'offline' || k === 'block') && !e.target.closest('[data-sigue]')) {
      e.preventDefault(); e.stopPropagation();
      sacudir(document.querySelector('[data-senal="' + k + '"]'));
    }
  }, true);

  document.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-actualizar]'))) {
      body.classList.add('actualizando');
      t(1400, function () { poner('normal'); tostada('Ya tenés la versión nueva · seguís en Vender', 'sparkles'); });
      return;
    }
    if ((b = e.target.closest('[data-cerrar]'))) { salir(b.closest('[data-capa]'), function () { poner('normal'); }); return; }
    if ((b = e.target.closest('[data-avisar]'))) {
      if (b.classList.contains('hecho')) return;
      b.classList.add('hecho');
      b.innerHTML = '<i class="i i-s" data-i="check"></i>Avisado';
      if (window.pintarIconos) window.pintarIconos(b);
      tostada('Aviso guardado: llega a Mejoras y errores', 'bug');
      return;
    }
    if ((b = e.target.closest('[data-reintentar]'))) { poner('wait'); return; }
    if ((b = e.target.closest('[data-salir]'))) { if (window.irAMaqueta) window.irAMaqueta('sign-in'); return; }
    if ((b = e.target.closest('[data-cobrar]')) && body.dataset.estado === 'normal') { poner('wait'); return; }
  });

  document.addEventListener('keydown', function (e) {
    if (/^[1-6]$/.test(e.key) && !e.altKey && !e.ctrlKey) { poner(ESTADOS[+e.key - 1][0]); return; }
    var k = body.dataset.estado;
    if (e.key === 'Escape' && (k === 'version' || k === 'error')) { var c = document.querySelector('[data-capa="' + k + '"]'); salir(c, function () { poner('normal'); }); }
    if (e.key === 'Enter' && k === 'block') { var a = document.querySelector('[data-actualizar]'); if (a) a.click(); }
    if (e.key === 'F2' && k === 'normal') { e.preventDefault(); poner('wait'); }
  });

  poner(ESTADOS.some(function (e) { return e[0] === q.get('estado'); }) ? q.get('estado') : 'offline');
})();
