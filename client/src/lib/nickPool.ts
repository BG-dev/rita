import type { ThemeId } from "./themes";
import { randomLolNick } from "./lolNicks";
import { randomGtaNick } from "./gtaNicks";

const SIMPLE = ["Гость", "Зритель", "Аноним", "Друг", "Сосед", "Кот"];

export function randomNickFor(theme: ThemeId, exclude?: string): string {
  if (theme === "lol") return randomLolNick(exclude);
  if (theme === "gta") return randomGtaNick(exclude);
  let pick = SIMPLE[Math.floor(Math.random() * SIMPLE.length)];
  for (let i = 0; i < 8 && pick === exclude; i++)
    pick = SIMPLE[Math.floor(Math.random() * SIMPLE.length)];
  return pick;
}
