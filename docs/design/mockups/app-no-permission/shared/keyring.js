/* Variante 3, «El llavero»: el dibujo del llavero de la persona.
   Cada permiso es una llave; la que falta es un hueco punteado en naranja.
   NP.keyring({ lost: true }) dibuja la llave que falta colgada, lista para caerse. */
(function () {
  var D = window.NP;
  D.keys = ["Vender", "Ver productos", "Ver el stock", "Trabajar sin conexión"];

  function key(cls, extra) {
    // Llave apuntando hacia abajo desde el aro (0,0)
    return '<g class="' + cls + '"' + (extra || "") + ">" +
      '<path d="M0 0 V16" stroke="#CEC8BA" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="0" cy="42" r="26" class="cuerpo"/>' +
      '<circle cx="0" cy="38" r="8" class="agujero"/>' +
      '<path d="M-7 66 H7 V180 H-7 Z" class="cuerpo"/>' +
      '<path d="M7 142 H22 V152 H7 Z M7 160 H18 V170 H7 Z" class="cuerpo"/>' +
      "</g>";
  }

  D.keyring = function (opts) {
    opts = opts || {};
    var cx = 220, cy = 60, r = 44;
    // Cada llave cuelga de un punto del aro y sale hacia afuera, como un llavero apoyado en la mesa
    function at(deg) {
      var t = deg * Math.PI / 180;
      return "translate(" + (cx + r * Math.sin(t)).toFixed(1) + " " + (cy + r * Math.cos(t)).toFixed(1) + ") rotate(" + (-deg) + ")";
    }
    var h = '<svg viewBox="0 0 440 330" class="llavero" aria-hidden="true">' +
      '<g class="balanceo">';
    [-62, -31, 31, 62].forEach(function (a, i) {
      h += '<g transform="' + at(a) + '">' + key("llave tuya", ' style="--i:' + i + '"') + "</g>";
    });
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#CEC8BA" stroke-width="9"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#fff" stroke-width="2" opacity=".3" stroke-dasharray="40 240"/>';
    // La que falta: hueco punteado, o la llave que se va a caer
    h += '<g transform="' + at(0) + '">' +
      (opts.lost ? key("llave hueco tarde") + key("llave perdida") : key("llave hueco")) + "</g>";
    h += "</g></svg>";
    return h;
  };
})();
