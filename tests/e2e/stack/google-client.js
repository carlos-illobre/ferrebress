// El script de Google de las pruebas de punta a punta (ENVIRONMENT=e2e): hace lo mismo que el de
// verdad para la aplicación (initialize, renderButton, disableAutoSelect) y deja que la prueba le
// pase el pase firmado por el emisor de prueba, como si la persona hubiera elegido su cuenta.
window.google = {
  accounts: {
    id: {
      initialize(options) {
        window.e2eGoogle = {
          nonce: options.nonce,
          forgot: window.e2eGoogle?.forgot ?? false,
          signIn: (credential) => options.callback({ credential }),
        };
      },
      renderButton(element) {
        const button = document.createElement('div');
        button.setAttribute('role', 'button');
        button.textContent = 'Continuar con Google';
        // El marco del botón personalizado: se agrega vacío y carga cuando la aplicación ya lo mira.
        const frame = document.createElement('iframe');
        element.replaceChildren(button);
        setTimeout(() => {
          element.append(frame);
          setTimeout(() => {
            frame.src = 'about:blank?cargado';
          }, 0);
        }, 0);
      },
      disableAutoSelect() {
        window.e2eGoogle = { ...window.e2eGoogle, forgot: true };
      },
    },
  },
};
