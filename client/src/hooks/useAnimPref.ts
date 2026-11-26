import { useCallback, useEffect, useState } from "react";

const KEY = "watch:anim";

/** true = анимации включены (по умолчанию). Переживает перезагрузку. */
export function useAnimPref(): [boolean, () => void] {
  const [on, setOn] = useState<boolean>(() => {
    const v = localStorage.getItem(KEY);
    return v === null ? true : v === "1";
  });

  useEffect(() => {
    localStorage.setItem(KEY, on ? "1" : "0");
    // класс на <html> — чтобы CSS мог глушить анимации глобально
    document.documentElement.classList.toggle("anim-off", !on);
  }, [on]);

  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle];
}
