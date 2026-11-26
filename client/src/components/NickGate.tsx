import { useState } from "react";
import { sanitizeNick } from "@shared/nick";
import { useTheme } from "../context/ThemeContext";
import { randomNickFor } from "../lib/nickPool";

export default function NickGate({
  initial,
  onSubmit,
}: {
  initial?: string;
  onSubmit: (nick: string) => void;
}) {
  const { theme } = useTheme();
  const [nick, setNick] = useState(initial || randomNickFor(theme));
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeNick(nick);
    if (!clean) return setErr("Введите ник");
    onSubmit(clean);
  };

  return (
    <form
      onSubmit={submit}
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="panel w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold mb-1">Как вас зовут?</h1>
        <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
          Ник увидят остальные в комнате.
        </p>
        <div className="flex gap-2 mb-2">
          <input
            value={nick}
            maxLength={20}
            autoFocus
            onChange={(e) => {
              setNick(e.target.value);
              setErr(null);
            }}
            className="chat__input flex-1"
            placeholder="Ник"
          />
          <button
            type="button"
            onClick={() => {
              setNick(randomNickFor(theme, nick));
              setErr(null);
            }}
            className="btn"
            title="Случайное имя"
          >
            🎲
          </button>
        </div>
        <p className="text-xs mb-4 h-4" style={{ color: "var(--muted)" }}>
          {err ?? "Кнопка 🎲 — имя по текущей теме"}
        </p>
        <button
          type="submit"
          className="btn w-full"
          style={{ background: "var(--accent)" }}
        >
          Войти в комнату
        </button>
      </div>
    </form>
  );
}
