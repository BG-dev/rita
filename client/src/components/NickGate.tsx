import { useState } from "react";
import { sanitizeNick } from "@shared/nick";
import { randomLolNick } from "../lib/lolNicks";

export default function NickGate({
  initial,
  onSubmit,
}: {
  initial?: string;
  onSubmit: (nick: string) => void;
}) {
  const [nick, setNick] = useState(initial || randomLolNick());
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
      className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4"
    >
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl font-semibold mb-1">Как вас зовут?</h1>
        <p className="text-sm text-gray-400 mb-5">
          Ник увидят остальные в комнате.
        </p>

        <div className="flex gap-2 mb-2">
          <input
            value={nick}
            onChange={(e) => {
              setNick(e.target.value);
              setErr(null);
            }}
            maxLength={20}
            autoFocus
            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700
                       focus:border-blue-500 outline-none"
            placeholder="Ник"
          />
          <button
            type="button"
            onClick={() => {
              setNick(randomLolNick(nick));
              setErr(null);
            }}
            title="Случайное имя чемпиона League of Legends"
            className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition
                       text-lg leading-none"
          >
            🎲
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4 h-4">
          {err ?? "Кнопка 🎲 — случайное имя чемпиона LoL"}
        </p>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700
                     font-medium transition"
        >
          Войти в комнату
        </button>
      </div>
    </form>
  );
}
