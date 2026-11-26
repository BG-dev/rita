import type { Participant } from "@shared/types";

export default function PresenceBar({
  participants,
  youId,
}: {
  participants: Participant[];
  youId?: string;
}) {
  if (!participants.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500 mr-1">
        В комнате: {participants.length}
      </span>

      {participants.map((p) => {
        const isYou = p.id === youId;
        return (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1
                       rounded-full bg-gray-800 text-sm"
            title={p.nick}
          >
            <span
              className="w-5 h-5 rounded-full grid place-items-center text-[11px]
                         font-bold text-gray-900"
              style={{ backgroundColor: p.color }}
            >
              {p.nick.trim().charAt(0).toUpperCase()}
            </span>
            <span className="text-gray-200">{p.nick}</span>
            {isYou && <span className="text-gray-500 text-xs">(вы)</span>}
          </span>
        );
      })}
    </div>
  );
}
