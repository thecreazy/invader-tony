/**
 * Global configuration — all magic numbers live here.
 * Never hardcode values in game logic; reference CONFIG instead.
 */
export const CONFIG = {
  GRID: { COLS: 10, ROWS: 4 },
  PLAYER: { SPEED: 8, BULLET_COOLDOWN: 300, LIVES: 3 },
  ENEMY: { BASE_SPEED: 1.5, SHOOT_INTERVAL_MIN: 800, SHOOT_INTERVAL_MAX: 2000 },
  BOSS: { HP: 20, PHASES: [0.66, 0.33] },
  CANVAS: { FOV: 75, NEAR: 0.1, FAR: 100 },
  COLORS: {
    PLAYER: '#00ffff',
    ENEMY: '#ffaa00',
    BOSS: '#ff0044',
    BULLET_PLAYER: '#00ffff',
    BULLET_ENEMY: '#ff6600',
    BACKGROUND: '#000000',
    NEON_GREEN: '#39ff14',
    NEON_MAGENTA: '#ff00ff',
  },
};
