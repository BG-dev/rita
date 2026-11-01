export type Correction =
  | { kind: 'none' }
  | { kind: 'seek'; to: number }
  | { kind: 'rate'; rate: number; ms: number };

/**
 * precision — гранулярность позиции, которую отдаёт адаптер (в секундах).
 * VK отдаёт целые секунды => 1, у Rutube/нативного video => 0.25 или меньше.
 * Подгонка темпом включается только при точной позиции: при шаге в секунду
 * изменение playbackRate не успевает ничего исправить.
 */
export function decide(
  target: number,
  current: number | null,
  playing: boolean,
  precision = 0.1,
): Correction {
  if (current == null || !Number.isFinite(current)) return { kind: 'none' };

  const hard = Math.max(0.7, precision * 2);
  const soft = Math.max(0.12, precision * 0.6);
  const d = current - target;

  if (Math.abs(d) > hard) return { kind: 'seek', to: Math.max(0, target) };
  if (playing && Math.abs(d) > soft && precision < 0.5) {
    return { kind: 'rate', rate: d > 0 ? 0.94 : 1.06, ms: 4000 };
  }
  return { kind: 'none' };
}
