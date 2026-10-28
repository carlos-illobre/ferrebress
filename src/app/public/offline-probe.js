// Prueba de una sola vez (diseño de 15, § 2): pide la huella con un desafío armado acá, como lo
// hará la aplicación sin conexión, y dice si el celular firmó. No manda nada a ningún lado.
const result = document.getElementById('result');
const network = document.getElementById('network');
const showNetwork = () => {
  network.textContent = navigator.onLine ? 'Ahora hay internet.' : 'Ahora no hay internet.';
};
showNetwork();
addEventListener('online', showNetwork);
addEventListener('offline', showNetwork);

document.getElementById('probe').addEventListener('click', async () => {
  result.textContent = 'Esperando la huella…';
  const offline = navigator.onLine ? 'con internet' : 'sin internet';
  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        userVerification: 'required',
        timeout: 60000,
      },
    });
    const flags = new Uint8Array(credential.response.authenticatorData)[32];
    const verified = (flags & 4) !== 0;
    result.textContent = verified
      ? `Firmó ${offline}, con la huella. Anda.`
      : `Firmó ${offline}, pero sin verificar la huella.`;
  } catch (error) {
    result.textContent = `No firmó ${offline}: ${error.name}. ${error.message}`;
  }
});
