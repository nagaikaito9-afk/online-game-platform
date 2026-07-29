/**
 * Make the slime bigger - slimes_database.js
 * 全200種類スライム完全データベース
 * コモン: 80 / アンコモン: 60 / レア: 30 / エピック: 15 / レジェンド: 8 / ミシック: 4 / ゴッド: 2 / アルティメット: 1
 */

const RARITY_INFO = {
  'コモン': { color: '#4ade80', rate: 45.0, icon: '🟢', bg: 'linear-gradient(135deg, #15803d, #22c55e)' },
  'アンコモン': { color: '#38bdf8', rate: 30.0, icon: '🔵', bg: 'linear-gradient(135deg, #0369a1, #0284c7)' },
  'レア': { color: '#c084fc', rate: 15.0, icon: '🟣', bg: 'linear-gradient(135deg, #7e22ce, #a855f7)' },
  'エピック': { color: '#fbbf24', rate: 6.5, icon: '🟡', bg: 'linear-gradient(135deg, #b45309, #f59e0b)' },
  'レジェンド': { color: '#f43f5e', rate: 2.5, icon: '🔴', bg: 'linear-gradient(135deg, #be123c, #e11d48)' },
  'ミシック': { color: '#e879f9', rate: 0.8, icon: '✨', bg: 'linear-gradient(135deg, #86198f, #d946ef)' },
  'ゴッド': { color: '#ffb703', rate: 0.18, icon: '🌟', bg: 'linear-gradient(135deg, #d97706, #fbbf24)' },
  'アルティメット': { color: '#00f2fe', rate: 0.02, icon: '👑', bg: 'linear-gradient(135deg, #00f2fe, #7928ca)' }
};

const ALL_SLIMES = [];

// 1. 特殊・主要名作スライム手動定義 (20種)
const SPECIAL_SLIMES = [
  // コモン (1-5)
  { id: 1, name: 'ぷにぷにグリーンスライム', rarity: 'コモン', color: '#4ade80', atk: 10, hp: 100, desc: 'どこにでもいる元気いっぱいな緑色スライム。' },
  { id: 2, name: 'ウォータースライム', rarity: 'コモン', color: '#60a5fa', atk: 12, hp: 90, desc: '澄み切った水でできた透明感あるスライム。' },
  { id: 3, name: 'マッド泥スライム', rarity: 'コモン', color: '#a16207', atk: 14, hp: 110, desc: '湿った泥から生まれたねばねばスライム。' },
  { id: 4, name: '草むらスライム', rarity: 'コモン', color: '#16a34a', atk: 11, hp: 105, desc: '草の葉を食べて体の色を変えたスライム。' },
  { id: 5, name: 'ピーチピンクスライム', rarity: 'コモン', color: '#f472b6', atk: 13, hp: 95, desc: '甘い桃の香りが漂う可愛いスライム。' },

  // アンコモン (81-85)
  { id: 81, name: 'ファイアスライム', rarity: 'アンコモン', color: '#f97316', atk: 25, hp: 180, desc: '体内で熱を産生する灼熱のオレンジスライム。' },
  { id: 82, name: 'アイス氷結スライム', rarity: 'アンコモン', color: '#38bdf8', atk: 22, hp: 200, desc: 'ひんやり冷たい氷の結晶を持つスライム。' },
  { id: 83, name: 'サンダー電撃スライム', rarity: 'アンコモン', color: '#facc15', atk: 28, hp: 160, desc: '静電気を帯びてビリビリ放電するスライム。' },

  // レア (141-143)
  { id: 141, name: 'クリスタルダイヤモンド', rarity: 'レア', color: '#a855f7', atk: 55, hp: 450, desc: '輝く宝石の粉末を含んだ硬質なレアスライム。' },
  { id: 142, name: 'シャドウスライム', rarity: 'レア', color: '#334155', atk: 60, hp: 400, desc: '影の中に潜み闇の波動を放つスライム。' },

  // エピック (171-172)
  { id: 171, name: 'ヴォルケーノ爆炎スライム', rarity: 'エピック', color: '#ea580c', atk: 120, hp: 900, desc: 'マグマのエネルギーを秘めた噴火スライム。' },

  // レジェンド (186-187)
  { id: 186, name: 'ドラゴンキングスライム', rarity: 'レジェンド', color: '#e11d48', atk: 260, hp: 1800, desc: '竜の翼とオーラを持つ幻のレジェンドスライム。' },

  // ミシック (194)
  { id: 194, name: 'コズミック銀河スライム', rarity: 'ミシック', color: '#d946ef', atk: 500, hp: 3500, desc: '体内に星空と銀河を抱く神聖なミシックスライム。' },

  // ゴッド (198-199)
  { id: 198, name: 'ゼウス全能の神スライム', rarity: 'ゴッド', color: '#fbbf24', atk: 1200, hp: 8000, desc: '雷光と神の加護を司る究極のゴッドスライム。' },

  // アルティメット (200)
  { id: 200, name: '👑 アルティメット・オメガ・スライム', rarity: 'アルティメット', color: '#00f2fe', atk: 3500, hp: 25000, desc: '全宇宙の万物を超越した伝説の真・究極体スライム。' }
];

// 残りの全200種を厳密な枚数内訳で補填作成
// コモン: 80 (ID 1 - 80)
// アンコモン: 60 (ID 81 - 140)
// レア: 30 (ID 141 - 170)
// エピック: 15 (ID 171 - 185)
// レジェンド: 8 (ID 186 - 193)
// ミシック: 4 (ID 194 - 197)
// ゴッド: 2 (ID 198 - 199)
// アルティメット: 1 (ID 200)

const specialMap = {};
SPECIAL_SLIMES.forEach(s => specialMap[s.id] = s);

for (let id = 1; id <= 200; id++) {
  if (specialMap[id]) {
    ALL_SLIMES.push(specialMap[id]);
  } else {
    let rarity = 'コモン';
    let color = '#4ade80';
    let baseAtk = 10 + id * 2;
    let baseHp = 100 + id * 15;

    if (id <= 80) {
      rarity = 'コモン';
      color = `hsl(${(id * 13) % 360}, 70%, 55%)`;
    } else if (id <= 140) {
      rarity = 'アンコモン';
      color = `hsl(${(id * 17) % 360}, 80%, 50%)`;
      baseAtk += 20; baseHp += 100;
    } else if (id <= 170) {
      rarity = 'レア';
      color = `hsl(${(id * 23) % 360}, 90%, 60%)`;
      baseAtk += 50; baseHp += 300;
    } else if (id <= 185) {
      rarity = 'エピック';
      color = `hsl(${(id * 29) % 360}, 95%, 65%)`;
      baseAtk += 120; baseHp += 700;
    } else if (id <= 193) {
      rarity = 'レジェンド';
      color = `hsl(${(id * 31) % 360}, 100%, 50%)`;
      baseAtk += 250; baseHp += 1500;
    } else if (id <= 197) {
      rarity = 'ミシック';
      color = `hsl(${(id * 37) % 360}, 100%, 65%)`;
      baseAtk += 500; baseHp += 3500;
    } else if (id <= 199) {
      rarity = 'ゴッド';
      color = '#fbbf24';
      baseAtk += 1000; baseHp += 8000;
    }

    ALL_SLIMES.push({
      id: id,
      name: `${rarity}スライム #${id}`,
      rarity: rarity,
      color: color,
      atk: baseAtk,
      hp: baseHp,
      desc: `全200種図鑑 No.${id} の${rarity}スライム。強大なパワーを秘めている。`
    });
  }
}

window.ALL_SLIMES = ALL_SLIMES;
window.RARITY_INFO = RARITY_INFO;
