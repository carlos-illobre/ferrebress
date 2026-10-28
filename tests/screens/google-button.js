// El botón de Google de las pruebas de captura: con la forma del de verdad (azul, redondeado, la G
// en un círculo blanco y «Continuar con Google»), para que la captura de referencia muestre la
// entrada como se ve. Siempre igual. Tocarlo devuelve un pase de prueba, como Google al elegir la
// cuenta: así las pruebas de toques comprueban que el toque le llega.
let callback = () => {};
window.google = {
  accounts: {
    id: {
      initialize(options) {
        callback = options.callback;
      },
      disableAutoSelect() {},
      renderButton(element, options) {
        const button = document.createElement('div');
        button.setAttribute('role', 'button');
        // El tema blanco (`outline`) es el de la entrada oscura del celular.
        const white = options.theme === 'outline';
        button.style.cssText = `box-sizing:border-box;display:flex;align-items:center;width:${options.width}px;height:40px;padding:2px;border-radius:20px;background:${white ? '#fff' : '#1a73e8'};color:${white ? '#1f1f1f' : '#fff'};box-shadow:${white ? 'inset 0 0 0 1px #dadce0' : 'none'};font:500 14px/1 Arial,sans-serif;letter-spacing:0.25px`;
        const g = document.createElement('span');
        g.style.cssText =
          'display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:#fff;color:#4285f4;font:700 18px/1 Arial,sans-serif';
        g.textContent = 'G';
        const label = document.createElement('span');
        label.style.cssText = 'flex:1;text-align:center;padding-right:36px';
        label.textContent = 'Continuar con Google';
        button.append(g, label);
        button.addEventListener('click', () => callback({ credential: 'pase-de-prueba' }));
        element.replaceChildren(button);
        // El marco del botón personalizado de Google, vacío: avisa que cargó, como el de verdad.
        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        setTimeout(() => {
          element.append(frame);
          setTimeout(() => {
            frame.src = 'about:blank?cargado';
          }, 0);
        }, 0);
      },
    },
  },
};
