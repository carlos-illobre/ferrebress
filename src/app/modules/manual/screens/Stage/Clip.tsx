// El clip de una tarea (00 · R6.5, E38): un video mudo de la aplicación, que se baja y arranca recién
// cuando se toca «Ver el clip», con su último cuadro de imagen de espera. Al terminar se puede ver
// otra vez (también con Alt V, como «Ver el clip»). Con «reducir movimiento», solo el último cuadro.
import { useEffect, useRef, useState } from 'preact/hooks';
import { mediaUrl } from '../../files/api.ts';
import { texts } from '../../texts.ts';
import { Glyph } from '../Glyph/Glyph.tsx';
import './Clip.css';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Clip({ name }: { name: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const poster = mediaUrl(`${name}.end.webp`);
  const play = () => {
    setEnded(false);
    void video.current?.play().catch(() => setEnded(true));
  };
  useEffect(play, []);
  if (still())
    return (
      <div class="manual-clip">
        <img src={poster} alt={texts.clipTitle} />
      </div>
    );
  return (
    <div class="manual-clip">
      <video
        ref={video}
        src={mediaUrl(`${name}.webm`)}
        poster={poster}
        muted
        playsInline
        preload="none"
        onEnded={() => setEnded(true)}
        aria-label={texts.clipTitle}
      />
      {ended && (
        <button type="button" class="manual-clip-play" data-key="v" onClick={play}>
          <span class="manual-clip-button">
            <Glyph name="play" size="large" />
          </span>
          <span>
            <b>{texts.clipTitle}</b>
            <small>{texts.clipDetail}</small>
          </span>
          <kbd>V</kbd>
        </button>
      )}
    </div>
  );
}
