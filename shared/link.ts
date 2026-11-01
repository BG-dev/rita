import type { ParsedLink } from './types';

const RUTUBE = new Set(['rutube.ru', 'www.rutube.ru']);
const VK = new Set([
  'vk.com', 'www.vk.com', 'm.vk.com',
  'vk.ru', 'www.vk.ru', 'm.vk.ru',
  'vkvideo.ru', 'www.vkvideo.ru',
]);

export function parseLink(input: string): ParsedLink | null {
  let url: URL;
  try { url = new URL(String(input).trim()); } catch { return null; }
  const host = url.hostname.toLowerCase();
  const q = url.searchParams;

  if (RUTUBE.has(host)) {
    const m = url.pathname.match(/^\/video\/(?:private\/)?([0-9a-f]{32})/i);
    if (!m) return null;
    const params: Record<string, string> = {};
    const p = q.get('p');
    if (p) params.p = p;
    return { provider: 'rutube', videoId: m[1].toLowerCase(), params };
  }

  if (VK.has(host)) {
    if (url.pathname.includes('video_ext.php')) {
      const oid = q.get('oid');
      const id = q.get('id');
      if (!oid || !id) return null;
      const params: Record<string, string> = {};
      const h = q.get('hash');
      if (h) params.hash = h;
      return { provider: 'vk', videoId: `${oid}_${id}`, params };
    }
    const m = url.pathname.match(/^\/video(-?\d+_\d+)/);
    if (!m) return null;
    const params: Record<string, string> = {};
    const h = q.get('hash');
    if (h) params.hash = h;
    return { provider: 'vk', videoId: m[1], params };
  }

  return null;
}

/** src для iframe. js_api=1 обязателен с первого рендера — позже не добавить. */
export function vkSrc(l: ParsedLink, hd = '3'): string {
  const [oid, id] = l.videoId.split('_');
  const q = new URLSearchParams({ oid, id, hd, js_api: '1' });
  if (l.params.hash) q.set('hash', l.params.hash);
  return `https://vk.ru/video_ext.php?${q}`;
}
