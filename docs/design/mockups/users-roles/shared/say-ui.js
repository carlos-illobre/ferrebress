/* Variante 3 · Decilo: comportamiento común de la computadora y el celular.
   La página trae: #frases, #dicho (campo), #mic, #enviar, #sugerencias, #propuesta, #ve, #escucha. */
(function () {
  var R = window.ROLES, S = window.SAY, U = window.SAYUI = {};
  var phone, viewing = "enc", menu = null, demo = 0;

  function $(id) { return document.getElementById(id); }
  function vib(p) { if (navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} }

  U.draw = function (entering) {
    var box = $("frases");
    box.innerHTML = R.roles.map(function (r) {
      return '<article class="frase' + (r.id === viewing && !phone ? " vista" : "") + (r.id === entering ? " entra recien" : "") + '" data-r="' + r.id + '">' +
        '<p class="texto">' + S.sentence(r) + "</p>" +
        '<div class="frase-pie"><button class="btn btn-fantasma chico" data-ve="' + r.id + '"><i class="i i-s" data-i="eye"></i>Así lo ve</button>' +
        '<button class="btn btn-fantasma chico" data-dup="' + r.id + '"><i class="i i-s" data-i="copy"></i>Duplicar</button>' +
        (R.whyNotDelete(r) ? "" : '<button class="btn btn-fantasma chico rojo" data-del="' + r.id + '"><i class="i i-s" data-i="trash-2"></i>Borrar</button>') +
        '<span class="ult"><i class="i i-s" data-i="history"></i>' + r.last + "</span></div>" +
        '<div class="msg" hidden></div></article>';
    }).join("");
    R.icons(box);
    if (!phone) U.drawSees();
  };

  U.drawSees = function () {
    var r = R.role(viewing) || R.roles[0]; viewing = r.id;
    var el = $("ve");
    el.querySelector("[data-ve-nombre]").textContent = r.name;
    el.querySelector("[data-ve-lista]").innerHTML = S.sees(r).map(function (x) {
      return '<li class="' + (x[1] ? "si" : "no-ve") + '"><i class="i i-s" data-i="' + (x[1] ? "eye" : "eye-off") + '"></i>' + x[0] + "</li>";
    }).join("");
    var tabs = el.querySelector("[data-ve-tabs]");
    if (tabs) tabs.innerHTML = '<span class="' + (R.has(r, "ver") ? "on" : "off") + '">Usuarios</span><span class="' + (R.has(r, "roles") ? "on" : "off") + '">Roles</span>';
    R.icons(el);
    document.querySelectorAll(".frase").forEach(function (f) { f.classList.toggle("vista", f.dataset.r === viewing && !phone); });
  };

  U.openSees = function () { U.drawSees(); R.open($("ve")); };

  function say(r, msg) {
    var f = document.querySelector('.frase[data-r="' + r.id + '"] .msg'); if (!f) return;
    f.hidden = false; f.innerHTML = '<i class="i i-s" data-i="circle-alert"></i>' + msg; R.icons(f);
    f.classList.remove("no"); void f.offsetWidth; f.classList.add("no"); vib([20, 30, 20]);
    clearTimeout(f._t); f._t = setTimeout(function () { f.hidden = true; }, 4000);
  }

  /* ---- Menú de «+ algo más» y «+ alguien» ---- */
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function openMenu(anchor, items, onPick) {
    closeMenu();
    menu = document.createElement("div"); menu.className = "menu-ficha"; menu.setAttribute("role", "menu");
    menu.innerHTML = items.map(function (it, i) { return '<button role="menuitem" data-k="' + i + '">' + it.html + "</button>"; }).join("");
    (phone ? document.querySelector(".celu") : document.body).appendChild(menu); R.icons(menu);
    var a = anchor.getBoundingClientRect(), base = phone ? document.querySelector(".celu").getBoundingClientRect() : { left: 0, top: 0 };
    var left = Math.min(a.left - base.left, (phone ? 390 : window.innerWidth) - 296);
    var top = a.bottom - base.top + 6, h = items.length * 48 + 12;
    if (top + h > (phone ? 844 : window.innerHeight) - 8) top = a.top - base.top - h - 6;
    menu.style.left = Math.max(8, left) + "px"; menu.style.top = top + "px";
    menu.addEventListener("click", function (e) { var b = e.target.closest("[data-k]"); if (b) { var it = items[+b.dataset.k]; closeMenu(); onPick(it); } });
    var first = menu.querySelector("button"); if (first) first.focus({ preventScroll: true });
  }
  document.addEventListener("click", function (e) { if (menu && !e.target.closest(".menu-ficha") && !e.target.closest("[data-addperm],[data-addperson]")) closeMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu) { e.stopImmediatePropagation(); closeMenu(); } }, true);

  function act(e) {
    var el, r;
    if ((el = e.target.closest("[data-addperm]"))) {
      r = R.role(el.dataset.addperm);
      openMenu(el, R.PERMS.filter(function (p) { return !R.has(r, p.id); }).map(function (p) { return { pid: p.id, html: '<i class="i i-s" data-i="' + p.icon + '"></i><span><b>' + p.short + "</b><small>" + p.exp + "</small></span>" }; }), function (it) {
        R.reauth("Sumarle «" + R.perm(it.pid).name + "» a " + r.name, function () {
          R.toggle(r, it.pid); r.last = "Lo cambiaste recién"; U.draw();
          var f = document.querySelector('.frase[data-r="' + r.id + '"] [data-perm="' + it.pid + '"]'); if (f) f.classList.add("brota");
          R.toast(r.name + " ahora puede " + R.perm(it.pid).short, function () { R.toggle(r, it.pid); U.draw(); });
        });
      });
      return;
    }
    if ((el = e.target.closest("[data-addperson]"))) {
      r = R.role(el.dataset.addperson);
      openMenu(el, Object.keys(R.PEOPLE).filter(function (p) { return r.people.indexOf(p) < 0; }).map(function (p) { return { p: p, html: R.cara(p) + "<span><b>" + R.PEOPLE[p].name + "</b></span>" }; }), function (it) {
        R.reauth("Darle «" + r.name + "» a " + R.PEOPLE[it.p].name, function () {
          r.people.push(it.p); U.draw();
          var f = document.querySelector('.frase[data-r="' + r.id + '"] [data-person="' + it.p + '"]'); if (f) f.classList.add("brota");
          R.toast(R.first(it.p) + " ya tiene «" + r.name + "»", function () { r.people.splice(r.people.indexOf(it.p), 1); U.draw(); });
        });
      });
      return;
    }
    if ((el = e.target.closest(".ficha.perm"))) {
      r = R.role(el.dataset.role); var pid = el.dataset.perm, why = R.whyNotRemove(r, pid);
      if (why) { el.classList.remove("no"); void el.offsetWidth; el.classList.add("no"); say(r, why); return; }
      el.classList.add("se-va-ficha");
      setTimeout(function () { R.toggle(r, pid); r.last = "Lo cambiaste recién"; U.draw(); R.toast(r.name + " ya no puede " + R.perm(pid).short, function () { R.toggle(r, pid); U.draw(); }); }, 200);
      return;
    }
    if ((el = e.target.closest(".ficha.gente"))) {
      r = R.role(el.dataset.role); var p = el.dataset.person, why2 = R.whyNotUnassign(r, p);
      if (why2) { el.classList.remove("no"); void el.offsetWidth; el.classList.add("no"); say(r, why2); return; }
      el.classList.add("se-va-ficha");
      setTimeout(function () { r.people.splice(r.people.indexOf(p), 1); U.draw(); R.toast("Le sacaste «" + r.name + "» a " + R.first(p), function () { r.people.push(p); U.draw(); }); }, 200);
      return;
    }
    if ((el = e.target.closest(".quien-rol"))) { rename(el); return; }
    if ((el = e.target.closest("[data-ve]"))) { viewing = el.dataset.ve; if (phone) U.openSees(); else U.drawSees(); return; }
    if ((el = e.target.closest("[data-dup]"))) {
      r = R.role(el.dataset.dup);
      R.reauth("Duplicar «" + r.name + "»", function () {
        var id = "r" + Date.now(), name = r.name + " (copia)", i = 2;
        while (R.whyNotName(name)) name = r.name + " (copia " + i++ + ")";
        R.roles.splice(R.roles.indexOf(r) + 1, 0, { id: id, name: name, perms: r.perms.slice(), people: [], last: "Lo duplicaste recién" });
        viewing = id; U.draw(id);
        var n = document.querySelector('.frase[data-r="' + id + '"] .quien-rol'); if (n) { n.scrollIntoView({ block: "center", behavior: "smooth" }); rename(n); }
      });
      return;
    }
    if ((el = e.target.closest("[data-del]"))) {
      r = R.role(el.dataset.del); var i2 = R.roles.indexOf(r), art = el.closest(".frase");
      art.classList.add("sale");
      setTimeout(function () { R.roles.splice(i2, 1); if (viewing === r.id) viewing = R.roles[0].id; U.draw(); R.toast("Borraste «" + r.name + "»", function () { R.roles.splice(i2, 0, r); U.draw(r.id); }); }, 200);
    }
  }

  function rename(el) {
    var r = R.role(el.dataset.name);
    el.contentEditable = "true"; el.classList.add("editando"); el.focus();
    var rg = document.createRange(); rg.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(rg);
    function done(cancel) {
      el.removeEventListener("keydown", key); el.removeEventListener("blur", blur);
      var v = el.textContent.trim(), why = cancel ? null : R.whyNotName(v, r);
      el.contentEditable = "false"; el.classList.remove("editando");
      if (cancel || v === r.name) { el.textContent = r.name; return; }
      if (why) { el.textContent = r.name; say(r, why); return; }
      var before = r.name; r.name = v; r.last = "Lo renombraste recién"; U.draw();
      R.toast("«" + before + "» ahora se llama «" + v + "»", function () { r.name = before; U.draw(); });
    }
    function key(e) { if (e.key === "Enter") { e.preventDefault(); done(false); } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); done(true); } }
    function blur() { done(false); }
    el.addEventListener("keydown", key); el.addEventListener("blur", blur);
  }

  /* ---- Decir o escribir: la propuesta ---- */
  U.submit = function (text) {
    text = (text || "").trim(); if (!text) return;
    var res = S.understand(text), box = $("propuesta"), body = box.querySelector("[data-cuerpo]");
    var head = '<div class="dijiste"><i class="i i-s" data-i="message-circle"></i>«' + R.esc(text) + "»</div>";
    var h = "";
    if (res.kind === "answer" || res.kind === "none") {
      h = head + '<p class="respuesta' + (res.bad ? " mal" : "") + '">' + R.esc(res.text) + '</p><div class="pie-p"><button class="btn" data-cerrar-p>Listo</button></div>';
    } else if (res.kind === "confirm") {
      h = head + '<div class="opcion-p sola"><b>' + R.esc(res.title) + "</b>" + res.lines.map(function (l) { return "<span>" + R.esc(l) + "</span>"; }).join("") + "</div>" +
        '<div class="pie-p"><button class="btn btn-fantasma" data-cerrar-p>No, dejalo</button><button class="btn btn-accion" data-ok-p="0"><i class="i i-s" data-i="check"></i>Hacerlo</button></div>';
      U._opts = [res];
    } else {
      h = head + '<p class="respuesta">' + R.esc(res.title) + ":</p>" + res.options.map(function (o, i) {
        return '<button class="opcion-p" data-ok-p="' + i + '"><span class="tag' + (i === 0 ? " rec" : "") + '">' + (i === 0 ? "Recomendado · " : "") + o.tag + "</span><b>" + R.esc(o.title) + "</b>" + o.lines.map(function (l) { return "<span>" + R.esc(l) + "</span>"; }).join("") + '<i class="i flecha" data-i="arrow-right"></i></button>';
      }).join("") + '<div class="pie-p"><button class="btn btn-fantasma" data-cerrar-p>Ninguno</button></div>';
      U._opts = res.options;
    }
    body.innerHTML = h; R.icons(body);
    if (phone) R.open(box); else { box.hidden = false; box.classList.remove("entra"); void box.offsetWidth; box.classList.add("entra"); }
    $("dicho").value = "";
  };
  function closeProp() { var box = $("propuesta"); if (phone) R.close(); else box.hidden = true; }
  document.addEventListener("click", function (e) {
    var b;
    if (e.target.closest("[data-cerrar-p]")) { closeProp(); return; }
    if ((b = e.target.closest("[data-ok-p]"))) {
      var o = U._opts[+b.dataset.okP];
      var run = function () { var id = o.apply(); var r = R.role(id); if (r) { r.last = "Lo cambiaste recién"; viewing = id; } U.draw(id); vib([10, 40, 10]); R.toast("Hecho: " + o.title.charAt(0).toLowerCase() + o.title.slice(1)); var f = document.querySelector('.frase[data-r="' + id + '"]'); if (f) f.scrollIntoView({ block: "center", behavior: "smooth" }); };
      if (phone) R.close(); else $("propuesta").hidden = true;
      if (o.gives) setTimeout(function () { R.reauth(o.title, run); }, phone ? 260 : 0); else run();
    }
  });

  /* ---- Escuchar (simulado): ondas, la frase se escribe sola y se propone ---- */
  U.listen = function () {
    var ov = $("escucha"), txt = ov.querySelector("[data-oido]"), phrase = S.SUGGEST[demo++ % S.SUGGEST.length];
    ov.classList.add("abierto"); txt.textContent = ""; vib(10);
    var i = 0, tm = setInterval(function () {
      txt.textContent = phrase.slice(0, ++i);
      if (i >= phrase.length) { clearInterval(tm); setTimeout(function () { ov.classList.remove("abierto"); U.submit(phrase); }, 600); }
    }, 38);
    ov._stop = function () { clearInterval(tm); ov.classList.remove("abierto"); };
  };

  U.init = function (isPhone) {
    phone = isPhone;
    $("frases").addEventListener("click", act);
    $("frases").addEventListener("keydown", function (e) {
      var f = e.target.closest(".ficha, .quien-rol"); if (!f || f.isContentEditable) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f.click(); }
      if ((e.key === "Delete" || e.key === "Backspace") && f.querySelector(".x")) { e.preventDefault(); f.click(); }
    });
    $("enviar").addEventListener("click", function () { U.submit($("dicho").value); });
    $("dicho").addEventListener("keydown", function (e) { if (e.key === "Enter") U.submit(e.target.value); });
    $("mic").addEventListener("click", U.listen);
    $("escucha").addEventListener("click", function (e) { if (e.target.closest("[data-parar]")) $("escucha")._stop(); });
    $("sugerencias").innerHTML = S.SUGGEST.map(function (s) { return '<button class="sug">' + s + "</button>"; }).join("");
    $("sugerencias").addEventListener("click", function (e) { var b = e.target.closest(".sug"); if (b) U.submit(b.textContent); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && !document.activeElement.isContentEditable) { e.preventDefault(); $("dicho").focus(); }
    });
    R.keys.h = U.listen;
    U.draw();
  };
})();
