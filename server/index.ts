import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { parseLink } from "../shared/link";
import type {
  ChatMessage,
  ParsedLink,
  PlayerAction,
  RoomState,
} from "../shared/types";
import { sanitizeNick, colorFor } from "../shared/nick";
import type { Activity, ActivityType, Participant } from "../shared/types";
import { LIZARD_RE } from "../client/src/lib/crown";

interface Room {
  id: string;
  link: ParsedLink;
  state: RoomState;
  seq: number;
  actorId: string | null;
  participants: Map<string, Participant>; // socket.id -> участник
  activitySeq: number;
  chat: ChatMessage[]; // последние N сообщений
  chatSeq: number;
}

const rooms = new Map<string, Room>();
const TTL = 1000 * 60 * 60 * 12;

const CHAT_KEEP = 100; // сколько держим в памяти
const CHAT_MAX_LEN = 500;

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);

  next();
});

app.post("/api/rooms", (req, res) => {
  const link =
    typeof req.body?.url === "string" ? parseLink(req.body.url) : null;
  if (!link) return res.status(400).json({ error: "UNSUPPORTED_LINK" });

  const id = nanoid(10);
  rooms.set(id, {
    id,
    link,
    seq: 0,
    actorId: null,
    state: {
      isPlaying: false,
      position: 0,
      rate: 1,
      updatedAt: Date.now(),
      seq: 0,
    },
    participants: new Map(),
    activitySeq: 0,
    chat: [],
    chatSeq: 0,
  });
  res.json({ roomId: id });
});

setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.state.updatedAt > TTL && room.participants.size <= 0)
      rooms.delete(id);
  }
}, 60_000).unref?.();

const http = createServer(app);
const io = new Server(http, { cors: { origin: true } });

function uniqueNick(room: Room, base: string): string {
  const taken = new Set([...room.participants.values()].map((p) => p.nick));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) {
    const c = `${base} ${i}`;
    if (!taken.has(c)) return c;
  }
  return `${base} ${Date.now() % 1000}`;
}

function broadcastPresence(room: Room) {
  io.to(room.id).emit("presence", {
    participants: [...room.participants.values()].sort(
      (a, b) => a.joinedAt - b.joinedAt,
    ),
  });
}

function pushChat(room: Room, p: Participant, raw: string) {
  const text = raw.replace(/\s+/g, " ").trim().slice(0, CHAT_MAX_LEN);
  if (!text) return;

  room.chatSeq += 1;
  const msg: ChatMessage = {
    id: room.chatSeq,
    nick: p.nick,
    color: p.color,
    text,
    at: Date.now(),
  };
  room.chat.push(msg);
  if (room.chat.length > CHAT_KEEP) room.chat.shift();

  io.to(room.id).emit("chat:msg", msg);
}

function pushActivity(
  room: Room,
  p: Participant,
  type: ActivityType,
  position?: number,
) {
  room.activitySeq += 1;
  const item: Activity = {
    id: room.activitySeq,
    nick: p.nick,
    color: p.color,
    type,
    position:
      typeof position === "number"
        ? Math.max(0, Math.round(position * 10) / 10)
        : undefined,
    at: Date.now(),
  };
  io.to(room.id).emit("activity", item);
}

const pos = (v: unknown) =>
  Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
const rate = (v: unknown) => {
  const n = Number(v);
  return n > 0.1 && n < 4 ? n : 1;
};

io.on("connection", (socket) => {
  socket.on(
    "ping",
    (_p, ack) => typeof ack === "function" && ack({ serverTime: Date.now() }),
  );

  socket.on(
    "room:join",
    (
      { roomId, nick }: { roomId: string; nick?: string },
      ack?: (r: any) => void,
    ) => {
      const room = rooms.get(roomId);
      if (!room) return ack?.({ error: "NOT_FOUND" });

      const name = uniqueNick(room, sanitizeNick(nick));
      const p: Participant = {
        id: socket.id,
        nick: name,
        color: colorFor(name),
        joinedAt: Date.now(),
      };

      room.participants.set(socket.id, p);
      socket.data.roomId = roomId;
      socket.data.nick = name;
      socket.join(roomId);

      if (LIZARD_RE.test(p.nick)) {
        const cleanNick = p.nick.replace(LIZARD_RE, "").trim() || p.nick;

        io.to(room.id).emit("royal:enter", { nick: cleanNick });
      }

      ack?.({
        state: room.state,
        link: room.link,
        you: p,
        participants: [...room.participants.values()],
        chat: room.chat,
      });

      broadcastPresence(room);
      pushActivity(room, p, "join");
    },
  );

  socket.on("chat:send", ({ text }: { text: string }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const p = room.participants.get(socket.id);
    if (!p) return;
    if (typeof text !== "string") return;
    pushChat(room, p, text);
  });

  socket.on("player:action", (a: PlayerAction) => {
    const room = rooms.get(socket.data.roomId);
    if (!room || !a || typeof a !== "object") return;
    if (a.type !== "play" && a.type !== "pause" && a.type !== "seek") return;

    const p = room.participants.get(socket.id);

    const prevProjected =
      room.state.position +
      (room.state.isPlaying ? (Date.now() - room.state.updatedAt) / 1000 : 0);

    room.seq += 1;
    room.actorId = socket.id;
    room.state = {
      isPlaying:
        a.type !== "pause"
          ? a.type === "play"
            ? true
            : room.state.isPlaying
          : false,
      position: pos(a.position),
      rate: rate(a.rate ?? room.state.rate),
      updatedAt: Date.now(),
      seq: room.seq,
    };
    io.to(room.id).emit("state", {
      ...room.state,
      originClientId: a.clientId,
      actorId: socket.id,
    });

    if (!p) return;

    if (
      a.type === "pause" &&
      room.state.isPlaying === false &&
      Math.abs(a.position - prevProjected) < 1
    ) {
      return; // пауза на уже стоящем плеере — не событие
    }
    if (a.type === "seek" && Math.abs(a.position - prevProjected) < 0.75) {
      return; // микродрейф, не перемотка
    }
    if (a.type === "play" || a.type === "pause" || a.type === "seek") {
      pushActivity(room, p, a.type, a.position);
    }
  });

  socket.on("player:heartbeat", ({ position, clientId }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room || room.actorId !== socket.id) return;
    if (!room.state.isPlaying) return; // на паузе позицию не двигаем

    const current =
      room.state.position +
      (room.state.isPlaying ? (Date.now() - room.state.updatedAt) / 1000 : 0);
    if (Math.abs(pos(position) - current) < 1.0) return; // было 0.5

    room.seq += 1;
    room.state = {
      ...room.state,
      position: pos(position),
      updatedAt: Date.now(),
      seq: room.seq,
    };
    io.to(room.id).emit("state", {
      ...room.state,
      originClientId: clientId,
      actorId: room.actorId,
    });
  });

  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const p = room.participants.get(socket.id);
    room.participants.delete(socket.id);
    if (room.actorId === socket.id) room.actorId = null;
    broadcastPresence(room);
    if (p) pushActivity(room, p, "leave");
  });
});

const PORT = Number(process.env.PORT ?? 3001);
http.listen(PORT, () => {
  console.log("Mem: ", FRONTEND_URL);
  console.log(`server started on http://localhost:${PORT}`);
});
