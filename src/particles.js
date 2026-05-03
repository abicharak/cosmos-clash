// Particle & star field rendering utilities

export class Particle {
  constructor(x, y, color, speed, life, size) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * speed;
    this.vy = (Math.random() - 0.5) * speed;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size || 2;
  }

  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.life -= dt;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.globalAlpha = 1;
  }

  get dead() { return this.life <= 0; }
}

export function spawnExplosion(particles, x, y, count, colors) {
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new Particle(x, y, color, 3 + Math.random() * 4, 0.4 + Math.random() * 0.5, 2 + Math.random() * 2));
  }
}

export class StarField {
  constructor(width, height, count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.3 + Math.random() * 1.5,
        size: Math.random() < 0.1 ? 2 : 1,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
  }

  resize(width, height) {
    this.stars.forEach(s => {
      if (s.x > width) s.x = Math.random() * width;
      if (s.y > height) s.y = Math.random() * height;
    });
  }

  update(dt, height) {
    this.stars.forEach(s => {
      s.y += s.speed * dt * 60;
      if (s.y > height) { s.y = 0; s.x = Math.random() * height * 1.5; }
    });
  }

  draw(ctx) {
    this.stars.forEach(s => {
      ctx.globalAlpha = s.brightness;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    });
    ctx.globalAlpha = 1;
  }
}
