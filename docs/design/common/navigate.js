// Navegación entre maquetas. Cada maqueta lo carga con <script src="…/common/navigate.js" defer>.
//
// - Un elemento con data-ir="<pantalla>" lleva a esa pantalla, en el mismo dispositivo. Las
//   pantallas son las carpetas de docs/design/mockups/.
// - Si una maqueta no marcó su menú, se conectan solos los elementos cuyo texto es el nombre de
//   una pantalla o de una parte del menú (Vender, Catálogo, Stock…). Si la maqueta marcó al menos
//   un data-ir, no se conecta nada solo. data-no-ir excluye un elemento.
(function () {
  var SCREENS = {
    "entrar": "sign-in", "salir": "sign-in", "cerrar sesión": "sign-in",
    "vender": "sales", "ventas de hoy": "today-sales",
    "catálogo": "products", "productos": "products",
    "listas de precios": "price-lists", "listas": "price-lists",
    "duplicados": "duplicates",
    "depósito": "stock", "stock": "stock",
    "compras": "purchases", "ingreso": "goods-receipt", "pedidos": "purchase-orders",
    "contar": "stock-count", "estanterías": "stock-count",
    "negocio": "business-overview", "resumen": "business-overview", "cómo va el negocio": "business-overview",
    "usuarios": "users", "quién hizo qué": "audit-log", "actividad": "audit-log",
    "más": "more", "anomalías": "anomalies", "sistema": "system-settings",
    "vincular": "device-link", "vincular el celular": "device-link",
    "procesos": "processes", "mejoras y errores": "tickets", "mejoras": "tickets",
    "configuración": "device-settings", "ajustes": "device-settings",
  };

  var parts = location.pathname.split("/");
  var at = parts.lastIndexOf("mockups");
  var here = at >= 0 ? parts[at + 1] : "";
  var device = parts.indexOf("phone") >= 0 ? "phone" : "desktop";

  function go(screen) {
    if (!screen || screen === here || at < 0) return;
    location.href = parts.slice(0, at + 1).join("/") + "/" + screen + "/" + device + "/v2/index.html";
  }
  window.irAMaqueta = go;

  function text(el) { return (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase(); }

  function connectByText() {
    if (document.querySelector("[data-ir]")) return;
    var candidates = document.querySelectorAll("nav a, nav button, aside a, aside button, [role=tab], .menu a, .menu button, .pestanas a, .pestanas button, .pestana, .tabs a, .tabs button, footer nav *");
    Array.prototype.forEach.call(candidates, function (el) {
      if (el.closest("[data-ir], [data-no-ir]")) return;
      var screen = SCREENS[text(el).replace(/\s*\d+$/, "")];
      if (screen) el.setAttribute("data-ir", screen);
    });
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-ir]");
    if (!el) return;
    e.preventDefault();
    go(el.getAttribute("data-ir"));
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", connectByText);
  else connectByText();
})();
