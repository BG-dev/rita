import { useEffect, useState } from "react";

const PHASES = [
  "Устанавливаем соединение…",
  "Синхронизируем время…",
  "Входим в комнату…",
  "Почти готово…",
];

export default function LoadingScreen({
  animated,
  done, // данные получены (но экран ждёт ещё и минимум по времени)
}: {
  animated: boolean;
  done: boolean;
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const t = setInterval(
      () => setPhase((p) => Math.min(p + 1, PHASES.length - 1)),
      850,
    );
    return () => clearInterval(t);
  }, [animated]);

  return (
    <div className="lol-loader">
      <div className="lol-loader__bg" />

      <div className="lol-loader__center">
        {/* вращающийся гексагон-ядро */}
        <div className="lol-hex">
          <div className="lol-hex__ring lol-hex__ring--1" />
          <div className="lol-hex__ring lol-hex__ring--2" />
          <div className="lol-hex__core">
            <span className="lol-hex__glyph">⟁</span>
          </div>
        </div>

        <h1 className="lol-loader__title">WATCH&nbsp;WITH&nbsp;RITA</h1>

        <p className="lol-loader__phase">
          {done ? "Открываем сеанс…" : PHASES[phase]}
        </p>

        {/* полоса прогресса-заполнения */}
        <div className="lol-loader__bar">
          <div className="lol-loader__bar-fill" />
        </div>
      </div>

      {/* декоративные частицы по углам */}
      <span className="lol-rune lol-rune--tl" />
      <span className="lol-rune lol-rune--tr" />
      <span className="lol-rune lol-rune--bl" />
      <span className="lol-rune lol-rune--br" />
    </div>
  );
}
