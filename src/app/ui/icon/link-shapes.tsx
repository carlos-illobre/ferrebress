// Los íconos del vínculo con el otro dispositivo (03) que la aplicación no tenía: la ruta, los
// botones del detalle y el código. Lucide 0.460 (licencia ISC); se bajan con el detalle (addShapes).
export const linkShapes = {
  'arrow-left': (
    <>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </>
  ),
  cloud: (
    <>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </>
  ),
  unplug: (
    <>
      <path d="m19 5 3-3" /> <path d="m2 22 3-3" />{' '}
      <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />{' '}
      <path d="M7.5 13.5 10 11" /> <path d="M10.5 16.5 13 14" />{' '}
      <path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z" />
    </>
  ),
  'plug-zap': (
    <>
      <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />{' '}
      <path d="m2 22 3-3" /> <path d="M7.5 13.5 10 11" /> <path d="M10.5 16.5 13 14" />{' '}
      <path d="m18 3-4 4h6l-4 4" />
    </>
  ),
  timer: (
    <>
      <line x1="10" x2="14" y1="2" y2="2" /> <line x1="12" x2="15" y1="14" y2="11" />{' '}
      <circle cx="12" cy="14" r="8" />
    </>
  ),
  'scan-qr-code': (
    <>
      <path d="M17 12v4a1 1 0 0 1-1 1h-4" /> <path d="M17 3h2a2 2 0 0 1 2 2v2" />{' '}
      <path d="M17 8V7" /> <path d="M21 17v2a2 2 0 0 1-2 2h-2" />{' '}
      <path d="M3 7V5a2 2 0 0 1 2-2h2" /> <path d="M7 17h.01" />{' '}
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" /> <rect x="7" y="7" width="5" height="5" rx="1" />
    </>
  ),
  zap: (
    <>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </>
  ),
  'qr-code': (
    <>
      <rect width="5" height="5" x="3" y="3" rx="1" />{' '}
      <rect width="5" height="5" x="16" y="3" rx="1" />{' '}
      <rect width="5" height="5" x="3" y="16" rx="1" /> <path d="M21 16h-3a2 2 0 0 0-2 2v3" />{' '}
      <path d="M21 21v.01" /> <path d="M12 7v3a2 2 0 0 1-2 2H7" /> <path d="M3 12h.01" />{' '}
      <path d="M12 3h.01" /> <path d="M12 16v.01" /> <path d="M16 12h1" /> <path d="M21 12v.01" />{' '}
      <path d="M12 21v-1" />
    </>
  ),
  unlink: (
    <>
      <path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />{' '}
      <path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />{' '}
      <line x1="8" x2="8" y1="2" y2="5" /> <line x1="2" x2="5" y1="8" y2="8" />{' '}
      <line x1="16" x2="16" y1="19" y2="22" /> <line x1="19" x2="22" y1="16" y2="16" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 2v4" /> <path d="M16 2v4" /> <rect width="18" height="18" x="3" y="4" rx="2" />{' '}
      <path d="M3 10h18" />
    </>
  ),
  plus: (
    <>
      <path d="M5 12h14" /> <path d="M12 5v14" />
    </>
  ),
};
