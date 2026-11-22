const SAVE_KEY = 'gplab_save_v2';

const defaultState = {
  coins: 0,
  best: 0,
  runs: 0,
  owned: [],
  skills: {},
  sound: true
};

let State = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (e) {
    return { ...defaultState };
  }
}

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(State));
  } catch (e) {}
}

function resetState() {
  State = { ...defaultState };
  saveState();
}

function getCoins() {
  return State.coins;
}

function addCoins(n) {
  State.coins += n;
  saveState();
}

function spendCoins(n) {
  if (State.coins < n) return false;
  State.coins -= n;
  saveState();
  return true;
}

function getBest() {
  return State.best;
}

function submitScore(score) {
  State.runs += 1;
  if (score > State.best) {
    State.best = score;
    saveState();
    return true;
  }
  saveState();
  return false;
}

function isOwned(id) {
  return State.owned.includes(id);
}

function buyItem(id) {
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item) return { ok: false, reason: 'Нет такого товара' };
  if (isOwned(id)) return { ok: false, reason: 'Уже куплено' };
  if (State.coins < item.price) return { ok: false, reason: 'Не хватает монет' };
  State.coins -= item.price;
  State.owned.push(id);
  saveState();
  return { ok: true, item };
}

function getSkillLevel(id) {
  return State.skills[id] || 0;
}

function getSkillCost(id) {
  const skill = SKILLS.find(s => s.id === id);
  if (!skill) return Infinity;
  const lvl = getSkillLevel(id);
  if (lvl >= skill.maxLevel) return Infinity;
  return Math.round(skill.baseCost * Math.pow(1.6, lvl));
}

function upgradeSkill(id) {
  const skill = SKILLS.find(s => s.id === id);
  if (!skill) return { ok: false, reason: 'Нет такого навыка' };
  const lvl = getSkillLevel(id);
  if (lvl >= skill.maxLevel) return { ok: false, reason: 'Максимальный уровень' };
  const cost = getSkillCost(id);
  if (State.coins < cost) return { ok: false, reason: 'Не хватает монет' };
  State.coins -= cost;
  State.skills[id] = lvl + 1;
  saveState();
  return { ok: true, skill, level: lvl + 1 };
}

function skillBonus(id) {
  const skill = SKILLS.find(s => s.id === id);
  if (!skill) return 0;
  return getSkillLevel(id) * skill.perLevel;
}

function toggleSound() {
  State.sound = !State.sound;
  saveState();
  return State.sound;
}
