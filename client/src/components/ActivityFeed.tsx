import { useEffect, useState } from "react";
import type { Activity } from "@shared/types";
import { fmtTime, timeAgo } from "../lib/format";

function describe(a: Activity): string {
  switch (a.type) {
    case "join":
      return "вошёл в комнату";
    case "leave":
      return "вышел из комнаты";
    case "play":
      return a.position != null
        ? `включил с ${fmtTime(a.position)}`
        : "включил";
    case "pause":
      return a.position != null
        ? `поставил паузу на ${fmtTime(a.position)}`
        : "поставил паузу";
    case "seek":
      return a.position != null
        ? `перемотал на ${fmtTime(a.position)}`
        : "перемотал";
  }
}

export default function ActivityFeed({ items }: { items: Activity[] }) {
  // Раз в секунду перерисовываем, чтобы «только что» превращалось в «12 с назад».
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();

  return (
    <div className="bg-gray-800/60 rounded-xl p-3">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
        Что происходит
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Пока тихо.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {[...items].reverse().map((a) => (
            <li key={a.id} className="text-sm leading-snug">
              <span className="font-medium" style={{ color: a.color }}>
                {a.nick}
              </span>{" "}
              <span className="text-gray-300">{describe(a)}</span>
              <span className="text-gray-600 text-xs ml-1.5">
                {timeAgo(a.at, now)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
