/* El manual · maqueta final. El contenido: los capítulos en el orden del menú y el capítulo «Entrar»,
   uno para la computadora y otro para el celular. Parte de ../shared.js del director (variante 2),
   ajustado a las reglas. Las capturas del director están en ../captures/; las tres que faltaban,
   en captures/. Personas y datos ficticios. */
(function () {
  /* Las capturas que se sacaron para la final (de las maquetas aprobadas). Las demás son del director. */
  var OWN = ["desktop-entrance-offline", "desktop-frame-sign-out", "phone-more-sign-out"];

  /* Un capítulo por módulo, en el orden del menú (00 · R1.2, R6.4). «Entrar» va primero: se lee antes
     de llegar al menú. Solo «Entrar» está escrito; los demás dicen «Pronto» y no se abren. */
  var CHAPTERS = [
    { id: "entrar", name: "Entrar", icon: "log-in", ready: true },
    { id: "vender", name: "Vender", icon: "shopping-cart" },
    { id: "clientes", name: "Clientes", icon: "users" },
    { id: "productos", name: "Productos", icon: "tags" },
    { id: "listas", name: "Listas de precios", icon: "file-text" },
    { id: "stock", name: "Stock", icon: "package" },
    { id: "compras", name: "Compras", icon: "truck" },
    { id: "contar", name: "Contar", icon: "list-checks" },
    { id: "numeros", name: "Números del negocio", icon: "chart-column" },
    { id: "personas", name: "Personas", icon: "user-round" },
    { id: "quien", name: "Quién hizo qué", icon: "history" },
    { id: "admin", name: "Administración", icon: "sliders-horizontal" },
    { id: "procesos", name: "Procesos", icon: "workflow" },
    { id: "mejoras", name: "Mejoras y errores", icon: "bug" },
    { id: "config", name: "Configuración", icon: "settings" },
    { id: "vincular", name: "Celular y computadora", icon: "smartphone" },
    { id: "sinconexion", name: "Trabajar sin conexión", icon: "wifi-off" }
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
            "El celular y la computadora tienen que estar en el mismo Wi-Fi del local. Si no, el celular dice «Para entrar a la computadora, conectá este celular al mismo Wi-Fi».",
            "Si el celular no tenía la sesión abierta, con esa misma huella entran los dos. Si el celular todavía no entra con la huella, primero entrás con Google en el celular y te pide ponerla."
          ] },
        { id: "d-google", title: "Entrar con Google", icon: "log-in",
          lead: "Si no tenés el celular a mano.",
          steps: [
            { t: "Tocá «Continuar con Google».", cap: "desktop-entrance", hot: [78, 58.5], label: "Continuar con Google" },
            { t: "Elegí tu cuenta. Después de salir, Google siempre te pregunta cuál." },
            { t: "Entrás a Ferrebress, a la primera opción del menú." }
          ],
          tips: [ "Solo entran las cuentas que autorizó un Administrador. Si dice que tu cuenta no está autorizada, pedile que agregue tu correo." ] },
        { id: "d-sininternet", title: "Si no hay internet", icon: "wifi-off",
          lead: "Sin internet no se puede entrar a la computadora.",
          steps: [
            { t: "Los botones se apagan y la entrada dice «Para entrar hace falta internet».", cap: "desktop-entrance-offline", hot: [72.5, 65.4], label: "Hace falta internet" },
            { t: "Cuando vuelve internet, los botones se prenden solos. No hace falta recargar." }
          ] },
        { id: "d-tiempo", title: "Si pasa mucho tiempo", icon: "clock",
          lead: "Por seguridad, la sesión se cierra sola.",
          steps: [
            { t: "Si pasás una hora sin usar Ferrebress, o a las 8 horas de haber entrado, aparece la entrada encima de lo que estabas haciendo." },
            { t: "Entrás de nuevo con tu cuenta y seguís donde estabas. No se pierde nada." }
          ],
          tips: [ "Si entra otra persona, lo que quedó a medio hacer se descarta." ] },
        { id: "d-salir", title: "Salir", icon: "log-out",
          steps: [
            { t: "Abajo del menú de la izquierda está tu tarjeta, con tu nombre.", cap: "desktop-frame-sign-out", hot: [8.5, 87.3], label: "Tu tarjeta" },
            { t: "Tocá «Salir». Vuelve a la entrada.", cap: "desktop-frame-sign-out", hot: [7.5, 94.7], label: "Salir" }
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
            { t: "La primera vez te pregunta «¿Entrar con la huella la próxima vez?». Tocá que sí y poné la huella." }
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
          tips: [ "Los dos en el mismo Wi-Fi del local.", "Si dice «Para entrar a la computadora, conectá este celular al mismo Wi-Fi», pasate al Wi-Fi del local." ] },
        { id: "p-offline", title: "Entrar sin internet", icon: "wifi-off",
          lead: "Con «Trabajar sin conexión» prendido, entrás con la huella aunque se corte internet.",
          steps: [
            { t: "Con internet, en Más, prendé «Trabajar sin conexión». Aparece si ya entrás con la huella en este celular.", cap: "phone-more-offline", hot: [87.4, 75], label: "Trabajar sin conexión" },
            { t: "Sin internet, la entrada dice hasta cuándo podés entrar. Tocá «Ingresar con huella».", cap: "phone-offline-finger", hot: [50, 44], label: "Hasta cuándo" },
            { t: "Cuando vuelve internet, Ferrebress confirma tu entrada solo. Si no puede, te pide entrar de nuevo, sin perder nada.", cap: "phone-not-confirmed", hot: [50, 45], label: "Entrá de nuevo" }
          ],
          tips: [
            "Sirve hasta 24 horas desde la última vez que usaste Ferrebress con internet en este celular.",
            "Hoy lo pueden prender los Administradores.",
            "Si tu sesión se cerró desde otro dispositivo, para volver a entrar hace falta internet."
          ] },
        { id: "p-sininternet", title: "Si no hay internet", icon: "cloud-upload",
          steps: [
            { t: "Sin «Trabajar sin conexión», los botones se apagan y dice «Para entrar hace falta internet».", cap: "phone-google-offline", hot: [50, 44.5], label: "Hace falta internet" },
            { t: "Cuando vuelve, se prenden solos." }
          ] },
        { id: "p-salir", title: "Salir", icon: "log-out",
          steps: [
            { t: "Tocá Más, abajo a la derecha.", cap: "phone-more-sign-out", hot: [90.4, 95.4], label: "Más" },
            { t: "Bajá hasta el final y tocá «Salir». Vuelve a la entrada.", cap: "phone-more-sign-out", hot: [26, 82.5], label: "Salir" }
          ],
          tips: [ "Se puede salir aunque no haya internet." ] }
      ]
    }
  };

  function cap(name) { return (OWN.indexOf(name) >= 0 ? "captures/" : "../captures/") + name + ".webp"; }

  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  /* Busca solo en el capítulo del dispositivo elegido (R6.6) y en los nombres de los capítulos que faltan. */
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
      if (!c.ready && norm(c.name).indexOf(nq) >= 0) out.push({ chapter: c.name, icon: c.icon, pronto: true, score: 0 });
    });
    return out.sort(function (a, b) { return b.score - a.score; });
  }

  /* Marca lo buscado dentro de un texto (sin tocar el HTML). */
  function mark(text, q) {
    var esc = escape(text);
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
  function escape(text) { return String(text).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

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

  window.MANUAL = { chapters: CHAPTERS, entrar: ENTRAR, cap: cap, search: search, mark: mark, escape: escape, stepIcon: stepIcon, norm: norm };
})();
