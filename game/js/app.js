/* ============================================================
   app.js — состояние, сохранения, магазин, навыки, UI
   ============================================================ */

const SAVE_KEY = 'gplab_save_v1';

/* ---------- Состояние ---------- */
const State = {
  coins: 0,
  best: 0,
  level: 1,
  sound: true,
  owned: {},
  skills: {},

  run: {
    score: 0,
    level: 1,
    time: 0,
    combo: 1,
    comboLeft: 0,
    alive: true,
    paused: false,
  },
};

/* ---------- Загрузка и сохранение ---------- */
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    State.coins = Number(data.coins) || 0;
    State.best = Number(data.best) || 0;
    State.level = Number(data.level) || 1;
    State.sound = data.sound !== false;
    State.owned = data.owned && typeof data.owned === 'object' ? data.owned : {};
    State.skills = data.skills && typeof data.skills === 'object' ? data.skills : {};
  } catch (e) {
    console.warn('Не удалось загрузить сохранение:', e);
  }
}

function saveGame() {
  try {
    const data = {
      coins: State.coins,
      best: State.best,
      level: State.level,
      sound: State.sound,
      owned: State.owned,
      skills: State.skills,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Не удалось сохранить:', e);
  }
}

/* ---------- Магазин ---------- */
function isOwned(id) {
  return State.owned[id] === true;
}

function canBuyItem(item) {
  if (item.once && isOwned(item.id)) return false;
  return State.coins >= item.price;
}

function buyItem(id) {
  const item = SHOP_ITEMS.find((it) => it.id === id);
  if (!item) return false;
  if (item.once && isOwned(item.id)) return false;
  if (State.coins < item.price) return false;

  State.coins -= item.price;
  State.owned[item.id] = true;
  saveGame();
  return true;
}

/* ---------- Навыки ---------- */
function skillLevel(id) {
  return State.skills[id] || 0;
}

function skillPrice(skill) {
  const lvl = skillLevel(skill.id);
  return skill.basePrice + skill.priceStep * lvl;
}

function canUpgradeSkill(skill) {
  const lvl = skillLevel(skill.id);
  if (lvl >= skill.maxLevel) return false;
  return State.coins >= skillPrice(skill);
}

function upgradeSkill(id) {
  const skill = SKILLS.find((s) => s.id === id);
  if (!skill) return false;

  const lvl = skillLevel(skill.id);
  if (lvl >= skill.maxLevel) return false;

  const price = skillPrice(skill);
  if (State.coins < price) return false;

  State.coins -= price;
  State.skills[skill.id] = lvl + 1;
  saveGame();
  return true;
}

/* ---------- Бонусы ---------- */
const Bonuses = {
  speedMultiplier() {
    return isOwned('speed') ? 1.08 : 1;
  },
  energyMax() {
    return CONFIG.energyMax + skillLevel('energy') * 15;
  },
  energyRegen() {
    return CONFIG.energyRegen * (1 + skillLevel('regen') * 0.12);
  },
  dashCooldown() {
    return CONFIG.dashCooldown * (1 - skillLevel('dash') * 0.08);
  },
  comboWindow() {
    return CONFIG.comboWindow + skillLevel('combo') * 0.25;
  },
  magnetRadius() {
    let r = 0;
    if (isOwned('magnet')) r += 90;
    r += skillLevel('magnet') * 20;
    return r;
  },
  particleValue() {
    return CONFIG.particleValue + skillLevel('score') * 2;
  },
  startScore() {
    return isOwned('startCoins') ? 50 : 0;
  },
  hasShield() {
    return isOwned('shield');
  },
  hasExtraLife() {
    return isOwned('life');
  },
};

/* ---------- Сброс и завершение игры ---------- */
function resetRun() {
  State.run.score = Bonuses.startScore();
  State.run.level = 1;
  State.run.time = 0;
  State.run.combo = 1;
  State.run.comboLeft = 0;
  State.run.alive = true;
  State.run.paused = false;
}

function finishRun(score, level, time) {
  const run = State.run;

  // Данные из игры пишем в состояние, иначе результаты будут нулевые
  if (typeof score === 'number') run.score = score;
  if (typeof level === 'number') run.level = level;
  if (typeof time === 'number') run.time = time;
  run.alive = false;

  const earned = Math.floor(run.score * CONFIG.coinsPerScore);

  State.coins += earned;

  let record = false;
  if (run.score > State.best) {
    State.best = run.score;
    record = true;
  }

  if (run.level > State.level) {
    State.level = run.level;
  }

  saveGame();

  return { earned, record };
}

/* ============================================================
   UI — экраны, магазин, навыки, HUD
   ============================================================ */

const UI = {
  screens: {},

  init() {
    this.screens.menu = document.getElementById('screen-menu');
    this.screens.shop = document.getElementById('screen-shop');
    this.screens.skills = document.getElementById('screen-skills');
    this.screens.game = document.getElementById('screen-game');

    this.bindMenu();
    this.bindPanels();
    this.bindGame();
    this.renderShop();
    this.renderSkills();
    this.updateMenu();
    this.updateSoundIcons();
  },

  /* ---------- Переключение экранов ---------- */
  show(name) {
    Object.keys(this.screens).forEach((key) => {
      const el = this.screens[key];
      if (!el) return;
      el.classList.toggle('active', key === name);
    });
  },

  /* ---------- Меню ---------- */
  bindMenu() {
    const menu = this.screens.menu;
    if (!menu) return;

    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      if (action === 'play') {
        this.startGame();
      } else if (action === 'shop') {
        this.renderShop();
        this.show('shop');
      } else if (action === 'skills') {
        this.renderSkills();
        this.show('skills');
      } else if (action === 'sound') {
        this.toggleSound();
      }
    });
  },

  /* ---------- Панели магазина и навыков ---------- */
  bindPanels() {
    ['shop', 'skills'].forEach((name) => {
      const screen = this.screens[name];
      if (!screen) return;

      screen.addEventListener('click', (e) => {
        const back = e.target.closest('[data-action="back-menu"]');
        if (back) {
          this.updateMenu();
          this.show('menu');
          return;
        }

        const buyBtn = e.target.closest('[data-buy]');
        if (buyBtn) {
          const id = buyBtn.dataset.buy;
          if (buyItem(id)) {
            this.renderShop();
            this.updateMenu();
          }
          return;
        }

        const upBtn = e.target.closest('[data-upgrade]');
        if (upBtn) {
          const id = upBtn.dataset.upgrade;
          if (upgradeSkill(id)) {
            this.renderSkills();
            this.updateMenu();
          }
        }
      });
    });
  },

  /* ---------- Кнопки HUD и оверлеев ---------- */
  bindGame() {
    const game = this.screens.game;
    if (!game) return;

    const btnPause = document.getElementById('btnPause');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        if (window.GPLab && window.GPLab.pause) window.GPLab.pause();
      });
    }

    const btnSound = document.getElementById('btnSound');
    if (btnSound) {
      btnSound.addEventListener('click', () => this.toggleSound());
    }

    game.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      if (action === 'resume') {
        if (window.GPLab && window.GPLab.pause) window.GPLab.pause();
      } else if (action === 'restart') {
        this.startGame();
      } else if (action === 'back-menu') {
        this.backToMenu();
      }
    });
  },

  backToMenu() {
    if (window.GPLab && window.GPLab.stop) window.GPLab.stop();
    this.showPause(false);
    this.showDead(false);
    this.updateMenu();
    this.show('menu');
  },

  /* ---------- Магазин ---------- */
  renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;

    grid.innerHTML = '';

    SHOP_ITEMS.forEach((item) => {
      const owned = isOwned(item.id);
      const affordable = State.coins >= item.price;

      const card = document.createElement('div');
      card.className = 'card' + (owned ? ' owned' : '');

      const icon = document.createElement('div');
      icon.className = 'card-icon';
      icon.innerHTML = '<svg class="ico"><use href="#' + item.icon + '"/></svg>';

      const name = document.createElement('div');
      name.className = 'card-name';
      name.textContent = item.name;

      const desc = document.createElement('div');
      desc.className = 'card-desc';
      desc.textContent = item.desc;

      const footer = document.createElement('div');
      footer.className = 'card-foot';

      if (owned) {
        const badge = document.createElement('div');
        badge.className = 'badge-owned';
        badge.innerHTML = '<svg class="ico"><use href="#i-check"/></svg> Куплено';
        footer.appendChild(badge);
      } else {
        const price = document.createElement('div');
        price.className = 'price';
        price.innerHTML = '<svg class="ico"><use href="#i-coin"/></svg> ' + item.price;

        const btn = document.createElement('button');
        btn.className = 'btn btn-sm' + (affordable ? ' btn-primary' : '');
        btn.dataset.buy = item.id;
        btn.disabled = !affordable;
        btn.textContent = affordable ? 'Купить' : 'Не хватает';

        footer.appendChild(price);
        footer.appendChild(btn);
      }

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(footer);
      grid.appendChild(card);
    });

    const coinsEl = document.getElementById('shopCoins');
    if (coinsEl) coinsEl.textContent = State.coins;
  },

  /* ---------- Навыки ---------- */
  renderSkills() {
    const grid = document.getElementById('skillsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    SKILLS.forEach((skill) => {
      const lvl = skillLevel(skill.id);
      const maxed = lvl >= skill.maxLevel;
      const price = skillPrice(skill);
      const affordable = State.coins >= price;

      const card = document.createElement('div');
      card.className = 'skill-card' + (maxed ? ' maxed' : '');

      const head = document.createElement('div');
      head.className = 'skill-top';

      const icon = document.createElement('div');
      icon.className = 'skill-icon';
      icon.innerHTML = '<svg class="ico"><use href="#' + skill.icon + '"/></svg>';

      const titleWrap = document.createElement('div');
      titleWrap.style.flex = '1';

      const title = document.createElement('div');
      title.className = 'skill-name';
      title.textContent = skill.name;

      const lvlBadge = document.createElement('div');
      lvlBadge.className = 'skill-lvl';
      lvlBadge.textContent = 'Уровень ' + lvl + ' / ' + skill.maxLevel;

      titleWrap.appendChild(title);
      titleWrap.appendChild(lvlBadge);

      head.appendChild(icon);
      head.appendChild(titleWrap);

      const desc = document.createElement('div');
      desc.className = 'skill-desc';
      desc.textContent = skill.desc;

      const bar = document.createElement('div');
      bar.className = 'skill-bar';
      const fill = document.createElement('div');
      fill.className = 'skill-bar-fill';
      fill.style.width = Math.round((lvl / skill.maxLevel) * 100) + '%';
      bar.appendChild(fill);

      const footer = document.createElement('div');
      footer.className = 'skill-foot';

      if (maxed) {
        const badge = document.createElement('div');
        badge.className = 'skill-max';
        badge.innerHTML = '<svg class="ico"><use href="#i-check"/></svg> Максимум';
        footer.appendChild(badge);
      } else {
        const priceEl = document.createElement('div');
        priceEl.className = 'price';
        priceEl.innerHTML = '<svg class="ico"><use href="#i-coin"/></svg> ' + price;

        const btn = document.createElement('button');
        btn.className = 'btn btn-sm' + (affordable ? ' btn-primary' : '');
        btn.dataset.upgrade = skill.id;
        btn.disabled = !affordable;
        btn.textContent = affordable ? 'Улучшить' : 'Не хватает';

        footer.appendChild(priceEl);
        footer.appendChild(btn);
      }

      card.appendChild(head);
      card.appendChild(desc);
      card.appendChild(bar);
      card.appendChild(footer);
      grid.appendChild(card);
    });

    const coinsEl = document.getElementById('skillsCoins');
    if (coinsEl) coinsEl.textContent = State.coins;
  },

  /* ---------- Меню: статистика ---------- */
  updateMenu() {
    const coins = document.getElementById('menuCoins');
    const best = document.getElementById('menuBest');
    const level = document.getElementById('menuLevel');

    if (coins) coins.textContent = State.coins;
    if (best) best.textContent = State.best;
    if (level) level.textContent = State.level;
  },

  /* ---------- HUD ---------- */
  updateHud() {
    const run = State.run;

    const score = document.getElementById('hudScore');
    const level = document.getElementById('hudLevel');
    const combo = document.getElementById('hudCombo');
    const time = document.getElementById('hudTime');

    if (score) score.textContent = Math.floor(run.score);
    if (level) level.textContent = run.level;
    if (combo) combo.textContent = 'x' + run.combo;
    if (time) time.textContent = Utils.formatTime(run.time);
  },

  updateEnergy(current, max) {
    const fill = document.getElementById('energyFill');
    if (!fill) return;
    const pct = max > 0 ? Utils.clamp((current / max) * 100, 0, 100) : 0;
    fill.style.width = pct + '%';
    fill.classList.toggle('low', pct < 25);
  },

  /* ---------- Звук ---------- */
  toggleSound() {
    State.sound = !State.sound;
    saveGame();
    this.updateSoundIcons();
  },

  updateSoundIcons() {
    const on = State.sound;

    const menuIco = document.getElementById('menuSoundIco');
    const menuText = document.getElementById('menuSoundText');
    const hudIco = document.getElementById('hudSoundIco');

    if (menuIco) menuIco.innerHTML = '<use href="#' + (on ? 'i-sound-on' : 'i-sound-off') + '"/>';
    if (menuText) menuText.textContent = 'Звук: ' + (on ? 'вкл' : 'выкл');
    if (hudIco) hudIco.innerHTML = '<use href="#' + (on ? 'i-sound-on' : 'i-sound-off') + '"/>';
  },

  /* ---------- Оверлеи ---------- */
  showPause(show) {
    const el = document.getElementById('overlayPause');
    if (el) el.classList.toggle('active', show);
  },

  showDead(show) {
    const el = document.getElementById('overlayDead');
    if (el) el.classList.toggle('active', show);
  },

  showResults(result) {
    const run = State.run;

    const score = document.getElementById('resScore');
    const level = document.getElementById('resLevel');
    const time = document.getElementById('resTime');
    const coins = document.getElementById('resCoins');
    const record = document.getElementById('newRecord');

    if (score) score.textContent = Math.floor(run.score);
    if (level) level.textContent = run.level;
    if (time) time.textContent = Utils.formatTime(run.time);
    if (coins) coins.textContent = '+' + result.earned;
    if (record) record.style.display = result.record ? 'block' : 'none';
  },

  /* ---------- Старт игры ---------- */
  startGame() {
    resetRun();
    this.showPause(false);
    this.showDead(false);
    this.show('game');

    if (window.GPLab && window.GPLab.start) {
      window.GPLab.start();
    } else {
      console.warn('GPLab не загружен — game.js не подключён');
    }
  },
};

/* ---------- Инициализация ---------- */
loadSave();

document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
