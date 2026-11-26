import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@shared/types";
import { timeAgo } from "../lib/format";

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
  const [, force] = useState(0);

  // автоскролл вниз при новом сообщении
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // обновляем «N мин назад»
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

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
          const mine = m.nick === youNick;
          return (
            <div key={m.id} className={`chat__msg ${mine ? "is-mine" : ""}`}>
              <span className="chat__nick" style={{ color: m.color }}>
                {m.nick}
              </span>
              <span className="chat__text">{m.text}</span>
              <span className="chat__time">{timeAgo(m.at)}</span>
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
        </button>
      </form>
    </div>
  );
}
