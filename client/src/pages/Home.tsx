import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Home() {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function create() {
    setErr(null);
    setBusy(true);
    try {
      console.log("WS_URL: ", import.meta.env.WS_URL);
      const API_URL = import.meta.env.WS_URL?.replace(
        "ws://",
        "http://",
      ).replace("wss://", "https://");
      const r = await fetch(`${API_URL}/api/rooms`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await r.json();
      if (!r.ok)
        return setErr(
          "Поддерживаются только rutube.ru и vk.ru / vk.com / vkvideo.ru",
        );
      nav(`/r/${data.roomId}`);
    } catch {
      setErr("Сервер недоступен");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-3 p-8">
      <h1 className="text-xl font-semibold">Смотреть вместе</h1>
      <p className="text-sm text-neutral-400">
        Вставьте ссылку на видео — получите комнату для совместного просмотра.
      </p>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
        placeholder="https://rutube.ru/video/… или https://vk.com/video-…"
        className="w-full rounded bg-neutral-900 px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-600"
      />
      <button
        onClick={create}
        disabled={busy || !url.trim()}
        className="rounded bg-emerald-600 px-4 py-2 disabled:opacity-40"
      >
        Создать комнату
      </button>
      {err && <p className="text-sm text-red-400">{err}</p>}
    </div>
  );
}
