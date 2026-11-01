/* Roles · maqueta final: la pestaña Roles (la lista y la pantalla del rol). La usan la computadora
   y el celular, cada uno con su HTML y su disposición; <body data-device="…"> dice cuál es.
   Las reglas están en roles-model.js; acá solo se muestra y se reacciona.
   Movimiento: solo transform y opacity; con «reducir movimiento», common.css lo apaga. */
(function () {
  var M = window.RolesModel;
  var desktop = document.body.getAttribute("data-device") === "desktop";
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var ico = function (n, c) { return '<i class="i ' + (c || "") + '" data-i="' + n + '"></i>'; };
  var esc = M.esc;

  var draft = null;          // el rol que se está armando (null: se ve la lista)
  var showErrors = false;    // los errores se ven recién al intentar guardar
  var openGroups = {};       // grupos de permisos desplegados
  var arrivingPerson = null; // la persona recién sumada, para que entre con su animación
  var ignorePop = false;

  function paint(el) { if (window.pintarIconos) window.pintarIconos(el || document.body); }
  /* Vibra solo en el celular y después de que la persona tocó algo (si no, Chrome lo bloquea). */
  function vibrate(p) {
    if (desktop || !UI.vibrar) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    UI.vibrar(p);
  }
  function avatar(p, extra) { return '<span class="avatar tone-' + p.tone + " " + (extra || "") + '" title="' + esc(M.display(p)) + '">' + M.initials(p) + "</span>"; }
  function dialogOpen() { return !!$(".dialogo.abierto, .hoja.abierta"); }

  /* ================= La lista de roles (R7.12) ================= */
  function holdersText(n) { return n === 0 ? "Nadie lo tiene" : n === 1 ? "Lo tiene 1 persona" : "Lo tienen " + n + " personas"; }
  function stack(ids) {
    if (!ids.length) return "";
    var max = desktop ? 4 : ids.length > 2 ? 1 : 2; // en el celular, como mucho dos círculos, para que entre
    var h = ids.slice(0, max).map(function (id) { return avatar(M.person(id)); }).join("");
    if (ids.length > max) h += '<span class="avatar avatar-more">+' + (ids.length - max) + "</span>";
    return '<span class="avatar-stack">' + h + "</span>";
  }
  function roleRow(r, arriving) {
    var h = M.holders(r);
    return '<button type="button" class="role-row' + (arriving ? " is-arriving" : "") + '" data-role="' + r.id + '" data-mark>' +
      '<span class="role-icon">' + ico(r.icon) + "</span>" +
      '<span class="role-row-main"><span class="role-row-name">' + esc(r.name) + "</span>" +
      (r.description ? '<span class="role-row-description">' + esc(r.description) + "</span>" : "") + "</span>" +
      (desktop ?
        '<span class="role-row-perms">' + ico("key-round", "i-s") + M.plural(r.perms.length, "permiso", "permisos") + "</span>" +
        '<span class="role-row-holders' + (h.length ? "" : " is-empty") + '">' + stack(h) + "<span>" + holdersText(h.length) + "</span></span>" :
        // En el celular, los números en grande, cada uno en su recuadro (pedido de Carlos).
        '<span class="role-row-stats">' +
          '<span class="role-stat">' + ico("key-round") + "<b>" + r.perms.length + "</b><span>" + (r.perms.length === 1 ? "permiso" : "permisos") + "</span></span>" +
          '<span class="role-stat' + (h.length ? "" : " is-empty") + '">' + (h.length ? stack(h) + "<b>" + h.length + "</b><span>" + (h.length === 1 ? "persona" : "personas") + "</span>" : ico("users") + "<span>Nadie lo tiene</span>") + "</span>" +
        "</span>") +
      ico("chevron-right", "role-row-arrow") + "</button>";
  }
  function renderList(arrivingId) {
    var text = $("#role-search").value;
    var found = M.search(text);
    $("#role-search-clear").hidden = !text;
    var rows = $("#role-rows");
    if (!found.length) {
      rows.innerHTML = '<div class="role-empty">' + ico("search", "i-xl") +
        '<span class="role-empty-title">Ningún rol coincide con «' + esc(text.trim()) + "».</span>" +
        "<span>Se busca por el nombre o la descripción del rol, sus permisos y quienes lo tienen.</span>" +
        '<button type="button" class="btn" id="create-from-search" data-mark>' + ico("plus", "i-s") + "Crear el rol «" + esc(text.trim()) + "»</button></div>";
    } else {
      rows.innerHTML = found.map(function (r) { return roleRow(r, r.id === arrivingId); }).join("");
    }
    paint(rows);
  }

  /* ================= La pantalla del rol (R7.13) ================= */
  function openEditor(d, opts) {
    opts = opts || {};
    draft = d; showErrors = false; arrivingPerson = null; openGroups = {};
    openGroups[M.GROUPS[0].id] = true; // al abrir, solo el primer grupo desplegado (pedido de Carlos)
    $("#role-name").value = d.name;
    $("#role-description").value = d.description;
    renderEditor();
    clearMark();
    if (!(history.state && history.state.role)) history.pushState({ role: true }, "");
    document.body.classList.add("in-role");
    if (desktop) {
      $("#role-list").hidden = true;
      var ed = $("#role-editor"); ed.hidden = false; ed.classList.remove("is-view-in"); void ed.offsetWidth; ed.classList.add("is-view-in");
      $("#roles-screen").scrollTop = 0;
      setTimeout(function () { $("#role-name").focus({ preventScroll: true }); }, 30); // R2.2
    } else {
      $("#role-scroll").scrollTop = 0;
      vibrate(10);
    }
    if (opts.toast) UI.tostada(opts.toast, "copy");
  }

  function closeEditor(opts) {
    opts = opts || {};
    draft = null;
    document.body.classList.remove("in-role");
    if (!opts.fromPop && history.state && history.state.role) { ignorePop = true; history.back(); }
    renderList(opts.arrivingId);
    clearMark();
    if (desktop) {
      $("#role-editor").hidden = true;
      var l = $("#role-list"); l.hidden = false; l.classList.remove("is-view-in"); void l.offsetWidth; l.classList.add("is-view-in");
      setTimeout(function () { $("#role-search").focus({ preventScroll: true }); }, 30);
    }
    if (opts.arrivingId) {
      var row = $('[data-role="' + opts.arrivingId + '"]');
      if (row) row.scrollIntoView({ block: "nearest", behavior: M.quiet() ? "auto" : "smooth" });
    }
  }

  function renderEditor() {
    var isNew = !draft.id;
    var title = isNew ? "Crear nuevo rol" : draft.original.name;
    $("#role-title").textContent = title;
    if ($("#role-crumb-current")) $("#role-crumb-current").textContent = isNew ? "Crear rol" : draft.original.name;
    $("#save-label").textContent = isNew ? "Crear el rol" : "Guardar rol";
    $("#duplicate").hidden = isNew;
    $("#delete").hidden = isNew || draft.fixed; // Administrador no se borra (R7.4)
    if ($("#role-extra")) $("#role-extra").hidden = isNew;
    renderCount();
    renderGroups();
    renderHolders();
    renderPreview();
    renderErrors();
    renderSave();
  }

  /* «Guardar rol» arranca apagado y se enciende con el primer cambio, para llamar la atención. */
  function renderSave() { $("#save").disabled = !M.isDirty(draft); }

  function renderCount() {
    var n = $("#role-description").value.length;
    var c = $("#description-count");
    c.textContent = n + "/200";
    c.classList.toggle("is-full", n >= 200);
  }

  function renderGroups() {
    var errs = showErrors ? M.validate(draft) : null;
    $("#perm-groups").innerHTML = M.GROUPS.map(function (g) {
      var n = M.groupCount(draft, g);
      var groupError = errs && g.perms.some(function (p) { return errs.perm[p.id]; });
      var open = !!openGroups[g.id] || groupError;
      var items = g.perms.map(function (p) {
        var on = draft.perms.indexOf(p.id) >= 0;
        var tied = on ? M.tiedBy(draft, p.id) : [];
        var id = "perm-" + p.id;
        return '<label class="perm-item' + (tied.length ? " is-tied" : "") + '" for="' + id + '" data-mark>' +
          '<input type="checkbox" class="perm-check" id="' + id + '" data-perm="' + p.id + '"' + (on ? " checked" : "") + (tied.length ? " disabled" : "") + ">" +
          '<span class="perm-icon">' + ico(p.icon) + "</span>" + // cada permiso con su ícono (pedido de Carlos)
          '<span class="perm-text"><span class="perm-name">' + esc(p.name) + "</span>" +
          (desktop ? '<span class="perm-explanation">' + esc(p.exp) + "</span>" : "") +
          (tied.length ? '<span class="perm-tied">' + ico("lock", "i-s") + "<span>" + (desktop ? "Va incluido en " : "Lo incluye ") +
            M.list(tied.map(function (t) { return "«" + t.name + "»"; })) + (desktop ? ": se destilda solo si sacás " + (tied.length > 1 ? "esos" : "ese") + "." : ".") + "</span></span>" : "") +
          (errs && errs.perm[p.id] ? '<p class="field-error perm-error">' + ico("circle-alert", "i-s") + "<span>" + esc(errs.perm[p.id]) + "</span></p>" : "") +
          "</span></label>";
      }).join("");
      return '<div class="perm-group' + (groupError ? " has-error" : "") + '" data-group="' + g.id + '">' +
        '<button type="button" class="perm-group-head" aria-expanded="' + open + '" aria-controls="group-' + g.id + '" data-mark>' +
        '<span class="perm-group-icon">' + ico(g.icon) + "</span>" +
        '<span class="perm-group-text"><span class="perm-group-name">' + esc(g.name) + "</span>" + (desktop ? '<span class="perm-group-detail">' + esc(g.detail) + "</span>" : "") + "</span>" +
        '<span class="perm-group-count' + (n ? " is-some" : "") + '">' + n + " de " + g.perms.length + "</span>" +
        ico("chevron-down", "perm-group-chevron") + "</button>" +
        '<div class="perm-group-body" id="group-' + g.id + '"' + (open ? "" : " hidden") + ">" + items + "</div></div>";
    }).join("");
    paint($("#perm-groups"));
  }

  function renderHolders() {
    var errs = showErrors ? M.validate(draft) : null;
    var removed = M.removed(draft), added = M.added(draft);
    var ids = draft.original.people.filter(function (id) { return M.person(id).active; }).concat(added);
    var html = ids.map(function (id) {
      var p = M.person(id), isRemoved = removed.indexOf(id) >= 0, isAdded = added.indexOf(id) >= 0;
      var err = errs && errs.people[id];
      var cls = "holder-row" + (isRemoved ? " is-removed" : "") + (isAdded ? " is-added" : "") + (err ? " has-error" : "") + (id === arrivingPerson ? " is-arriving" : "");
      var change = isRemoved ? '<span class="holder-change">' + ico("user-minus", "i-s") + "Se lo sacás al guardar</span>"
        : isAdded ? '<span class="holder-change">' + ico("user-plus", "i-s") + "Se lo das al guardar</span>" : "";
      return '<div class="' + cls + '" data-person="' + id + '">' + avatar(p) +
        '<span class="holder-text"><span class="holder-name"><span>' + esc(M.display(p)) + "</span>" + (id === M.ME ? '<span class="pastilla accion">Vos</span>' : "") + "</span>" +
        (change || '<span class="holder-email">' + esc(p.email) + "</span>") + "</span>" +
        (isRemoved
          ? '<button type="button" class="btn btn-fantasma chico" data-undo="' + id + '" data-mark>' + ico("undo-2", "i-s") + "Deshacer</button>"
          : '<button type="button" class="btn btn-suave chico" data-take="' + id + '" data-mark>' + ico("user-minus", "i-s") + "Sacárselo</button>") +
        (err ? '<p class="field-error">' + ico("circle-alert", "i-s") + "<span>" + esc(err) + "</span></p>" : "") +
        "</div>";
    }).join("");
    $("#holders").innerHTML = html || '<p class="holders-empty">Nadie lo tiene todavía. Dáselo a alguien, o guardalo y asignalo después.</p>';
    var nActive = draft.people.filter(function (id) { return M.person(id).active; }).length;
    $("#holders-count").textContent = nActive;
    var off = draft.original.people.filter(function (id) { return !M.person(id).active; });
    var note = $("#holders-note");
    note.hidden = !off.length;
    if (off.length) note.innerHTML = ico("info", "i-s") + "<span>" + esc(M.list(off.map(function (id) { return M.display(M.person(id)); }))) +
      (off.length > 1 ? ", dadas de baja, también lo tienen" : ", dada de baja, también lo tiene") + ": no cuenta mientras esté de baja y vuelve con este rol si se la da de alta.</span>";
    paint($("#holders")); paint(note);
    arrivingPerson = null;
  }

  function renderPreview() {
    var pv = $("#role-preview");
    if (!pv) return; // solo en la computadora
    var name = $("#role-name").value.trim(), desc = $("#role-description").value.trim();
    $("#preview-lead").textContent = draft.id ? "Así va a quedar cuando lo guardes." : "Así se verá este rol una vez creado.";
    $("#preview-card").innerHTML = '<span class="role-icon">' + ico(draft.icon || "users", "i-l") + "</span>" +
      '<span class="preview-name' + (name ? "" : " is-placeholder") + '">' + esc(name || "Nombre del rol") + "</span>" +
      (desc ? '<span class="preview-description">' + esc(desc) + "</span>" : "");
    $("#preview-groups").innerHTML = M.GROUPS.map(function (g) {
      var n = M.groupCount(draft, g);
      return '<li class="preview-group"><span class="perm-group-icon">' + ico(g.icon) + "</span>" +
        '<span class="preview-group-text"><span class="preview-group-name">' + esc(g.name) + "</span><span>" + (n ? M.plural(n, "permiso", "permisos") : "Sin permisos") + "</span></span>" +
        '<span class="preview-mark' + (n ? " is-on" : "") + '">' + ico(n ? "check" : "minus", "i-s") + "</span></li>";
    }).join("");
    paint(pv);
  }

  function renderErrors() {
    var box = $("#save-error");
    if (!showErrors) { box.hidden = true; $("#name-error").hidden = true; $("#perms-error").hidden = true; $("#field-name").classList.remove("has-error"); return; }
    var e = M.validate(draft);
    $("#field-name").classList.toggle("has-error", !!e.name);
    $("#name-error").hidden = !e.name;
    $("#name-error span").textContent = e.name || "";
    $("#perms-error").hidden = !e.perms;
    $("#perms-error span").textContent = e.perms || "";
    box.hidden = !e.count;
    if (e.count) {
      var which = [];
      if (e.name) which.push("el nombre");
      if (e.perms) which.push("los permisos");
      Object.keys(e.perm).forEach(function (id) { which.push("«" + M.perm(id).name + "»"); });
      Object.keys(e.people).forEach(function (id) { which.push(id === M.ME ? "tu rol" : M.display(M.person(id))); });
      $("#save-error-text").textContent = "No se guardó nada. Corregí lo que está marcado en rojo: " + M.list(which) + ".";
    }
    if (!e.count) showErrors = false;
  }

  /* Cada cambio vuelve a mirar los errores ya mostrados, para que se apaguen al corregirlos. */
  function changed(what) {
    if (what !== "name") renderGroups();
    if (what === "people") renderHolders();
    else if (showErrors) renderHolders();
    renderPreview();
    if (showErrors) { renderGroups(); renderErrors(); }
    renderSave();
  }

  /* ---------- Guardar: todo junto, o nada (R7.13) ---------- */
  function save() {
    if (!M.isDirty(draft)) return;
    showErrors = true;
    var e = M.validate(draft);
    renderGroups(); renderHolders(); renderErrors();
    if (e.count) {
      vibrate([10, 40, 10]);
      var first = $("#role-editor .has-error, #role-editor .field-error:not([hidden])");
      if (first) first.scrollIntoView({ block: "center", behavior: M.quiet() ? "auto" : "smooth" });
      if (desktop && e.name) $("#role-name").focus({ preventScroll: true });
      return;
    }
    if (M.givesAccess(draft)) return askIdentity();
    commit();
  }
  function commit() {
    var isNew = !draft.id;
    var r = M.save(draft);
    closeEditor({ arrivingId: r.id });
    UI.tostada(isNew ? "Se creó el rol «" + esc(r.name) + "»" : "Se guardó «" + esc(r.name) + "»", "circle-check");
    vibrate([10, 40, 10]);
  }

  /* R3.8: lo que da acceso pide Google o la huella, una sola vez para todo lo que se guarda. */
  function askIdentity() {
    var what = [];
    if (!draft.id) what.push("Crear el rol «" + esc(draft.name.trim()) + "»");
    var addedPerms = draft.perms.filter(function (id) { return draft.id && draft.original.perms.indexOf(id) < 0; });
    if (addedPerms.length) what.push("Sumarle " + M.list(addedPerms.map(function (id) { return "«" + esc(M.perm(id).name) + "»"; })));
    var added = M.added(draft);
    if (added.length) what.push("Dárselo a " + esc(M.list(added.map(function (id) { return M.display(M.person(id)); }))));
    $("#identity-what").innerHTML = what.map(function (w) { return "<li>" + ico("key-round", "i-s") + "<span>" + w + "</span></li>"; }).join("");
    var ok = $("#identity-ok");
    ok.classList.remove("is-waiting"); ok.disabled = false;
    $("#identity-ok-label").textContent = desktop ? "Continuar con Google" : "Poner la huella";
    $("#identity-ok .i").outerHTML = ico(desktop ? "log-in" : "fingerprint", desktop ? "i-s" : "i-l");
    paint($("#identity"));
    UI.abrir($("#identity"));
  }
  $("#identity-ok").addEventListener("click", function () {
    var ok = this;
    ok.classList.add("is-waiting");
    $("#identity-ok-label").textContent = desktop ? "Esperando a Google…" : "Esperando la huella…";
    $("#identity-ok .i").outerHTML = ico("refresh-cw", desktop ? "i-s" : "i-l");
    paint(ok);
    setTimeout(function () { UI.cerrar(); setTimeout(commit, 120); }, 900);
  });

  /* ---------- Salir con cambios sin guardar (E64) ---------- */
  var afterDiscard = null;
  function leave(then) {
    if (draft && M.isDirty(draft)) {
      afterDiscard = then;
      $("#discard-lead").textContent = draft.id
        ? "Lo que cambiaste en «" + draft.original.name + "» no se guardó. Si descartás, queda como estaba."
        : "El rol nuevo todavía no se creó. Si descartás, no queda nada.";
      UI.abrir($("#discard"));
      return;
    }
    then();
  }
  $("#discard-ok").addEventListener("click", function () {
    var then = afterDiscard; afterDiscard = null;
    UI.cerrar();
    if (then) then();
  });
  function backToList() { closeEditor(); }

  /* ---------- «Darle este rol a…» ---------- */
  function renderGive() {
    var list = M.candidates(draft, $("#give-search").value);
    $("#give-options").innerHTML = list.map(function (p) {
      return '<button type="button" class="give-option" data-give="' + p.id + '" data-mark>' + avatar(p) +
        '<span class="holder-text"><span class="holder-name"><span>' + esc(M.display(p)) + "</span></span>" +
        '<span class="holder-email">' + esc(p.email) + "</span></span>" + ico("plus") + "</button>";
    }).join("") || '<p class="give-empty">' + ($("#give-search").value ? "Nadie activo coincide con lo que escribiste." : "Todas las personas activas ya lo tienen.") + "</p>";
    paint($("#give-options"));
  }
  function openGive() {
    $("#give-title").textContent = "Darle «" + (draft.name.trim() || "este rol") + "» a…";
    $("#give-search").value = "";
    renderGive();
    UI.abrir($("#give"));
  }
  $("#give-search").addEventListener("input", function () { clearMark(); renderGive(); });
  $("#give-options").addEventListener("click", function (e) {
    var b = e.target.closest("[data-give]"); if (!b) return;
    draft.people.push(b.getAttribute("data-give"));
    arrivingPerson = b.getAttribute("data-give");
    UI.cerrar();
    changed("people");
    vibrate(10);
  });

  /* ================= Eventos ================= */
  $("#role-search").addEventListener("input", function () { clearMark(); renderList(); });
  $("#role-search-clear").addEventListener("click", function () { $("#role-search").value = ""; renderList(); if (desktop) $("#role-search").focus(); });
  $("#new-role").addEventListener("click", function () { openEditor(M.draftFrom(null)); });
  $("#role-rows").addEventListener("click", function (e) {
    var row = e.target.closest("[data-role]");
    if (row) return openEditor(M.draftFrom(M.role(row.getAttribute("data-role"))));
    if (e.target.closest("#create-from-search")) {
      var d = M.draftFrom(null); d.name = $("#role-search").value.trim(); openEditor(d);
    }
  });

  $("#role-name").addEventListener("input", function () { draft.name = this.value; changed("name"); });
  $("#role-description").addEventListener("input", function () { draft.description = this.value; renderCount(); renderPreview(); renderSave(); });
  $("#perm-groups").addEventListener("click", function (e) {
    var head = e.target.closest(".perm-group-head");
    if (!head) return;
    var g = head.closest("[data-group]").getAttribute("data-group");
    var open = head.getAttribute("aria-expanded") !== "true";
    openGroups[g] = open;
    head.setAttribute("aria-expanded", String(open));
    var body = $("#group-" + g);
    body.hidden = !open;
    if (open) { body.classList.remove("is-opening"); void body.offsetWidth; body.classList.add("is-opening"); }
  });
  $("#perm-groups").addEventListener("change", function (e) {
    var c = e.target.closest("[data-perm]"); if (!c) return;
    M.togglePerm(draft, c.getAttribute("data-perm"));
    var keep = c.id;
    changed("perms");
    if (desktop && !markEl) { var again = document.getElementById(keep); if (again) again.focus({ preventScroll: true }); }
    vibrate(10);
  });
  $("#holders").addEventListener("click", function (e) {
    var take = e.target.closest("[data-take]"), undo = e.target.closest("[data-undo]");
    if (take) { var id = take.getAttribute("data-take"); draft.people.splice(draft.people.indexOf(id), 1); changed("people"); vibrate(10); }
    if (undo) { draft.people.push(undo.getAttribute("data-undo")); changed("people"); }
  });
  $("#give-role").addEventListener("click", openGive);
  $("#save").addEventListener("click", save);
  $("#cancel").addEventListener("click", function () { backToList(); }); // «Cancelar» deshace todo, sin preguntar (E64)
  $("#crumb-roles").addEventListener("click", function () { leave(backToList); });
  $("#duplicate").addEventListener("click", function () {
    var source = M.draftFrom(M.role(draft.id));
    leave(function () { openEditor(M.duplicateDraft(source), { toast: "Copia de «" + esc(source.name) + "»: cambiale el nombre y guardala" }); });
  });
  $("#delete").addEventListener("click", function () {
    var r = M.role(draft.id), why = M.whyNotDelete(r);
    if (why) {
      $("#save-error").hidden = false;
      $("#save-error-text").textContent = why;
      $("#save-error").scrollIntoView({ block: "nearest" });
      vibrate([10, 40, 10]);
      return;
    }
    M.remove(r);
    closeEditor();
    UI.tostada("Se borró el rol «" + esc(r.name) + "»", "trash-2");
  });

  /* La pestaña Roles, desde la pantalla de un rol, vuelve a la lista. */
  $$("[data-tab='roles']").forEach(function (t) { t.addEventListener("click", function (e) { e.preventDefault(); if (draft) leave(backToList); }); });
  /* Otra opción del menú o la pestaña Usuarios: si hay cambios, se pregunta antes (E64). */
  document.addEventListener("click", function (e) {
    if (!draft || !M.isDirty(draft)) return;
    var go = e.target.closest("[data-ir], [data-tab='users']");
    if (!go) return;
    e.preventDefault(); e.stopPropagation();
    leave(function () {
      if (go.hasAttribute("data-ir")) { draft = null; window.irAMaqueta && window.irAMaqueta(go.getAttribute("data-ir")); }
      else location.href = go.getAttribute("href");
    });
  }, true);
  /* Atrás del navegador o del celular. */
  window.addEventListener("popstate", function () {
    if (ignorePop) { ignorePop = false; return; }
    if (!draft) return;
    if (M.isDirty(draft)) {
      history.pushState({ role: true }, "");
      leave(backToList);
    } else closeEditor({ fromPop: true });
  });
  if (history.state && history.state.role) history.replaceState(null, "");

  /* Auditoría es del módulo 05: «Pronto», no se abre (00 · R1.3). */
  $$(".pestana-pronto").forEach(function (t) { t.addEventListener("click", function () { UI.tostada("Auditoría · pronto. Todavía no está.", "clock"); }); });

  /* ================= Teclado: solo en la computadora (00 · R2) ================= */
  var markEl = null;
  function clearMark() { if (markEl) markEl.classList.remove("marca-tecla"); markEl = null; }
  function setMark(el) {
    clearMark(); markEl = el; el.classList.add("marca-tecla");
    el.scrollIntoView({ block: "nearest" });
  }
  function scope() {
    var d = $(".dialogo.abierto, .hoja.abierta");
    if (d) return d;
    return draft ? $("#role-editor") : $("#role-list");
  }
  function markables() { return $$("[data-mark]", scope()).filter(function (el) { return el.offsetParent !== null && !el.hidden; }); }
  function activate(el) {
    if (el.tagName === "LABEL") { var c = el.querySelector("input"); if (c && !c.disabled) c.click(); return; }
    el.click();
  }
  var keys = {
    list: { o: "#new-role" },
    editor: { g: "#save", a: "#cancel", u: "#duplicate", b: "#delete", r: "#give-role", l: "#crumb-roles" },
    discard: { t: "#discard-ok" },
    identity: { o: "#identity-ok" },
    give: {}
  };
  if (desktop) {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Alt") { document.body.classList.add("alt"); e.preventDefault(); return; }
      var open = $(".dialogo.abierto");
      if (e.altKey && /^Key[A-Z]$/.test(e.code)) {
        var map = open ? keys[open.id] : draft ? keys.editor : keys.list;
        var sel = map && map[e.code.slice(3).toLowerCase()];
        var btn = sel && $(sel);
        if (btn && !btn.hidden && btn.offsetParent !== null) { e.preventDefault(); btn.click(); }
        return;
      }
      var t = e.target, inText = t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && t.type !== "checkbox");
      if (e.key === "/" && !inText && !draft && !open) { e.preventDefault(); $("#role-search").focus(); return; }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (t.tagName === "TEXTAREA") return;
        var items = markables(); if (!items.length) return;
        e.preventDefault();
        var i = items.indexOf(markEl);
        i = e.key === "ArrowDown" ? (i < 0 ? 0 : Math.min(items.length - 1, i + 1)) : (i <= 0 ? 0 : i - 1);
        setMark(items[i]);
        return;
      }
      if (e.key === "Enter" && !e.altKey) {
        if (markEl && document.body.contains(markEl) && scope().contains(markEl)) { e.preventDefault(); activate(markEl); return; }
        if (open && open.id === "give") {
          var only = $$("[data-give]", open); if (only.length === 1) { e.preventDefault(); only[0].click(); } return;
        }
        if (open) return;
        /* R2.6: en la caja principal y sin marca, la acción principal */
        if (!draft && t.id === "role-search") {
          e.preventDefault();
          var cfs = $("#create-from-search"); (cfs || $("#new-role")).click();
        } else if (draft && t.id === "role-name") { e.preventDefault(); save(); }
        return;
      }
      if (e.key === "Escape" && !open && markEl) { clearMark(); }
    });
    document.addEventListener("keyup", function (e) { if (e.key === "Alt") { document.body.classList.remove("alt"); e.preventDefault(); } });
    window.addEventListener("blur", function () { document.body.classList.remove("alt"); });
    document.addEventListener("mousedown", clearMark);
  }

  /* Al volver a pintar, la marca sigue en el mismo lugar si todavía existe. */
  var reMark = function () {
    if (!markEl || document.body.contains(markEl)) return;
    var key = markEl.getAttribute("for") || markEl.getAttribute("aria-controls") || markEl.getAttribute("data-take") || markEl.getAttribute("data-undo");
    markEl = null;
    if (!key) return;
    var el = $('[for="' + key + '"], [aria-controls="' + key + '"], [data-take="' + key + '"], [data-undo="' + key + '"]');
    if (el) setMark(el);
  };
  new MutationObserver(reMark).observe(document.body, { childList: true, subtree: true });

  /* Sin conexión (R2.2): la luz simula perderla y recuperarla. */
  if (desktop && UI.conexion) UI.conexion("[data-luz]", "En línea · todo enviado", "Sin conexión · 2 por enviar");

  renderList();
  if (desktop) $("#role-search").focus({ preventScroll: true });

  /* Para las capturas y para mirar un estado directo: #rol=<id> o #nuevo. */
  var h = decodeURIComponent(location.hash.slice(1));
  if (h === "nuevo") openEditor(M.draftFrom(null));
  else if (h.indexOf("rol=") === 0 && M.role(h.slice(4))) openEditor(M.draftFrom(M.role(h.slice(4))));
})();
