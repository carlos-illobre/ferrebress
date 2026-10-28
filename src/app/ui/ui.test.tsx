import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startKeyboard } from '../platform/keyboard.ts';
import { later } from '../testing/later.ts';
import { Button } from './button/Button.tsx';
import { Icon } from './icon/Icon.tsx';
import { Say } from './say/Say.tsx';
import { Sheet } from './sheet/Sheet.tsx';

describe('las piezas', () => {
  afterEach(() => vi.useRealTimers());

  it('el botón hace lo suyo al tocarlo, y lleva su tecla dentro, a la derecha', () => {
    const onPress = vi.fn();
    render(
      <Button
        doing="Entrando"
        onPress={onPress}
        look="action"
        size="large"
        icon="fingerprint"
        shortcut="h"
      >
        Entrar con la huella
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Entrar con la huella/ });
    expect(button.className).toBe('button button-action button-large');
    expect(button.lastElementChild?.outerHTML).toBe('<kbd>H</kbd>');
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('el botón común no lleva tecla ni ícono', () => {
    render(
      <Button doing="Cancelando" onPress={() => {}} closes>
        Cancelar
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button.className).toBe('button button-common');
    expect(button.querySelector('kbd, svg')).toBeNull();
    expect(button.hasAttribute('data-close')).toBe(true);
  });

  it('app-E41: si tarda más de 300 ms muestra la marca de espera y no se puede volver a tocar', async () => {
    vi.useFakeTimers();
    const onPress = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 1000)));
    render(
      <Button doing="Entrando" onPress={onPress}>
        Entrar
      </Button>,
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    await later(300);
    expect(button.hasAttribute('data-wait')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(button);
    await later(700);
    expect(onPress).toHaveBeenCalledOnce();
    expect(button.hasAttribute('data-wait')).toBe(false);
  });

  it('con la hoja abierta, el teclado solo ve lo de la hoja; tocar afuera la cierra', () => {
    const stop = startKeyboard();
    const behind = vi.fn();
    const inside = vi.fn();
    const onClose = vi.fn();
    render(
      <>
        <Button doing="x" onPress={behind} shortcut="a">
          Atrás
        </Button>
        <Sheet title="Entrar a la computadora" onClose={onClose}>
          <Button doing="y" onPress={inside} shortcut="a">
            Adentro
          </Button>
        </Sheet>
      </>,
    );
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', altKey: true }));
    expect(inside).toHaveBeenCalledOnce();
    expect(behind).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Entrar a la computadora' })).toBeTruthy();
    fireEvent.click(document.querySelector('.sheet-scrim') as Element);
    expect(onClose).toHaveBeenCalledOnce();
    stop();
  });

  it('los íconos son decorativos y tienen su tamaño', () => {
    const { container } = render(
      <>
        <Icon name="fingerprint" />
        <Icon name="menu" size="large" />
      </>,
    );
    const [first, second] = container.querySelectorAll('svg');
    expect(first?.getAttribute('aria-hidden')).toBe('true');
    expect(first?.getAttribute('class')).toBe('icon');
    expect(second?.getAttribute('class')).toBe('icon icon-large');
  });

  it('un texto lleva la forma larga y la corta, y si son iguales, una sola (la pieza de app-E18)', () => {
    const { container } = render(
      <p>
        <Say words={{ long: 'En línea · todo enviado', short: 'En línea' }} />
        <Say words={{ long: 'Salir', short: 'Salir' }} />
      </p>,
    );
    expect(container.innerHTML).toBe(
      '<p><span class="long">En línea · todo enviado</span><span class="short">En línea</span>Salir</p>',
    );
  });

  it('la hoja se cierra al deslizarla hacia abajo, no con un toque ni si se estaba desplazando', () => {
    const onClose = vi.fn();
    render(
      <Sheet title="Más" onClose={onClose}>
        <p>adentro</p>
      </Sheet>,
    );
    const sheet = screen.getByRole('dialog');
    fireEvent.pointerDown(sheet, { clientY: 100 });
    fireEvent.pointerUp(sheet, { clientY: 120 });
    fireEvent.pointerUp(sheet, { clientY: 300 });
    expect(onClose).not.toHaveBeenCalled();
    sheet.scrollTop = 40;
    fireEvent.pointerDown(sheet, { clientY: 100 });
    fireEvent.pointerUp(sheet, { clientY: 300 });
    expect(onClose).not.toHaveBeenCalled();
    sheet.scrollTop = 0;
    fireEvent.pointerDown(sheet, { clientY: 100 });
    fireEvent.pointerUp(sheet, { clientY: 200 });
    expect(onClose).toHaveBeenCalledOnce();
    expect(sheet.className).toBe('sheet');
  });
});
