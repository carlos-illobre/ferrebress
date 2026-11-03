// La pestaña Quién hizo qué en Usuarios: baja su pantalla recién al abrirla (diseño de 05, § 8), así
// no pesa en el arranque ni en la pantalla de Usuarios.
import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export function AuditLogTab() {
  const [screen, setScreen] = useState<{ AuditLog: ComponentType }>();
  useEffect(() => {
    void import('./screens/AuditLog.tsx').then((loaded) =>
      setScreen({ AuditLog: loaded.AuditLog }),
    );
  }, []);
  return screen ? <screen.AuditLog /> : null;
}
