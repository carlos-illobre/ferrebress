/* Manual de Ferrebress · lo que comparten las tres variantes: el contenido (el capítulo «Entrar»,
   en la computadora y en el celular), el índice de capítulos, el buscador y el clip.
   Las variantes solo cambian cómo se muestra. Datos ficticios. */
(function () {
  var C = "../../captures/";

  /* Un capítulo por módulo, en el orden del menú. Solo «Entrar» está escrito. */
  var CHAPTERS = [
    { id: "entrar", name: "Entrar", part: "Antes de empezar", icon: "log-in", ready: true,
      desc: { desktop: "Con el celular o con Google, y salir", phone: "Google, la huella, la computadora y sin internet" } },
    { id: "vender", name: "Vender", part: "Vender", icon: "shopping-cart" },
    { id: "clientes", name: "Clientes", part: "Vender", icon: "users" },
    { id: "productos", name: "Productos", part: "Catálogo", icon: "tags" },
    { id: "listas", name: "Listas de precios", part: "Catálogo", icon: "file-text" },
    { id: "stock", name: "Stock", part: "Depósito", icon: "package" },
    { id: "compras", name: "Compras", part: "Depósito", icon: "truck" },
    { id: "contar", name: "Contar", part: "Depósito", icon: "list-checks" },
    { id: "numeros", name: "Números del negocio", part: "Negocio", icon: "chart-column" },
    { id: "personas", name: "Personas", part: "Negocio", icon: "user-round" },
    { id: "quien", name: "Quién hizo qué", part: "Negocio", icon: "history" },
    { id: "admin", name: "Administración", part: "Más", icon: "sliders-horizontal" },
    { id: "procesos", name: "Procesos", part: "Más", icon: "workflow" },
    { id: "mejoras", name: "Mejoras y errores", part: "Más", icon: "bug" },
    { id: "config", name: "Configuración", part: "Más", icon: "settings" },
    { id: "vincular", name: "Celular y computadora", part: "Más", icon: "smartphone" },
    { id: "sinconexion", name: "Trabajar sin conexión", part: "Más", icon: "wifi-off" }
  ];

  /* Cada paso puede llevar su captura y el punto que señala (x, y en % de la captura). */
  var ENTRAR = {
    desktop: {
      lead: "Para usar Ferrebress en la computadora primero hay que entrar. Lo más rápido es con el celular: mirás un código y ponés la huella. No hay contraseñas.",
      sections: [
        { id: "d-celular", title: "Entrar con el celular", tag: "La forma más rápida", icon: "qr-code", clip: true,
          lead: "No escribís nada en la computadora: el celular hace todo.",
          steps: [
            { t: "Abrí Ferrebress en la computadora. A la derecha aparece un código cuadrado.", cap: "desktop-entrance", hot: [67, 33], label: "El código" },
            { t: "En el celular, abrí Ferrebress y tocá «Escanear código QR».", cap: "phone-entrance", hot: [50, 78.4], label: "Escanear código QR" },
            { t: "Apuntá el celular al código de la computadora." },
            { t: "El celular pregunta «¿Entrar en Chrome en Windows?». Tocá que sí y poné la huella." },
            { t: "Listo: la computadora entra sola, sin tocar nada más." }
          ],
          tips: [
            "El código cambia cada minuto y sirve una sola vez.",
            "El celular y la computadora tienen que estar en el mismo Wi-Fi del local.",
            "Si el celular no tenía la sesión abierta, con esa misma huella entran los dos."
          ] },
        { id: "d-google", title: "Entrar con Google", icon: "log-in",
          lead: "Si no tenés el celular a mano.",
          steps: [
            { t: "Tocá «Continuar con Google».", cap: "desktop-entrance", hot: [78, 58.5], label: "Continuar con Google" },
            { t: "Elegí tu cuenta. Después de salir, Google siempre te pregunta cuál." },
            { t: "Entrás a Ferrebress, a la primera opción del menú." }
          ],
          tips: [ "Solo entran las cuentas que autorizó un Administrador. Si dice que tu cuenta no puede entrar, pedile que te agregue." ] },
        { id: "d-sininternet", title: "Si no hay internet", icon: "wifi-off",
          lead: "Sin internet no se puede entrar a la computadora.",
          steps: [
            { t: "Los botones se apagan y la entrada dice «Para entrar hace falta internet».", ph: "La entrada de la computadora sin internet" },
            { t: "Cuando vuelve internet, los botones se prenden solos. No hace falta recargar." }
          ] },
        { id: "d-tiempo", title: "Si pasa mucho tiempo", icon: "clock",
          lead: "Por seguridad, la sesión se cierra sola.",
          steps: [
            { t: "Si pasás una hora sin usar Ferrebress, o a las 8 horas de haber entrado, aparece la entrada encima de lo que estabas haciendo." },
            { t: "Entrás de nuevo y seguís donde estabas. No se pierde nada." }
          ],
          tips: [ "Los tiempos los puede cambiar un Administrador." ] },
        { id: "d-salir", title: "Salir", icon: "log-out",
          steps: [
            { t: "Abajo del menú de la izquierda está tu tarjeta, con tu nombre.", ph: "La tarjeta con tu nombre, al pie del menú" },
            { t: "Tocá «Salir». Vuelve a la entrada." }
          ],
          tips: [ "Se puede salir aunque no haya internet." ] }
      ]
    },
    phone: {
      lead: "En el celular entrás con Google la primera vez y después con la huella. Desde el celular también hacés entrar a la computadora.",
      sections: [
        { id: "p-google", title: "Entrar con Google", icon: "log-in",
          steps: [
            { t: "Tocá «Continuar con Google».", cap: "phone-entrance", hot: [50, 44.7], label: "Continuar con Google" },
            { t: "Elegí tu cuenta." },
            { t: "La primera vez te pregunta «¿Entrar con la huella la próxima vez?». Tocá que sí." }
          ],
          tips: [ "Solo entran las cuentas que autorizó un Administrador." ] },
        { id: "p-huella", title: "Entrar con la huella", tag: "La forma más rápida", icon: "fingerprint",
          steps: [
            { t: "Tocá «Ingresar con huella».", cap: "phone-entrance", hot: [50, 59], label: "Ingresar con huella" },
            { t: "Poné el dedo. Entrás." }
          ],
          tips: [ "Cada celular tiene una sola cuenta con huella." ] },
        { id: "p-compu", title: "Hacer entrar a la computadora", icon: "monitor", clip: true,
          lead: "La computadora muestra un código; el celular lo lee.",
          steps: [
            { t: "Tocá «Escanear código QR».", cap: "phone-entrance", hot: [50, 78.4], label: "Escanear código QR" },
            { t: "Apuntá al código de la computadora." },
            { t: "Te pregunta «¿Entrar en Chrome en Windows?». Tocá que sí y poné la huella." },
            { t: "La computadora entra sola." }
          ],
          tips: [ "Los dos en el mismo Wi-Fi del local.", "Si dice «conectá este celular al mismo Wi-Fi», pasate al Wi-Fi del local." ] },
        { id: "p-offline", title: "Entrar sin internet", icon: "wifi-off",
          lead: "Con «Trabajar sin conexión» prendido, entrás con la huella aunque se corte internet.",
          steps: [
            { t: "Con internet, en Más, prendé «Trabajar sin conexión». Hace falta la huella puesta.", cap: "phone-more-offline", hot: [87.4, 75], label: "Trabajar sin conexión" },
            { t: "Sin internet, la entrada dice hasta cuándo podés entrar. Tocá «Ingresar con huella».", cap: "phone-offline-finger", hot: [50, 44], label: "Hasta cuándo" },
            { t: "Cuando vuelve internet, Ferrebress confirma tu entrada solo. Si no puede, te pide entrar de nuevo, sin perder nada.", cap: "phone-not-confirmed", hot: [50, 45], label: "Entrá de nuevo" }
          ],
          tips: [ "Sirve hasta 24 horas desde la última vez que el celular tuvo internet.", "Hoy lo pueden prender los Administradores." ] },
        { id: "p-sininternet", title: "Si no hay internet", icon: "cloud-upload",
          steps: [
            { t: "Sin «Trabajar sin conexión», los botones se apagan y dice «Para entrar hace falta internet».", cap: "phone-google-offline", hot: [50, 44.5], label: "Hace falta internet" },
            { t: "Cuando vuelve, se prenden solos." }
          ] },
        { id: "p-salir", title: "Salir", icon: "log-out",
          steps: [
            { t: "Tocá Más, abajo a la derecha.", ph: "Más, con «Salir» al final" },
            { t: "Bajá hasta el final y tocá «Salir». Vuelve a la entrada." }
          ],
          tips: [ "Se puede salir aunque no haya internet." ] }
      ]
    }
  };

  function cap(name) { return C + name + ".webp"; }

  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  /* Busca en el capítulo del dispositivo elegido y en los nombres de los que faltan. */
  function search(device, q) {
    var nq = norm(q).trim();
    if (nq.length < 2) return [];
    var words = nq.split(/\s+/), out = [];
    ENTRAR[device].sections.forEach(function (s) {
      var parts = [s.title, s.lead || ""].concat(s.steps.map(function (x) { return x.t; }), s.tips || []);
      var all = norm(parts.join(" "));
      if (!words.every(function (w) { return all.indexOf(w) >= 0; })) return;
      var body = parts.slice(1).filter(Boolean);
      var hit = body.filter(function (p) { var n = norm(p); return words.every(function (w) { return n.indexOf(w) >= 0; }); })[0] ||
        body.filter(function (p) { return norm(p).indexOf(words[words.length - 1]) >= 0; })[0] || body[0];
      var score = norm(s.title).indexOf(words[0]) >= 0 ? 2 : 1;
      out.push({ chapter: "Entrar", section: s, snippet: hit, score: score });
    });
    CHAPTERS.forEach(function (c) {
      if (!c.ready && norm(c.name).indexOf(nq) >= 0) out.push({ chapter: c.name, pronto: true, score: 0 });
    });
    return out.sort(function (a, b) { return b.score - a.score; });
  }
  function otherDeviceCount(device, q) { return search(device === "desktop" ? "phone" : "desktop", q).filter(function (r) { return !r.pronto; }).length; }

  /* Marca lo buscado dentro de un texto (sin tocar el HTML). */
  function mark(text, q) {
    var esc = text.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
    var words = norm(q).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return esc;
    var n = norm(esc), res = "", i = 0;
    while (i < esc.length) {
      var w = words.filter(function (w) { return n.substr(i, w.length) === w; })[0];
      if (w) { res += "<mark>" + esc.substr(i, w.length) + "</mark>"; i += w.length; }
      else { res += esc[i]; i++; }
    }
    return res;
  }

  /* El clip: una secuencia corta, sin sonido, que arranca solo cuando se la pide.
     En la maqueta se arma con las capturas; en la aplicación es un video mudo. */
  function clipHTML() {
    return '<div class="clip" data-clip>' +
      '<div class="clip-escena">' +
        '<img class="clip-compu" src="' + cap("desktop-entrance") + '" alt="">' +
        '<div class="clip-celu"><img src="' + cap("phone-entrance") + '" alt=""><span class="clip-scan"></span></div>' +
        '<div class="clip-ok"><i class="i i-xl" data-i="circle-check"></i><b>La computadora entró</b></div>' +
      '</div>' +
      '<button class="clip-play" aria-label="Ver el clip"><span class="clip-boton"><i class="i i-l" data-i="zap"></i></span><span><b>Ver cómo se hace</b><small>Clip de 8 s · sin sonido</small></span></button>' +
      '<div class="clip-barra"><b></b></div>' +
    '</div>';
  }
  function wireClips(root) {
    (root || document).querySelectorAll("[data-clip]").forEach(function (el) {
      if (el._wired) return; el._wired = true;
      el.querySelector(".clip-play").addEventListener("click", function () {
        el.classList.remove("corriendo"); void el.offsetWidth; el.classList.add("corriendo");
        clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("corriendo"); el.classList.add("visto"); }, 8200);
      });
    });
  }

  /* Alt a la vista: mientras se mantiene Alt, cada botón muestra su tecla. */
  function altKeys() {
    document.addEventListener("keydown", function (e) { if (e.key === "Alt") { document.body.classList.add("alt"); e.preventDefault(); } });
    document.addEventListener("keyup", function (e) { if (e.key === "Alt") document.body.classList.remove("alt"); });
    window.addEventListener("blur", function () { document.body.classList.remove("alt"); });
  }

  function toast(text) {
    var t = document.querySelector(".m-tostada");
    if (!t) { t = document.createElement("div"); t.className = "m-tostada tostada"; document.body.appendChild(t); }
    t.textContent = text; t.classList.remove("ver"); void t.offsetWidth; t.classList.add("ver");
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove("ver"); }, 2200);
  }

  /* Para los pasos sin captura propia: un ícono que dice qué se hace. */
  function stepIcon(st, s) {
    var t = norm(st.t);
    if (t.indexOf("huella") >= 0 || t.indexOf("dedo") >= 0) return "fingerprint";
    if (t.indexOf("apunta") >= 0) return "scan-barcode";
    if (t.indexOf("listo") >= 0 || t.indexOf("entra sola") >= 0 || t.indexOf("entras a") >= 0) return "circle-check";
    if (t.indexOf("elegi tu cuenta") >= 0) return "user-round";
    if (t.indexOf("salir") >= 0) return "log-out";
    if (t.indexOf("vuelve") >= 0) return "refresh-cw";
    return s.icon;
  }

  /* Variante 3: las pantallas de verdad, con los puntos que explican cada parte. */
  var SCREENS = {
    desktop: [
      { id: "entrada", name: "La entrada", cap: "desktop-entrance", spots: [
        { x: 67, y: 33, sec: "d-celular" }, { x: 78, y: 58.5, sec: "d-google" }, { x: 94, y: 4.3, sec: "d-sininternet" } ] },
      { id: "marco", name: "Ya adentro", ph: "El marco con tu tarjeta al pie del menú", spots: [
        { x: 9, y: 90, sec: "d-salir" }, { x: 55, y: 45, sec: "d-tiempo" } ] }
    ],
    phone: [
      { id: "entrada", name: "La entrada", cap: "phone-entrance", spots: [
        { x: 50, y: 44.7, sec: "p-google" }, { x: 50, y: 59, sec: "p-huella" }, { x: 50, y: 78.4, sec: "p-compu" } ] },
      { id: "sinred", name: "Sin internet", cap: "phone-offline-finger", spots: [
        { x: 50, y: 44, sec: "p-offline" }, { x: 81.5, y: 5.3, sec: "p-sininternet" } ] },
      { id: "mas", name: "Más", cap: "phone-more-offline", spots: [
        { x: 87.4, y: 75, sec: "p-offline" } ] },
      { id: "salir", name: "Salir", ph: "Más, con «Salir» al final", spots: [
        { x: 50, y: 80, sec: "p-salir" } ] }
    ]
  };
  function sectionById(device, id) { return ENTRAR[device].sections.filter(function (s) { return s.id === id; })[0]; }

  window.MANUAL = { screens: SCREENS, sectionById: sectionById, stepIcon: stepIcon, chapters: CHAPTERS, entrar: ENTRAR, cap: cap, search: search, otherDeviceCount: otherDeviceCount, mark: mark, clipHTML: clipHTML, wireClips: wireClips, altKeys: altKeys, toast: toast, norm: norm };
})();
