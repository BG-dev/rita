export type Provider = "rutube" | "vk";

export interface ParsedLink {
  provider: Provider;
  videoId: string;
  params: Record<string, string>;
}

export interface RoomState {
  isPlaying: boolean;
  position: number;
  rate: number;
  updatedAt: number;
  seq: number;
}

export type PlayerAction =
  | { type: "play"; position: number; rate?: number; clientId: string }
  | { type: "pause"; position: number; clientId: string }
  | { type: "seek"; position: number; clientId: string };

export interface Participant {
  id: string; // socket.id
  nick: string;
  color: string; // hsl(...)
  joinedAt: number;
}

export type ActivityType = "join" | "leave" | "play" | "pause" | "seek";

export interface Activity {
  id: number; // монотонный счётчик внутри комнаты
  nick: string;
  color: string;
  type: ActivityType;
  position?: number;
  at: number;
}
