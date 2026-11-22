/* ============================================================
   config.js — все константы, данные магазина и навыков
   ============================================================ */

const CONFIG = {
  // Игровое поле
  playerRadius: 14,
  playerSpeed: 320,
  playerAccel: 3200,
  playerFriction: 0.86,

  // Энергия
  energyMax: 100,
  energyRegen: 8,
  energyRegenMoving: 4,
  dashCost: 45,
  dashCooldown: 0.45,
  dashSpeed: 980,
  dashDuration: 0.16,
  moveDrain: 3.5,

  // Враги — общие
  enemyBaseSpeed: 110,
  enemySpeedPerLevel: 14,
  enemySpawnBase: 1.1,
  enemySpawnMin: 0.28,
  enemyRadius: 15,

  // Враги — типы
  // behavior: 'chase' — идёт за игроком, 'straight' — летит по прямой
  enemyTypes: {
    chaser: {
      behavior: 'chase',
      radius: [11, 18],
      speedMul: 1.0,
      hp: 1,
      color: '#ff4d6d',
      score: 0,
      unlockLevel: 1,
      weight: 45,
    },
    tank: {
      behavior: 'chase',
      radius: [22, 28],
      speedMul: 0.45,
      hp: 3,
      color: '#ff9f43',
      score: 0,
      unlockLevel: 3,
      weight: 18,
    },
    shooter: {
      behavior: 'chase',
      radius: [13, 17],
      speedMul: 0.7,
      hp: 2,
      color: '#c56cf0',
      score: 0,
      unlockLevel: 5,
      weight: 14,
      keepDistance: 220,
      shootInterval: 2.2,
      bulletSpeed: 260,
    },
    splitter: {
      behavior: 'chase',
      radius: [16, 20],
      speedMul: 0.85,
      hp: 1,
      color: '#ffdd59',
      score: 0,
      unlockLevel: 7,
      weight: 10,
      splitCount: 2,
    },
    // Прямолинейные: дух — медленный, полупрозрачный, плавно качается
    spirit: {
      behavior: 'straight',
      radius: [12, 18],
      speedMul: 0.55,
      hp: 1,
      color: '#7fd8ff',
      score: 0,
      unlockLevel: 2,
      weight: 22,
      wobble: 0.35,
    },
    // Прямолинейные: шип — быстрый, острый, вращается
    spike: {
      behavior: 'straight',
      radius: [9, 13],
      speedMul: 1.6,
      hp: 1,
      color: '#ff6b9d',
      score: 0,
      unlockLevel: 4,
      weight: 20,
      spin: 9,
    },
  },

  // Снаряды врагов
  bulletRadius: 6,
  bulletLife: 4,

  // Частицы (бонусы)
  particleRadius: 9,
  particleSpawnBase: 0.85,
  particleSpawnMin: 0.3,
  particleValue: 10,

  // Уровни
  levelDuration: 15,
  maxLevel: 30,

  // Комбо
  comboWindow: 2.4,
  comboMax: 9,

  // Прочее
  invulnTime: 1.2,
  coinsPerScore: 0.1,
};

/* ---------- Магазин ---------- */
const SHOP_ITEMS = [
  {
    id: 'speed',
    name: 'Ускорение',
    desc: 'Пассивно +8% к скорости движения. Покупается один раз.',
    price: 120,
    icon: 'i-speed',
    once: true,
  },
  {
    id: 'shield',
    name: 'Щит',
    desc: 'Один бесплатный удар в начале каждой игры. Покупается один раз.',
    price: 200,
    icon: 'i-shield',
    once: true,
  },
  {
    id: 'magnet',
    name: 'Магнит',
    desc: 'Частицы притягиваются к тебе в радиусе 90px. Покупается один раз.',
    price: 260,
    icon: 'i-magnet',
    once: true,
  },
  {
    id: 'life',
    name: 'Доп. жизнь',
    desc: 'Второй шанс: после смерти один раз можно продолжить. Покупается один раз.',
    price: 400,
    icon: 'i-heart',
    once: true,
  },
  {
    id: 'startCoins',
    name: 'Стартовый бонус',
    desc: 'Начинать каждую игру с +50 очками. Покупается один раз.',
    price: 300,
    icon: 'i-coin',
    once: true,
  },
  {
    id: 'pierce',
    name: 'Пробитие',
    desc: 'Рывок сбивает врагов на пути. Покупается один раз.',
    price: 520,
    icon: 'i-dash',
    once: true,
  },
];

/* ---------- Навыки (прокачиваемые) ---------- */
const SKILLS = [
  {
    id: 'dash',
    name: 'Рывок',
    desc: 'Снижает откат рывка на 8% за уровень.',
    icon: 'i-dash',
    maxLevel: 5,
    basePrice: 80,
    priceStep: 60,
  },
  {
    id: 'combo',
    name: 'Комбо',
    desc: 'Продлевает окно комбо на 0.25с за уровень.',
    icon: 'i-combo',
    maxLevel: 5,
    basePrice: 90,
    priceStep: 70,
  },
  {
    id: 'energy',
    name: 'Энергия',
    desc: 'Увеличивает максимум энергии на 15 за уровень.',
    icon: 'i-bolt',
    maxLevel: 5,
    basePrice: 100,
    priceStep: 80,
  },
  {
    id: 'regen',
    name: 'Регенерация',
    desc: 'Ускоряет восстановление энергии на 12% за уровень.',
    icon: 'i-regen',
    maxLevel: 5,
    basePrice: 110,
    priceStep: 90,
  },
  {
    id: 'magnet',
    name: 'Притяжение',
    desc: 'Увеличивает радиус сбора частиц на 20px за уровень.',
    icon: 'i-magnet',
    maxLevel: 5,
    basePrice: 120,
    priceStep: 100,
  },
  {
    id: 'score',
    name: 'Доход',
    desc: 'Повышает очки за частицу на 2 за уровень.',
    icon: 'i-star',
    maxLevel: 5,
    basePrice: 130,
    priceStep: 110,
  },
];

/* ---------- Утилиты ---------- */
const Utils = {
  clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  rand(min, max) {
    return min + Math.random() * (max - min);
  },

  randInt(min, max) {
    return Math.floor(Utils.rand(min, max + 1));
  },

  dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  },

  // Выбор типа врага по весам с учётом открытых уровней
  pickEnemyType(level) {
    const types = CONFIG.enemyTypes;
    const pool = [];

    Object.keys(types).forEach((key) => {
      const t = types[key];
      if (level >= t.unlockLevel) {
        for (let i = 0; i < t.weight; i++) pool.push(key);
      }
    });

    if (pool.length === 0) return 'chaser';
    return pool[Math.floor(Math.random() * pool.length)];
  },
};
