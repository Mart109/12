// pickups.js — бонусы, выпадающие из врагов
// Типы: heal, rapid, triple, shield

const PICKUP_TYPES = {
  heal:   { color: '#3dff8b', label: '+',  life: 12, radius: 11 },
  rapid:  { color: '#ffd93d', label: 'R',  life: 12, radius: 11 },
  triple: { color: '#ff6bd6', label: '3',  life: 12, radius: 11 },
  shield: { color: '#4dc9ff', label: 'S',  life: 12, radius: 11 }
};

const DROP_CHANCE = 0.22;

function maybeDropPickup(x, y, particles) {
  if (Math.random() > DROP_CHANCE) return null;
  const keys = Object.keys(PICKUP_TYPES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  return createPickup(type, x, y);
}

function createPickup(type, x, y) {
  const cfg = PICKUP_TYPES[type];
  return {
    type: type,
    x: x,
    y: y,
    radius: cfg.radius,
    color: cfg.color,
    label: cfg.label,
    life: cfg.life,
    maxLife: cfg.life,
    bob: Math.random() * Math.PI * 2,
    dead: false
  };
}

function updatePickups(pickups, dt, player, particles) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.life -= dt;
    p.bob += dt * 3;

    if (p.life <= 0) {
      pickups.splice(i, 1);
      continue;
    }

    // подбор
    const dx = player.x - p.x;
    const dy = player.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < p.radius + player.radius) {
      applyPickup(p, player, particles);
      pickups.splice(i, 1);
    }
  }
}

function applyPickup(p, player, particles) {
  switch (p.type) {
    case 'heal':
      player.hp = Math.min(player.maxHp, player.hp + 25);
      break;
    case 'rapid':
      player.rapidTimer = 8;
      break;
    case 'triple':
      player.tripleTimer = 8;
      break;
    case 'shield':
      player.shieldTimer = 6;
      break;
  }
  if (particles) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 120;
      particles.push({
        x: p.x, y: p.y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0.5, maxLife: 0.5,
        color: p.color, size: 3
      });
    }
  }
}

function drawPickups(ctx, pickups) {
  for (const p of pickups) {
    const yOff = Math.sin(p.bob) * 3;
    const alpha = p.life < 3 ? (0.35 + 0.65 * Math.abs(Math.sin(p.life * 8))) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y + yOff);

    // свечение
    ctx.shadowBlur = 16;
    ctx.shadowColor = p.color;

    // ромб
    ctx.beginPath();
    ctx.moveTo(0, -p.radius);
    ctx.lineTo(p.radius, 0);
    ctx.lineTo(0, p.radius);
    ctx.lineTo(-p.radius, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(10, 14, 26, 0.85)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = p.color;
    ctx.stroke();

    // буква
    ctx.shadowBlur = 0;
    ctx.fillStyle = p.color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.label, 0, 1);

    ctx.restore();
  }
}
