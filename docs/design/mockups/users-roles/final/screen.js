/* Usuarios · Roles · maqueta final: lo que hace la pantalla. Parte del guion de la variante 1 del
   director (computadora y celular), en una sola página. */
(function () {
  var R = window.ROLES;
  var lista = document.getElementById("lista"), ficha = document.getElementById("ficha"), crear = document.getElementById("crear");
  // En la computadora, al abrir, queda elegido el primer rol de la lista (como en Usuarios); en el celular, ninguno.
  var sel = R.isPhone() ? null : R.roles[0].id;
  var editing = false, warn = null, showCount = false; // warn: {kind, key, msg}

  /* ================= «Quién puede qué», con cómo se cuenta (00 · R8.1) ================= */
  function howCounted(pid) {
    var parts = R.roles.filter(function (r) { return R.has(r, pid) && r.people.length; });
    if (!parts.length) return "Ningún rol con gente lo tiene.";
    var by = R.whoCan(pid), twice = Object.keys(by).filter(function (p) { return by[p].length > 1; });
    var h = parts.map(function (r) { return r.name + " " + r.people.length; }).join(" + ");
    if (twice.length) h += ", sin contar dos veces a " + R.names(twice) + " (" + (twice.length > 1 ? "tienen" : "tiene") + " más de uno)";
    return h + ".";
  }
  function drawQp() {
    document.getElementById("qp").innerHTML = R.PERMS.map(function (p) {
      var n = Object.keys(R.whoCan(p.id)).length;
      return '<div class="qp-fila"><span>' + p.name + '</span><span class="barra qp-barra" aria-hidden="true"><b style="transform:scaleX(' + (n / R.TOTAL_PEOPLE) + ')"></b></span><span class="qp-n">' + n + "</span>" +
        '<p class="qp-cuenta"' + (showCount ? "" : " hidden") + ">" + howCounted(p.id) + "</p></div>";
    }).join("");
    document.getElementById("n-roles").textContent = R.roles.length;
    document.getElementById("lista-t").textContent = R.isPhone() ? R.roles.length + " roles" : "Los roles del negocio";
  }
  document.getElementById("qp-como").addEventListener("click", toggleCount);
  function toggleCount() {
    showCount = !showCount;
    document.getElementById("qp-como").setAttribute("aria-expanded", showCount);
    drawQp();
  }

  /* ================= La lista de roles: nombre, descripción (si tiene) y lo que deja hacer ================= */
  function drawList(entering) {
    lista.innerHTML = R.roles.map(function (r) {
      var n = r.people.length, on = r.id === sel && !R.isPhone();
      return '<button type="button" class="fila' + (on ? " elegida" : "") + (r.id === entering ? " entra recien" : "") + '" role="option" aria-selected="' + on + '" data-id="' + r.id + '">' +
        '<span class="escudo"><i class="i" data-i="' + (r.fixed ? "shield-check" : "shield") + '"></i></span>' +
        '<span class="fila-texto"><span class="fila-nombre"><span>' + R.esc(r.name) + "</span>" + (r.people.indexOf("RP") >= 0 ? '<span class="pastilla accion chica">El tuyo</span>' : "") + "</span>" +
        (r.desc ? '<span class="fila-desc">' + R.esc(r.desc) + "</span>" : "") +
        '<span class="fila-permisos"><span class="puntos" aria-hidden="true">' + R.PERMS.map(function (p) { return '<span class="' + (R.has(r, p.id) ? "si" : "") + '"></span>'; }).join("") + "</span>" + R.permsCount(r.perms.length) +
        (R.isPhone() ? R.pila(r.people, 3) : "") + "</span></span>" +
        '<span class="fila-pila">' + R.pila(r.people) + "</span>" +
        '<span class="cuantas' + (n ? "" : " cero") + '"><b>' + n + "</b><span>" + (n === 1 ? "persona" : "personas") + "</span></span>" +
        '<i class="i flecha" data-i="chevron-right"></i></button>';
    }).join("");
    R.icons(lista);
  }

  /* ================= La tarjeta del rol ================= */
  function permRow(r, p) {
    var on = R.has(r, p.id), tied = R.tied(r, p.id), w = warn && warn.kind === "perm" && warn.key === p.id;
    return '<div class="permiso' + (on ? " on" : "") + (w ? " no" : "") + '"><span class="permiso-ic"><i class="i" data-i="' + p.icon + '"></i></span>' +
      '<span class="permiso-texto"><b>' + p.name + "</b><small>" + p.exp + "</small></span>" +
      '<button type="button" class="llave' + (tied ? " atada" : "") + '" role="switch" aria-checked="' + on + '" aria-label="' + p.name + '" data-perm="' + p.id + '"></button>' +
      (tied ? '<p class="porque pino"><i class="i i-s" data-i="lock"></i>Va incluido en ' + R.tiedBy(r) + ".</p>" : "") +
      (w ? '<p class="porque error"><i class="i i-s" data-i="circle-alert"></i>' + warn.msg + "</p>" : "") + "</div>";
  }
  function head(r) {
    if (editing) {
      var bad = warn && warn.kind === "name";
      return '<form class="ficha-editar" id="editar" novalidate>' +
        '<div class="campo-real' + (bad ? " mal" : "") + '"><label for="ed-nombre">Nombre del rol</label><input id="ed-nombre" value="' + R.esc(editing.name) + '" autocomplete="off">' +
        (bad ? '<p class="porque error"><i class="i i-s" data-i="circle-alert"></i>' + warn.msg + "</p>" : "") + "</div>" +
        '<div class="campo-real"><label for="ed-desc">Descripción <span class="opcional">(si querés)</span></label><textarea id="ed-desc" rows="3" maxlength="' + R.DESC_MAX + '">' + R.esc(editing.desc) + '</textarea>' +
        '<div class="campo-pie"><span class="largo">Se ve debajo del nombre en la lista de roles.</span><span class="contador" id="ed-desc-n">' + editing.desc.length + "/" + R.DESC_MAX + "</span></div></div>" +
        '<div class="ficha-editar-pie"><button type="button" class="btn" id="ed-cancelar">Cancelar <span class="kbd">Esc</span></button><button type="submit" class="btn btn-oscuro">Guardar <span class="kbd">Enter</span></button></div></form>';
    }
    return '<div class="ficha-nombre"><h2 class="t-seccion">' + R.esc(r.name) + '</h2><button type="button" class="btn lapiz" id="btn-ren" aria-label="Cambiar el nombre y la descripción" title="Cambiar el nombre y la descripción"><i class="i i-s" data-i="pencil"></i><span class="kbd">R</span></button></div>' +
      (r.desc ? '<p class="ficha-desc">' + R.esc(r.desc) + "</p>" : "") +
      '<p class="t-detalle ficha-cuenta">' + R.permsCount(r.perms.length) + " · " + R.peopleCount(r) + "</p>";
  }
  function drawCard(animate) {
    var r = R.role(sel);
    if (!r) { ficha.innerHTML = ""; return; }
    var del = R.whyNotDelete(r);
    var h = '<div class="ficha-in' + (animate ? " fundido" : "") + '">' +
      '<button type="button" class="ficha-volver" id="volver"><i class="i" data-i="chevron-left"></i>Roles</button>' +
      '<header class="ficha-cab"><span class="escudo grande"><i class="i" data-i="' + (r.fixed ? "shield-check" : "shield") + '"></i></span><div class="ficha-quien">' + head(r) + "</div></header>" +
      '<section class="sec" aria-labelledby="sec-perm"><div class="sec-cab"><h3 class="sec-titulo" id="sec-perm">Qué deja hacer</h3></div>' +
      R.PARTS.map(function (part) {
        var ps = R.permsOf(part.id);
        return '<div class="parte-caja"><div class="parte-cab"><span class="parte-ic"><i class="i" data-i="' + part.icon + '"></i></span><span class="parte-nombre"><b>' + part.name + "</b><small>" + part.exp + '</small></span><span class="parte-cuenta">' + R.countIn(r, part.id) + " de " + ps.length + "</span></div>" +
          '<div class="parte-permisos">' + ps.map(function (p) { return permRow(r, p); }).join("") + "</div></div>";
      }).join("") +
      '<p class="porque"><i class="i i-s" data-i="info"></i>' +
      (R.isPhone() ? "Vale enseguida para quien lo tiene." : "Vale enseguida para " + (r.people.length ? (r.people.length === 1 ? "la persona que lo tiene" : "las " + r.people.length + " personas que lo tienen") : "quien lo tenga") + ", desde su próximo pedido.") + "</p></section>" +
      '<section class="sec" aria-labelledby="sec-gente"><div class="sec-cab"><h3 class="sec-titulo" id="sec-gente">Quiénes lo tienen<span class="t-detalle">' + r.people.length + '</span></h3><button type="button" class="btn chico" id="btn-dar"><i class="i i-s" data-i="user-plus"></i><span class="largo">Darle este rol</span><span class="corto">Darlo</span> <span class="kbd">G</span></button></div>' +
      (r.people.length ? r.people.map(function (pid) {
        var w = warn && warn.kind === "person" && warn.key === pid;
        return '<div class="gente' + (w ? " no" : "") + '" data-p="' + pid + '">' + R.cara(pid, "g") + "<span><b>" + R.PEOPLE[pid].name + "</b>" + (R.PEOPLE[pid].me ? '<span class="pastilla vos">Vos</span>' : "") + "</span>" +
          '<button type="button" class="btn btn-fantasma chico" data-quitar="' + pid + '" aria-label="Sacarle el rol a ' + R.PEOPLE[pid].name + '"><span class="largo">Sacárselo</span><i class="i corto" data-i="x"></i></button>' +
          (w ? '<p class="porque error"><i class="i i-s" data-i="circle-alert"></i>' + warn.msg + "</p>" : "") + "</div>";
      }).join("") : '<p class="porque"><i class="i i-s" data-i="info"></i>Nadie lo tiene todavía.</p>') +
      "</section>" +
      '<footer class="pie-ficha"><button type="button" class="btn" id="btn-dup"><i class="i i-s" data-i="copy"></i>Duplicar <span class="kbd">D</span></button>' +
      '<button type="button" class="btn btn-peligro" id="btn-borrar"' + (del ? " disabled" : "") + '><i class="i i-s" data-i="trash-2"></i>Borrar <span class="kbd">B</span></button>' +
      (del ? '<p class="porque"><i class="i i-s" data-i="info"></i>' + del + "</p>" : "") +
      '<p class="ultimo"><i class="i i-s" data-i="history"></i>' + r.last + "</p></footer></div>";
    ficha.innerHTML = h; R.icons(ficha);
    if (editing && !R.isPhone()) { var i = document.getElementById("ed-nombre"); i.focus(); i.select(); }
    var w = ficha.querySelector(".no"); if (w) w.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function redraw(entering, animateCard) { drawQp(); drawList(entering); drawCard(animateCard); }

  function choose(id) {
    sel = id; editing = false; warn = null; drawList(); drawCard(true);
    if (R.isPhone()) requestAnimationFrame(function () { ficha.classList.add("abierta"); ficha.scrollTop = 0; });
  }
  function closePage() { ficha.classList.remove("abierta"); editing = false; warn = null; }
  function nope() { if (R.isPhone() && navigator.vibrate) try { navigator.vibrate([20, 30, 20]); } catch (x) {} }

  lista.addEventListener("click", function (e) { var f = e.target.closest(".fila"); if (f) choose(f.dataset.id); });
  lista.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    var i = R.roles.indexOf(R.role(sel)) + (e.key === "ArrowDown" ? 1 : -1);
    if (i < 0 || i >= R.roles.length) return;
    choose(R.roles[i].id);
    lista.querySelector('[data-id="' + sel + '"]').focus();
  });

  function startEdit() { var r = R.role(sel); if (!r) return; editing = { name: r.name, desc: r.desc || "" }; warn = null; drawCard(); }
  function cancelEdit() { editing = false; warn = null; drawCard(); }
  function saveEdit() {
    var r = R.role(sel), name = document.getElementById("ed-nombre").value.trim(), desc = document.getElementById("ed-desc").value.trim();
    editing = { name: name, desc: desc };
    var why = R.whyNotName(name, r);
    if (why) { warn = { kind: "name", msg: why }; drawCard(); nope(); return; }
    var before = { name: r.name, desc: r.desc };
    if (before.name === name && before.desc === desc) { cancelEdit(); return; }
    r.name = name; r.desc = desc; editing = false; warn = null; redraw();
    var msg = before.name !== name ? "«" + before.name + "» ahora se llama «" + name + "»" : "Cambiaste la descripción de «" + name + "»";
    R.toast(msg, function () { r.name = before.name; r.desc = before.desc; redraw(); });
  }

  ficha.addEventListener("click", function (e) {
    var r = R.role(sel), t;
    if (e.target.closest("#volver")) { closePage(); return; }
    if ((t = e.target.closest("[data-perm]"))) {
      var pid = t.dataset.perm;
      if (R.has(r, pid)) {
        var why = R.whyNotRemove(r, pid);
        if (why) { warn = { kind: "perm", key: pid, msg: why }; drawCard(); nope(); return; }
        R.toggle(r, pid); warn = null; redraw();
        R.toast(r.name + " ya no puede «" + R.perm(pid).name + "»", function () { R.toggle(r, pid); redraw(); });
      } else {
        R.reauth("Sumarle «" + R.perm(pid).name + "» a " + r.name, function () {
          R.toggle(r, pid); warn = null; redraw();
          R.toast(r.name + " ahora puede «" + R.perm(pid).name + "»", function () { R.toggle(r, pid); redraw(); });
        });
      }
    } else if (e.target.closest("#btn-ren")) startEdit();
    else if (e.target.closest("#ed-cancelar")) cancelEdit();
    else if ((t = e.target.closest("[data-quitar]"))) {
      var p = t.dataset.quitar, why2 = R.whyNotUnassign(r, p);
      if (why2) { warn = { kind: "person", key: p, msg: why2 }; drawCard(); nope(); return; }
      t.closest(".gente").classList.add("sale");
      setTimeout(function () {
        r.people.splice(r.people.indexOf(p), 1); warn = null; redraw();
        R.toast("Le sacaste «" + r.name + "» a " + R.first(p), function () { r.people.push(p); redraw(); });
      }, 200);
    }
    else if (e.target.closest("#btn-dar")) openGive();
    else if (e.target.closest("#btn-dup")) openCreate(r);
    else if (e.target.closest("#btn-borrar")) openDelete();
  });
  ficha.addEventListener("submit", function (e) { e.preventDefault(); saveEdit(); });
  ficha.addEventListener("input", function (e) { if (e.target.id === "ed-desc") document.getElementById("ed-desc-n").textContent = e.target.value.length + "/" + R.DESC_MAX; });
  ficha.addEventListener("keydown", function (e) {
    if (!editing) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancelEdit(); }
    if (e.key === "Enter" && e.target.id === "ed-desc") { e.preventDefault(); saveEdit(); }
  });

  // Celular: volver deslizando desde el borde izquierdo
  var sx = null;
  ficha.addEventListener("touchstart", function (e) { var x = e.touches[0].clientX; sx = x < 24 ? x : null; }, { passive: true });
  ficha.addEventListener("touchend", function (e) { if (sx !== null && e.changedTouches[0].clientX - sx > 80) closePage(); sx = null; });

  /* ================= Crear o duplicar un rol: nada se guarda hasta «Crear el rol» (R7.3, E38) ================= */
  var draft = null, partOpen = {};
  var nombre = document.getElementById("nombre"), desc = document.getElementById("desc");
  function openCreate(from) {
    draft = { perms: from ? from.perms.slice() : [] };
    partOpen = {}; R.PARTS.forEach(function (p) { partOpen[p.id] = true; });
    var title = from ? "Duplicar «" + from.name + "»" : "Nuevo rol";
    document.getElementById("crear-titulo").textContent = title;
    document.getElementById("miga-actual").textContent = title;
    document.getElementById("crear-sub").innerHTML = from
      ? '<span class="largo">Un rol nuevo con sus mismos permisos, para cambiarle lo que haga falta. No se guarda hasta que lo creás.</span><span class="corto">Con sus mismos permisos. No se guarda hasta crearlo.</span>'
      : '<span class="largo">Un nombre, para quién es y lo que deja hacer. Después se lo das a las personas.</span><span class="corto">El nombre, para quién es y lo que deja hacer.</span>';
    nombre.value = from ? from.name + " (copia)" : "";
    desc.value = from ? (from.desc || "") : "";
    document.getElementById("nombre-err").hidden = true; document.getElementById("c-nombre").classList.remove("mal");
    document.getElementById("perms-err").hidden = true;
    drawDraft(); drawPreview();
    document.body.classList.add("creando"); crear.hidden = false;
    crear.querySelector(".crear-cuerpo").scrollTop = 0;
    if (R.isPhone()) requestAnimationFrame(function () { requestAnimationFrame(function () { crear.classList.add("abierta"); }); });
    else { crear.classList.add("abierta"); setTimeout(function () { nombre.focus(); nombre.select(); }, 30); }
  }
  function closeCreate() {
    if (crear.hidden) return;
    crear.classList.remove("abierta");
    var done = function () { crear.hidden = true; document.body.classList.remove("creando"); };
    if (R.isPhone() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) setTimeout(done, 320); else done();
  }
  function drawDraft() {
    var box = document.getElementById("crear-partes");
    box.innerHTML = R.PARTS.map(function (part) {
      var ps = R.permsOf(part.id), open = partOpen[part.id];
      return '<div class="parte-caja"><button type="button" class="parte-cab" aria-expanded="' + open + '" aria-controls="pp-' + part.id + '" data-parte="' + part.id + '"><span class="parte-ic"><i class="i" data-i="' + part.icon + '"></i></span>' +
        '<span class="parte-nombre"><b>' + part.name + "</b><small>" + part.exp + '</small></span><span class="parte-cuenta">' + R.countIn(draft, part.id) + " de " + ps.length + '</span><i class="i parte-chev" data-i="chevron-up"></i><span class="kbd">U</span></button>' +
        '<div class="parte-permisos casillas" id="pp-' + part.id + '"' + (open ? "" : " hidden") + ">" + ps.map(function (p) {
          var on = R.has(draft, p.id), tied = R.tied(draft, p.id);
          return '<label class="opcion-permiso' + (tied ? " atada" : "") + '"><input type="checkbox" class="casilla" data-dp="' + p.id + '"' + (on ? " checked" : "") + (tied ? " disabled" : "") + ">" +
            "<span><b>" + p.name + "</b><small>" + p.exp + "</small></span>" +
            (tied ? '<span class="porque pino"><i class="i i-s" data-i="lock"></i>Va incluido en ' + R.tiedBy(draft) + ".</span>" : "") + "</label>";
        }).join("") + "</div></div>";
    }).join("");
    R.icons(box);
  }
  function drawPreview() {
    var n = nombre.value.trim(), d = desc.value.trim();
    var vn = document.getElementById("vp-nombre");
    vn.textContent = n || "El nombre del rol"; vn.classList.toggle("vacio", !n);
    var vd = document.getElementById("vp-desc"); vd.textContent = d; vd.hidden = !d;
    document.getElementById("desc-n").textContent = desc.value.length + "/" + R.DESC_MAX;
    var ul = document.getElementById("vp-partes");
    ul.innerHTML = R.PARTS.map(function (part) {
      var c = R.countIn(draft, part.id);
      return '<li class="vp-parte"><span class="parte-ic"><i class="i" data-i="' + part.icon + '"></i></span><span><b>' + part.name + "</b><small>" + R.permsCount(c) + '</small></span><i class="i vp-marca' + (c ? "" : " no-tiene") + '" data-i="' + (c ? "circle-check" : "circle-minus") + '"></i></li>';
    }).join("");
    R.icons(ul);
  }
  nombre.addEventListener("input", function () { document.getElementById("c-nombre").classList.remove("mal"); document.getElementById("nombre-err").hidden = true; drawPreview(); });
  desc.addEventListener("input", drawPreview);
  nombre.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); create(); } });
  document.getElementById("crear-partes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-parte]"); if (!b) return;
    partOpen[b.dataset.parte] = !partOpen[b.dataset.parte]; drawDraft();
  });
  document.getElementById("crear-partes").addEventListener("change", function (e) {
    var c = e.target.closest("[data-dp]"); if (!c) return;
    R.toggle(draft, c.dataset.dp); document.getElementById("perms-err").hidden = true;
    drawDraft(); drawPreview();
    var again = document.querySelector('[data-dp="' + c.dataset.dp + '"]'); if (again) again.focus();
  });
  crear.addEventListener("click", function (e) { if (e.target.closest("[data-cancelar]")) closeCreate(); });
  document.getElementById("crear-ok").addEventListener("click", create);
  function shake(el) { el.classList.remove("no"); void el.offsetWidth; el.classList.add("no"); }
  function create() {
    var why = R.whyNotName(nombre.value), bad = false, ne = document.getElementById("nombre-err");
    if (why) { ne.hidden = false; ne.querySelector("span").textContent = why; document.getElementById("c-nombre").classList.add("mal"); shake(document.getElementById("c-nombre")); bad = true; }
    if (!draft.perms.length) { document.getElementById("perms-err").hidden = false; shake(document.getElementById("crear-partes")); bad = true; }
    if (bad) { nope(); if (why && !R.isPhone()) nombre.focus(); return; }
    var name = nombre.value.trim(), d = desc.value.trim(), perms = draft.perms.slice();
    R.reauth("Crear el rol «" + name + "»", function () {
      var id = "r" + Date.now();
      R.roles.push({ id: id, name: name, desc: d, perms: perms, people: [], last: "Rubén Paredes lo creó · recién" });
      closeCreate();
      if (R.isPhone()) { sel = null; closePage(); } else sel = id;
      editing = false; warn = null; redraw(id, true);
      R.toast("Rol «" + name + "» creado. Dáselo a quien corresponda.");
      var f = lista.querySelector('[data-id="' + id + '"]'); if (f) f.scrollIntoView({ block: "nearest" });
    });
  }

  /* ================= Darle este rol a alguien ================= */
  var dDar = document.getElementById("d-dar"), picked = {};
  function openGive() {
    var r = R.role(sel); if (!r) return; picked = {};
    dDar.querySelector("h2 span").textContent = r.name;
    var free = Object.keys(R.PEOPLE).filter(function (p) { return r.people.indexOf(p) < 0; });
    var box = document.getElementById("d-dar-lista");
    box.innerHTML = free.length ? free.map(function (p) {
      var has = R.roles.filter(function (x) { return x.people.indexOf(p) >= 0; }).map(function (x) { return x.name; }).join(", ");
      return '<button type="button" class="gente" role="checkbox" aria-checked="false" data-pick="' + p + '">' + R.cara(p, "g") + "<span><b>" + R.PEOPLE[p].name + "</b><small>Hoy: " + has + '</small></span><span class="tilde" aria-hidden="true"><i class="i i-s" data-i="check"></i></span></button>';
    }).join("") : '<p class="porque"><i class="i i-s" data-i="info"></i>Todas las personas ya lo tienen.</p>';
    R.icons(box); document.getElementById("d-dar-ok").disabled = true; R.open(dDar);
  }
  document.getElementById("d-dar-lista").addEventListener("click", function (e) {
    var t = e.target.closest("[data-pick]"); if (!t) return;
    var p = t.dataset.pick; picked[p] = !picked[p];
    t.setAttribute("aria-checked", !!picked[p]);
    document.getElementById("d-dar-ok").disabled = !Object.keys(picked).some(function (k) { return picked[k]; });
  });
  document.getElementById("d-dar-ok").addEventListener("click", function () {
    var r = R.role(sel), ids = Object.keys(picked).filter(function (k) { return picked[k]; });
    R.close();
    R.reauth("Darle «" + r.name + "» a " + R.names(ids), function () {
      ids.forEach(function (p) { r.people.push(p); }); redraw();
      ids.forEach(function (p) { var el = ficha.querySelector('[data-p="' + p + '"]'); if (el) el.classList.add("entra", "recien"); });
      R.toast(R.names(ids) + (ids.length > 1 ? " ya tienen" : " ya tiene") + " «" + r.name + "»", function () { ids.forEach(function (p) { r.people.splice(r.people.indexOf(p), 1); }); redraw(); });
    });
  });

  /* ================= Borrar ================= */
  var dBorrar = document.getElementById("d-borrar");
  function openDelete() { var r = R.role(sel); if (!r || R.whyNotDelete(r)) return; dBorrar.querySelector("h2 span").textContent = r.name; R.open(dBorrar); }
  document.getElementById("d-borrar-ok").addEventListener("click", function () {
    var r = R.role(sel), i = R.roles.indexOf(r); R.close();
    if (R.isPhone()) closePage();
    var f = lista.querySelector('[data-id="' + r.id + '"]'); if (f) f.classList.add("sale");
    setTimeout(function () {
      R.roles.splice(i, 1); sel = R.isPhone() ? null : R.roles[Math.max(0, i - 1)].id; redraw(null, true);
      R.toast("Borraste «" + r.name + "»", function () { R.roles.splice(i, 0, r); if (!R.isPhone()) sel = r.id; redraw(r.id, true); });
    }, R.isPhone() ? 520 : 200);
  });

  /* ================= Lo que todavía no está ================= */
  document.getElementById("tab-auditoria").addEventListener("click", function () { R.toast("Auditoría · pronto. Todavía no está."); });
  document.getElementById("btn-nuevo").addEventListener("click", function () { openCreate(null); });

  /* ================= Teclas (computadora): Alt + letra; valen solo las de lo que se ve (00 · R2.8, R2.10) ================= */
  function frameKey(k) { var el = document.querySelector('.lateral [data-key="' + k + '"]'); if (el) el.click(); }
  var KEYS_LIST = {
    o: function () { openCreate(null); }, d: function () { if (sel) openCreate(R.role(sel)); }, r: startEdit,
    g: openGive, b: function () { var b = document.getElementById("btn-borrar"); if (b && !b.disabled) openDelete(); else if (b) shake(b); },
    q: toggleCount
  };
  var KEYS_CREATE = {
    l: create, a: closeCreate,
    u: function () { var b = document.querySelector('[data-parte="usuarios"]'); if (b) b.click(); }
  };
  document.addEventListener("keydown", function (e) {
    if (R.isPhone()) return;
    if (e.key === "Escape" && !R.isOpen() && !crear.hidden && !editing) { e.preventDefault(); closeCreate(); return; }
    if (!e.altKey || R.isOpen()) return;
    var k = e.key.toLowerCase(), map = crear.hidden ? KEYS_LIST : KEYS_CREATE, f = map[k];
    if (f) { e.preventDefault(); document.body.classList.remove("alt"); f(); return; }
    if ("vcpnmezs".indexOf(k) >= 0 && k.length === 1) { e.preventDefault(); frameKey(k); }
  });
  // Enter en un diálogo abierto toca su botón principal
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || !R.isOpen() || e.target.closest(".gente")) return;
    var d = document.querySelector(".dialogo.abierto"); if (!d || d.id === "reauth") return;
    var ok = d.querySelector(".btn-accion, .btn-rojo"); if (ok && !ok.disabled) { e.preventDefault(); ok.click(); }
  });

  redraw();
  window.addEventListener("resize", function () { if (!R.isPhone() && !sel) sel = R.roles[0].id; redraw(); });
})();
