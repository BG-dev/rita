import { useEffect, useRef, useState } from "react";

/**
 * Возвращает true, пока не прошло min(ms) С МОМЕНТА МОНТИРОВАНИЯ.
 * Используется, чтобы экран загрузки не мигал: даже если API ответил
 * за 200 мс, анимация доиграет свои 3 секунды.
 */
export function useMinDelay(ms: number): boolean {
  const [elapsed, setElapsed] = useState(false);
  const start = useRef(Date.now());

  useEffect(() => {
    const left = Math.max(0, ms - (Date.now() - start.current));
    const t = setTimeout(() => setElapsed(true), left);
    return () => clearTimeout(t);
  }, [ms]);

  return elapsed;
}
