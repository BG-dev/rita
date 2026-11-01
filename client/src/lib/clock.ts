export class ServerClock {
  private offset = 0;
  private samples: { rtt: number; offset: number }[] = [];

  get now() { return Date.now() + this.offset; }

  add(offset: number, rtt: number) {
    this.samples.push({ offset, rtt });
    if (this.samples.length > 14) this.samples.shift();
    const best = [...this.samples].sort((a, b) => a.rtt - b.rtt).slice(0, 4);
    this.offset = best.reduce((s, x) => s + x.offset, 0) / best.length;
  }
}
