export const LIZARD_RE = /\s*ящерица\s*$/iu;

export interface NickInfo {
  nick: string; // очищенный ник (без «ящерица»)
  crown: boolean; // рисовать ли корону
}

export function parseCrown(raw: string): NickInfo {
  const crown = LIZARD_RE.test(raw);
  const nick = crown ? raw.replace(LIZARD_RE, "").trim() : raw;
  // если после вырезания пусто (ник был просто «ящерица») — оставим слово
  return nick ? { nick, crown } : { nick: raw.trim(), crown };
}
