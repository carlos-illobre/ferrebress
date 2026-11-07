// El nombre que la persona le puso a un dispositivo (04 · R9), para cualquier módulo: el módulo que
// los guarda (sign-in) da cómo se sabe; la auditoría lo anota con cada acción hecha con sesión
// (diseño de 04b, § 5). Sin quien lo dé, ningún dispositivo tiene nombre.
export function createDeviceNames() {
  let nameOf: (deviceId: string) => string | undefined = () => undefined;
  return {
    provide: (given: (deviceId: string) => string | undefined) => {
      nameOf = given;
    },
    nameOf: (deviceId: string) => nameOf(deviceId),
  };
}

export type DeviceNames = ReturnType<typeof createDeviceNames>;
