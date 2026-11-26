import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@shared/types";
import { formatClock, timeAgo } from "../lib/format";
import { parseCrown } from "../lib/crown";
import { Crown } from "./PresenceBar";

export default function Chat({
  messages,
  onSend,
  youNick,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  youNick?: string;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // автоскролл вниз при новом сообщении
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <div className="chat">
      <div className="chat__head">Чат</div>

      <div className="chat__list">
        {messages.length === 0 && (
          <div className="chat__empty">Сообщений пока нет</div>
        )}
        {messages.map((m) => {
          const { nick, crown } = parseCrown(m.nick);
          const mine = nick === parseCrown(youNick ?? "").nick;
          return (
            <div key={m.id} className={`chat__msg ${mine ? "is-mine" : ""}`}>
              <span className="chat__nick" style={{ color: m.color }}>
                {crown && <Crown size={12} />} {nick}
              </span>
              <span className="chat__text">{m.text}</span>
              <span
                className="chat__time"
                title={new Date(m.at).toLocaleString()}
              >
                {formatClock(m.at)}
              </span>
              {/* см. блок 5 */}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat__form" onSubmit={submit}>
        <input
          className="chat__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение…"
          maxLength={500}
        />
        <button className="chat__send" type="submit" disabled={!text.trim()}>
          <span className="chat__send-label">Отправить</span>
          <span className="chat__send-icon" aria-hidden>
            ➤
          </span>
        </button>
      </form>
    </div>
  );
}
