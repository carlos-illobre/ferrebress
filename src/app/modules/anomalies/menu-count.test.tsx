// Cuántas anomalías hay abiertas, en el menú (06 · R9.5, E47): llega en la cabecera, se ve en Más, en su
// opción (en la computadora y en el celular) y en el enlace de Administración; sin abiertas, no hay
// número. Con el permiso, la aplicación abre en Anomalías, la primera opción de Más (00 · R1.4).
import { act, fireEvent, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { navigate, route } from '../../platform/router.ts';
import { forgetFields, readFields } from '../../platform/server/fields.ts';
import { openAdministration } from '../../views/basic/administration/kit.tsx';
import { everyone, media, open } from '../../views/basic/frame/frame-test-kit.tsx';
import { setMenuCount } from '../frame/index.ts';
import { watchAnomalies } from './index.ts';

const counted = (name: RegExp) =>
  screen.getAllByRole('button', { name }).map((button) => button.textContent);

describe('las anomalías abiertas en el menú', () => {
  afterEach(() => {
    setMenuCount('anomalies', 0);
    forgetFields();
    navigate('/', { replace: true });
  });

  it('administration-E47: el número llega en la cabecera; sin la letra, no hay número', async () => {
    const stop = watchAnomalies();
    media();
    const { side } = open({ who: everyone });
    await act(() => readFields({ a: '2' }));
    const more = within(side).getByRole('button', { name: /Más/ });
    expect(more.textContent).toContain('2 para mirar');
    fireEvent.click(more);
    expect(counted(/Anomalías/).join()).toContain('2 para mirar');
    await act(() => readFields({}));
    expect(more.textContent).not.toContain('para mirar');
    await act(() => readFields({ a: 'x' }));
    expect(more.textContent).not.toContain('para mirar');
    stop();
  });

  it('en el celular, en Más y en su opción, y uno solo se dice en singular', () => {
    media({ phone: true });
    open({ who: everyone });
    act(() => setMenuCount('anomalies', 1));
    const phoneNav = screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement;
    const more = within(phoneNav).getByRole('button', { name: /Más/ });
    expect(more.textContent).toContain('1 para mirar');
    fireEvent.click(more);
    const region = screen.getByRole('region', { name: 'Más' });
    expect(within(region).getByRole('button', { name: /Anomalías/ }).textContent).toContain(
      '1 para mirar',
    );
  });

  it('app-R1.4: con «Revisar las anomalías», la aplicación abre en Anomalías', () => {
    media();
    open({ who: everyone, screens: { anomalies: () => <p>La pantalla de Anomalías</p> } });
    expect(screen.getByRole('main').textContent).toBe('La pantalla de Anomalías');
  });

  it('administration-R9.5: en Administración, el enlace a Anomalías con su número', async () => {
    setMenuCount('anomalies', 3);
    openAdministration();
    const link = await screen.findByRole('button', { name: /Anomalías/ });
    expect(link.textContent).toContain('3 para mirar');
    fireEvent.click(link);
    expect(route.get().path).toBe('/administration/anomalies');
  });
});
