import { parseCrown } from "../lib/crown";
import type { Participant } from "@shared/types";

export default function PresenceBar({
  participants,
  youId,
}: {
  participants: Participant[];
  youId?: string;
}) {
  return (
    <div
      className="presence-bar flex items-center gap-2"
      style={{ overflowX: "auto", overflowY: "visible" }}
    >
      <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>
        В комнате: {participants.length}
      </span>
      {participants.map((p) => {
        const { nick, crown } = parseCrown(p.nick);
        return (
          <div key={p.id} className="flex items-center gap-1.5 shrink-0">
            <div className="presence-ava" style={{ background: p.color }}>
              {nick.charAt(0).toUpperCase()}
              {crown && (
                <span className="presence-crown">
                  <Crown size={13} />
                </span>
              )}
            </div>
            <span
              className="text-sm whitespace-nowrap"
              style={{ color: "var(--text)" }}
            >
              {nick}
              {p.id === youId && " (вы)"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Crown({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-label="корона"
      className="crown-badge"
    >
      <path
        d="M3 8l3.5 3L12 5l5.5 6L21 8v9H3V8z"
        fill="url(#crownGold)"
        stroke="#8a6d1f"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="3" cy="8" r="1.6" fill="#ffe08a" />
      <circle cx="12" cy="5" r="1.8" fill="#ffe08a" />
      <circle cx="21" cy="8" r="1.6" fill="#ffe08a" />
      <defs>
        <linearGradient id="crownGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffdf7e" />
          <stop offset="1" stopColor="#c8930f" />
        </linearGradient>
      </defs>
    </svg>
  );
}
