import type { ParsedLink } from './types';

type Msg = Record<string, any>;

export type IncomingKind =
  | 'ready' | 'play' | 'pause' | 'time' | 'duration' | 'ended';

/**
 * Описание postMessage-протокола чужого iframe-плеера.
 * VK сюда НЕ входит — у него официальный SDK, см. client/src/lib/vkAdapter.ts.
 */
export interface Protocol {
  origin: string;
  buildSrc: (l: ParsedLink) => string;
  out: { play: () => Msg; pause: () => Msg; seek: (t: number) => Msg };
  in: Record<string, IncomingKind>;
  readTime?: (m: Msg) => number | null;
  readDuration?: (m: Msg) => number | null;
}

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** ⚠️ Имена сообщений сверить с докой Rutube embed API — правки только здесь. */
export const RUTUBE_PROTOCOL: Protocol = {
  origin: 'https://rutube.ru',
  buildSrc: (l) =>
    `https://rutube.ru/play/embed/${l.videoId}/${l.params.p ? `?p=${encodeURIComponent(l.params.p)}` : ''}`,
  out: {
    play:  () => ({ type: 'player:play', data: {} }),
    pause: () => ({ type: 'player:pause', data: {} }),
    seek:  (t) => ({ type: 'player:setCurrentTime', data: { time: t } }),
  },
  in: {
    'player:ready': 'ready',
    'player:play': 'play',
    'player:pause': 'pause',
    'player:currentTime': 'time',
    'player:duration': 'duration',
    'player:ended': 'ended',
  },
  readTime: (m) => num(m.data?.time ?? m.data?.currentTime),
  readDuration: (m) => num(m.data?.duration),
};
