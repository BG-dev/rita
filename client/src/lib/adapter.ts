import type { Protocol } from '@shared/protocol';

export type Ev =
  | 'ready' | 'play' | 'pause' | 'seeked'
  | 'waiting' | 'ended' | 'tick' | 'error';

export interface PlayerAdapter {
  isReady(): boolean;
  canControl(): boolean;
  /** Гранулярность позиции в секундах. */
  precision(): number;
  /** Реальное состояние по мнению самого плеера. null — неизвестно (реклама). */
  getPlaying(): boolean | null;
  isAdActive?(): boolean;
  init?(): Promise<void>;
  play(): void;
  pause(): void;
  seekTo(sec: number): void;
  setRate?(r: number): void;
  getCurrentTime(): number | null;
  on(ev: Ev, cb: () => void): void;
  destroy(): void;
}

const DEBUG = new URLSearchParams(location.search).has('debug');

/** Адаптер для плееров на postMessage (Rutube). */
export class IframeAdapter implements PlayerAdapter {
  private handlers = new Map<Ev, Set<() => void>>();
  private ready = false;
  private anchor: { position: number; at: number; playing: boolean } | null = null;
  private playing = false;
  /** До этого момента события плеера — эхо наших же команд. */
  private programmaticUntil = 0;
  private onMsg: (e: MessageEvent) => void;

  constructor(private frame: HTMLIFrameElement, private proto: Protocol) {
    this.onMsg = (e: MessageEvent) => {
      if (e.source !== this.frame.contentWindow) return;
      if (!e.origin.startsWith(this.proto.origin)) return;
      let m: any = e.data;
      if (typeof m === 'string') { try { m = JSON.parse(m); } catch { return; } }
      this.handle(m);
    };
    window.addEventListener('message', this.onMsg);
  }

  private emit(ev: Ev) { this.handlers.get(ev)?.forEach((cb) => cb()); }

  private estimate(): number {
    if (!this.anchor) return 0;
    const dt = (Date.now() - this.anchor.at) / 1000;
    return this.anchor.playing ? this.anchor.position + dt : this.anchor.position;
  }

  private handle(m: any) {
    if (DEBUG) console.log('[rutube:in]', m?.type ?? m, m);
    const kind = this.proto.in[m?.type];
    if (!kind) return;
    const now = Date.now();

    if (kind === 'ready') { this.ready = true; this.emit('ready'); return; }

    if (kind === 'time') {
      const t = this.proto.readTime?.(m);
      if (t == null) return;
      const expected = this.estimate();
      // Пользователь дёрнул таймлайн внутри плеера.
      const userSeek = this.ready && now > this.programmaticUntil
        && Math.abs(t - expected) > 1.0;
      this.anchor = { position: t, at: now, playing: this.playing };
      if (userSeek) this.emit('seeked');
      this.emit('tick');
      return;
    }

    if (kind === 'play') {
      const pos = this.estimate();
      this.playing = true;
      this.anchor = { position: pos, at: now, playing: true };
      if (now >= this.programmaticUntil) this.emit('play');
      return;
    }

    if (kind === 'pause') {
      const pos = this.estimate();
      this.playing = false;
      this.anchor = { position: pos, at: now, playing: false };
      if (now >= this.programmaticUntil) this.emit('pause');
      return;
    }

    if (kind === 'ended') {
      const pos = this.estimate();
      this.playing = false;
      this.anchor = { position: pos, at: now, playing: false };
      if (now >= this.programmaticUntil) this.emit('ended');
    }
  }

  private post(msg: object) {
    const w = this.frame.contentWindow;
    if (!w) return;
    w.postMessage(JSON.stringify(msg), this.proto.origin);
    w.postMessage(msg, this.proto.origin);
    if (DEBUG) console.log('[rutube:out]', msg);
  }

  isReady() { return this.ready; }
  canControl() { return true; }
  precision() { return 0.25; }
  getPlaying() { return this.playing; }

  play() {
    this.programmaticUntil = Date.now() + 900;
    const pos = this.estimate();
    this.playing = true;
    this.anchor = { position: pos, at: Date.now(), playing: true };
    this.post(this.proto.out.play());
  }

  pause() {
    this.programmaticUntil = Date.now() + 900;
    const pos = this.estimate();
    this.playing = false;
    this.anchor = { position: pos, at: Date.now(), playing: false };
    this.post(this.proto.out.pause());
  }

  seekTo(sec: number) {
    this.programmaticUntil = Date.now() + 900;
    this.anchor = { position: sec, at: Date.now(), playing: this.playing };
    this.post(this.proto.out.seek(sec));
  }

  setRate(r: number) {
    this.post({ type: 'player:setRate', data: { rate: r } });
  }

  getCurrentTime(): number | null {
    return this.ready && this.anchor ? this.estimate() : null;
  }

  on(ev: Ev, cb: () => void) {
    if (!this.handlers.has(ev)) this.handlers.set(ev, new Set());
    this.handlers.get(ev)!.add(cb);
  }

  destroy() {
    window.removeEventListener('message', this.onMsg);
    this.handlers.clear();
  }
}