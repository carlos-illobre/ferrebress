// Los tipos de acción del vínculo entre el celular y la computadora (capítulo 03, R8) en Quién hizo
// qué. No se anotan el espejo, la pausa ni los cambios entre directo y por el servidor (R8.2).
import { type Entry, named, text } from './kinds.ts';

// Por qué terminó solo un vínculo (R2.3).
const endings: Record<string, string> = {
  expired: 'venció por no usarse',
  'session-revoked': 'se cerró desde Usuarios la sesión de uno de los dos',
  'passkey-removed': 'se le quitó la huella al celular',
  'phone-cut': 'se cortó el celular como perdido',
  deactivated: 'se dio de baja a la persona',
};

const refusals: Record<string, string> = {
  'other-account': 'Leyó el código de vincular de otra cuenta',
  'not-paired': 'Intentó usar un vínculo que no es suyo',
  'pairing-ended': 'Intentó usar un vínculo que ya terminó',
};

const phone = (e: Parameters<Entry['says']>[0]) => named(e, 'phone', 'un celular');
const computer = (e: Parameters<Entry['says']>[0]) => named(e, 'computer', 'una computadora');

export const deviceLinkTypes = {
  'device-link.paired': {
    group: 'device-link',
    tone: 'plain',
    icon: 'monitor-smartphone',
    name: 'Vinculó el celular y la computadora',
    shows: ['how'],
    says: (e) => [
      text('Vinculó '),
      phone(e),
      text(' con '),
      computer(e),
      text(e.data.how === 'sign-in' ? ', al entrar con el celular' : ''),
    ],
  },
  'device-link.replaced': {
    group: 'device-link',
    tone: 'plain',
    icon: 'refresh-cw',
    name: 'Reemplazó un vínculo',
    shows: ['how'],
    says: (e) => [
      text('Terminó el vínculo de '),
      phone(e),
      text(' con '),
      computer(e),
      text(' al vincular otro'),
    ],
  },
  'device-link.unpaired': {
    group: 'device-link',
    tone: 'plain',
    icon: 'scissors',
    name: 'Desvinculó el celular y la computadora',
    shows: ['from'],
    says: (e) => [
      text('Desvinculó '),
      phone(e),
      text(' de '),
      computer(e),
      text(e.data.from === 'phone' ? ', desde el celular' : ', desde la computadora'),
    ],
  },
  'device-link.ended': {
    group: 'device-link',
    tone: 'plain',
    icon: 'power',
    name: 'Terminó un vínculo',
    shows: ['reason'],
    says: (e) => [
      text('Terminó el vínculo de '),
      phone(e),
      text(' con '),
      computer(e),
      text(`: ${endings[String(e.data.reason)] ?? 'terminó'}`),
    ],
  },
  'device-link.rejected': {
    group: 'refused',
    tone: 'red',
    icon: 'triangle-alert',
    name: 'Intentó vincular sin poder',
    shows: ['reason', 'repeatedBefore'],
    says: (e) => [text(refusals[String(e.data.reason)] ?? 'Intentó vincular sin poder')],
  },
} satisfies Record<string, Entry>;
