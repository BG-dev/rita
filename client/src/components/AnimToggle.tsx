export default function AnimToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title={on ? "Выключить анимации" : "Включить анимации"}
      className="lol-toggle"
      aria-pressed={on}
    >
      <span className={`lol-toggle__dot ${on ? "is-on" : ""}`} />
      {on ? "Анимации" : "Статичный режим"}
    </button>
  );
}
