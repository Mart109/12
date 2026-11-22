// ============================================================
// Часть 3: отрисовка
// ============================================================

function drawBackground() {
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(90, 209, 255, 0.06)';
  ctx.lineWidth = 1;
  const step = 48;
  for (let x = 0; x < W; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  const p = game.player;
  if (!p) return;

  ctx.save();
  ctx.translate(p.x, p.y);

  if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Щит
  if (p.shield > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#5ad1ff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Корпус
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = p.dashTime > 0 ? '#ffffff' : '#5ad1ff';
  ctx.fill();

  // Ядро
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0e17';
  ctx.fill();

  ctx.restore();
}

// Дух: капля с хвостом и двумя глазами, полупрозрачная
function drawSpirit(e, color) {
  const r = e.radius;
  ctx.globalAlpha = 0.75;

  // Тело-капля
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.bezierCurveTo(r * 0.6, r * 0.9, -r * 0.4, r * 0.9, -r, 0);
  ctx.bezierCurveTo(-r * 0.4, -r * 0.9, r * 0.6, -r * 0.9, r, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Хвост-волна
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, 0);
  ctx.quadraticCurveTo(-r * 1.6, r * 0.4, -r * 2.1, 0);
  ctx.quadraticCurveTo(-r * 1.6, -r * 0.4, -r * 0.9, 0);
  ctx.fillStyle = color;
  ctx.fill();

  // Глаза
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0a0e17';
  ctx.beginPath();
  ctx.arc(r * 0.15, -r * 0.25, r * 0.16, 0, Math.PI * 2);
  ctx.arc(r * 0.15, r * 0.25, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

// Шип: острый треугольник с обводкой, вращается
function drawSpike(e, color) {
  const r = e.radius;
  ctx.rotate(e.spinAngle);

  ctx.beginPath();
  ctx.moveTo(r * 1.4, 0);
  ctx.lineTo(-r * 0.7, r * 0.8);
  ctx.lineTo(-r * 0.3, 0);
  ctx.lineTo(-r * 0.7, -r * 0.8);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawEnemyShape(e) {
  const r = e.radius;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.angle);

  const color = e.hitFlash > 0 ? '#ffffff' : e.color;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  if (e.type === 'spirit') {
    drawSpirit(e, color);
  } else if (e.type === 'spike') {
    drawSpike(e, color);
  } else if (e.type === 'tank') {
    // Квадрат
    ctx.fillRect(-r, -r, r * 2, r * 2);
  } else if (e.type === 'shooter') {
    // Ромб
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.lineTo(0, -r);
    ctx.closePath();
    ctx.fill();
  } else if (e.type === 'splitter') {
    // Звезда
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rad = i % 2 === 0 ? r : r * 0.5;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    // Треугольник
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(-r * 0.7, r * 0.8);
    ctx.lineTo(-r * 0.7, -r * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Полоска хп для тех, у кого больше 1
  if (e.maxHp > 1 && e.hp < e.maxHp) {
    const w = e.radius * 2;
    const h = 3;
    const x = e.x - e.radius;
    const y = e.y - e.radius - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ff5a5a';
    ctx.fillRect(x, y, w * (e.hp / e.maxHp), h);
  }
}

function drawEnemies() {
  for (const e of game.enemies) {
    drawEnemyShape(e);
  }
}

function drawEnemyBullets() {
  for (const b of game.enemyBullets) {
    b.draw(ctx);
  }
}

function drawBonuses() {
  for (const b of game.bonuses) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#7dff9b';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0e17';
    ctx.fill();
  }
}

function drawParticles() {
  for (const pt of game.particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
}

function drawHUD() {
  // HTML-HUD в index.html показывает очки, уровень, время и энергию.
  // На канвасе рисуем только комбо-вспышку, чтобы не дублировать.
  if (game.combo > 1) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd75a';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('x' + game.combo, W / 2, 34);
    ctx.restore();
  }
}

function render() {
  ctx.save();

  if (game.shake > 0) {
    const sx = (Math.random() - 0.5) * game.shake;
    const sy = (Math.random() - 0.5) * game.shake;
    ctx.translate(sx, sy);
  }

  drawBackground();
  drawBonuses();
  drawEnemies();
  drawEnemyBullets();
  drawParticles();
  drawPlayer();

  ctx.restore();

  drawHUD();

  if (game.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e8f4ff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ПАУЗА', W / 2, H / 2);
  }
}
