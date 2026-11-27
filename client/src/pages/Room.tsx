import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWatchRoom } from "../hooks/useWatchRoom";
import { useMinDelay } from "../hooks/useMinDelay"; // ★ 1
import { useAnimPref } from "../hooks/useAnimPref"; // ★ 1
import { Player } from "../components/Player";
import NickGate from "../components/NickGate";
import PresenceBar from "../components/PresenceBar";
import ActivityFeed from "../components/ActivityFeed";
import LoadingScreen from "../components/LoadingScreen"; // ★ 1
import AnimToggle from "../components/AnimToggle"; // ★ 1
import Chat from "../components/Chat";
import ThemePicker from "../components/ThemePicker";
import RoyalBanner from "../components/RoyalBanner";
import { parseCrown } from "../lib/crown";

const NICK_KEY = "watch:nick";

export function Room() {
  const params = useParams();
  const roomId = (params.roomId ?? params.id ?? "").trim();
  const navigate = useNavigate();

  const [nick, setNick] = useState<string | null>(() =>
    localStorage.getItem(NICK_KEY),
  );
  const [copied, setCopied] = useState(false);

  const [anim, toggleAnim] = useAnimPref(); // ★ 2
  const minElapsed = useMinDelay(4000); // ★ 2  (3 секунды)

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
    chat,
    sendChat,
    royal,
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

  // ★ 3 — ЭКРАН ЗАГРУЗКИ
  // Условие: держим пока (данные не готовы) ИЛИ (минимум 3 сек не истёк).
  // notfound/offline показываем сразу — ждать их 3 секунды незачем.
  const dataReady = status === "ok";
  const hardError = status === "notfound" || status === "offline";
  if (!hardError && (!dataReady || !minElapsed)) {
    // если анимации выключены — минимум времени не держим, сразу пропускаем
    if (!anim && dataReady) {
      // проваливаемся дальше к комнате
    } else {
      return <LoadingScreen animated={anim} done={dataReady} />;
    }
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
      <RoyalBanner royal={royal} />
      <header className="lol-header">
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
          <ThemePicker />
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
            {you?.nick && parseCrown(nick).nick} ✎
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
          <div className="panel p-3">
            <div className="panel__head mb-2">Что происходит</div>
            <ActivityFeed items={activity} />
          </div>

          <Chat
            messages={chat}
            onSend={sendChat}
            youNick={you?.nick ?? nick ?? undefined}
          />
        </aside>
      </main>
    </div>
  );
}
