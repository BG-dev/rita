export const GTA_NICKS: readonly string[] = [
  "Клод", // GTA III
  "Томми Версетти", // Vice City
  "Карл Джонсон", // San Andreas (CJ)
  "Виктор Вэнс", // Vice City Stories
  "Тони Сиприани", // Liberty City Stories
  "Нико Беллик", // GTA IV
  "Джонни Клебиц", // TLAD
  "Луис Лопес", // TBoGT
  "Майкл Де Санта", // GTA V
  "Франклин Клинтон", // GTA V
  "Тревор Филипс", // GTA V
  "Лючия", // GTA VI
  "Джейсон", // GTA VI
] as const;

export function randomGtaNick(exclude?: string): string {
  if (GTA_NICKS.length < 2) return GTA_NICKS[0] ?? "Гость";
  let pick = GTA_NICKS[Math.floor(Math.random() * GTA_NICKS.length)];
  for (let i = 0; i < 8 && pick === exclude; i++)
    pick = GTA_NICKS[Math.floor(Math.random() * GTA_NICKS.length)];
  return pick;
}
