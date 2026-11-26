import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWatchRoom } from "../hooks/useWatchRoom";
import { Player } from "../components/Player";
import NickGate from "../components/NickGate";
import PresenceBar from "../components/PresenceBar";
import ActivityFeed from "../components/ActivityFeed";

const NICK_KEY = "watch:nick";

export function Room() {
  const params = useParams();
  const roomId = (params.roomId ?? params.id ?? "").trim();
  const navigate = useNavigate();

  const [nick, setNick] = useState<string | null>(() =>
    localStorage.getItem(NICK_KEY),
  );
  const [copied, setCopied] = useState(false);

  const {
    state,
    link,
    status,
    attach,
    participants,
    activity,
    you,
    serverNow,
    roomUrl,
  } = useWatchRoom(roomId, nick);

  const onSubmitNick = useCallback((n: string) => {
    localStorage.setItem(NICK_KEY, n);
    setNick(n);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* буфер обмена недоступен */
    }
  };

  if (!nick) {
    return (
      <NickGate
        initial={localStorage.getItem(NICK_KEY) ?? undefined}
        onSubmit={onSubmitNick}
      />
    );
  }

  if (status === "notfound") {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-900 text-white p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-3">404</h1>
          <p className="text-gray-400 mb-6">
            Комната не найдена или сервер её уже забыл.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Создать новую комнату
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white transition"
          >
            ← На главную
          </button>

          <div className="flex-1 min-w-0">
            <PresenceBar participants={participants} youId={you?.id} />
          </div>

          <button
            onClick={copyLink}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700
                       text-sm transition"
          >
            {copied ? "Скопировано" : "Ссылка"}
          </button>

          <button
            onClick={() => setNick(null)}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700
                       text-sm transition"
            title="Сменить ник"
          >
            {you?.nick ?? nick} ✎
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          {status === "connecting" && (
            <div className="aspect-video bg-gray-800 rounded-xl grid place-items-center">
              <span className="text-gray-400">Подключаемся…</span>
            </div>
          )}

          {status === "offline" && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-900/40 text-red-200 text-sm">
              Нет связи с сервером. Обновите страницу.
            </div>
          )}

          {link && state && (
            <Player
              link={link}
              attach={attach}
              serverNow={serverNow}
              roomId={roomId}
            />
          )}
        </div>

        <aside className="space-y-3">
          <ActivityFeed items={activity} />
          <div className="text-xs text-gray-600 px-1">
            Изменения показываются всем в комнате в реальном времени.
          </div>
        </aside>
      </main>
    </div>
  );
}
