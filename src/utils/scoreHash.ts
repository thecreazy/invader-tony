// scoreHash.ts: Deterministic djb2-style chain hash for tamper-evident incremental score verification

export function hashScore(prevHash: string, points: number, source: string, total: number): string {
  const input = `${prevHash}:${points}:${source}:${total}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(hash, 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function verifyScoreHash(
  events: { points: number; source: string; total: number }[],
  finalHash: string,
): boolean {
  let hash = '0';
  for (const e of events) hash = hashScore(hash, e.points, e.source, e.total);
  return hash === finalHash;
}
