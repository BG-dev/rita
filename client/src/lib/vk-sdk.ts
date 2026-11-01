let pending: Promise<void> | null = null;

/** Дедуплицированная загрузка https://vk.ru/js/api/videoplayer.js */
export function loadVkSdk(): Promise<void> {
  if ((window as any).VK?.VideoPlayer) return Promise.resolve();
  if (pending) return pending;

  pending = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://vk.ru/js/api/videoplayer.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { pending = null; reject(new Error('VK_SDK_LOAD_FAILED')); };
    document.head.appendChild(s);
  });
  return pending;
}
