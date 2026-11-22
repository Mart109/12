// ============================================================
// Часть 2: обновление мира
// ============================================================

function updatePlayer(dt) {
  const p = game.player;
  if (!p) return;

  let dx = 0;
  let dy = 0;
  let hasInput = false;

  // Клавиатура
  if (game.keys['w'] || game.keys['arrowup']) { dy -= 1; hasInput = true; }
  if (game.keys['s'] || game.keys['arrowdown']) { dy += 1; hasInput = true; }
  if (game.keys['a'] || game.keys['arrowleft']) { dx -= 1; hasInput = true; }
  if (game.keys['d'] || game.keys['arrowright']) { dx += 1; hasInput = true; }

  // Джойстик перекрывает клавиатуру, если он активен
  if (stick.active && (Math.abs(stick.dx) > 0.12 || Math.abs(stick.dy) > 0.12)) {
    dx = stick.dx;
    dy = stick.dy;
    hasInput = true;
  }

  // Мышь или палец: идём к точке, пока до неё далеко
  if (!hasInput && pointer.active) {
    const tx = pointer.x - p.x;
    const ty = pointer.y - p.y;
    const dist = Math.hypot(tx, ty);
    if (dist > 4) {
      dx = tx / dist;
      dy = ty / dist;
      hasInput = true;
    }
  }

  const len = Math.hypot(dx, dy);
  const moving = len > 0.12;

  if (moving) {
    dx /= len;
    dy /= len;
  }

  let speed = p.speed * Bonuses.speedMultiplier();
  if (p.dashTime > 0) speed *= 2.4;

  p.vx = dx * speed;
  p.vy = dy * speed;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  p.x = Math.max(p.radius, Math.min(W - p.radius, p.x));
  p.y = Math.max(p.radius, Math.min(H - p.radius, p.y));

  if (p.dashTime > 0) p.dashTime -= dt;
  if (p.dashCooldown > 0) p.dashCooldown -= dt;
  if (p.invuln > 0) p.invuln -= dt;

  // Энергия: тратится при движении, копится в покое
  if (moving && p.dashTime <= 0) {
    p.energy = Math.max(0, p.energy - CONFIG.moveDrain * dt);
  } else if (!moving) {
    p.energy = Math.min(p.maxEnergy, p.energy + Bonuses.energyRegen() * dt);
  } else {
    p.energy = Math.min(p.maxEnergy, p.energy + Bonuses.energyRegen() * 0.5 * dt);
  }
}

function tryDash() {
  const p = game.player;
  if (!p) return;
  if (p.dashCooldown > 0 || p.energy < CONFIG.dashCost) return;

  p.dashTime = CONFIG.dashDuration;
  p.dashCooldown = Bonuses.dashCooldown();
  p.energy -= CONFIG.dashCost;
  p.invuln = Math.max(p.invuln, 0.22);
  game.shake = Math.max(game.shake, 4);

  // Рывок с пробитием сбивает врагов на пути
  if (isOwned('pierce')) {
    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const e = game.enemies[i];
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < p.radius + e.radius + 18) {
        hitEnemy(e, 1);
      }
    }
  }
}

function updateEnemies(dt) {
  const p = game.player;
  if (!p) return;

  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const e = game.enemies[i];
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    if (e.hitFlash > 0) e.hitFlash -= dt;

    if (e.behavior === 'straight') {
      // Прямолинейные: летят по своему вектору, не сворачивают к игроку
      e.phase += dt;
      e.spinAngle += e.spin * dt;

      let mx = e.dirX;
      let my = e.dirY;

      // Дух покачивается поперёк движения
      if (e.wobble > 0) {
        const sway = Math.sin(e.phase * 3) * e.wobble;
        mx += -e.dirY * sway;
        my += e.dirX * sway;
        const l = Math.hypot(mx, my) || 1;
        mx /= l;
        my /= l;
      }

      e.x += mx * e.speed * dt;
      e.y += my * e.speed * dt;
      e.angle = Math.atan2(my, mx);

      // Улетел за край — удаляем
      const margin = e.radius + 60;
      if (e.x < -margin || e.x > W + margin || e.y < -margin || e.y > H + margin) {
        game.enemies.splice(i, 1);
        continue;
      }
    } else if (e.type === 'shooter') {
      // Держит дистанцию и стреляет
      const cfg = CONFIG.enemyTypes.shooter;
      const keep = cfg.keepDistance || 220;
      if (dist > keep + 20) {
        e.x += nx * e.speed * dt;
        e.y += ny * e.speed * dt;
      } else if (dist < keep - 20) {
        e.x -= nx * e.speed * dt;
        e.y -= ny * e.speed * dt;
      }

      e.angle = Math.atan2(dy, dx);

      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && dist < 520) {
        e.shootTimer = cfg.shootInterval;
        spawnEnemyBullet(e.x, e.y, p.x, p.y, cfg.bulletSpeed || 220);
      }
    } else {
      // chaser, tank и осколки сплиттера — просто идут на игрока
      e.x += nx * e.speed * dt;
      e.y += ny * e.speed * dt;
      e.angle = Math.atan2(dy, dx);
    }

    // Столкновение с игроком
    if (dist < e.radius + p.radius) {
      if (p.invuln <= 0) {
        damagePlayer();
      }
      // Отталкиваем врага, чтобы не залипал
      e.x -= nx * 6;
      e.y -= ny * 6;
    }
  }
}

function updateEnemyBullets(dt) {
  const p = game.player;
  for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
    const b = game.enemyBullets[i];
    b.update(dt);

    if (b.dead || b.x < -40 || b.x > W + 40 || b.y < -40 || b.y > H + 40) {
      game.enemyBullets.splice(i, 1);
      continue;
    }

    if (p && p.invuln <= 0) {
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < b.radius + p.radius) {
        game.enemyBullets.splice(i, 1);
        damagePlayer();
      }
    }
  }
}

function damagePlayer() {
  const p = game.player;
  if (!p) return;

  if (p.shield > 0) {
    p.shield -= 1;
    p.invuln = 1.0;
    game.shake = Math.max(game.shake, 8);
    spawnBurst(p.x, p.y, '#5ad1ff', 16);
    return;
  }

  if (p.lives > 1) {
    p.lives -= 1;
    p.invuln = 1.4;
    game.shake = Math.max(game.shake, 10);
    spawnBurst(p.x, p.y, '#ff5a5a', 20);
    return;
  }

  game.over = true;
  game.running = false;
  game.shake = 14;
  spawnBurst(p.x, p.y, '#ff5a5a', 30);

  if (typeof finishRun === 'function') {
    const result = finishRun(game.score, game.level, game.time);
    if (typeof UI !== 'undefined') {
      UI.showResults(result);
      UI.showDead(true);
    }
  }
}

function updateBonuses(dt) {
  const p = game.player;
  if (!p) return;

  const magnet = Bonuses.magnetRadius();

  for (let i = game.bonuses.length - 1; i >= 0; i--) {
    const b = game.bonuses[i];
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (magnet > 0 && dist < magnet) {
      b.x += (dx / dist) * 260 * dt;
      b.y += (dy / dist) * 260 * dt;
    }

    if (dist < p.radius + b.radius) {
      game.bonuses.splice(i, 1);
      game.score += Bonuses.particleValue();
      p.energy = Math.min(p.maxEnergy, p.energy + 20);
      spawnBurst(b.x, b.y, '#7dff9b', 8);
    }
  }
}

function updateParticles(dt) {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const pt = game.particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.94;
    pt.vy *= 0.94;
    pt.life -= dt;
    if (pt.life <= 0) game.particles.splice(i, 1);
  }
}

function updateSpawner(dt) {
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    game.spawnTimer = Math.max(CONFIG.enemySpawnMin, game.spawnInterval - game.level * 0.04);
    spawnEnemy();
  }

  // Уровень растёт со временем
  const newLevel = 1 + Math.floor(game.time / CONFIG.levelDuration);
  if (newLevel > game.level && game.level < CONFIG.maxLevel) {
    game.level = newLevel;
  }

  // Бонусы появляются иногда
  if (Math.random() < dt * 0.6 && game.bonuses.length < 6) {
    game.bonuses.push({
      x: 40 + Math.random() * (W - 80),
      y: 40 + Math.random() * (H - 80),
      radius: CONFIG.particleRadius
    });
  }
}

function update(dt) {
  game.time += dt;
  if (game.comboTimer > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;
  }
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 30);

  updatePlayer(dt);
  updateEnemies(dt);
  updateEnemyBullets(dt);
  updateBonuses(dt);
  updateParticles(dt);
  updateSpawner(dt);
}
