import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const PHASES: Record<string, string[]> = {
  simple: [
    "Подключаемся…",
    "Синхронизируем…",
    "Входим в комнату…",
    "Почти готово…",
  ],
  lol: [
    "Устанавливаем связь…",
    "Синхронизируем время…",
    "Загрузка на Полях Правосудия…",
    "Добро пожаловать, призыватель…",
  ],
  gta: [
    "Поиск сессии…",
    "Подключение к Вайс-Сити…",
    "Загрузка района…",
    "Заводим мотор…",
  ],
};

export default function LoadingScreen({
  animated,
  done,
}: {
  animated: boolean;
  done: boolean;
}) {
  const { theme } = useTheme();
  const [phase, setPhase] = useState(0);
  const phases = PHASES[theme] ?? PHASES.simple;

  useEffect(() => {
    if (!animated) return;
    const t = setInterval(
      () => setPhase((p) => Math.min(p + 1, phases.length - 1)),
      850,
    );
    return () => clearInterval(t);
  }, [animated, phases.length]);

  return (
    <div className={`load load--${theme}`} data-theme-load={theme}>
      <div className="load__bg" />

      <div className="load__center">
        {/* ===== визуал зависит от темы ===== */}
        {theme === "lol" && (
          <div className="lol-hex">
            <div className="lol-hex__ring lol-hex__ring--1" />
            <div className="lol-hex__ring lol-hex__ring--2" />
            <div className="lol-hex__core">
              <span className="lol-hex__glyph">⟁</span>
            </div>
          </div>
        )}

        {theme === "gta" && (
          <div className="gta-mark">
            <div className="gta-mark__ring" />
            <div className="gta-mark__star">★</div>
            <div className="gta-mark__scan" />
          </div>
        )}

        {theme === "simple" && <div className="simple-spin" />}

        <h1 className="load__title">WATCH&nbsp;WITH&nbsp;RITA</h1>
        <p className="load__phase">
          {done ? "Открываем сеанс…" : phases[phase]}
        </p>

        <div className="load__bar">
          <div className="load__bar-fill" />
        </div>
      </div>
    </div>
  );
}
