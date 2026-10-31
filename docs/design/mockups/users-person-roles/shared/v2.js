/* Variante 2 · Lo que puede hacer. No se eligen roles: se dice qué puede hacer la persona (o que
   hace lo mismo que otra) y la pantalla deduce qué roles le tocan. Si ningún rol da justo eso,
   muestra lo más cercano y lo que deja de más. */
(function () {
  var celu = document.body.getAttribute("data-device") === "phone";
  var pant = celu ? M.celu({ alAutorizar: autorizar }) : M.compu({ alAutorizar: autorizar });
  var elegida = "ms", editor = null, pagina = null;

  function igualSet(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; }); }
  function contiene(a, b) { return b.every(function (x) { return a.indexOf(x) >= 0; }); }

  /* Todas las combinaciones de roles (son pocos): la más chica que da justo W; si no hay, las más cercanas. */
  function deducir(W, actuales) {
    var subs = [];
    for (var m = 1; m < (1 << ROLES.length); m++) {
      var s = ROLES.filter(function (r, i) { return m & (1 << i); }).map(function (r) { return r.id; });
      subs.push({ roles: s, da: R.puede(s) });
    }
    function peso(x) { return x.roles.length * 10 - x.roles.filter(function (r) { return actuales.indexOf(r) >= 0; }).length; }
    var exactos = subs.filter(function (x) { return igualSet(x.da, W); }).sort(function (a, b) { return peso(a) - peso(b); });
    if (exactos.length) return { exacto: exactos[0].roles };
    var cerca = subs.filter(function (x) { return contiene(x.da, W); }).map(function (x) {
      x.extra = x.da.filter(function (p) { return W.indexOf(p) < 0; }); return x;
    }).sort(function (a, b) { return a.extra.length - b.extra.length || peso(a) - peso(b); });
    var vistos = {}, out = [];
    cerca.forEach(function (x) { var k = x.extra.join(); if (!vistos[k] && out.length < 2) { vistos[k] = 1; out.push(x); } });
    return { cercanos: out };
  }

  /* ---------- El editor: las fichas de lo que puede, «Eso es» y «Igual que» ---------- */
  function crearEditor(cont, persona, alCambiar) {
    var actuales = persona ? persona.roles.slice() : [];
    var st = { W: R.puede(actuales), roles: actuales.slice(), opcion: 0, igual: null };

    function tilesHtml() {
      return '<div class="tiles">' + PERMISOS.map(function (p, i) {
        var si = st.W.indexOf(p.id) >= 0;
        var fijo = p.id === "ver" && (st.W.indexOf("per") >= 0 || st.W.indexOf("cor") >= 0);
        return '<button class="tile ' + (si ? "si " : "") + (fijo ? "fijo" : "") + '" data-p="' + p.id + '"><span class="arriba"><span class="ic"><i class="i" data-i="' + p.ico + '"></i></span><span class="sw"></span></span>' +
          '<span><span class="nom">' + p.nombre + '</span><span class="fr" style="display:block">' + (fijo ? '<span class="nota">Viene con lo de administrar o cortar</span>' : cap(p.frase)) + "</span></span>" +
          (celu ? "" : '<span class="kbd">' + (i + 1) + "</span>") + "</button>";
      }).join("") + "</div>";
    }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function esoesHtml() {
      if (!st.W.length) return '<div class="esoes"><span class="t-detalle">' + (persona ? "" : "Tocá lo que va a poder hacer, o elegí a alguien que haga lo mismo.") + "</span></div>";
      var d = st.igual ? { exacto: R.persona(st.igual).roles } : igualSet(st.W, R.puede(actuales)) ? { exacto: actuales } : deducir(st.W, actuales);
      var h = '<div class="esoes">';
      if (d.exacto) {
        st.roles = d.exacto.slice();
        h += '<div class="fila"><span class="et">' + (st.igual ? "Igual que " + R.primer(R.persona(st.igual)) + ":" : "Eso es:") + "</span>" +
          d.exacto.map(function (r) { return '<span class="pastilla rol ' + (persona && actuales.indexOf(r) < 0 ? "nueva" : "") + '"><i class="i i-s" data-i="shield-check"></i>' + R.rol(r).nombre + "</span>"; }).join("") +
          (persona ? R.saca({ roles: actuales }, d.exacto).map(function (r) { return '<span class="pastilla saca">' + R.rol(r).nombre + "</span>"; }).join("") : "") + "</div>";
      } else {
        st.opcion = Math.min(st.opcion, d.cercanos.length - 1);
        st.roles = d.cercanos[st.opcion].roles.slice();
        h += '<div class="aviso urgente"><i class="i" data-i="triangle-alert"></i><span>Ningún rol da justo eso. Elegí el más cercano o armá uno nuevo.</span></div><div class="opciones">' +
          d.cercanos.map(function (x, i) {
            return '<button data-o="' + i + '" class="' + (i === st.opcion ? "elegida" : "") + '"><i class="i i-s" data-i="shield-check"></i>' + x.roles.map(function (r) { return R.rol(r).nombre; }).join(" + ") +
              '<span class="t-detalle">también deja: ' + x.extra.map(function (p) { return R.permiso(p).nombre.toLowerCase(); }).join(", ") + "</span></button>";
          }).join("") + '<button data-ir="users-roles"><i class="i i-s" data-i="plus"></i>Armar un rol con justo esto<span class="t-detalle">en Roles</span></button></div>';
      }
      return h + "</div>";
    }

    function igualHtml() {
      return '<div class="igual">' + PERSONAS.filter(function (p) { return p.estado !== "baja" && (!persona || p.id !== persona.id); }).map(function (p) {
        return '<button data-g="' + p.id + '" class="' + (st.igual === p.id ? "elegida" : "") + '">' + M.av(p) + R.primer(p) + ' <span class="t-detalle">' + p.roles.map(function (r) { return R.rol(r).nombre; }).join(" + ") + "</span></button>";
      }).join("") + "</div>";
    }

    function pintar(tiembla, aviso) {
      cont.querySelector(".z-tiles").innerHTML = tilesHtml();
      cont.querySelector(".z-esoes").innerHTML = esoesHtml() + (aviso ? '<div class="aviso error" style="margin-top:8px"><i class="i" data-i="circle-alert"></i><span>' + aviso + "</span></div>" : "");
      cont.querySelector(".z-igual").innerHTML = igualHtml();
      M.iconos(cont);
      cont.querySelectorAll(".tile").forEach(function (t) { t.addEventListener("click", function () { tocar(t.getAttribute("data-p")); }); });
      cont.querySelectorAll(".opciones [data-o]").forEach(function (b) { b.addEventListener("click", function () { st.opcion = +b.getAttribute("data-o"); pintar(); }); });
      cont.querySelectorAll(".igual [data-g]").forEach(function (b) { b.addEventListener("click", function () {
        var g = b.getAttribute("data-g");
        if (st.igual === g) { st.igual = null; } else {
          var otro = R.persona(g), motivo = persona ? R.frena(persona, otro.roles) : "";
          if (motivo) { pintar(null, motivo); return; }
          st.igual = g; st.W = R.puede(otro.roles);
        }
        pintar();
      }); });
      if (tiembla) { var t = cont.querySelector('.tile[data-p="' + tiembla + '"]'); if (t) { t.classList.add("tiembla"); } }
      alCambiar(st);
    }

    function tocar(pid) {
      var W = st.W.slice(), i = W.indexOf(pid);
      if (pid === "ver" && i >= 0 && (W.indexOf("per") >= 0 || W.indexOf("cor") >= 0)) { pintar(pid); return; }
      if (i >= 0) W.splice(i, 1); else { W.push(pid); var inc = R.permiso(pid).incluye; if (inc && W.indexOf(inc) < 0) W.push(inc); }
      W = PERMISOS.map(function (p) { return p.id; }).filter(function (p) { return W.indexOf(p) >= 0; });
      if (persona && !W.length) { pintar(pid, "Le tiene que quedar algo. Para que no pueda nada, dala de baja."); return; }
      if (persona && persona.estado === "vos" && i >= 0 && (pid === "rol" || pid === "per")) { pintar(pid, "No te podés sacar «" + R.permiso(pid).nombre + "»: lo tiene que hacer otra persona."); return; }
      if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
      st.W = W; st.igual = null; st.opcion = 0; pintar();
    }

    pintar();
    return { st: st, tocar: tocar, actuales: actuales };
  }

  function bloquesHtml(persona, autorizando) {
    var quien = persona ? R.primer(persona) : "";
    var igualPrimero = autorizando;
    var t = '<div class="pregunta">' + (persona ? "¿Qué puede hacer " + quien + "?" : "O elegí qué va a poder hacer") + (celu ? "" : '<span class="t-detalle">Tocá o usá 1 a 5</span>') + '</div><div class="z-tiles"></div><div class="z-esoes"></div>';
    var g = '<div class="pregunta">' + (autorizando ? "¿Hace lo mismo que alguien?" : "O igual que alguien") + '</div><div class="z-igual"></div>';
    return igualPrimero ? g + t : t + g;
  }

  /* ---------- La persona ---------- */
  function pintarLista() { M.lista(pant.querySelector(".lista"), { elegida: celu ? null : elegida, alElegir: elegir, rolesAbajo: true }); }

  function cabHtml(p) {
    return '<div class="cab">' + M.av(p) + '<div style="min-width:0"><div class="nom">' + R.mostrar(p) + (p.estado === "vos" ? ' <span class="vos">Vos</span>' : "") + '</div><div class="t-detalle">' + p.correo + " · " + p.entro + "</div></div></div>";
  }

  function elegir(id) {
    elegida = id;
    if (celu) { pagina = M.pagina("Usuarios", ""); pintarPersona(); return; }
    pintarLista(); pintarPersona();
  }

  function pintarPersona() {
    var p = R.persona(elegida);
    var cont = celu ? pagina.cuerpo : pant.querySelector(".panel");
    cont.innerHTML = cabHtml(p) + bloquesHtml(p, false) +
      (celu ? "" : '<div class="pie"><span class="info" id="info"></span><button class="btn btn-fantasma" id="descartar">Descartar <span class="kbd">Esc</span></button><button class="btn btn-oscuro" id="guardar">Guardar <span class="kbd">Enter</span></button></div>');
    var barra = null;
    if (celu) {
      barra = pagina.el.querySelector(".barra-v2");
      if (!barra) { barra = M.el('<div class="barra-v2"><div class="z-esoes-celu"></div><span class="t-detalle" id="info" style="display:block;text-align:center;margin-bottom:8px"></span><button class="btn btn-oscuro grande" style="width:100%" id="guardar">Guardar</button></div>'); pagina.el.appendChild(barra); }
    }
    var host = celu ? pagina.el : cont;
    editor = crearEditor(cont, p, function (st) {
      var cambio = !igualSet(st.roles, p.roles), suma = R.suma(p, st.roles);
      var g = host.querySelector("#guardar"), info = host.querySelector("#info");
      g.disabled = !cambio;
      info.innerHTML = !cambio ? "Sin cambios" : suma.length ? '<i class="i i-s" data-i="lock-keyhole"></i>Darle un rol pide confirmar que sos vos' : "Quitar no pide confirmar";
      M.iconos(info);
      if (barra) {
        barra.classList.toggle("visible", cambio);
        var z = barra.querySelector(".z-esoes-celu"); z.innerHTML = ""; z.appendChild(cont.querySelector(".z-esoes .esoes").cloneNode(true));
      }
    });
    host.querySelector("#guardar").onclick = function () { guardar(p, editor.st.roles.slice()); };
    var d = cont.querySelector("#descartar"); if (d) d.onclick = pintarPersona;
  }

  function guardar(p, roles) {
    var antes = p.roles.slice(), suma = R.suma(p, roles);
    function aplicar() {
      p.roles = roles; pintarLista(); pintarPersona();
      M.tostada(R.primer(p) + ": " + roles.map(function (r) { return R.rol(r).nombre; }).join(" + "), function () { p.roles = antes; pintarLista(); pintarPersona(); });
    }
    if (suma.length) M.confirmar("Darle un rol", aplicar); else aplicar();
  }

  /* ---------- Autorizar: primero «¿hace lo mismo que alguien?» (un toque) ---------- */
  function autorizar() {
    var h = M.abrir('<div class="' + (celu ? "hc " : "") + 'v2-aut"><h2>Autorizar a alguien</h2><p class="t-detalle" style="margin:0">No se le manda ningún correo: avisale vos.</p>' +
      '<div style="display:grid;grid-template-columns:' + (celu ? "1fr" : "1fr 1fr") + ';gap:0 12px"><div><label class="etq">Nombre <span style="font-weight:500">(si queda vacío, el de Google)</span></label><input class="entrada" id="a-nom" placeholder="Nombre y apellido"></div>' +
      '<div><label class="etq">Correo de Google</label><input class="entrada" id="a-cor" placeholder="nombre@gmail.com"></div></div>' +
      bloquesHtml(null, true) + "</div>" +
      '<div class="' + (celu ? "hp" : "pie") + '"><span class="t-detalle" id="a-info" style="' + (celu ? "text-align:center" : "flex:1;align-self:center") + '"></span>' + (celu ? "" : '<button class="btn btn-fantasma" id="a-no">Cancelar <span class="kbd">Esc</span></button>') +
      '<button class="btn btn-accion ' + (celu ? "grande" : "") + '" id="a-si"><i class="i" data-i="user-plus"></i>Autorizar' + (celu ? "" : ' <span class="kbd">Enter</span>') + "</button></div>", { ancho: 820 });
    var e = h.el, cor = e.querySelector("#a-cor"), si = e.querySelector("#a-si"), info = e.querySelector("#a-info"), ed;
    function act() {
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cor.value.trim()), hay = ed && ed.st.W.length;
      si.disabled = !(ok && hay);
      info.textContent = !hay ? "Falta decir qué va a poder hacer" : !ok ? "Falta el correo" : "";
    }
    ed = crearEditor(e, null, act); cor.addEventListener("input", act); act();
    window.__autorizar = ed;
    var no = e.querySelector("#a-no"); if (no) no.addEventListener("click", h.cerrar);
    si.addEventListener("click", function () {
      M.confirmar("Autorizar a alguien", function () {
        var nom = e.querySelector("#a-nom").value.trim();
        var p = { id: "n" + Date.now(), nombre: nom, correo: cor.value.trim(), estado: "activa", entro: "Todavía no entró", nunca: true, roles: ed.st.roles.slice() };
        PERSONAS.push(p); h.cerrar(); if (!celu) elegida = p.id; pintarLista(); if (!celu) pintarPersona();
        M.tostada((nom || p.correo) + " ya puede entrar");
      });
    });
  }

  /* ---------- Armado ---------- */
  if (celu) pant.innerHTML = '<div class="col-lista" style="height:100%"><div class="lista"></div></div>';
  else {
    pant.classList.add("v2");
    pant.innerHTML = '<div class="col-lista"><div class="buscar"><div class="campo"><i class="i" data-i="search"></i>Buscá por nombre o correo</div></div><div class="lista"></div></div><section class="panel"></section>';
  }
  M.iconos(pant);
  pintarLista(); if (!celu) pintarPersona();

  document.addEventListener("keydown", function (e) {
    if (celu) return;
    var enCampo = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    var dlg = document.querySelector(".dialogo");
    if (dlg) {
      if (!enCampo && /^[1-5]$/.test(e.key) && window.__autorizar) window.__autorizar.tocar(PERMISOS[+e.key - 1].id);
      if (e.key === "Enter") { var s = dlg.querySelector("#a-si"); if (s && !s.disabled) { e.preventDefault(); s.click(); } }
      return;
    }
    if (/^[1-5]$/.test(e.key) && editor) editor.tocar(PERMISOS[+e.key - 1].id);
    if (e.key === "Enter") { var g = document.getElementById("guardar"); if (g && !g.disabled) g.click(); }
    if (e.key === "Escape") pintarPersona();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var l = R.ordenadas(), i = l.findIndex(function (p) { return p.id === elegida; });
      i = Math.max(0, Math.min(l.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
      e.preventDefault(); elegir(l[i].id);
    }
  });
})();
