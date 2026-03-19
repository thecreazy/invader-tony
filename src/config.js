/**
 * Global configuration — all magic numbers live here.
 * Never hardcode values in game logic; reference CONFIG instead.
 */
export const CONFIG = {
  GRID: { COLS: 11, ROWS: 5 },
  PLAYER: { SPEED: 8, BULLET_COOLDOWN: 180, LIVES: 3 },
  ENEMY: { BASE_SPEED: 0.6, SHOOT_INTERVAL_MIN: 1500, SHOOT_INTERVAL_MAX: 4000 },
  BOSS: { HP: 20, PHASES: [0.66, 0.33] },
  CANVAS: { FOV: 70, NEAR: 0.1, FAR: 100 },
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
