import type { PlayerAdapter, Ev } from './adapter';
import { loadVkSdk } from './vk-sdk';

const DEBUG = new URLSearchParams(location.search).has('debug');
const dbg = (...a: any[]) => { if (DEBUG) console.log('[vk]', ...a); };

/**
 * Официальный VK Video Player API — https://dev.vk.com/ru/widgets/video
 *
 * Ключевое отличие от прошлой версии: anchor обновляется и в программных
 * командах, поэтому оценка позиции не «убегает» после удалённой паузы.
 * Всё, что приходит в течение programmaticUntil, считается эхом собственных
 * действий и не транслируется как пользовательское.
 */
export class VkAdapter implements PlayerAdapter {
  private sdk: any = null;
  private handlers = new Map<Ev, Set<() => void>>();
  private ready = false;
  private ad = false;
  private fractional = false;
  private anchor = { time: 0, at: Date.now(), playing: false };
  private programmaticUntil = 0;
  private seekGuardUntil = 0;
  private lastTickAt = Date.now();

  constructor(private frame: HTMLIFrameElement) {}

  async init(): Promise<void> {
    await loadVkSdk();
    const VP = (window as any).VK.VideoPlayer;
    this.sdk = new VP(this.frame);

    const on = (ev: string, fn: (st: any) => void) => {
      this.sdk.on(ev, (st: any) => { dbg('in', ev, st); fn(st); });
    };

    on('inited', (st) => { this.ready = true; this.patch(st); this.emit('ready'); });
    on('timeupdate', (st) => this.onTime(st));
    on('started', (st) => this.onPlay(st));
    on('resumed', (st) => this.onPlay(st));
    on('paused', (st) => this.onPause(st));
    on('ended', (st) => {
      this.patch(st);
      if (Date.now() >= this.programmaticUntil) this.emit('ended');
    });
    on('error', () => this.emit('error'));
    on('adStarted', () => { this.ad = true; dbg('ad started'); });
    on('adCompleted', (st) => { this.ad = false; this.patch(st); this.emit('tick'); });
  }

  private estimate(): number {
    if (this.ad) return this.anchor.time;
    const dt = (Date.now() - this.anchor.at) / 1000;
    return this.anchor.playing ? this.anchor.time + dt : this.anchor.time;
  }

  /** Единственное место, где мы доверяем плееру. */
  private patch(st: any) {
    if (!st || this.ad) return;
    const t = Number(st.time);
    if (!Number.isFinite(t)) return;
    if (t % 1 !== 0) this.fractional = true;
    this.anchor = { time: t, at: Date.now(), playing: st.state === 'playing' };
  }

  private onTime(st: any) {
    if (this.ad) return;
    const now = Date.now();
    const expected = this.estimate();
    const actual = Number(st?.time);

    // Пока играет — допускаем дрейф за время между тиками; на паузе ожидание точное.
    const tolerance = this.anchor.playing
      ? Math.max(1.2, ((now - this.lastTickAt) / 1000) * 1.5)
      : 0.75;

    const userSeek = Number.isFinite(actual)
      && now > this.seekGuardUntil
      && Math.abs(actual - expected) > tolerance;

    this.lastTickAt = now;
    this.patch(st);

    if (userSeek) {
      this.seekGuardUntil = now + 900;   // следующий тик не считаем новой перемоткой
      dbg('user seek', { expected, actual, tolerance });
      this.emit('seeked');
    }
    this.emit('tick');
  }

  private onPlay(st: any) {
    this.patch(st);
    if (Date.now() < this.programmaticUntil) { dbg('swallow echo play'); return; }
    this.emit('play');
  }

  private onPause(st: any) {
    this.patch(st);
    if (Date.now() < this.programmaticUntil) { dbg('swallow echo pause'); return; }
    this.emit('pause');
  }

  isReady() { return this.ready; }
  canControl() { return true; }
  precision() { return this.fractional ? 0.25 : 1; }
  isAdActive() { return this.ad; }

  getPlaying(): boolean | null {
    if (!this.ready || this.ad) return null;
    const s = this.sdk?.getState?.();
    if (s === 'playing') return true;
    if (s === 'paused' || s === 'ended' || s === 'unstarted') return false;
    return this.anchor.playing;   // uninited и прочее
  }

  play() {
    if (!this.sdk) return;
    const now = Date.now();
    this.programmaticUntil = now + 1000;
    this.anchor = { time: this.estimate(), at: now, playing: true };
    dbg('out play');
    this.sdk.play();
  }

  pause() {
    if (!this.sdk) return;
    const now = Date.now();
    this.programmaticUntil = now + 1000;
    this.anchor = { time: this.estimate(), at: now, playing: false };
    dbg('out pause');
    this.sdk.pause();
  }

  seekTo(sec: number) {
    if (!this.sdk) return;
    const now = Date.now();
    const t = Math.max(0, sec);
    this.programmaticUntil = now + 1000;
    this.seekGuardUntil = now + 1000;
    // playing сохраняем: если сервер хочет паузу, reconcile добьёт её в этом же тике.
    this.anchor = { time: t, at: now, playing: this.anchor.playing };
    dbg('out seek', t);
    this.sdk.seek(t);
  }

  getCurrentTime(): number | null {
    return this.ready ? this.estimate() : null;
  }

  on(ev: Ev, cb: () => void) {
    if (!this.handlers.has(ev)) this.handlers.set(ev, new Set());
    this.handlers.get(ev)!.add(cb);
  }

  private emit(ev: Ev) { this.handlers.get(ev)?.forEach((cb) => cb()); }

  destroy() {
    try { this.sdk?.destroy(); } catch { /* уже уничтожен */ }
    this.sdk = null;
    this.handlers.clear();
  }
}