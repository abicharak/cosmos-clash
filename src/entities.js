// Entity classes: Player, Bullet, Enemy, Boss, Powerup

import { playShoot } from './audio.js';

// ---- Player ----
export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 28; this.h = 32;
    this.speed = 320;
    this.shootCooldown = 0;
    this.shootRate = 0.18;
    this.invincible = 0;
    this.powerLevel = 0; // 0=single, 1=double, 2=triple
    this.powerTimer = 0;
  }

  update(dt, keys, W, H) {
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) dx = -1;
    if (keys['ArrowRight'] || keys['KeyD']) dx = 1;
    if (keys['ArrowUp'] || keys['KeyW']) dy = -1;
    if (keys['ArrowDown'] || keys['KeyS']) dy = 1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.x += (dx / len) * this.speed * dt;
    this.y += (dy / len) * this.speed * dt;
    this.x = Math.max(this.w / 2, Math.min(W - this.w / 2, this.x));
    this.y = Math.max(60 + this.h / 2, Math.min(H - this.h / 2, this.y));
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    if (this.invincible > 0) this.invincible -= dt;
    if (this.powerTimer > 0) {
      this.powerTimer -= dt;
      if (this.powerTimer <= 0) this.powerLevel = 0;
    }
  }

  shoot(bullets) {
    if (this.shootCooldown > 0) return;
    this.shootCooldown = this.shootRate;
    playShoot();
    bullets.push(new Bullet(this.x, this.y - this.h / 2, 0, -600, '#00fff7', true));
    if (this.powerLevel >= 1) {
      bullets.push(new Bullet(this.x - 12, this.y - this.h / 2 + 5, 0, -600, '#00fff7', true));
      bullets.push(new Bullet(this.x + 12, this.y - this.h / 2 + 5, 0, -600, '#00fff7', true));
    }
    if (this.powerLevel >= 2) {
      bullets.push(new Bullet(this.x - 8, this.y - this.h / 2, -80, -580, '#39ff14', true));
      bullets.push(new Bullet(this.x + 8, this.y - this.h / 2, 80, -580, '#39ff14', true));
    }
  }

  draw(ctx) {
    if (this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    // Engine glow
    const glowGrad = ctx.createRadialGradient(0, this.h / 2 + 4, 0, 0, this.h / 2 + 4, 14);
    glowGrad.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
    glowGrad.addColorStop(0.5, 'rgba(255, 50, 0, 0.3)');
    glowGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(-14, this.h / 2 - 2, 28, 20);
    // Ship body
    ctx.fillStyle = '#00fff7';
    ctx.shadowColor = '#00fff7';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -this.h / 2);
    ctx.lineTo(-this.w / 2, this.h / 2);
    ctx.lineTo(-4, this.h / 2 - 6);
    ctx.lineTo(0, this.h / 2);
    ctx.lineTo(4, this.h / 2 - 6);
    ctx.lineTo(this.w / 2, this.h / 2);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(-3, -4, 6, 8);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ---- Bullet ----
export class Bullet {
  constructor(x, y, vx, vy, color, isPlayer) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.isPlayer = isPlayer;
    this.w = isPlayer ? 3 : 4;
    this.h = isPlayer ? 10 : 8;
    this.dead = false;
  }

  update(dt, H) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y < -20 || this.y > H + 20 || this.x < -20 || this.x > 2000) this.dead = true;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    ctx.shadowBlur = 0;
  }
}

// ---- Enemy ----
export class Enemy {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.type = type; // 'grunt', 'zigzag', 'tank'
    this.time = Math.random() * 6;
    this.dead = false;
    this.spawnY = y;

    if (type === 'grunt') {
      this.w = 22; this.h = 22; this.hp = 1; this.speed = 80; this.score = 100;
      this.color = '#ff3131'; this.shootRate = 2.5;
    } else if (type === 'zigzag') {
      this.w = 20; this.h = 20; this.hp = 1; this.speed = 100; this.score = 150;
      this.color = '#ffe100'; this.shootRate = 3;
    } else {
      this.w = 28; this.h = 26; this.hp = 3; this.speed = 50; this.score = 300;
      this.color = '#ff00ff'; this.shootRate = 1.8;
    }
    this.shootTimer = Math.random() * this.shootRate;
  }

  update(dt, W, H, bullets) {
    this.time += dt;
    this.y += this.speed * dt;

    if (this.type === 'zigzag') {
      this.x += Math.sin(this.time * 3) * 120 * dt;
    }

    this.x = Math.max(this.w / 2, Math.min(W - this.w / 2, this.x));
    if (this.y > H + 40) this.dead = true;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = this.shootRate + Math.random() * 0.5;
      bullets.push(new Bullet(this.x, this.y + this.h / 2, 0, 280, '#ff3131', false));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    // Simple diamond shape
    ctx.beginPath();
    ctx.moveTo(0, -this.h / 2);
    ctx.lineTo(this.w / 2, 0);
    ctx.lineTo(0, this.h / 2);
    ctx.lineTo(-this.w / 2, 0);
    ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  }
}

// ---- Boss ----
export class Boss {
  constructor(W, config) {
    this.x = W / 2; this.y = -80;
    this.targetY = 100;
    this.w = 90; this.h = 60;
    this.maxHp = config.hp || 60;
    this.hp = this.maxHp;
    this.speed = config.speed || 80;
    this.time = 0;
    this.phase = 0; // 0=enter, 1=fight
    this.shootTimer = 0;
    this.dead = false;
    this.score = config.score || 5000;
    this.dir = 1;
    this.shootRate = config.shootRate || 0.7;
    this.spread = config.spread || 3;
    // Colors
    this.bodyColor = config.bodyColor || '#ff00ff';
    this.coreColor = config.coreColor || '#ffe100';
    this.eyeColor = config.eyeColor || '#ff3131';
    this.bulletColor = config.bulletColor || '#ffe100';
  }

  update(dt, W, H, bullets) {
    this.time += dt;
    if (this.phase === 0) {
      this.y += 60 * dt;
      if (this.y >= this.targetY) { this.y = this.targetY; this.phase = 1; }
      return;
    }
    // Movement
    this.x += this.dir * this.speed * dt;
    if (this.x > W - this.w / 2 - 20) this.dir = -1;
    if (this.x < this.w / 2 + 20) this.dir = 1;
    this.y = this.targetY + Math.sin(this.time * 1.5) * 20;

    // Shooting patterns
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      const enraged = this.hp < this.maxHp / 2;
      this.shootTimer = enraged ? this.shootRate * 0.6 : this.shootRate;
      const spread = enraged ? this.spread + 2 : this.spread;
      for (let i = 0; i < spread; i++) {
        const angle = ((i - (spread - 1) / 2) * 0.25) + Math.PI / 2;
        const spd = 220 + (this.speed - 80) * 0.5;
        bullets.push(new Bullet(
          this.x, this.y + this.h / 2,
          Math.cos(angle) * spd, Math.sin(angle) * spd,
          this.bulletColor, false
        ));
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Main body
    ctx.fillStyle = this.bodyColor;
    ctx.shadowColor = this.bodyColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(0, -this.h / 2);
    ctx.lineTo(this.w / 2, -this.h / 4);
    ctx.lineTo(this.w / 2 + 10, this.h / 4);
    ctx.lineTo(this.w / 4, this.h / 2);
    ctx.lineTo(-this.w / 4, this.h / 2);
    ctx.lineTo(-this.w / 2 - 10, this.h / 4);
    ctx.lineTo(-this.w / 2, -this.h / 4);
    ctx.closePath();
    ctx.fill();
    // Core
    ctx.fillStyle = this.coreColor;
    ctx.shadowColor = this.coreColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = this.eyeColor;
    ctx.shadowColor = this.eyeColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(-18, -8, 8, 6);
    ctx.fillRect(10, -8, 8, 6);
    ctx.shadowBlur = 0;
    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(-40, -this.h / 2 - 14, 80, 6);
    ctx.fillStyle = this.hp > this.maxHp / 3 ? '#39ff14' : '#ff3131';
    ctx.fillRect(-40, -this.h / 2 - 14, 80 * (this.hp / this.maxHp), 6);
    ctx.restore();
  }
}

// ---- Powerup ----
export class Powerup {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 16; this.h = 16;
    this.speed = 100;
    this.time = 0;
    this.dead = false;
  }

  update(dt, H) {
    this.y += this.speed * dt;
    this.time += dt;
    if (this.y > H + 20) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = 0.8 + Math.sin(this.time * 6) * 0.2;
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#39ff14';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 16;
    ctx.fillRect(-this.w / 2, -3, this.w, 6);
    ctx.fillRect(-3, -this.h / 2, 6, this.h);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
