// Lo mío de ejemplo para las capturas de Configuración, como en la maqueta aprobada: este dispositivo,
// un celular con sesión, huella y una computadora que entró con su código, y otro celular solo con
// huella.

const at = (iso: string) => new Date(iso).getTime();
const session = (id: string, way: 'google' | 'passkey' | 'qr', entered: string, used: string) => ({
  id,
  way,
  createdAt: at(entered),
  lastUsedAt: at(used),
});

// Este dispositivo: en el celular, con nombre, huella y la computadora que hizo entrar.
const hereOf = (isPhone: boolean) =>
  isPhone
    ? {
        deviceLabel: 'Chrome en Android',
        deviceName: 'Celu de Ana',
        isPhone: true,
        passkey: 'mine',
        since: { createdAt: at('2026-09-12T13:00:00Z'), lastUsedAt: at('2026-11-06T13:15:00Z') },
        computers: [
          {
            deviceLabel: 'Chrome en Windows',
            deviceName: 'Compu del mostrador',
            session: session(
              '0192d3a4-0000-7000-8000-000000000001',
              'qr',
              '2026-11-06T11:30:00Z',
              '2026-11-06T17:04:00Z',
            ),
          },
        ],
      }
    : { deviceLabel: 'Chrome en Windows', isPhone: false, passkey: 'none', computers: [] };

const others = [
  {
    key: '0192d3a4-0000-7000-8000-000000000010',
    deviceLabel: 'Chrome en Android',
    deviceName: 'Celu de Rubén',
    isPhone: true,
    session: session(
      '0192d3a4-0000-7000-8000-000000000011',
      'passkey',
      '2026-11-06T11:12:00Z',
      '2026-11-06T17:02:00Z',
    ),
    passkey: { createdAt: at('2026-09-12T13:00:00Z'), lastUsedAt: at('2026-11-06T13:15:00Z') },
    computers: [
      {
        deviceLabel: 'Chrome en Windows',
        deviceName: 'Caja 2',
        session: session(
          '0192d3a4-0000-7000-8000-000000000012',
          'qr',
          '2026-11-06T11:30:00Z',
          '2026-11-06T17:04:00Z',
        ),
      },
    ],
  },
  {
    key: '0192d3a4-0000-7000-8000-000000000020',
    deviceLabel: 'Chrome en Android',
    isPhone: true,
    session: null,
    passkey: { createdAt: at('2026-03-03T13:00:00Z'), lastUsedAt: at('2026-11-04T22:20:00Z') },
    computers: [],
  },
];

export const mine = (isPhone: boolean) => ({
  here: hereOf(isPhone),
  others,
  names: ['Celu de Rubén', 'Caja 2', 'Compu del mostrador'],
});
