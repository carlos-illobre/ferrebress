/* La ruta dibujada: los dos dispositivos y cómo se hablan (variantes 1 y 2). */
(function () {
  var MID = { sin: "plus", directo: "wifi", servidor: "cloud", desconectado: "unplug", esperando: "clock", sininternet: "wifi-off" };
  window.V.route = function (s, opts) {
    opts = opts || {};
    var phone = V.isPhone;
    var me = phone ? { i: "smartphone", t: "Este celular" } : { i: "monitor", t: "Esta compu" };
    var other = phone ? { i: "monitor", t: s === "sin" ? "Sin compu" : V.FACTS.con } : { i: "smartphone", t: s === "sin" ? "Sin celular" : V.FACTS.con };
    var lat = V.ROUTE[s] ? '<span class="lat">' + V.ROUTE[s].ms + " ms</span>" : "";
    return '<div class="ruta" data-s="' + s + '">' +
      '<div class="nodo yo"><span class="nodo-ico"><i class="i i-l" data-i="' + me.i + '"></i></span><small>' + me.t + "</small></div>" +
      '<div class="tramo">' + (opts.lat === false ? "" : lat) + '<span class="cable"></span><span class="cable b"></span><span class="pulsos"><i></i><i></i><i></i></span><span class="medio"><i class="i" data-i="' + MID[s] + '"></i></span></div>' +
      '<div class="nodo otro"><span class="nodo-ico"><i class="i i-l" data-i="' + other.i + '"></i></span><small>' + other.t + "</small></div>" +
      "</div>";
  };
  /* El largo del tramo, para que los toques lleguen justo a la otra punta */
  window.V.fitRoute = function (root) {
    (root || document).querySelectorAll(".tramo").forEach(function (t) { t.style.setProperty("--largo", (t.offsetWidth - 7) + "px"); });
  };
})();
