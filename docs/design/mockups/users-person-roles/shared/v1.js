/* Variante 1 · La tarjeta. Los roles de la persona se ven en su tarjeta, con lo que queda
   pudiendo; «Cambiar roles» los vuelve una lista que se tilda, con lo que suma y lo que pierde
   antes de guardar. Autorizar usa la misma lista, sin nada tildado (R3.3). */
(function () {
  var celu = document.body.getAttribute("data-device") === "phone";
  var pant = celu ? M.celu({ alAutorizar: autorizar }) : M.compu({ alAutorizar: autorizar });
  var elegida = celu ? null : "lf", filtro = "", editando = null, pagina = null;

  /* ---------- Piezas ---------- */
  function iconosPermisos(r) { return r.permisos.map(function (id) { return '<i class="i i-s" data-i="' + R.permiso(id).ico + '" title="' + R.permiso(id).nombre + '"></i>'; }).join(""); }

  function tildarHtml(sel) {
    return '<div class="tildar">' + ROLES.map(function (r, i) {
      var n = R.cuantos(r.id);
      return '<button class="opc ' + (sel.indexOf(r.id) >= 0 ? "si" : "") + '" data-r="' + r.id + '"><span class="caja"><i class="i i-s" data-i="check" data-trazo="3"></i></span>' +
        '<span><span class="nom">' + r.nombre + '</span>' + (r.desc ? '<span class="desc">' + r.desc + "</span>" : "") + "</span>" +
        '<span style="display:grid;justify-items:end;gap:4px"><span class="kbd tecla">' + (i + 1) + '</span><span class="cuantos">' + (n === 1 ? "1 persona" : n + " personas") + "</span></span></button>";
    }).join("") + "</div>";
  }

  function puedeHtml(antes, despues, sel) {
    return '<div class="puede">' + PERMISOS.map(function (p) {
      var a = antes.indexOf(p.id) >= 0, d = despues.indexOf(p.id) >= 0;
      var cls = d && !a ? "suma" : a && !d ? "saca" : d ? "" : "no";
      var por = d ? sel.filter(function (r) { return R.rol(r).permisos.indexOf(p.id) >= 0; }).map(function (r) { return R.rol(r).nombre; }).join(" · ") : "";
      if (cls === "saca") por = "";
      return '<div class="p ' + cls + '"><i class="i marca-p" data-i="' + (d ? "circle-check" : a ? "circle-x" : "minus") + '"></i><span>' + p.nombre + '</span><span class="por">' + por + "</span></div>";
    }).join("") + "</div>";
  }

  /* Lista que se tilda: frena lo que no se puede (R1.3, R7.5) temblando y diciendo por qué. */
  function atarTildar(cont, persona, sel, cambio) {
    function tocar(id) {
      var b = cont.querySelector('.opc[data-r="' + id + '"]');
      var nuevo = sel.indexOf(id) >= 0 ? sel.filter(function (x) { return x !== id; }) : sel.concat(id);
      var motivo = persona ? R.frena(persona, nuevo) : "";
      var av = cont.querySelector(".aviso.v1"); if (av) av.remove();
      if (motivo) {
        b.classList.remove("tiembla"); void b.offsetWidth; b.classList.add("tiembla");
        b.insertAdjacentHTML("afterend", '<div class="aviso error v1"><i class="i" data-i="circle-alert"></i><span>' + motivo + "</span></div>");
        M.iconos(cont); return;
      }
      sel.length = 0; Array.prototype.push.apply(sel, nuevo);
      b.classList.toggle("si", sel.indexOf(id) >= 0);
      if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
      cambio();
    }
    cont.querySelectorAll(".opc").forEach(function (b) { b.addEventListener("click", function () { tocar(b.getAttribute("data-r")); }); });
    return tocar;
  }

  /* ---------- Lista de personas ---------- */
  function pintarLista() {
    var col = pant.querySelector(".lista");
    var filtroEl = pant.querySelector(".filtro-roles");
    filtroEl.innerHTML = '<button class="chip ' + (filtro ? "" : "elegido") + '" data-f="">Todos los roles</button>' + ROLES.map(function (r) {
      return '<button class="chip ' + (filtro === r.id ? "elegido" : "") + '" data-f="' + r.id + '">' + r.nombre + ' <span class="n">' + R.cuantos(r.id) + "</span></button>";
    }).join("");
    filtroEl.querySelectorAll(".chip").forEach(function (c) { c.addEventListener("click", function () { filtro = c.getAttribute("data-f"); pintarLista(); }); });
    M.lista(col, { elegida: elegida, alElegir: elegir });
    if (filtro) col.querySelectorAll(".pers").forEach(function (b) { if (R.persona(b.getAttribute("data-p")).roles.indexOf(filtro) < 0) b.style.display = "none"; });
  }

  function elegir(id) {
    elegida = id; editando = null;
    if (celu) { pagina = M.pagina("Usuarios", ""); pintarTarjeta(); }
    else { pintarLista(); pintarTarjeta(); }
  }

  /* ---------- La tarjeta ---------- */
  function cuerpoTarjeta() { return celu ? pagina.cuerpo : pant.querySelector(".tarjeta-p"); }

  function pintarTarjeta(nuevos) {
    var p = R.persona(elegida), t = cuerpoTarjeta(); if (!p || !t) return;
    var html = '<div class="cab">' + M.av(p) + '<div style="min-width:0"><div class="nom">' + R.mostrar(p) + (p.estado === "vos" ? ' <span class="vos">Vos</span>' : "") + '</div><div class="t-detalle">' + p.correo + "</div>" +
      '<div class="t-detalle">' + p.entro + "</div></div></div>";
    if (editando && !celu) {
      html += '<div class="sec-tit">Roles de ' + R.primer(p) + '<span class="n">· tildá los que tiene</span></div>' + tildarHtml(editando) +
        '<div class="sec-tit">Va a poder</div><div id="puede-vivo"></div>' +
        '<div class="editor-pie"><span class="info" id="info-ed"></span><button class="btn btn-fantasma" id="ed-no">Cancelar <span class="kbd">Esc</span></button><button class="btn btn-oscuro" id="ed-si">Guardar <span class="kbd">Enter</span></button></div>';
    } else {
      html += '<div class="sec-tit">Roles <span class="n">' + p.roles.length + "</span>" +
        '<button class="btn chico" id="cambiar"><i class="i i-s" data-i="pencil"></i>Cambiar roles' + (celu ? "" : ' <span class="kbd">Alt R</span>') + "</button></div>" +
        p.roles.map(function (id) { var r = R.rol(id); return '<div class="rol-fila ' + (nuevos && nuevos.indexOf(id) >= 0 ? "nuevo" : "") + '"><span class="ico"><i class="i" data-i="shield-check"></i></span><span><div class="nom">' + r.nombre + "</div>" + (r.desc ? '<div class="desc">' + r.desc + "</div>" : "") + '</span><span class="permi">' + iconosPermisos(r) + "</span></div>"; }).join("") +
        '<div class="sec-tit">Con esto puede</div>' + puedeHtml(R.puede(p.roles), R.puede(p.roles), p.roles) +
        '<div class="resto"><div class="fila"><i class="i" data-i="monitor"></i>Sesiones abiertas</div><div class="fila"><i class="i" data-i="fingerprint"></i>Celulares con huella</div></div>';
    }
    t.innerHTML = html; M.iconos(t);
    if (editando && !celu) atarEditor(t, p, editando);
    else t.querySelector("#cambiar").addEventListener("click", editar);
  }

  function atarEditor(t, p, sel, hoja) {
    var vivo = t.querySelector("#puede-vivo"), info = t.querySelector("#info-ed"), si = t.querySelector("#ed-si");
    function actualizar() {
      vivo.innerHTML = puedeHtml(R.puede(p.roles), R.puede(sel), sel); M.iconos(vivo);
      var suma = R.suma(p, sel), saca = R.saca(p, sel);
      si.disabled = !suma.length && !saca.length;
      info.innerHTML = suma.length ? '<i class="i i-s" data-i="lock-keyhole"></i> Darle un rol pide confirmar que sos vos' : saca.length ? "Quitar no pide confirmar" : "Sin cambios";
      M.iconos(info);
    }
    var tocar = atarTildar(t, p, sel, actualizar);
    actualizar();
    si.addEventListener("click", function () { guardar(p, sel.slice(), hoja); });
    t.querySelector("#ed-no").addEventListener("click", function () { if (hoja) hoja.cerrar(); else { editando = null; pintarTarjeta(); } });
    teclaTildar = tocar;
  }
  var teclaTildar = null;

  function editar() {
    var p = R.persona(elegida); editando = p.roles.slice();
    if (!celu) { pintarTarjeta(); return; }
    var h = M.abrir('<div class="hc"><h2 style="margin:4px 0 2px;font-size:22px;font-weight:800">Roles de ' + R.primer(p) + '</h2><p class="t-detalle" style="margin:0 0 12px">Tildá los que tiene. Puede todo lo que da cualquiera de ellos.</p>' + tildarHtml(editando) +
      '<div class="sec-tit" style="margin-top:16px">Va a poder</div><div id="puede-vivo"></div></div>' +
      '<div class="hp"><span class="t-detalle" id="info-ed" style="text-align:center"></span><button class="btn btn-oscuro grande" id="ed-si">Guardar</button><button class="btn btn-fantasma" id="ed-no">Cancelar</button></div>', { alCerrar: function () { editando = null; } });
    atarEditor(h.el, p, editando, h);
  }

  function guardar(p, sel, hoja) {
    var antes = p.roles.slice(), suma = R.suma(p, sel);
    function aplicar() {
      p.roles = sel; editando = null;
      if (hoja) hoja.cerrar();
      refrescar(suma);
      M.tostada(R.primer(p) + ": " + sel.map(function (r) { return R.rol(r).nombre; }).join(" + "), function () { p.roles = antes; refrescar(); });
    }
    if (suma.length) M.confirmar("Darle un rol", aplicar); else aplicar();
  }

  function refrescar(nuevos) { if (!celu) pintarLista(); else pintarLista(); pintarTarjeta(nuevos); }

  /* ---------- Autorizar a alguien (R3.3): ningún rol tildado de antemano ---------- */
  function autorizar() {
    var sel = [];
    var h = M.abrir((celu ? '<div class="hc">' : '<div class="aut-grid"><div>') + '<h2>Autorizar a alguien</h2><p class="t-detalle" style="margin:0">No se le manda ningún correo: avisale vos.</p>' +
      '<label class="etq">Nombre <span style="font-weight:500">(si lo dejás vacío, el de Google)</span></label><input class="entrada" id="a-nom" placeholder="Nombre y apellido">' +
      '<label class="etq">Correo de Google</label><input class="entrada" id="a-cor" placeholder="nombre@gmail.com" inputmode="email">' +
      '<label class="etq">Roles · elegí al menos uno</label>' + tildarHtml(sel) +
      (celu ? "" : '</div><div class="aut-der">') +
      '<div class="sec-tit" style="margin-top:16px">Va a poder</div><div id="puede-vivo"></div>' + (celu ? "</div>" : "</div></div>") +
      '<div class="' + (celu ? "hp" : "pie") + '"><span class="t-detalle" id="info-ed" style="' + (celu ? "text-align:center" : "flex:1;align-self:center") + '"></span>' + (celu ? "" : '<button class="btn btn-fantasma" id="ed-no">Cancelar <span class="kbd">Esc</span></button>') +
      '<button class="btn btn-accion ' + (celu ? "grande" : "") + '" id="ed-si"><i class="i" data-i="user-plus"></i>Autorizar' + (celu ? "" : ' <span class="kbd">Enter</span>') + "</button></div>", { ancho: 920 });
    var e = h.el, cor = e.querySelector("#a-cor"), si = e.querySelector("#ed-si"), info = e.querySelector("#info-ed"), vivo = e.querySelector("#puede-vivo");
    function act() {
      vivo.innerHTML = sel.length ? puedeHtml(R.puede(sel), R.puede(sel), sel) : '<p class="solo-lectura" style="margin:0">Tildá un rol y acá ves qué va a poder hacer.</p>'; M.iconos(vivo);
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cor.value.trim());
      si.disabled = !(ok && sel.length);
      info.textContent = !sel.length ? "Falta elegir un rol" : !ok ? "Falta el correo" : "";
    }
    atarTildar(e, null, sel, act); cor.addEventListener("input", act); act();
    var no = e.querySelector("#ed-no"); if (no) no.addEventListener("click", h.cerrar);
    si.addEventListener("click", function () {
      M.confirmar("Autorizar a alguien", function () {
        var nom = e.querySelector("#a-nom").value.trim();
        var p = { id: "n" + Date.now(), nombre: nom, correo: cor.value.trim(), estado: "activa", entro: "Todavía no entró", nunca: true, roles: sel.slice() };
        PERSONAS.push(p); h.cerrar(); elegida = celu ? elegida : p.id; pintarLista(); if (!celu) pintarTarjeta(p.roles);
        M.tostada((nom || p.correo) + " ya puede entrar");
      });
    });
    setTimeout(function () { var n = e.querySelector("#a-nom"); if (n && !celu) n.focus(); }, 60);
  }

  /* ---------- Armado ---------- */
  if (celu) {
    pant.innerHTML = '<div class="col-lista" style="height:100%"><div class="filtro-roles"></div><div class="lista"></div></div>';
  } else {
    pant.classList.add("lista-tarjeta");
    pant.innerHTML = '<div class="col-lista"><div class="buscar"><div class="campo"><i class="i" data-i="search"></i>Buscá por nombre o correo</div></div><div class="filtro-roles"></div><div class="lista"></div></div><aside class="tarjeta-p"></aside>';
  }
  M.iconos(pant);
  pintarLista(); if (!celu) pintarTarjeta();

  /* Teclado (compu): ↑ ↓ eligen la persona, Alt R cambia sus roles, 1–5 tildan, Enter guarda. */
  document.addEventListener("keydown", function (e) {
    if (celu) return;
    var enCampo = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (document.querySelector(".dialogo")) {
      var d = document.querySelector(".dialogo");
      if (!enCampo && /^[1-5]$/.test(e.key)) { var b = d.querySelectorAll(".opc")[+e.key - 1]; if (b) b.click(); }
      if (e.key === "Enter") { var s = d.querySelector("#ed-si"); if (s && !s.disabled) { e.preventDefault(); s.click(); } }
      return;
    }
    if (editando) {
      if (/^[1-5]$/.test(e.key) && teclaTildar) teclaTildar(ROLES[+e.key - 1].id);
      if (e.key === "Enter") { var g = document.getElementById("ed-si"); if (!g.disabled) g.click(); }
      if (e.key === "Escape") { editando = null; pintarTarjeta(); }
      return;
    }
    if (e.altKey && (e.key === "r" || e.key === "R")) { e.preventDefault(); editar(); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var l = R.ordenadas(), i = l.findIndex(function (p) { return p.id === elegida; });
      i = Math.max(0, Math.min(l.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
      e.preventDefault(); elegir(l[i].id);
    }
  });
})();
