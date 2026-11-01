import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { parseLink } from "../shared/link";
import type { ParsedLink, PlayerAction, RoomState } from "../shared/types";

interface Room {
  id: string;
  link: ParsedLink;
  state: RoomState;
  seq: number;
  actorId: string | null;
}

const rooms = new Map<string, Room>();
const TTL = 1000 * 60 * 60 * 12;

const FRONTEND_URL = process.env.FRONTEND_URL ?? "";

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
  });
  res.json({ roomId: id });
});

setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.state.updatedAt > TTL) rooms.delete(id);
  }
}, 60_000).unref?.();

const http = createServer(app);
const io = new Server(http, { cors: { origin: true } });

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

  socket.on("room:join", ({ roomId }, ack) => {
    const room = rooms.get(String(roomId));
    if (!room) return ack?.({ error: "ROOM_NOT_FOUND" });
    socket.data.roomId = room.id;
    socket.join(room.id);
    ack?.({ state: room.state, link: room.link, serverTime: Date.now() });
  });

  socket.on("player:action", (a: PlayerAction) => {
    const room = rooms.get(socket.data.roomId);
    if (!room || !a || typeof a !== "object") return;
    if (a.type !== "play" && a.type !== "pause" && a.type !== "seek") return;

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
    if (room && room.actorId === socket.id) room.actorId = null;
  });
});

const PORT = Number(process.env.PORT ?? 3001);
http.listen(PORT, () =>
  console.log(`server started on http://localhost:${PORT}`),
);
