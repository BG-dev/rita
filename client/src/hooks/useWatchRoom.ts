import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { nanoid } from "nanoid";
import { ServerClock } from "../lib/clock";
import type { PlayerAdapter } from "../lib/adapter";
import { project } from "@shared/time";
import { decide } from "@shared/reconcile";
import type {
  Activity,
  ChatMessage,
  ParsedLink,
  Participant,
  PlayerAction,
  RoomState,
} from "@shared/types";

const WS = import.meta.env.VITE_WS_URL || window.location.origin;

type Status = "idle" | "connecting" | "ok" | "notfound" | "offline";

function rpc<T = any>(s: Socket, ev: string, payload: object): Promise<T> {
  return new Promise((resolve, reject) => {
    s.timeout(4000).emit(ev, payload, (err: any, res: T) =>
      err ? reject(err) : resolve(res),
    );
  });
}

export function useWatchRoom(roomId: string, nick: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [link, setLink] = useState<ParsedLink | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [you, setYou] = useState<Participant | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [royal, setRoyal] = useState<{ nick: string; key: number } | null>(
    null,
  );

  const clock = useRef(new ServerClock()).current;
  const clientId = useRef(nanoid(8)).current;
  const socket = useRef<Socket | null>(null);
  const adapter = useRef<PlayerAdapter | null>(null);
  const stateRef = useRef<RoomState | null>(null);
  const freeUntil = useRef(0);
  const lastCmd = useRef(0);
  const playAttempts = useRef(0);

  const send = useCallback(
    (a: Omit<PlayerAction, "clientId">) => {
      lastCmd.current = Date.now();
      socket.current?.emit("player:action", { ...a, clientId });
    },
    [clientId],
  );

  const sendChat = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean) return;
    socket.current?.emit("chat:send", { text: clean });
  }, []);

  const calibrate = useCallback(
    async (s: Socket) => {
      const rounds: { rtt: number; offset: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const t0 = Date.now();
        try {
          const res = await rpc<{ serverTime: number }>(s, "ping", {});
          const t2 = Date.now();
          rounds.push({ rtt: t2 - t0, offset: res.serverTime - (t0 + t2) / 2 });
        } catch {
          /* пропускаем неудачный замер */
        }
        await new Promise((r) => setTimeout(r, 120));
      }
      rounds.forEach((r) => clock.add(r.offset, r.rtt));
    },
    [clock],
  );

  const reconcile = useCallback(() => {
    const a = adapter.current;
    const st = stateRef.current;
    if (!a || !st || !a.isReady()) return;
    if (a.isAdActive?.()) return;

    const now = Date.now();
    if (now < freeUntil.current) return;
    if (now - lastCmd.current < 800) return;

    let acted = false;

    const target = project(st, clock.now);
    const c = decide(target, a.getCurrentTime(), st.isPlaying, a.precision());
    if (c.kind === "seek") {
      a.seekTo(c.to);
      acted = true;
    } else if (c.kind === "rate" && a.setRate) {
      a.setRate(c.rate);
      setTimeout(() => a.setRate?.(1), c.ms);
      acted = true;
    }

    const local = a.getPlaying();
    if (local != null) {
      if (st.isPlaying && local === false) {
        if (playAttempts.current < 5) {
          playAttempts.current += 1;
          a.play();
          acted = true;
        }
      } else if (!st.isPlaying && local === true) {
        a.pause();
        acted = true;
      } else if (local === true) {
        playAttempts.current = 0;
      }
    }

    if (acted) lastCmd.current = now;
  }, [clock]);

  const attach = useCallback(
    (a: PlayerAdapter) => {
      adapter.current = a;
      a.on("ready", reconcile);
      a.on("tick", reconcile);

      a.on("play", () => {
        if (stateRef.current?.isPlaying) return;
        freeUntil.current = Date.now() + 1200;
        send({ type: "play", position: a.getCurrentTime() ?? 0 });
      });

      a.on("pause", () => {
        if (stateRef.current && !stateRef.current.isPlaying) return;
        freeUntil.current = Date.now() + 1200;
        send({ type: "pause", position: a.getCurrentTime() ?? 0 });
      });

      a.on("ended", () => {
        freeUntil.current = Date.now() + 1200;
        send({ type: "pause", position: a.getCurrentTime() ?? 0 });
      });

      a.on("seeked", () => {
        const cur = a.getCurrentTime();
        const st = stateRef.current;
        if (cur == null || !st) return;
        const tol = Math.max(1.0, a.precision() * 1.5);
        if (Math.abs(cur - project(st, clock.now)) <= tol) return; // эхо своей же коррекции
        freeUntil.current = Date.now() + 1500;
        send({ type: "seek", position: cur });
      });
    },
    [reconcile, send, clock],
  );

  // --- Подключение и вход в комнату ---
  useEffect(() => {
    if (!nick) {
      setStatus("idle");
      return;
    }

    setStatus("connecting");
    setActivity([]);
    setChat([]);
    setParticipants([]);
    setYou(null);
    stateRef.current = null;

    const s = io(WS, { transports: ["websocket"] });
    socket.current = s;

    const joinRoom = async () => {
      await calibrate(s);
      try {
        const res = await rpc<any>(s, "room:join", { roomId, nick });
        if (res?.error) {
          setStatus("notfound");
          return;
        }
        stateRef.current = res.state;
        setState(res.state);
        setLink(res.link);
        setYou(res.you ?? null);
        if (Array.isArray(res.chat)) setChat(res.chat);
        if (Array.isArray(res.participants)) setParticipants(res.participants);
        setStatus("ok");
      } catch {
        setStatus("offline");
      }
    };

    // Вызывается и на первый коннект, и на каждый реконнект.
    s.on("connect", joinRoom);
    s.on("disconnect", () => setStatus("offline"));

    s.on(
      "presence",
      ({ participants: list }: { participants: Participant[] }) => {
        setParticipants(list);
        const me = list.find((p) => p.id === s.id);
        if (me) setYou(me);
      },
    );

    s.on("activity", (a: Activity) => {
      setActivity((prev) => [...prev.slice(-49), a]);
    });

    s.on("chat:msg", (m: ChatMessage) => {
      setChat((prev) => [...prev.slice(-199), m]);
    });

    s.on("royal:enter", ({ nick }: { nick: string }) => {
      // key нужен, чтобы повторный вход (та же королева) перезапустил показ
      setRoyal({ nick, key: Date.now() });
    });

    s.on("state", (incoming: RoomState & { originClientId: string }) => {
      if (stateRef.current && incoming.seq <= stateRef.current.seq) return;
      stateRef.current = incoming;
      setState(incoming);
      playAttempts.current = 0;
    });

    return () => {
      s.close();
      socket.current = null;
    };
  }, [roomId, nick, calibrate]);

  useEffect(() => {
    const tick = setInterval(reconcile, 400);
    const beat = setInterval(() => {
      const a = adapter.current;
      if (!a?.isReady() || a.isAdActive?.()) return;
      socket.current?.emit("player:heartbeat", {
        position: a.getCurrentTime() ?? 0,
        clientId,
      });
    }, 5000);

    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      if (socket.current?.connected) await calibrate(socket.current);
      freeUntil.current = 0;
      lastCmd.current = 0;
      reconcile();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(tick);
      clearInterval(beat);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reconcile, calibrate, clientId]);

  return {
    state,
    link,
    status,
    attach,
    participants,
    activity,
    you,
    serverNow: () => clock.now,
    roomUrl: `${location.origin}/r/${roomId}`,
    chat,
    sendChat,
    royal,
  };
}
