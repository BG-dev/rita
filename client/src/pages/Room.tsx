import { useParams } from 'react-router-dom';
import { useWatchRoom } from '../hooks/useWatchRoom';
import { Player } from '../components/Player';

export function Room() {
  const { id = '' } = useParams();
  const { state, link, status, attach, roomUrl } = useWatchRoom(id);

  if (status === 'notfound') return <p className="p-8 text-neutral-400">Комната не найдена или истекла.</p>;
  if (status === 'offline') return <p className="p-8 text-neutral-400">Нет связи с сервером…</p>;
  if (status === 'connecting' || !link) return <p className="p-8 text-neutral-400">Подключаемся…</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      {/* key обязателен: при смене видео SDK должен привязаться к новому iframe */}
      <Player
        key={`${link.provider}:${link.videoId}:${link.params.hash ?? ''}`}
        link={link}
        attach={attach}
      />
      <div className="flex items-center gap-3 text-sm text-neutral-400">
        <span className={state?.isPlaying ? 'text-emerald-400' : ''}>
          {state?.isPlaying ? '▶ синхронизировано' : '⏸ пауза'}
        </span>
        <input
          readOnly
          value={roomUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded bg-neutral-900 px-3 py-1.5 outline-none"
        />
        <button
          onClick={() => navigator.clipboard.writeText(roomUrl)}
          className="rounded bg-neutral-800 px-3 py-1.5"
        >
          Копировать
        </button>
      </div>
    </div>
  );
}
