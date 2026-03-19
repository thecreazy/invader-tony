/**
 * Global configuration — all magic numbers live here.
 * Never hardcode values in game logic; reference CONFIG instead.
 */
export const CONFIG = {
  GRID: { COLS: 10, ROWS: 5 },
  PLAYER: { SPEED: 8, BULLET_COOLDOWN: 180, LIVES: 3 },
  ENEMY: {
    BASE_SPEED: 0.6,
    SHOOT_INTERVAL_MIN: 1200,
    SHOOT_INTERVAL_MAX: 3500,
  },
  BOSS: { HP: 25, PHASES: [0.66, 0.33] },
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

  // Wave definitions — 4 waves before the boss
  WAVES: [
    {
      id: 1,
      label: 'WAVE 1',
      cols: 8,
      rows: 3,
      enemyTypes: ['basic', 'basic', 'basic'],
      speedMultiplier: 1.0,
      shootIntervalMin: 2000,
      shootIntervalMax: 4500,
      dropAmount: 0.28,
    },
    {
      id: 2,
      label: 'WAVE 2',
      cols: 9,
      rows: 4,
      enemyTypes: ['elite', 'basic', 'basic', 'basic'],
      speedMultiplier: 1.3,
      shootIntervalMin: 1600,
      shootIntervalMax: 3500,
      dropAmount: 0.30,
    },
    {
      id: 3,
      label: 'WAVE 3',
      cols: 10,
      rows: 4,
      enemyTypes: ['elite', 'elite', 'basic', 'basic'],
      speedMultiplier: 1.7,
      shootIntervalMin: 1200,
      shootIntervalMax: 2800,
      dropAmount: 0.32,
    },
    {
      id: 4,
      label: 'WAVE 4',
      cols: 10,
      rows: 5,
      enemyTypes: ['elite', 'elite', 'elite', 'basic', 'basic'],
      speedMultiplier: 2.2,
      shootIntervalMin: 800,
      shootIntervalMax: 1800,
      dropAmount: 0.35,
    },
  ],
};
