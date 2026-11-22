// Снаряды и частицы
class Bullet {
  constructor(x, y, vx, vy, damage = 1, opts = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.life = opts.life !== undefined ? opts.life : 4;
    this.dead = false;
    this.radius = opts.radius !== undefined ? opts.radius : 5;
    this.color = opts.color || '#d9b3ff';
    this.glow = opts.glow || '#b06bff';
    this.coreColor = opts.coreColor || null;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.glow;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.coreColor) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = this.coreColor;
      ctx.fill();
    }
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 180;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 0.5 + Math.random() * 0.4;
    this.maxLife = this.life;
    this.color = color;
    this.dead = false;
    this.size = 2 + Math.random() * 3;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function spawnBurst(particles, x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}
