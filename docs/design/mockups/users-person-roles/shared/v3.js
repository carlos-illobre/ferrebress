/* Variante 3 · El llavero. La persona es un llavero; cada rol, una llave colgada en el tablero.
   Darle un rol es arrastrar una copia de la llave al llavero (como en el mostrador de copias);
   sacárselo, arrastrarla afuera. También se toca, o 1–5 en la computadora. */
(function () {
  var celu = document.body.getAttribute("data-device") === "phone";
  var pant = celu ? M.celu({ alAutorizar: autorizar }) : M.compu({ alAutorizar: autorizar });
  var elegida = "pg", modo = "persona", borrador = null, pagina = null, escena = null;

  /* Los metales, en gradientes (una sola vez) */
  var METAL = { laton: ["#E8D08A", "#B8913A", "#8A6A22"], cobre: ["#E2A27C", "#A85A31", "#7A3A16"], acero: ["#C7D0D6", "#6C7A84", "#46525A"], niquel: ["#F2F3F4", "#A3A7AB", "#6F7478"], pavon: ["#67717A", "#2B3134", "#15191B"] };
  document.body.insertAdjacentHTML("beforeend", '<svg width="0" height="0" style="position:absolute"><defs>' + Object.keys(METAL).map(function (k) {
    return '<linearGradient id="g-' + k + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + METAL[k][0] + '"/><stop offset="1" stop-color="' + METAL[k][1] + '"/></linearGradient>';
  }).join("") + "</defs></svg>");

  function sigla(r) { var w = r.nombre.split(" ").filter(function (x) { return x.length > 2; }); return ((w[0] || r.nombre)[0] + ((w[1] || "")[0] || (w[0] || "")[1] || "")).toUpperCase(); }
  function llaveSvg(r, h) {
    var m = METAL[r.metal], k = r.metal;
    return '<svg width="' + (h * 60 / 160) + '" height="' + h + '" viewBox="0 0 60 160" aria-hidden="true">' +
      '<path d="M26 58h8v86l-4 6-4-6z" fill="url(#g-' + k + ')" stroke="' + m[2] + '" stroke-width="1.5"/>' +
      '<path d="M34 100h11v8h-6v7h8v8h-6v7h7v9H34z" fill="url(#g-' + k + ')" stroke="' + m[2] + '" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<rect x="22" y="52" width="16" height="9" rx="2" fill="url(#g-' + k + ')" stroke="' + m[2] + '" stroke-width="1.5"/>' +
      '<circle cx="30" cy="30" r="26" fill="url(#g-' + k + ')" stroke="' + m[2] + '" stroke-width="1.5"/>' +
      '<circle cx="30" cy="16" r="6.5" fill="#F4F2EC" stroke="' + m[2] + '" stroke-width="1.5"/>' +
      '<text x="30" y="43" text-anchor="middle" font-family="Manrope, sans-serif" font-weight="800" font-size="15" fill="' + (k === "pavon" ? "#fff" : m[2]) + '">' + sigla(r) + "</text></svg>";
  }
  M.pills = function (roles) { return roles.map(function (id) { var r = R.rol(id); return '<span class="pastilla rol"><span class="mdot m-' + r.metal + '"></span>' + r.nombre + "</span>"; }).join(""); };

  function actual() { return modo === "nuevo" ? borrador : R.persona(elegida); }

  /* ---------- El escenario ---------- */
  function pintarEscena(nueva, previas) {
    var p = actual(), roles = p.roles;
    var et = modo === "nuevo"
      ? '<div class="etiqueta"><span class="av" style="background:var(--hundido);color:var(--texto-3)"><i class="i" data-i="user-plus"></i></span><div><input id="a-nom" placeholder="Nombre (o el de Google)" value="' + (borrador.nombre || "") + '"><input id="a-cor" placeholder="Correo de Google" value="' + (borrador.correo || "") + '"></div></div>'
      : '<div class="etiqueta">' + M.av(p) + '<div style="min-width:0"><div class="nom">' + R.mostrar(p) + (p.estado === "vos" ? ' <span class="vos">Vos</span>' : "") + '</div><div class="t-detalle">' + p.entro + "</div></div></div>";
    var n = roles.length, abre = 36 * (n - 1);
    var colg = roles.map(function (id, i) {
      var a = n === 1 ? 0 : -abre / 2 + i * (abre / (n - 1));
      return '<div class="colgada"><div class="giro" style="transform:rotate(' + a + 'deg)"><div class="llave ' + (id === nueva ? "entra" : "") + '" data-r="' + id + '" title="' + R.rol(id).nombre + '">' + llaveSvg(R.rol(id), 150) + "</div></div></div>";
    }).join("");
    var puede = R.puede(roles), antes = previas ? R.puede(previas) : puede;
    escena.innerHTML = et + '<div class="cadena"></div><div class="aro-zona"><div class="aro"></div>' + colg +
      (n ? "" : '<div class="vacio"><i class="i" data-i="key-round"></i>Colgale al menos una llave</div>') + "</div>" +
      (n ? '<div class="leyenda">' + roles.map(function (id) { var r = R.rol(id); return '<span><span class="mdot m-' + r.metal + '"></span>' + r.nombre + "</span>"; }).join("") + "</div>" : "") +
      '<div class="abre"><span class="et">' + (n ? "Con este llavero puede" : "Todavía no puede nada") + '</span><div class="puertas">' + PERMISOS.map(function (q) {
        var si = puede.indexOf(q.id) >= 0;
        return '<span class="puerta ' + (si ? "si " : "") + (si && antes.indexOf(q.id) < 0 ? "nueva" : "") + '"><i class="i i-s" data-i="' + (si ? q.ico : "lock") + '"></i>' + q.corto + "</span>";
      }).join("") + "</div>" +
      (modo === "nuevo" ? '<div class="acciones-aut"><button class="btn btn-fantasma" id="a-no">Cancelar' + (celu ? "" : ' <span class="kbd">Esc</span>') + '</button><button class="btn btn-accion" id="a-si"><i class="i" data-i="user-plus"></i>Autorizar' + (celu ? "" : ' <span class="kbd">Enter</span>') + "</button></div>" : "") +
      "</div>";
    M.iconos(escena);
    escena.querySelectorAll(".colgada .llave").forEach(function (k) { k.addEventListener("pointerdown", function (e) { arrastrar(e, k.getAttribute("data-r"), "aro", k); }); });
    if (modo === "nuevo") {
      var nom = escena.querySelector("#a-nom"), cor = escena.querySelector("#a-cor"), si = escena.querySelector("#a-si");
      function act() { borrador.nombre = nom.value; borrador.correo = cor.value; si.disabled = !(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cor.value.trim()) && borrador.roles.length); }
      nom.addEventListener("input", act); cor.addEventListener("input", act); act();
      escena.querySelector("#a-no").addEventListener("click", salirNuevo);
      si.addEventListener("click", confirmarNuevo);
    }
    pintarTablero();
  }

  /* ---------- El tablero ---------- */
  var tablero = null;
  function pintarTablero() {
    var p = actual();
    tablero.innerHTML = (celu ? "" : '<div class="tit"><i class="i" data-i="key-round"></i>El tablero</div><div class="ayuda">Arrastrá una llave al llavero, o tocá 1 a 5. Para sacarla, arrastrala afuera.</div>') +
      ROLES.map(function (r, i) {
        return '<div class="gancho ' + (p.roles.indexOf(r.id) >= 0 ? "puesta" : "") + '" data-r="' + r.id + '"><span class="mini">' + llaveSvg(r, celu ? 64 : 70) + '</span><span><div class="nom">' + r.nombre + "</div>" +
          (r.desc ? '<div class="desc">' + r.desc + "</div>" : "") + '<div class="perm">' + r.permisos.map(function (id) { return '<i class="i i-s" data-i="' + R.permiso(id).ico + '"></i>'; }).join("") + "</div></span>" +
          '<span class="lado"><span class="kbd">' + (i + 1) + "</span>" + (p.roles.indexOf(r.id) >= 0 ? '<span class="pastilla pino">La tiene</span>' : '<span class="t-detalle">' + R.cuantos(r.id) + " " + (R.cuantos(r.id) === 1 ? "copia" : "copias") + "</span>") + "</span></div>";
      }).join("");
    M.iconos(tablero);
    tablero.querySelectorAll(".gancho").forEach(function (g) { g.addEventListener("pointerdown", function (e) { arrastrar(e, g.getAttribute("data-r"), "tablero", g); }); });
  }

  /* ---------- Arrastrar ---------- */
  function arrastrar(e, id, desde, origen) {
    e.preventDefault();
    var x0 = e.clientX, y0 = e.clientY, movio = false, fant = null;
    var host = celu ? document.getElementById("celu") : document.body;
    var off = host.getBoundingClientRect();
    function mover(ev) {
      var dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (!movio && Math.abs(dx) + Math.abs(dy) < 8) return;
      if (!movio) {
        movio = true;
        fant = M.el('<div class="fantasma">' + llaveSvg(R.rol(id), 120) + "</div>"); host.appendChild(fant);
        if (celu) fant.style.position = "absolute";
        if (desde === "aro") origen.style.opacity = "0";
      }
      fant.style.transform = "translate(" + (ev.clientX - off.left - 22) + "px," + (ev.clientY - off.top - 30) + "px) rotate(" + Math.max(-20, Math.min(20, dx / 12)) + "deg)";
      escena.classList.toggle("encima", desde === "tablero" && dentro(ev, escena));
    }
    function soltar(ev) {
      document.removeEventListener("pointermove", mover); document.removeEventListener("pointerup", soltar);
      escena.classList.remove("encima");
      if (fant) fant.remove();
      if (!movio) { if (desde === "tablero" && actual().roles.indexOf(id) >= 0) sacar(id); else if (desde === "tablero") dar(id); else sacar(id); return; }
      if (desde === "tablero" && dentro(ev, escena)) dar(id);
      else if (desde === "aro" && !dentro(ev, escena.querySelector(".aro-zona"))) sacar(id);
      else origen.style.opacity = "";
    }
    document.addEventListener("pointermove", mover); document.addEventListener("pointerup", soltar);
  }
  function dentro(ev, el) { var b = el.getBoundingClientRect(); return ev.clientX > b.left && ev.clientX < b.right && ev.clientY > b.top && ev.clientY < b.bottom; }

  /* ---------- Dar y sacar, con las reglas ---------- */
  function avisar(id, motivo) {
    var k = escena.querySelector('.colgada .llave[data-r="' + id + '"]');
    if (k) { k.style.opacity = ""; k.classList.remove("tiembla"); void k.offsetWidth; k.classList.add("tiembla"); }
    var v = escena.querySelector(".aviso"); if (v) v.remove();
    v = M.el('<div class="aviso error"><i class="i" data-i="circle-alert"></i><span>' + motivo + "</span></div>"); escena.appendChild(v); M.iconos(v);
    if (navigator.vibrate) try { navigator.vibrate([10, 40, 10]); } catch (e) {}
    setTimeout(function () { v.remove(); }, 3200);
  }

  function dar(id) {
    var p = actual(); if (p.roles.indexOf(id) >= 0) return;
    var antes = p.roles.slice(), nuevos = ROLES.map(function (r) { return r.id; }).filter(function (r) { return antes.indexOf(r) >= 0 || r === id; });
    function aplicar() {
      p.roles = nuevos; pintarEscena(id, antes); if (modo !== "nuevo") refrescarLista();
      if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
      if (modo !== "nuevo") M.tostada("Copia de «" + R.rol(id).nombre + "» para " + R.primer(p), function () { p.roles = antes; pintarEscena(); refrescarLista(); });
    }
    if (modo === "nuevo") aplicar(); else M.confirmar("Darle un rol", aplicar);
  }

  function sacar(id) {
    var p = actual(), antes = p.roles.slice(), nuevos = antes.filter(function (r) { return r !== id; });
    var motivo = modo === "nuevo" ? "" : R.frena(p, nuevos);
    if (motivo) { avisar(id, motivo.replace("al menos un rol", "al menos una llave")); return; }
    var k = escena.querySelector('.colgada .llave[data-r="' + id + '"]');
    if (k) { k.style.opacity = ""; k.classList.add("cae"); }
    setTimeout(function () {
      p.roles = nuevos; pintarEscena(null, antes); if (modo !== "nuevo") refrescarLista();
      if (modo !== "nuevo") M.tostada(R.primer(p) + " ya no tiene «" + R.rol(id).nombre + "»", function () { p.roles = antes; pintarEscena(); refrescarLista(); });
    }, 380);
  }

  /* ---------- Autorizar: el llavero vacío, con la etiqueta para escribir ---------- */
  function autorizar() {
    modo = "nuevo"; borrador = { id: "nuevo", roles: [], nombre: "", correo: "" };
    if (celu) { abrirPagina("Usuarios"); }
    else { refrescarLista(); pintarEscena(); setTimeout(function () { var n = document.getElementById("a-nom"); if (n) n.focus(); }, 50); }
  }
  function salirNuevo() { modo = "persona"; borrador = null; if (celu) pagina.cerrar(); else { refrescarLista(); pintarEscena(); } }
  function confirmarNuevo() {
    M.confirmar("Autorizar a alguien", function () {
      var b = borrador, p = { id: "n" + Date.now(), nombre: b.nombre.trim(), correo: b.correo.trim(), estado: "activa", entro: "Todavía no entró", nunca: true, roles: b.roles.slice() };
      PERSONAS.push(p); modo = "persona"; borrador = null; elegida = p.id;
      refrescarLista(); pintarEscena();
      M.tostada((p.nombre || p.correo) + " ya puede entrar");
    });
  }

  /* ---------- Lista y armado ---------- */
  function refrescarLista() {
    M.lista(pant.querySelector(".lista"), { elegida: celu || modo === "nuevo" ? null : elegida, alElegir: elegir, rolesAbajo: true });
  }
  function elegir(id) {
    modo = "persona"; borrador = null; elegida = id;
    if (celu) abrirPagina("Usuarios"); else { refrescarLista(); pintarEscena(); }
  }
  function abrirPagina(t) {
    pagina = M.pagina(t, "");
    pagina.cuerpo.classList.add("v3c");
    pagina.cuerpo.innerHTML = '<section class="escena"></section><div class="bandeja-ayuda">Subí una llave al llavero, o tocala</div><div class="bandeja"></div>';
    escena = pagina.cuerpo.querySelector(".escena"); tablero = pagina.cuerpo.querySelector(".bandeja");
    pintarEscena();
    pagina.el.querySelector(".volver").addEventListener("click", function () { modo = "persona"; borrador = null; });
  }

  if (celu) { pant.innerHTML = '<div class="col-lista" style="height:100%"><div class="lista"></div></div>'; }
  else {
    pant.classList.add("v3");
    pant.innerHTML = '<div class="col-lista"><div class="lista"></div></div><section class="escena"></section><aside class="tablero"></aside>';
    escena = pant.querySelector(".escena"); tablero = pant.querySelector(".tablero");
  }
  refrescarLista(); if (!celu) pintarEscena();

  document.addEventListener("keydown", function (e) {
    if (celu || document.querySelector(".dialogo")) return;
    var enCampo = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (!enCampo && /^[1-5]$/.test(e.key)) { var id = ROLES[+e.key - 1].id; if (actual().roles.indexOf(id) >= 0) sacar(id); else dar(id); }
    if (modo === "nuevo") {
      if (e.key === "Escape") salirNuevo();
      if (e.key === "Enter") { var s = document.getElementById("a-si"); if (s && !s.disabled) s.click(); }
      return;
    }
    if (!enCampo && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      var l = R.ordenadas(), i = l.findIndex(function (p) { return p.id === elegida; });
      i = Math.max(0, Math.min(l.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
      e.preventDefault(); elegir(l[i].id);
    }
  });
})();
