// formatScore.ts: Zero-pads a numeric score to 5 digits

export function formatScore(score: number): string {
  return String(score).padStart(5, '0');
}
