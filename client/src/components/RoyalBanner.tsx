import { useEffect, useState } from "react";
import { Crown } from "./PresenceBar";

export default function RoyalBanner({
  royal,
}: {
  royal: { nick: string; key: number } | null;
}) {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<{ nick: string } | null>(null);

  useEffect(() => {
    if (!royal) return;
    setData({ nick: royal.nick });
    setShow(true);
    const t = setTimeout(() => setShow(false), 3500); // держим 3.5 c
    return () => clearTimeout(t);
    // реагируем на key, а не на объект → повторный вход перезапустит показ
  }, [royal?.key]);

  if (!data) return null;

  return (
    <div className={`royal ${show ? "is-show" : ""}`} aria-hidden={!show}>
      <div className="royal__inner">
        <Crown size={64} />
        <div className="royal__text">👑 КОРОЛЕВА В ЗАЛЕ 👑</div>
        <div className="royal__nick">{data.nick}</div>
      </div>
    </div>
  );
}
