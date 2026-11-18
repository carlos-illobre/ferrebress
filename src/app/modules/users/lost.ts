// «Se perdió un celular» sin HTML (R5.7): de quién es, cuál de sus celulares (si tiene uno solo, ya
// está elegido) y «Cortar», que cierra sus sesiones ahí y le quita la huella, sin confirmación.
import type { LostPhone, LostPhonesResponse } from '@ferrebress/shared/contracts/users';
import { useEffect, useState } from 'preact/hooks';
import { cutPhone } from '../sign-in/index.ts';
import { usersApi } from './api.ts';
import { deviceOf, nowMs, sinceOf } from './logic.ts';
import { refused } from './refusals.ts';
import type { Users } from './state.ts';
import { somethingFailed, dialogTexts as t } from './texts.ts';

export type Owner = LostPhonesResponse['people'][number];

async function cut(users: Users, owner: Owner, phoneId: string) {
  const phone = owner.phones.find((one) => one.id === phoneId) as LostPhone;
  const device = deviceOf(phone);
  await cutPhone(
    { userId: owner.userId },
    { key: phoneId, how: 'lost', said: { device, owner: owner.displayName } },
    {
      refuse: (result) => {
        users.close();
        refused(users, result);
      },
      update: async ({ sessions, passkey }) => {
        users.close();
        if (!sessions && !passkey) return;
        users.recount(owner.userId, sessions, passkey ? 1 : 0);
        if (users.selected === owner.userId) await users.loadAccess(owner.userId);
      },
    },
  );
}

const leadOf = (people: Owner[] | 'failed' | undefined) =>
  people === 'failed' ? somethingFailed : people?.length === 0 ? t.lostNobody : t.lostWhoLead;

function titleOf(owner: Owner | undefined) {
  if (!owner) return t.lostWho;
  return owner.phones.length === 1 ? t.lostOne(owner.displayName) : t.lostWhich(owner.displayName);
}

export function useLost(users: Users) {
  // `failed`: no se pudo preguntar; vacío: nadie tiene celulares para cortar.
  // local: lo que trae el servidor.
  const [people, setPeople] = useState<Owner[] | 'failed'>();
  // local: cortar un celular se elige y se confirma en el dispositivo que lo hace.
  const [owner, setOwner] = useState<Owner>();
  // local: como la persona, el celular se elige en el dispositivo que lo corta.
  const [chosen, setChosen] = useState<string>();
  useEffect(() => {
    void usersApi
      .lostPhones()
      .then((result) => setPeople(result.ok ? result.data.people : 'failed'));
  }, []);
  const owners = Array.isArray(people) ? people : [];
  return {
    people: owners,
    // Cada una con cómo se nombra (la propia, «Vos») y cuántos celulares tiene.
    owners: owners.map((one) => ({
      owner: one,
      name: one.self ? t.lostYou(one.displayName) : one.displayName,
      phones: t.phonesOf(one.phones.length),
    })),
    owner,
    chosen,
    title: titleOf(owner),
    lead: owner ? t.lostLead : leadOf(people),
    // Los celulares de la elegida, cada uno con su nombre y lo que se sabe de él.
    phones: (owner?.phones ?? []).map((phone) => ({
      id: phone.id,
      device: deviceOf(phone),
      detail: [
        phone.sessions > 0 && t.openSessions(phone.sessions),
        phone.passkey && t.withPasskey,
        phone.lastUsedAt !== null && t.usedAgo(sinceOf(phone.lastUsedAt, nowMs())),
      ]
        .filter(Boolean)
        .join(' · '),
    })),
    choose(picked: Owner) {
      setOwner(picked);
      setChosen(picked.phones.length === 1 ? picked.phones[0]?.id : undefined);
    },
    pick: setChosen,
    cut: () => cut(users, owner as Owner, chosen as string),
  };
}
