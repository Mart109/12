# -*- coding: utf-8 -*-
import io, os, re

path = r"D:\МОЗГ\workspace\game\game.js"
with io.open(path, "r", encoding="utf-8") as f:
    src = f.read()

orig = src

# --- 1. makePlayer: подключаем бонусы из магазина ---
old_player = """    energy: CONFIG.energyMax,
    maxEnergy: CONFIG.energyMax,
    dashTime: 0,
    dashCooldown: 0,
    invuln: 0,
    shield: 0,
    lives: 1
  };"""
new_player = """    energy: Bonuses.energyMax(),
    maxEnergy: Bonuses.energyMax(),
    dashTime: 0,
    dashCooldown: 0,
    invuln: 0,
    shield: Bonuses.hasShield() ? 1 : 0,
    lives: Bonuses.hasExtraLife() ? 2 : 1
  };"""
assert old_player in src, "makePlayer не найден"
src = src.replace(old_player, new_player)

# --- 2. damagePlayer: показываем экран смерти через UI ---
old_death = """  game.over = true;
  game.running = false;
  game.shake = 14;
  spawnBurst(p.x, p.y, '#ff5a5a', 30);
  if (typeof finishRun === 'function') {
    finishRun(game.score, game.level, game.time);
  }
}"""
new_death = """  game.over = true;
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
}"""
assert old_death in src, "damagePlayer не найден"
src = src.replace(old_death, new_death)

# --- 3. drawHUD: убираем дублирующий канвас-HUD, оставляем только комбо ---
old_hud_start = "function drawHUD() {"
idx = src.find(old_hud_start)
assert idx != -1, "drawHUD не найден"
# находим конец функции drawHUD (следующая "\nfunction render()")
end_marker = "\nfunction render() {"
end_idx = src.find(end_marker, idx)
assert end_idx != -1, "конец drawHUD не найден"

new_hud = """function drawHUD() {
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
"""
src = src[:idx] + new_hud + src[end_idx:]

# --- 4. loop: синхронизируем State и UI каждый кадр ---
old_loop = """  if (game.running && !game.paused && !game.over) {
    update(dt);
  }

  render();

  if (game.running || game.over) {
    requestAnimationFrame(loop);
  }
}"""
new_loop = """  if (game.running && !game.paused && !game.over) {
    update(dt);
  }

  render();
  syncUI();

  if (game.running || game.over) {
    requestAnimationFrame(loop);
  }
}

// Передаём данные игры в State и HTML-HUD
function syncUI() {
  if (typeof State === 'undefined' || typeof UI === 'undefined') return;

  State.run.score = game.score;
  State.run.level = game.level;
  State.run.time = game.time;
  State.run.combo = game.combo > 1 ? game.combo : 1;
  State.run.alive = !game.over;
  State.run.paused = game.paused;

  UI.updateHud();
  if (game.player) {
    UI.updateEnergy(game.player.energy, game.player.maxEnergy);
  }
}"""
assert old_loop in src, "loop не найден"
src = src.replace(old_loop, new_loop)

# --- 5. togglePause: показываем оверлей паузы ---
old_pause = """function togglePause() {
  if (!game.running || game.over) return;
  game.paused = !game.paused;
  if (!game.paused) game.lastFrame = 0;
}"""
new_pause = """function togglePause() {
  if (!game.running || game.over) return;
  game.paused = !game.paused;
  if (!game.paused) game.lastFrame = 0;
  if (typeof UI !== 'undefined') {
    UI.showPause(game.paused);
  }
}"""
assert old_pause in src, "togglePause не найден"
src = src.replace(old_pause, new_pause)

# --- 6. startGame: сбрасываем оверлеи ---
old_start = """function startGame() {
  resizeCanvas();
  resetField();
  game.player = makePlayer();
  game.running = true;
  game.lastFrame = 0;
  requestAnimationFrame(loop);
}"""
new_start = """function startGame() {
  resizeCanvas();
  resetField();
  game.player = makePlayer();
  game.running = true;
  game.lastFrame = 0;

  if (typeof UI !== 'undefined') {
    UI.showPause(false);
    UI.showDead(false);
  }

  requestAnimationFrame(loop);
}

// Остановка игры и возврат в меню
function stopGame() {
  game.running = false;
  game.paused = false;
  game.over = false;
  game.keys = {};
  if (typeof UI !== 'undefined') {
    UI.showPause(false);
    UI.showDead(false);
  }
}"""
assert old_start in src, "startGame не найден"
src = src.replace(old_start, new_start)

# --- 7. Экспорт: добавляем stop ---
old_export = """window.GPLab = {
  start: startGame,
  pause: togglePause,
  state: game
};"""
new_export = """window.GPLab = {
  start: startGame,
  pause: togglePause,
  stop: stopGame,
  state: game
};"""
assert old_export in src, "экспорт не найден"
src = src.replace(old_export, new_export)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Правок применено: 7")
print("Было символов:", len(orig), "стало:", len(src))
