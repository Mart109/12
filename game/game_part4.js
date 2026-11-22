// ============================================================
// Часть 4: цикл, запуск, ввод
// ============================================================

function loop(timestamp) {
  if (!game.lastFrame) game.lastFrame = timestamp;
  let dt = (timestamp - game.lastFrame) / 1000;
  game.lastFrame = timestamp;
  if (dt > 0.1) dt = 0.1;

  if (game.running && !game.paused && !game.over) {
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
}

function startGame() {
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
  pointer.active = false;
  stickEnd();
  if (typeof UI !== 'undefined') {
    UI.showPause(false);
    UI.showDead(false);
  }
}

function togglePause() {
  if (!game.running || game.over) return;
  game.paused = !game.paused;
  if (!game.paused) game.lastFrame = 0;
  if (typeof UI !== 'undefined') {
    UI.showPause(game.paused);
  }
}

// ============================================================
// Ввод: клавиатура + мышь + тач
// ============================================================

const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

// Виртуальный джойстик
const stick = {
  active: false,
  id: null,
  baseX: 0,
  baseY: 0,
  dx: 0,
  dy: 0,
  radius: 60
};

const stickEl = document.getElementById('stick');
const stickKnob = document.getElementById('stickKnob');
const dashBtn = document.getElementById('dashBtn');

function stickStart(e) {
  const t = e.changedTouches ? e.changedTouches[0] : e;
  stick.active = true;
  stick.id = t.identifier !== undefined ? t.identifier : 'mouse';
  const rect = stickEl.getBoundingClientRect();
  stick.baseX = rect.left + rect.width / 2;
  stick.baseY = rect.top + rect.height / 2;
  stickMove(e);
}

function stickMove(e) {
  if (!stick.active) return;
  const touches = e.changedTouches ? Array.from(e.changedTouches) : [e];
  const t = touches.find(function (x) {
    const id = x.identifier !== undefined ? x.identifier : 'mouse';
    return id === stick.id;
  });
  if (!t) return;

  let dx = t.clientX - stick.baseX;
  let dy = t.clientY - stick.baseY;
  const len = Math.hypot(dx, dy);
  const max = stick.radius;

  if (len > max) {
    dx = (dx / len) * max;
    dy = (dy / len) * max;
  }

  stick.dx = dx / max;
  stick.dy = dy / max;

  if (stickKnob) {
    stickKnob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
  }
}

function stickEnd() {
  if (!stick.active) return;
  stick.active = false;
  stick.id = null;
  stick.dx = 0;
  stick.dy = 0;
  if (stickKnob) {
    stickKnob.style.transform = 'translate(0px, 0px)';
  }
}

if (stickEl) {
  stickEl.addEventListener('touchstart', function (e) { e.preventDefault(); stickStart(e); }, { passive: false });
  stickEl.addEventListener('touchmove', function (e) { e.preventDefault(); stickMove(e); }, { passive: false });
  stickEl.addEventListener('touchend', function (e) { e.preventDefault(); stickEnd(); }, { passive: false });
  stickEl.addEventListener('touchcancel', function (e) { e.preventDefault(); stickEnd(); }, { passive: false });
}

if (dashBtn) {
  dashBtn.addEventListener('touchstart', function (e) {
    e.preventDefault();
    tryDash();
  }, { passive: false });
  dashBtn.addEventListener('click', function (e) {
    e.preventDefault();
    tryDash();
  });
}

// --- Мышь и палец по канвасу: игрок идёт к курсору ---

function canvasPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

canvas.addEventListener('mousemove', function (e) {
  const pt = canvasPoint(e.clientX, e.clientY);
  pointer.active = true;
  pointer.x = pt.x;
  pointer.y = pt.y;
});

canvas.addEventListener('mouseleave', function () {
  pointer.active = false;
});

canvas.addEventListener('touchstart', function (e) {
  e.preventDefault();
  const t = e.changedTouches[0];
  const pt = canvasPoint(t.clientX, t.clientY);
  pointer.active = true;
  pointer.x = pt.x;
  pointer.y = pt.y;
}, { passive: false });

canvas.addEventListener('touchmove', function (e) {
  e.preventDefault();
  const t = e.changedTouches[0];
  const pt = canvasPoint(t.clientX, t.clientY);
  pointer.active = true;
  pointer.x = pt.x;
  pointer.y = pt.y;
}, { passive: false });

canvas.addEventListener('touchend', function (e) {
  e.preventDefault();
  pointer.active = false;
}, { passive: false });

canvas.addEventListener('touchcancel', function () {
  pointer.active = false;
});

// --- Клавиатура ---

window.addEventListener('keydown', function (e) {
  const k = e.key.toLowerCase();
  game.keys[k] = true;

  if (k === ' ' || k === 'shift') {
    e.preventDefault();
    tryDash();
  }
  if (k === 'p' || k === 'escape') {
    e.preventDefault();
    togglePause();
  }
});

window.addEventListener('keyup', function (e) {
  game.keys[e.key.toLowerCase()] = false;
});

// При потере фокуса окна сбрасываем зажатые клавиши
window.addEventListener('blur', function () {
  game.keys = {};
  pointer.active = false;
  stickEnd();
});
