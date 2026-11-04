// El diario de la conexión (diseño de 03, § 15.1): sin personas ni valores, las últimas 300, y se
// guarda al ocultarse la pestaña y cada 10 s si cambió.
import { afterEach, describe, expect, it } from 'vitest';
import { createJournal, journalSettings, keyName } from './journal.ts';

const pairing = {
  id: 'secreto',
  side: 'computer' as const,
  other: { label: 'Ana' },
  since: 0,
  lastMirrored: 0,
  expiresAt: 30 * 86_400_000,
  lastsDays: 30,
  paused: false,
};

afterEach(() => localStorage.clear());

describe('el diario', () => {
  it('anota cada paso sin el vínculo ni el nombre del otro', () => {
    const journal = createJournal({ now: () => 12.4, every: () => () => undefined });
    journal.step({ type: 'serverSaid', pairing }, { kind: 'waiting', pairing }, [
      { do: 'subscribe' },
    ]);
    journal.step(
      { type: 'serverSaid', pairing: { ...pairing, paused: true } },
      { kind: 'paused', pairing },
      [],
    );
    journal.step({ type: 'serverSaid', pairing: null }, { kind: 'unpaired' }, [], true);
    journal.step({ type: 'peerGone', why: 'lost' }, { kind: 'unpaired' }, []);
    journal.step({ type: 'tabAway', why: 'hidden' }, { kind: 'unpaired' }, []);
    journal.step({ type: 'sessionLost', samePerson: true }, { kind: 'asleep' }, []);
    journal.step({ type: 'pause', from: 'here' }, { kind: 'asleep' }, []);
    journal.step({ type: 'probeResult', attempt: 'a1', ok: false }, { kind: 'asleep' }, []);
    journal.step({ type: 'directUp', attempt: 'a1' }, { kind: 'asleep' }, []);
    journal.step({ type: 'probe' }, { kind: 'asleep' }, []);
    journal.note('unknown-message', { kind: 'hello' });
    journal.note('ice-timeout');
    const text = JSON.stringify(journal.entries());
    expect(text).not.toContain('secreto');
    expect(text).not.toContain('Ana');
    expect(journal.entries()[0]).toEqual({
      t: 12,
      e: 'serverSaid',
      p: 'yes',
      s: 'waiting',
      k: 'subscribe',
    });
    expect(
      journal
        .entries()
        .map(
          (entry) => entry.p ?? entry.w ?? entry.same ?? entry.from ?? entry.a ?? entry.kind ?? '',
        ),
    ).toEqual([
      'yes',
      'paused',
      'none',
      'lost',
      'hidden',
      true,
      'here',
      'a1',
      'a1',
      '',
      'hello',
      '',
    ]);
    expect(journal.entries()[2]?.ignored).toBe(true);
  });

  it('de una clave guarda solo el nombre', () => {
    expect(keyName('q:users.card.person:42')).toBe('q:users.card.person');
    expect(keyName('frame.route')).toBe('frame.route');
    expect(keyName('users.search:7')).toBe('users.search');
  });

  it('se queda con las últimas 300 y las guarda al ocultarse, cada tanto si cambió y al parar', () => {
    let tick: () => void = () => undefined;
    const journal = createJournal({
      every: (run) => {
        tick = run;
        return () => undefined;
      },
    });
    for (let i = 0; i < journalSettings.size + 5; i++) journal.note('n', { i });
    expect(journal.entries()).toHaveLength(journalSettings.size);
    expect(journal.entries()[0]?.i).toBe(5);
    expect(localStorage.getItem(journalSettings.key)).toBeNull();
    tick();
    expect(JSON.parse(localStorage.getItem(journalSettings.key) as string)).toHaveLength(
      journalSettings.size,
    );
    localStorage.clear();
    tick();
    expect(localStorage.getItem(journalSettings.key)).toBeNull();
    journal.note('otra');
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(localStorage.getItem(journalSettings.key)).not.toBeNull();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    journal.note('al parar');
    journal.stop();
    expect(createJournal().entries().at(-1)?.e).toBe('al parar');
  });

  it('con el intervalo de verdad, se puede parar', () => {
    const journal = createJournal();
    expect(() => journal.stop()).not.toThrow();
  });
});
