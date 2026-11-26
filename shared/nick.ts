const MAX = 20;

export function sanitizeNick(raw: unknown): string {
  if (typeof raw !== "string") return "Гость";
  const s = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX);
  return s || "Гость";
}

/** Одинаковый ник → одинаковый цвет на всех устройствах. */
export function colorFor(nick: string): string {
  let h = 0;
  for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 58%)`;
}
