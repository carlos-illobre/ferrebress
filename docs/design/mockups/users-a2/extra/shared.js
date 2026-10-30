/* Usuarios (segunda ronda): los datos de mentira y las ayudas que usan las tres variantes.
   Las seis maquetas muestran a las mismas nueve personas, para comparar igual con igual. */
(function () {
  var M = { google: ["Google", "log-in"], huella: ["Huella", "fingerprint"], qr: ["Código QR", "qr-code"], offline: ["Sin conexión", "wifi-off"] };

  // usoMin: minutos desde el último uso (para ordenar y para el gráfico). dev: el aparato.
  var people = [
    { id: "yo", nombre: "Roberto Gaitán", correo: "roberto.gaitan@example.com", vos: true, entro: "Entró hoy a las 7:45", entroCorto: "Hoy",
      sesiones: [{ id: "s-yo1", disp: "Chrome en Android", tipo: "phone", como: "huella", desde: "Ayer, 18:20", uso: "Hace 2 h", usoMin: 120, dev: "d-yo" }],
      huellas: [], propios: [{ id: "h-yo1", disp: "Chrome en Android", vinc: "2 de mayo", uso: "Hace 2 h", usoMin: 120, dev: "d-yo" }] },
    { id: "graciela", nombre: "Graciela Ferreyra", correo: "graciela.ferreyra@example.com", entro: "Entró hace 2 días", entroCorto: "Hace 2 días",
      sesiones: [
        { id: "s-g1", disp: "Chrome en Windows", tipo: "desktop", como: "google", desde: "Lunes, 8:03", uso: "Hace 5 min", usoMin: 5, dev: "d-g-pc" },
        { id: "s-g2", disp: "Chrome en Android", tipo: "phone", como: "huella", desde: "Martes, 9:40", uso: "Hace 20 min", usoMin: 20, dev: "d-g-cel" }],
      huellas: [{ id: "h-g1", disp: "Chrome en Android", vinc: "12 de agosto", uso: "Hace 20 min", usoMin: 20, dev: "d-g-cel" }] },
    { id: "jorge", nombre: "Jorge, el de los sábados", correo: "jorge.paz.sabados@example.com", nunca: true, entro: "Todavía no entró", entroCorto: "Todavía no entró", sesiones: [], huellas: [] },
    { id: "lucia", nombre: "Lucía Benítez", correo: "administracion@example.com", entro: "Entró hace 3 días", entroCorto: "Hace 3 días",
      sesiones: [{ id: "s-l1", disp: "Safari en iPhone", tipo: "phone", como: "google", desde: "Viernes, 14:10", uso: "Hace 3 días", usoMin: 4320, dev: "d-l-cel" }],
      huellas: [{ id: "h-l1", disp: "Safari en iPhone", vinc: "20 de septiembre", uso: "Hace 3 días", usoMin: 4320, dev: "d-l-cel" }] },
    { id: "martin", nombre: "Martín del depósito", google: "Martín Ríos", correo: "mrios.deposito@example.com", entro: "Entró hoy a las 7:58", entroCorto: "Hoy",
      sesiones: [
        { id: "s-m1", disp: "Chrome en Android", tipo: "phone", como: "huella", desde: "Hoy, 7:58", uso: "Ahora", usoMin: 0, dev: "d-m-cel" },
        { id: "s-m2", disp: "Edge en Windows", tipo: "desktop", como: "qr", desde: "Hoy, 8:15", uso: "Hace 12 min", usoMin: 12, dev: "d-m-pc" }],
      huellas: [{ id: "h-m1", disp: "Chrome en Android", vinc: "3 de septiembre", uso: "Ahora", usoMin: 0, dev: "d-m-cel" }] },
    { id: "nahuel", nombre: "Nahuel Sosa", correo: "nahuelsosa94@example.com", entro: "Entró hace 12 días", entroCorto: "Hace 12 días",
      sesiones: [
        { id: "s-n1", disp: "Chrome en Android", tipo: "phone", como: "offline", desde: "18 de octubre", uso: "Hace 2 h", usoMin: 125, dev: "d-n-cel1" },
        { id: "s-n2", disp: "Firefox en Linux", tipo: "laptop", como: "google", desde: "19 de septiembre", uso: "Hace 41 días", usoMin: 59040, dev: "d-n-note" }],
      huellas: [
        { id: "h-n1", disp: "Chrome en Android", vinc: "1 de julio", uso: "Hace 2 h", usoMin: 125, dev: "d-n-cel1" },
        { id: "h-n2", disp: "Chrome en Android", vinc: "14 de marzo", uso: "Hace 4 meses", usoMin: 172800, dev: "d-n-cel2" }] },
    { id: "sofia", nombre: "", correo: "sofia.quiroga@example.com", nunca: true, entro: "Todavía no entró", entroCorto: "Todavía no entró", sesiones: [], huellas: [] },
    { id: "diego", nombre: "Diego Albornoz", correo: "diego.albornoz@example.com", baja: true, bajaDesde: "3 de octubre", entro: "Entró hace 1 mes", entroCorto: "Hace 1 mes", sesiones: [], huellas: [] },
    { id: "ramiro", nombre: "Ramiro Toledo", correo: "ramiro.toledo.ferre@example.com", baja: true, bajaDesde: "15 de junio", entro: "Entró hace 5 meses", entroCorto: "Hace 5 meses", sesiones: [], huellas: [] }
  ];

  function nombre(p) { return p.nombre || p.correo; }
  function iniciales(p) {
    if (!p.nombre) return "@";
    var w = p.nombre.replace(/,.*/, "").split(/\s+/).filter(function (x) { return /^[A-ZÁÉÍÓÚÑ]/.test(x); });
    return ((w[0] || "?")[0] + (w[1] ? w[1][0] : "")).toUpperCase();
  }
  function cara(p, extra) {
    var c = "cara " + (extra || "") + (p.vos ? " vos" : p.baja ? " baja" : p.nunca ? " nueva" : "");
    return '<span class="' + c + '">' + (p.nombre ? iniciales(p) : '<i class="i i-s" data-i="at-sign"></i>') + "</span>";
  }
  function como(m) { return '<span class="como"><i class="i i-s" data-i="' + M[m][1] + '"></i>' + M[m][0] + "</span>"; }
  function icoDisp(t) { return t === "phone" ? "smartphone" : t === "laptop" ? "laptop" : "monitor"; }

  function orden(list) {
    var by = function (a, b) { return nombre(a).localeCompare(nombre(b), "es", { sensitivity: "base" }); };
    var vos = list.filter(function (p) { return p.vos; });
    var act = list.filter(function (p) { return !p.vos && !p.baja; }).sort(by);
    var baj = list.filter(function (p) { return p.baja; }).sort(by);
    return { vos: vos, activas: act, bajas: baj, todas: vos.concat(act, baj) };
  }

  // Aparatos: junta la sesión y la huella del mismo celular en una sola pieza.
  function aparatos(list) {
    var map = {}, out = [];
    list.forEach(function (p) {
      if (p.baja) return;
      p.sesiones.forEach(function (s) {
        var d = map[s.dev] || (map[s.dev] = { dev: s.dev, persona: p, disp: s.disp, tipo: s.tipo, usoMin: s.usoMin, uso: s.uso });
        d.sesion = s; d.usoMin = Math.min(d.usoMin, s.usoMin);
      });
      p.huellas.forEach(function (h) {
        var d = map[h.dev] || (map[h.dev] = { dev: h.dev, persona: p, disp: h.disp, tipo: "phone", usoMin: h.usoMin, uso: h.uso });
        d.huella = h;
      });
    });
    Object.keys(map).forEach(function (k) { out.push(map[k]); });
    return out.sort(function (a, b) { return a.usoMin - b.usoMin; });
  }

  function correoMal(v, list, excepto) {
    v = (v || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Eso no parece un correo. Fijate que tenga @ y el dominio.";
    var ya = list.filter(function (p) { return p !== excepto && p.correo.toLowerCase() === v.toLowerCase(); })[0];
    if (ya) return "Ese correo ya está cargado: " + nombre(ya) + (ya.baja ? " (dada de baja; la podés dar de alta)" : "") + ".";
    return null;
  }

  // ---------- Capas: abrir, cerrar con su botón, tocando afuera y con Escape ----------
  var abiertas = [];
  function abrir(id) {
    var c = document.getElementById(id); if (!c) return;
    c.classList.add("abierta"); abiertas.push(c);
    var f = c.querySelector("[autofocus], input, .btn-accion, .btn-cortar, button");
    setTimeout(function () { f && f.focus({ preventScroll: true }); }, 340);
  }
  function cerrar(c) {
    c = c || abiertas[abiertas.length - 1]; if (!c) return;
    c.classList.remove("abierta"); abiertas = abiertas.filter(function (x) { return x !== c; });
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.classList && t.classList.contains("capa")) cerrar(t);
    var x = t.closest && t.closest("[data-cerrar]"); if (x) cerrar(x.closest(".capa"));
    var a = t.closest && t.closest("[data-abrir]"); if (a) abrir(a.getAttribute("data-abrir"));
    var k = t.closest && t.closest("[data-conexion]"); if (k) conexion();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && abiertas.length) { e.preventDefault(); cerrar(); } });

  function conexion() {
    var off = document.body.classList.toggle("sin-conexion");
    document.querySelectorAll("[data-conexion]").forEach(function (el) {
      el.classList.toggle("logro", !off); el.classList.toggle("urgente", off);
      el.innerHTML = off ? '<span class="punto"></span>Sin conexión' : '<span class="punto"></span>En línea · todo enviado';
    });
  }

  function tostada(html, accion) {
    var box = document.querySelector(".tostadas");
    if (!box) { box = document.createElement("div"); box.className = "tostadas"; (document.querySelector(".celu") || document.body).appendChild(box); }
    var t = document.createElement("div"); t.className = "tostada";
    t.innerHTML = '<i class="i" data-i="circle-check"></i><span>' + html + "</span>" + (accion ? '<button type="button">' + accion.texto + "</button>" : "");
    box.appendChild(t); pintar(t);
    if (accion) t.querySelector("button").onclick = function () { accion.hacer(); quitar(); };
    function quitar() { t.classList.add("se-va"); setTimeout(function () { t.remove(); }, 220); }
    setTimeout(quitar, 4200);
  }
  function vibrar(p) { try { navigator.vibrate && navigator.vibrate(p || 10); } catch (e) {} }
  function pintar(el) { window.pintarIconos && window.pintarIconos(el); }
  function quieto() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }

  // Dibujo de línea del aparato (celular, computadora o notebook), en tinta sobre el azulejo hundido.
  function arte(tipo, cls) {
    var s = '<svg class="' + (cls || "arte") + '" viewBox="0 0 96 72" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    if (tipo === "phone") s += '<rect x="34" y="6" width="28" height="56" rx="6" fill="#fff"/><rect x="38" y="12" width="20" height="40" rx="2" fill="var(--pino-suave)" stroke="none"/><path d="M45 57h6"/>';
    else if (tipo === "laptop") s += '<rect x="20" y="12" width="56" height="36" rx="4" fill="#fff"/><rect x="25" y="17" width="46" height="26" rx="1.5" fill="var(--pino-suave)" stroke="none"/><path d="M12 54h72l-4 6H16z" fill="#fff"/>';
    else s += '<rect x="14" y="6" width="68" height="44" rx="4" fill="#fff"/><rect x="19" y="11" width="58" height="34" rx="1.5" fill="var(--pino-suave)" stroke="none"/><path d="M40 50l-3 10h22l-3-10M32 62h32"/>';
    return s + "</svg>";
  }

  window.U = { people: people, arte: arte, M: M, nombre: nombre, iniciales: iniciales, cara: cara, como: como, icoDisp: icoDisp, orden: orden,
    aparatos: aparatos, correoMal: correoMal, abrir: abrir, cerrar: cerrar, tostada: tostada, vibrar: vibrar, pintar: pintar, quieto: quieto };
})();
