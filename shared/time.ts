import type { RoomState } from './types';

export function project(s: RoomState, serverNow: number): number {
  if (!s.isPlaying) return s.position;
  const dt = Math.max(0, (serverNow - s.updatedAt) / 1000);
  return s.position + dt * (s.rate || 1);
}
