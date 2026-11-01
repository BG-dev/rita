import { useEffect, useRef, useState } from 'react';
import { createAdapter } from '../lib/createAdapter';
import { vkSrc } from '@shared/link';
import { RUTUBE_PROTOCOL } from '@shared/protocol';
import type { PlayerAdapter } from '../lib/adapter';
import type { ParsedLink } from '@shared/types';

export function Player({ link, attach }: { link: ParsedLink; attach: (a: PlayerAdapter) => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const src = link.provider === 'vk' ? vkSrc(link) : RUTUBE_PROTOCOL.buildSrc(link);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setReady(false);
    setError(false);

    const a = createAdapter(link.provider, el);
    a.on('ready', () => setReady(true));
    a.on('error', () => setError(true));
    attach(a);
    a.init?.().catch(() => setError(true));

    return () => a.destroy();
  }, [link.provider, link.videoId, link.params.hash, link.params.p, attach]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe
        ref={ref}
        src={src}
        className="h-full w-full"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture;"
        allowFullScreen
        title="video"
      />
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/85 text-sm text-red-300">
          Плеер не загрузился. Проверьте хеш доступа или обновите страницу.
        </div>
      )}
      {!ready && !error && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 text-sm text-white/60">
          Загружаем плеер…
        </div>
      )}
    </div>
  );
}
