// Infinite wave system with level progression
import { Enemy } from './entities.js';

// Base wave templates (repeated each level with scaling)
const WAVE_TEMPLATES = [
  {
    name: 'WAVE 1',
    enemies: [
      { type: 'grunt', count: 6, spacing: 0.5, xRange: [0.15, 0.85] },
    ],
  },
  {
    name: 'WAVE 2',
    enemies: [
      { type: 'grunt', count: 5, spacing: 0.4, xRange: [0.1, 0.5] },
      { type: 'zigzag', count: 3, spacing: 0.6, xRange: [0.5, 0.9] },
    ],
  },
  {
    name: 'WAVE 3',
    enemies: [
      { type: 'zigzag', count: 6, spacing: 0.4, xRange: [0.1, 0.9] },
      { type: 'tank', count: 2, spacing: 1.0, xRange: [0.3, 0.7] },
    ],
  },
  {
    name: 'WAVE 4',
    enemies: [
      { type: 'grunt', count: 8, spacing: 0.3, xRange: [0.1, 0.9] },
      { type: 'zigzag', count: 4, spacing: 0.5, xRange: [0.2, 0.8] },
      { type: 'tank', count: 2, spacing: 0.8, xRange: [0.3, 0.7] },
    ],
  },
];

// Boss colors that cycle each level
export const BOSS_COLORS = [
  { body: '#ff00ff', core: '#ffe100', eyes: '#ff3131', bullet: '#ffe100' },
  { body: '#00fff7', core: '#ff00ff', eyes: '#ffe100', bullet: '#ff00ff' },
  { body: '#ff3131', core: '#00fff7', eyes: '#39ff14', bullet: '#00fff7' },
  { body: '#39ff14', core: '#ff3131', eyes: '#ff00ff', bullet: '#ff3131' },
  { body: '#ffe100', core: '#39ff14', eyes: '#00fff7', bullet: '#39ff14' },
  { body: '#ff6b00', core: '#00fff7', eyes: '#ff00ff', bullet: '#00fff7' },
  { body: '#8b5cf6', core: '#ffe100', eyes: '#ff3131', bullet: '#ffe100' },
  { body: '#ec4899', core: '#39ff14', eyes: '#00fff7', bullet: '#39ff14' },
];

export class WaveManager {
  constructor() { this.reset(); }

  reset() {
    this.level = 1;
    this.waveIndexInLevel = 0; // 0-3 are enemy waves, 4 is boss
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveDelay = 2;
    this.waveDelayTimer = 1.5;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.gameComplete = false;
    this.levelUpShown = false;
    this.buildQueue();
  }

  get maxLevel() { return 50; }

  // Speed multiplier scales with level (1.0 at level 1, increasing each level)
  get speedMultiplier() {
    return 1 + (this.level - 1) * 0.06;
  }

  get currentWaveName() {
    if (this.isBossWave) return 'BOSS';
    return `WAVE ${this.waveIndexInLevel + 1}`;
  }

  get isBossWave() {
    return this.waveIndexInLevel >= WAVE_TEMPLATES.length;
  }

  // Boss difficulty tier — increases every 5 levels
  get bossTier() {
    return Math.floor((this.level - 1) / 5);
  }

  // Boss HP scales with level and tier
  get bossHp() {
    const baseHp = 60;
    const tierBonus = this.bossTier * 25;
    const levelBonus = (this.level - 1) * 5;
    return baseHp + tierBonus + levelBonus;
  }

  // Boss speed scales
  get bossSpeed() {
    return 80 + this.level * 3 + this.bossTier * 10;
  }

  // Boss shoot rate (lower = faster shooting)
  get bossShootRate() {
    const base = 0.7;
    const reduction = this.bossTier * 0.06 + this.level * 0.005;
    return Math.max(0.15, base - reduction);
  }

  // Boss bullet spread count
  get bossSpread() {
    return 3 + this.bossTier;
  }

  get bossColorSet() {
    return BOSS_COLORS[(this.level - 1) % BOSS_COLORS.length];
  }

  get bossScore() {
    return 5000 + this.level * 500 + this.bossTier * 2000;
  }

  buildQueue() {
    if (this.isBossWave) { this.spawnQueue = []; return; }
    const template = WAVE_TEMPLATES[this.waveIndexInLevel];
    this.spawnQueue = [];

    // Scale enemy counts with level
    const countMultiplier = 1 + (this.level - 1) * 0.15;

    template.enemies.forEach(group => {
      const count = Math.floor(group.count * countMultiplier);
      const spacing = Math.max(0.15, group.spacing / this.speedMultiplier);
      for (let i = 0; i < count; i++) {
        this.spawnQueue.push({
          type: group.type,
          delay: spacing,
          xMin: group.xRange[0],
          xMax: group.xRange[1],
        });
      }
    });

    // Shuffle
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }
  }

  // Called when boss is defeated — advance to next level
  onBossDefeated() {
    this.bossDefeated = true;
    this.bossSpawned = false;

    if (this.level >= this.maxLevel) {
      this.gameComplete = true;
      return;
    }

    this.level++;
    this.waveIndexInLevel = 0;
    this.waveDelayTimer = 3; // Longer pause between levels
    this.levelUpShown = false;
    this.bossDefeated = false;
    this.buildQueue();
  }

  update(dt, enemies, W) {
    if (this.gameComplete) return;

    // Delay between waves
    if (this.waveDelayTimer > 0) {
      this.waveDelayTimer -= dt;
      return;
    }

    // Boss wave — handled externally
    if (this.isBossWave) return;

    // Spawn enemies
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const entry = this.spawnQueue.shift();
        const x = entry.xMin * W + Math.random() * (entry.xMax - entry.xMin) * W;
        const enemy = new Enemy(x, -30, entry.type);
        // Scale enemy stats with level
        enemy.speed *= this.speedMultiplier;
        enemy.shootRate = Math.max(0.5, enemy.shootRate / this.speedMultiplier);
        enemy.score = Math.floor(enemy.score * (1 + (this.level - 1) * 0.1));
        enemies.push(enemy);
        this.spawnTimer = entry.delay;
      }
    }

    // Check if wave cleared — advance to next wave
    if (this.spawnQueue.length === 0 && enemies.length === 0) {
      this.waveIndexInLevel++;
      this.waveDelayTimer = this.waveDelay;
      this.buildQueue();
    }
  }
}
