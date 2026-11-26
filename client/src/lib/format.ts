export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(ss).padStart(2, "0")}`;
}

export function timeAgo(at: number, now = Date.now()): string {
  const d = Math.max(0, Math.floor((now - at) / 1000));
  if (d < 5) return "только что";
  if (d < 60) return `${d} с назад`;
  const m = Math.floor(d / 60);
  if (m < 60) return `${m} мин назад`;
  return `${Math.floor(m / 60)} ч назад`;
}
