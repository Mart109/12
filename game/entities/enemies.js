// Враги: фабрика, поведение, отрисовка, урон
// Зависит от CONFIG (config.js) и spawnBurst (bullets.js)

function createEnemy(type, x, y, level) {
  const cfg = CONFIG.enemyTypes[type];
  if (!cfg) return null;
  const hpScale = 1 + (level - 1) * 0.15;
  return {
    type: type,
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    r: cfg.radius,
    hp: Math.round(cfg.hp * hpScale),
    maxHp: Math.round(cfg.hp * hpScale),
    speed: cfg.speed,
    color: cfg.color,
    damage: cfg.damage,
    shootTimer: cfg.shootInterval || 0,
    hitFlash: 0,
    angle: 0
  };
}

function updateEnemy(e, dt, player, bullets) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  if (e.type === 'shooter') {
    // держит дистанцию ~220px
    const want = 220;
    const push = dist > want ? 1 : -1;
    e.vx = nx * e.speed * push;
    e.vy = ny * e.speed * push;
    e.shootTimer -= dt;
    if (e.shootTimer <= 0 && dist < 520) {
      e.shootTimer = CONFIG.enemyTypes.shooter.shootInterval;
      bullets.push({
        x: e.x, y: e.y,
        vx: nx * 260, vy: ny * 260,
        r: 5, life: 3, damage: e.damage,
        hostile: true, color: '#ff5c8a'
      });
    }
  } else {
    e.vx = nx * e.speed;
    e.vy = ny * e.speed;
  }

  e.x += e.vx * dt;
  e.y += e.vy * dt;
  e.angle = Math.atan2(dy, dx);
  if (e.hitFlash > 0) e.hitFlash -= dt;
}

function damageEnemy(e, dmg, particles) {
  e.hp -= dmg;
  e.hitFlash = 0.12;
  if (e.hp > 0) return false;

  // смерть
  spawnBurst(particles, e.x, e.y, e.color, 14);
  if (e.type === 'splitter') {
    for (let i = 0; i < 2; i++) {
      const child = createEnemy('chaser', e.x + (i ? 14 : -14), e.y, 1);
      if (child) {
        child.r = 9;
        child.speed = 150;
        child.hp = 1;
        child.maxHp = 1;
        child.isChild = true;
        e.children = e.children || [];
        e.children.push(child);
      }
    }
  }
  return true;
}

function drawEnemy(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.angle);
  const col = e.hitFlash > 0 ? '#ffffff' : e.color;
  ctx.shadowBlur = 14;
  ctx.shadowColor = col;
  ctx.strokeStyle = col;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;

  const r = e.r;
  ctx.beginPath();
  if (e.type === 'chaser') {
    ctx.moveTo(r, 0);
    ctx.lineTo(-r * 0.8, r * 0.7);
    ctx.lineTo(-r * 0.8, -r * 0.7);
    ctx.closePath();
  } else if (e.type === 'tank') {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else if (e.type === 'shooter') {
    ctx.moveTo(r, 0);
    ctx.lineTo(0, r * 0.8);
    ctx.lineTo(-r, 0);
    ctx.lineTo(0, -r * 0.8);
    ctx.closePath();
  } else {
    ctx.rect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // полоска здоровья у танка
  if (e.type === 'tank' && e.hp < e.maxHp) {
    const w = e.r * 2;
    const p = Math.max(0, e.hp / e.maxHp);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w, 4);
    ctx.fillStyle = '#7cffb2';
    ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w * p, 4);
    ctx.restore();
  }
}
